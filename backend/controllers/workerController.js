import asyncHandler from 'express-async-handler';
import * as workerService from '../services/workerService.js';

// GET /api/worker/tickets?status=&sort=
const getMyTickets = asyncHandler(async (req, res) => {
  const data = await workerService.fetchMyTickets(req.user.id, req.query.status, req.query.sort);
  res.status(200).json(data);
});

// PATCH /api/worker/tickets/:assignmentId/start
const startTicket = asyncHandler(async (req, res) => {
  await workerService.startTicketWork(req.params.assignmentId, req.user.id);
  res.status(200).json({ message: 'Work started. FM has been notified.' });
});

// GET /api/worker/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const data = await workerService.fetchNotifications(req.user.id);
  res.status(200).json(data);
});

// PATCH /api/worker/notifications/mark-read
const markNotificationsRead = asyncHandler(async (req, res) => {
  await workerService.markAllNotificationsRead(req.user.id);
  res.status(200).json({ message: 'Notifications marked as read.' });
});

const getProfile = asyncHandler(async (req, res) => {
  const data = await workerService.fetchWorkerProfile(req.user.id);
  res.status(200).json(data);
});

const stripBase64Prefix = (str) => {
  if (typeof str !== 'string') return '';
  // This removes anything before the actual base64 data (including the comma)
  return str.includes(',') ? str.split(',')[1] : str;
};

const uploadProfilePicture = asyncHandler(async (req, res) => {
  const { image_base64, mime_type } = req.body;

  // 1. Validation check - if this fails, you get a 400, not a 500 crash
  if (!image_base64) {
    res.status(400);
    throw new Error('No image data received');
  }

  try {
    // 2. Clean and Convert
    const cleanBase64 = stripBase64Prefix(image_base64);
    const buffer = Buffer.from(cleanBase64, 'base64');

    // 3. Call Service
    // Note: ensure mime_type is passed, otherwise default to image/jpeg
    const workerpfp_url = await workerService.uploadWorkerProfilePicture(
      req.user.id,
      buffer,
      mime_type || 'image/jpeg'
    );

    res.status(200).json({ workerpfp_url });
  } catch (error) {
    console.error("Upload Controller Error:", error);
    res.status(500);
    throw new Error('Failed to process image: ' + error.message);
  }
});
// POST /api/worker/submit-proof  body: { assignment_id, image_base64, mime_type, worker_note }
const submitProof = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const userId = req.user.id;
  const { image_base64, mime_type, worker_note } = req.body;

  if (!image_base64) {
    res.status(400);
    throw new Error('Proof image is required.');
  }

  // Use the same robust conversion logic
  const cleanBase64 = stripBase64Prefix(image_base64);
  const buffer = Buffer.from(cleanBase64, 'base64');

  const proofUrl = await workerService.submitWorkProof(
    userId,
    ticketId,
    buffer,
    mime_type || 'image/jpeg',
    worker_note?.trim() || null,
  );

  res.status(200).json({
    message: 'Proof submitted successfully.',
    proof_url: proofUrl
  });
});

// GET /api/worker/assignment/:ticketId
const getAssignmentDetails = asyncHandler(async (req, res) => {
  const data = await workerService.fetchAssignmentDetails(req.params.ticketId, req.user.id);
  res.status(200).json(data);
});

// DELETE /api/worker/profile-picture
const removeProfilePicture = asyncHandler(async (req, res) => {
  await workerService.removeWorkerProfilePicture(req.user.id);
  res.status(200).json({ message: 'Profile picture removed.' });
});

// PATCH /api/worker/push-token  body: { push_token }
const savePushToken = asyncHandler(async (req, res) => {
  const { push_token } = req.body;
  if (!push_token) { res.status(400); throw new Error('push_token required.'); }
  await workerService.saveWorkerPushToken(req.user.id, push_token);
  res.status(200).json({ message: 'Push token saved.' });
});

// POST /api/worker/verify-password  body: { old_password }
const verifyPassword = asyncHandler(async (req, res) => {
  const { old_password } = req.body;
  if (!old_password) { res.status(400); throw new Error('Password required.'); }
  await workerService.verifyWorkerPassword(req.user.id, old_password);
  res.status(200).json({ valid: true });
});

// PATCH /api/worker/change-password  body: { new_password }
const changePassword = asyncHandler(async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters.');
  }
  await workerService.updateWorkerPassword(req.user.id, new_password);
  res.status(200).json({ message: 'Password updated successfully.' });
});

export {
  getMyTickets,
  startTicket,
  getNotifications,
  markNotificationsRead,
  getProfile,
  uploadProfilePicture,
  removeProfilePicture,
  submitProof,
  getAssignmentDetails,
  savePushToken,
  verifyPassword,
  changePassword,
};
