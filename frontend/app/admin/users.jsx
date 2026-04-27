import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

export default function AdminUsers() {
  const { user } = useAuth()
  const [staff, setStaff] = useState([])
  const [filter, setFilter] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const data = await api.getStaff(user.token, filter)
      setStaff(data)
    } catch (e) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStaff() }, [filter])

  const toggleActive = async (id, isActive) => {
    try {
      if (isActive) {
        await api.deactivateUser(user.token, id)
      } else {
        await api.activateUser(user.token, id)
      }
      fetchStaff()
    } catch (e) {
      Alert.alert('Error', e.message)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {[null, 'facility_manager', 'worker'].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterBtn, filter === r && styles.filterActive]}
            onPress={() => setFilter(r)}
          >
            <Text style={[styles.filterText, filter === r && styles.filterTextActive]}>
              {r === null ? 'All' : r === 'facility_manager' ? 'FM' : 'Workers'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator size="large" color="#004e92" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.role}>{item.role === 'facility_manager' ? 'FM' : 'Worker'}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.status, item.is_active ? styles.active : styles.inactive]}>
                  {item.is_active ? 'Active' : 'Deactivated'}
                </Text>
                <TouchableOpacity
                  style={[styles.toggleBtn, item.is_active ? styles.deactivateBtn : styles.activateBtn]}
                  onPress={() => toggleActive(item.id, item.is_active)}
                >
                  <Text style={styles.toggleText}>{item.is_active ? 'Deactivate' : 'Activate'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filterActive: { backgroundColor: '#004e92' },
  filterText: { color: '#555', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 10 },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  email: { fontSize: 12, color: '#777', marginTop: 2 },
  role: { fontSize: 12, color: '#004e92', marginTop: 4, fontWeight: '600' },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  status: { fontSize: 12, fontWeight: '700' },
  active: { color: '#2e7d32' },
  inactive: { color: '#c62828' },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  activateBtn: { backgroundColor: '#2e7d32' },
  deactivateBtn: { backgroundColor: '#c62828' },
  toggleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
})