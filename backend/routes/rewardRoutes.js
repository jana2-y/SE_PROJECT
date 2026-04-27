import express from 'express'
import { getAllRewards, createReward, updateReward, deleteReward, redeemReward } from '../controllers/rewardsController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', protect, getAllRewards)
router.post('/:id/redeem', protect, authorize('community_member'), redeemReward)
router.post('/', protect, authorize('admin'), createReward)
router.put('/:id', protect, authorize('admin'), updateReward)
router.delete('/:id', protect, authorize('admin'), deleteReward)

export default router