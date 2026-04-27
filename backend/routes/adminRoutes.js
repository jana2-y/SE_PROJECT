import express from 'express';
import {
  getUsers,
  approveUser,
  updateUserStatus,
  getLeaderboard,
  adjustPoints,
  getPointsConfig,
  updatePointsConfig,
  getRedemptions,
  markRedemptionUsed,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));

// User management
router.get('/users', getUsers);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/status', updateUserStatus);

// Points & leaderboard
router.get('/leaderboard', getLeaderboard);
router.patch('/users/:id/points', adjustPoints);
router.get('/points-config', getPointsConfig);
router.put('/points-config', updatePointsConfig);

// Redemptions
router.get('/redemptions', getRedemptions);
router.patch('/redemptions/:id/mark-used', markRedemptionUsed);

export default router;