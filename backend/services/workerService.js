import supabase from '../supabase.js';
import sendPush from '../utils/pushNotification.js';

// ─── TICKETS ──────────────────────────────────────────────────────────────────

export async function fetchMyTickets(workerId, status, sort) {
  // Step 1 — fetch assignments (avoid nested select which requires a named FK)
  let assignQuery = supabase
    .from('assignments')
    .select('id, ticket_id, deadline, status, priority, proof_url, feedback, worker_note, work_started')
    .eq('worker_id', workerId);

  if (status) assignQuery = assignQuery.eq('status', status);
  assignQuery = sort === 'deadline_desc'
    ? assignQuery.order('deadline', { ascending: false })
    : assignQuery.order('deadline', { ascending: true });

  const { data: assignments, error: assignErr } = await assignQuery;
  if (assignErr) {
    console.error('[fetchMyTickets] assignments error:', assignErr.message);
    throw new Error(assignErr.message);
  }
  if (!assignments || assignments.length === 0) return [];

  // Step 2 — fetch the linked tickets in one query
  const ticketIds = assignments.map(a => a.ticket_id).filter(Boolean);
  const { data: tickets, error: ticketErr } = await supabase
    .from('tickets')
    .select('id, category, area, floor, specific_location, description, image_url, status, created_at')
    .in('id', ticketIds);

  if (ticketErr) {
    console.error('[fetchMyTickets] tickets error:', ticketErr.message);
    throw new Error(ticketErr.message);
  }

  // Step 3 — merge: keep the same shape the frontend expects (assignment.tickets)
  const ticketMap = {};
  (tickets || []).forEach(t => { ticketMap[t.id] = t; });

  return assignments.map(a => ({ ...a, tickets: ticketMap[a.ticket_id] || null }));
}

export async function startTicketWork(assignmentId, workerId) {
  const { data: assign, error: fetchErr } = await supabase
    .from('assignments')
    .select('id, status, fm_id, ticket_id, worker_name')
    .eq('id', assignmentId)
    .eq('worker_id', workerId)
    .single();

  if (fetchErr || !assign) {
    const e = new Error('Assignment not found.'); e.statusCode = 404; throw e;
  }
  if (assign.status !== 'assigned') {
    const e = new Error('Only assigned tickets can be started.'); e.statusCode = 400; throw e;
  }

  await supabase
    .from('assignments')
    .update({ work_started: true })
    .eq('id', assignmentId);

  // Notify FM in-app
  await supabase.from('notifications').insert({
    user_id: assign.fm_id,
    ticket_id: assign.ticket_id,
    message: `${assign.worker_name || 'A worker'} has started work on ticket ${assign.ticket_id}.`,
    is_read: false,
  });

  // Push notification to FM
  const { data: fmData } = await supabase
    .from('users')
    .select('expo_push_token')
    .eq('id', assign.fm_id)
    .single();

  await sendPush(
    fmData?.expo_push_token,
    'Work Started',
    `${assign.worker_name || 'A worker'} has started work on an assigned ticket.`,
  );
}

export async function fetchAssignmentDetails(ticketId, workerId) {
  const { data: assignment, error: assignErr } = await supabase
    .from('assignments')
    .select('id, status, priority, deadline, proof_url, feedback, worker_note, ticket_id')
    .eq('ticket_id', ticketId)
    .eq('worker_id', workerId)
    .single();

  if (assignErr || !assignment) {
    const e = new Error('Assignment not found.'); e.statusCode = 404; throw e;
  }

  const { data: ticket, error: ticketErr } = await supabase
    .from('tickets')
    .select('id, category, area, building, floor, specific_location, description, image_url, status, created_at')
    .eq('id', assignment.ticket_id)
    .single();

  if (ticketErr) {
    console.error('[fetchAssignmentDetails] ticket error:', ticketErr.message);
    throw new Error(ticketErr.message);
  }

  return { ...assignment, tickets: ticket || null };
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

// --- PROFILE ---
export async function fetchWorkerProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, specialty, years_experience, theme, workerpfp_url')
    .eq('id', userId)
    .single();

  if (error || !data) {
    const e = new Error('User not found.'); e.statusCode = 404; throw e;
  }

  if (data.workerpfp_url) {
    // Already a signed URL → return as-is
    if (data.workerpfp_url.includes('/object/sign/')) {
      // valid, no change needed
    } else {
      // Legacy public URL or plain path → re-sign
      const filePath = data.workerpfp_url.includes('/worker-pfp/')
        ? data.workerpfp_url.match(/worker-pfp\/(.+?)(\?|$)/)?.[1] ?? null
        : data.workerpfp_url.startsWith('http') ? null : data.workerpfp_url;

      if (filePath) {
        const { data: signedData, error: signErr } = await supabase.storage
          .from('worker-pfp')
          .createSignedUrl(filePath, 31536000);
        data.workerpfp_url = (!signErr && signedData?.signedUrl) ? signedData.signedUrl : null;
      } else {
        data.workerpfp_url = null;
      }
    }
  }

  return data;
}

export async function uploadWorkerProfilePicture(userId, buffer, mimeType) {
  const ext = (mimeType.split('/')[1] || 'jpg').split(';')[0].trim();
  const filePath = `${userId}/profile.${ext}`;

  // buffer is already a Buffer — converted by the controller before calling here
  const { error: uploadError } = await supabase.storage
    .from('worker-pfp')
    .upload(filePath, buffer, { contentType: mimeType, upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  // Store a long-lived signed URL (1 year) in the DB
  const { data: signedData, error: signErr } = await supabase.storage
    .from('worker-pfp')
    .createSignedUrl(filePath, 31536000);
  if (signErr) throw new Error(signErr.message);

  const { error: updateError } = await supabase
    .from('users')
    .update({ workerpfp_url: signedData.signedUrl })
    .eq('id', userId);
  if (updateError) throw new Error(updateError.message);

  return signedData.signedUrl;
}

export async function removeWorkerProfilePicture(userId) {
  const { error } = await supabase
    .from('users')
    .update({ workerpfp_url: null })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

// ─── PROOF SUBMISSION ────────────────────────────────────────────────────────
// Uploads to 'proof-image' bucket and saves public URL to assignments.proof_url

export async function submitWorkProof(userId, ticketId, buffer, mimeType, workerNote) {
  const { data: assignment, error: fetchError } = await supabase
    .from('assignments')
    .select('id, status, fm_id, ticket_id, worker_name, attempt_number')
    .eq('ticket_id', ticketId)
    .eq('worker_id', userId)
    .in('status', ['assigned', 'reassigned'])
    .order('attempt_number', { ascending: false })
    .limit(1)
    .single();

  console.log('[submitWorkProof] assignment:', assignment, 'fetchError:', fetchError?.message);

  if (fetchError || !assignment) {
    const e = new Error('No active assignment found for this ticket.');
    e.statusCode = 404;
    throw e;
  }

  const ext = (mimeType.split('/')[1] || 'jpg').split(';')[0].trim();
  const fileName = `${userId}/${assignment.id}/proof_${assignment.attempt_number}.${ext}`;
  console.log('[submitWorkProof] uploading to:', fileName);

  const { error: uploadError } = await supabase.storage
    .from('proof-image')
    .upload(fileName, buffer, { contentType: mimeType, upsert: true });
  if (uploadError) { console.error('[submitWorkProof] uploadError:', uploadError.message); throw new Error(uploadError.message); }

  // Create a long-lived signed URL (1 year)
  const { data: proofSigned, error: proofSignErr } = await supabase.storage
    .from('proof-image')
    .createSignedUrl(fileName, 31536000);
  if (proofSignErr) { console.error('[submitWorkProof] proofSignErr:', proofSignErr.message); throw new Error(proofSignErr.message); }

  // Update assignment: set proof_url, worker_note, and status → in_progress
  const { error: updateError } = await supabase
    .from('assignments')
    .update({
      proof_url: proofSigned.signedUrl,
      worker_note: workerNote || null,
      status: 'in_progress',
    })
    .eq('id', assignment.id);
  if (updateError) { console.error('[submitWorkProof] updateError:', updateError.message); throw new Error(updateError.message); }

  // Update ticket status → in_progress
  await supabase
    .from('tickets')
    .update({ status: 'in_progress' })
    .eq('id', assignment.ticket_id);

  // Log the ticket status change
  await supabase.from('ticket_status_log').insert({
    ticket_id: assignment.ticket_id,
    changed_by: userId,
    old_status: assignment.status,
    new_status: 'in_progress',
  });

  // Notify FM in-app
  await supabase.from('notifications').insert({
    user_id: assignment.fm_id,
    ticket_id: assignment.ticket_id,
    message: `${assignment.worker_name || 'A worker'} has submitted proof of work for ticket ${assignment.ticket_id}. Please review.`,
    is_read: false,
  });

  // Push notification to FM
  const { data: fmData } = await supabase
    .from('users')
    .select('expo_push_token')
    .eq('id', assignment.fm_id)
    .single();

  await sendPush(
    fmData?.expo_push_token,
    'Proof Submitted',
    'A worker submitted proof of completion. Tap to review.',
  );

  return proofSigned.signedUrl;
}

// ─── PUSH TOKEN ───────────────────────────────────────────────────────────────

export async function saveWorkerPushToken(userId, pushToken) {
  const { error } = await supabase
    .from('users')
    .update({ expo_push_token: pushToken })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

// ─── PASSWORD ────────────────────────────────────────────────────────────────

export async function verifyWorkerPassword(userId, oldPassword) {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();
  if (userError || !userData) {
    const e = new Error('User not found.'); e.statusCode = 404; throw e;
  }

  // Use raw fetch — no SDK client involved, no session state can be mutated
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ email: userData.email, password: oldPassword }),
  });
  if (!res.ok) {
    const e = new Error('Incorrect password.'); e.statusCode = 401; throw e;
  }
}

export async function updateWorkerPassword(userId, newPassword) {
  const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) throw new Error(error.message);
}
