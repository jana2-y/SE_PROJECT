import React, { useMemo } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

// Velvet & Gold Glass tokens — mirrors fm/dashboard.jsx
const FC = {
    light: {
        glass: 'rgba(255, 248, 246, 0.72)',
        glassBorder: 'rgba(255, 255, 255, 0.55)',
        primary: '#420000',
        text: '#31120c',
        textSub: '#57423e',
        categoryBg: 'rgba(255,255,255,0.88)',
        categoryText: '#420000',
        btnBg: '#420000',
        btnText: '#ffffff',
        success: '#420000',
        error: '#ba1a1a',
        divider: 'rgba(49,18,12,0.08)',
    },
    dark: {
        glass: 'rgba(74, 39, 31, 0.72)',
        glassBorder: 'rgba(255, 218, 211, 0.14)',
        primary: '#ffb4a8',
        text: '#fff8f6',
        textSub: 'rgba(255,248,246,0.62)',
        categoryBg: 'rgba(74,39,31,0.88)',
        categoryText: '#ffb4a8',
        btnBg: '#660b05',
        btnText: '#ffdad4',
        success: '#660b05',
        error: '#cf6679',
        divider: 'rgba(255,248,246,0.08)',
    },
};

const PRIORITY_COLORS = {
    low: '#6B7280',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#7C3AED',
};

const STATUS_META = {
    assigned:    { label: 'Assigned',    color: '#F59E0B' },
    in_progress: { label: 'In Progress', color: '#3B82F6' },
    completed:   { label: 'Completed',   color: '#059669' },
    reassigned:  { label: 'Reassigned',  color: '#EF4444' },
};

const AssignmentCard = ({ assignment, onStartWork, onShowModal }) => {
    const router = useRouter();
    const { theme } = useTheme();
    const fc = FC[theme] || FC.light;
    const styles = useMemo(() => makeStyles(fc), [fc]);

    const ticket = assignment.tickets || {};
    const { status, priority, deadline, proof_url, feedback } = assignment;
    const meta = STATUS_META[status] || { label: status, color: '#999' };

    const goToProof = () =>
        router.push({
            pathname: '/worker/proof',
            params: { assignmentId: assignment.id, ticketId: assignment.ticket_id },
        });

    const renderAction = () => {
        if (status === 'assigned') {
            return (
                <TouchableOpacity style={styles.btnStart} onPress={() => onStartWork?.(assignment.id)}>
                    <Ionicons name="play-circle-outline" size={16} color={fc.btnText} />
                    <Text style={styles.btnStartText}>Start Work</Text>
                </TouchableOpacity>
            );
        }
        if (status === 'in_progress' && !proof_url) {
            return (
                <TouchableOpacity style={styles.btnProof} onPress={goToProof}>
                    <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                    <Text style={styles.btnProofText}>Submit Proof</Text>
                </TouchableOpacity>
            );
        }
        if (status === 'in_progress' && proof_url) {
            return (
                <View style={styles.btnWaiting}>
                    <Ionicons name="hourglass-outline" size={16} color="#F59E0B" />
                    <Text style={styles.btnWaitingText}>Awaiting Review</Text>
                </View>
            );
        }
        if (status === 'reassigned') {
            return (
                <TouchableOpacity style={styles.btnProof} onPress={goToProof}>
                    <Ionicons name="refresh-outline" size={16} color="#fff" />
                    <Text style={styles.btnProofText}>Resubmit Proof</Text>
                </TouchableOpacity>
            );
        }
        return null;
    };

    return (
        <View style={styles.card}>
            {/* Ticket image */}
            {ticket.image_url ? (
                <Image source={{ uri: ticket.image_url }} style={styles.image} resizeMode="cover" />
            ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                    <Ionicons name="image-outline" size={40} color={fc.textSub} />
                </View>
            )}

            {/* Floating badges */}
            {ticket.category && (
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{ticket.category.toUpperCase()}</Text>
                </View>
            )}
            {status === 'reassigned' && (
                <View style={styles.reassignedBadge}>
                    <Text style={styles.reassignedBadgeText}>REASSIGNED</Text>
                </View>
            )}

            {/* Status + Priority row */}
            <View style={styles.metaRow}>
                <View style={[styles.statusPill, { backgroundColor: meta.color + '22' }]}>
                    <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                    <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
                </View>
                {priority && (
                    <View style={[styles.priorityPill, { backgroundColor: PRIORITY_COLORS[priority] + '22' }]}>
                        <Text style={[styles.priorityLabel, { color: PRIORITY_COLORS[priority] }]}>
                            {priority.toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            {/* Body */}
            <View style={styles.body}>
                <Text style={styles.description} numberOfLines={2}>
                    {ticket.description || 'No description provided'}
                </Text>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={13} color={fc.textSub} />
                    <Text style={styles.infoText} numberOfLines={1}>
                        {[ticket.area, ticket.building, ticket.floor, ticket.specific_location]
                            .filter(Boolean).join(' · ') || 'No location specified'}
                    </Text>
                </View>

                {deadline && (
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={13} color={fc.textSub} />
                        <Text style={styles.infoText}>
                            {' '}Deadline: {new Date(deadline).toLocaleDateString()}
                        </Text>
                    </View>
                )}

                {feedback && (
                    <View style={styles.feedbackBox}>
                        <Ionicons name="chatbubble-ellipses-outline" size={13} color={fc.error} />
                        <Text style={styles.feedbackText} numberOfLines={3}>{' '}{feedback}</Text>
                    </View>
                )}

                <View style={styles.footer}>
                    {/* Top row: Details + action button */}
                    <View style={styles.footerRow}>
                        <TouchableOpacity
                            style={styles.btnDetails}
                            onPress={() => onShowModal?.('details', assignment)}
                        >
                            <Ionicons name="information-circle-outline" size={14} color={fc.btnText} />
                            <Text style={styles.btnDetailsText}>Details</Text>
                        </TouchableOpacity>
                        {renderAction()}
                    </View>

                    {/* Bottom row: Proof/Feedback whenever the data exists */}
                    {(proof_url || feedback) && (
                        <View style={[styles.buttonRow, { marginTop: 8 }]}>
                            {!!proof_url && (
                                <TouchableOpacity
                                    style={styles.smallBtn}
                                    onPress={() => onShowModal?.('proof', assignment)}
                                >
                                    <Ionicons name="image-outline" size={14} color={fc.primary} />
                                    <Text style={styles.smallBtnText}>Proof</Text>
                                </TouchableOpacity>
                            )}
                            {!!feedback && (
                                <TouchableOpacity
                                    style={styles.smallBtn}
                                    onPress={() => onShowModal?.('feedback', assignment)}
                                >
                                    <Ionicons name="chatbubble-outline" size={14} color={fc.primary} />
                                    <Text style={styles.smallBtnText}>Feedback</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const makeStyles = (fc) => StyleSheet.create({
    card: {
        backgroundColor: fc.glass,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: fc.glassBorder,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
        elevation: 4,
    },
    image: { width: '100%', height: 180 },
    imagePlaceholder: {
        backgroundColor: fc.divider,
        justifyContent: 'center', alignItems: 'center',
    },

    categoryBadge: {
        position: 'absolute', top: 12, left: 12,
        backgroundColor: fc.categoryBg,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    },
    categoryBadgeText: { fontSize: 9, fontWeight: '700', color: fc.categoryText, letterSpacing: 0.8 },
    reassignedBadge: {
        position: 'absolute', top: 12, right: 12,
        backgroundColor: '#EF444422',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    },
    reassignedBadgeText: { fontSize: 9, fontWeight: '700', color: '#EF4444', letterSpacing: 0.8 },

    metaRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2,
    },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
    priorityPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    priorityLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

    body: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 8 },
    description: {
        fontSize: 15, fontWeight: '600', color: fc.text,
        marginBottom: 8, lineHeight: 22,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    infoText: { fontSize: 12, color: fc.textSub, flex: 1 },
    feedbackBox: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: fc.error + '10',
        borderLeftWidth: 2, borderColor: fc.error,
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 4, marginTop: 6, marginBottom: 4,
    },
    feedbackText: {
        fontSize: 12, color: fc.error, flex: 1,
        fontStyle: 'italic', lineHeight: 18,
    },
    footer: { flexDirection: 'column', marginTop: 10 },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    btnDetails: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: fc.btnBg,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    },
    btnDetailsText: { color: fc.btnText, fontWeight: '600', fontSize: 12 },
    buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    smallBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: fc.glass,
        borderWidth: 1, borderColor: fc.primary,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    },
    smallBtnText: { color: fc.primary, fontWeight: '600', fontSize: 12 },

    btnStart: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: fc.btnBg,
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnStartText: { color: fc.btnText, fontWeight: '700', fontSize: 14 },
    btnProof: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#7C3AED',
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    },
    btnProofText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    btnWaiting: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#F59E0B22',
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
        borderWidth: 1, borderColor: '#F59E0B',
    },
    btnWaitingText: { color: '#F59E0B', fontWeight: '700', fontSize: 14 },
    btnDone: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: fc.success + '22',
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
        borderWidth: 1, borderColor: fc.success,
    },
    btnDoneText: { color: fc.success, fontWeight: '700', fontSize: 14 },
});

export default AssignmentCard;
