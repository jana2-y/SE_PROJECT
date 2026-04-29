import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, RefreshControl, Alert,
    Modal, Dimensions, ImageBackground, Animated
} from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import FeedbackModal from '../../components/FM/FeedbackModal';
import SharedHeader from '../../components/SharedHeader';

// Velvet & Gold Glass design tokens
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
    const { theme } = useTheme();
    const fc = FC[theme] || FC.light;
    const styles = useMemo(() => makeStyles(fc, theme), [fc, theme]);

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [areaType, setAreaType] = useState('both');
    const [filterArea, setFilterArea] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('pending');
    const [filterSort, setFilterSort] = useState('recent');
    const [layoutMode, setLayoutMode] = useState('wide');
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [ticketDetailVisible, setTicketDetailVisible] = useState(false);
    const [selectedDetailTicket, setSelectedDetailTicket] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [previewSize, setPreviewSize] = useState(null);

    // Animations
    const popupAnim = useRef(new Animated.Value(0)).current;
    const segSlide = useRef(new Animated.Value(0)).current;
    const [segWidth, setSegWidth] = useState(0);
    const AREA_KEYS = ['both', 'indoor', 'outdoor'];

    const fetchTickets = useCallback(async () => {
        setFetchError('');
        try {
            const params = new URLSearchParams();
            if (areaType !== 'both') params.append('area', areaType);
            if (filterCategory) params.append('category', filterCategory);
            if (filterStatus) params.append('status', filterStatus);
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
    }, [areaType, filterArea, filterCategory, filterStatus, filterSort]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

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

    const onRefresh = () => { setRefreshing(true); fetchTickets(); };

    const handleAreaTypeChange = (type) => {
        const idx = AREA_KEYS.indexOf(type);
        Animated.spring(segSlide, {
            toValue: idx, useNativeDriver: true, tension: 180, friction: 18,
        }).start();
        setAreaType(type);
        setFilterArea('');
    };

    const handleResetFilters = () => {
        setAreaType('both');
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
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[priority] + '22' }]}>
                <Text style={[styles.priorityText, { color: PRIORITY_COLORS[priority] }]}>
                    {priority.toUpperCase()}
                </Text>
            </View>
        );
    };

    const locationItems = areaType === 'indoor'
        ? indoorLocations
        : areaType === 'outdoor'
            ? outdoorLocations
            : [...indoorLocations, ...outdoorLocations];

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

            <SharedHeader onNotificationsPress={() => {}} />

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
                        {/* Segmented control */}
                        <View
                            style={styles.segment}
                            onLayout={e => setSegWidth(e.nativeEvent.layout.width - 8)}
                        >
                            {/* Sliding pill */}
                            {segWidth > 0 && (
                                <Animated.View style={[styles.segPill, {
                                    width: segWidth / 3,
                                    transform: [{
                                        translateX: segSlide.interpolate({
                                            inputRange: [0, 1, 2],
                                            outputRange: [0, segWidth / 3, (segWidth / 3) * 2],
                                        }),
                                    }],
                                }]} />
                            )}
                            {[
                                { key: 'both', label: t('both') },
                                { key: 'indoor', label: t('indoor') },
                                { key: 'outdoor', label: t('outdoor') },
                            ].map(({ key, label }) => (
                                <TouchableOpacity
                                    key={key}
                                    style={styles.segBtn}
                                    onPress={() => handleAreaTypeChange(key)}
                                >
                                    <Text style={[styles.segText, areaType === key && styles.segTextActive]}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 2×2 picker grid */}
                        <View style={styles.pickerGrid}>
                            <View style={styles.pickerCell}>
                                <Picker
                                    selectedValue={filterArea}
                                    onValueChange={setFilterArea}
                                    style={styles.picker}
                                    dropdownIconColor={fc.primary}
                                >
                                    <Picker.Item label={t('locationAll')} value="" color={fc.text} />
                                    {locationItems.map(loc => (
                                        <Picker.Item key={loc.value} label={loc.label} value={loc.value} color={fc.text} />
                                    ))}
                                </Picker>
                            </View>
                            <View style={styles.pickerCell}>
                                <Picker
                                    selectedValue={filterCategory}
                                    onValueChange={setFilterCategory}
                                    style={styles.picker}
                                    dropdownIconColor={fc.primary}
                                >
                                    <Picker.Item label={t('categoryAll')} value="" color={fc.text} />
                                    <Picker.Item label={t('Electrical Issues')} value="Electrical Issues" color={fc.text} />
                                    <Picker.Item label={t('Plumbing')} value="Plumbing" color={fc.text} />
                                    <Picker.Item label={t('AC and Heating Issues')} value="AC and Heating Issues" color={fc.text} />
                                    <Picker.Item label={t('Furniture Damage')} value="Furniture Damage" color={fc.text} />
                                    <Picker.Item label={t('Cleaning & Housekeeping')} value="Cleaning & Housekeeping" color={fc.text} />
                                    <Picker.Item label={t('Facilities & Utilities')} value="Facilities & Utilities" color={fc.text} />
                                    <Picker.Item label={t('Garden/Landscape/Path Issues')} value="Garden/Landscape/Path Issues" color={fc.text} />
                                </Picker>
                            </View>
                            <View style={styles.pickerCell}>
                                <Picker
                                    selectedValue={filterStatus}
                                    onValueChange={setFilterStatus}
                                    style={styles.picker}
                                    dropdownIconColor={fc.primary}
                                >
                                    <Picker.Item label={t('pending')} value="pending" color={fc.text} />
                                    <Picker.Item label={t('assigned')} value="assigned" color={fc.text} />
                                    <Picker.Item label={t('inProgress')} value="in_progress" color={fc.text} />
                                    <Picker.Item label={t('reassigned')} value="reassigned" color={fc.text} />
                                    <Picker.Item label={t('completed')} value="completed" color={fc.text} />
                                    <Picker.Item label={t('all')} value="" color={fc.text} />
                                </Picker>
                            </View>
                            <View style={styles.pickerCell}>
                                <Picker
                                    selectedValue={filterSort}
                                    onValueChange={setFilterSort}
                                    style={styles.picker}
                                    dropdownIconColor={fc.primary}
                                >
                                    <Picker.Item label={t('mostRecent')} value="recent" color={fc.text} />
                                    <Picker.Item label={t('leastRecent')} value="oldest" color={fc.text} />
                                    <Picker.Item label={t('mostPopular')} value="popular" color={fc.text} />
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.filterFooterRow}>
                            <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
                                <Text style={styles.resetBtnText}>{t('reset')}</Text>
                            </TouchableOpacity>
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

                    {/* Ticket list */}
                    <ScrollView
                        style={styles.list}
                        contentContainerStyle={[
                            styles.listContent,
                            layoutMode === 'grid' && styles.listContentGrid,
                        ]}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={fc.primary} />}
                    >
                        {tickets.length === 0 ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>{t('noTickets')}</Text>
                            </View>
                        ) : (
                            tickets.map((ticket) => {
                                const reassignBlock = ticket.status === 'reassigned' && ticket.assignments?.[0] && (() => {
                                    const a = ticket.assignments[0];
                                    return (
                                        <View style={styles.reassignBox}>
                                            {a.deadline && <Text style={styles.reassignInfo}>{t('setDeadline')}: {new Date(a.deadline).toLocaleDateString()}</Text>}
                                            {a.worker_note && <Text style={styles.reassignInfo} numberOfLines={2}>{t('workersNote')}: {a.worker_note}</Text>}
                                            {a.feedback && <Text style={styles.reassignInfo} numberOfLines={2}>{t('feedbackBtn')}: {a.feedback}</Text>}
                                            {a.proof_url && (
                                                <TouchableOpacity onPress={() => setImagePreviewUrl(a.proof_url)}>
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
                                                <Text style={styles.cardTitle} numberOfLines={2}>{ticket.description || 'No description'}</Text>
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
                                                <Text style={styles.cardTitle} numberOfLines={3}>{ticket.description || 'No description'}</Text>
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
                                                <Text style={styles.cardTitle} numberOfLines={2}>{ticket.description || 'No description'}</Text>
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
                                            {a && (
                                                <>
                                                    <View style={styles.detailDivider} />
                                                    {a.worker_name && <DetailRow label={t('workerPrefix')} value={a.worker_name} textColor={fc.textSub} />}
                                                    {a.priority && <DetailRow label={t('priority')} value={a.priority.toUpperCase()} valueColor={PRIORITY_COLORS[a.priority]} textColor={fc.textSub} />}
                                                    {a.deadline && <DetailRow label={t('setDeadline')} value={new Date(a.deadline).toLocaleString()} textColor={fc.textSub} />}
                                                    {a.worker_note && <DetailRow label={t('workersNote')} value={a.worker_note} textColor={fc.textSub} />}
                                                    {a.feedback && <DetailRow label={t('feedbackBtn')} value={a.feedback} textColor={fc.textSub} />}
                                                    {a.proof_url && (
                                                        <View style={styles.detailProofWrap}>
                                                            <Text style={[styles.detailLabel, { color: fc.textSub }]}>{t('proofLabel')}</Text>
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
    },

    // Segmented control
    segment: {
        flexDirection: 'row',
        backgroundColor: fc.glass,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: fc.glassBorder,
        padding: 4,
        marginBottom: 10,
    },
    segPill: {
        position: 'absolute',
        top: 0, bottom: 0,
        borderRadius: 16,
        backgroundColor: fc.segActiveBg,
        shadowColor: '#420000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    segBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 16, zIndex: 1 },
    segBtnActive: {},
    segText: { fontSize: 13, fontWeight: '600', color: fc.segInactiveTx, letterSpacing: 0.2 },
    segTextActive: { color: fc.segActiveTx },

    // Picker grid
    pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 6, marginBottom: 8 },
    pickerCell: {
        width: '48.5%',
        backgroundColor: theme === 'dark' ? 'rgba(102, 11, 5, 0.35)' : 'rgba(255, 218, 211, 0.55)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme === 'dark' ? 'rgba(255, 180, 168, 0.25)' : 'rgba(66, 0, 0, 0.2)',
        overflow: 'hidden',
    },
    picker: {
        height: 42,
        fontSize: 12,
        color: fc.text,
        backgroundColor: theme === 'dark' ? 'rgba(102, 11, 5, 0.35)' : 'rgba(255, 218, 211, 0.55)',
    },

    // Reset
    resetBtn: {
        alignSelf: 'flex-end',
        backgroundColor: fc.glass,
        borderWidth: 1,
        borderColor: fc.glassBorder,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
    },
    resetBtnText: { fontSize: 12, fontWeight: '600', color: fc.primary, letterSpacing: 0.3 },

    // Layout toggle
    filterFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    layoutToggle: { flexDirection: 'row', backgroundColor: fc.glass, borderRadius: 16, borderWidth: 1, borderColor: fc.glassBorder, overflow: 'hidden' },
    layoutBtn: { paddingHorizontal: 11, paddingVertical: 5 },
    layoutBtnActive: { backgroundColor: fc.segActiveBg },
    layoutBtnText: { fontSize: 14, color: fc.segInactiveTx },
    layoutBtnTextActive: { color: fc.segActiveTx },

    // List
    list: { flex: 1 },
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
    btnCompleted: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: fc.glassBorder },
    btnCompletedText: { color: fc.textSub, fontWeight: '700', fontSize: 13 },

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
        alignSelf: 'flex-end',
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: fc.btnBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
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
