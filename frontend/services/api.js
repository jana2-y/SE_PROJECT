import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your machine's IP address if testing on a physical device
const BASE_URL = 'http://localhost:3000/api'; 

const api = {
    async request(endpoint, options = {}) {
        const token = await AsyncStorage.getItem('userToken');
        
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();
        console.log(`API Response: ${response.status} ${endpoint}`, data);

        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }

        return data;
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
