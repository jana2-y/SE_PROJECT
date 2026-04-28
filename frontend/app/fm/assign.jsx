import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, Alert, Platform, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import FMNavBar from '../../components/FM/FMNavBar';


const PRIORITY_COLORS = {
    low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#7C3AED',
};

const SPECIALTIES = [
    { label: 'All', value: '' },
    { label: 'Electrical', value: 'Electrical Technician' },
    { label: 'Plumbing', value: 'Plumber' },
    { label: 'HVAC', value: 'HVAC Technician' },
    { label: 'Cleaning', value: 'Cleaner/ Housekeeping Staff' },
    { label: 'IT Support', value: 'IT Support' },
    { label: 'Facilities', value: 'Facilities Technician' },
    { label: 'Grounds', value: 'Groundskeeper' },
];

const AssignTicket = () => {
    const { ticketId } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { theme, colors: vg } = useTheme();
    const s = useMemo(() => makeStyles(vg), [vg]);

    const [ticket, setTicket] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [filteredWorkers, setFilteredWorkers] = useState([]);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [search, setSearch] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const [deadline, setDeadline] = useState(tomorrow);
    const [showPicker, setShowPicker] = useState(false);
    const [priority, setPriority] = useState('medium');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Search expand animation
    const searchExpandAnim = useRef(new Animated.Value(0)).current;
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchRowWidth, setSearchRowWidth] = useState(0);

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    useEffect(() => {
        (async () => {
            const [workersRes, ticketRes] = await Promise.allSettled([
                api.get('/fm/workers'),
                api.get(`/fm/tickets/${ticketId}`),
            ]);
            if (workersRes.status === 'fulfilled') { setWorkers(workersRes.value); setFilteredWorkers(workersRes.value); }
            else Alert.alert('Error', workersRes.reason?.message || 'Failed to load workers');
            if (ticketRes.status === 'fulfilled') setTicket(ticketRes.value);
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        let r = workers;
        if (search.trim()) r = r.filter(w => w.full_name.toLowerCase().includes(search.toLowerCase()));
        if (specialtyFilter) r = r.filter(w => w.specialty === specialtyFilter);
        setFilteredWorkers(r);
    }, [search, specialtyFilter, workers]);

    const handleSearchFocus = () => {
        setSearchFocused(true);
        Animated.timing(searchExpandAnim, { toValue: 1, duration: 1000, useNativeDriver: false }).start();
    };
    const handleSearchBlur = () => {
        if (!search.trim()) {
            setSearchFocused(false);
            Animated.timing(searchExpandAnim, { toValue: 0, duration: 500, useNativeDriver: false }).start();
        }
    };

    const handleAssign = async () => {
        if (!selectedWorker) { Alert.alert(t('selectWorkerTitle'), t('selectWorkerMsg')); return; }
        if (deadline <= new Date()) { Alert.alert(t('invalidDeadlineTitle'), t('invalidDeadlineMsg')); return; }
        setSubmitting(true);
        try {
            await api.patch(`/fm/tickets/${ticketId}/assign`, {
                worker_id: selectedWorker.id,
                deadline: deadline.toISOString(),
                priority,
            });
            router.replace({ pathname: '/fm/dashboard', params: { assigned: '1' } });
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <LinearGradient colors={[vg.gradStart, vg.gradEnd]} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={vg.primary} />
        </LinearGradient>
    );

    const searchAnimWidth = searchRowWidth > 0
        ? searchExpandAnim.interpolate({ inputRange: [0, 1], outputRange: [searchRowWidth * 0.38, searchRowWidth] })
        : '38%';
    const chipsOpacity = searchExpandAnim.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' });

    return (
        <LinearGradient colors={[vg.gradStart, vg.gradEnd]} style={s.root}>

            {/* ── Header ── */}
            <View style={s.header}>
                <View>
                    <Text style={s.pageTitle}>{t('assignTicketTitle')}</Text>
                    <View style={s.dateRow}>
                        <Ionicons name="calendar-outline" size={13} color={vg.textSub} style={{ marginRight: 5 }} />
                        <Text style={s.dateText}>{t('assignDate')}: {today}</Text>
                    </View>
                </View>
                <View style={s.statusBubble}>
                    <Ionicons name="information-circle-outline" size={14} color={vg.primary} style={{ marginRight: 5 }} />
                    <Text style={s.statusText}>{t('statusUnassigned')}</Text>
                </View>
            </View>

            {/* ── Two-column body ── */}
            <View style={s.body}>

                {/* LEFT column */}
                <View style={s.colLeft}>

                    {/* Ticket Description — flex:1 so it fills remaining height */}
                    <View style={[s.card, { flex: 1 }]}>
                        <View style={s.cardHeader}>
                            <Ionicons name="document-text-outline" size={17} color={vg.primary} style={{ marginRight: 8 }} />
                            <Text style={s.cardTitle}>{t('ticketDescription')}</Text>
                        </View>

                        {/* flex:1 content area split 70/15/15 */}
                        <View style={{ flex: 1 }}>
                            {/* Description — 70% */}
                            <View style={{ flex: 7, justifyContent: 'flex-start' }}>
                                <Text style={s.descText}>
                                    {ticket?.description || t('noDescription')}
                                </Text>
                            </View>

                            <View style={s.divider} />

                            {/* Priority — 15% */}
                            <View style={[s.infoRow, { flex: 1.5, alignItems: 'center' }]}>
                                <Text style={s.infoLabel}>{t('priority')}</Text>
                                <View style={s.priorityChips}>
                                    {['low', 'medium', 'high', 'critical'].map(p => (
                                        <TouchableOpacity
                                            key={p}
                                            style={[s.priorityChip, priority === p && {
                                                backgroundColor: PRIORITY_COLORS[p] + '28',
                                                borderColor: PRIORITY_COLORS[p],
                                            }]}
                                            onPress={() => setPriority(p)}
                                        >
                                            <Text style={[s.priorityChipText, priority === p && { color: PRIORITY_COLORS[p], fontWeight: '700' }]}>
                                                {p.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={s.divider} />

                            {/* Category — 15% */}
                            <View style={[s.infoRow, { flex: 1.5, alignItems: 'center' }]}>
                                <Text style={s.infoLabel}>{t('ticketCategory')}</Text>
                                <Text style={s.infoValue}>{ticket?.category || '—'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Set Deadline — sits at bottom, bottom aligns with right container */}
                    <View style={s.card}>
                        <View style={s.cardHeader}>
                            <Ionicons name="calendar-outline" size={17} color={vg.primary} style={{ marginRight: 8 }} />
                            <Text style={s.cardTitle}>{t('setDeadline')}</Text>
                        </View>
                        {Platform.OS === 'web' ? (
                            <View style={s.dateInputWrap}>
                                <input
                                    type="date"
                                    value={deadline.toISOString().split('T')[0]}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => e.target.value && setDeadline(new Date(e.target.value))}
                                    style={{
                                        flex: 1, padding: 10, border: 'none', outline: 'none',
                                        backgroundColor: 'transparent', color: vg.text, fontSize: 14,
                                    }}
                                />
                                <Ionicons name="calendar-outline" size={17} color={vg.textFaint} />
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity style={s.dateInputWrap} onPress={() => setShowPicker(true)}>
                                    <Text style={s.dateInputText}>
                                        {deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={17} color={vg.textFaint} />
                                </TouchableOpacity>
                                {showPicker && (
                                    <DateTimePicker
                                        value={deadline} mode="date" minimumDate={new Date()}
                                        display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                                        onChange={(_, sel) => { setShowPicker(Platform.OS === 'ios'); if (sel) setDeadline(sel); }}
                                    />
                                )}
                            </>
                        )}
                        <Text style={s.deadlineHint}>{t('deadlineHint')}</Text>
                    </View>
                </View>

                {/* RIGHT column */}
                <View style={s.colRight}>
                    <View style={[s.card, s.workerCard]}>

                        {/* Header */}
                        <View style={s.workerCardTop}>
                            <View style={s.cardHeader}>
                                <Ionicons name="person-add-outline" size={17} color={vg.primary} style={{ marginRight: 8 }} />
                                <Text style={s.cardTitle}>{t('assignWorker')}</Text>
                            </View>
                            <Text style={s.availableCount}>{filteredWorkers.length} {t('workersAvailable')}</Text>
                        </View>

                        {/* Search (left) + specialty chips (right), search expands on focus */}
                        <View
                            style={s.searchSpecRow}
                            onLayout={e => setSearchRowWidth(e.nativeEvent.layout.width)}
                        >
                            <Animated.View style={{ width: searchAnimWidth, zIndex: searchFocused ? 10 : 1 }}>
                                <View style={s.searchBox}>
                                    <Ionicons name="search-outline" size={14} color={vg.textFaint} style={{ marginRight: 6 }} />
                                    <TextInput
                                        style={s.searchInput}
                                        placeholder={t('searchByName')}
                                        placeholderTextColor={vg.textFaint}
                                        value={search}
                                        onChangeText={setSearch}
                                        onFocus={handleSearchFocus}
                                        onBlur={handleSearchBlur}
                                    />
                                    {search.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearch('')}>
                                            <Ionicons name="close-circle" size={14} color={vg.textFaint} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </Animated.View>

                            <Animated.View style={{ flex: 1, opacity: chipsOpacity }} pointerEvents={searchFocused ? 'none' : 'auto'}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: 6 }}>
                                    {SPECIALTIES.map(sp => (
                                        <TouchableOpacity
                                            key={sp.value}
                                            style={[s.specChip, specialtyFilter === sp.value && s.specChipActive]}
                                            onPress={() => setSpecialtyFilter(sp.value)}
                                        >
                                            <Text style={[s.specChipText, specialtyFilter === sp.value && s.specChipTextActive]}>
                                                {sp.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </Animated.View>
                        </View>

                        {/* Worker list */}
                        <ScrollView style={s.workerList} nestedScrollEnabled showsVerticalScrollIndicator persistentScrollbar>
                            {filteredWorkers.length === 0 ? (
                                <Text style={s.noWorkers}>{t('noWorkers')}</Text>
                            ) : filteredWorkers.map(worker => {
                                const sel = selectedWorker?.id === worker.id;
                                return (
                                    <TouchableOpacity
                                        key={worker.id}
                                        style={[s.workerRow, sel && s.workerRowSel]}
                                        onPress={() => setSelectedWorker(worker)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[s.workerAvatar, sel && { borderColor: vg.primary, borderWidth: 2 }]}>
                                            <Text style={s.workerInitial}>{worker.full_name.charAt(0).toUpperCase()}</Text>
                                        </View>
                                        <View style={s.workerInfo}>
                                            <Text style={[s.workerName, sel && { color: vg.primary }]}>{worker.full_name}</Text>
                                            <Text style={s.workerSpec}>
                                                {worker.specialty || t('general')}{worker.years_experience ? ` · ${worker.years_experience}y exp` : ''}
                                            </Text>
                                        </View>
                                        {sel && <Text style={s.selectedLabel}>{t('selectedBadge')}</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Assign button — bottom right, 25% width */}
                        <TouchableOpacity
                            style={[s.assignBtn, submitting && { opacity: 0.6 }]}
                            onPress={handleAssign}
                            disabled={submitting}
                        >
                            {submitting ? <ActivityIndicator color={vg.primaryBtnText} /> : (
                                <>
                                    <Ionicons name="paper-plane-outline" size={16} color={vg.primaryBtnText} style={{ marginRight: 8 }} />
                                    <Text style={s.assignBtnText}>{t('assignTicketBtn')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <FMNavBar
                activeTab={null}
                onTabChange={tab => router.replace({ pathname: '/fm/dashboard', params: { tab } })}
                subStatus="both"
                onSubStatusChange={() => {}}
                fc={{
                    glassHeader: vg.glass,
                    glassBorder: vg.glassBorder,
                    primary: vg.primary,
                    textFaint: vg.textFaint,
                }}
                theme={theme}
            />
        </LinearGradient>
    );
};

const makeStyles = (vg) => StyleSheet.create({
    root: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: '10%', paddingTop: 22, paddingBottom: 16,
    },
    pageTitle: { fontSize: 26, fontWeight: '800', color: vg.primary, marginBottom: 5, marginLeft: 10 },
    dateRow: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 13, color: vg.textSub },
    statusBubble: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: vg.glass, borderWidth: 1, borderColor: vg.glassBorder,
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
        shadowColor: '#420000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
    },
    statusText: { fontSize: 13, color: vg.primary, fontWeight: '600' },

    // Two-column body — stretch so both columns share same height
    body: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: '10%',
        paddingBottom: 16,
        marginBottom: '7%',
        gap: 14,
    },
    colLeft: { flex: 2, flexDirection: 'column', gap: 12 },
    colRight: { flex: 3 },

    // Cards
    card: {
        backgroundColor: vg.card,
        borderRadius: 18, borderWidth: 1, borderColor: vg.glassBorder,
        padding: 18,
        shadowColor: '#420000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.09, shadowRadius: 16, elevation: 3,
    },
    workerCard: { flex: 1, flexDirection: 'column' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: vg.text },

    // Description
    descText: { fontSize: 13, color: vg.textSub, lineHeight: 20 },
    divider: { height: 1, backgroundColor: vg.divider, marginVertical: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
    infoLabel: { fontSize: 13, color: vg.textSub },
    infoValue: { fontSize: 13, fontWeight: '700', color: vg.text },

    // Priority chips
    priorityChips: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
    priorityChip: {
        paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
        borderWidth: 1, borderColor: vg.glassBorder, backgroundColor: vg.pillBg,
    },
    priorityChipText: { fontSize: 9, fontWeight: '600', color: vg.textFaint, letterSpacing: 0.5 },

    // Deadline
    dateInputWrap: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: vg.inputBorder, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 11, backgroundColor: vg.inputBg, marginBottom: 8,
    },
    dateInputText: { fontSize: 14, color: vg.text },
    deadlineHint: { fontSize: 11, color: vg.textFaint, fontStyle: 'italic' },

    // Worker panel
    workerCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    availableCount: { fontSize: 12, color: vg.textSub },

    // Search + chips row
    searchSpecRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, overflow: 'visible' },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: vg.inputBorder, borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 7, backgroundColor: vg.inputBg,
    },
    searchInput: { flex: 1, fontSize: 13, color: vg.text, paddingVertical: 0 },

    // Specialty chips
    specChip: {
        paddingHorizontal: 13, paddingVertical: 5, borderRadius: 20,
        borderWidth: 1, borderColor: vg.glassBorder, backgroundColor: vg.pillBg,
    },
    specChipActive: { backgroundColor: vg.segActiveBg, borderColor: vg.segActiveBg },
    specChipText: { fontSize: 12, color: vg.textSub, fontWeight: '500' },
    specChipTextActive: { color: vg.segActiveTx, fontWeight: '700' },

    // Worker rows
    workerList: { flex: 1, marginBottom: 12 },
    workerRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12,
        borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: 'transparent',
        backgroundColor: vg.inputBg,
    },
    workerRowSel: { borderColor: vg.primary, backgroundColor: vg.glass },
    workerAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: vg.primary + '22',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    workerInitial: { color: vg.primary, fontWeight: '700', fontSize: 15 },
    workerInfo: { flex: 1 },
    workerName: { fontSize: 14, fontWeight: '600', color: vg.text },
    workerSpec: { fontSize: 12, color: vg.textSub, marginTop: 2 },
    selectedLabel: { fontSize: 10, fontWeight: '700', color: vg.primary, letterSpacing: 0.5 },
    noWorkers: { padding: 16, color: vg.textSub, textAlign: 'center' },

    // Assign button — bottom right, 25% of container
    assignBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        alignSelf: 'flex-end', width: '25%',
        backgroundColor: vg.primaryBtn, paddingVertical: 13, borderRadius: 20,
        shadowColor: '#420000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    assignBtnText: { color: vg.primaryBtnText, fontWeight: '700', fontSize: 14 },
});

export default AssignTicket;
