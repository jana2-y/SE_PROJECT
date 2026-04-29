import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import AdminTabBar from '../../components/admin/AdminTabBar'

const cards = [
  {
    title: 'Manage Accounts',
    subtitle: 'View, activate or deactivate FM & Worker accounts',
    route: '/admin/users',
    tag: 'USER MANAGEMENT',
  },
  {
    title: 'Verification Requests',
    subtitle: 'Approve or decline pending FM & Worker signups',
    route: '/admin/requests',
    tag: 'PENDING REVIEW',
  },
  {
    title: 'Leaderboard',
    subtitle: 'Top community members ranked by points',
    route: '/admin/leaderboard',
    tag: 'ENGAGEMENT',
  },
  {
    title: 'Rewards',
    subtitle: 'Create and manage rewards for community members',
    route: '/admin/rewards',
    tag: 'GAMIFICATION',
  },
]

export default function AdminDashboard() {
  const router = useRouter()

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#3E0703" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>ADMINISTRATION PORTAL</Text>
          <Text style={styles.heroTitle}>Dashboard</Text>
          <View style={styles.divider} />
        </View>

        {cards.map((card, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={() => router.push(card.route)}
            activeOpacity={0.85}
          >
            <Text style={styles.cardTag}>{card.tag}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            <View style={styles.cardArrow}>
              <Text style={styles.cardArrowText}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <AdminTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF0C4' },
  container: { padding: 24, paddingBottom: 48 },
  heroSection: { marginBottom: 32 },
  heroLabel: { fontSize: 10, letterSpacing: 3, color: '#8C1007', fontWeight: '700', marginBottom: 8 },
  heroTitle: { fontSize: 36, fontFamily: 'Georgia', color: '#3E0703', fontWeight: '700', marginBottom: 16 },
  divider: { height: 2, backgroundColor: '#8C1007', width: 48 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 24,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8C1007',
    shadowColor: '#3E0703',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTag: { fontSize: 9, letterSpacing: 2.5, color: '#8C1007', fontWeight: '700', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontFamily: 'Georgia', color: '#3E0703', fontWeight: '700', marginBottom: 6 },
  cardSubtitle: { fontSize: 13, color: '#7a5c5a', lineHeight: 20, marginBottom: 16 },
  cardArrow: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0C4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardArrowText: { fontSize: 16, color: '#8C1007', fontWeight: '700' },
})