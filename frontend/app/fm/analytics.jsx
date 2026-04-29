import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Animated, TextInput,
    StyleSheet, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const { width: W } = Dimensions.get('window');

const VG = {
    light: {
        gradStart: '#a6867dff', gradEnd: '#ede0da',
        card: 'rgba(255,248,246,0.97)',
        glass: 'rgba(255,255,255,0.62)',
        glassBorder: 'rgba(66,0,0,0.12)',
        primary: '#420000',
        text: '#31120c', textSub: '#57423e', textFaint: '#8b716d',
        pillBg: 'rgba(66,0,0,0.07)',
        divider: 'rgba(49,18,12,0.08)',
        chartBg: '#fff8f6',
        segActiveBg: '#800020',
        segActiveTx: '#ffffff',
        segInactiveTx: '#800020',
    },
    dark: {
        gradStart: '#382928ff', gradEnd: '#421313ff',
        card: 'rgba(42,15,9,0.97)',
        glass: 'rgba(74,39,31,0.65)',
        glassBorder: 'rgba(255,218,211,0.14)',
        primary: '#ffb4a8',
        text: '#fff8f6', textSub: 'rgba(255,248,246,0.62)', textFaint: 'rgba(255,248,246,0.38)',
        pillBg: 'rgba(255,180,168,0.12)',
        divider: 'rgba(255,248,246,0.08)',
        chartBg: 'rgba(74,39,31,0.4)',
        segActiveBg: '#660b05',
        segActiveTx: '#ffdad4',
        segInactiveTx: 'rgba(255,248,246,0.65)',
    },
};

const RANGES = [
    { label: '1W', days: 7 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '1Y', days: 365 },
];

const STATUS_COLORS = {
    pending: '#88110fff',
    assigned: '#E4B02A',
    in_progress: '#C47B3A',
    overdue: '#e64141ff',
    reassigned: '#000000ff',
    completed: '#0e4c11ff',
};

// ── Client-side cross-filter aggregation ─────────────────────────────────────
const computeAgg = (tickets) => {
    const st = {}, cat = {}, ar = {}, mo = {};
    tickets.forEach(t => {
        st[t.status] = (st[t.status] || 0) + 1;
        if (t.category) cat[t.category] = (cat[t.category] || 0) + 1;
        if (t.area) ar[t.area] = (ar[t.area] || 0) + 1;
        const m = t.created_at?.slice(0, 7);
        if (m) mo[m] = (mo[m] || 0) + 1;
    });
    const resolved = tickets.filter(t => t.completed_at);
    return {
        stats: {
            total: tickets.length,
            pending: tickets.filter(t => t.status === 'pending').length,
            completed: tickets.filter(t => t.status === 'completed').length,
            overdue: tickets.filter(t => t.status === 'overdue').length,
            avgResolutionDays: resolved.length
                ? (resolved.reduce((acc, t) => acc + (new Date(t.completed_at) - new Date(t.created_at)) / 864e5, 0) / resolved.length).toFixed(1)
                : null,
        },
        byStatus: Object.entries(st).map(([status, count]) => ({ status, count })),
        byCategory: Object.entries(cat).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
        byArea: Object.entries(ar).map(([area, count]) => ({ area, count })).sort((a, b) => b.count - a.count),
        trend: Object.entries(mo).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month)),
    };
};

const FMAnalytics = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const vg = VG[theme] || VG.light;
    const s = useMemo(() => makeStyles(vg), [vg]);

    const [data, setData] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);
    const [contentLoading, setContentLoading] = useState(false);
    const [activeRange, setActiveRange] = useState(1); // default 1M = index 1
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [selectedSlice, setSelectedSlice] = useState(null);
    const [areaSearch, setAreaSearch] = useState('');
    const [workerSearch, setWorkerSearch] = useState('');
    const rangeSlide = useRef(new Animated.Value(1)).current;
    const [rangeSegWidth, setRangeSegWidth] = useState(0);
    const isFirstFetch = useRef(true);

    const fetchAnalytics = async (days) => {
        if (isFirstFetch.current) {
            setInitialLoad(true);
        } else {
            setContentLoading(true);
            setData(null);
        }
        try {
            const to = new Date();
            const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const res = await api.get(
                `/fm/analytics?from=${from.toISOString()}&to=${to.toISOString()}`,
                user.token
            );
            setData(res);
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            isFirstFetch.current = false;
            setInitialLoad(false);
            setContentLoading(false);
        }
    };

    useEffect(() => {
        if (!user?.token) return;
        fetchAnalytics(RANGES[activeRange].days);
    }, [activeRange, user]);

    useEffect(() => {
        Animated.spring(rangeSlide, {
            toValue: activeRange,
            useNativeDriver: false,
            tension: 180,
            friction: 18,
        }).start();
    }, [activeRange]);

    // Clear selections when range changes
    useEffect(() => {
        setSelectedCategory(null);
        setSelectedArea(null);
        setSelectedSlice(null);
    }, [activeRange]);

    // ── Cross-filter aggregation ─────────────────────────────────────────────
    // Each dimension's bar chart is filtered by all OTHER active filters,
    // giving PowerBI-style cross-filtering behaviour.
    const agg = useMemo(() => {
        const raw = data?.rawTickets;
        if (!raw || (!selectedCategory && !selectedArea)) return null;
        const main = raw.filter(t =>
            (!selectedCategory || t.category === selectedCategory) &&
            (!selectedArea || t.area === selectedArea)
        );
        // Category bars: cross-filter by area only (not by own dimension)
        const forCat = selectedArea ? raw.filter(t => t.area === selectedArea) : raw;
        // Area bars: cross-filter by category only
        const forArea = selectedCategory ? raw.filter(t => t.category === selectedCategory) : raw;
        const base = computeAgg(main);
        return {
            ...base,
            byCategory: computeAgg(forCat).byCategory,
            byArea: computeAgg(forArea).byArea,
            workerPerformance: data.workerPerformance,
        };
    }, [data, selectedCategory, selectedArea]);

    // disp is the active data view — filtered if selections exist, raw otherwise
    const disp = agg ?? data;

    // ── chart data formatters ────────────────────────────────────────────────

    const pieData = disp?.byStatus?.map(item => ({
        value: item.count,
        color: STATUS_COLORS[item.status] || '#999',
        label: item.status.replace('_', ' '),
        text: `${item.count}`,
    })) || [];

    const barCategoryData = disp?.byCategory?.slice(0, 6).map(item => ({
        value: item.count,
        label: '',
        category: item.category,
        frontColor: selectedCategory && selectedCategory !== item.category ? '#8B000035' : '#8B0000',
        topLabelComponent: () => (
            <Text style={{ fontSize: 10, color: vg.textSub, marginBottom: 2 }}>{item.count}</Text>
        ),
    })) || [];

    const barAreaData = disp?.byArea?.map(item => {
        const q = areaSearch.trim().toLowerCase();
        const matchesSearch = q ? item.area?.toLowerCase().includes(q) : true;
        const isSelected = selectedArea === item.area;
        const dimmed = (selectedArea && !isSelected) || (q && !matchesSearch);
        const highlighted = q && matchesSearch && !isSelected;
        return {
            value: item.count,
            label: '',
            area: item.area,
            frontColor: dimmed ? '#E4B02A28' : '#E4B02A',
            topLabelComponent: () => (
                <Text style={{ fontSize: 10, color: vg.textSub, marginBottom: 2 }}>{item.count}</Text>
            ),
        };
    }) || [];

    const lineData = disp?.trend?.map(item => ({
        value: item.count,
        label: item.month?.slice(5), // "04" instead of "2026-04"
        dataPointText: `${item.count}`,
    })) || [];

    if (initialLoad) return (
        <LinearGradient colors={[vg.gradStart, vg.gradEnd]} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={vg.primary} />
        </LinearGradient>
    );

    return (
        <LinearGradient colors={[vg.gradStart, vg.gradEnd]} style={s.root}>

            {/* Header */}
            <View style={s.header}>
                <Text style={s.headerTitle}>Analytics</Text>
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* Range selector — sliding pill */}
                <View
                    style={s.rangeSeg}
                    onLayout={e => setRangeSegWidth(e.nativeEvent.layout.width)}
                >
                    {rangeSegWidth > 0 && (
                        <Animated.View style={[s.rangeSegPill, {
                            width: rangeSegWidth / RANGES.length,
                            transform: [{
                                translateX: rangeSlide.interpolate({
                                    inputRange: RANGES.map((_, i) => i),
                                    outputRange: RANGES.map((_, i) => i * (rangeSegWidth / RANGES.length)),
                                }),
                            }],
                        }]} />
                    )}
                    {RANGES.map((r, i) => (
                        <TouchableOpacity
                            key={r.label}
                            style={s.rangeSegBtn}
                            onPress={() => setActiveRange(i)}
                        >
                            <Text style={[s.rangeSegText, activeRange === i && s.rangeSegTextActive]}>
                                {r.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Inline content loader — shown while switching ranges */}
                {contentLoading ? (
                    <View style={s.contentLoader}>
                        <ActivityIndicator size="large" color={vg.primary} />
                    </View>
                ) : (<>

                    {/* Active filter chips */}
                    {(selectedCategory || selectedArea) && (
                        <View style={s.chipRow}>
                            {selectedCategory && (
                                <TouchableOpacity style={s.chip} onPress={() => setSelectedCategory(null)}>
                                    <Ionicons name="grid-outline" size={11} color={vg.segActiveBg} style={{ marginRight: 4 }} />
                                    <Text style={s.chipText} numberOfLines={1}>{selectedCategory}</Text>
                                    <Ionicons name="close" size={11} color={vg.segActiveBg} style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            )}
                            {selectedArea && (
                                <TouchableOpacity style={s.chip} onPress={() => setSelectedArea(null)}>
                                    <Ionicons name="location-outline" size={11} color={vg.segActiveBg} style={{ marginRight: 4 }} />
                                    <Text style={s.chipText} numberOfLines={1}>{selectedArea}</Text>
                                    <Ionicons name="close" size={11} color={vg.segActiveBg} style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            )}
                            {selectedCategory && selectedArea && (
                                <TouchableOpacity onPress={() => { setSelectedCategory(null); setSelectedArea(null); }}>
                                    <Text style={s.chipClearAll}>clear all</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Stat cards */}
                    <View style={s.statGrid}>
                        <StatCard label="Total" value={disp?.stats?.total} icon="layers-outline" color="#3B82F6" vg={vg} s={s} />
                        <StatCard label="Pending" value={disp?.stats?.pending} icon="time-outline" color="#F59E0B" vg={vg} s={s} />
                        <StatCard label="Completed" value={disp?.stats?.completed} icon="checkmark-circle-outline" color="#10B981" vg={vg} s={s} />
                        <StatCard label="Overdue" value={disp?.stats?.overdue} icon="warning-outline" color="#EF4444" vg={vg} s={s} />
                    </View>

                    {/* Avg resolution */}
                    <View style={s.card}>
                        <View style={s.cardHeader}>
                            <Ionicons name="speedometer-outline" size={18} color={vg.primary} />
                            <Text style={s.cardTitle}>Avg. Resolution Time</Text>
                        </View>
                        <Text style={s.bigNumber}>
                            {disp?.stats?.avgResolutionDays ?? '—'}
                            <Text style={s.bigNumberUnit}> days</Text>
                        </Text>
                    </View>

                    {/* Tickets by status — pie */}
                    {pieData.length > 0 && (
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <Ionicons name="pie-chart-outline" size={18} color={vg.primary} />
                                <Text style={s.cardTitle}>Tickets by Status</Text>
                            </View>
                            <View style={s.chartCenter}>
                                <PieChart
                                    data={pieData.map(item => ({
                                        ...item,
                                        focused: selectedSlice?.label === item.label,
                                    }))}
                                    donut
                                    focusOnPress
                                    radius={90}
                                    innerRadius={55}
                                    onPress={(item) =>
                                        setSelectedSlice(prev => prev?.label === item.label ? null : item)
                                    }
                                    centerLabelComponent={() => {
                                        if (selectedSlice) {
                                            const pct = disp?.stats?.total
                                                ? ((selectedSlice.value / disp.stats.total) * 100).toFixed(1)
                                                : '0';
                                            return (
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={[s.pieCenter, { color: '#31120c', fontSize: 20 }]}>
                                                        {pct}%
                                                    </Text>
                                                    <Text style={[s.pieCenterSub, { color: selectedSlice.color, fontWeight: '700' }]}>
                                                        {selectedSlice.label}
                                                    </Text>
                                                </View>
                                            );
                                        }
                                        return (
                                            <Text style={[s.pieCenter, { color: '#31120c' }]}>
                                                {disp?.stats?.total}{'\n'}
                                                <Text style={s.pieCenterSub}>total</Text>
                                            </Text>
                                        );
                                    }}
                                />
                            </View>
                            <View style={s.legend}>
                                {pieData.map(item => (
                                    <View key={item.label} style={s.legendItem}>
                                        <View style={[s.legendDot, { backgroundColor: item.color }]} />
                                        <Text style={s.legendText}>{item.label} ({item.text})</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Tickets by category — bar (tap to filter) */}
                    {barCategoryData.length > 0 && (
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <Ionicons name="bar-chart-outline" size={18} color={vg.primary} />
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={s.cardTitle}>Tickets by Category</Text>
                                        {selectedCategory && (
                                            <TouchableOpacity
                                                style={s.chartResetBtn}
                                                onPress={() => setSelectedCategory(null)}
                                            >
                                                <Text style={s.chartResetBtnText}>Reset</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text style={s.cardHint}>Tap a bar to filter</Text>
                                </View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View>
                                    <BarChart
                                        data={barCategoryData}
                                        barWidth={52}
                                        spacing={14}
                                        initialSpacing={14}
                                        roundedTop
                                        hideRules
                                        xAxisThickness={1}
                                        yAxisThickness={0}
                                        yAxisLabelWidth={35}
                                        yAxisTextStyle={{ color: vg.textFaint, fontSize: 10 }}
                                        noOfSections={4}
                                        maxValue={Math.max(...barCategoryData.map(d => d.value)) + 2}
                                        backgroundColor={vg.chartBg}
                                        barBorderWidth={1}
                                        barBorderColor="#A0344A"
                                        onPress={(item) => {
                                            const cat = item.category;
                                            setSelectedCategory(prev => prev === cat ? null : cat);
                                        }}
                                    />
                                    <View style={{ flexDirection: 'row', paddingLeft: 35 + 14, paddingTop: 6 }}>
                                        {barCategoryData.map((item, idx) => {
                                            const parts = item.category?.includes('/')
                                                ? item.category.split('/')
                                                : [item.category];
                                            const labelStyle = {
                                                fontSize: 9,
                                                textAlign: 'center',
                                                color: selectedCategory === item.category ? '#8B0000' : vg.textSub,
                                                fontWeight: selectedCategory === item.category ? '700' : '400',
                                            };
                                            return (
                                                <View key={idx} style={{ width: 52, bottom: 5, left: 10, marginRight: 14, alignItems: 'center' }}>
                                                    {parts.map((part, pi) => (
                                                        <Text key={pi} style={labelStyle}>{part.trim()}</Text>
                                                    ))}
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    {/* Tickets by area — bar (tap to filter, all areas, searchable) */}
                    {barAreaData.length > 0 && (
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <Ionicons name="location-outline" size={18} color={vg.primary} />
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={s.cardTitle}>Tickets by Area</Text>
                                        {selectedArea && (
                                            <TouchableOpacity
                                                style={s.chartResetBtn}
                                                onPress={() => setSelectedArea(null)}
                                            >
                                                <Text style={s.chartResetBtnText}>Reset</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text style={s.cardHint}>Tap a bar to filter</Text>
                                </View>
                            </View>
                            {/* Area search */}
                            <View style={s.areaSearchBox}>
                                <Ionicons name="search-outline" size={13} color={vg.textFaint} style={{ marginRight: 6 }} />
                                <TextInput
                                    style={s.areaSearchInput}
                                    placeholder="Search areas…"
                                    placeholderTextColor={vg.textFaint}
                                    value={areaSearch}
                                    onChangeText={setAreaSearch}
                                    autoCapitalize="none"
                                />
                                {areaSearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setAreaSearch('')}>
                                        <Ionicons name="close-circle" size={13} color={vg.textFaint} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {/* Chart + custom label row share one ScrollView so they scroll together */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View>
                                    <BarChart
                                        data={barAreaData}
                                        barWidth={52}
                                        spacing={14}
                                        initialSpacing={14}
                                        roundedTop
                                        hideRules
                                        xAxisThickness={1}
                                        yAxisThickness={0}
                                        yAxisLabelWidth={35}
                                        yAxisTextStyle={{ color: vg.textFaint, fontSize: 10 }}
                                        noOfSections={4}
                                        maxValue={Math.max(...barAreaData.map(d => d.value)) + 2}
                                        backgroundColor={vg.chartBg}
                                        barBorderWidth={1}
                                        barBorderColor="#96680A"
                                        onPress={(item) => setSelectedArea(prev => prev === item.area ? null : item.area)}
                                    />
                                    {/* Labels rendered below the x-axis line, each centered under its bar */}
                                    <View style={{ flexDirection: 'row', paddingLeft: 35 + 14, paddingTop: 6 }}>
                                        {barAreaData.map((item, idx) => {
                                            const q = areaSearch.trim().toLowerCase();
                                            const matchesSearch = q ? item.area?.toLowerCase().includes(q) : true;
                                            const isSelected = selectedArea === item.area;
                                            const highlighted = q && matchesSearch && !isSelected;
                                            return (
                                                <View key={idx} style={{ width: 52, marginRight: 14, alignItems: 'center' }}>
                                                    <Text style={{
                                                        fontSize: 9,
                                                        textAlign: 'center',
                                                        left: 14,
                                                        color: isSelected ? '#E4B02A' : highlighted ? vg.segActiveBg : vg.textSub,
                                                        fontWeight: isSelected || highlighted ? '700' : '400',
                                                    }}>
                                                        {item.area}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    {/* Monthly trend — line */}
                    {lineData.length > 1 && (
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <Ionicons name="trending-up-outline" size={18} color={vg.primary} />
                                <Text style={s.cardTitle}>Ticket Trend</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <LineChart
                                    data={lineData}
                                    width={Math.max(W - 80, lineData.length * 60)}
                                    height={180}
                                    spacing={60}
                                    color="#420000"
                                    thickness={2}
                                    startFilled
                                    startOpacity={0.3}
                                    endOpacity={0.05}
                                    hideRules
                                    xAxisThickness={1}
                                    yAxisThickness={0}
                                    yAxisTextStyle={{ color: vg.textFaint, fontSize: 10 }}
                                    xAxisLabelTextStyle={{ color: vg.textSub, fontSize: 10 }}
                                    dataPointsColor="#420000"
                                    textColor={vg.textSub}
                                    textFontSize={10}
                                    backgroundColor={vg.chartBg}
                                />
                            </ScrollView>
                        </View>
                    )}

                    {/* Worker performance */}
                    {data?.workerPerformance?.length > 0 && (
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <Ionicons name="people-outline" size={18} color={vg.primary} />
                                <Text style={s.cardTitle}>Worker Performance</Text>
                            </View>
                            <View style={s.areaSearchBox}>
                                <Ionicons name="search-outline" size={13} color={vg.textFaint} style={{ marginRight: 6 }} />
                                <TextInput
                                    style={s.areaSearchInput}
                                    placeholder="Search workers…"
                                    placeholderTextColor={vg.textFaint}
                                    value={workerSearch}
                                    onChangeText={setWorkerSearch}
                                    autoCapitalize="none"
                                />
                                {workerSearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setWorkerSearch('')}>
                                        <Ionicons name="close-circle" size={13} color={vg.textFaint} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={s.workerTableHeader}>
                                <Text style={[s.workerCol, { flex: 2 }]}>Worker</Text>
                                <Text style={s.workerCol}>Assigned</Text>
                                <Text style={s.workerCol}>Done</Text>
                                <Text style={s.workerCol}>Rejected</Text>
                            </View>
                            {data.workerPerformance
                                .filter(w => !workerSearch.trim() || w.worker_name?.toLowerCase().includes(workerSearch.toLowerCase()))
                                .map((w, i) => (
                                    <View key={w.worker_id} style={[s.workerRow, i % 2 === 0 && s.workerRowAlt]}>
                                        <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={s.workerAvatar}>
                                                <Text style={s.workerAvatarText}>
                                                    {w.worker_name?.charAt(0)?.toUpperCase() || '?'}
                                                </Text>
                                            </View>
                                            <Text style={s.workerName} numberOfLines={1}>{w.worker_name}</Text>
                                        </View>
                                        <Text style={s.workerStat}>{w.assigned}</Text>
                                        <Text style={[s.workerStat, { color: '#10B981' }]}>{w.completed}</Text>
                                        <Text style={[s.workerStat, { color: '#EF4444' }]}>{w.reassigned}</Text>
                                    </View>
                                ))}
                        </View>
                    )}

                    <View style={{ height: 48 }} />
                </>)}
            </ScrollView>
        </LinearGradient>
    );
};

// ── Stat card component ───────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, vg, s }) => (
    <View style={s.statCard}>
        <View style={[s.statIconBox, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={s.statValue}>{value ?? '—'}</Text>
        <Text style={s.statLabel}>{label}</Text>
    </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const makeStyles = (vg) => StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: 16, paddingBottom: 48 },

    header: { alignItems: 'center', justifyContent: 'center', paddingTop: 54, paddingBottom: 16, paddingHorizontal: 16, bottom: 10 },
    //backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: vg.glass, borderWidth: 1, borderColor: vg.glassBorder, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 30, fontWeight: '700', color: vg.text },

    rangeSeg: {
        flexDirection: 'row',
        backgroundColor: vg.glass,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: vg.glassBorder,
        height: 40,
        padding: 3,
        position: 'relative',
        marginBottom: 20,
    },
    rangeSegPill: {
        position: 'absolute',
        top: 3,
        bottom: 3,
        left: 0,
        borderRadius: 9999,
        backgroundColor: vg.segActiveBg,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    rangeSegBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    rangeSegText: { fontSize: 13, fontWeight: '600', color: vg.segInactiveTx },
    rangeSegTextActive: { color: vg.segActiveTx, fontWeight: '700' },

    statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginBottom: 16 },
    statCard: {
        width: '49%', backgroundColor: vg.card, borderRadius: 20, borderWidth: 1, borderColor: vg.glassBorder, padding: 14,
    },

    contentLoader: { flex: 1, minHeight: 300, justifyContent: 'center', alignItems: 'center' },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' },
    chip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: vg.segActiveBg + '18',
        borderWidth: 1, borderColor: vg.segActiveBg + '55',
        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
        maxWidth: 180,
    },
    chipText: { fontSize: 12, fontWeight: '600', color: vg.segActiveBg, flexShrink: 1 },
    chipClearAll: { fontSize: 12, color: vg.textFaint, textDecorationLine: 'underline' },

    cardHint: { fontSize: 10, color: vg.textFaint, marginTop: 1 },

    chartResetBtn: {
        backgroundColor: vg.glass,
        borderWidth: 1,
        borderColor: vg.glassBorder,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    chartResetBtnText: { fontSize: 11, fontWeight: '600', color: vg.primary, letterSpacing: 0.3 },

    areaSearchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: vg.glass,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: vg.glassBorder,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 12,
    },
    areaSearchInput: { flex: 1, fontSize: 12, color: vg.text, paddingVertical: 0 },
    statIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 28, fontWeight: '700', color: vg.text, marginBottom: 2 },
    statLabel: { fontSize: 12, fontWeight: '600', color: vg.textSub, textTransform: 'uppercase', letterSpacing: 0.5 },

    card: { backgroundColor: vg.card, borderRadius: 20, borderWidth: 1, borderColor: vg.glassBorder, padding: 20, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: vg.text },

    bigNumber: { fontSize: 42, fontWeight: '700', color: vg.primary, textAlign: 'center', paddingVertical: 8 },
    bigNumberUnit: { fontSize: 18, fontWeight: '400', color: vg.textSub },

    chartCenter: { alignItems: 'center', marginBottom: 16 },
    pieCenter: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
    pieCenterSub: { fontSize: 12, fontWeight: '400' },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: vg.textSub, textTransform: 'capitalize' },

    workerTableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: vg.divider, marginBottom: 4 },
    workerCol: { flex: 1, fontSize: 11, fontWeight: '700', color: vg.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
    workerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
    workerRowAlt: { backgroundColor: vg.pillBg, borderRadius: 8 },
    workerAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: vg.primary + '30', justifyContent: 'center', alignItems: 'center' },
    workerAvatarText: { fontSize: 12, fontWeight: '700', color: vg.primary },
    workerName: { fontSize: 13, fontWeight: '500', color: vg.text, flex: 1 },
    workerStat: { flex: 1, fontSize: 14, fontWeight: '600', color: vg.text, textAlign: 'center' },
});

export default FMAnalytics;