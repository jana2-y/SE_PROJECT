import React, { useState, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    Image, TextInput, ActivityIndicator, Alert,
    SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import SharedHeader from '../../components/SharedHeader';

const WorkerProof = () => {
    const router = useRouter();
    const { ticketId } = useLocalSearchParams();
    const { colors: c } = useTheme();
    const styles = useMemo(() => makeStyles(c), [c]);

    const [proofImage, setProofImage] = useState(null);
    const [workerNote, setWorkerNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const wordCount = workerNote.trim() ? workerNote.trim().split(/\s+/).filter(Boolean).length : 0;

    // ─── 1. FUNCTION: OPEN GALLERY DIRECTLY ─────────────────────────────────
    // Alert.alert before launchImageLibraryAsync breaks on web (browser blocks
    // the file picker because it's no longer a direct synchronous user gesture).
    const handleSelectImage = () => openPicker('gallery');

    // ─── 2. FUNCTION: PERMISSIONS & PICKING ──────────────────────────────────
    const openPicker = async (mode) => {
        try {
            const isCamera = mode === 'camera';
            const { status } = isCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Denied', `Please allow ${mode} access in Settings.`);
                return;
            }

            const result = isCamera
                ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, base64: true })
                : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7, base64: true });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                if (!asset.base64) {
                    Alert.alert('Error', 'Could not read image data. Please try a different photo.');
                    return;
                }
                setProofImage({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType || 'image/jpeg' });
            }
        } catch (err) {
            Alert.alert('Error', 'Could not open picker: ' + err.message);
        }
    };

    const handleSubmit = async () => {
        if (!proofImage) return Alert.alert('Error', 'Please provide a photo.');
        if (wordCount > 50) return Alert.alert('Error', 'Note is too long.');

        setSubmitting(true);
        try {
            await await api.post(`/worker/tickets/${ticketId}/submit-proof`, {
                image_base64: proofImage.base64,
                mime_type: proofImage.mimeType,
                worker_note: workerNote,
            });
            setSubmitted(true);
        } catch (err) {
            Alert.alert('Submission failed', err.message || 'Failed to submit.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <View style={styles.successScreen}>
                <Ionicons name="checkmark-circle" size={80} color={c.primary} />
                <Text style={styles.successTitle}>Job Completed!</Text>
                <Text style={styles.successSub}>Your proof is now under review.</Text>
                <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/worker/home')}>
                    <Text style={styles.doneBtnText}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <SharedHeader title="Proof of Work" onBack={() => router.back()} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll}>

                    <View style={styles.card}>
                        <Text style={styles.label}>Visual Proof</Text>

                        {/* ─── 3. UI ELEMENT: THE TAP AREA ────────────────────── */}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.imagePlaceholder}
                            onPress={handleSelectImage}
                        >
                            {proofImage ? (
                                <Image source={{ uri: proofImage.uri }} style={styles.previewImage} />
                            ) : (
                                <View pointerEvents="none" style={styles.placeholderContent}>
                                    <Ionicons name="camera-outline" size={48} color={c.textSub} />
                                    <Text style={styles.placeholderText}>Tap to take a photo or upload</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.label, { marginTop: 20 }]}>Worker Notes</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Briefly describe what you did..."
                            placeholderTextColor={c.textSub + '80'}
                            multiline
                            value={workerNote}
                            onChangeText={setWorkerNote}
                        />
                        <Text style={styles.wordCount}>{wordCount} / 50 words</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, (!proofImage || submitting) && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={!proofImage || submitting}
                    >
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Work</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const makeStyles = (c) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: { padding: 20 },
    card: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    label: { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 12 },
    imagePlaceholder: {
        width: '100%',
        height: 250,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: c.border,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderContent: { alignItems: 'center' },
    placeholderText: { color: c.textSub, marginTop: 8, fontSize: 13 },
    textArea: {
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 12,
        padding: 15,
        height: 100,
        color: c.text,
        textAlignVertical: 'top',
    },
    wordCount: { textAlign: 'right', fontSize: 11, color: c.textSub, marginTop: 5 },
    submitBtn: { backgroundColor: c.primary, borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    disabledBtn: { opacity: 0.5 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    successScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: c.bg },
    successTitle: { fontSize: 24, fontWeight: '800', color: c.text, marginTop: 20 },
    successSub: { fontSize: 15, color: c.textSub, textAlign: 'center', marginTop: 10 },
    doneBtn: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12, backgroundColor: c.primary },
    doneBtnText: { color: '#fff', fontWeight: '700' }
});

export default WorkerProof;