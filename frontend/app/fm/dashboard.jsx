import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, RefreshControl, Alert,
    Modal, Dimensions
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import FeedbackModal from '../../components/FM/FeedbackModal';

const PRIORITY_COLORS = {
    low: '#6B7280',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#7C3AED',
};

const indoorLocations = [
    { label: 'Building M', value: 'Building M' },
    { label: 'Building S', value: 'Building S' },
    { label: 'Building A', value: 'Building A' },
    { label: 'Building C', value: 'Building C' },
];

const outdoorLocations = [
    { label: 'Food Court', value: 'Food Court' },
    { label: 'Boosters', value: 'Boosters' },
    { label: 'Panorama', value: 'Panorama' },
    { label: 'Padel', value: 'Padel' },
    { label: 'Supermarket', value: 'Supermarket' },
    { label: 'Gym', value: 'Gym' },
    { label: 'VolleyBall Court', value: 'VolleyBall Court' },
    { label: 'Basketball Court', value: 'Basketball Court' },
    { label: 'Football Area', value: 'Football Area' },
    { label: 'SuperMarket Pathway', value: 'SuperMarket Pathway' },
    { label: 'Between S and A', value: 'Between S and A' },
    { label: 'Between S and M', value: 'Between S and M' },
    { label: 'Between A and C', value: 'Between A and C' },
];

const DetailRow = ({ label, value, valueColor, textColor }) => (
    <View style={{ flexDirection: 'row', marginBottom: 6, flexWrap: 'wrap' }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: textColor || '#555', marginRight: 6 }}>{label}:</Text>
        <Text style={{ fontSize: 13, color: valueColor || textColor || '#333', flex: 1 }}>{value}</Text>
    </View>
);

const FMDashboard = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { colors: c } = useTheme();
    const styles = useMemo(() => makeStyles(c), [c]);

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [areaType, setAreaType] = useState('indoor');
    const [filterArea, setFilterArea] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('pending');
    const [filterSort, setFilterSort] = useState('recent');
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [ticketDetailVisible, setTicketDetailVisible] = useState(false);
    const [selectedDetailTicket, setSelectedDetailTicket] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    const fetchTickets = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterArea) params.append('area', filterArea);
            if (filterCategory) params.append('category', filterCategory);
            if (filterStatus) params.append('status', filterStatus);
            if (filterSort) params.append('sort', filterSort);

            const data = await api.get(`/fm/tickets?${params.toString()}`);
            setTickets(data);
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filterArea, filterCategory, filterStatus, filterSort]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const onRefresh = () => { setRefreshing(true); fetchTickets(); };

    const handleAreaTypeChange = (type) => {
        setAreaType(type);
        setFilterArea('');
    };

    const handleResetFilters = () => {
        setAreaType('indoor');
        setFilterArea('');
        setFilterCategory('');
        setFilterStatus('pending');
        setFilterSort('recent');
    };

    const getActionButton = (ticket) => {
        const assignment = ticket.assignments?.[0];
        const hasProof = assignment?.proof_url;
        const status = ticket.status;

        if (status === 'pending') {
            return (
                <TouchableOpacity
                    style={styles.btnAssign}
                    onPress={() => router.push({ pathname: '/fm/assign', params: { ticketId: ticket.id } })}
                >
                    <Text style={styles.btnAssignText}>{t('assignBtn')}</Text>
                </TouchableOpacity>
            );
        }

        if (hasProof && status === 'in_progress') {
            return (
                <TouchableOpacity
                    style={styles.btnFeedback}
                    onPress={() => {
                        setSelectedTicketId(ticket.id);
                        setFeedbackModalVisible(true);
                    }}
                >
                    <Text style={styles.btnFeedbackText}>{t('feedbackBtn')}</Text>
                </TouchableOpacity>
            );
        }

        if (status === 'completed') {
            return (
                <View style={styles.completedFooterRow}>
                    <TouchableOpacity onPress={() => { setSelectedDetailTicket(ticket); setTicketDetailVisible(true); }}>
                        <Text style={styles.viewTicketLink}>{t('viewTicket')}</Text>
                    </TouchableOpacity>
                    <View style={styles.btnCompleted}>
                        <Text style={styles.btnCompletedText}>{t('completed')}</Text>
                    </View>
                </View>
            );
        }

        if (status === 'reassigned') {
            return (
                <View style={styles.btnAssigned}>
                    <Text style={styles.btnAssignedText}>{t('reassigned')}</Text>
                </View>
            );
        }

        return (
            <View style={styles.btnAssigned}>
                <Text style={styles.btnAssignedText}>{t('assigned')}</Text>
            </View>
        );
    };

    const getPriorityBadge = (ticket) => {
        const priority = ticket.assignments?.[0]?.priority;
        if (!priority) return null;
        return (
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[priority] + '20' }]}>
                <Text style={[styles.priorityText, { color: PRIORITY_COLORS[priority] }]}>
                    {priority.toUpperCase()}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Filters */}
            <View style={styles.filtersRow}>
                <View style={styles.pickerWrap}>
                    <View style={styles.areaToggleRow}>
                        <TouchableOpacity
                            style={[styles.areaToggleBtn, areaType === 'indoor' && styles.areaToggleBtnActive]}
                            onPress={() => handleAreaTypeChange('indoor')}
                        >
                            <Text style={[styles.areaToggleText, areaType === 'indoor' && styles.areaToggleTextActive]}>{t('indoor')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.areaToggleBtn, areaType === 'outdoor' && styles.areaToggleBtnActive]}
                            onPress={() => handleAreaTypeChange('outdoor')}
                        >
                            <Text style={[styles.areaToggleText, areaType === 'outdoor' && styles.areaToggleTextActive]}>{t('outdoor')}</Text>
                        </TouchableOpacity>
                    </View>
                    <Picker selectedValue={filterArea} onValueChange={setFilterArea} style={styles.picker} dropdownIconColor={c.text}>
                        <Picker.Item label={t('locationAll')} value="" color={c.text} style={styles.pickerItem} />
                        {(areaType === 'indoor' ? indoorLocations : outdoorLocations).map((loc) => (
                            <Picker.Item key={loc.value} label={loc.label} value={loc.value} color={c.text} style={styles.pickerItem} />
                        ))}
                    </Picker>
                </View>
                <View style={styles.pickerWrap}>
                    <View style={styles.resetRow}>
                        <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
                            <Text style={styles.resetBtnText}>{t('reset')}</Text>
                        </TouchableOpacity>
                    </View>
                    <Picker selectedValue={filterCategory} onValueChange={setFilterCategory} style={styles.picker} dropdownIconColor={c.text}>
                        <Picker.Item label={t('categoryAll')} value="" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('electrical')} value="electrical" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('plumbing')} value="plumbing" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('hvac')} value="hvac" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('structural')} value="structural" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('cleaning')} value="cleaning" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('other')} value="other" color={c.text} style={styles.pickerItem} />
                    </Picker>
                </View>
                <View style={styles.pickerWrap}>
                    <Picker selectedValue={filterStatus} onValueChange={setFilterStatus} style={styles.picker} dropdownIconColor={c.text}>
                        <Picker.Item label={t('pending')} value="pending" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('assigned')} value="assigned" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('inProgress')} value="in_progress" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('reassigned')} value="reassigned" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('completed')} value="completed" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('all')} value="" color={c.text} style={styles.pickerItem} />
                    </Picker>
                </View>
                <View style={styles.pickerWrap}>
                    <Picker selectedValue={filterSort} onValueChange={setFilterSort} style={styles.picker} dropdownIconColor={c.text}>
                        <Picker.Item label={t('mostRecent')} value="recent" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('leastRecent')} value="oldest" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label={t('mostPopular')} value="popular" color={c.text} style={styles.pickerItem} />
                    </Picker>
                </View>
            </View>

            {/* Ticket List */}
            <ScrollView
                style={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
            >
                {tickets.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>{t('noTickets')}</Text>
                    </View>
                ) : (
                    tickets.map((ticket) => (
                        <View key={ticket.id} style={styles.card}>
                            {ticket.image_url ? (
                                <Image source={{ uri: ticket.image_url }} style={styles.cardImage} resizeMode="contain" />
                            ) : (
                                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                                    <Text style={styles.cardImagePlaceholderText}>{t('noImage')}</Text>
                                </View>
                            )}

                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>{ticket.category?.toUpperCase()}</Text>
                            </View>

                            <View style={styles.cardBody}>
                                <View style={styles.cardTopRow}>
                                    <Text style={styles.cardTitle} numberOfLines={2}>
                                        {ticket.description || 'No description'}
                                    </Text>
                                </View>

                                <Text style={styles.cardLocation}>
                                    {[ticket.area, ticket.building, ticket.floor].filter(Boolean).join(' · ')}
                                </Text>

                                {ticket.assignments?.[0]?.worker_name && (
                                    <Text style={styles.cardWorker}>
                                        {t('workerPrefix')}: {ticket.assignments[0].worker_name}
                                    </Text>
                                )}

                                {getPriorityBadge(ticket)}

                                {ticket.status === 'reassigned' && ticket.assignments?.[0] && (() => {
                                    const a = ticket.assignments[0];
                                    return (
                                        <View style={styles.cardReassignRow}>
                                            <View style={styles.cardReassignText}>
                                                {a.deadline && (
                                                    <Text style={styles.cardReassignInfo}>
                                                        {t('setDeadline')}: {new Date(a.deadline).toLocaleDateString()}
                                                    </Text>
                                                )}
                                                {a.worker_note && (
                                                    <Text style={styles.cardReassignInfo} numberOfLines={2}>
                                                        {t('workersNote')}: {a.worker_note}
                                                    </Text>
                                                )}
                                                {a.feedback && (
                                                    <Text style={styles.cardReassignInfo} numberOfLines={2}>
                                                        {t('feedbackBtn')}: {a.feedback}
                                                    </Text>
                                                )}
                                                {a.proof_url && (
                                                    <TouchableOpacity onPress={() => setImagePreviewUrl(a.proof_url)}>
                                                        <Text style={styles.cardReassignProofLink}>{t('proofLabel')}</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })()}

                                <Text style={styles.cardDate}>
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                </Text>

                                <View style={styles.cardFooter}>
                                    {getActionButton(ticket)}
                                </View>
                            </View>
                        </View>
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            <FeedbackModal
                visible={feedbackModalVisible}
                ticketId={selectedTicketId}
                token={user.token}
                onClose={() => {
                    setFeedbackModalVisible(false);
                    setSelectedTicketId(null);
                    fetchTickets();
                }}
            />

            {/* Ticket Detail Modal */}
            <Modal
                visible={ticketDetailVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setTicketDetailVisible(false)}
            >
                <View style={styles.detailOverlay}>
                    <View style={styles.detailBox}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedDetailTicket && (() => {
                                const t_ = selectedDetailTicket;
                                const a = t_.assignments?.[0];
                                return (
                                    <>
                                        {/* Ticket image */}
                                        {t_.image_url ? (
                                            <TouchableOpacity onPress={() => setImagePreviewUrl(t_.image_url)}>
                                                <Image source={{ uri: t_.image_url }} style={styles.detailImage} resizeMode="cover" />
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={[styles.detailImage, styles.detailImagePlaceholder]}>
                                                <Text style={styles.detailPlaceholderText}>{t('noImage')}</Text>
                                            </View>
                                        )}

                                        <View style={styles.detailContent}>
                                            {/* Category badge */}
                                            <View style={styles.detailCategoryBadge}>
                                                <Text style={styles.detailCategoryText}>{t_.category?.toUpperCase()}</Text>
                                            </View>

                                            <Text style={styles.detailDescription}>{t_.description || t('noDescription')}</Text>

                                            <Text style={styles.detailLocation}>
                                                {[t_.area, t_.building, t_.floor, t_.specific_location].filter(Boolean).join(' · ')}
                                            </Text>

                                            <View style={styles.detailDivider} />

                                            <DetailRow label={t('statusLabel')} value={t_.status?.replace('_', ' ')} textColor={c.textMid} />
                                            <DetailRow label={t('createdAt')} value={new Date(t_.created_at).toLocaleString()} textColor={c.textMid} />
                                            {t_.completed_at && <DetailRow label={t('completedAt')} value={new Date(t_.completed_at).toLocaleString()} textColor={c.textMid} />}

                                            {a && (
                                                <>
                                                    <View style={styles.detailDivider} />
                                                    {a.worker_name && <DetailRow label={t('workerPrefix')} value={a.worker_name} textColor={c.textMid} />}
                                                    {a.priority && <DetailRow label={t('priority')} value={a.priority.toUpperCase()} valueColor={PRIORITY_COLORS[a.priority]} textColor={c.textMid} />}
                                                    {a.deadline && <DetailRow label={t('setDeadline')} value={new Date(a.deadline).toLocaleString()} textColor={c.textMid} />}
                                                    {a.worker_note && <DetailRow label={t('workersNote')} value={a.worker_note} textColor={c.textMid} />}
                                                    {a.feedback && <DetailRow label={t('feedbackBtn')} value={a.feedback} textColor={c.textMid} />}

                                                    {a.proof_url && (
                                                        <View style={styles.detailProofWrap}>
                                                            <Text style={[styles.detailLabel, { color: c.textMid }]}>{t('proofLabel')}</Text>
                                                            <TouchableOpacity onPress={() => setImagePreviewUrl(a.proof_url)}>
                                                                <Image source={{ uri: a.proof_url }} style={styles.detailProofImage} resizeMode="cover" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                </>
                                            )}
                                        </View>
                                    </>
                                );
                            })()}
                        </ScrollView>
                        <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setTicketDetailVisible(false)}>
                            <Text style={styles.detailCloseBtnText}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Image preview modal */}
            <Modal visible={!!imagePreviewUrl} transparent animationType="fade" onRequestClose={() => setImagePreviewUrl(null)}>
                <TouchableOpacity style={styles.previewOverlay} activeOpacity={1} onPress={() => setImagePreviewUrl(null)}>
                    <Image source={{ uri: imagePreviewUrl }} style={styles.previewImage} resizeMode="contain" />
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const makeStyles = (c) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
    filtersRow: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: c.filtersBg, borderBottomWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 4 },
    pickerWrap: { width: '50%', borderWidth: 1, borderColor: c.border, borderRadius: 4, marginVertical: 4, paddingHorizontal: 4, backgroundColor: c.surface },
    picker: { height: 44, fontSize: 13, color: c.text, backgroundColor: c.surface },
    pickerItem: { backgroundColor: c.surface, color: c.text },
    areaToggleRow: { flexDirection: 'row', marginTop: 4, marginBottom: 2 },
    areaToggleBtn: { flex: 1, paddingVertical: 4, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: c.border, marginHorizontal: 2, backgroundColor: c.inputBg },
    resetRow: { alignItems: 'flex-start', marginTop: 4, marginBottom: 2, marginHorizontal: 10 },
    resetBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1, borderColor: c.border, backgroundColor: c.inputBg },
    resetBtnText: { fontSize: 12, fontWeight: '600', color: c.textSub },
    areaToggleBtnActive: { backgroundColor: c.btnBg, borderColor: c.btnBg },
    areaToggleText: { fontSize: 12, fontWeight: '600', color: c.textSub },
    areaToggleTextActive: { color: c.btnText },
    list: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: c.textSub, fontSize: 15 },
    card: { backgroundColor: c.card, borderRadius: 8, borderWidth: 1, borderColor: c.border, marginBottom: 16, overflow: 'hidden', marginHorizontal: '20%' },
    cardImage: { width: '100%', height: 260 },
    cardImagePlaceholder: { backgroundColor: c.border, justifyContent: 'center', alignItems: 'center' },
    cardImagePlaceholderText: { color: c.textSub, fontSize: 13 },
    categoryBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    categoryBadgeText: { fontSize: 10, fontWeight: '700', color: '#181C22', letterSpacing: 1 },
    cardBody: { padding: 14 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: c.text, flex: 1, marginRight: 8 },
    priorityText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    cardLocation: { fontSize: 13, color: c.textMid, marginBottom: 4 },
    cardWorker: { fontSize: 13, color: c.textMid, marginBottom: 4 },
    cardReassignRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
    cardReassignText: { flexShrink: 1 },
    cardReassignInfo: { fontSize: 12, color: c.textMid, marginBottom: 3 },
    cardReassignProofLink: { fontSize: 12, color: c.primary, textDecorationLine: 'underline', marginTop: 2 },
    cardDate: { fontSize: 12, color: c.textSub, marginBottom: 12 },
    cardFooter: { alignItems: 'flex-end' },
    btnAssign: { backgroundColor: c.btnBg, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
    btnAssignText: { color: c.btnText, fontWeight: '700', fontSize: 14 },
    btnAssigned: { backgroundColor: c.border, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
    btnAssignedText: { color: c.textSub, fontWeight: '700', fontSize: 14 },
    btnFeedback: { backgroundColor: c.success, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
    btnFeedbackText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    viewTicketLink: { fontSize: 13, color: c.primary, textDecorationLine: 'underline', fontWeight: '600', marginRight: 10 },
    completedFooterRow: { flexDirection: 'row', alignItems: 'center' },
    btnCompleted: { backgroundColor: c.border, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
    btnCompletedText: { color: c.textSub, fontWeight: '700', fontSize: 14 },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 6 },
    // Detail modal
    detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    detailBox: { backgroundColor: c.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: SCREEN_HEIGHT * 0.88 },
    detailImage: { width: 100, height: 100, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4 },
    detailImagePlaceholder: { backgroundColor: c.border, justifyContent: 'center', alignItems: 'center' },
    detailPlaceholderText: { color: c.textSub, fontSize: 13 },
    detailContent: { padding: 16 },
    detailCategoryBadge: { alignSelf: 'flex-start', backgroundColor: c.btnBg + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginBottom: 8 },
    detailCategoryText: { fontSize: 11, fontWeight: '700', color: c.btnBg, letterSpacing: 1 },
    detailDescription: { fontSize: 16, fontWeight: '600', color: c.text, marginBottom: 6 },
    detailLocation: { fontSize: 13, color: c.textMid, marginBottom: 12 },
    detailDivider: { height: 1, backgroundColor: c.border, marginVertical: 12 },
    detailLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
    detailProofWrap: { marginTop: 8 },
    detailProofImage: { width: 100, height: 100, borderRadius: 6, marginTop: 4 },
    previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    previewImage: { width: '90%', aspectRatio: 1, borderRadius: 8 },
    detailCloseBtn: { margin: 16, backgroundColor: c.btnBg, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    detailCloseBtnText: { color: c.btnText, fontWeight: '700', fontSize: 15 },
});

export default FMDashboard;
