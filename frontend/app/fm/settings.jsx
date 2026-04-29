import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    ActivityIndicator, Alert, Modal, TextInput,
    KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const FMSettings = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const { language, setLanguage } = useLanguage();

    const vg = VG[theme] || VG.light;
    const s = useMemo(() => makeStyles(vg), [vg]);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [themeDropVisible, setThemeDropVisible] = useState(false);

    const [pwVisible, setPwVisible] = useState(false);
    const [pwStep, setPwStep] = useState('verify');
    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');

    useEffect(() => {
        api.get('/fm/settings').then(d => setProfile(d)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handleLogout = async () => { setLogoutVisible(false); await logout(); router.replace('/login'); };

    const openPw = () => { setPwStep('verify'); setOldPw(''); setNewPw(''); setPwError(''); setPwVisible(true); };

    const handleVerify = async () => {
        if (!oldPw.trim()) { setPwError(t('pwErrorCurrent')); return; }
        setPwLoading(true); setPwError('');
        try { await api.post('/fm/verify-password', { old_password: oldPw }); setPwStep('change'); }
        catch (e) { setPwError(e.message); }
        finally { setPwLoading(false); }
    };

    const handleChangePw = async () => {
        if (!newPw.trim()) { setPwError(t('pwErrorNew')); return; }
        if (newPw.length < 6) { setPwError(t('pwErrorLength')); return; }
        setPwLoading(true); setPwError('');
        try { await api.patch('/fm/change-password', { new_password: newPw }); setPwVisible(false); Alert.alert(t('success'), t('passwordUpdated')); }
        catch (e) { setPwError(e.message); }
        finally { setPwLoading(false); }
    };

    if (loading) return (
        <LinearGradient colors={[vg.gradStart, vg.gradEnd]} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={vg.primary} />
        </LinearGradient>
    );

    const initials = profile?.full_name?.charAt(0)?.toUpperCase() || 'F';

    return (
        <LinearGradient colors={[vg.gradStart, vg.gradEnd]} style={s.root}>

            <SharedHeader onNotificationsPress={() => {}} />

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <View style={s.card}>

                    {/* ── Identity ── */}
                    <View style={s.identitySection}>
                        <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
                        <Text style={s.titleText}>{t('accountSettings')}</Text>
                        <Text style={s.subtitleText}>{t('campuscarePrefs')}</Text>
                        <View style={s.emailPill}>
                            <Ionicons name="mail-outline" size={14} color={vg.primary} />
                            <Text style={s.emailText}>{user?.email}</Text>
                        </View>
                    </View>

                    {/* ── Action cards ── */}
                    <View style={s.actionGrid}>

                        {/* Change password — fixed width so theme ddl doesn't affect it */}
                        <TouchableOpacity style={s.actionCardFixed} onPress={openPw} activeOpacity={0.75}>
                            <View style={s.actionLeft}>
                                <View style={s.actionIconBox}>
                                    <Ionicons name="lock-closed-outline" size={20} color={vg.primary} />
                                </View>
                                <View>
                                    <Text style={s.actionTitle}>{t('security')}</Text>
                                    <Text style={s.actionSub}>{t('changePassword')}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={vg.textFaint} />
                        </TouchableOpacity>

                        {/* Change theme — separate wrap so ddl expansion only affects this card */}
                        <View style={s.actionCardExpandWrap}>
                            <TouchableOpacity style={s.actionCardExpand} onPress={() => setThemeDropVisible(v => !v)} activeOpacity={0.75}>
                                <View style={s.actionLeft}>
                                    <View style={s.actionIconBox}>
                                        <Ionicons name="color-palette-outline" size={20} color={vg.primary} />
                                    </View>
                                    <View>
                                        <Text style={s.actionTitle}>{t('appearance')}</Text>
                                        <Text style={s.actionSub}>{t('changeTheme')}</Text>
                                    </View>
                                </View>
                                <Ionicons
                                    name={themeDropVisible ? 'chevron-down' : 'chevron-forward'}
                                    size={18}
                                    color={vg.textFaint}
                                />
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
                                                <Ionicons
                                                    name={opt === 'light' ? 'sunny-outline' : 'moon-outline'}
                                                    size={16}
                                                    color={theme === opt ? vg.primary : vg.textSub}
                                                />
                                                <Text style={[s.themeOptionText, theme === opt && s.themeOptionTextActive]}>
                                                    {opt === 'light' ? 'Light' : 'Dark'}
                                                </Text>
                                            </View>
                                            {theme === opt && (
                                                <Ionicons name="checkmark" size={16} color={vg.primary} />
                                            )}
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
                            <Text style={s.langHeaderText}>{t('languagePreference')}</Text>
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
                                            <View style={s.langCode}>
                                                <Text style={s.langCodeText}>{lang.code}</Text>
                                            </View>
                                            <Text style={[s.langLabel, active && s.langLabelActive]}>{lang.label}</Text>
                                        </View>
                                        {active
                                            ? <Ionicons name="checkmark-circle" size={20} color={vg.primary} />
                                            : <View style={s.langRadio} />
                                        }
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── Sign Out ── */}
                    <TouchableOpacity style={s.signOutFullBtn} onPress={() => setLogoutVisible(true)}>
                        <Ionicons name="log-out-outline" size={16} color={vg.error} />
                        <Text style={[s.signOutFullText, { color: vg.error }]}>{t('signOut')}</Text>
                    </TouchableOpacity>

                    {/* ── Bottom row ── */}
                    <View style={s.bottomRow}>
                        <TouchableOpacity style={s.bottomBtn}>
                            <Ionicons name="notifications-outline" size={20} color={vg.textSub} />
                            <Text style={s.bottomBtnText}>{t('notifications')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.bottomBtn}>
                            <Ionicons name="ellipsis-horizontal-outline" size={20} color={vg.textSub} />
                            <Text style={s.bottomBtnText}>Placeholder ⊹ ࣪ ˖ ໒꒱ </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.bottomBtn}>
                            <Ionicons name="construct-outline" size={20} color={vg.textSub} />
                            <Text style={s.bottomBtnText}>Placeholder also :3</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>

            {/* ── Change password modal ── */}
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
                                {pwLoading
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={s.modalConfirmText}>{pwStep === 'verify' ? t('verify') : t('submit')}</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Logout confirmation modal ── */}
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

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20,
        backgroundColor: vg.glass,
        borderBottomWidth: 1, borderColor: vg.glassBorder,
    },
    headerIconBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: vg.primaryBtn,
        borderWidth: 1, borderColor: vg.glassBorder,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarWrap: { alignItems: 'center', marginLeft: 60 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: vg.avatarBg, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: vg.glassBorder },
    avatarText: { fontSize: 26, fontWeight: '700', color: '#fff' },
    signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: vg.primaryBtn, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9999 },
    signOutText: { fontSize: 13, fontWeight: '600', color: vg.primaryBtnText },

    // Main card
    card: {
        backgroundColor: vg.card,
        borderRadius: 28, borderWidth: 1, borderColor: vg.glassBorder,
        padding: 28, marginTop: 24, marginRight: '15%', marginLeft: '15%',
        shadowColor: '#420000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
    },

    // Identity
    identitySection: { alignItems: 'center', marginBottom: 28 },
    titleText: { fontSize: 26, fontWeight: '700', color: vg.primary, letterSpacing: -0.5, marginBottom: 4 },
    subtitleText: { fontSize: 14, color: vg.textSub, marginBottom: 14 },
    emailPill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: vg.pillBg, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999 },
    emailText: { fontSize: 13, fontWeight: '500', color: vg.primary },

    // Action grid — two separate card styles so they're independent
    actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 28, alignItems: 'flex-start' },

    // Fixed card — never changes height
    actionCardFixed: {
        flex: 1,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: vg.glass, borderWidth: 1, borderColor: vg.glassBorder,
        borderRadius: 18, padding: 18,
        height: 72, // locked height
    },

    // Expandable card wrap — grows with dropdown
    actionCardExpandWrap: { flex: 1 },
    actionCardExpand: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: vg.glass, borderWidth: 1, borderColor: vg.glassBorder,
        borderRadius: 18, padding: 18,
        height: 72, // same resting height as fixed card
    },

    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    actionIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: vg.pillBg, justifyContent: 'center', alignItems: 'center' },
    actionTitle: { fontSize: 14, fontWeight: '700', color: vg.primary, marginBottom: 2 },
    actionSub: { fontSize: 12, color: vg.textSub },

    // Theme dropdown
    themeDrop: { backgroundColor: vg.card, borderWidth: 1, borderColor: vg.glassBorder, borderRadius: 14, marginTop: 6, overflow: 'hidden' },
    themeOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderColor: vg.divider },
    themeOptionActive: { backgroundColor: vg.langActiveBg },
    themeOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    themeOptionText: { fontSize: 14, color: vg.textSub, fontWeight: '500' },
    themeOptionTextActive: { color: vg.primary, fontWeight: '700' },

    // Language
    langSection: { marginBottom: 28 },
    langHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    langHeaderText: { fontSize: 17, fontWeight: '600', color: vg.text },
    langList: { gap: 8 },
    langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: vg.glass, borderWidth: 1, borderColor: vg.glassBorder, borderRadius: 16, padding: 16 },
    langRowActive: { backgroundColor: vg.langActiveBg, borderColor: vg.langActiveBorder, borderWidth: 2 },
    langLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    langCode: { width: 34, height: 24, borderRadius: 5, backgroundColor: vg.divider, justifyContent: 'center', alignItems: 'center' },
    langCodeText: { fontSize: 10, fontWeight: '700', color: vg.textSub },
    langLabel: { fontSize: 14, fontWeight: '500', color: vg.text },
    langLabelActive: { fontWeight: '700', color: vg.primary },
    langRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: vg.glassBorder },

    // Bottom row — all three are now identical neutral style
    signOutFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginBottom: 16, borderRadius: 14, borderWidth: 1, borderColor: vg.error + '44', backgroundColor: vg.error + '10' },
    signOutFullText: { fontSize: 13, fontWeight: '700' },
    bottomRow: { flexDirection: 'row', gap: 10, paddingTop: 20, borderTopWidth: 1, borderColor: vg.divider },
    bottomBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: vg.glass, borderWidth: 1, borderColor: vg.glassBorder, borderRadius: 18, paddingVertical: 26, gap: 4, minWidth: 60 },
    bottomBtnText: { fontSize: 10, fontWeight: '700', color: vg.textSub, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' },

    // Modals
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
    modalBox: { backgroundColor: vg.modalBg, borderRadius: 20, padding: 24, width: W * 0.85, borderWidth: 1, borderColor: vg.glassBorder },
    modalTitle: { fontSize: 18, fontWeight: '700', color: vg.primary, marginBottom: 6 },
    modalBody: { fontSize: 14, color: vg.textSub, marginBottom: 18 },
    pwInput: { backgroundColor: vg.inputBg, borderWidth: 1, borderColor: vg.inputBorder, borderRadius: 12, padding: 14, fontSize: 14, color: vg.text, marginBottom: 10 },
    pwError: { fontSize: 12, color: vg.error, marginBottom: 8 },
    modalBtns: { flexDirection: 'row', gap: 10 },
    modalCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: vg.glassBorder, alignItems: 'center' },
    modalCancelText: { fontSize: 14, fontWeight: '600', color: vg.textSub },
    modalConfirm: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: vg.primaryBtn, alignItems: 'center' },
    modalConfirmText: { fontSize: 14, fontWeight: '700', color: vg.primaryBtnText },
});

export default FMSettings;