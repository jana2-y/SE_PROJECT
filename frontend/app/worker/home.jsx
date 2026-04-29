import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Image, Modal,
    StyleSheet, ActivityIndicator, RefreshControl, Alert,
    Switch, SafeAreaView, PanResponder, Dimensions, ImageBackground, Animated, Platform, StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AssignmentCard from '../../components/worker/AssignmentCard';
import SharedHeader from '../../components/SharedHeader';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Velvet & Gold Glass design tokens — mirrors fm/dashboard.jsx
const FC = {
    light: {
        glass: 'rgba(255, 248, 246, 0.72)',
        glassBorder: 'rgba(255, 255, 255, 0.55)',
        glassHeader: 'rgba(255, 240, 238, 0.88)',
        primary: '#420000',
        text: '#31120c',
        textSub: '#57423e',
        textFaint: '#8b716d',
        blob1: '#ffdad3',
        blob2: '#660b05',
        blob3: '#eddfb4',
        btnBg: '#420000',
        btnText: '#ffffff',
        success: '#420000',
        error: '#ba1a1a',
        categoryBg: 'rgba(255,255,255,0.88)',
        categoryText: '#420000',
        segActiveBg: '#420000',
        segActiveTx: '#ffffff',
        segInactiveTx: '#420000',
        divider: 'rgba(49,18,12,0.08)',
        modalBg: '#fff0ee',
    },
    dark: {
        glass: 'rgba(74, 39, 31, 0.72)',
        glassBorder: 'rgba(255, 218, 211, 0.14)',
        glassHeader: 'rgba(74, 39, 31, 0.88)',
        primary: '#ffb4a8',
        text: '#fff8f6',
        textSub: 'rgba(255,248,246,0.62)',
        textFaint: 'rgba(255,248,246,0.38)',
        blob1: '#660b05',
        blob2: '#4a271f',
        blob3: '#3a1a00',
        btnBg: '#660b05',
        btnText: '#ffdad4',
        success: '#660b05',
        error: '#cf6679',
        categoryBg: 'rgba(74,39,31,0.88)',
        categoryText: '#ffb4a8',
        segActiveBg: '#660b05',
        segActiveTx: '#ffdad4',
        segInactiveTx: 'rgba(255,248,246,0.65)',
        divider: 'rgba(255,248,246,0.08)',
        modalBg: '#2a0f09',
    },
};

const PRIORITY_COLORS = {
    low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#7C3AED',
};
const PRIORITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };

const STATUS_FILTERS = [
    { label: 'All',         value: '' },
    { label: 'Assigned',    value: 'assigned' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Reassigned',  value: 'reassigned' },
    { label: 'Completed',   value: 'completed' },
];

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LOGO_IMAGE = require('../../assets/images/cclogo.png');

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────

const CalendarView = ({ assignments, styles, fc, onStartWork, onShowModal }) => {
    const [calMonth, setCalMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const byDate = useMemo(() => {
        const map = {};
        assignments.forEach((a) => {
            if (!a.deadline) return;
            const key = a.deadline.split('T')[0];
            if (!map[key]) map[key] = [];
            map[key].push(a);
        });
        return map;
    }, [assignments]);

    const year  = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth    = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const todayStr      = new Date().toISOString().split('T')[0];
    const selectedItems = selectedDate ? (byDate[selectedDate] || []) : [];

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, { dx, dy }) =>
            Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15,
        onPanResponderRelease: (_, { dx }) => {
            if (dx < -60) {
                setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                setSelectedDate(null);
            } else if (dx > 60) {
                setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                setSelectedDate(null);
            }
        },
    }), []);

    const getPriorityDots = (dateStr) => {
        const items = byDate[dateStr] || [];
        if (!items.length) return [];
        return [...new Set(items.map(a => a.priority || 'low'))]
            .sort((a, b) => (PRIORITY_ORDER[b] || 0) - (PRIORITY_ORDER[a] || 0))
            .slice(0, 3);
    };

    return (
        <ScrollView style={{ flex: 1 }}>
            <View style={styles.calHeader}>
                <TouchableOpacity style={styles.calNavBtn}
                    onPress={() => { setCalMonth(new Date(year, month - 1, 1)); setSelectedDate(null); }}>
                    <Ionicons name="chevron-back" size={20} color={fc.primary} />
                </TouchableOpacity>
                <Text style={styles.calMonthTitle}>{MONTH_NAMES[month]} {year}</Text>
                <TouchableOpacity style={styles.calNavBtn}
                    onPress={() => { setCalMonth(new Date(year, month + 1, 1)); setSelectedDate(null); }}>
                    <Ionicons name="chevron-forward" size={20} color={fc.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.calDayRow}>
                {DAY_NAMES.map((d) => (
                    <Text key={d} style={styles.calDayLabel}>{d}</Text>
                ))}
            </View>

            <View {...panResponder.panHandlers} style={styles.calGrid}>
                {cells.map((day, idx) => {
                    if (!day) return <View key={`empty-${idx}`} style={styles.calCell} />;
                    const dateStr    = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dots       = getPriorityDots(dateStr);
                    const isSelected = selectedDate === dateStr;
                    const isToday    = dateStr === todayStr;
                    return (
                        <TouchableOpacity
                            key={dateStr}
                            style={[styles.calCell, isToday && styles.calCellToday, isSelected && styles.calCellSelected]}
                            onPress={() => setSelectedDate(isSelected ? null : dateStr)}
                        >
                            <Text style={[styles.calDayNum, isToday && styles.calDayNumToday, isSelected && styles.calDayNumSelected]}>
                                {day}
                            </Text>
                            {dots.length > 0 && (
                                <View style={styles.calDots}>
                                    {dots.map((p, i) => (
                                        <View key={i} style={[styles.calDot, { backgroundColor: isSelected ? fc.btnText : PRIORITY_COLORS[p] }]} />
                                    ))}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.calLegend}>
                {Object.entries(PRIORITY_COLORS).map(([p, color]) => (
                    <View key={p} style={styles.calLegendItem}>
                        <View style={[styles.calLegendDot, { backgroundColor: color }]} />
                        <Text style={styles.calLegendLabel}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                    </View>
                ))}
            </View>

            {selectedDate && (
                <View style={styles.calSection}>
                    <Text style={styles.calSectionTitle}>Deadline: {selectedDate}</Text>
                    {selectedItems.length === 0 ? (
                        <Text style={styles.emptyText}>No assignments due this day.</Text>
                    ) : (
                        selectedItems.map((item) => (
                            <AssignmentCard key={item.id} assignment={item} onStartWork={onStartWork} onShowModal={onShowModal} />
                        ))
                    )}
                </View>
            )}

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

// ─── MODAL ROW HELPER ─────────────────────────────────────────────────────────

const ModalRow = ({ label, value, valueColor, fc }) => (
    <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: fc.text, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 13, color: valueColor || fc.textSub, lineHeight: 18 }}>{value}</Text>
    </View>
);

// ─── WORKER HOME ──────────────────────────────────────────────────────────────

const WorkerHome = () => {
    const router = useRouter();
    const { theme } = useTheme();
    const { user } = useAuth();
    const fc = FC[theme] || FC.light;
    const styles = useMemo(() => makeStyles(fc, theme), [fc, theme]);

    const [assignments, setAssignments]       = useState([]);
    const [loading, setLoading]               = useState(true);
    const [refreshing, setRefreshing]         = useState(false);
    const [filterStatus, setFilterStatus]     = useState('assigned');
    const [sortDesc, setSortDesc]             = useState(false);
    const [isCalendarView, setIsCalendarView] = useState(false);
    const [notifRefreshKey, setNotifRefreshKey] = useState(0);
    const [modalVisible, setModalVisible]       = useState(false);
    const [modalContent, setModalContent]       = useState({ type: '', item: null });
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [apiFfpUrl, setApiFfpUrl]             = useState(null);
    // Live URL: prefer AuthContext (updated immediately on settings save), fall back to API fetch
    const pfpUrl = user?.workerpfp_url || apiFfpUrl;

    const notifListenerRef    = useRef(null);
    const responseListenerRef = useRef(null);

    const displayedAssignments = useMemo(() => {
        let list = filterStatus
            ? assignments.filter((a) => a.status === filterStatus)
            : assignments;

        list = [...list].sort((a, b) => {
            const da = a.deadline ? new Date(a.deadline) : new Date('9999');
            const db = b.deadline ? new Date(b.deadline) : new Date('9999');
            return sortDesc ? db - da : da - db;
        });

        return list;
    }, [assignments, filterStatus, sortDesc]);

    // ── Fetchers ──────────────────────────────────────────────────────────────

    const fetchAssignments = useCallback(async () => {
        try {
            const data = await api.get('/worker/tickets');
            setAssignments(data || []);
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchPfp = useCallback(async () => {
        try {
            const data = await api.get('/worker/profile');
            if (data?.workerpfp_url) setApiFfpUrl(`${data.workerpfp_url}?v=${Date.now()}`);
        } catch {}
    }, []);

    useFocusEffect(useCallback(() => {
        fetchPfp();
        fetchAssignments();
    }, [fetchPfp, fetchAssignments]));

    // ── Push notification registration ────────────────────────────────────────

    useEffect(() => {
        const register = async () => {
            try {
                const { status: existing } = await Notifications.getPermissionsAsync();
                let finalStatus = existing;
                if (existing !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== 'granted') return;

                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync('default', {
                        name: 'CampusCare',
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        sound: 'default',
                    });
                }

                const projectId =
                    Constants.expoConfig?.extra?.eas?.projectId ??
                    Constants.easConfig?.projectId;
                const tokenData = await Notifications.getExpoPushTokenAsync(
                    projectId ? { projectId } : undefined,
                );
                const token = tokenData.data;
                if (token) await api.patch('/worker/push-token', { push_token: token });
            } catch {}
        };

        register();

        notifListenerRef.current = Notifications.addNotificationReceivedListener(() => {
            setNotifRefreshKey(k => k + 1);
        });
        responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(() => {
            fetchAssignments();
            setNotifRefreshKey(k => k + 1);
        });

        return () => {
            notifListenerRef.current?.remove();
            responseListenerRef.current?.remove();
        };
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const onRefresh = () => { setRefreshing(true); fetchAssignments(); };

    const showModal = (type, item) => {
        setModalContent({ type, item });
        setModalVisible(true);
    };

    const handleStartWork = async (assignmentId) => {
        try {
            await api.patch(`/worker/tickets/${assignmentId}/start`, {});
            fetchAssignments();
        } catch (err) {
            Alert.alert('Error', err.message);
        }
    };

    // ── Loading state ─────────────────────────────────────────────────────────

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: fc.glassHeader }}>
                <ImageBackground
                    source={theme === 'dark'
                        ? require('../../assets/images/bg.png')
                        : require('../../assets/images/bg2.png')}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                >
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={fc.primary} />
                    </View>
                </ImageBackground>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: fc.glassHeader }}>
            <ImageBackground
                source={theme === 'dark'
                    ? require('../../assets/images/bg.png')
                    : require('../../assets/images/bg2.png')}
                style={styles.bgImage}
                resizeMode="cover"
            >
                {/* Organic blob decorations */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <View style={[styles.blob, styles.blob1, { backgroundColor: fc.blob1 }]} />
                    <View style={[styles.blob, styles.blob2, { backgroundColor: fc.blob2 }]} />
                    <View style={[styles.blob, styles.blob3, { backgroundColor: fc.blob3 }]} />
                </View>

                {/* ── HEADER ── */}
                <SharedHeader
                    onAccept={() => fetchAssignments()}
                    refreshKey={notifRefreshKey}
                />

                {/* ── FILTER BAR ── */}
                <View style={styles.filterBar}>
                    {/* Status filter chips */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipsContent}
                    >
                        {STATUS_FILTERS.map(({ label, value }) => {
                            const active = filterStatus === value;
                            return (
                                <TouchableOpacity
                                    key={value}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => setFilterStatus(value)}
                                    activeOpacity={0.75}
                                >
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Sort + View toggle */}
                    <View style={styles.filterFooterRow}>
                        <TouchableOpacity
                            style={styles.sortBtn}
                            onPress={() => setSortDesc((p) => !p)}
                        >
                            <Ionicons
                                name={sortDesc ? 'arrow-down-outline' : 'arrow-up-outline'}
                                size={14}
                                color={fc.primary}
                            />
                            <Text style={styles.sortBtnText}>
                                Deadline {sortDesc ? '↓ Latest' : '↑ Soonest'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.viewToggle}>
                            <Ionicons
                                name={isCalendarView ? 'calendar' : 'list'}
                                size={14}
                                color={isCalendarView ? fc.primary : fc.textSub}
                            />
                            <Text style={[styles.viewToggleLabel, isCalendarView && { color: fc.primary }]}>
                                {isCalendarView ? 'Calendar' : 'List'}
                            </Text>
                            <Switch
                                value={isCalendarView}
                                onValueChange={setIsCalendarView}
                                trackColor={{ false: fc.divider, true: fc.primary + '66' }}
                                thumbColor={isCalendarView ? fc.primary : fc.textFaint}
                            />
                        </View>
                    </View>
                </View>

                {/* ── CONTENT ── */}
                {isCalendarView ? (
                    <CalendarView
                        assignments={assignments}
                        styles={styles}
                        fc={fc}
                        onStartWork={handleStartWork}
                        onShowModal={showModal}
                    />
                ) : (
                    <ScrollView
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={fc.primary}
                            />
                        }
                    >
                        {displayedAssignments.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <Ionicons name="clipboard-outline" size={48} color={fc.textSub} />
                                <Text style={styles.emptyText}>No assignments found.</Text>
                            </View>
                        ) : (
                            displayedAssignments.map((item) => (
                                <AssignmentCard
                                    key={item.id}
                                    assignment={item}
                                    onStartWork={handleStartWork}
                                    onShowModal={showModal}
                                />
                            ))
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

            </ImageBackground>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View
                        style={[styles.modalContainer, { backgroundColor: fc.glass, borderColor: fc.glassBorder }]}
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={e => e.stopPropagation()}
                    >
                        {/* Title */}
                        <Text style={styles.modalTitle}>
                            {modalContent.type === 'details' ? 'Ticket Details'
                                : modalContent.type === 'proof' ? 'Proof of Work'
                                : 'FM Feedback'}
                        </Text>

                        {/* Feedback — vertical stack */}
                        {modalContent.type === 'feedback' ? (
                            <View style={{ marginVertical: 12 }}>
                                <ModalRow
                                    label="Total Attempts"
                                    value={String(modalContent.item?.attempt_number ?? '—')}
                                    fc={fc}
                                />
                                <ModalRow
                                    label="FM Feedback"
                                    value={modalContent.item?.feedback || 'No feedback yet.'}
                                    fc={fc}
                                />
                            </View>
                        ) : (
                            /* Details / Proof — two-column split */
                            <View style={styles.modalSplit}>
                                {/* Left: image (tap to expand) */}
                                <View style={styles.modalImageCol}>
                                    {(() => {
                                        const imgUri = modalContent.type === 'details'
                                            ? modalContent.item?.tickets?.image_url
                                            : modalContent.item?.proof_url;
                                        return imgUri ? (
                                            <TouchableOpacity activeOpacity={0.85} onPress={() => setImagePreviewUrl(imgUri)} style={{ flex: 1 }}>
                                                <Image source={{ uri: imgUri }} style={styles.modalImage} resizeMode="cover" />
                                                <View style={styles.expandHint}>
                                                    <Ionicons name="expand-outline" size={14} color="#fff" />
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
                                                <Ionicons name="image-outline" size={36} color={fc.textFaint} />
                                            </View>
                                        );
                                    })()}
                                </View>

                                {/* Right: metadata */}
                                <ScrollView style={styles.modalMetaCol} showsVerticalScrollIndicator={false}>
                                    {modalContent.type === 'details' ? (
                                        <>
                                            <ModalRow label="Category"    value={modalContent.item?.tickets?.category || '—'} fc={fc} />
                                            <ModalRow
                                                label="Location"
                                                value={[
                                                    modalContent.item?.tickets?.area,
                                                    modalContent.item?.tickets?.floor ? `Floor ${modalContent.item.tickets.floor}` : null,
                                                    modalContent.item?.tickets?.specific_location,
                                                ].filter(Boolean).join(' · ') || '—'}
                                                fc={fc}
                                            />
                                            <ModalRow
                                                label="Priority"
                                                value={(modalContent.item?.priority || '—').toUpperCase()}
                                                valueColor={PRIORITY_COLORS[modalContent.item?.priority]}
                                                fc={fc}
                                            />
                                            <ModalRow
                                                label="Deadline"
                                                value={modalContent.item?.deadline
                                                    ? new Date(modalContent.item.deadline).toLocaleDateString()
                                                    : '—'}
                                                fc={fc}
                                            />
                                            <ModalRow label="Description" value={modalContent.item?.tickets?.description || '—'} fc={fc} />
                                        </>
                                    ) : (
                                        <>
                                            <ModalRow label="Status"      value={modalContent.item?.status || '—'} fc={fc} />
                                            <ModalRow label="Worker Note" value={modalContent.item?.worker_note || 'No note provided.'} fc={fc} />
                                            <ModalRow
                                                label="Submitted At"
                                                value={modalContent.item?.updated_at
                                                    ? new Date(modalContent.item.updated_at).toLocaleString()
                                                    : '—'}
                                                fc={fc}
                                            />
                                        </>
                                    )}
                                </ScrollView>
                            </View>
                        )}

                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalCloseBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── IMAGE PREVIEW ── */}
            <Modal
                visible={!!imagePreviewUrl}
                transparent
                animationType="fade"
                onRequestClose={() => setImagePreviewUrl(null)}
            >
                <TouchableOpacity
                    style={styles.previewOverlay}
                    activeOpacity={1}
                    onPress={() => setImagePreviewUrl(null)}
                >
                    <View style={[styles.previewCard, { backgroundColor: fc.glass, borderColor: fc.glassBorder }]}>
                        <Image source={{ uri: imagePreviewUrl }} style={styles.previewImage} resizeMode="contain" />
                        <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setImagePreviewUrl(null)}>
                            <Ionicons name="close-circle" size={32} color={fc.primary} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const makeStyles = (fc, theme) => StyleSheet.create({
    bgImage: { flex: 1, width: '100%', height: '100%' },

    blob: { position: 'absolute', borderRadius: 9999, opacity: 0.38 },
    blob1: { width: SCREEN_WIDTH * 0.85, height: SCREEN_WIDTH * 0.85, top: -SCREEN_WIDTH * 0.22, left: -SCREEN_WIDTH * 0.22 },
    blob2: { width: SCREEN_WIDTH * 0.65, height: SCREEN_WIDTH * 0.65, top: '42%', right: -SCREEN_WIDTH * 0.18 },
    blob3: { width: SCREEN_WIDTH * 0.55, height: SCREEN_WIDTH * 0.55, bottom: -SCREEN_WIDTH * 0.12, left: '18%' },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header — glass, matches filterBar proportions from fm/dashboard
    header: {
        backgroundColor: fc.glassHeader,
        borderBottomWidth: 1,
        borderColor: fc.glassBorder,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    headerIconBtn: { padding: 4, width: 44, alignItems: 'center' },
    headerLogo: { width: 120, height: 36 },
    headerPfp: {
        width: 36, height: 36, borderRadius: 18,
        borderWidth: 2, borderColor: fc.primary,
    },
    notifBadge: {
        position: 'absolute', top: -4, right: -6,
        backgroundColor: '#EF4444', borderRadius: 8,
        minWidth: 16, height: 16,
        alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    },
    notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    // Filter bar — glass header, same as fm/dashboard filterBar
    filterBar: {
        backgroundColor: fc.glassHeader,
        borderBottomWidth: 1,
        borderColor: fc.glassBorder,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 8,
    },
    chipsContent: { paddingBottom: 10, gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1, borderColor: fc.glassBorder,
        backgroundColor: fc.glass,
    },
    chipActive: { backgroundColor: fc.segActiveBg, borderColor: fc.segActiveBg },
    chipText: { fontSize: 13, fontWeight: '600', color: fc.segInactiveTx },
    chipTextActive: { color: fc.segActiveTx },

    // Filter footer row
    filterFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sortBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: fc.glassBorder,
        backgroundColor: fc.glass,
    },
    sortBtnText: { fontSize: 12, fontWeight: '600', color: fc.primary },
    viewToggle: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: fc.glass,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1, borderColor: fc.glassBorder,
    },
    viewToggleLabel: { fontSize: 13, fontWeight: '600', color: fc.textSub },

    // List
    list: { flex: 1 },
    listContent: { paddingHorizontal: 16, paddingTop: 14 },
    emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
    emptyText: { color: fc.textSub, fontSize: 15 },

    // Calendar
    calHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: fc.glassHeader,
        borderBottomWidth: 1, borderColor: fc.glassBorder,
    },
    calNavBtn: { padding: 6 },
    calMonthTitle: { fontSize: 17, fontWeight: '700', color: fc.text },
    calDayRow: {
        flexDirection: 'row',
        backgroundColor: fc.glass,
        paddingVertical: 6,
        borderBottomWidth: 1, borderColor: fc.glassBorder,
    },
    calDayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: fc.textSub },
    calGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        backgroundColor: fc.glass,
        paddingHorizontal: 4, paddingVertical: 4,
    },
    calCell: {
        width: `${100 / 7}%`, aspectRatio: 1,
        alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, marginVertical: 2,
    },
    calCellToday: { borderWidth: 1.5, borderColor: fc.primary },
    calCellSelected: { backgroundColor: fc.segActiveBg },
    calDayNum: { fontSize: 14, color: fc.text },
    calDayNumToday: { fontWeight: '700', color: fc.primary },
    calDayNumSelected: { color: fc.segActiveTx, fontWeight: '700' },
    calDots: { flexDirection: 'row', justifyContent: 'center', gap: 3, marginTop: 2 },
    calDot: { width: 5, height: 5, borderRadius: 3 },
    calLegend: {
        flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 14,
        paddingVertical: 12, paddingHorizontal: 8,
        backgroundColor: fc.glassHeader,
        borderTopWidth: 1, borderColor: fc.glassBorder,
    },
    calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    calLegendDot: { width: 9, height: 9, borderRadius: 5 },
    calLegendLabel: { fontSize: 11, color: fc.textSub, fontWeight: '600' },
    calSection: { paddingHorizontal: 16, paddingTop: 16 },
    calSectionTitle: { fontSize: 14, fontWeight: '700', color: fc.text, marginBottom: 10 },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center',
    },
    modalContainer: {
        width: '90%', borderRadius: 24, padding: 20,
        borderWidth: 1.5,
        maxHeight: SCREEN_HEIGHT * 0.75,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 12,
    },
    expandHint: {
        position: 'absolute', bottom: 6, right: 6,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 12, padding: 4,
    },
    modalTitle: { fontSize: 17, fontWeight: '800', color: fc.text, marginBottom: 4 },
    modalSplit: { flexDirection: 'row', height: 220, gap: 12, marginVertical: 12 },
    modalImageCol: { flex: 1, borderRadius: 16, overflow: 'hidden' },
    modalImage: { width: '100%', height: '100%' },
    modalImagePlaceholder: {
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: fc.divider,
    },
    modalMetaCol: { flex: 1.2 },
    modalCloseBtn: {
        alignSelf: 'center', marginTop: 16,
        backgroundColor: fc.btnBg,
        paddingHorizontal: 28, paddingVertical: 10, borderRadius: 20,
    },
    modalCloseBtnText: { color: fc.btnText, fontWeight: '700', fontSize: 14 },

    // Image preview
    previewOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.82)',
        justifyContent: 'center', alignItems: 'center',
    },
    previewCard: {
        width: '92%', borderRadius: 24, borderWidth: 1.5,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 14,
    },
    previewImage: { width: '100%', height: SCREEN_HEIGHT * 0.6 },
    previewCloseBtn: {
        position: 'absolute', top: 10, right: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20, padding: 2,
    },
});

export default WorkerHome;
