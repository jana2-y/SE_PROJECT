import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:3000/api';

const request = async (method, path, body = null) => {
  const token = await AsyncStorage.getItem('userToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    // Fix: If no body is provided, don't stringify null
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};

const api = {
  signup: (body) => request('POST', '/auth/signup', body),
  login: (body) => request('POST', '/auth/login', body),
  getStaff: (role) => request('GET', `/admin/users${role ? `?role=${role}` : ''}`),
  activateUser: (id) => request('PATCH', `/admin/users/${id}/activate`, {}),
  deactivateUser: (id) => request('PATCH', `/admin/users/${id}/deactivate`, {}),
  verifyUser: (id) => request('PATCH', `/admin/users/${id}/verify`, {}),
  getLeaderboard: () => request('GET', '/admin/leaderboard'),
};

export default api;