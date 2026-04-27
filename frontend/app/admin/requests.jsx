import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

export default function AdminRequests() {
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const data = await api.getStaff(user.token)
      setPending(data.filter(u => !u.is_verified))
    } catch (e) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [])

  const handleVerify = async (id) => {
    try {
      await api.verifyUser(user.token, id)
      fetchPending()
    } catch (e) {
      Alert.alert('Error', e.message)
    }
  }

  const handleDecline = async (id) => {
    try {
      await api.deactivateUser(user.token, id)
      fetchPending()
    } catch (e) {
      Alert.alert('Error', e.message)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Requests</Text>
      {loading ? <ActivityIndicator size="large" color="#004e92" style={{ marginTop: 40 }} /> : (
        pending.length === 0 ? (
          <Text style={styles.empty}>No pending requests 🎉</Text>
        ) : (
          <FlatList
            data={pending}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.role}>{item.role === 'facility_manager' ? 'Facility Manager' : 'Worker'}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.verifyBtn} onPress={() => handleVerify(item.id)}>
                    <Text style={styles.btnText}>✓ Verify</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(item.id)}>
                    <Text style={styles.btnText}>✕ Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' },
  empty: { textAlign: 'center', marginTop: 60, color: '#999', fontSize: 16 },
  card: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 16, marginBottom: 12 },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  email: { fontSize: 12, color: '#777', marginTop: 2 },
  role: { fontSize: 12, color: '#004e92', fontWeight: '600', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  verifyBtn: { flex: 1, backgroundColor: '#2e7d32', padding: 10, borderRadius: 8, alignItems: 'center' },
  declineBtn: { flex: 1, backgroundColor: '#c62828', padding: 10, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
})