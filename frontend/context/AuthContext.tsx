import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserRole = 'community_member' | 'facility_manager' | 'worker' | 'admin';

type User = {
    token: string;
    role: UserRole;
    email: string;
};

type LoginData = {
    token: string;
    refresh_token?: string;
    user: {
        role: UserRole;
        email: string;
    };
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (data: LoginData) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    async function loadStorageData() {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const role = await AsyncStorage.getItem('userRole');
            const email = await AsyncStorage.getItem('userEmail');

            if (token && role) {
                setUser({ token, role: role as UserRole, email: email ?? '' });
            }
        } catch (e) {
            console.error('Failed to load auth state', e);
        } finally {
            setLoading(false);
        }
    }

    const login = async (data: LoginData) => {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userRole', data.user.role);
        await AsyncStorage.setItem('userEmail', data.user.email);
        if (data.refresh_token) {
            await AsyncStorage.setItem('userRefreshToken', data.refresh_token);
        }
        setUser({ token: data.token, role: data.user.role, email: data.user.email });
    };

    const logout = async () => {
        await AsyncStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
