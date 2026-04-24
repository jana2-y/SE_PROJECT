import supabase from '../supabase.js';
import asyncHandler from 'express-async-handler';

// ─── GET ALL TICKETS (dashboard) ─────────────────────────────────────────────
// GET /api/fm/tickets?status=&area=&category=&sort=

const getTickets = asyncHandler(async (req, res) => {
  const { status, area, category, sort } = req.query;

  let query = supabase
    .from('tickets')
    .select(`
      id,
      category,
      area,
      building,
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
        status,
        fm_id
      )
    `);

  if (status) query = query.eq('status', status);
  if (area) query = query.eq('area', area);
  if (category) query = query.eq('category', category);

  if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else if (sort === 'popular') {
    query = query.order('category', { ascending: true }).order('area', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  console.log('data:', JSON.stringify(data, null, 2));
  console.log('error:', error);

  if (error) {
    res.status(500);
    throw new Error(error.message);
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
      building,
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

  if (ticket.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending tickets can be assigned.');
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

  // create assignment row
  const { error: assignError } = await supabase
    .from('assignments')
    .insert({
      ticket_id: id,
      worker_id,
      worker_name: worker.full_name,
      deadline,
      fm_id: req.user.id,
      status: 'assigned',
      priority: priority || 'medium',
    });

  if (assignError) {
    res.status(500);
    throw new Error(assignError.message);
  }

  // sync tickets.status
  const { data: updated, error: ticketUpdateError } = await supabase
    .from('tickets')
    .update({ status: 'assigned' })
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
      old_status: 'pending',
      new_status: 'assigned',
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
  const { action, feedback_text, new_deadline } = req.body;

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

  if (action === 'reject') {
    assignmentUpdate.deadline = new_deadline;
    assignmentUpdate.proof_url = null;
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
    .select('id, full_name, email, theme')
    .eq('id', req.user.id)
    .single();

  if (error || !data) {
    res.status(404);
    throw new Error('User not found.');
  }

  res.status(200).json(data);
});

export {
  getTickets,
  getTicketById,
  getWorkers,
  assignTicket,
  submitFeedback,
  getSettings,
};