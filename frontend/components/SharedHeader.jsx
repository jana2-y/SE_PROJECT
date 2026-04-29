import React, { useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import NotificationsSidebar from './worker/NotificationsSidebar';

const GIU_LOGO = require('../assets/images/giu koko.png');
const CC_LOGO  = require('../assets/images/cclogo.png');

const HOME_ROUTES = {
  worker:           '/worker/home',
  facility_manager: '/fm/dashboard',
  community_member: '/cm/home',
};

const NOTIF_ENDPOINTS = {
  worker:           '/worker/notifications',
  facility_manager: '/fm/notifications',
  community_member: '/cm/notifications',
};

const VG = {
  light: { bg: 'rgba(255,255,255,0.62)', border: 'rgba(66,0,0,0.12)', btn: '#420000', icon: '#ffffff' },
  dark:  { bg: 'rgba(74,39,31,0.65)',    border: 'rgba(255,218,211,0.14)', btn: '#660b05', icon: '#ffdad4' },
};

export default function SharedHeader({ onAccept, refreshKey = 0 }) {
  const router     = useRouter();
  const navigation = useNavigation();
  const pathname   = usePathname();
  const { user } = useAuth();
  const { theme } = useTheme();
  const vg = VG[theme] || VG.light;

  const homeRoute   = HOME_ROUTES[user?.role] ?? '/';
  const notifRoute  = NOTIF_ENDPOINTS[user?.role] ?? '/worker/notifications';
  const isHome      = pathname === homeRoute;

  const [notifVisible, setNotifVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await api.get(notifRoute);
      setNotifications(data || []);
    } catch {}
  }, [notifRoute]);

  // Refresh on page focus
  useFocusEffect(useCallback(() => { fetchNotifs(); }, [fetchNotifs]));

  // Refresh when a push arrives (home.jsx increments refreshKey)
  useEffect(() => { if (refreshKey > 0) fetchNotifs(); }, [refreshKey]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.patch(`${notifRoute.replace('/notifications', '/notifications/mark-read')}`, {});
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <>
      <View style={[s.container, { backgroundColor: vg.bg, borderBottomColor: vg.border }]}>
        {/* Back */}
        <TouchableOpacity
          style={[s.btn, { backgroundColor: vg.btn }]}
          onPress={() => navigation.canGoBack() ? router.back() : router.replace(homeRoute)}
        >
          <Ionicons name="chevron-back" size={20} color={vg.icon} />
        </TouchableOpacity>

        {/* Logo / Home */}
        <TouchableOpacity
          onPress={isHome ? undefined : () => router.replace(homeRoute)}
          activeOpacity={isHome ? 1 : 0.7}
        >
          <Image source={isHome ? CC_LOGO : GIU_LOGO} style={s.logo} resizeMode="contain" />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity style={[s.btn, { backgroundColor: vg.btn }]} onPress={() => setNotifVisible(true)}>
          <View>
            <Ionicons name="notifications-outline" size={20} color={vg.icon} />
            {unreadCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <NotificationsSidebar
        visible={notifVisible}
        notifications={notifications}
        onClose={() => setNotifVisible(false)}
        onMarkAllRead={handleMarkAllRead}
        onAccept={onAccept}
      />
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  btn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  logo: { width: 80, height: 80 },
  badge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#ba1a1a', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
