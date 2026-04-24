import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
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

const FMDashboard = () => {
    const router = useRouter();
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
                    <Text style={styles.btnAssignText}>Assign</Text>
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
                    <Text style={styles.btnFeedbackText}>Feedback</Text>
                </TouchableOpacity>
            );
        }

        return (
            <View style={styles.btnAssigned}>
                <Text style={styles.btnAssignedText}>Assigned</Text>
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
                            <Text style={[styles.areaToggleText, areaType === 'indoor' && styles.areaToggleTextActive]}>Indoor</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.areaToggleBtn, areaType === 'outdoor' && styles.areaToggleBtnActive]}
                            onPress={() => handleAreaTypeChange('outdoor')}
                        >
                            <Text style={[styles.areaToggleText, areaType === 'outdoor' && styles.areaToggleTextActive]}>Outdoor</Text>
                        </TouchableOpacity>
                    </View>
                    <Picker selectedValue={filterArea} onValueChange={setFilterArea} style={styles.picker} dropdownIconColor={c.text}>
                        <Picker.Item label="Location: All" value="" color={c.text} style={styles.pickerItem} />
                        {(areaType === 'indoor' ? indoorLocations : outdoorLocations).map((loc) => (
                            <Picker.Item key={loc.value} label={loc.label} value={loc.value} color={c.text} style={styles.pickerItem} />
                        ))}
                    </Picker>
                </View>
                <View style={styles.pickerWrap}>
                    <View style={styles.resetRow}>
                        <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
                            <Text style={styles.resetBtnText}>Reset</Text>
                        </TouchableOpacity>
                    </View>
                    <Picker selectedValue={filterCategory} onValueChange={setFilterCategory} style={styles.picker} dropdownIconColor={c.text}>
                        <Picker.Item label="Category: All" value="" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="Electrical" value="electrical" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="Plumbing" value="plumbing" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="HVAC" value="hvac" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="Structural" value="structural" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="Cleaning" value="cleaning" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="Other" value="other" color={c.text} style={styles.pickerItem} />
                    </Picker>
                </View>
                <View style={styles.pickerWrap}>
                    <Picker selectedValue={filterStatus} onValueChange={setFilterStatus} style={styles.picker} dropdownIconColor={c.text}>
                        <Picker.Item label="Pending" value="pending" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="Assigned" value="assigned" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="In Progress" value="in_progress" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="Reassigned" value="reassigned" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="Completed" value="completed" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="All" value="" color={c.text} style={styles.pickerItem} />
                    </Picker>
                </View>
                <View style={styles.pickerWrap}>
                    <Picker selectedValue={filterSort} onValueChange={setFilterSort} style={styles.picker} dropdownIconColor={c.text}>
                        <Picker.Item label="Most Recent" value="recent" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="Least Recent" value="oldest" color={c.text} style={styles.pickerItem} />
                        <Picker.Item label="Most Popular" value="popular" color={c.text} style={styles.pickerItem} />
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
                        <Text style={styles.emptyText}>No tickets found.</Text>
                    </View>
                ) : (
                    tickets.map((ticket) => (
                        <View key={ticket.id} style={styles.card}>
                            {ticket.image_url ? (
                                <Image source={{ uri: ticket.image_url }} style={styles.cardImage} resizeMode="contain" />
                            ) : (
                                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                                    <Text style={styles.cardImagePlaceholderText}>No image</Text>
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
                                    {getPriorityBadge(ticket)}
                                </View>

                                <Text style={styles.cardLocation}>
                                    {[ticket.area, ticket.building, ticket.floor].filter(Boolean).join(' · ')}
                                </Text>

                                {ticket.assignments?.[0]?.worker_name && (
                                    <Text style={styles.cardWorker}>
                                        Worker: {ticket.assignments[0].worker_name}
                                    </Text>
                                )}

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
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    priorityText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    cardLocation: { fontSize: 13, color: c.textMid, marginBottom: 4 },
    cardWorker: { fontSize: 13, color: c.textMid, marginBottom: 4 },
    cardDate: { fontSize: 12, color: c.textSub, marginBottom: 12 },
    cardFooter: { alignItems: 'flex-end' },
    btnAssign: { backgroundColor: c.btnBg, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
    btnAssignText: { color: c.btnText, fontWeight: '700', fontSize: 14 },
    btnAssigned: { backgroundColor: c.border, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
    btnAssignedText: { color: c.textSub, fontWeight: '700', fontSize: 14 },
    btnFeedback: { backgroundColor: c.success, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
    btnFeedbackText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default FMDashboard;
