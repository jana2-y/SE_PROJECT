import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const FMSettings = () => {
    const router = useRouter();
    const { user, logout } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [language, setLanguage] = useState('English');

    const LANGUAGES = ['English', 'Arabic', 'German'];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.get('/fm/settings', user.token);
                setProfile(data);
            } catch (err) {
                Alert.alert('Error', err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        setLogoutVisible(false);
        await logout();
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0078D4" />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Custom header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.replace('/fm/dashboard')}>
                    <Text style={styles.headerBtnIcon}>⌂</Text>
                </TouchableOpacity>

                <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {profile?.full_name?.charAt(0)?.toUpperCase() || 'F'}
                        </Text>
                    </View>
                    <Text style={styles.avatarName}>{profile?.full_name}</Text>
                </View>

                <TouchableOpacity style={styles.headerBtn} onPress={() => setLogoutVisible(true)}>
                    <Text style={styles.logoutBtnText}>Exit</Text>
                </TouchableOpacity>
            </View>

            {/* Body */}
            <View style={styles.body}>

                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Email</Text>
                    <Text style={styles.rowValue}>{profile?.email}</Text>
                </View>

                <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Coming soon', 'Change password coming soon.')}>
                    <Text style={styles.actionRowText}>Change Password</Text>
                    <Text style={styles.actionRowArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Coming soon', 'Theme customisation coming soon.')}>
                    <Text style={styles.actionRowText}>Change Theme</Text>
                    <Text style={styles.actionRowArrow}>›</Text>
                </TouchableOpacity>

                {/* Language selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Language</Text>
                    {LANGUAGES.map(lang => (
                        <TouchableOpacity
                            key={lang}
                            style={styles.langRow}
                            onPress={() => setLanguage(lang)}
                        >
                            <Text style={styles.langText}>{lang}</Text>
                            {language === lang && (
                                <Text style={styles.langCheck}>✓</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Logout confirmation modal */}
            <Modal visible={logoutVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Log out?</Text>
                        <Text style={styles.modalBody}>Are you sure you want to log out?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalNo} onPress={() => setLogoutVisible(false)}>
                                <Text style={styles.modalNoText}>No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalYes} onPress={handleLogout}>
                                <Text style={styles.modalYesText}>Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F3F3' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E5E5E5', paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerBtnIcon: { fontSize: 22, color: '#181C22' },
    logoutBtnText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
    avatarWrap: { alignItems: 'center' },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0078D4', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
    avatarName: { fontSize: 15, fontWeight: '600', color: '#181C22' },
    body: { padding: 16 },
    row: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
    rowLabel: { fontSize: 13, fontWeight: '600', color: '#717783' },
    rowValue: { fontSize: 13, color: '#181C22', flexShrink: 1, textAlign: 'right' },
    actionRow: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionRowText: { fontSize: 14, color: '#181C22', fontWeight: '500' },
    actionRowArrow: { fontSize: 18, color: '#717783' },
    section: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', padding: 16, marginBottom: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#717783', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F3F3' },
    langText: { fontSize: 14, color: '#181C22' },
    langCheck: { fontSize: 16, color: '#0078D4', fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalBox: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#181C22', marginBottom: 8 },
    modalBody: { fontSize: 14, color: '#404752', marginBottom: 24 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalNo: { flex: 1, paddingVertical: 12, borderRadius: 4, borderWidth: 1, borderColor: '#E5E5E5', alignItems: 'center' },
    modalNoText: { fontSize: 14, fontWeight: '600', color: '#181C22' },
    modalYes: { flex: 1, paddingVertical: 12, borderRadius: 4, backgroundColor: '#DC2626', alignItems: 'center' },
    modalYesText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

export default FMSettings;