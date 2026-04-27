import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.welcome}>Welcome, Admin 👋</Text>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/admin/users')}>
        <Text style={styles.cardTitle}>👥 Manage Accounts</Text>
        <Text style={styles.cardSub}>View, activate or deactivate FM & Worker accounts</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/admin/requests')}>
        <Text style={styles.cardTitle}>📋 Verification Requests</Text>
        <Text style={styles.cardSub}>Approve or decline pending FM & Worker signups</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/admin/leaderboard')}>
        <Text style={styles.cardTitle}>🏆 Leaderboard</Text>
        <Text style={styles.cardSub}>Top community members by points</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/admin/rewards')}>
        <Text style={styles.cardTitle}>🎁 Rewards</Text>
        <Text style={styles.cardSub}>Create and manage rewards for community members</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  welcome: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#1a1a1a' },
  card: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#004e92',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#004e92', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#555' },
})