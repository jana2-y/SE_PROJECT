import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const tabs = [
  { label: 'Dashboard', route: '/admin/dashboard', icon: 'grid-outline' },
  { label: 'Users', route: '/admin/users', icon: 'people-outline' },
  { label: 'Requests', route: '/admin/requests', icon: 'mail-unread-outline' },
  { label: 'Rewards', route: '/admin/rewards', icon: 'gift-outline' },
  { label: 'Leaderboard', route: '/admin/leaderboard', icon: 'trophy-outline' },
  { label: 'Settings', route: '/admin/settings', icon: 'settings-outline' },
];

export default function AdminTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.headerBg, borderColor: colors.glassBorder }]}>
      {tabs.map((tab) => {
        const active = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            onPress={() => router.push(tab.route)}
            style={styles.tab}
          >
            {active && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
            <Ionicons
              name={tab.icon}
              size={20}
              color={active ? colors.primary : colors.textFaint}
            />
            <Text style={[
              styles.label,
              { color: active ? colors.primary : colors.textFaint, fontWeight: active ? '700' : '400' }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 75,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 15,
    paddingTop: 8,
  },
  tab: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontSize: 9, letterSpacing: 0.2 },
  activeIndicator: { position: 'absolute', top: -8, height: 2, width: 20, borderRadius: 1 },
});