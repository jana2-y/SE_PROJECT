import React, { useState, useEffect } from 'react';
import {
    View, Text, Modal, ScrollView, TouchableOpacity,
    TextInput, Image, StyleSheet, ActivityIndicator, Alert,
    Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '../../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FeedbackModal = ({ visible, ticketId, token, onClose }) => {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [newDeadline, setNewDeadline] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        if (!visible || !ticketId) return;
        setAction(null);
        setFeedbackText('');
        setNewDeadline('');

        const fetchTicket = async () => {
            setLoading(true);
            try {
                const data = await api.get(`/fm/tickets/${ticketId}`, token);
                setTicket(data);
            } catch (err) {
                Alert.alert('Error', err.message);
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [visible, ticketId]);

    const wordCount = feedbackText.trim()
        ? feedbackText.trim().split(/\s+/).length : 0;

    const isSubmitDisabled =
        !action ||
        (action === 'reject' && !feedbackText.trim()) ||
        (action === 'reject' && !newDeadline) ||
        wordCount > 50;

    const handleSubmit = async () => {
        if (isSubmitDisabled) {
            if (action === 'reject' && !feedbackText.trim()) {
                setShowTooltip(true);
                setTimeout(() => setShowTooltip(false), 2500);
            }
            return;
        }

        setSubmitting(true);
        try {
            await api.patch(`/fm/tickets/${ticketId}/feedback`, {
                action,
                feedback_text: feedbackText.trim() || undefined,
                new_deadline: action === 'reject'
                    ? new Date(newDeadline).toISOString()
                    : undefined,
            }, token);

            Alert.alert(
                action === 'accept' ? 'Ticket completed' : 'Ticket reassigned',
                action === 'accept'
                    ? 'Marked as completed successfully.'
                    : 'Ticket reassigned with your feedback.',
                [{ text: 'OK', onPress: onClose }]
            );
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const assignment = ticket?.assignments?.[0];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={styles.sheet}>
                    {/* Drag handle */}
                    <View style={styles.handle} />

                    {loading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color="#0078D4" />
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.scroll}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Ticket details — top ~1/5 */}
                            <View style={styles.ticketDetails}>
                                <View style={styles.ticketDetailsRow}>
                                    <Text style={styles.detailsCategory}>
                                        {ticket?.category?.toUpperCase()}
                                    </Text>
                                    <TouchableOpacity onPress={onClose}>
                                        <Text style={styles.closeX}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.detailsLocation}>
                                    {[ticket?.area, ticket?.building, ticket?.floor, ticket?.specific_location]
                                        .filter(Boolean).join(' · ')}
                                </Text>
                                <Text style={styles.detailsDescription} numberOfLines={3}>
                                    {ticket?.description}
                                </Text>
                            </View>

                            {/* Proof container — ~2/3 of modal */}
                            <View style={styles.proofContainer}>
                                <View style={styles.proofRow}>
                                    {/* Worker proof image — just under half width */}
                                    <View style={styles.proofImageWrap}>
                                        {assignment?.proof_url ? (
                                            <Image
                                                source={{ uri: assignment.proof_url }}
                                                style={styles.proofImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={[styles.proofImage, styles.proofImagePlaceholder]}>
                                                <Text style={styles.placeholderText}>No image</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Worker text description — top-right, aligned to top of image */}
                                    <View style={styles.proofTextWrap}>
                                        <Text style={styles.proofTextLabel}>Worker's note</Text>
                                        <ScrollView
                                            style={styles.proofTextScroll}
                                            nestedScrollEnabled
                                        >
                                            <Text style={styles.proofTextContent}>
                                                {assignment?.feedback || 'No description provided.'}
                                            </Text>
                                        </ScrollView>
                                    </View>
                                </View>

                                {/* Accept / Reject */}
                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.acceptBtn,
                                            action === 'accept' && styles.acceptBtnActive
                                        ]}
                                        onPress={() => { setAction('accept'); setFeedbackText(''); }}
                                    >
                                        <Text style={[
                                            styles.acceptBtnText,
                                            action === 'accept' && styles.acceptBtnTextActive
                                        ]}>
                                            Accept
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.rejectBtn,
                                            action === 'reject' && styles.rejectBtnActive
                                        ]}
                                        onPress={() => { setAction('reject'); setFeedbackText(''); }}
                                    >
                                        <Text style={[
                                            styles.rejectBtnText,
                                            action === 'reject' && styles.rejectBtnTextActive
                                        ]}>
                                            Reject
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Feedback input */}
                                {action && (
                                    <View style={styles.feedbackWrap}>
                                        <View style={styles.feedbackLabelRow}>
                                            <Text style={styles.feedbackLabel}>
                                                {action === 'reject'
                                                    ? 'Reason for rejection'
                                                    : 'Add a note (optional)'}
                                            </Text>
                                            {action === 'reject' && (
                                                <Text style={styles.requiredTag}>Required</Text>
                                            )}
                                            <Text style={[
                                                styles.wordCount,
                                                wordCount > 50 && styles.wordCountOver
                                            ]}>
                                                {wordCount}/50
                                            </Text>
                                        </View>

                                        <TextInput
                                            style={[
                                                styles.feedbackInput,
                                                wordCount > 50 && styles.feedbackInputOver
                                            ]}
                                            placeholder={
                                                action === 'reject'
                                                    ? 'Enter reason for rejection...'
                                                    : 'Optional note for worker...'
                                            }
                                            placeholderTextColor="#9CA3AF"
                                            multiline
                                            value={feedbackText}
                                            onChangeText={setFeedbackText}
                                        />

                                        {action === 'reject' && (
                                            <View style={styles.deadlineWrap}>
                                                <Text style={styles.feedbackLabel}>New Deadline</Text>
                                                <TextInput
                                                    style={styles.deadlineInput}
                                                    placeholder="YYYY-MM-DD"
                                                    placeholderTextColor="#9CA3AF"
                                                    value={newDeadline}
                                                    onChangeText={setNewDeadline}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>

                            <View style={{ height: 24 }} />
                        </ScrollView>
                    )}

                    {/* Submit button — outside inner container, inside outer modal */}
                    {action && !loading && (
                        <View style={styles.footer}>
                            {showTooltip && (
                                <Text style={styles.tooltip}>
                                    Enter reason for rejection in feedback section first
                                </Text>
                            )}
                            <TouchableOpacity
                                style={[
                                    styles.submitBtn,
                                    isSubmitDisabled && styles.submitBtnDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={submitting}
                                activeOpacity={isSubmitDisabled ? 1 : 0.8}
                            >
                                {submitting
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.submitBtnText}>Submit</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: SCREEN_HEIGHT * 0.92,
        paddingBottom: 24,
    },
    handle: { width: 40, height: 4, backgroundColor: '#E5E5E5', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    centered: { height: 200, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 16 },
    ticketDetails: { paddingVertical: 16, borderBottomWidth: 1, borderColor: '#F3F3F3', marginBottom: 16 },
    ticketDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    detailsCategory: { fontSize: 11, fontWeight: '700', color: '#0078D4', letterSpacing: 1 },
    closeX: { fontSize: 16, color: '#717783', padding: 4 },
    detailsLocation: { fontSize: 13, color: '#404752', marginBottom: 6 },
    detailsDescription: { fontSize: 14, color: '#181C22', lineHeight: 20 },
    proofContainer: { backgroundColor: '#F9F9F9', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', padding: 14 },
    proofRow: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-start' },
    proofImageWrap: { width: '46%' },
    proofImage: { width: '100%', aspectRatio: 1, borderRadius: 6, backgroundColor: '#E5E5E5' },
    proofImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: '#717783', fontSize: 12 },
    proofTextWrap: { flex: 1 },
    proofTextLabel: { fontSize: 10, fontWeight: '600', color: '#717783', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
    proofTextScroll: { maxHeight: 160 },
    proofTextContent: { fontSize: 13, color: '#404752', lineHeight: 18 },
    actionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    acceptBtn: { flex: 1, paddingVertical: 11, borderRadius: 4, borderWidth: 1.5, borderColor: '#059669', alignItems: 'center' },
    acceptBtnActive: { backgroundColor: '#059669' },
    acceptBtnText: { fontSize: 14, fontWeight: '700', color: '#059669' },
    acceptBtnTextActive: { color: '#fff' },
    rejectBtn: { flex: 1, paddingVertical: 11, borderRadius: 4, borderWidth: 1.5, borderColor: '#DC2626', alignItems: 'center' },
    rejectBtnActive: { backgroundColor: '#DC2626' },
    rejectBtnText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
    rejectBtnTextActive: { color: '#fff' },
    feedbackWrap: { marginTop: 4 },
    feedbackLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
    feedbackLabel: { fontSize: 13, fontWeight: '600', color: '#181C22', flex: 1 },
    requiredTag: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
    wordCount: { fontSize: 11, color: '#717783' },
    wordCountOver: { color: '#DC2626' },
    feedbackInput: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 4, padding: 10, fontSize: 13, color: '#181C22', minHeight: 80, textAlignVertical: 'top', backgroundColor: '#fff' },
    feedbackInputOver: { borderColor: '#DC2626' },
    deadlineWrap: { marginTop: 12 },
    deadlineInput: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 4, padding: 10, fontSize: 13, color: '#181C22', backgroundColor: '#fff', marginTop: 6 },
    footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderColor: '#F3F3F3' },
    tooltip: { fontSize: 12, color: '#DC2626', marginBottom: 8, textAlign: 'center' },
    submitBtn: { backgroundColor: '#0078D4', paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
    submitBtnDisabled: { backgroundColor: '#9CA3AF' },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default FeedbackModal;