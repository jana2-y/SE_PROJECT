import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
    Modal,
} from 'react-native'; //gg
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../i18n';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LANG_OPTIONS = [
    { label: 'English', code: 'en', key: 'English' },
    { label: 'العربية', code: 'ar', key: 'Arabic' },
    { label: 'Deutsch', code: 'de', key: 'German' },
];

const { width } = Dimensions.get('window');

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const { t } = useTranslation();
    const { login } = useAuth();
    const [langModalVisible, setLangModalVisible] = useState(false);
    const [selectedLang, setSelectedLang] = useState('English');

    useEffect(() => {
        AsyncStorage.getItem('appLanguage').then(saved => {
            if (saved) {
                const match = LANG_OPTIONS.find(l => l.key === saved);
                if (match) {
                    setSelectedLang(match.key);
                    i18n.changeLanguage(match.code);
                }
            }
        });
    }, []);

    const handleSelectLang = async (opt) => {
        setSelectedLang(opt.key);
        await i18n.changeLanguage(opt.code);
        await AsyncStorage.setItem('appLanguage', opt.key);
        setLangModalVisible(false);
    };

    const handleLogin = async () => {
        setError('');
        if (!email || !password) {
            setError('Please fill out all fields.');
            return;
        }

        setLoading(true);
        try {
            const data = await api.login({ email, password });
            await login(data);
            const role = data.user.role;
            if (role === 'community_member') router.replace('/cm/home');
            else if (role === 'facility_manager') router.replace('/fm/dashboard');
            else if (role === 'worker') router.replace('/worker/home');
            else if (role === 'admin') router.replace('/admin/dashboard');
            else router.replace('/');
        } catch (err) {
            setError(err.message || 'Incorrect email or password.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#000428', '#004e92']}
                style={styles.gradient}
            >
                <>
                    <View style={styles.inner}>
                        <View style={styles.card}>
                            <View style={styles.header}>
                                <View style={styles.logoContainer}>
                                    <Ionicons name="business" size={40} color="#fff" />
                                </View>
                                <Text style={styles.title}>CampusCare®</Text>
                                <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('emailPlaceholder')}
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('passwordPlaceholder')}
                                    placeholderTextColor="#999"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>{t('loginBtn')}</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push('/signup')}>
                                <Text style={styles.linkText}>
                                    {t('noAccount')} <Text style={styles.linkTextBold}>{t('signUpLink')}</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Language selector */}
                        <TouchableOpacity style={styles.langSelector} onPress={() => setLangModalVisible(true)}>
                            <Text style={styles.langSelectorText}>
                                🌐 {LANG_OPTIONS.find(l => l.key === selectedLang)?.label}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Language modal */}
                    <Modal visible={langModalVisible} transparent animationType="fade" onRequestClose={() => setLangModalVisible(false)}>
                        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangModalVisible(false)}>
                            <View style={styles.modalBox}>
                                {LANG_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt.key}
                                        style={[styles.modalOption, selectedLang === opt.key && styles.modalOptionActive]}
                                        onPress={() => handleSelectLang(opt)}
                                    >
                                        <Text style={[styles.modalOptionText, selectedLang === opt.key && styles.modalOptionTextActive]}>
                                            {opt.label}
                                        </Text>
                                        {selectedLang === opt.key && <Text style={styles.modalOptionCheck}>✓</Text>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    inner: { alignItems: 'center', width: '100%' },
    card: {
        width: width * 0.9,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 25,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: { alignItems: 'center', marginBottom: 30 },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1a2a6c',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: { fontSize: 28, fontWeight: '800', color: '#1a2a6c', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#666' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        width: '100%',
        height: 55,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#333' },
    button: {
        backgroundColor: '#1a2a6c',
        width: '100%',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#1a2a6c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    errorText: { color: '#cc0000', fontSize: 13, marginBottom: 8, alignSelf: 'flex-start' },
    linkText: { marginTop: 20, color: '#666', fontSize: 14 },
    linkTextBold: { color: '#1a2a6c', fontWeight: 'bold' },
    langSelector: { marginTop: 16, alignSelf: 'flex-end', paddingRight: width * 0.05 },
    langSelectorText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
    modalBox: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', width: 200 },
    modalOption: { paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#f0f0f0' },
    modalOptionActive: { backgroundColor: '#f0f4ff' },
    modalOptionText: { fontSize: 15, color: '#333' },
    modalOptionTextActive: { color: '#1a2a6c', fontWeight: '700' },
    modalOptionCheck: { fontSize: 14, color: '#1a2a6c', fontWeight: '700' },
});

export default Login;
