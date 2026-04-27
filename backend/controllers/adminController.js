import supabase from '../supabase.js';
import asyncHandler from 'express-async-handler';

// ─── GET USERS (with optional role filter) ───────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  let query = supabase.from('users').select('*');
  if (role) query = query.eq('role', role);
  const { data, error } = await query;
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(200).json(data);
});

// ─── APPROVE USER (pending → active) ─────────────────────────────────────
const approveUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { error } = await supabase
    .from('users')
    .update({ status: 'active', is_active: true, is_verified: true })
    .eq('id', userId);
  if (error) { res.status(500); throw new Error(error.message) }

  await supabase.from('notifications').insert({
    user_id: userId,
    message: 'Your account has been verified! You can now access the app.',
    is_read: false,
  });

  res.status(200).json({ message: 'User approved successfully' });
});

// ─── ACTIVATE / DEACTIVATE USER ──────────────────────────────────────────
const updateUserStatus = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;
  if (!['active', 'deactivated'].includes(status)) {
    res.status(400); throw new Error('Invalid status value');
  }
  const { error } = await supabase
    .from('users')
    .update({ status, is_active: status === 'active' })
    .eq('id', userId);
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(200).json({ message: 'User status updated successfully' });
});

// ─── GET LEADERBOARD ─────────────────────────────────────────────────────
const getLeaderboard = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, points')
    .eq('role', 'community_member')
    .order('points', { ascending: false })
    .limit(20);
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(200).json(data);
});

// ─── ADJUST POINTS ───────────────────────────────────────────────────────
const adjustPoints = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { points } = req.body;
  if (points === undefined) { res.status(400); throw new Error('Points value is required.') }
  const { error } = await supabase
    .from('users')
    .update({ points })
    .eq('id', id)
    .eq('role', 'community_member');
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(200).json({ message: 'Points updated successfully.' });
});

// ─── GET POINTS CONFIG ───────────────────────────────────────────────────
const getPointsConfig = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('points_config')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(200).json(data);
});

// ─── UPDATE POINTS CONFIG ────────────────────────────────────────────────
const updatePointsConfig = asyncHandler(async (req, res) => {
  const { points_per_ticket } = req.body;
  if (!points_per_ticket) { res.status(400); throw new Error('points_per_ticket is required.') }
  const { error } = await supabase
    .from('points_config')
    .insert({ points_per_ticket, updated_by: req.user.id });
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(200).json({ message: 'Points config updated successfully.' });
});

// ─── GET REDEMPTIONS ─────────────────────────────────────────────────────
const getRedemptions = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('redemptions')
    .select(`
      id, redeemed_at, is_used, marked_used_at,
      users:cm_id (full_name, email),
      rewards:reward_id (name, discount_percentage)
    `)
    .order('redeemed_at', { ascending: false });
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(200).json(data);
});

// ─── MARK REDEMPTION USED ────────────────────────────────────────────────
const markRedemptionUsed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('redemptions')
    .update({
      is_used: true,
      marked_used_by: req.user.id,
      marked_used_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) { res.status(500); throw new Error(error.message) }
  res.status(200).json({ message: 'Redemption marked as used.' });
});

export {
  getUsers,
  approveUser,
  updateUserStatus,
  getLeaderboard,
  adjustPoints,
  getPointsConfig,
  updatePointsConfig,
  getRedemptions,
  markRedemptionUsed,
};