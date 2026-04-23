import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        loadStorageData();
    }, []);

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login' || segments[0] === 'signup';

        if (!user && !inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace('/login');
        } else if (user && inAuthGroup) {
            // Redirect to home if authenticated and trying to access auth screenss
            router.replace('/');
        }
    }, [user, segments, loading]);

    async function loadStorageData() {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const role = await AsyncStorage.getItem('userRole');
            const email = await AsyncStorage.getItem('userEmail');

            if (token && role) {
                setUser({ token, role, email });
            }
        } catch (e) {
            console.error("Failed to load auth state", e);
        } finally {
            setLoading(false);
        }
    }

    const login = async (data) => {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userRole', data.user.role);
        await AsyncStorage.setItem('userEmail', data.user.email);
        setUser({ token: data.token, role: data.user.role, email: data.user.email });
    };

    const logout = async () => {
        await AsyncStorage.clear();
        setUser(null);
        router.replace('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
