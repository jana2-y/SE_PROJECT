import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
    View, Text, Modal, Animated, TouchableOpacity,
    ScrollView, Dimensions, StyleSheet, SafeAreaView,
    Image, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.86;

const PRIORITY_COLORS = {
    low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#7C3AED',
};

const STATUS_COLORS = {
    assigned: '#F59E0B', in_progress: '#3B82F6',
    completed: '#059669', reassigned: '#EF4444',
};

// Parses "[ticketId] message text" → { ticketId, text }
const parseMsg = (message) => {
    const m = message?.match(/^\[([a-f0-9-]{36})\]\s*(.*)/s);
    return m ? { ticketId: m[1], text: m[2] } : { ticketId: null, text: message || '' };
};

const getMsgType = (text) => {
    if (text.includes('assigned a new task')) return 'assignment';
    if (text.includes('accepted') || text.includes('rejected') || text.includes('review')) return 'feedback';
    return 'general';
};

// ─── TICKET DETAILS POPUP ─────────────────────────────────────────────────────

const TicketPopup = ({ data, onClose, colors, styles }) => {
    const ticket = data?.tickets || {};
    return (
        <Modal visible animationType="fade" transparent onRequestClose={onClose}>
            <TouchableOpacity style={styles.popupOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={styles.popupBox} onPress={() => {}}>
                    <View style={styles.popupHeader}>
                        <Text style={styles.popupTitle}>Ticket Details</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={22} color={colors.textSub} />
                        </TouchableOpacity>
                    </View>

                    {ticket.image_url ? (
                        <Image source={{ uri: ticket.image_url }} style={styles.popupImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.popupImage, styles.popupImagePlaceholder]}>
                            <Ionicons name="image-outline" size={36} color={colors.textSub} />
                        </View>
                    )}

                    <View style={styles.popupBody}>
                        {/* Status */}
                        <View style={styles.popupRow}>
                            <Text style={styles.popupRowLabel}>Status</Text>
                            <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[data?.status] || colors.textSub) + '22' }]}>
                                <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[data?.status] || colors.textSub }]}>
                                    {data?.status?.replace('_', ' ').toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        {/* Category */}
                        <View style={styles.popupRow}>
                            <Text style={styles.popupRowLabel}>Category</Text>
                            <Text style={styles.popupRowValue}>{ticket.category || '—'}</Text>
                        </View>
                        {/* Location */}
                        <View style={styles.popupRow}>
                            <Text style={styles.popupRowLabel}>Location</Text>
                            <Text style={styles.popupRowValue} numberOfLines={2}>
                                {[ticket.area, ticket.building, ticket.floor].filter(Boolean).join(' · ') || '—'}
                            </Text>
                        </View>
                        {/* Priority */}
                        {data?.priority && (
                            <View style={styles.popupRow}>
                                <Text style={styles.popupRowLabel}>Priority</Text>
                                <View style={[styles.priorityBadge, { backgroundColor: (PRIORITY_COLORS[data.priority] || colors.textSub) + '22' }]}>
                                    <Text style={[styles.priorityBadgeText, { color: PRIORITY_COLORS[data.priority] || colors.textSub }]}>
                                        {data.priority.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        )}
                        {/* Deadline */}
                        {data?.deadline && (
                            <View style={styles.popupRow}>
                                <Text style={styles.popupRowLabel}>Deadline</Text>
                                <Text style={styles.popupRowValue}>
                                    {new Date(data.deadline).toLocaleDateString()}
                                </Text>
                            </View>
                        )}
                        {/* Description */}
                        {ticket.description && (
                            <Text style={styles.popupDescription} numberOfLines={3}>
                                {ticket.description}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity style={styles.popupCloseBtn} onPress={onClose}>
                        <Text style={styles.popupCloseBtnText}>Close</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

// ─── FM FEEDBACK POPUP ────────────────────────────────────────────────────────

const FeedbackPopup = ({ data, onClose, onViewTicket, colors, styles }) => {
    const isAccepted = data?.status === 'completed';
    return (
        <Modal visible animationType="fade" transparent onRequestClose={onClose}>
            <TouchableOpacity style={styles.popupOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={styles.popupBox} onPress={() => {}}>
                    <View style={styles.popupHeader}>
                        <Text style={styles.popupTitle}>FM Feedback</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={22} color={colors.textSub} />
                        </TouchableOpacity>
                    </View>

                    {/* Verdict banner */}
                    <View style={[
                        styles.verdictBanner,
                        { backgroundColor: isAccepted ? colors.success + '18' : colors.error + '18' },
                    ]}>
                        <Ionicons
                            name={isAccepted ? 'checkmark-circle' : 'close-circle'}
                            size={20}
                            color={isAccepted ? colors.success : colors.error}
                        />
                        <Text style={[styles.verdictText, { color: isAccepted ? colors.success : colors.error }]}>
                            {isAccepted ? 'Work Accepted' : 'Work Rejected'}
                        </Text>
                    </View>

                    {/* Feedback text */}
                    {data?.feedback ? (
                        <View style={styles.feedbackBox}>
                            <Text style={styles.feedbackBoxLabel}>Feedback from FM</Text>
                            <Text style={styles.feedbackBoxText}>{data.feedback}</Text>
                        </View>
                    ) : (
                        <View style={styles.feedbackBox}>
                            <Text style={[styles.feedbackBoxText, { color: colors.textSub, fontStyle: 'italic' }]}>
                                No written feedback provided.
                            </Text>
                        </View>
                    )}

                    {/* Worker's proof image */}
                    {data?.proof_url && (
                        <View style={{ marginTop: 12 }}>
                            <Text style={styles.popupRowLabel}>Your Submitted Proof</Text>
                            <Image
                                source={{ uri: data.proof_url }}
                                style={styles.proofPreview}
                                resizeMode="cover"
                            />
                        </View>
                    )}

                    <View style={styles.popupBtnRow}>
                        <TouchableOpacity style={styles.viewTicketBtn} onPress={onViewTicket}>
                            <Ionicons name="ticket-outline" size={16} color={colors.primary} />
                            <Text style={[styles.viewTicketBtnText, { color: colors.primary }]}>View Ticket</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.popupCloseBtn} onPress={onClose}>
                            <Text style={styles.popupCloseBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

// ─── NOTIFICATION ITEM ────────────────────────────────────────────────────────

const NotifItem = ({ notif, assignmentsMap, localAccepted, accepting, onAccept, onViewTicket, onViewFeedback, colors, styles }) => {
    const { ticketId, text } = parseMsg(notif.message);
    const type = getMsgType(text);
    const assignment = ticketId ? assignmentsMap[ticketId] : null;

    const isAlreadyAccepted = localAccepted.has(ticketId) ||
        (assignment && ['in_progress', 'completed', 'reassigned'].includes(assignment.status));

    const isAccepting = accepting === ticketId;

    return (
        <View style={[styles.notifItem, !notif.is_read && styles.notifItemUnread]}>
            <View style={styles.notifDotCol}>
                {!notif.is_read && <View style={styles.unreadDot} />}
            </View>

            <View style={styles.notifContent}>
                <Text style={styles.notifText}>{text}</Text>
                {notif.created_at && (
                    <Text style={styles.notifTime}>
                        {new Date(notif.created_at).toLocaleString()}
                    </Text>
                )}

                {/* Assignment notification actions */}
                {ticketId && type === 'assignment' && (
                    <View style={styles.notifActions}>
                        <TouchableOpacity
                            style={styles.viewBtn}
                            onPress={() => onViewTicket(ticketId)}
                        >
                            <Ionicons name="eye-outline" size={14} color={colors.primary} />
                            <Text style={[styles.viewBtnText, { color: colors.primary }]}>View Ticket</Text>
                        </TouchableOpacity>

                        {isAlreadyAccepted ? (
                            <View style={styles.acceptedBtn}>
                                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                <Text style={[styles.acceptedBtnText, { color: colors.success }]}>Accepted</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.acceptBtn}
                                onPress={() => onAccept(ticketId)}
                                disabled={isAccepting}
                            >
                                {isAccepting
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={styles.acceptBtnText}>Accept</Text>
                                }
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Feedback notification action */}
                {ticketId && type === 'feedback' && (
                    <TouchableOpacity
                        style={styles.feedbackBtn}
                        onPress={() => onViewFeedback(ticketId)}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#fff" />
                        <Text style={styles.feedbackBtnText}>View Feedback</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// ─── NOTIFICATIONS SIDEBAR ────────────────────────────────────────────────────

const NotificationsSidebar = ({ visible, notifications, onClose, onMarkAllRead, onAccept }) => {
    const { colors: c } = useTheme();
    const styles = useMemo(() => makeStyles(c), [c]);
    const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

    const [assignmentsMap, setAssignmentsMap] = useState({});
    const [localAccepted, setLocalAccepted] = useState(new Set());
    const [accepting, setAccepting] = useState(null);

    const [ticketPopup, setTicketPopup] = useState(null);
    const [feedbackPopup, setFeedbackPopup] = useState(null);

    // Pre-fetch all assignments when sidebar opens
    useEffect(() => {
        if (visible) {
            api.get('/worker/tickets').then(data => {
                const map = {};
                (data || []).forEach(a => { map[a.ticket_id] = a; });
                setAssignmentsMap(map);
            }).catch(() => {});
        }
    }, [visible]);

    // Slide animation
    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 12,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SIDEBAR_WIDTH,
                duration: 220,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    const handleAccept = async (ticketId) => {
        const assignmentId = assignmentsMap[ticketId]?.id;
        if (!assignmentId) {
            Alert.alert('Error', 'Assignment not found.');
            return;
        }
        setAccepting(ticketId);
        try {
            await api.patch(`/worker/tickets/${assignmentId}/start`, {});
            setLocalAccepted(prev => new Set([...prev, ticketId]));
            setAssignmentsMap(prev => ({
                ...prev,
                [ticketId]: { ...prev[ticketId], status: 'in_progress' },
            }));
            onAccept?.();
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setAccepting(null);
        }
    };

    const handleViewTicket = (ticketId) => {
        const data = assignmentsMap[ticketId];
        if (data) setTicketPopup(data);
    };

    const handleViewFeedback = (ticketId) => {
        const data = assignmentsMap[ticketId];
        if (data) setFeedbackPopup(data);
    };

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="none"
                onRequestClose={onClose}
            >
                {/* Backdrop */}
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                {/* Sidebar panel */}
                <Animated.View
                    style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
                >
                    <SafeAreaView style={{ flex: 1 }}>
                        {/* Header */}
                        <View style={styles.sidebarHeader}>
                            <View style={styles.sidebarTitleRow}>
                                <Ionicons name="notifications" size={20} color={c.primary} />
                                <Text style={styles.sidebarTitle}>Notification Center</Text>
                                {unreadCount > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={c.textSub} />
                            </TouchableOpacity>
                        </View>

                        {/* Mark all read */}
                        {unreadCount > 0 && (
                            <TouchableOpacity style={styles.markReadBtn} onPress={onMarkAllRead}>
                                <Ionicons name="checkmark-done-outline" size={15} color={c.primary} />
                                <Text style={[styles.markReadText, { color: c.primary }]}>
                                    Mark all as read
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Notifications list */}
                        <ScrollView
                            style={styles.notifList}
                            showsVerticalScrollIndicator={false}
                        >
                            {notifications.length === 0 ? (
                                <View style={styles.emptyWrap}>
                                    <Ionicons name="notifications-off-outline" size={40} color={c.textSub} />
                                    <Text style={styles.emptyText}>No notifications yet.</Text>
                                </View>
                            ) : (
                                notifications.map((notif, idx) => (
                                    <NotifItem
                                        key={idx}
                                        notif={notif}
                                        assignmentsMap={assignmentsMap}
                                        localAccepted={localAccepted}
                                        accepting={accepting}
                                        onAccept={handleAccept}
                                        onViewTicket={handleViewTicket}
                                        onViewFeedback={handleViewFeedback}
                                        colors={c}
                                        styles={styles}
                                    />
                                ))
                            )}
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </SafeAreaView>
                </Animated.View>
            </Modal>

            {/* Ticket details popup — rendered outside the Modal so it layers on top */}
            {ticketPopup && (
                <TicketPopup
                    data={ticketPopup}
                    onClose={() => setTicketPopup(null)}
                    colors={c}
                    styles={styles}
                />
            )}

            {/* FM Feedback popup */}
            {feedbackPopup && (
                <FeedbackPopup
                    data={feedbackPopup}
                    onClose={() => setFeedbackPopup(null)}
                    onViewTicket={() => {
                        const ticketData = feedbackPopup;
                        setFeedbackPopup(null);
                        setTicketPopup(ticketData);
                    }}
                    colors={c}
                    styles={styles}
                />
            )}
        </>
    );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const makeStyles = (c) => StyleSheet.create({
    backdrop: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sidebar: {
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: 'rgba(10,20,35,0.96)',
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
        elevation: 20,
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    sidebarTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sidebarTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    unreadBadge: {
        backgroundColor: '#EF4444', borderRadius: 10,
        minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
    },
    unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    closeBtn: { padding: 4 },
    markReadBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 18, paddingVertical: 10,
        borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    markReadText: { fontSize: 12, fontWeight: '600' },
    notifList: { flex: 1 },
    emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
    emptyText: { fontSize: 14, color: '#607080' },

    // Notification item
    notifItem: {
        flexDirection: 'row',
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    notifItemUnread: {
        backgroundColor: 'rgba(58,123,213,0.1)',
        borderLeftWidth: 3,
        borderLeftColor: c.primary,
    },
    notifDotCol: { width: 14, alignItems: 'center', paddingTop: 5 },
    unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.primary },
    notifContent: { flex: 1, paddingLeft: 6 },
    notifText: { fontSize: 13, color: '#d0dce8', lineHeight: 19, marginBottom: 4 },
    notifTime: { fontSize: 10, color: '#506070', marginBottom: 8 },

    // Notification action buttons
    notifActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
    viewBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 6, borderWidth: 1, borderColor: c.primary + '55',
        backgroundColor: c.primary + '18',
    },
    viewBtnText: { fontSize: 12, fontWeight: '600' },
    acceptBtn: {
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 6, backgroundColor: c.primary,
        minWidth: 70, alignItems: 'center',
    },
    acceptBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    acceptedBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 6, borderWidth: 1, borderColor: c.success + '55',
        backgroundColor: c.success + '18',
    },
    acceptedBtnText: { fontSize: 12, fontWeight: '700' },
    feedbackBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 6, backgroundColor: '#7C3AED',
        marginTop: 4,
    },
    feedbackBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },

    // Popups
    popupOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center',
    },
    popupBox: {
        backgroundColor: c.surface,
        borderRadius: 16,
        width: Dimensions.get('window').width * 0.88,
        maxHeight: Dimensions.get('window').height * 0.82,
        overflow: 'hidden',
    },
    popupHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 18, paddingVertical: 14,
        borderBottomWidth: 1, borderColor: c.border,
    },
    popupTitle: { fontSize: 17, fontWeight: '700', color: c.text },
    popupImage: { width: '100%', height: 180 },
    popupImagePlaceholder: {
        backgroundColor: c.inputBg, justifyContent: 'center', alignItems: 'center',
    },
    popupBody: { paddingHorizontal: 18, paddingTop: 14 },
    popupRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 9, borderBottomWidth: 1, borderColor: c.border,
    },
    popupRowLabel: { fontSize: 13, color: c.textMid, fontWeight: '500' },
    popupRowValue: { fontSize: 13, color: c.text, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
    statusBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
    priorityBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    popupDescription: {
        fontSize: 13, color: c.textSub, lineHeight: 20,
        marginTop: 10, marginBottom: 4, fontStyle: 'italic',
    },
    popupCloseBtn: {
        margin: 16, paddingVertical: 12,
        borderRadius: 8, backgroundColor: c.btnBg, alignItems: 'center',
    },
    popupCloseBtnText: { color: c.btnText, fontWeight: '700', fontSize: 14 },
    popupBtnRow: { flexDirection: 'row', gap: 10, margin: 16 },
    viewTicketBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 12, borderRadius: 8,
        borderWidth: 1, borderColor: c.primary,
    },
    viewTicketBtnText: { fontWeight: '700', fontSize: 14 },

    // Feedback popup extras
    verdictBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        margin: 14, marginBottom: 4,
        padding: 12, borderRadius: 8,
    },
    verdictText: { fontSize: 14, fontWeight: '700' },
    feedbackBox: {
        marginHorizontal: 14, marginTop: 10, padding: 14,
        backgroundColor: c.inputBg, borderRadius: 8,
        borderLeftWidth: 3, borderColor: c.border,
    },
    feedbackBoxLabel: { fontSize: 11, fontWeight: '700', color: c.textSub, marginBottom: 6, textTransform: 'uppercase' },
    feedbackBoxText: { fontSize: 14, color: c.text, lineHeight: 20 },
    proofPreview: {
        width: Dimensions.get('window').width * 0.88 - 28,
        height: 160, borderRadius: 8,
        marginTop: 8, alignSelf: 'center',
    },
});

export default NotificationsSidebar;
