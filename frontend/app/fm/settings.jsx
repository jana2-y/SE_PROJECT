import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, Modal, TextInput,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const FMSettings = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { theme, colors: c, setTheme } = useTheme();
    const { language, setLanguage } = useLanguage();

    const styles = useMemo(() => makeStyles(c), [c]);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logoutVisible, setLogoutVisible] = useState(false);

    const LANGUAGES = ['English', 'Arabic', 'German'];

    // change password modal
    const [pwModalVisible, setPwModalVisible] = useState(false);
    const [pwStep, setPwStep] = useState('verify');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');

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

    const openPwModal = () => {
        setPwStep('verify');
        setOldPassword('');
        setNewPassword('');
        setPwError('');
        setPwModalVisible(true);
    };

    const handleVerifyPassword = async () => {
        if (!oldPassword.trim()) { setPwError(t('pwErrorCurrent')); return; }
        setPwLoading(true);
        setPwError('');
        try {
            await api.post('/fm/verify-password', { old_password: oldPassword });
            setPwStep('change');
        } catch (err) {
            setPwError(err.message);
        } finally {
            setPwLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword.trim()) { setPwError(t('pwErrorNew')); return; }
        if (newPassword.length < 6) { setPwError(t('pwErrorLength')); return; }
        setPwLoading(true);
        setPwError('');
        try {
            await api.patch('/fm/change-password', { new_password: newPassword });
            setPwModalVisible(false);
            Alert.alert(t('success'), t('passwordUpdated'));
        } catch (err) {
            setPwError(err.message);
        } finally {
            setPwLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Header */}
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
                    <Text style={styles.logoutBtnText}>{t('exit')}</Text>
                </TouchableOpacity>
            </View>

            {/* Body */}
            <View style={styles.body}>

                {/* Email */}
                <View style={styles.row}>
                    <Text style={styles.rowText}>{t('email')}: {user?.email}</Text>
                </View>

                {/* Change Password */}
                <TouchableOpacity style={styles.actionRow} onPress={openPwModal}>
                    <Text style={styles.actionRowText}>{t('changePassword')}</Text>
                </TouchableOpacity>

                {/* Change Theme */}
                <TouchableOpacity style={styles.actionRow} onPress={null} activeOpacity={1}>
                    <Text style={styles.actionRowText}>{t('theme')}</Text>
                    <View style={styles.themeToggle}>
                        <TouchableOpacity
                            style={[styles.themeBtn, theme === 'light' && styles.themeBtnActive]}
                            onPress={() => setTheme('light')}
                        >
                            <Text style={[styles.themeBtnText, theme === 'light' && styles.themeBtnTextActive]}>
                                {t('light')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.themeBtn, theme === 'dark' && styles.themeBtnActive]}
                            onPress={() => setTheme('dark')}
                        >
                            <Text style={[styles.themeBtnText, theme === 'dark' && styles.themeBtnTextActive]}>
                                {t('dark')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {/* Language */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('language')}</Text>
                    {LANGUAGES.map(lang => (
                        <TouchableOpacity
                            key={lang}
                            style={styles.langRow}
                            onPress={() => setLanguage(lang)}
                        >
                            <Text style={styles.langText}>{t(`lang_${lang.toLowerCase()}`)}</Text>
                            {language === lang && (
                                <Text style={styles.langCheck}>✓</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Change password modal */}
            <Modal visible={pwModalVisible} transparent animationType="fade" onRequestClose={() => setPwModalVisible(false)}>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>
                            {pwStep === 'verify' ? t('verifyIdentity') : t('newPasswordTitle')}
                        </Text>
                        <Text style={styles.modalBody}>
                            {pwStep === 'verify' ? t('verifyPrompt') : t('newPasswordPrompt')}
                        </Text>

                        <TextInput
                            style={styles.pwInput}
                            placeholder={pwStep === 'verify' ? t('currentPasswordPlaceholder') : t('newPasswordPlaceholder')}
                            placeholderTextColor={c.textSub}
                            secureTextEntry
                            value={pwStep === 'verify' ? oldPassword : newPassword}
                            onChangeText={pwStep === 'verify' ? setOldPassword : setNewPassword}
                            autoCapitalize="none"
                        />

                        {pwError ? <Text style={styles.pwError}>{pwError}</Text> : null}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalNo}
                                onPress={() => setPwModalVisible(false)}
                                disabled={pwLoading}
                            >
                                <Text style={styles.modalNoText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalYes}
                                onPress={pwStep === 'verify' ? handleVerifyPassword : handleChangePassword}
                                disabled={pwLoading}
                            >
                                {pwLoading
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.modalYesText}>
                                        {pwStep === 'verify' ? t('verify') : t('submit')}
                                    </Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Logout confirmation modal */}
            <Modal visible={logoutVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>{t('logoutTitle')}</Text>
                        <Text style={styles.modalBody}>{t('logoutBody')}</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalNo} onPress={() => setLogoutVisible(false)}>
                                <Text style={styles.modalNoText}>{t('no')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalYes} onPress={handleLogout}>
                                <Text style={styles.modalYesText}>{t('yes')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const makeStyles = (c) => StyleSheet.create({
    container:          { flex: 1, backgroundColor: c.bg },
    centered:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
    header:             { backgroundColor: c.headerBg, borderBottomWidth: 1, borderColor: c.border, paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerBtn:          { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerBtnIcon:      { fontSize: 22, color: c.text },
    logoutBtnText:      { fontSize: 13, fontWeight: '600', color: c.error },
    avatarWrap:         { alignItems: 'center' },
    avatar:             { width: 72, height: 72, borderRadius: 36, backgroundColor: c.avatarBg, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    avatarText:         { color: '#fff', fontSize: 28, fontWeight: '700' },
    avatarName:         { fontSize: 15, fontWeight: '600', color: c.text },
    body:               { padding: 16 },
    row:                { backgroundColor: c.surface, borderRadius: 8, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 10 },
    rowText:            { fontSize: 13, color: c.text },
    actionRow:          { backgroundColor: c.surface, borderRadius: 8, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionRowText:      { fontSize: 14, color: c.text, fontWeight: '500' },
    themeToggle:        { flexDirection: 'row', gap: 6 },
    themeBtn:           { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: c.border, backgroundColor: c.inputBg },
    themeBtnActive:     { backgroundColor: c.btnBg, borderColor: c.btnBg },
    themeBtnText:       { fontSize: 12, fontWeight: '600', color: c.textSub },
    themeBtnTextActive: { color: c.btnText },
    section:            { backgroundColor: c.surface, borderRadius: 8, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 10 },
    sectionTitle:       { fontSize: 13, fontWeight: '600', color: c.textSub, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    langRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: c.border },
    langText:           { fontSize: 14, color: c.text },
    langCheck:          { fontSize: 16, color: c.primary, fontWeight: '700' },
    modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalBox:           { backgroundColor: c.surface, borderRadius: 12, padding: 24, marginHorizontal: '22%', width: '56%', alignSelf: 'center' },
    modalTitle:         { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 8 },
    modalBody:          { fontSize: 14, color: c.textMid, marginBottom: 16 },
    modalButtons:       { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalNo:            { flex: 1, paddingVertical: 12, borderRadius: 4, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
    modalNoText:        { fontSize: 14, fontWeight: '600', color: c.text },
    modalYes:           { flex: 1, paddingVertical: 12, borderRadius: 4, backgroundColor: c.error, alignItems: 'center' },
    modalYesText:       { fontSize: 14, fontWeight: '600', color: '#fff' },
    pwInput:            { borderWidth: 1, borderColor: c.border, borderRadius: 6, padding: 12, fontSize: 14, color: c.text, backgroundColor: c.inputBg, marginBottom: 8 },
    pwError:            { fontSize: 12, color: c.error, marginBottom: 8 },
});

export default FMSettings;
