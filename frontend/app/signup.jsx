// import React, { useState } from 'react'; //gg
// import {
//     View,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     StyleSheet,
//     Alert,
//     KeyboardAvoidingView,
//     Platform,
//     ActivityIndicator,
//     Dimensions,
//     ScrollView
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { Picker } from '@react-native-picker/picker';
// import api from '../services/api';

// const { width } = Dimensions.get('window');

// const Signup = () => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [role, setRole] = useState('community_member');
//     const [loading, setLoading] = useState(false);
//     const [showPassword, setShowPassword] = useState(false);

//     const router = useRouter();

//     const handleSignup = async () => {
//         if (!email || !password || !role) {
//             Alert.alert("Error", "Please fill in all fields");
//             return;
//         }

//         setLoading(true);
//         try {
//             await api.signup({ email, password, role });
//             Alert.alert("Success", "Account created successfully! Please login.");
//             router.replace('/login');
//         } catch (error) {
//             Alert.alert("Signup Failed", error.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <KeyboardAvoidingView
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//             style={styles.container}
//         >
//             <LinearGradient
//                 colors={['#000428', '#004e92']}
//                 style={styles.gradient}
//             >
//                 <ScrollView contentContainerStyle={styles.scrollContent}>
//                     <View style={styles.card}>
//                         <View style={styles.header}>
//                             <View style={styles.logoContainer}>
//                                 <Ionicons name="person-add" size={40} color="#fff" />
//                             </View>
//                             <Text style={styles.title}>Create Account</Text>
//                             <Text style={styles.subtitle}>Join the GIU Facility Management</Text>
//                         </View>

//                         <View style={styles.inputContainer}>
//                             <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
//                             <TextInput
//                                 style={styles.input}
//                                 placeholder="GIU Email"
//                                 placeholderTextColor="#999"
//                                 value={email}
//                                 onChangeText={setEmail}
//                                 autoCapitalize="none"
//                                 keyboardType="email-address"
//                             />
//                         </View>

//                         <View style={styles.inputContainer}>
//                             <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
//                             <TextInput
//                                 style={styles.input}
//                                 placeholder="Password"
//                                 placeholderTextColor="#999"
//                                 secureTextEntry={!showPassword}
//                                 value={password}
//                                 onChangeText={setPassword}
//                             />
//                             <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
//                                 <Ionicons
//                                     name={showPassword ? "eye-off-outline" : "eye-outline"}
//                                     size={20}
//                                     color="#666"
//                                 />
//                             </TouchableOpacity>
//                         </View>

//                         <Text style={styles.label}>Identify as:</Text>
//                         <View style={styles.pickerContainer}>
//                             <Picker
//                                 selectedValue={role}
//                                 onValueChange={(itemValue) => setRole(itemValue)}
//                                 style={styles.picker}
//                             >
//                                 <Picker.Item label="Community Member" value="community_member" />
//                                 <Picker.Item label="Worker" value="worker" />
//                                 <Picker.Item label="Facility Manager" value="facility_manager" />
//                             </Picker>
//                         </View>

//                         <TouchableOpacity
//                             style={[styles.button, loading && styles.buttonDisabled]}
//                             onPress={handleSignup}
//                             disabled={loading}
//                         >
//                             {loading ? (
//                                 <ActivityIndicator color="#fff" />
//                             ) : (
//                                 <Text style={styles.buttonText}>Sign Up</Text>
//                             )}
//                         </TouchableOpacity>

//                         <TouchableOpacity onPress={() => router.push('/login')}>
//                             <Text style={styles.linkText}>
//                                 Already have an account? <Text style={styles.linkTextBold}>Login</Text>
//                             </Text>
//                         </TouchableOpacity>
//                     </View>
//                 </ScrollView>
//             </LinearGradient>
//         </KeyboardAvoidingView>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1 },
//     gradient: { flex: 1 },
//     scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
//     card: {
//         width: width * 0.9,
//         backgroundColor: 'rgba(255, 255, 255, 0.95)',
//         borderRadius: 25,
//         padding: 30,
//         alignItems: 'center',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 10 },
//         shadowOpacity: 0.3,
//         shadowRadius: 20,
//         elevation: 10,
//     },
//     header: { alignItems: 'center', marginBottom: 25 },
//     logoContainer: {
//         width: 80,
//         height: 80,
//         borderRadius: 40,
//         backgroundColor: '#004e92',
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginBottom: 15,
//     },
//     title: { fontSize: 28, fontWeight: '800', color: '#004e92', marginBottom: 5 },
//     subtitle: { fontSize: 14, color: '#666' },
//     inputContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#f5f5f5',
//         borderRadius: 12,
//         paddingHorizontal: 15,
//         marginBottom: 15,
//         width: '100%',
//         height: 55,
//         borderWidth: 1,
//         borderColor: '#e0e0e0',
//     },
//     inputIcon: { marginRight: 10 },
//     input: { flex: 1, fontSize: 16, color: '#333' },
//     label: { alignSelf: 'flex-start', marginLeft: 5, marginBottom: 8, color: '#666', fontWeight: '600' },
//     pickerContainer: {
//         width: '100%',
//         backgroundColor: '#f5f5f5',
//         borderRadius: 12,
//         marginBottom: 20,
//         borderWidth: 1,
//         borderColor: '#e0e0e0',
//         overflow: 'hidden'
//     },
//     picker: { width: '100%', height: 55 },
//     button: {
//         backgroundColor: '#004e92',
//         width: '100%',
//         height: 55,
//         borderRadius: 12,
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginTop: 10,
//         shadowColor: '#004e92',
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.3,
//         shadowRadius: 8,
//         elevation: 5,
//     },
//     buttonDisabled: { opacity: 0.7 },
//     buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
//     linkText: { marginTop: 20, color: '#666', fontSize: 14 },
//     linkTextBold: { color: '#004e92', fontWeight: 'bold' }
// });

// export default Signup;


import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
    Dimensions, ScrollView, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../i18n';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const LANG_OPTIONS = [
    { label: 'English', code: 'en', key: 'English' },
    { label: 'العربية', code: 'ar', key: 'Arabic'  },
    { label: 'Deutsch', code: 'de', key: 'German'  },
];


const { width } = Dimensions.get('window');

const domainLabels = {
    CM_STUDENT: '@student.giu-uni.de',
    CM_STAFF: '@giu-uni.de',
    WORKER: '@worker.giu-uni.de',
    FM: '@manager.giu-uni.de',
};

const Signup = () => {
    const [fullName, setFullName] = useState('');
    const [emailLocal, setEmailLocal] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('select role');
    const [cmRole, setCmRole] = useState('select');
    const [major, setMajor] = useState('select major');
    const [department, setDepartment] = useState('select department');
    const [specialty, setSpecialty] = useState('');
    const [yearsExperience, setYearsExperience] = useState('');
    const [loading, setLoading] = useState(false);
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passError, setPassError] = useState('');
    const [majorError, setMajorError] = useState('');
    const [specialtyError, setSpecialtyError] = useState('');

    const router = useRouter();
    const { t } = useTranslation();
    const [langModalVisible, setLangModalVisible] = useState(false);
    const [selectedLang, setSelectedLang] = useState('English');

    useEffect(() => {
        AsyncStorage.getItem('appLanguage').then(saved => {
            if (saved) {
                const match = LANG_OPTIONS.find(l => l.key === saved);
                if (match) { setSelectedLang(match.key); i18n.changeLanguage(match.code); }
            }
        });
    }, []);

    const handleSelectLang = async (opt) => {
        setSelectedLang(opt.key);
        await i18n.changeLanguage(opt.code);
        await AsyncStorage.setItem('appLanguage', opt.key);
        setLangModalVisible(false);
    };

    const getDomain = () => {
        if (role === 'community_member') return cmRole === 'student' ? domainLabels.CM_STUDENT : domainLabels.CM_STAFF;
        if (role === 'worker') return domainLabels.WORKER;
        if (role === 'facility_manager') return domainLabels.FM;
        return '';
    };

    const handleSignup = async () => {
        // reset all errors first
        setNameError('');
        setEmailError('');
        setPassError('');
        setMajorError('');
        setSpecialtyError('');

        let hasError = false;

        if (!fullName.trim()) {
            setNameError(t('errFullName'));
            hasError = true;
        }
        if (!emailLocal.trim()) {
            setEmailError(t('errEmailUsername'));
            hasError = true;
        }
        if (!password) {
            setPassError(t('errPassword'));
            hasError = true;
        }
        if (password && password.length < 6) {
            setPassError(t('errPasswordLength'));
            hasError = true;
        }
        if (role === 'community_member' && cmRole === 'student' && major === 'select major') {
            setMajorError(t('errMajor'));
            hasError = true;
        }
        if (role === 'community_member' && cmRole === 'staff' && department === 'select department') {
            setMajorError(t('errDepartment'));
            hasError = true;
        }
        if (role === 'worker' && !specialty) {
            setSpecialtyError(t('errSpecialty'));
            hasError = true;
        }

        if (hasError) return;

        const fullEmail = emailLocal + getDomain();

        setLoading(true);
        try {
            await api.signup({
                full_name: fullName,
                email: fullEmail,
                password,
                role,
                cm_role: role === 'community_member' ? cmRole : undefined,
                major: role === 'community_member' && cmRole === 'student' ? major : undefined,
                department: role === 'community_member' && cmRole === 'staff' ? department : undefined,
                specialty: role === 'worker' ? specialty : undefined,
                years_experience: role === 'worker' && yearsExperience ? parseInt(yearsExperience, 10) : undefined,
            });
            Alert.alert(
                t('accountCreatedTitle'),
                t('accountCreatedBody'),
                [{ text: t('goToLogin'), onPress: () => router.replace('/login') }]
            );
        } catch (error) {
            const msg = error.message || '';
            if (msg.toLowerCase().includes('email')) {
                setEmailError(msg);
            } else if (msg.toLowerCase().includes('password')) {
                setPassError(msg);
            } else if (msg.toLowerCase().includes('name')) {
                setNameError(msg);
            } else {
                Alert.alert(t('signupFailed'), msg);
            }
        } finally {
            setLoading(false);
        }
    };
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient colors={['#000428', '#004e92']} style={styles.gradient}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>

                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <Ionicons name="person-add" size={40} color="#fff" />
                            </View>
                            <Text style={styles.title}>{t('createAccount')}</Text>
                            <Text style={styles.subtitle}>{t('joinSubtitle')}</Text>
                        </View>

                        {/* full name */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('fullNamePlaceholder')}
                                placeholderTextColor="#999"
                                value={fullName}
                                onChangeText={(t) => { setFullName(t); setNameError(''); }}
                            />
                        </View>
                        {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}

                        {/* role picker */}
                        <Text style={styles.label}>{t('roleLabel')}</Text>
                        <View style={styles.pickerContainer}>
                            <Picker selectedValue={role} onValueChange={setRole} style={styles.picker}>
                                <Picker.Item label={t('selectRole')} value="" />
                                <Picker.Item label="Community Member" value="community_member" />
                                <Picker.Item label="Worker" value="worker" />
                                <Picker.Item label="Facility Manager" value="facility_manager" />
                            </Picker>
                        </View>

                        {/* cm_role picker — only if CM */}
                        {role === 'community_member' && (
                            <>
                                <Text style={styles.label}>{t('iAmA')}</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker selectedValue={cmRole} onValueChange={setCmRole} style={styles.picker}>
                                        <Picker.Item label={t('selectCmRole')} value="" />
                                        <Picker.Item label="Student" value="student" />
                                        <Picker.Item label="Staff" value="staff" />
                                    </Picker>
                                </View>
                            </>
                        )}

                        {/* major — only if CM student */}
                        {role === 'community_member' && cmRole === 'student' && (
                            <>
                                <Text style={styles.label}>Major</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker selectedValue={major} onValueChange={(v) => { setMajor(v); setMajorError(''); }} style={styles.picker}>
                                        <Picker.Item label="Select Major" value="" />
                                        <Picker.Item label="Biotechnology" value="Biotechnology" />
                                        <Picker.Item label="Physical Therapy" value="Physical Therapy" />
                                        <Picker.Item label="Business Administration" value="Business Administration" />
                                        <Picker.Item label="Business Informatics" value="Business Informatics" />
                                        <Picker.Item label="Computer Science" value="Computer Science" />
                                        <Picker.Item label="Architecture" value="Architecture" />
                                        <Picker.Item label="Engineering" value="Engineering" />
                                        <Picker.Item label="Design" value="Design" />
                                        <Picker.Item label="Pharmaceutical Engineering" value="Pharmaceutical Engineering" />
                                    </Picker>
                                </View>
                                {majorError ? <Text style={styles.fieldError}>{majorError}</Text> : null}
                            </>
                        )}

                        {/* department — only if CM staff */}
                        {role === 'community_member' && cmRole === 'staff' && (
                            <>
                                <Text style={styles.label}>Department</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker selectedValue={department} onValueChange={(v) => { setDepartment(v); setMajorError(''); }} style={styles.picker}>
                                        <Picker.Item label="Select Department" value="" />
                                        <Picker.Item label="English" value="English" />
                                        <Picker.Item label="German" value="German" />
                                        <Picker.Item label="Management" value="Management" />
                                        <Picker.Item label="Security" value="Security" />
                                        <Picker.Item label="Biotechnology" value="Biotechnology" />
                                        <Picker.Item label="Physical Therapy" value="Physical Therapy" />
                                        <Picker.Item label="Business Administration" value="Business Administration" />
                                        <Picker.Item label="Business Informatics" value="Business Informatics" />
                                        <Picker.Item label="Computer Science" value="Computer Science" />
                                        <Picker.Item label="Architecture" value="Architecture" />
                                        <Picker.Item label="Engineering" value="Engineering" />
                                        <Picker.Item label="Design" value="Design" />
                                        <Picker.Item label="Pharmaceutical Engineering" value="Pharmaceutical Engineering" />
                                    </Picker>
                                </View>
                                {majorError ? <Text style={styles.fieldError}>{majorError}</Text> : null}
                            </>
                        )}

                        {/* specialty + years experience — only if worker */}
                        {role === 'worker' && (
                            <>
                                <Text style={styles.label}>Specialty</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker selectedValue={specialty} onValueChange={(v) => { setSpecialty(v); setSpecialtyError(''); }} style={styles.picker}>
                                        <Picker.Item label="Select Specialty" value="" />
                                        <Picker.Item label="Electrical Technician" value="Electrical Technician" />
                                        <Picker.Item label="Plumber" value="Plumber" />
                                        <Picker.Item label="HVAC Technician" value="HVAC Technician" />
                                        <Picker.Item label="Cleaner/ Housekeeping Staff" value="Cleaner/ Housekeeping Staff" />
                                        <Picker.Item label="IT Support" value="IT Support" />
                                        <Picker.Item label="Facilities Technician" value="Facilities Technician" />
                                        <Picker.Item label="Groundskeeper" value="Groundskeeper" />
                                    </Picker>
                                </View>
                                {specialtyError ? <Text style={styles.fieldError}>{specialtyError}</Text> : null}

                                <Text style={styles.label}>Years of Experience</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="briefcase-outline" size={20} color="#666" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 3"
                                        placeholderTextColor="#999"
                                        value={yearsExperience}
                                        onChangeText={(t) => setYearsExperience(t.replace(/[^0-9]/g, ''))}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </>
                        )}

                        {/* email with domain prefix label */}
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('usernamePlaceholder')}
                                placeholderTextColor="#999"
                                value={emailLocal}
                                onChangeText={(text) => {
                                    if (text.includes('@')) return;
                                    setEmailLocal(text);
                                    setEmailError('');
                                }}
                                autoCapitalize="none"
                            />
                            <Text style={styles.domainLabel}>{getDomain()}</Text>
                        </View>
                        {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
                        {emailLocal.length > 0 && (
                            <Text style={styles.domainHint}>
                                Domain is already included — just type your username
                            </Text>
                        )}

                        {/* password */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('passwordPlaceholder')}
                                placeholderTextColor="#999"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={(t) => { setPassword(t); setPassError(''); }}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20} color="#666"
                                />
                            </TouchableOpacity>
                        </View>
                        {passError ? <Text style={styles.fieldError}>{passError}</Text> : null}

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.buttonText}>{t('signUpBtn')}</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text style={styles.linkText}>
                                {t('alreadyHaveAccount')}{' '}
                                <Text style={styles.linkTextBold}>{t('loginLink')}</Text>
                            </Text>
                        </TouchableOpacity>

                    </View>

                    {/* Language selector */}
                    <TouchableOpacity style={styles.langSelector} onPress={() => setLangModalVisible(true)}>
                        <Text style={styles.langSelectorText}>
                            🌐 {LANG_OPTIONS.find(l => l.key === selectedLang)?.label}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

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
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
    card: {
        width: width * 0.9,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 25,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: { alignItems: 'center', marginBottom: 25 },
    logoContainer: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#004e92',
        justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    },
    title: { fontSize: 28, fontWeight: '800', color: '#004e92', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#666' },
    label: { alignSelf: 'flex-start', marginLeft: 5, marginBottom: 6, color: '#666', fontWeight: '600' },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f5f5f5', borderRadius: 12,
        paddingHorizontal: 15, marginBottom: 15,
        width: '100%', height: 55,
        borderWidth: 1, borderColor: '#e0e0e0',
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#333' },
    domainLabel: { fontSize: 12, color: '#888', flexShrink: 0 },
    pickerContainer: {
        width: '100%', backgroundColor: '#f5f5f5',
        borderRadius: 12, marginBottom: 15,
        borderWidth: 1, borderColor: '#e0e0e0', overflow: 'hidden',
    },
    picker: { width: '100%', height: 55 },
    button: {
        backgroundColor: '#004e92', width: '100%', height: 55,
        borderRadius: 12, justifyContent: 'center', alignItems: 'center',
        marginTop: 10, elevation: 5,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    linkText: { marginTop: 20, color: '#666', fontSize: 14 },
    linkTextBold: { color: '#004e92', fontWeight: 'bold' },
    fieldError: {
        alignSelf: 'flex-start',
        color: '#cc0000',
        fontSize: 11,
        marginTop: -10,
        marginBottom: 8,
        marginLeft: 4,
    },
    domainHint: {
        alignSelf: 'flex-start',
        color: '#888',
        fontSize: 11,
        marginTop: -10,
        marginBottom: 10,
        marginLeft: 4,
    },
    langSelector: { alignSelf: 'flex-end', paddingRight: width * 0.05, paddingVertical: 12 },
    langSelectorText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
    modalBox: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', width: 200 },
    modalOption: { paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#f0f0f0' },
    modalOptionActive: { backgroundColor: '#f0f4ff' },
    modalOptionText: { fontSize: 15, color: '#333' },
    modalOptionTextActive: { color: '#004e92', fontWeight: '700' },
    modalOptionCheck: { fontSize: 14, color: '#004e92', fontWeight: '700' },
});

export default Signup;