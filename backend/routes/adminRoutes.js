import express from 'express';
import {
  getUsers,
  approveUser,
  updateUserStatus,
  activateUser,
  deactivateUser,
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
router.patch('/users/:id/activate', activateUser);
router.patch('/users/:id/deactivate', deactivateUser);

// Points & leaderboard
router.get('/leaderboard', getLeaderboard);
router.patch('/users/:id/points', adjustPoints);
router.get('/points-config', getPointsConfig);
router.patch('/points-config', updatePointsConfig);

// Redemptions
router.get('/redemptions', getRedemptions);
router.patch('/redemptions/:id/mark-used', markRedemptionUsed);

export default router;