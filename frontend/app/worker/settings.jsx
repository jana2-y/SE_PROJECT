import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    ActivityIndicator, Alert, Modal, TextInput, Image,
    KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import SharedHeader from '../../components/SharedHeader';

const { width: W } = Dimensions.get('window');

const VG = {
    light: {
        gradStart: '#a6867dff', gradEnd: '#ede0da',
        card: 'rgba(255,248,246,0.97)',
        glass: 'rgba(255,255,255,0.62)',
        glassBorder: 'rgba(66,0,0,0.12)',
        primary: '#420000', primaryBtn: '#420000', primaryBtnText: '#ffffff',
        text: '#31120c', textSub: '#57423e', textFaint: '#8b716d',
        pillBg: 'rgba(66,0,0,0.07)',
        langActiveBg: 'rgba(66,0,0,0.09)', langActiveBorder: 'rgba(66,0,0,0.22)',
        divider: 'rgba(49,18,12,0.08)',
        error: '#ba1a1a', errorBtn: '#ba1a1a',
        inputBg: 'rgba(255,240,238,0.9)', inputBorder: 'rgba(66,0,0,0.18)',
        modalBg: '#fff0ee',
        avatarBg: '#420000',
    },
    dark: {
        gradStart: '#382928ff', gradEnd: '#421313ff',
        card: 'rgba(42,15,9,0.97)',
        glass: 'rgba(74,39,31,0.65)',
        glassBorder: 'rgba(255,218,211,0.14)',
        primary: '#ffb4a8', primaryBtn: '#660b05', primaryBtnText: '#ffdad4',
        text: '#fff8f6', textSub: 'rgba(255,248,246,0.62)', textFaint: 'rgba(255,248,246,0.38)',
        pillBg: 'rgba(255,180,168,0.12)',
        langActiveBg: 'rgba(255,180,168,0.12)', langActiveBorder: 'rgba(255,180,168,0.35)',
        divider: 'rgba(255,248,246,0.08)',
        error: '#cf6679', errorBtn: '#7c1a1a',
        inputBg: 'rgba(74,39,31,0.7)', inputBorder: 'rgba(255,218,211,0.22)',
        modalBg: '#2a0f09',
        avatarBg: '#660b05',
    },
};

const LANGUAGES = [
    { key: 'English', label: 'English', code: 'EN' },
    { key: 'Arabic', label: 'العربية (Arabic)', code: 'AR' },
    { key: 'German', label: 'Deutsch (German)', code: 'DE' },
];

const WorkerSettings = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { user, logout, updateUser } = useAuth();
    const { theme, setTheme } = useTheme();
    const { language, setLanguage } = useLanguage();


    const vg = VG[theme] || VG.light;
    const s = useMemo(() => makeStyles(vg), [vg]);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [themeDropVisible, setThemeDropVisible] = useState(false);

    const [pendingImage, setPendingImage] = useState(null);
    const [pfpVersion, setPfpVersion] = useState(0);
    const [pfpStatus, setPfpStatus] = useState(null); // 'saving'|'removing'|'success'|'error'
    const [pfpMessage, setPfpMessage] = useState('');

    const [pwVisible, setPwVisible] = useState(false);
    const [pwStep, setPwStep] = useState('verify');
    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');

    const navigation = useNavigation();

    // Intercept back/swipe when there's a pending unsaved photo
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!pendingImage) return;
            e.preventDefault();
            Alert.alert(
                'Unsaved Changes',
                'You have an unsaved photo. Save it before leaving?',
                [
                    { text: 'Discard', style: 'destructive', onPress: () => { setPendingImage(null); navigation.dispatch(e.data.action); } },
                    { text: 'Save & Leave', onPress: async () => { await handleSavePfp(); navigation.dispatch(e.data.action); } },
                    { text: 'Stay', style: 'cancel' },
                ],
            );
        });
        return unsubscribe;
    }, [navigation, pendingImage]);

    const handleAuthError = useCallback(async (err) => {
        const msg = err?.message || '';
        if (msg.includes('token') || msg.includes('Token') || msg.includes('401') || msg.includes('authorization')) {
            await logout();
            router.replace('/login');
        }
    }, [logout, router]);

    useFocusEffect(useCallback(() => {
        setLoading(true);
        api.get('/worker/profile')
            .then(d => setProfile(d))
            .catch(err => handleAuthError(err))
            .finally(() => setLoading(false));
    }, [handleAuthError]));


    const handleLogout = async () => {
        setLogoutVisible(false);
        await logout();
        router.replace('/login');
    };

    const pickImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please allow gallery access in your device settings.');
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            if (!asset.base64) {
                Alert.alert('Error', 'Could not read image data. Please try again.');
                return;
            }
            setPendingImage({
                uri: asset.uri,
                base64: asset.base64,
                mimeType: asset.mimeType || 'image/jpeg',
            });
        }
    };

    const openPw = () => {
        setPwStep('verify');
        setOldPw('');
        setNewPw('');
        setPwError('');
        setPwVisible(true);
    };

    const handleSavePfp = async () => {
        if (!pendingImage) return;
        setSaving(true);
        setPfpStatus('saving');
        setPfpMessage('');

        try {
            const response = await api.post('/worker/profile-picture', {
                image_base64: pendingImage.base64, // Matches controller
                mime_type: pendingImage.mimeType,  // Matches controller
            });

            if (!response?.workerpfp_url) throw new Error('Server returned no URL.');

            const signedUrl = response.workerpfp_url;
            await updateUser({ workerpfp_url: signedUrl });
            setProfile(prev => prev ? { ...prev, workerpfp_url: signedUrl } : prev);
            setPfpVersion(v => v + 1);
            setPendingImage(null);
            setPfpStatus('success');
            setPfpMessage('Profile picture updated successfully.');
        } catch (err) {
            const msg = err?.message || 'Upload failed.';
            if (msg.includes('token') || msg.includes('Token') || msg.includes('authorization')) {
                await logout();
                router.replace('/login');
            } else {
                setPfpStatus('error');
                setPfpMessage(msg);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRemovePfp = async () => {
        setSaving(true);
        setPfpStatus('removing');
        setPfpMessage('');
        try {
            await api.delete('/worker/profile-picture');
            await updateUser({ workerpfp_url: null });
            setProfile(prev => prev ? { ...prev, workerpfp_url: null } : prev);
            setPfpVersion(v => v + 1);
            setPfpStatus('success');
            setPfpMessage('Profile picture removed.');
        } catch (err) {
            setPfpStatus('error');
            setPfpMessage(err?.message || 'Could not remove photo.');
        } finally {
            setSaving(false);
        }
    };

    const handleVerify = async () => {
        if (!oldPw.trim()) {
            setPwError(t('pwErrorCurrent') || 'Please enter current password');
            return;
        }
        setPwLoading(true);
        setPwError('');
        try {
            await api.post('/worker/verify-password', { old_password: oldPw });
            setPwStep('change');
        } catch (e) {
            setPwError(e.message || 'Incorrect password');
        } finally {
            setPwLoading(false);
        }
    };

    const handleChangePw = async () => {
        if (!newPw.trim()) {
            setPwError(t('pwErrorNew') || 'Please enter new password');
            return;
        }
        if (newPw.length < 6) {
            setPwError(t('pwErrorLength') || 'Password must be at least 6 characters');
            return;
        }
        setPwLoading(true);
        setPwError('');
        try {
            await api.patch('/worker/change-password', { new_password: newPw });
            setPwVisible(false);
            Alert.alert(t('success') || 'Success', t('passwordUpdated') || 'Password updated successfully');
        } catch (e) {
            setPwError(e.message || 'Update failed');
        } finally {
            setPwLoading(false);
        }
    };
    if (loading) return (
        <LinearGradient colors={[vg.gradStart, vg.gradEnd]} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={vg.primary} />
        </LinearGradient>
    );

    const LOGO = require('../../assets/images/cclogo.png');

    const renderPfp = () => {
        const resolvedUrl = profile?.workerpfp_url || user?.workerpfp_url;
        const validUrl = resolvedUrl?.startsWith('http') ? resolvedUrl : null;
        const source = pendingImage
            ? { uri: pendingImage.uri }
            : (validUrl ? { uri: validUrl } : LOGO);

        return (
            <View style={s.pfpContainer}>
                <Image key={pfpVersion} source={source} style={s.pfp} />

                {/* Show an overlay or spinner if saving */}
                {saving && (
                    <View style={s.pfpLoadingOverlay}>
                        <ActivityIndicator color="#fff" />
                    </View>
                )}
            </View>
        );
    };

    const initials = profile?.full_name?.charAt(0)?.toUpperCase() || 'W';

    return (
        <LinearGradient colors={[vg.gradStart, vg.gradEnd]} style={s.root}>

            <SharedHeader onNotificationsPress={() => { }} />

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <View style={s.card}>

                    {/* ── Identity ── */}
                    <View style={s.identitySection}>
                        <View style={s.avatarWrap}>
                            <TouchableOpacity onPress={pickImage} disabled={saving}>
                                {renderPfp()}
                                <View style={s.cameraIcon}>
                                    <Ionicons name="camera" size={14} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Text style={s.titleText}>Worker Settings</Text>
                        <Text style={s.subtitleText}>{profile?.full_name || 'CampusCare® Professional'}</Text>
                        <View style={s.emailPill}>
                            <Ionicons name="mail-outline" size={14} color={vg.primary} />
                            <Text style={s.emailText}>{user?.email}</Text>
                        </View>

                        {/* Inline status feedback */}
                        {pfpStatus === 'success' && (
                            <View style={s.pfpFeedback}>
                                <Ionicons name="checkmark-circle" size={15} color="#059669" />
                                <Text style={[s.pfpFeedbackText, { color: '#059669' }]}>{pfpMessage}</Text>
                            </View>
                        )}
                        {pfpStatus === 'error' && (
                            <View style={s.pfpFeedback}>
                                <Ionicons name="alert-circle" size={15} color={vg.error} />
                                <Text style={[s.pfpFeedbackText, { color: vg.error }]}>{pfpMessage}</Text>
                            </View>
                        )}

                        {/* Photo action buttons */}
                        {pendingImage ? (
                            <View style={s.pfpBtnRow}>
                                <TouchableOpacity style={s.pfpBtnCancel} onPress={() => { setPendingImage(null); setPfpStatus(null); }} disabled={saving}>
                                    <Text style={s.pfpBtnCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.savePfpBtn} onPress={handleSavePfp} disabled={saving}>
                                    {saving && pfpStatus === 'saving'
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Text style={s.savePfpText}>Save Photo</Text>}
                                </TouchableOpacity>
                            </View>
                        ) : ((profile?.workerpfp_url || user?.workerpfp_url)?.startsWith('http')) ? (
                            <TouchableOpacity style={s.removePfpBtn} onPress={handleRemovePfp} disabled={saving}>
                                {saving && pfpStatus === 'removing'
                                    ? <ActivityIndicator size="small" color={vg.error} />
                                    : (
                                        <>
                                            <Ionicons name="trash-outline" size={14} color={vg.error} />
                                            <Text style={[s.savePfpText, { color: vg.error }]}>Remove Photo</Text>
                                        </>
                                    )}
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* ── Specialty & Experience Display ── */}
                    <View style={s.infoGrid}>
                        <View style={s.infoBox}>
                            <Ionicons name="construct-outline" size={18} color={vg.primary} />
                            <Text style={s.infoLabel}>Specialty</Text>
                            <Text style={s.infoValue}>{profile?.specialty || '—'}</Text>
                        </View>
                        <View style={s.infoBox}>
                            <Ionicons name="time-outline" size={18} color={vg.primary} />
                            <Text style={s.infoLabel}>Experience</Text>
                            <Text style={s.infoValue}>{profile?.years_experience ?? '0'} Years</Text>
                        </View>
                    </View>

                    {/* ── Action cards ── */}
                    <View style={s.actionGrid}>
                        <TouchableOpacity style={s.actionCardFixed} onPress={openPw} activeOpacity={0.75}>
                            <View style={s.actionLeft}>
                                <View style={s.actionIconBox}>
                                    <Ionicons name="lock-closed-outline" size={20} color={vg.primary} />
                                </View>
                                <View>
                                    <Text style={s.actionTitle}>Security</Text>
                                    <Text style={s.actionSub}>Change Password</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={vg.textFaint} />
                        </TouchableOpacity>

                        <View style={s.actionCardExpandWrap}>
                            <TouchableOpacity style={s.actionCardExpand} onPress={() => setThemeDropVisible(v => !v)} activeOpacity={0.75}>
                                <View style={s.actionLeft}>
                                    <View style={s.actionIconBox}>
                                        <Ionicons name="color-palette-outline" size={20} color={vg.primary} />
                                    </View>
                                    <View>
                                        <Text style={s.actionTitle}>Theme</Text>
                                        <Text style={s.actionSub}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</Text>
                                    </View>
                                </View>
                                <Ionicons name={themeDropVisible ? 'chevron-down' : 'chevron-forward'} size={18} color={vg.textFaint} />
                            </TouchableOpacity>
                            {themeDropVisible && (
                                <View style={s.themeDrop}>
                                    {['light', 'dark'].map(opt => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[s.themeOption, theme === opt && s.themeOptionActive]}
                                            onPress={() => { setTheme(opt); setThemeDropVisible(false); }}
                                        >
                                            <View style={s.themeOptionLeft}>
                                                <Ionicons name={opt === 'light' ? 'sunny-outline' : 'moon-outline'} size={16} color={theme === opt ? vg.primary : vg.textSub} />
                                                <Text style={[s.themeOptionText, theme === opt && s.themeOptionTextActive]}>{opt === 'light' ? 'Light' : 'Dark'}</Text>
                                            </View>
                                            {theme === opt && <Ionicons name="checkmark" size={16} color={vg.primary} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* ── Language ── */}
                    <View style={s.langSection}>
                        <View style={s.langHeader}>
                            <Ionicons name="globe-outline" size={18} color={vg.text} />
                            <Text style={s.langHeaderText}>Language Preference</Text>
                        </View>
                        <View style={s.langList}>
                            {LANGUAGES.map(lang => {
                                const active = language === lang.key;
                                return (
                                    <TouchableOpacity
                                        key={lang.key}
                                        style={[s.langRow, active && s.langRowActive]}
                                        onPress={() => setLanguage(lang.key)}
                                        activeOpacity={0.75}
                                    >
                                        <View style={s.langLeft}>
                                            <View style={s.langCode}><Text style={s.langCodeText}>{lang.code}</Text></View>
                                            <Text style={[s.langLabel, active && s.langLabelActive]}>{lang.label}</Text>
                                        </View>
                                        {active ? <Ionicons name="checkmark-circle" size={20} color={vg.primary} /> : <View style={s.langRadio} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── Sign Out ── */}
                    <TouchableOpacity style={s.signOutFullBtn} onPress={() => setLogoutVisible(true)}>
                        <Ionicons name="log-out-outline" size={16} color={vg.error} />
                        <Text style={[s.signOutFullText, { color: vg.error }]}>Sign Out</Text>
                    </TouchableOpacity>

                    {/* ── Bottom row ── */}
                    <View style={s.bottomRow}>
                        <TouchableOpacity style={s.bottomBtn}>
                            <Ionicons name="notifications-outline" size={20} color={vg.textSub} />
                            <Text style={s.bottomBtnText}>Alerts</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.bottomBtn}>
                            <Ionicons name="briefcase-outline" size={20} color={vg.textSub} />
                            <Text style={s.bottomBtnText}>Jobs</Text>
                        </TouchableOpacity>
                        {pendingImage ? (
                            <TouchableOpacity style={[s.bottomBtn, { backgroundColor: vg.primary }]} onPress={handleSavePfp} disabled={saving}>
                                {saving && pfpStatus === 'saving'
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <><Ionicons name="checkmark-done-outline" size={20} color="#fff" /><Text style={[s.bottomBtnText, { color: '#fff' }]}>Save Changes</Text></>}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={s.bottomBtn}>
                                <Ionicons name="help-buoy-outline" size={20} color={vg.textSub} />
                                <Text style={s.bottomBtnText}>Support</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                </View>
            </ScrollView>

            {/* Change password modal */}
            <Modal visible={pwVisible} transparent animationType="fade" onRequestClose={() => setPwVisible(false)}>
                <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={s.modalBox}>
                        <Text style={s.modalTitle}>{pwStep === 'verify' ? t('verifyIdentity') : t('newPasswordTitle')}</Text>
                        <Text style={s.modalBody}>{pwStep === 'verify' ? t('verifyPrompt') : t('newPasswordPrompt')}</Text>
                        <TextInput
                            style={s.pwInput}
                            placeholder={pwStep === 'verify' ? t('currentPasswordPlaceholder') : t('newPasswordPlaceholder')}
                            placeholderTextColor={vg.textFaint}
                            secureTextEntry
                            value={pwStep === 'verify' ? oldPw : newPw}
                            onChangeText={pwStep === 'verify' ? setOldPw : setNewPw}
                            autoCapitalize="none"
                        />
                        {pwError ? <Text style={s.pwError}>{pwError}</Text> : null}
                        <View style={s.modalBtns}>
                            <TouchableOpacity style={s.modalCancel} onPress={() => setPwVisible(false)} disabled={pwLoading}>
                                <Text style={s.modalCancelText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.modalConfirm} onPress={pwStep === 'verify' ? handleVerify : handleChangePw} disabled={pwLoading}>
                                {pwLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalConfirmText}>{pwStep === 'verify' ? t('verify') : t('submit')}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Logout confirmation modal */}
            <Modal visible={logoutVisible} transparent animationType="fade">
                <View style={s.overlay}>
                    <View style={s.modalBox}>
                        <Text style={s.modalTitle}>{t('logoutTitle')}</Text>
                        <Text style={s.modalBody}>{t('logoutBody')}</Text>
                        <View style={s.modalBtns}>
                            <TouchableOpacity style={s.modalCancel} onPress={() => setLogoutVisible(false)}>
                                <Text style={s.modalCancelText}>{t('no')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.modalConfirm, { backgroundColor: vg.errorBtn }]} onPress={handleLogout}>
                                <Text style={s.modalConfirmText}>{t('yes')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
};

const makeStyles = (vg) => StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: 48 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20,
        backgroundColor: vg.glass, borderBottomWidth: 1, borderColor: vg.glassBorder,
    },
    headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: vg.primaryBtn, justifyContent: 'center', alignItems: 'center' },
    avatarWrap: { alignItems: 'center' },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: vg.avatarBg, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: vg.glassBorder },
    avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
    cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: vg.primary, padding: 4, borderRadius: 10, borderWidth: 1, borderColor: '#fff' },
    signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: vg.primaryBtn, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    signOutText: { fontSize: 12, fontWeight: '600', color: vg.primaryBtnText },
    card: { backgroundColor: vg.card, borderRadius: 28, padding: 24, marginTop: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    identitySection: { alignItems: 'center', marginBottom: 24 },
    titleText: { fontSize: 24, fontWeight: '700', color: vg.primary, marginBottom: 4 },
    subtitleText: { fontSize: 14, color: vg.textSub, marginBottom: 12 },
    emailPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: vg.pillBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    emailText: { fontSize: 12, color: vg.primary, fontWeight: '600' },
    savePfpBtn: { marginTop: 12, backgroundColor: vg.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    savePfpText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    removePfpBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: vg.error + '55', backgroundColor: vg.error + '12' },
    pfpBtnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    pfpBtnCancel: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: vg.glassBorder },
    pfpBtnCancelText: { fontSize: 12, fontWeight: '600', color: vg.textSub },
    pfpFeedback: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: vg.glass },
    pfpFeedbackText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
    infoGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    infoBox: { flex: 1, backgroundColor: vg.glass, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: vg.glassBorder, alignItems: 'center' },
    infoLabel: { fontSize: 11, color: vg.textFaint, textTransform: 'uppercase', marginTop: 4 },
    infoValue: { fontSize: 14, fontWeight: '700', color: vg.text, marginTop: 2 },
    actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    actionCardFixed: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: vg.glass, borderRadius: 18, padding: 14, height: 70, borderWidth: 1, borderColor: vg.glassBorder },
    actionCardExpandWrap: { flex: 1 },
    actionCardExpand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: vg.glass, borderRadius: 18, padding: 14, height: 70, borderWidth: 1, borderColor: vg.glassBorder },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: vg.pillBg, justifyContent: 'center', alignItems: 'center' },
    actionTitle: { fontSize: 13, fontWeight: '700', color: vg.primary },
    actionSub: { fontSize: 11, color: vg.textSub },
    pfpContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: vg.avatarBg,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: vg.glassBorder,
    },
    pfp: {
        width: '100%',
        height: '100%',
    },
    pfpLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeDrop: { backgroundColor: vg.card, borderRadius: 14, marginTop: 6, overflow: 'hidden', borderWidth: 1, borderColor: vg.glassBorder },
    themeOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: vg.divider },
    themeOptionActive: { backgroundColor: vg.langActiveBg },
    themeOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    themeOptionText: { fontSize: 13, color: vg.textSub },
    themeOptionTextActive: { color: vg.primary, fontWeight: '700' },
    langSection: { marginBottom: 24 },
    langHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    langHeaderText: { fontSize: 16, fontWeight: '600', color: vg.text },
    langList: { gap: 8 },
    langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: vg.glass, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: vg.glassBorder },
    langRowActive: { backgroundColor: vg.langActiveBg, borderColor: vg.langActiveBorder, borderWidth: 2 },
    langLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    langCode: { width: 30, height: 20, borderRadius: 4, backgroundColor: vg.divider, justifyContent: 'center', alignItems: 'center' },
    langCodeText: { fontSize: 9, fontWeight: '700', color: vg.textSub },
    langLabel: { fontSize: 14, color: vg.text },
    langLabelActive: { fontWeight: '700', color: vg.primary },
    langRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: vg.glassBorder },
    signOutFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginBottom: 16, borderRadius: 14, borderWidth: 1, borderColor: vg.error + '44', backgroundColor: vg.error + '10' },
    signOutFullText: { fontSize: 13, fontWeight: '700' },
    bottomRow: { flexDirection: 'row', gap: 10, paddingTop: 16, borderTopWidth: 1, borderColor: vg.divider },
    bottomBtn: { flex: 1, alignItems: 'center', backgroundColor: vg.glass, paddingVertical: 12, borderRadius: 16, gap: 4 },
    bottomBtnText: { fontSize: 10, fontWeight: '700', color: vg.textSub },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalBox: { backgroundColor: vg.modalBg, borderRadius: 20, padding: 24, width: W * 0.85 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: vg.primary, marginBottom: 4 },
    modalBody: { fontSize: 14, color: vg.textSub, marginBottom: 16 },
    pwInput: { backgroundColor: vg.inputBg, borderRadius: 12, padding: 14, color: vg.text, marginBottom: 10, borderWidth: 1, borderColor: vg.inputBorder },
    pwError: { fontSize: 12, color: vg.error, marginBottom: 8 },
    modalBtns: { flexDirection: 'row', gap: 10 },
    modalCancel: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    modalCancelText: { color: vg.textSub, fontWeight: '600' },
    modalConfirm: { flex: 1, paddingVertical: 12, backgroundColor: vg.primaryBtn, borderRadius: 12, alignItems: 'center' },
    modalConfirmText: { color: vg.primaryBtnText, fontWeight: '700' },
});

export default WorkerSettings;