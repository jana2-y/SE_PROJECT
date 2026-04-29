import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#3E0703',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 10,
  },
  tab: { alignItems: 'center', justifyContent: 'center' },
  label: { color: '#FFF0C4', fontSize: 10, fontWeight: '600', opacity: 0.7 },
  activeLabel: { color: '#fff', opacity: 1 },
  activeIndicator: { height: 2, backgroundColor: '#FFF0C4', width: 20, marginTop: 4 },
});

const tabs = [
  { label: 'Users', route: '/admin/users' },
  { label: 'Requests', route: '/admin/requests' },
  { label: 'Rewards', route: '/admin/rewards' },
  { label: 'Leaderboard', route: '/admin/leaderboard' },
  { label: 'Settings', route: '/admin/settings' },
];

export default function AdminTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.route}
          onPress={() => router.push(tab.route)}
          style={styles.tab}
        >
          <Text style={[
            styles.label,
            pathname === tab.route && styles.activeLabel
          ]}>
            {tab.label}
          </Text>
          {pathname === tab.route && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}