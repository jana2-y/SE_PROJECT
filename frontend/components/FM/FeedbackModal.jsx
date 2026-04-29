import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, Modal, ScrollView, TouchableOpacity,
    TextInput, Image, StyleSheet, ActivityIndicator, Alert,
    Dimensions, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const PRIORITY_COLORS = { low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#7C3AED' };

// FeedbackModal-specific tokens not in ThemeContext
const FM_TOKENS = {
    light: {
        successBg: 'rgba(45,122,58,0.08)',
        errorBg:   'rgba(186,26,26,0.08)',
        handle:    'rgba(66,0,0,0.18)',
    },
    dark: {
        successBg: 'rgba(76,175,125,0.1)',
        errorBg:   'rgba(207,102,121,0.1)',
        handle:    'rgba(255,218,211,0.25)',
    },
};

const FeedbackModal = ({ visible, ticketId, token, onClose }) => {
    const { theme, colors: vg } = useTheme();
    const { t } = useTranslation();
    const fm = FM_TOKENS[theme] || FM_TOKENS.light;
    const s = useMemo(() => makeStyles(vg, fm), [vg, fm]);

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [priority, setPriority] = useState(null);
    const [newDeadline, setNewDeadline] = useState(new Date());
    const [deadlineSet, setDeadlineSet] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [previewSize, setPreviewSize] = useState(null);
    const popupAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible || !ticketId) return;
        setAction(null);
        setFeedbackText('');
        setPriority(null);
        setNewDeadline(new Date());
        setDeadlineSet(false);
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

    useEffect(() => {
        if (!imagePreviewVisible || !ticket?.image_url) { setPreviewSize(null); popupAnim.setValue(0); return; }
        Image.getSize(ticket.image_url, (w, h) => {
            const maxW = SCREEN_WIDTH * 0.88 - 30;
            const maxH = SCREEN_HEIGHT * 0.7;
            const ratio = Math.min(maxW / w, maxH / h, 1);
            setPreviewSize({ width: w * ratio, height: h * ratio });
        }, () => setPreviewSize(null));
        Animated.spring(popupAnim, { toValue: 1, useNativeDriver: true, tension: 160, friction: 14 }).start();
    }, [imagePreviewVisible]);

    const wordCount = feedbackText.trim() ? feedbackText.trim().split(/\s+/).length : 0;
    const isSubmitDisabled = !action || wordCount > 50 ||
        (action === 'reject' && (!feedbackText.trim() || !priority || !deadlineSet));

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
                new_priority: action === 'reject' ? priority : undefined,
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
                    style={s.overlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

                    {/* Sheet with ombre background */}
                    <LinearGradient
                        colors={[vg.gradStart, vg.gradEnd]}
                        style={s.sheet}
                    >
                        {/* Handle */}
                        <View style={s.handle} />

                        {/* Header */}
                        <View style={s.header}>
                            <View>
                                <Text style={s.headerTitle}>{t('feedbackBtn')}</Text>
                                {ticket?.category && (
                                    <View style={s.categoryPill}>
                                        <Text style={s.categoryPillText}>{ticket.category.toUpperCase()}</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                                <Ionicons name="close" size={18} color={vg.primaryBtnText} />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={s.centered}>
                                <ActivityIndicator size="large" color={vg.primary} />
                            </View>
                        ) : (
                            <ScrollView
                                style={s.scroll}
                                contentContainerStyle={s.scrollContent}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Ticket info card */}
                                <View style={s.card}>
                                    <Text style={s.cardLabel}>
                                        {[ticket?.area, ticket?.floor, ticket?.specific_location].filter(Boolean).join(' · ')}
                                    </Text>
                                    <View style={s.descRow}>
                                        <Text style={s.descText} numberOfLines={3}>{ticket?.description}</Text>
                                        {ticket?.image_url && (
                                            <TouchableOpacity onPress={() => setImagePreviewVisible(true)}>
                                                <Image source={{ uri: ticket.image_url }} style={s.thumb} resizeMode="cover" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                {/* Proof + worker note card */}
                                <View style={s.card}>
                                    <View style={s.proofRow}>
                                        {/* Proof image */}
                                        <View style={s.proofImageWrap}>
                                            {assignment?.proof_url ? (
                                                <Image source={{ uri: assignment.proof_url }} style={s.proofImage} resizeMode="cover" />
                                            ) : (
                                                <View style={[s.proofImage, s.proofPlaceholder]}>
                                                    <Ionicons name="image-outline" size={28} color={vg.textFaint} />
                                                    <Text style={s.placeholderText}>{t('noImage')}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Worker note + actions */}
                                        <View style={s.proofRight}>
                                            <Text style={s.proofNoteLabel}>{t('workersNote')}</Text>
                                            <ScrollView style={s.proofNoteScroll} nestedScrollEnabled>
                                                <Text style={s.proofNoteText}>
                                                    {assignment?.worker_note || t('noDescription')}
                                                </Text>
                                            </ScrollView>

                                            {/* Accept / Reject */}
                                            <View style={s.actionRow}>
                                                <TouchableOpacity
                                                    style={[s.actionBtn, s.acceptBtn, action === 'accept' && s.acceptBtnActive]}
                                                    onPress={() => { setAction('accept'); setFeedbackText(''); }}
                                                >
                                                    <Ionicons
                                                        name="checkmark-outline"
                                                        size={14}
                                                        color={action === 'accept' ? '#fff' : vg.success}
                                                        style={{ marginRight: 4 }}
                                                    />
                                                    <Text style={[s.actionBtnText, { color: action === 'accept' ? '#fff' : vg.success }]}>
                                                        {t('accept')}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[s.actionBtn, s.rejectBtn, action === 'reject' && s.rejectBtnActive]}
                                                    onPress={() => { setAction('reject'); setFeedbackText(''); }}
                                                >
                                                    <Ionicons
                                                        name="close-outline"
                                                        size={14}
                                                        color={action === 'reject' ? '#fff' : vg.error}
                                                        style={{ marginRight: 4 }}
                                                    />
                                                    <Text style={[s.actionBtnText, { color: action === 'reject' ? '#fff' : vg.error }]}>
                                                        {t('reject')}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>

                                            {/* Feedback input + deadline — inline, below action buttons */}
                                            {action && (
                                                <View style={s.inlineFeedbackWrap}>
                                                    <View style={s.feedbackLabelRow}>
                                                        <Text style={s.feedbackLabel}>
                                                            {action === 'reject' ? t('rejectionReason') : t('optionalNote')}
                                                        </Text>
                                                        {action === 'reject' && (
                                                            <Text style={s.requiredTag}>{t('required')}</Text>
                                                        )}
                                                        <Text style={[s.wordCount, wordCount > 50 && s.wordCountOver]}>
                                                            {wordCount}/50
                                                        </Text>
                                                    </View>

                                                    <TextInput
                                                        style={[s.feedbackInput, wordCount > 50 && s.feedbackInputOver]}
                                                        placeholder={action === 'reject' ? t('rejectionPlaceholder') : t('optionalNotePlaceholder')}
                                                        placeholderTextColor={vg.textFaint}
                                                        multiline
                                                        value={feedbackText}
                                                        onChangeText={setFeedbackText}
                                                    />

                                                    {action === 'reject' && (
                                                        <View style={s.priorityWrap}>
                                                            <View style={s.feedbackLabelRow}>
                                                                <Text style={s.feedbackLabel}>{t('newPriority')}</Text>
                                                                <Text style={s.requiredTag}>{t('required')}</Text>
                                                            </View>
                                                            <View style={s.priorityRow}>
                                                                {['low', 'medium', 'high', 'critical'].map(p => (
                                                                    <TouchableOpacity
                                                                        key={p}
                                                                        style={[s.priorityChip, priority === p && { backgroundColor: PRIORITY_COLORS[p] + '28', borderColor: PRIORITY_COLORS[p] }]}
                                                                        onPress={() => setPriority(p)}
                                                                    >
                                                                        <Text style={[s.priorityChipText, priority === p && { color: PRIORITY_COLORS[p], fontWeight: '700' }]}>
                                                                            {t(p).toUpperCase()}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    )}

                                                    {action === 'reject' && (
                                                        <View style={s.deadlineWrap}>
                                                            <View style={s.feedbackLabelRow}>
                                                                <Text style={s.feedbackLabel}>{t('newDeadline')}</Text>
                                                                <Text style={s.requiredTag}>{t('required')}</Text>
                                                            </View>
                                                            {Platform.OS === 'web' ? (
                                                                <input
                                                                    type="date"
                                                                    value={deadlineSet ? newDeadline.toISOString().split('T')[0] : ''}
                                                                    min={new Date().toISOString().split('T')[0]}
                                                                    onChange={e => { if (e.target.value) { setNewDeadline(new Date(e.target.value)); setDeadlineSet(true); } }}
                                                                    style={{
                                                                        marginTop: 8, padding: 10, borderRadius: 10,
                                                                        border: `1px solid ${vg.inputBorder}`,
                                                                        backgroundColor: vg.inputBg, color: vg.text,
                                                                        fontSize: 13, width: '100%', boxSizing: 'border-box',
                                                                    }}
                                                                />
                                                            ) : (
                                                                <>
                                                                    <TouchableOpacity style={s.deadlinePicker} onPress={() => setShowDatePicker(true)}>
                                                                        <Text style={[s.deadlinePickerText, !deadlineSet && { color: vg.textFaint }]}>
                                                                            {deadlineSet ? newDeadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : t('selectDate')}
                                                                        </Text>
                                                                        <Ionicons name="calendar-outline" size={16} color={vg.textFaint} />
                                                                    </TouchableOpacity>
                                                                    {showDatePicker && (
                                                                        <DateTimePicker
                                                                            value={newDeadline}
                                                                            mode="date"
                                                                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                                                            minimumDate={new Date()}
                                                                            onChange={(_, date) => {
                                                                                setShowDatePicker(Platform.OS === 'ios');
                                                                                if (date) { setNewDeadline(date); setDeadlineSet(true); }
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

                                <View style={{ height: 12 }} />

                            </ScrollView>
                        )}

                        {/* Footer submit */}
                        {action && !loading && (
                            <View style={s.footer}>
                                {showTooltip && (
                                    <Text style={s.tooltip}>{t('tooltipReject')}</Text>
                                )}
                                <TouchableOpacity
                                    style={[s.submitBtn, isSubmitDisabled && s.submitBtnDisabled]}
                                    onPress={handleSubmit}
                                    disabled={submitting}
                                    activeOpacity={isSubmitDisabled ? 1 : 0.8}
                                >
                                    {submitting
                                        ? <ActivityIndicator color={vg.primaryBtnText} />
                                        : <Text style={s.submitBtnText}>{t('submit')}</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        )}
                    </LinearGradient>
                </KeyboardAvoidingView>
            </Modal>

            {/* Full image preview — double-frame popup */}
            <Modal visible={imagePreviewVisible} transparent animationType="fade" onRequestClose={() => setImagePreviewVisible(false)}>
                <View style={s.previewOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setImagePreviewVisible(false)} />
                    <Animated.View style={[s.previewOuter, {
                        opacity: popupAnim,
                        transform: [{ scale: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
                    }]}>
                        <TouchableOpacity style={s.previewCloseBtn} onPress={() => setImagePreviewVisible(false)}>
                            <Text style={s.previewCloseTxt}>✕</Text>
                        </TouchableOpacity>
                        <View style={s.previewInner}>
                            <Image
                                source={{ uri: ticket?.image_url }}
                                style={[s.previewImage, previewSize && { width: previewSize.width, height: previewSize.height }]}
                                resizeMode="contain"
                            />
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
};

const makeStyles = (vg, fm) => StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)' },

    // Sheet — ombre gradient, rounded top corners
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: SCREEN_HEIGHT * 0.88,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: vg.glassBorder,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 16,
    },

    // Handle
    handle: {
        width: 40, height: 4,
        backgroundColor: fm.handle,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12, marginBottom: 8,
    },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: 20, paddingBottom: 14,
        borderBottomWidth: 1, borderColor: vg.glassBorder,
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: vg.primary, marginBottom: 6, letterSpacing: -0.3 },
    categoryPill: {
        alignSelf: 'flex-start',
        backgroundColor: vg.pillBg,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 9999,
    },
    categoryPillText: { fontSize: 10, fontWeight: '700', color: vg.primary, letterSpacing: 0.8 },
    closeBtn: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: vg.primaryBtn,
        justifyContent: 'center', alignItems: 'center',
        marginTop: 2,
    },

    centered: { height: 180, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 16 },
    scrollContent: { paddingTop: 14, gap: 12 },

    // Glass card
    card: {
        backgroundColor: vg.card,
        borderRadius: 18,
        borderWidth: 1, borderColor: vg.glassBorder,
        padding: 16,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 2,
    },

    // Ticket info
    cardLabel: { fontSize: 12, color: vg.textSub, marginBottom: 6 },
    descRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    descText: { fontSize: 14, color: vg.text, lineHeight: 20, flexShrink: 1 },
    thumb: { width: 72, height: 72, borderRadius: 12 },

    // Proof
    proofRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
    proofImageWrap: { width: '44%' },
    proofImage: { width: '100%', aspectRatio: 1, borderRadius: 12 },
    proofPlaceholder: { backgroundColor: vg.glassBorder, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { fontSize: 11, color: vg.textFaint, marginTop: 4 },
    proofRight: { flex: 1 },
    proofNoteLabel: { fontSize: 10, fontWeight: '700', color: vg.textSub, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
    proofNoteScroll: { maxHeight: 72, marginBottom: 10 },
    proofNoteText: { fontSize: 13, color: vg.textSub, lineHeight: 18 },

    // Accept / Reject buttons
    actionRow: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingVertical: 9, borderRadius: 12, borderWidth: 1.5,
    },
    acceptBtn: { borderColor: vg.success, backgroundColor: fm.successBg },
    acceptBtnActive: { backgroundColor: vg.success },
    rejectBtn: { borderColor: vg.error, backgroundColor: fm.errorBg },
    rejectBtnActive: { backgroundColor: vg.error },
    actionBtnText: { fontSize: 13, fontWeight: '700' },

    // Inline feedback (inside proofRight, below action buttons)
    inlineFeedbackWrap: { marginTop: 10 },

    // Feedback input
    feedbackLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    feedbackLabel: { fontSize: 13, fontWeight: '600', color: vg.text, flex: 1 },
    requiredTag: { fontSize: 11, color: vg.error, fontWeight: '600' },
    wordCount: { fontSize: 11, color: vg.textFaint },
    wordCountOver: { color: vg.error },
    feedbackInput: {
        borderWidth: 1, borderColor: vg.inputBorder, borderRadius: 12,
        padding: 12, fontSize: 13, color: vg.text,
        minHeight: 60, textAlignVertical: 'top',
        backgroundColor: vg.inputBg,
    },
    feedbackInputOver: { borderColor: vg.error },

    // Priority chips
    priorityWrap: { marginTop: 14 },
    priorityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    priorityChip: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1.5,
        borderColor: vg.inputBorder,
        backgroundColor: vg.inputBg,
    },
    priorityChipText: { fontSize: 11, fontWeight: '600', color: vg.textSub, letterSpacing: 0.5 },

    // Deadline
    deadlineWrap: { marginTop: 14 },
    deadlinePicker: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: vg.inputBorder, borderRadius: 12,
        padding: 12, backgroundColor: vg.inputBg, marginTop: 8,
    },
    deadlinePickerText: { fontSize: 13, color: vg.text },

    // Footer
    footer: {
        paddingHorizontal: 16, paddingTop: 12,
        borderTopWidth: 1, borderColor: vg.glassBorder,
    },
    tooltip: { fontSize: 12, color: vg.error, marginBottom: 8, textAlign: 'center' },
    submitBtn: {
        backgroundColor: vg.primaryBtn,
        paddingVertical: 14, borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
    },
    submitBtnDisabled: { backgroundColor: vg.textFaint, shadowOpacity: 0 },
    submitBtnText: { color: vg.primaryBtnText, fontWeight: '700', fontSize: 15 },

    // Preview — double-frame popup
    previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center' },
    previewOuter: {
        width: SCREEN_WIDTH * 0.88,
        backgroundColor: vg.card,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: vg.glassBorder,
        padding: 15,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
        elevation: 12,
    },
    previewCloseBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: vg.primaryBtn,
        justifyContent: 'center', alignItems: 'center',
    },
    previewCloseTxt: { color: vg.primaryBtnText, fontSize: 14, fontWeight: '700' },
    previewInner: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: vg.glassBorder,
        overflow: 'hidden',
        backgroundColor: vg.divider,
        alignItems: 'center',
        justifyContent: 'center',
        maxHeight: SCREEN_HEIGHT * 0.7,
    },
    previewImage: { width: SCREEN_WIDTH * 0.88 - 30, height: SCREEN_WIDTH * 0.88 - 30 },
});

export default FeedbackModal;
