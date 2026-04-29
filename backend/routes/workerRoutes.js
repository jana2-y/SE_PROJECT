import express from 'express';
import {
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
} from '../controllers/workerController.js';

import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('worker'));

router.get('/tickets', getMyTickets);
router.patch('/tickets/:assignmentId/start', startTicket);
router.get('/notifications', getNotifications);
router.patch('/notifications/mark-read', markNotificationsRead);
router.get('/profile', getProfile);
router.post('/profile-picture', uploadProfilePicture);
router.delete('/profile-picture', removeProfilePicture);
router.post('/tickets/:ticketId/submit-proof', submitProof);
router.get('/assignment/:ticketId', getAssignmentDetails);
router.patch('/push-token', savePushToken);
router.post('/verify-password', verifyPassword);
router.patch('/change-password', changePassword);

export default router;
