import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminTabBar from '../../components/admin/AdminTabBar'

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF0C4' },
  filterRow: {
    flexDirection: 'row', padding: 20, gap: 10,
    backgroundColor: '#3E0703',
  },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: '#FFF0C4',
  },
  filterBtnActive: {
    backgroundColor: '#FFF0C4',
  },
  filterText: { color: '#FFF0C4', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#3E0703' },
  list: { padding: 20, paddingBottom: 40 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#7a5c5a', fontSize: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 4, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#3E0703', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#3E0703',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#FFF0C4', fontSize: 18, fontWeight: '700', fontFamily: 'Georgia' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontFamily: 'Georgia', color: '#3E0703', fontWeight: '700', marginBottom: 2 },
  cardEmail: { fontSize: 12, color: '#7a5c5a', marginBottom: 4 },
  cardRole: { fontSize: 9, letterSpacing: 1.5, color: '#8C1007', fontWeight: '700' },
  cardRight: { marginLeft: 10 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, minWidth: 90, alignItems: 'center' },
  activateBtn: { backgroundColor: '#3E0703' },
  deactivateBtn: { borderWidth: 1, borderColor: '#8C1007' },
  toggleText: { fontSize: 12, fontWeight: '700' },
})

const filters = [
  { label: 'All', value: null },
  { label: 'FM', value: 'facility_manager' },
  { label: 'Workers', value: 'worker' },
]

export default function AdminUsers() {
  const { user } = useAuth()
  const [staff, setStaff] = useState([])
  const [filter, setFilter] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await api.getStaff(filter);
      // Only show users who have been verified (is_active is true or false, but NOT null)
      setStaff(data.filter(u => u.is_active !== null));
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff() }, [filter])

  const toggleActive = async (id, isActive) => {
    const action = isActive ? 'deactivate' : 'activate';
    
    const performToggle = async () => {
      try {
        if (isActive) await api.deactivateUser(id)
        else await api.activateUser(id)
        await fetchStaff()
      } catch (e) {
        Alert.alert('Error', e.message)
      }
    }

    if (Platform.OS === 'web') {
      // Direct call on web because Alert.alert buttons don't work reliably
      performToggle();
    } else {
      Alert.alert(
        isActive ? 'Deactivate Account' : 'Activate Account',
        `Are you sure you want to ${action} this account?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: isActive ? 'destructive' : 'default',
            onPress: performToggle
          }
        ]
      )
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#3E0703" />
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={String(f.value)}
            style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8C1007" style={{ marginTop: 60 }} />
      ) : staff.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No accounts found</Text>
        </View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.full_name?.charAt(0)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.full_name}</Text>
                  <Text style={styles.cardEmail}>{item.email}</Text>
                  <Text style={styles.cardRole}>{item.role?.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <TouchableOpacity
                  style={[styles.toggleBtn, item.is_active ? styles.deactivateBtn : styles.activateBtn]}
                  onPress={() => toggleActive(item.id, item.is_active)}
                >
                  <Text style={[styles.toggleText, { color: item.is_active ? '#8C1007' : '#FFF0C4' }]}>
                    {item.is_active ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <AdminTabBar />
    </View>
  )
}
