import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, RefreshControl, Alert,
    Modal, Dimensions, ImageBackground, Animated, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import FeedbackModal from '../../components/FM/FeedbackModal';
import FMNavBar from '../../components/FM/FMNavBar';

// Velvet & Gold Glass design tokens
const FC = {
    light: {
        glass: 'rgba(255, 248, 246, 0.72)',
        glassBorder: 'rgba(255, 255, 255, 0.55)',
        glassHeader: 'rgba(255, 240, 238, 0.88)',
        primary: '#800020',
        text: '#31120c',
        textSub: '#57423e',
        textFaint: '#8b716d',
        blob1: '#ffdad3',
        blob2: '#660b05',
        blob3: '#eddfb4',
        btnBg: '#800020',
        btnText: '#ffffff',
        success: '#800020',
        error: '#ba1a1a',
        categoryBg: 'rgba(255,255,255,0.88)',
        categoryText: '#800020',
        segActiveBg: '#800020',
        segActiveTx: '#ffffff',
        segInactiveTx: '#800020',
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
    low: '#6B7280',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#7C3AED',
};

const allLocations = [
    { label: 'Building M', value: 'Building M' },
    { label: 'Building S', value: 'Building S' },
    { label: 'Building A', value: 'Building A' },
    { label: 'Building C', value: 'Building C' },
    { label: 'Food Court', value: 'Food Court' },
    { label: 'Boosters', value: 'Boosters' },
    { label: 'Panorama', value: 'Panorama' },
    { label: 'Pool', value: 'Pool' },
    { label: 'Stationary Shop', value: 'Stationary Shop' },
    { label: 'Padel', value: 'Padel' },
    { label: 'Prayer Room', value: 'Prayer Room' },
    { label: 'Supermarket', value: 'Supermarket' },
    { label: 'Gym', value: 'Gym' },
    { label: 'Volleyball Court', value: 'Volleyball Court' },
    { label: 'Basketball Court', value: 'Basketball Court' },
    { label: 'Football Court', value: 'Football Court' },
    { label: 'Supermarket Pathway', value: 'Supermarket Pathway' },
    { label: 'Between A and S', value: 'Between A and S' },
    { label: 'Between S and M', value: 'Between S and M' },
    { label: 'Between A and C', value: 'Between A and C' },
    { label: 'U of the M Building', value: 'U of the M Building' },
];

// Unified custom dropdown — searchable optional, z-index configurable
const CustomDropdown = ({ id, openId, setOpenId, value, onValueChange, items, label, fc, theme, searchable = false, zIndex = 30, whiteText = false, hideClear = false, t }) => {
    const open = openId === id;
    const setOpen = (val) => setOpenId(val ? id : null);
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!searchable || !search) return items;
        const q = search.toLowerCase();
        return items.filter(i => i.label.toLowerCase().includes(q));
    }, [items, search, searchable]);

    const selectedLabel = value ? items.find(i => i.value === value)?.label : null;
    const btnTextColor = (whiteText && theme === 'dark') ? '#ffffff' : fc.text;
    const itemActiveColor = (whiteText && theme === 'dark') ? '#ffffff' : fc.primary;
    const dropBg = theme === 'dark' ? '#1a0805' : '#fff5f3';
    const borderClr = theme === 'dark' ? 'rgba(60,15,5,0.95)' : 'rgba(66,0,0,0.22)';
    const divClr = theme === 'dark' ? 'rgba(255,218,211,0.08)' : 'rgba(66,0,0,0.06)';

    return (
        <View style={{ position: 'relative', zIndex }}>
            <TouchableOpacity
                onPress={() => { setOpen(v => !v); setSearch(''); }}
                style={{
                    backgroundColor: theme === 'dark' ? '#2a0f09' : 'rgba(255, 218, 211, 0.85)',
                    borderRadius: 8,
                    borderWidth: 0.5,
                    borderColor: borderClr,
                    width: 110,
                    height: 34,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 8,
                    justifyContent: 'space-between',
                }}
            >
                <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: btnTextColor }}>
                    {selectedLabel || label}
                </Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={12} color={(whiteText && theme === 'dark') ? '#ffffff' : fc.primary} />
            </TouchableOpacity>

            {open && (
                <TouchableOpacity
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}
                    onPress={() => { setOpenId(null); setSearch(''); }}
                    activeOpacity={1}
                />
            )}
            {open && (
                <View style={{
                    position: 'absolute',
                    top: 38,
                    left: 0,
                    width: 210,
                    backgroundColor: dropBg,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: borderClr,
                    shadowColor: '#420000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.28,
                    shadowRadius: 14,
                    elevation: 30,
                    overflow: 'hidden',
                    zIndex: 9999,
                }}>
                    {searchable && (
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            borderBottomWidth: 1, borderColor: divClr,
                            paddingHorizontal: 10, paddingVertical: 6,
                        }}>
                            <Ionicons name="search-outline" size={13} color={fc.textFaint} style={{ marginRight: 5 }} />
                            <TextInput
                                style={{ flex: 1, fontSize: 12, color: fc.text, paddingVertical: 2 }}
                                placeholder={t ? t('searchByName') : 'Search...'}
                                placeholderTextColor={fc.textFaint}
                                value={search}
                                onChangeText={setSearch}
                                autoFocus
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <Ionicons name="close-circle" size={13} color={fc.textFaint} />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
                        {!hideClear && (
                            <TouchableOpacity
                                onPress={() => { onValueChange(''); setOpen(false); setSearch(''); }}
                                style={{
                                    paddingHorizontal: 12, paddingVertical: 9,
                                    borderBottomWidth: 1, borderColor: divClr,
                                    backgroundColor: !value ? (theme === 'dark' ? 'rgba(255,180,168,0.1)' : 'rgba(66,0,0,0.06)') : 'transparent',
                                }}
                            >
                                <Text style={{ fontSize: 12, color: fc.textSub, fontStyle: 'italic' }}>{label}</Text>
                            </TouchableOpacity>
                        )}
                        {filtered.map(item => (
                            <TouchableOpacity
                                key={item.value}
                                onPress={() => { onValueChange(item.value); setOpen(false); setSearch(''); }}
                                style={{
                                    paddingHorizontal: 12, paddingVertical: 9,
                                    borderBottomWidth: 1, borderColor: divClr,
                                    backgroundColor: value === item.value ? (theme === 'dark' ? 'rgba(255,180,168,0.1)' : 'rgba(66,0,0,0.06)') : 'transparent',
                                }}
                            >
                                <Text style={{ fontSize: 12, color: value === item.value ? itemActiveColor : fc.text, fontWeight: value === item.value ? '700' : '400' }}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {filtered.length === 0 && (
                            <Text style={{ fontSize: 12, color: fc.textFaint, padding: 12 }}>{t ? t('noResults') : 'No results'}</Text>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const DetailRow = ({ label, value, valueColor, textColor }) => (
    <View style={{ flexDirection: 'row', marginBottom: 6, flexWrap: 'wrap' }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: textColor || '#555', marginRight: 6 }}>{label}:</Text>
        <Text style={{ fontSize: 13, color: valueColor || textColor || '#333', flex: 1 }}>{value}</Text>
    </View>
);

const FMDashboard = () => {
    const router = useRouter();
    const { assigned } = useLocalSearchParams();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { theme } = useTheme();
    const fc = FC[theme] || FC.light;
    const styles = useMemo(() => makeStyles(fc, theme), [fc, theme]);

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [filterArea, setFilterArea] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterSort, setFilterSort] = useState('recent');
    const [layoutMode, setLayoutMode] = useState('wide');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const [subStatus, setSubStatus] = useState('all');
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [ticketDetailVisible, setTicketDetailVisible] = useState(false);
    const [selectedDetailTicket, setSelectedDetailTicket] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [previewSize, setPreviewSize] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [detailAssignments, setDetailAssignments] = useState([]);
    const [detailAttemptIdx, setDetailAttemptIdx] = useState(0);
    const [detailAssignmentsLoading, setDetailAssignmentsLoading] = useState(false);

    const popupAnim = useRef(new Animated.Value(0)).current;
    const assignedSlide = useRef(new Animated.Value(-36)).current;
    const [showAssignedPopup, setShowAssignedPopup] = useState(false);
    const SUB_KEYS = ['all', 'assigned', 'reassigned', 'feedback'];
    const subSlide = useRef(new Animated.Value(0)).current;
    const [subSegWidth, setSubSegWidth] = useState(0);
    const assignedShown = useRef(false);

    // Derive server-side status from active tab
    const serverStatus = activeTab === 'pending' ? 'pending'
        : activeTab === 'completed' ? 'completed'
            : activeTab === 'overdue' ? 'overdue'
                : ''; // 'assigned' and 'all' tabs fetch everything, filter client-side

    const fetchTickets = useCallback(async () => {
        setFetchError('');
        try {
            const params = new URLSearchParams();
            if (filterCategory) params.append('category', filterCategory);
            if (serverStatus) params.append('status', serverStatus);
            if (filterSort) params.append('sort', filterSort);
            const data = await api.get(`/fm/tickets?${params.toString()}`);
            setTickets(data);
        } catch (err) {
            const msg = err?.message || JSON.stringify(err) || 'Unknown error';
            console.error('[FM Dashboard] fetchTickets failed:', msg);
            setFetchError(msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filterCategory, serverStatus, filterSort]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    // Client-side filtering for search + assigned sub-status
    const displayedTickets = useMemo(() => {
        let list = tickets;
        if (activeTab === 'assigned') {
            if (subStatus === 'assigned') list = list.filter(t => t.status === 'assigned');
            else if (subStatus === 'reassigned') list = list.filter(t => t.status === 'reassigned');
            else if (subStatus === 'feedback') list = list.filter(t => t.status === 'in_progress');
            else list = list.filter(t => t.status === 'assigned' || t.status === 'in_progress' || t.status === 'reassigned'); // 'all'
        }
        if (activeTab === 'overdue') list = list.filter(t => t.status === 'overdue');
        if (filterArea) list = list.filter(t => t.area === filterArea);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(t =>
                t.description?.toLowerCase().includes(q) ||
                t.category?.toLowerCase().includes(q) ||
                t.area?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [tickets, activeTab, subStatus, filterArea, searchQuery]);

    useEffect(() => {
        if (!imagePreviewUrl) { setPreviewSize(null); popupAnim.setValue(0); return; }
        Image.getSize(imagePreviewUrl, (w, h) => {
            const maxW = SCREEN_WIDTH * 0.92;
            const scale = Math.min(1, maxW / w);
            setPreviewSize({ width: Math.round(w * scale), height: Math.round(h * scale) });
        }, () => setPreviewSize(null));
        Animated.spring(popupAnim, {
            toValue: 1, useNativeDriver: true, tension: 120, friction: 9,
        }).start();
    }, [imagePreviewUrl]);

    useEffect(() => {
        Animated.spring(subSlide, {
            toValue: SUB_KEYS.indexOf(subStatus),
            useNativeDriver: true, tension: 180, friction: 18,
        }).start();
    }, [subStatus]);

    useEffect(() => {
        if (assigned === '1' && !assignedShown.current) {
            assignedShown.current = true;
            setShowAssignedPopup(true);
            Animated.spring(assignedSlide, { toValue: 0, useNativeDriver: true, tension: 180, friction: 16 }).start();
            setTimeout(() => {
                Animated.spring(assignedSlide, { toValue: -36, useNativeDriver: true, tension: 180, friction: 16 }).start(() => {
                    setShowAssignedPopup(false);
                });
            }, 5000);
        }
    }, [assigned]);

    useEffect(() => {
        if (!selectedDetailTicket) { setDetailAssignments([]); setDetailAttemptIdx(0); return; }
        setDetailAttemptIdx(0);
        setDetailAssignmentsLoading(true);
        api.get(`/fm/tickets/${selectedDetailTicket.id}/assignments`)
            .then(data => setDetailAssignments(data || []))
            .catch(() => setDetailAssignments([]))
            .finally(() => setDetailAssignmentsLoading(false));
    }, [selectedDetailTicket]);

    const onRefresh = () => { setRefreshing(true); fetchTickets(); };

    const handleResetFilters = () => {
        setFilterArea('');
        setFilterCategory('');
        setFilterSort('recent');
        setSearchQuery('');
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
        if (status === 'in_progress') {
            return (
                <TouchableOpacity
                    style={styles.btnFeedback}
                    onPress={() => { setSelectedTicketId(ticket.id); setFeedbackModalVisible(true); }}
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
                <View style={styles.completedFooterRow}>
                    <TouchableOpacity onPress={() => { setSelectedDetailTicket(ticket); setTicketDetailVisible(true); }}>
                        <Text style={styles.viewTicketLink}>{t('viewTicket')}</Text>
                    </TouchableOpacity>
                    <View style={styles.btnAssigned}>
                        <Text style={styles.btnAssignedText}>{t('reassigned')}</Text>
                    </View>
                </View>
            );
        }
        if (status === 'overdue') {
            return (
                <View style={styles.overdueFooterRow}>
                    <TouchableOpacity
                        style={styles.btnOverdueReassign}
                        onPress={() => router.push({ pathname: '/fm/assign', params: { ticketId: ticket.id, reassign: '1' } })}
                    >
                        <Text style={styles.btnOverdueReassignText}>{t('reassign')}</Text>
                    </TouchableOpacity>
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
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[priority] + '22' }]}>
                <Text style={[styles.priorityText, { color: PRIORITY_COLORS[priority] }]}>
                    {t(priority).toUpperCase()}
                </Text>
            </View>
        );
    };

    return (
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

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={fc.primary} />
                    {fetchError ? (
                        <Text style={[styles.emptyText, { marginTop: 16, color: fc.error, textAlign: 'center', paddingHorizontal: 24 }]}>
                            {fetchError}
                        </Text>
                    ) : null}
                </View>
            ) : (
                <>
                    {/* Filter bar */}
                    <View style={styles.filterBar}>
                        {/* Search bar */}
                        <View style={styles.searchRow}>
                            {/* Outer white border */}
                            <View style={styles.searchBoxOuter}>
                                {/* Inner light gray border */}
                                <View style={styles.searchBox}>
                                    <Ionicons name="search-outline" size={16} color={fc.textFaint} style={{ marginRight: 6 }} />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder={t('searchTickets')}
                                        placeholderTextColor={fc.textFaint}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        autoCapitalize="none"
                                    />
                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                                            <Ionicons name="close-circle" size={16} color={fc.textFaint} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Controls row: [Location][Category][Sort][Both|Assigned|Reassigned?] ... [Reset][Layout] */}
                        <View style={styles.controlsRow}>
                            <View style={styles.controlsLeft}>
                                <CustomDropdown
                                    id="location"
                                    openId={openDropdown}
                                    setOpenId={setOpenDropdown}
                                    value={filterArea}
                                    onValueChange={setFilterArea}
                                    items={allLocations}
                                    label={t('locationFilter')}
                                    fc={fc}
                                    theme={theme}
                                    searchable
                                    zIndex={50}
                                    whiteText
                                    t={t}
                                />
                                <CustomDropdown
                                    id="category"
                                    openId={openDropdown}
                                    setOpenId={setOpenDropdown}
                                    value={filterCategory}
                                    onValueChange={setFilterCategory}
                                    whiteText
                                    items={[
                                        { label: 'Electrical Issues', value: 'Electrical Issues' },
                                        { label: 'Plumbing', value: 'Plumbing' },
                                        { label: 'AC and Heating Issues', value: 'AC and Heating Issues' },
                                        { label: 'Furniture Damage', value: 'Furniture Damage' },
                                        { label: 'Cleaning & Housekeeping', value: 'Cleaning & Housekeeping' },
                                        { label: 'Facilities & Utilities', value: 'Facilities & Utilities' },
                                        { label: 'Garden/Landscape/Path Issues', value: 'Garden/Landscape/Path Issues' },
                                    ]}
                                    label={t('categoryFilter')}
                                    fc={fc}
                                    theme={theme}
                                    zIndex={40}
                                    t={t}
                                />
                                <CustomDropdown
                                    id="sort"
                                    openId={openDropdown}
                                    setOpenId={setOpenDropdown}
                                    value={filterSort}
                                    onValueChange={setFilterSort}
                                    items={[
                                        { label: t('mostRecent'), value: 'recent' },
                                        { label: t('leastRecent'), value: 'oldest' },
                                        { label: t('mostPopular'), value: 'popular' },
                                    ]}
                                    label={t('mostRecent')}
                                    fc={fc}
                                    theme={theme}
                                    zIndex={30}
                                    hideClear
                                    whiteText
                                    t={t}
                                />

                                {/* Sub-status filter — only visible on In Progress tab */}
                                {activeTab === 'assigned' && (
                                    <View
                                        style={styles.subSeg}
                                        onLayout={e => setSubSegWidth(e.nativeEvent.layout.width - 6)}
                                    >
                                        {/* Sliding oval pill */}
                                        {subSegWidth > 0 && (
                                            <Animated.View style={[styles.subSegPill, {
                                                width: subSegWidth / 4,
                                                transform: [{
                                                    translateX: subSlide.interpolate({
                                                        inputRange: [0, 1, 2, 3],
                                                        outputRange: [3, 3 + subSegWidth / 4, 3 + (subSegWidth / 4) * 2, 3 + (subSegWidth / 4) * 3],
                                                    })
                                                }],
                                            }]} />
                                        )}
                                        {SUB_KEYS.map(k => (
                                            <TouchableOpacity
                                                key={k}
                                                style={styles.subSegBtn}
                                                onPress={() => setSubStatus(k)}
                                            >
                                                <Text style={[styles.subSegText, subStatus === k && styles.subSegTextActive]}>
                                                    {t(k === 'feedback' ? 'feedback' : k)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                                <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
                                    <Text style={styles.resetBtnText}>{t('reset')}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.controlsRight}>
                                <View style={styles.layoutToggle}>
                                    {[
                                        { key: 'wide', icon: '▬' },
                                        { key: 'grid', icon: '⊞' },
                                        { key: 'narrow', icon: '▤' },
                                    ].map(({ key, icon }) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={[styles.layoutBtn, layoutMode === key && styles.layoutBtnActive]}
                                            onPress={() => setLayoutMode(key)}
                                        >
                                            <Text style={[styles.layoutBtnText, layoutMode === key && styles.layoutBtnTextActive]}>
                                                {icon}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Ticket list */}
                    <ScrollView
                        style={styles.list}
                        contentContainerStyle={[
                            styles.listContent,
                            layoutMode === 'grid' && styles.listContentGrid,
                        ]}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={fc.primary} />}
                    >
                        {displayedTickets.length === 0 ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>{t('noTickets')}</Text>
                            </View>
                        ) : (
                            displayedTickets.map((ticket) => {
                                const reassignBlock = ticket.status === 'reassigned' && (() => {
                                    // sort by attempt_number so order is reliable
                                    const sorted = [...(ticket.assignments || [])].sort((x, y) => (x.attempt_number || 0) - (y.attempt_number || 0));
                                    // most recent real assignment (has a worker)
                                    const realA = [...sorted].reverse().find(a => a.worker_id);
                                    // pending shell holds new deadline / priority (no worker yet)
                                    const shell = sorted.find(a => !a.worker_id);
                                    if (!realA && !shell) return null;
                                    return (
                                        <View style={styles.reassignBox}>
                                            {realA?.worker_name && <Text style={styles.reassignInfo}>{t('workerPrefix')}: {realA.worker_name}</Text>}
                                            {realA?.deadline && <Text style={styles.reassignInfo}>{t('oldDeadline')}: {new Date(realA.deadline).toLocaleDateString()}</Text>}
                                            {shell?.deadline && <Text style={styles.reassignInfo}>{t('newDeadline')}: {new Date(shell.deadline).toLocaleDateString()}</Text>}
                                            {realA?.worker_note && <Text style={styles.reassignInfo} numberOfLines={2}>{t('workersNote')}: {realA.worker_note}</Text>}
                                            {realA?.feedback && <Text style={styles.reassignInfo} numberOfLines={2}>{t('feedbackBtn')}: {realA.feedback}</Text>}
                                            {realA?.proof_url && (
                                                <TouchableOpacity onPress={() => setImagePreviewUrl(realA.proof_url)}>
                                                    <Text style={styles.proofLink}>{t('proofLabel')}</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })();

                                const footer = (
                                    <>
                                        <View style={styles.cardDivider} />
                                        <View style={styles.cardFooter}>
                                            <Text style={styles.cardDate}>{new Date(ticket.created_at).toLocaleDateString()}</Text>
                                            {getActionButton(ticket)}
                                        </View>
                                    </>
                                );

                                // ── NARROW: tall card, full-width image on top, body below ──
                                if (layoutMode === 'narrow') {
                                    return (
                                        <View key={ticket.id} style={styles.cardNarrow}>
                                            {ticket.image_url ? (
                                                <TouchableOpacity onPress={() => setImagePreviewUrl(ticket.image_url)} activeOpacity={0.85}>
                                                    <Image source={{ uri: ticket.image_url }} style={styles.cardNarrowImage} resizeMode="cover" />
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={[styles.cardNarrowImage, styles.cardImagePlaceholder]}>
                                                    <Text style={styles.cardImagePlaceholderText}>{t('noImage')}</Text>
                                                </View>
                                            )}
                                            <View style={styles.categoryBadgeAbsolute}>
                                                <Text style={styles.categoryBadgeText}>{ticket.category?.toUpperCase()}</Text>
                                            </View>
                                            <View style={styles.cardBody}>
                                                <Text style={styles.cardTitle} numberOfLines={2}>{ticket.description || t('noDescription')}</Text>
                                                <Text style={styles.cardLocation}>{[ticket.area, ticket.floor].filter(Boolean).join(' · ')}</Text>
                                                {ticket.assignments?.[0]?.worker_name && <Text style={styles.cardWorker}>{t('workerPrefix')}: {ticket.assignments[0].worker_name}</Text>}
                                                {getPriorityBadge(ticket)}
                                                {reassignBlock}
                                                {footer}
                                            </View>
                                        </View>
                                    );
                                }

                                // ── GRID: 2-per-row, compact ──
                                if (layoutMode === 'grid') {
                                    return (
                                        <View key={ticket.id} style={styles.cardGrid}>
                                            {ticket.image_url ? (
                                                <TouchableOpacity onPress={() => setImagePreviewUrl(ticket.image_url)} activeOpacity={0.85}>
                                                    <Image source={{ uri: ticket.image_url }} style={styles.cardGridImage} resizeMode="cover" />
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={[styles.cardGridImage, styles.cardImagePlaceholder]}>
                                                    <Text style={styles.cardImagePlaceholderText}>{t('noImage')}</Text>
                                                </View>
                                            )}
                                            <View style={styles.categoryBadgeAbsolute}>
                                                <Text style={styles.categoryBadgeText}>{ticket.category?.toUpperCase()}</Text>
                                            </View>
                                            <View style={styles.cardBody}>
                                                <Text style={styles.cardTitle} numberOfLines={3}>{ticket.description || t('noDescription')}</Text>
                                                <Text style={styles.cardLocation} numberOfLines={1}>{[ticket.area, ticket.floor].filter(Boolean).join(' · ')}</Text>
                                                {getPriorityBadge(ticket)}
                                                {footer}
                                            </View>
                                        </View>
                                    );
                                }

                                // ── WIDE: current side-by-side layout ──
                                return (
                                    <View key={ticket.id} style={styles.card}>
                                        <View style={styles.cardRow}>
                                            {ticket.image_url ? (
                                                <TouchableOpacity onPress={() => setImagePreviewUrl(ticket.image_url)} activeOpacity={0.85}>
                                                    <Image source={{ uri: ticket.image_url }} style={styles.cardImage} resizeMode="cover" />
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                                                    <Text style={styles.cardImagePlaceholderText}>{t('noImage')}</Text>
                                                </View>
                                            )}
                                            <View style={styles.cardInfo}>
                                                <View style={styles.categoryBadge}>
                                                    <Text style={styles.categoryBadgeText}>{ticket.category?.toUpperCase()}</Text>
                                                </View>
                                                <Text style={styles.cardTitle} numberOfLines={2}>{ticket.description || t('noDescription')}</Text>
                                                <Text style={styles.cardLocation}>{[ticket.area, ticket.floor].filter(Boolean).join(' · ')}</Text>
                                                {ticket.assignments?.[0]?.worker_name && <Text style={styles.cardWorker}>{t('workerPrefix')}: {ticket.assignments[0].worker_name}</Text>}
                                                {getPriorityBadge(ticket)}
                                            </View>
                                        </View>
                                        {reassignBlock}
                                        {footer}
                                    </View>
                                );
                            })
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>

                    <FMNavBar
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        subStatus={subStatus}
                        onSubStatusChange={setSubStatus}
                        fc={fc}
                        theme={theme}
                    />
                </>
            )}

            {/* Feedback modal */}
            <FeedbackModal
                visible={feedbackModalVisible}
                ticketId={selectedTicketId}
                token={user?.token}
                onClose={() => {
                    setFeedbackModalVisible(false);
                    setSelectedTicketId(null);
                    fetchTickets();
                }}
            />

            {/* Ticket detail modal */}
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
                                            <View style={styles.detailCategoryBadge}>
                                                <Text style={styles.detailCategoryText}>{t_.category?.toUpperCase()}</Text>
                                            </View>
                                            <Text style={styles.detailDescription}>{t_.description || t('noDescription')}</Text>
                                            <Text style={styles.detailLocation}>
                                                {[t_.area, t_.floor, t_.specific_location].filter(Boolean).join(' · ')}
                                            </Text>
                                            <View style={styles.detailDivider} />
                                            <DetailRow label={t('statusLabel')} value={t_.status?.replace('_', ' ')} textColor={fc.textSub} />
                                            <DetailRow label={t('createdAt')} value={new Date(t_.created_at).toLocaleString()} textColor={fc.textSub} />
                                            {t_.completed_at && (
                                                <DetailRow label={t('completedAt')} value={new Date(t_.completed_at).toLocaleString()} textColor={fc.textSub} />
                                            )}
                                            {detailAssignmentsLoading ? (
                                                <ActivityIndicator size="small" color={fc.primary} style={{ marginTop: 20 }} />
                                            ) : (() => {
                                                // Filter out pending shells (worker_id === null) — only show real assignments
                                                const displayAttempts = detailAssignments.filter(a => a.worker_id);
                                                if (displayAttempts.length > 1) {
                                                    const attempt = displayAttempts[detailAttemptIdx];
                                                    const nextReal = displayAttempts[detailAttemptIdx + 1];
                                                    // Find the pending shell between this attempt and the next real one
                                                    const shell = detailAssignments.find(s =>
                                                        !s.worker_id &&
                                                        s.attempt_number > attempt.attempt_number &&
                                                        (!nextReal || s.attempt_number < nextReal.attempt_number)
                                                    );
                                                    const newDeadlineVal = shell?.deadline || nextReal?.deadline;
                                                    const newPriorityVal = shell?.priority || nextReal?.priority;
                                                    const isFirst = detailAttemptIdx === 0;
                                                    const isLast = detailAttemptIdx === displayAttempts.length - 1;
                                                    return (
                                                        <>
                                                            <View style={styles.detailDivider} />

                                                            {/* Header row: title + counter */}
                                                            <View style={styles.attemptHeader}>
                                                                <Text style={styles.attemptTitle}>
                                                                    {t('reassignmentAttempt', { n: detailAttemptIdx + 1 })}
                                                                </Text>
                                                                <Text style={styles.attemptCount}>
                                                                    {detailAttemptIdx + 1} / {displayAttempts.length}
                                                                </Text>
                                                            </View>

                                                            {/* Attempt details */}
                                                            {attempt.worker_name && <DetailRow label={t('workerPrefix')} value={attempt.worker_name} textColor={fc.textSub} />}
                                                            {attempt.priority && <DetailRow label={t('priority')} value={attempt.priority.toUpperCase()} valueColor={PRIORITY_COLORS[attempt.priority]} textColor={fc.textSub} />}
                                                            {attempt.deadline && <DetailRow label={t('oldDeadline')} value={new Date(attempt.deadline).toLocaleDateString()} textColor={fc.textSub} />}
                                                            {attempt.worker_note && <DetailRow label={t('workersNote')} value={attempt.worker_note} textColor={fc.textSub} />}
                                                            {attempt.feedback && <DetailRow label={t('feedbackBtn')} value={attempt.feedback} textColor={fc.textSub} />}
                                                            {!isLast && attempt.updated_at && <DetailRow label={t('reassignedAt')} value={new Date(attempt.updated_at).toLocaleString()} textColor={fc.textSub} />}
                                                            {!isLast && newDeadlineVal && <DetailRow label={t('newDeadline')} value={new Date(newDeadlineVal).toLocaleDateString()} textColor={fc.textSub} />}
                                                            {!isLast && newPriorityVal && <DetailRow label={t('newPriority')} value={newPriorityVal.toUpperCase()} valueColor={PRIORITY_COLORS[newPriorityVal]} textColor={fc.textSub} />}
                                                            {isLast && shell?.deadline && <DetailRow label={t('newDeadline')} value={new Date(shell.deadline).toLocaleDateString()} textColor={fc.textSub} />}
                                                            {isLast && shell?.priority && <DetailRow label={t('newPriority')} value={shell.priority.toUpperCase()} valueColor={PRIORITY_COLORS[shell.priority]} textColor={fc.textSub} />}
                                                            {attempt.proof_url && (
                                                                <View style={styles.detailProofWrap}>
                                                                    <Text style={[styles.detailLabel, { color: fc.textSub }]}>{t('proofLabel')}</Text>
                                                                    <TouchableOpacity onPress={() => setImagePreviewUrl(attempt.proof_url)}>
                                                                        <Image source={{ uri: attempt.proof_url }} style={styles.detailProofImage} resizeMode="cover" />
                                                                    </TouchableOpacity>
                                                                </View>
                                                            )}

                                                            {/* Prev / Next nav row — horizontal, below proof */}
                                                            {(!isFirst || !isLast) && (
                                                                <View style={styles.attemptNavRow}>
                                                                    {!isFirst ? (
                                                                        <TouchableOpacity style={styles.showNavBtn} onPress={() => setDetailAttemptIdx(i => i - 1)}>
                                                                            <Text style={styles.showNavText}>{'< '}{t('showPrevious')}</Text>
                                                                        </TouchableOpacity>
                                                                    ) : <View />}
                                                                    {!isLast ? (
                                                                        <TouchableOpacity style={styles.showNavBtn} onPress={() => setDetailAttemptIdx(i => i + 1)}>
                                                                            <Text style={styles.showNavText}>{t('showNext')}{' >'}</Text>
                                                                        </TouchableOpacity>
                                                                    ) : <View />}
                                                                </View>
                                                            )}
                                                        </>
                                                    );
                                                }
                                                // Single real attempt — use displayAttempts[0] (real assignment)
                                                // not t_.assignments?.[0] which may be the shell
                                                const singleAttempt = displayAttempts[0] || a;
                                                if (!singleAttempt) return null;
                                                const singleShell = detailAssignments.find(s => !s.worker_id);
                                                const isReassigned = singleAttempt.status === 'reassigned' || !!singleShell;
                                                const isCompleted = t_.status === 'completed';
                                                return (
                                                    <>
                                                        <View style={styles.detailDivider} />
                                                        {isReassigned && (
                                                            <View style={styles.attemptHeader}>
                                                                <Text style={styles.attemptTitle}>{t('reassignmentAttempt', { n: 1 })}</Text>
                                                            </View>
                                                        )}
                                                        {singleAttempt.worker_name && <DetailRow label={t('workerPrefix')} value={singleAttempt.worker_name} textColor={fc.textSub} />}
                                                        {singleAttempt.priority && <DetailRow label={t('priority')} value={singleAttempt.priority.toUpperCase()} valueColor={PRIORITY_COLORS[singleAttempt.priority]} textColor={fc.textSub} />}
                                                        {(singleAttempt.deadline || isCompleted) && <DetailRow label={singleShell ? t('oldDeadline') : t('setDeadline')} value={singleAttempt.deadline ? new Date(singleAttempt.deadline).toLocaleDateString() : '—'} textColor={fc.textSub} />}
                                                        {(singleAttempt.worker_note || isCompleted) && <DetailRow label={t('workersNote')} value={singleAttempt.worker_note || '—'} textColor={fc.textSub} />}
                                                        {(singleAttempt.feedback || isCompleted) && <DetailRow label={t('feedbackBtn')} value={singleAttempt.feedback || '—'} textColor={fc.textSub} />}
                                                        {singleShell?.deadline && <DetailRow label={t('newDeadline')} value={new Date(singleShell.deadline).toLocaleDateString()} textColor={fc.textSub} />}
                                                        {singleShell?.priority && <DetailRow label={t('newPriority')} value={singleShell.priority.toUpperCase()} valueColor={PRIORITY_COLORS[singleShell.priority]} textColor={fc.textSub} />}
                                                        {singleAttempt.proof_url && (
                                                            <View style={styles.detailProofWrap}>
                                                                <Text style={[styles.detailLabel, { color: fc.textSub }]}>{t('proofLabel')}</Text>
                                                                <TouchableOpacity onPress={() => setImagePreviewUrl(singleAttempt.proof_url)}>
                                                                    <Image source={{ uri: singleAttempt.proof_url }} style={styles.detailProofImage} resizeMode="cover" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        )}
                                                    </>
                                                );
                                            })()}
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

            {/* Assigned success popup */}
            {showAssignedPopup && (
                <Animated.View style={[styles.assignedPopup, { transform: [{ translateY: assignedSlide }] }]}>
                    <Ionicons name="checkmark-circle" size={13} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.assignedPopupText}>{t('ticketAssignedSuccess')}</Text>
                </Animated.View>
            )}

            {/* Image preview modal */}
            <Modal visible={!!imagePreviewUrl} transparent animationType="fade" onRequestClose={() => setImagePreviewUrl(null)}>
                <View style={styles.previewOverlay}>
                    {/* Tap backdrop to close */}
                    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setImagePreviewUrl(null)} />
                    {/* Outer glass layer */}
                    <Animated.View style={[styles.previewOuter, {
                        opacity: popupAnim,
                        transform: [{ scale: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
                    }]}>
                        <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setImagePreviewUrl(null)}>
                            <Text style={styles.previewCloseTxt}>✕</Text>
                        </TouchableOpacity>
                        {/* Inner image layer */}
                        <View style={styles.previewInner}>
                            <Image
                                source={{ uri: imagePreviewUrl }}
                                style={[
                                    styles.previewImage,
                                    previewSize && { aspectRatio: previewSize.width / previewSize.height },
                                ]}
                                resizeMode="contain"
                            />
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </ImageBackground>
    );
};

const makeStyles = (fc, theme) => StyleSheet.create({
    bgImage: { flex: 1, width: '100%', height: '100%' },

    // Organic blobs
    blob: { position: 'absolute', borderRadius: 9999, opacity: 0.38 },
    blob1: { width: SCREEN_WIDTH * 0.85, height: SCREEN_WIDTH * 0.85, top: -SCREEN_WIDTH * 0.22, left: -SCREEN_WIDTH * 0.22 },
    blob2: { width: SCREEN_WIDTH * 0.65, height: SCREEN_WIDTH * 0.65, top: '42%', right: -SCREEN_WIDTH * 0.18 },
    blob3: { width: SCREEN_WIDTH * 0.55, height: SCREEN_WIDTH * 0.55, bottom: -SCREEN_WIDTH * 0.12, left: '18%' },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Filter bar — glass header
    filterBar: {
        backgroundColor: fc.glassHeader,
        borderBottomWidth: 1,
        borderColor: fc.glassBorder,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 8,
        zIndex: 100,
        overflow: 'visible',
    },

    // Search row
    searchRow: { marginBottom: 8 },
    // Outer ring — white, lower visual layer
    searchBoxOuter: {
        width: '40%',
        borderRadius: 22,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.75)',
        zIndex: 0,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 34,
        backgroundColor: fc.glass,
        borderRadius: 20,
        borderWidth: 0.2,
        borderColor: 'rgba(180,180,180,0.55)',
        paddingHorizontal: 10,
    },
    searchInput: { flex: 1, fontSize: 12, color: fc.text, paddingVertical: 0 },

    // Controls row
    controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    controlsLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, overflow: 'visible', zIndex: 100 },
    controlsRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    // Picker cells (3 in a row on the right)
    pickerCell: {
        backgroundColor: theme === 'dark' ? 'rgba(102, 11, 5, 0.35)' : 'rgba(255, 218, 211, 0.55)',
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: theme === 'dark' ? 'rgba(31, 8, 3, 1)' : 'rgba(66, 0, 0, 0.2)',
        overflow: 'hidden',
        width: 110,
        height: 34,
        justifyContent: 'center',
    },
    picker: {
        height: 37,
        fontSize: 12,
        color: fc.text,
        backgroundColor: theme === 'dark' ? 'rgba(102, 11, 5, 0.35)' : 'rgba(255, 218, 211, 0.55)',
    },

    // Sub-status segment (Both / Assigned / Reassigned / Feedback)
    subSeg: {
        flexDirection: 'row',
        backgroundColor: fc.glass,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: fc.glassBorder,
        height: 37,
        minWidth: 300,
        padding: 3,
        position: 'relative',
    },
    subSegPill: {
        position: 'absolute',
        top: 3, bottom: 3, left: -2,
        borderRadius: 9999,
        backgroundColor: fc.segActiveBg,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    subSegBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    subSegText: { fontSize: 11, fontWeight: '500', color: fc.segInactiveTx },
    subSegTextActive: { color: fc.segActiveTx, fontWeight: '700' },

    // Reset
    resetBtn: {
        backgroundColor: fc.glass,
        borderWidth: 1,
        borderColor: fc.glassBorder,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
    },
    resetBtnText: { fontSize: 12, fontWeight: '600', color: fc.primary, letterSpacing: 0.3 },

    // Layout toggle
    layoutToggle: { flexDirection: 'row', backgroundColor: fc.glass, borderRadius: 16, borderWidth: 1, borderColor: fc.glassBorder, overflow: 'hidden' },
    layoutBtn: { paddingHorizontal: 11, paddingVertical: 5 },
    layoutBtnActive: { backgroundColor: fc.segActiveBg },
    layoutBtnText: { fontSize: 14, color: fc.segInactiveTx },
    layoutBtnTextActive: { color: fc.segActiveTx },

    // List
    list: { flex: 1, zIndex: 1 },
    listContent: { paddingHorizontal: 16, paddingTop: 14 },
    listContentGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: fc.textSub, fontSize: 15 },

    // Glass ticket card
    card: {
        backgroundColor: fc.glass,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: fc.glassBorder,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
        elevation: 4,
    },
    // Wide layout
    cardRow: { flexDirection: 'row', gap: 14, marginBottom: 10 },
    cardImage: { width: 80, height: 80, borderRadius: 16, flexShrink: 0 },
    cardInfo: { flex: 1 },

    // Narrow layout (tall, full-width image on top)
    cardNarrow: {
        backgroundColor: fc.glass,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: fc.glassBorder,
        marginBottom: 16,
        marginHorizontal: '18%',
        overflow: 'hidden',
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
        elevation: 4,
    },
    cardNarrowImage: { width: '100%', height: 220 },

    // Grid layout (2 per row)
    cardGrid: {
        backgroundColor: fc.glass,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: fc.glassBorder,
        marginBottom: 10,
        width: '48.5%',
        overflow: 'hidden',
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 3,
    },
    cardGridImage: { width: '100%', height: 130 },

    // Shared body (narrow + grid)
    cardBody: { padding: 12 },

    // Category badge for top-image layouts (absolute overlay)
    categoryBadgeAbsolute: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: fc.categoryBg,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 20,
        zIndex: 2,
    },

    cardImagePlaceholder: { backgroundColor: fc.glassBorder, justifyContent: 'center', alignItems: 'center' },
    cardImagePlaceholderText: { color: fc.textSub, fontSize: 10 },

    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: fc.categoryBg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        marginBottom: 5,
    },
    categoryBadgeText: { fontSize: 9, fontWeight: '700', color: fc.categoryText, letterSpacing: 0.8 },

    cardTitle: { fontSize: 14, fontWeight: '600', color: fc.text, lineHeight: 20, marginBottom: 3 },
    cardLocation: { fontSize: 12, color: fc.textSub, marginBottom: 2 },
    cardWorker: { fontSize: 12, color: fc.textSub },

    priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8 },
    priorityText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

    reassignBox: { backgroundColor: fc.divider, borderRadius: 10, padding: 10, marginBottom: 8 },
    reassignInfo: { fontSize: 12, color: fc.textSub, marginBottom: 3 },
    proofLink: { fontSize: 12, color: fc.primary, textDecorationLine: 'underline', marginTop: 2 },

    cardDivider: { height: 1, backgroundColor: fc.divider, marginVertical: 10 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardDate: { fontSize: 12, color: fc.textFaint },

    // Action buttons
    btnAssign: {
        backgroundColor: fc.btnBg,
        paddingHorizontal: 20,
        paddingVertical: 9,
        borderRadius: 20,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnAssignText: { color: fc.btnText, fontWeight: '700', fontSize: 13, letterSpacing: 0.2 },

    btnAssigned: {
        paddingHorizontal: 20,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: fc.glassBorder,
        backgroundColor: theme === 'dark' ? 'rgba(228,176,42,0.68)' : 'rgba(228,176,42,0.68)',
    },
    btnAssignedText: { color: fc.textSub, fontWeight: '700', fontSize: 13 },

    btnFeedback: {
        backgroundColor: fc.success,
        paddingHorizontal: 20,
        paddingVertical: 9,
        borderRadius: 20,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnFeedbackText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    viewTicketLink: { fontSize: 13, color: fc.primary, textDecorationLine: 'underline', fontWeight: '600', marginRight: 10 },
    completedFooterRow: { flexDirection: 'row', alignItems: 'center' },
    btnCompleted: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: fc.glassBorder, backgroundColor: theme === 'dark' ? 'rgba(228, 176, 53, 0.06)' : 'rgba(230, 178, 75, 0.06)' },
    btnCompletedText: { color: fc.textSub, fontWeight: '700', fontSize: 13 },

    overdueFooterRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    btnOverdueReassign: {
        backgroundColor: fc.btnBg,
        paddingHorizontal: 20,
        paddingVertical: 9,
        borderRadius: 20,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnOverdueReassignText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

    // Detail modal
    detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    detailBox: {
        backgroundColor: fc.modalBg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.88,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: fc.glassBorder,
    },
    detailImage: { width: 100, height: 100, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 4 },
    detailImagePlaceholder: { backgroundColor: fc.glassBorder, justifyContent: 'center', alignItems: 'center' },
    detailPlaceholderText: { color: fc.textSub, fontSize: 13 },
    detailContent: { padding: 16 },
    detailCategoryBadge: { alignSelf: 'flex-start', backgroundColor: fc.btnBg + '28', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
    detailCategoryText: { fontSize: 11, fontWeight: '700', color: fc.primary, letterSpacing: 0.8 },
    detailDescription: { fontSize: 16, fontWeight: '600', color: fc.text, marginBottom: 6 },
    detailLocation: { fontSize: 13, color: fc.textSub, marginBottom: 12 },
    detailDivider: { height: 1, backgroundColor: fc.divider, marginVertical: 12 },
    detailLabel: { fontSize: 13, fontWeight: '700', color: fc.textSub, marginBottom: 6 },
    detailProofWrap: { marginTop: 8 },
    detailProofImage: { width: 100, height: 100, borderRadius: 12, marginTop: 4 },
    detailCloseBtn: { margin: 16, backgroundColor: fc.btnBg, paddingVertical: 14, borderRadius: 20, alignItems: 'center' },
    detailCloseBtnText: { color: fc.btnText, fontWeight: '700', fontSize: 15 },

    // Reassignment attempt history
    attemptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    attemptTitle: { fontSize: 14, fontWeight: '800', color: fc.primary },
    attemptCount: { fontSize: 11, color: fc.textFaint, fontStyle: 'italic' },
    attemptNavRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    showNavBtn: {
        paddingVertical: 7, paddingHorizontal: 14,
        borderRadius: 20, borderWidth: 1, borderColor: fc.glassBorder,
        backgroundColor: fc.divider,
    },
    showNavText: { fontSize: 13, color: fc.primary, fontWeight: '600' },

    // Assigned success popup
    assignedPopup: {
        position: 'absolute',
        top: 0,
        alignSelf: 'center',
        maxWidth: SCREEN_WIDTH * 0.6,
        height: 30,
        backgroundColor: fc.primary,
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        zIndex: 999,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    assignedPopupText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

    // Image preview
    previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center' },
    previewOuter: {
        width: SCREEN_WIDTH * 0.88,
        backgroundColor: fc.glass,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: fc.glassBorder,
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
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: fc.btnBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewCloseTxt: { color: fc.btnText, fontSize: 14, fontWeight: '700' },
    previewInner: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme === 'dark' ? 'rgba(255,180,168,0.2)' : 'rgba(66,0,0,0.12)',
        overflow: 'hidden',
        backgroundColor: fc.divider,
        maxHeight: SCREEN_HEIGHT * 0.7,
    },
    previewImage: { width: '100%', height: '100%' },
});

export default FMDashboard;