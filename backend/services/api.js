const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'

const request = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

export const api = {
  // Auth
  signup: (body) => request('POST', '/auth/signup', body),
  login: (body) => request('POST', '/auth/login', body),

  // Admin - users
  getStaff: (token, role) => request('GET', `/admin/users${role ? `?role=${role}` : ''}`, null, token),
  activateUser: (token, id) => request('PATCH', `/admin/users/${id}/activate`, null, token),
  deactivateUser: (token, id) => request('PATCH', `/admin/users/${id}/deactivate`, null, token),
  verifyUser: (token, id) => request('PATCH', `/admin/users/${id}/verify`, null, token),
  getPendingUsers: (token) => request('GET', '/admin/users/pending', null, token),

  // Admin - points & rewards
  getLeaderboard: (token) => request('GET', '/admin/leaderboard', null, token),
  getPointsConfig: (token) => request('GET', '/admin/points-config', null, token),
  updatePointsConfig: (token, body) => request('PUT', '/admin/points-config', body, token),
  adjustPoints: (token, id, body) => request('PATCH', `/admin/users/${id}/points`, body, token),
  getRedemptions: (token) => request('GET', '/admin/redemptions', null, token),
  markRedemptionUsed: (token, id) => request('PATCH', `/admin/redemptions/${id}/mark-used`, null, token),

  // Rewards
  getRewards: (token) => request('GET', '/rewards', null, token),
  createReward: (token, body) => request('POST', '/rewards', body, token),
  updateReward: (token, id, body) => request('PUT', `/rewards/${id}`, body, token),
  deleteReward: (token, id) => request('DELETE', `/rewards/${id}`, null, token),
}