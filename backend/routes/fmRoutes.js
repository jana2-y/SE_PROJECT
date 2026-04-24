import express from 'express';
import {
    getTickets,
    getTicketById,
    getWorkers,
    assignTicket,
    submitFeedback,
    getSettings,
    verifyPassword,
    changePassword,
} from '../controllers/fmController.js';

import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('facility_manager'));

router.get('/tickets', getTickets);
router.get('/tickets/:id', getTicketById);
router.patch('/tickets/:id/assign', assignTicket);
router.patch('/tickets/:id/feedback', submitFeedback);
router.get('/workers', getWorkers);
router.get('/settings', getSettings);
router.post('/verify-password', verifyPassword);
router.patch('/change-password', changePassword);

export default router;