import supabase from '../supabase.js';
import asyncHandler from 'express-async-handler';

// ─── MARK OVERDUE TICKETS ─────────────────────────────────────────────────────
// Runs automatically before every dashboard fetch; also exported for cron use
const markOverdueTickets = asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('tickets')
    .update({ status: 'overdue' })
    .eq('status', 'assigned')
    .lt('deadline', new Date().toISOString());

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  res.status(200).json({ message: 'Overdue tickets updated.' });
});

// ─── GET ALL TICKETS (dashboard) ─────────────────────────────────────────────
// GET /api/fm/tickets?status=&area=&category=&sort=

const getTickets = asyncHandler(async (req, res) => {
  const { status, area, category, sort } = req.query;

  // mark any assigned tickets past their deadline as overdue before fetching
  await supabase
    .from('tickets')
    .update({ status: 'overdue' })
    .eq('status', 'assigned')
    .lt('deadline', new Date().toISOString());

  let query = supabase
    .from('tickets')
    .select(`
      id,
      category,
      area,
      floor,
      specific_location,
      description,
      image_url,
      status,
      created_at,
      updated_at,
      completed_at,
      created_by,
      assignments (
        id,
        worker_id,
        worker_name,
        deadline,
        proof_url,
        feedback,
        worker_note,
        status,
        fm_id,
        attempt_number
      )
    `);

  if (status) query = query.eq('status', status);
  if (area) query = query.eq('area', area);
  if (category) query = query.eq('category', category);

  if (sort !== 'popular') {
    query = query.order('created_at', { ascending: sort === 'oldest' });
  }

  const { data, error } = await query;

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  if (sort === 'popular') {
    const popularityMap = {};
    data.forEach(ticket => {
      const key = `${ticket.category}__${ticket.area}`;
      popularityMap[key] = (popularityMap[key] || 0) + 1;
    });
    data.sort((a, b) => {
      const keyA = `${a.category}__${a.area}`;
      const keyB = `${b.category}__${b.area}`;
      return popularityMap[keyB] - popularityMap[keyA];
    });
  }

  res.status(200).json(data);
});

// ─── GET SINGLE TICKET (feedback popup) ──────────────────────────────────────
// GET /api/fm/tickets/:id

const getTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      id,
      category,
      area,
      floor,
      specific_location,
      description,
      image_url,
      status,
      created_at,
      completed_at,
      created_by,
      reporter:users!tickets_created_by_fkey (
        id,
        full_name,
        email
      ),
      assignments (
        id,
        worker_id,
        worker_name,
        deadline,
        proof_url,
        feedback,
        worker_note,
        status,
        fm_id
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    res.status(404);
    throw new Error('Ticket not found.');
  }

  res.status(200).json(data);
});

// ─── GET ALL ASSIGNMENTS FOR A TICKET (reassignment history) ──────────────────
// GET /api/fm/tickets/:id/assignments

const getTicketAssignments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('ticket_id', id)
    .order('attempt_number', { ascending: true });

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  res.status(200).json(data || []);
});

// ─── GET ALL WORKERS ──────────────────────────────────────────────────────────
// GET /api/fm/workers?specialty=

const getWorkers = asyncHandler(async (req, res) => {
  const { specialty } = req.query;

  let query = supabase
    .from('users')
    .select('id, full_name, specialty, email, years_experience')
    .eq('role', 'worker')
    .eq('is_active', true);

  if (specialty) query = query.eq('specialty', specialty);

  const { data, error } = await query;

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  res.status(200).json(data);
});

// ─── ASSIGN TICKET ────────────────────────────────────────────────────────────
// PATCH /api/fm/tickets/:id/assign

const assignTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { worker_id, deadline, priority } = req.body;

  if (!worker_id || !deadline) {
    res.status(400);
    throw new Error('Worker and deadline are required.');
  }

  // confirm ticket exists and is pending
  const { data: ticket, error: fetchError } = await supabase
    .from('tickets')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchError || !ticket) {
    res.status(404);
    throw new Error('Ticket not found.');
  }

  const allowedStatuses = ['pending', 'reassigned', 'overdue'];
  if (!allowedStatuses.includes(ticket.status)) {
    res.status(400);
    throw new Error('Ticket cannot be assigned in its current status.');
  }

  // confirm worker exists
  const { data: worker, error: workerError } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', worker_id)
    .eq('role', 'worker')
    .single();

  if (workerError || !worker) {
    res.status(404);
    throw new Error('Worker not found.');
  }

  // Always read attempt_number from the DB — it's the source of truth
  const { data: lastAttempt } = await supabase
    .from('assignments')
    .select('attempt_number')
    .eq('ticket_id', id)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .single();

  const latestAttemptNumber = lastAttempt?.attempt_number || 0;
  const newStatus = latestAttemptNumber >= 1 ? 'reassigned' : 'assigned';

  if (ticket.status === 'reassigned') {
    // submitFeedback already created a pending shell — find and fill it
    const { data: shell, error: shellError } = await supabase
      .from('assignments')
      .select('id')
      .eq('ticket_id', id)
      .eq('status', 'pending')
      .order('attempt_number', { ascending: false })
      .limit(1)
      .single();

    if (shellError || !shell) {
      res.status(500);
      throw new Error('Could not find the pending reassignment slot.');
    }

    const { error: updateErr } = await supabase
      .from('assignments')
      .update({
        worker_id,
        worker_name: worker.full_name,
        deadline,
        fm_id: req.user.id,
        status: newStatus,
        priority: priority || 'medium',
      })
      .eq('id', shell.id);

    if (updateErr) {
      res.status(500);
      throw new Error(updateErr.message);
    }
  } else {
    // pending or overdue — insert a new row
    if (ticket.status === 'overdue') {
      // mark the stale assignment as reassigned explicitly
      await supabase
        .from('assignments')
        .update({ status: 'reassigned' })
        .eq('ticket_id', id)
        .eq('status', 'assigned');
    }

    const { error: assignError } = await supabase
      .from('assignments')
      .insert({
        ticket_id: id,
        worker_id,
        worker_name: worker.full_name,
        deadline,
        fm_id: req.user.id,
        status: newStatus,
        priority: priority || 'medium',
        attempt_number: latestAttemptNumber + 1,
      });

    if (assignError) {
      res.status(500);
      throw new Error(assignError.message);
    }
  }

  const newTicketStatus = newStatus;

  // sync tickets.status
  const { data: updated, error: ticketUpdateError } = await supabase
    .from('tickets')
    .update({ status: newTicketStatus })
    .eq('id', id)
    .select()
    .single();

  if (ticketUpdateError) {
    res.status(500);
    throw new Error(ticketUpdateError.message);
  }

  // log status change
  const { error: logError } = await supabase
    .from('ticket_status_log')
    .insert({
      ticket_id: id,
      changed_by: req.user.id,
      old_status: ticket.status,
      new_status: newTicketStatus,
    });

  if (logError) console.error('Status log insert failed:', logError.message);

  // notify worker
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      id: worker_id,
      message: `You have been assigned a new task. Deadline: ${deadline}.`,
      is_read: false,
    });

  if (notifError) console.error('Worker notification failed:', notifError.message);

  res.status(200).json({
    message: `Ticket assigned to ${worker.full_name}.`,
    ticket: updated,
  });
});

// ─── SUBMIT FEEDBACK (accept or reject) ───────────────────────────────────────
// PATCH /api/fm/tickets/:id/feedback

const submitFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, feedback_text, new_deadline, new_priority } = req.body;

  if (!action || !['accept', 'reject'].includes(action)) {
    res.status(400);
    throw new Error('Action must be "accept" or "reject".');
  }

  if (action === 'reject' && !feedback_text?.trim()) {
    res.status(400);
    throw new Error('Feedback reason is required when rejecting.');
  }

  if (feedback_text && feedback_text.trim().split(/\s+/).length > 50) {
    res.status(400);
    throw new Error('Feedback must be 50 words or fewer.');
  }

  if (action === 'reject' && !new_deadline) {
    res.status(400);
    throw new Error('A new deadline is required when rejecting.');
  }

  // fetch ticket and its assignment
  const { data: ticket, error: fetchError } = await supabase
    .from('tickets')
    .select(`
      id,
      status,
      assignments (
        id,
        worker_id
      )
    `)
    .eq('id', id)
    .single();

  if (fetchError || !ticket) {
    res.status(404);
    throw new Error('Ticket not found.');
  }

  if (ticket.status !== 'in_progress') {
    res.status(400);
    throw new Error('Feedback can only be submitted on in-progress tickets.');
  }

  const assignment = ticket.assignments?.[0];
  if (!assignment) {
    res.status(400);
    throw new Error('No assignment found for this ticket.');
  }

  const newStatus = action === 'accept' ? 'completed' : 'reassigned';
  const oldStatus = ticket.status;

  // update assignment row
  const assignmentUpdate = {
    status: newStatus,
    feedback: feedback_text?.trim() || null,
  };

  // if (action === 'reject') {
  //   assignmentUpdate.deadline = new_deadline;
  //   assignmentUpdate.proof_url = null;
  // }
  if (action === 'reject') {
    // mark current assignment as reassigned but keep all its data intact
    await supabase
      .from('assignments')
      .update({
        status: 'reassigned',
        feedback: feedback_text?.trim() || null,
      })
      .eq('id', assignment.id);

    // get current attempt number
    const { data: attempts } = await supabase
      .from('assignments')
      .select('attempt_number')
      .eq('ticket_id', id)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .single();

    const nextAttempt = (attempts?.attempt_number || 1) + 1;

    // insert new assignment row ready for FM to assign a new worker
    await supabase
      .from('assignments')
      .insert({
        ticket_id: id,
        fm_id: req.user.id,
        status: 'pending',
        attempt_number: nextAttempt,
        deadline: new_deadline || null,
        priority: new_priority || 'medium',
      });
  }

  const { error: assignUpdateError } = await supabase
    .from('assignments')
    .update(assignmentUpdate)
    .eq('id', assignment.id);

  if (assignUpdateError) {
    res.status(500);
    throw new Error(assignUpdateError.message);
  }

  // sync tickets.status
  const ticketUpdate = { status: newStatus };
  if (action === 'accept') ticketUpdate.completed_at = new Date().toISOString();

  const { data: updatedTicket, error: ticketUpdateError } = await supabase
    .from('tickets')
    .update(ticketUpdate)
    .eq('id', id)
    .select()
    .single();

  if (ticketUpdateError) {
    res.status(500);
    throw new Error(ticketUpdateError.message);
  }

  // log status change
  const { error: logError } = await supabase
    .from('ticket_status_log')
    .insert({
      ticket_id: id,
      changed_by: req.user.id,
      old_status: oldStatus,
      new_status: newStatus,
    });

  if (logError) console.error('Status log insert failed:', logError.message);

  // notify worker
  const workerMessage = action === 'accept'
    ? 'Your submitted work has been accepted. The ticket is now marked as completed.'
    : `Your submitted work was rejected. Reason: ${feedback_text?.trim()}. New deadline: ${new_deadline}.`;

  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      id: assignment.worker_id,
      message: workerMessage,
      is_read: false,
    });

  if (notifError) console.error('Worker notification failed:', notifError.message);

  // notify CM (ticket creator)
  const { data: ticketCreator } = await supabase
    .from('tickets')
    .select('created_by')
    .eq('id', id)
    .single();

  if (ticketCreator?.created_by) {
    const cmMessage = action === 'accept'
      ? 'Your reported issue has been resolved and marked as completed.'
      : 'The work on your reported issue did not meet standards and has been reassigned.';

    const { error: cmNotifError } = await supabase
      .from('notifications')
      .insert({
        id: ticketCreator.created_by,
        message: cmMessage,
        is_read: false,
      });

    if (cmNotifError) console.error('CM notification failed:', cmNotifError.message);

    // award points to ticket creator on accept
    if (action === 'accept') {
      const { data: config } = await supabase
        .from('points_config')
        .select('points_per_ticket')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const pointsToAward = config?.points_per_ticket || 10;

      const { error: pointsError } = await supabase.rpc('increment_points', {
        user_id: ticketCreator.created_by,
        amount: pointsToAward,
      });

      if (pointsError) console.error('Points award failed:', pointsError.message);
    }
  }

  res.status(200).json({
    message: action === 'accept' ? 'Ticket marked as completed.' : 'Ticket reassigned.',
    ticket: updatedTicket,
  });
});

// ─── GET FM SETTINGS ──────────────────────────────────────────────────────────
// GET /api/fm/settings

const getSettings = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('id', req.user.id)
    .single();

  if (error || !data) {
    res.status(404);
    throw new Error('User not found.');
  }

  res.status(200).json(data);
});

const verifyPassword = asyncHandler(async (req, res) => {
  const { old_password } = req.body;
  if (!old_password) {
    res.status(400);
    throw new Error('Password required.');
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', req.user.id)
    .single();

  if (userError || !userData) {
    res.status(404);
    throw new Error('User not found.');
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password: old_password,
  });

  if (error) {
    res.status(401);
    throw new Error('Incorrect password.');
  }

  res.status(200).json({ valid: true });
});

const changePassword = asyncHandler(async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters.');
  }

  const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
    password: new_password,
  });

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  res.status(200).json({ message: 'Password updated successfully.' });
});

export {
  getTickets,
  getTicketById,
  getTicketAssignments,
  getWorkers,
  assignTicket,
  submitFeedback,
  getSettings,
  verifyPassword,
  changePassword,
  markOverdueTickets,
};