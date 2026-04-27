import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, Modal, ScrollView, TouchableOpacity,
    TextInput, Image, StyleSheet, ActivityIndicator, Alert,
    Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FeedbackModal = ({ visible, ticketId, token, onClose }) => {
    const { colors: c } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => makeStyles(c), [c]);

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [newDeadline, setNewDeadline] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

    useEffect(() => {
        if (!visible || !ticketId) return;
        setAction(null);
        setFeedbackText('');
        setNewDeadline(new Date());
        setShowDatePicker(false);

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
                new_deadline: action === 'reject' ? newDeadline.toISOString() : undefined,
            }, token);

            onClose();
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const assignment = ticket?.assignments?.[0];

    return (
        <>
            <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
                <KeyboardAvoidingView
                    style={styles.overlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                    <View style={styles.sheet}>
                        <View style={styles.handle} />

                        {loading ? (
                            <View style={styles.centered}>
                                <ActivityIndicator size="large" color={c.primary} />
                            </View>
                        ) : (
                            <ScrollView
                                style={styles.scroll}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Ticket details */}
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
                                        {[ticket?.area, ticket?.floor, ticket?.specific_location]
                                            .filter(Boolean).join(' · ')}
                                    </Text>
                                    <View style={styles.descriptionRow}>
                                        <Text style={styles.detailsDescription} numberOfLines={3}>
                                            {ticket?.description}
                                        </Text>
                                        {ticket?.image_url && (
                                            <TouchableOpacity onPress={() => setImagePreviewVisible(true)}>
                                                <Image
                                                    source={{ uri: ticket.image_url }}
                                                    style={styles.ticketThumb}
                                                    resizeMode="cover"
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                {/* Proof container */}
                                <View style={styles.proofContainer}>
                                    <View style={styles.proofRow}>
                                        {/* Proof image */}
                                        <View style={styles.proofImageWrap}>
                                            {assignment?.proof_url ? (
                                                <Image
                                                    source={{ uri: assignment.proof_url }}
                                                    style={styles.proofImage}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View style={[styles.proofImage, styles.proofImagePlaceholder]}>
                                                    <Text style={styles.placeholderText}>{t('noImage')}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Right column: worker note + actions */}
                                        <View style={styles.proofTextWrap}>
                                            <Text style={styles.proofTextLabel}>{t('workersNote')}</Text>
                                            <ScrollView style={styles.proofTextScroll} nestedScrollEnabled>
                                                <Text style={styles.proofTextContent}>
                                                    {assignment?.worker_note || t('noDescription')}
                                                </Text>
                                            </ScrollView>

                                            {/* Accept / Reject */}
                                            <View style={styles.actionRow}>
                                                <TouchableOpacity
                                                    style={[styles.acceptBtn, action === 'accept' && styles.acceptBtnActive]}
                                                    onPress={() => { setAction('accept'); setFeedbackText(''); }}
                                                >
                                                    <Text style={[styles.acceptBtnText, action === 'accept' && styles.acceptBtnTextActive]}>
                                                        {t('accept')}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.rejectBtn, action === 'reject' && styles.rejectBtnActive]}
                                                    onPress={() => { setAction('reject'); setFeedbackText(''); }}
                                                >
                                                    <Text style={[styles.rejectBtnText, action === 'reject' && styles.rejectBtnTextActive]}>
                                                        {t('reject')}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>

                                            {/* Feedback input */}
                                            {action && (
                                                <View style={styles.feedbackWrap}>
                                                    <View style={styles.feedbackLabelRow}>
                                                        <Text style={styles.feedbackLabel}>
                                                            {action === 'reject' ? t('rejectionReason') : t('optionalNote')}
                                                        </Text>
                                                        {action === 'reject' && (
                                                            <Text style={styles.requiredTag}>{t('required')}</Text>
                                                        )}
                                                        <Text style={[styles.wordCount, wordCount > 50 && styles.wordCountOver]}>
                                                            {wordCount}/50
                                                        </Text>
                                                    </View>

                                                    <TextInput
                                                        style={[styles.feedbackInput, wordCount > 50 && styles.feedbackInputOver]}
                                                        placeholder={action === 'reject' ? t('rejectionPlaceholder') : t('optionalNotePlaceholder')}
                                                        placeholderTextColor={c.textSub}
                                                        multiline
                                                        value={feedbackText}
                                                        onChangeText={setFeedbackText}
                                                    />

                                                    {action === 'reject' && (
                                                        <View style={styles.deadlineWrap}>
                                                            <Text style={styles.feedbackLabel}>{t('newDeadline')}</Text>
                                                            {Platform.OS === 'web' ? (
                                                                <input
                                                                    type="date"
                                                                    value={newDeadline.toISOString().split('T')[0]}
                                                                    min={new Date().toISOString().split('T')[0]}
                                                                    onChange={e => e.target.value && setNewDeadline(new Date(e.target.value))}
                                                                    style={{
                                                                        marginTop: 6, padding: 10, borderRadius: 4,
                                                                        border: '1px solid #9CA3AF',
                                                                        backgroundColor: c.inputBg, color: c.text,
                                                                        fontSize: 13, width: '100%', boxSizing: 'border-box',
                                                                        cursor: 'pointer',
                                                                    }}
                                                                />
                                                            ) : (
                                                                <>
                                                                    <TouchableOpacity
                                                                        style={styles.deadlinePicker}
                                                                        onPress={() => setShowDatePicker(true)}
                                                                    >
                                                                        <Text style={styles.deadlinePickerText}>
                                                                            {newDeadline.toLocaleDateString('en-GB', {
                                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                                            })}
                                                                        </Text>
                                                                        <Text style={styles.deadlinePickerIcon}>📅</Text>
                                                                    </TouchableOpacity>
                                                                    {showDatePicker && (
                                                                        <DateTimePicker
                                                                            value={newDeadline}
                                                                            mode="date"
                                                                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                                                            minimumDate={new Date()}
                                                                            onChange={(_, date) => {
                                                                                setShowDatePicker(Platform.OS === 'ios');
                                                                                if (date) setNewDeadline(date);
                                                                            }}
                                                                        />
                                                                    )}
                                                                </>
                                                            )}
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <View style={{ height: 24 }} />
                            </ScrollView>
                        )}

                        {action && !loading && (
                            <View style={styles.footer}>
                                {showTooltip && (
                                    <Text style={styles.tooltip}>{t('tooltipReject')}</Text>
                                )}
                                <TouchableOpacity
                                    style={[styles.submitBtn, isSubmitDisabled && styles.submitBtnDisabled]}
                                    onPress={handleSubmit}
                                    disabled={submitting}
                                    activeOpacity={isSubmitDisabled ? 1 : 0.8}
                                >
                                    {submitting
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={styles.submitBtnText}>{t('submit')}</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={imagePreviewVisible} transparent animationType="fade" onRequestClose={() => setImagePreviewVisible(false)}>
                <TouchableOpacity style={styles.previewOverlay} activeOpacity={1} onPress={() => setImagePreviewVisible(false)}>
                    <Image
                        source={{ uri: ticket?.image_url }}
                        style={styles.previewImage}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const makeStyles = (c) => StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: { backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: SCREEN_HEIGHT * 0.92, paddingBottom: 24 },
    handle: { width: 40, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    centered: { height: 200, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 16 },
    ticketDetails: { paddingVertical: 16, borderBottomWidth: 1, borderColor: c.border, marginBottom: 16 },
    ticketDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    detailsCategory: { fontSize: 11, fontWeight: '700', color: c.primary, letterSpacing: 1 },
    closeX: { fontSize: 16, color: c.textSub, padding: 4 },
    detailsLocation: { fontSize: 13, color: c.textMid, marginBottom: 6 },
    descriptionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    detailsDescription: { fontSize: 14, color: c.text, lineHeight: 20, flexShrink: 1 },
    ticketThumb: { width: 80, height: 80, borderRadius: 6 },
    proofContainer: { backgroundColor: c.card, borderRadius: 8, borderWidth: 1, borderColor: c.border, padding: 14 },
    proofRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    proofImageWrap: { width: '46%' },
    proofImage: { width: '100%', aspectRatio: 1, borderRadius: 6, backgroundColor: c.border },
    proofImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: c.textSub, fontSize: 12 },
    proofTextWrap: { flex: 1 },
    proofTextLabel: { fontSize: 10, fontWeight: '600', color: c.textSub, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
    proofTextScroll: { maxHeight: 80 },
    proofTextContent: { fontSize: 13, color: c.textMid, lineHeight: 18 },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 10 },
    acceptBtn: { flex: 1, paddingVertical: 11, borderRadius: 4, borderWidth: 1.5, borderColor: c.success, alignItems: 'center' },
    acceptBtnActive: { backgroundColor: c.success },
    acceptBtnText: { fontSize: 14, fontWeight: '700', color: c.success },
    acceptBtnTextActive: { color: '#fff' },
    rejectBtn: { flex: 1, paddingVertical: 11, borderRadius: 4, borderWidth: 1.5, borderColor: c.error, alignItems: 'center' },
    rejectBtnActive: { backgroundColor: c.error },
    rejectBtnText: { fontSize: 14, fontWeight: '700', color: c.error },
    rejectBtnTextActive: { color: '#fff' },
    feedbackWrap: { marginTop: 4 },
    feedbackLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
    feedbackLabel: { fontSize: 13, fontWeight: '600', color: c.text, flex: 1 },
    requiredTag: { fontSize: 11, color: c.error, fontWeight: '600' },
    wordCount: { fontSize: 11, color: c.textSub },
    wordCountOver: { color: c.error },
    feedbackInput: { borderWidth: 1, borderColor: c.border, borderRadius: 4, padding: 10, fontSize: 13, color: c.text, minHeight: 80, textAlignVertical: 'top', backgroundColor: c.inputBg },
    feedbackInputOver: { borderColor: c.error },
    deadlineWrap: { marginTop: 12 },
    deadlinePicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: c.border, borderRadius: 4, padding: 10, backgroundColor: c.inputBg, marginTop: 6 },
    deadlinePickerText: { fontSize: 13, color: c.text },
    deadlinePickerIcon: { fontSize: 15 },
    footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderColor: c.border },
    tooltip: { fontSize: 12, color: c.error, marginBottom: 8, textAlign: 'center' },
    submitBtn: { backgroundColor: c.btnBg, paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
    submitBtnDisabled: { backgroundColor: c.textSub },
    submitBtnText: { color: c.btnText, fontWeight: '700', fontSize: 15 },
    previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    previewImage: { width: '90%', aspectRatio: 1, borderRadius: 8 },
});

export default FeedbackModal;
