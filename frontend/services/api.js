import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your machine's IP address if testing on a physical devicee
const BASE_URL = 'http://localhost:3000/api';

const api = {
    async request(endpoint, options = {}, retry = true) {
        const token = await AsyncStorage.getItem('userToken');

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
        const data = await response.json();

        if (response.status === 401 && retry) {
            const refreshToken = await AsyncStorage.getItem('userRefreshToken');
            if (refreshToken) {
                const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });
                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    await AsyncStorage.setItem('userToken', refreshData.token);
                    await AsyncStorage.setItem('userRefreshToken', refreshData.refresh_token);
                    return this.request(endpoint, options, false);
                }
            }
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

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
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
};

export default api;
