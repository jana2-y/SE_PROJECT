import supabase from '../supabase.js'
import asyncHandler from 'express-async-handler'

const getAllRewards = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .order('points_required', { ascending: true })
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(200).json(data)
})

const createReward = asyncHandler(async (req, res) => {
  const { name, description, discount_percentage, points_required, duration_date } = req.body
  if (!name || !discount_percentage || !points_required || !duration_date) {
    res.status(400); throw new Error('Please fill out all required fields.')
  }
  
  console.log('Backend: Creating reward', name);
  const { data, error } = await supabase
    .from('rewards')
    .insert({ name, description, discount_percentage, points_required, duration_date, created_by: req.user.id })
    .select()
    .single()
  
  if (error) {
    console.error('Backend: Reward creation error:', error.message);
    res.status(500);
    throw new Error(error.message);
  }

  // Send notifications to Workers and Community Members
  try {
    const { data: usersToNotify } = await supabase
      .from('users')
      .select('id')
      .in('role', ['worker', 'community_member']);

    if (usersToNotify && usersToNotify.length > 0) {
      const notifications = usersToNotify.map(u => ({
        user_id: u.id,
        message: `🎁 New Reward: ${name}! Only ${points_required} points needed.`,
        is_read: false,
      }));
      await supabase.from('notifications').insert(notifications);
    }
    console.log('Backend: Notifications sent to', usersToNotify?.length, 'users');
  } catch (notifyErr) {
    console.error('Backend: Notification broadcast failed:', notifyErr.message);
  }

  console.log('Backend: Reward created successfully', data.id);
  res.status(201).json(data)
})

const updateReward = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { name, description, discount_percentage, points_required, duration_date } = req.body
  const { data, error } = await supabase
    .from('rewards')
    .update({ name, description, discount_percentage, points_required, duration_date, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(200).json(data)
})

const deleteReward = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('rewards').delete().eq('id', id)
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(200).json({ message: 'Reward deleted successfully.' })
})

const redeemReward = asyncHandler(async (req, res) => {
  const { id } = req.params
  const cm_id = req.user.id

  const { data: reward, error: rewardError } = await supabase
    .from('rewards').select('*').eq('id', id).single()
  if (rewardError || !reward) { res.status(404); throw new Error('Reward not found.') }

  if (new Date(reward.duration_date) < new Date()) {
    res.status(400); throw new Error('This reward has expired.')
  }

  const { data: existing } = await supabase
    .from('redemptions').select('id').eq('cm_id', cm_id).eq('reward_id', id).single()
  if (existing) { res.status(400); throw new Error('You have already redeemed this reward.') }

  const { data: user } = await supabase
    .from('users').select('points').eq('id', cm_id).single()
  if (user.points < reward.points_required) {
    res.status(400); throw new Error('Not enough points to redeem this reward.')
  }

  const { error } = await supabase.from('redemptions').insert({ cm_id, reward_id: id })
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(201).json({ message: 'Reward redeemed successfully!' })
})

export { getAllRewards, createReward, updateReward, deleteReward, redeemReward }