import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const SUB_KEYS = ['both', 'assigned', 'reassigned'];

const TABS = [
    { key: 'pending',   tKey: 'pending',    icon: 'ellipsis-horizontal' },
    { key: 'assigned',  tKey: 'inProgress', icon: 'swap-horizontal-outline' },
    { key: 'overdue',   tKey: 'overdue',    icon: 'alert-circle-outline' },
    { key: 'completed', tKey: 'completed',  icon: 'checkmark-circle-outline' },
    { key: 'all',       tKey: 'all',        icon: 'apps-outline' },
];

const TAB_ACTIVE_COLORS = {
    assigned:  { light: 'rgba(228, 176, 42, 1)',  dark: 'rgba(228, 176, 42, 1)' },
    overdue:   { light: '#ba1a1a',                dark: '#cf6679' },
    completed: { light: '#1a1a1a',                dark: '#e0e0e0' },
};

const FMNavBar = ({ activeTab, onTabChange, subStatus, onSubStatusChange, fc, theme }) => {
    const { t } = useTranslation();
    const segSlide = useRef(new Animated.Value(SUB_KEYS.indexOf(subStatus))).current;
    const [segWidth, setSegWidth] = useState(0);

    const getActiveColor = (tabKey) => {
        const override = TAB_ACTIVE_COLORS[tabKey];
        if (override) return override[theme] ?? override.light;
        return fc.primary;
    };

    const handleSub = (key) => {
        Animated.spring(segSlide, {
            toValue: SUB_KEYS.indexOf(key),
            useNativeDriver: true, tension: 180, friction: 18,
        }).start();
        onSubStatusChange(key);
    };

    return (
        <View style={[s.wrapper, { backgroundColor: fc.glassHeader, borderColor: fc.glassBorder }]}>
            {/* Main 4-tab bar */}
            <View style={s.bar}>
                {TABS.map(tab => {
                    const active = activeTab === tab.key;
                    const activeColor = getActiveColor(tab.key);
                    return (
                        <TouchableOpacity key={tab.key} style={s.tab} onPress={() => onTabChange(tab.key)}>
                            {active && <View style={[s.indicator, { backgroundColor: activeColor }]} />}
                            <Ionicons
                                name={tab.icon}
                                size={22}
                                color={active ? activeColor : fc.textFaint}
                            />
                            <Text style={[s.tabLabel, { color: active ? activeColor : fc.textFaint, fontWeight: active ? '700' : '400' }]}>
                                {t(tab.tKey)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    wrapper: { borderTopWidth: 1 },
    subWrap: { paddingVertical: 8, alignItems: 'center', borderBottomWidth: 1 },
    subSeg: {
        flexDirection: 'row', borderRadius: 16, borderWidth: 1,
        padding: 3, width: 162,
    },
    subPill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 13 },
    subBtn: { alignItems: 'center', paddingVertical: 6, zIndex: 1 },
    subBtnText: { fontSize: 11 },
    bar: { flexDirection: 'row', paddingBottom: 12, paddingTop: 6 },
    tab: { flex: 1, alignItems: 'center', gap: 3, paddingTop: 6 },
    tabLabel: { fontSize: 10, letterSpacing: 0.2 },
    indicator: { position: 'absolute', top: 0, height: 2, width: 24, borderRadius: 1 },
});

export default FMNavBar;
