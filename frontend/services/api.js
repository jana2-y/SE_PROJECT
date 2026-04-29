import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:3000/api';

// Shared refresh promise — prevents multiple simultaneous refresh attempts
let _refreshPromise = null;

const doRefresh = async () => {
    if (_refreshPromise) return _refreshPromise;
    _refreshPromise = (async () => {
        try {
            const refreshToken = await AsyncStorage.getItem('userRefreshToken');
            if (!refreshToken) return null;
            const res = await fetch(`${BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (!res.ok) return null;
            const d = await res.json();
            await AsyncStorage.setItem('userToken', d.token);
            if (d.refresh_token) await AsyncStorage.setItem('userRefreshToken', d.refresh_token);
            return d.token;
        } finally {
            _refreshPromise = null;
        }
    })();
    return _refreshPromise;
};

const api = {
    async request(endpoint, options = {}, retry = true) {
        const token = await AsyncStorage.getItem('userToken');

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        let response;
        try {
            response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers, signal: controller.signal });
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') throw new Error('Request timed out. Check your connection.');
            throw err;
        }
        clearTimeout(timeoutId);
        const data = await response.json();

        if (response.status === 401 && retry) {
            const newToken = await doRefresh();
            if (newToken) return this.request(endpoint, options, false);
        }

        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }

        return data;
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
    },

    patch(endpoint, body) {
        return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
    },

    login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

    signup(userData) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    // ── Admin: staff management ──────────────────────────────────────────
    getStaff(role) {
        const query = role ? `?role=${role}` : '';
        return this.request(`/admin/users${query}`, { method: 'GET' });
    },

    activateUser(id) {
        return this.request(`/admin/users/${id}/activate`, { method: 'PATCH', body: JSON.stringify({}) });
    },

    deactivateUser(id) {
        return this.request(`/admin/users/${id}/deactivate`, { method: 'PATCH', body: JSON.stringify({}) });
    },

    verifyUser(id) {
        return this.request(`/admin/users/${id}/verify`, { method: 'PATCH', body: JSON.stringify({}) });
    },

    // ── Rewards ──────────────────────────────────────────────────────────
    getRewards() {
        return this.request('/rewards', { method: 'GET' });
    },

    createReward(rewardData) {
        return this.request('/rewards', { method: 'POST', body: JSON.stringify(rewardData) });
    },

    deleteReward(id) {
        return this.request(`/rewards/${id}`, { method: 'DELETE' });
    },

    // ── Points Config ────────────────────────────────────────────────────
    getPointsConfig() {
        return this.request('/admin/points-config', { method: 'GET' });
    },

    updatePointsConfig(config) {
        return this.request('/admin/points-config', { method: 'PATCH', body: JSON.stringify(config) });
    },

    getLeaderboard() {
        return this.request('/admin/leaderboard', { method: 'GET' });
    },
};

export default api;
