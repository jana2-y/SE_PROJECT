import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import FeedbackModal from '../../components/FM/FeedbackModal';

const PRIORITY_COLORS = {
    low: '#6B7280',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#7C3AED',
};

const FMDashboard = () => {
    console.log('FMDashboard mounted');
    const router = useRouter();
    const { user } = useAuth();
    console.log('user in dashboard:', user);

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
            console.log('tickets response:', JSON.stringify(data, null, 2));
            setTickets(data);
        } catch (err) {
            console.error('fetchTickets error:', err.message);
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filterArea, filterCategory, filterStatus, filterSort]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const onRefresh = () => { setRefreshing(true); fetchTickets(); };

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
                    // onPress={() => router.push({ pathname: '/fm/feedback', params: { ticketId: ticket.id } })}
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
                <ActivityIndicator size="large" color="#0078D4" />
            </View>
        );
    }

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

    const handleAreaTypeChange = (type) => {
        setAreaType(type);
        setFilterArea('');
    };

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
                    <Picker selectedValue={filterArea} onValueChange={setFilterArea} style={styles.picker}>
                        <Picker.Item label="Location: All" value="" />
                        {(areaType === 'indoor' ? indoorLocations : outdoorLocations).map((loc) => (
                            <Picker.Item key={loc.value} label={loc.label} value={loc.value} />
                        ))}
                    </Picker>
                </View>
                <View style={[styles.pickerWrap, { justifyContent: 'flex-end' }]}>
                    <Picker selectedValue={filterCategory} onValueChange={setFilterCategory} style={styles.picker}>
                        <Picker.Item label="Category: All" value="" />
                        <Picker.Item label="Electrical" value="electrical" />
                        <Picker.Item label="Plumbing" value="plumbing" />
                        <Picker.Item label="HVAC" value="hvac" />
                        <Picker.Item label="Structural" value="structural" />
                        <Picker.Item label="Cleaning" value="cleaning" />
                        <Picker.Item label="Other" value="other" />
                    </Picker>
                </View>
                <View style={styles.pickerWrap}>
                    <Picker selectedValue={filterStatus} onValueChange={setFilterStatus} style={styles.picker}>
                        <Picker.Item label="Pending" value="pending" />
                        <Picker.Item label="Assigned" value="assigned" />
                        <Picker.Item label="In Progress" value="in_progress" />
                        <Picker.Item label="Reassigned" value="reassigned" />
                        <Picker.Item label="Completed" value="completed" />
                        <Picker.Item label="All" value="" />
                    </Picker>
                </View>
                <View style={styles.pickerWrap}>
                    <Picker selectedValue={filterSort} onValueChange={setFilterSort} style={styles.picker}>
                        <Picker.Item label="Most Recent" value="recent" />
                        <Picker.Item label="Least Recent" value="oldest" />
                        <Picker.Item label="Most Popular" value="popular" />
                    </Picker>
                </View>
            </View>

            {/* Ticket List */}
            <ScrollView
                style={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0078D4" />}
            >
                {tickets.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No tickets found.</Text>
                    </View>
                ) : (
                    tickets.map((ticket) => (
                        <View key={ticket.id} style={styles.card}>
                            {/* Image */}
                            {ticket.image_url ? (
                                <Image source={{ uri: ticket.image_url }} style={styles.cardImage} resizeMode="cover" />
                            ) : (
                                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                                    <Text style={styles.cardImagePlaceholderText}>No image</Text>
                                </View>
                            )}

                            {/* Category badge over image */}
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>{ticket.category?.toUpperCase()}</Text>
                            </View>

                            {/* Card body */}
                            <View style={styles.cardBody}>
                                <View style={styles.cardTopRow}>
                                    <Text style={styles.cardTitle} numberOfLines={2}>
                                        {ticket.description || 'No description'}
                                    </Text>
                                    {getPriorityBadge(ticket)}
                                </View>

                                <Text style={styles.cardLocation}>
                                    {[ticket.area, ticket.building, ticket.floor]
                                        .filter(Boolean)
                                        .join(' · ')}
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
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F3F3' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    filtersRow: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E5E5E5', paddingHorizontal: 8, paddingVertical: 4 },
    pickerWrap: { width: '50%', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 4, marginVertical: 4, paddingHorizontal: 4, backgroundColor: '#fff' },
    picker: { height: 44, fontSize: 13 },
    areaToggleRow: { flexDirection: 'row', marginTop: 4, marginBottom: 2 },
    areaToggleBtn: { flex: 1, paddingVertical: 4, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: '#E5E5E5', marginHorizontal: 2, backgroundColor: '#F3F3F3' },
    areaToggleBtnActive: { backgroundColor: '#0078D4', borderColor: '#0078D4' },
    areaToggleText: { fontSize: 12, fontWeight: '600', color: '#717783' },
    areaToggleTextActive: { color: '#fff' },
    list: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#717783', fontSize: 15 },
    card: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', marginBottom: 16, overflow: 'hidden' },
    cardImage: { width: '100%', height: 180 },
    cardImagePlaceholder: { backgroundColor: '#E5E5E5', justifyContent: 'center', alignItems: 'center' },
    cardImagePlaceholderText: { color: '#717783', fontSize: 13 },
    categoryBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    categoryBadgeText: { fontSize: 10, fontWeight: '700', color: '#181C22', letterSpacing: 1 },
    cardBody: { padding: 14 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: '#181C22', flex: 1, marginRight: 8 },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    priorityText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    cardLocation: { fontSize: 13, color: '#404752', marginBottom: 4 },
    cardWorker: { fontSize: 13, color: '#404752', marginBottom: 4 },
    cardDate: { fontSize: 12, color: '#717783', marginBottom: 12 },
    cardFooter: { alignItems: 'flex-end' },
    btnAssign: { backgroundColor: '#0078D4', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
    btnAssignText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    btnAssigned: { backgroundColor: '#E5E5E5', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
    btnAssignedText: { color: '#9CA3AF', fontWeight: '700', fontSize: 14 },
    btnFeedback: { backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
    btnFeedbackText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default FMDashboard;