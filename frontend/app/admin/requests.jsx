import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, StatusBar
} from 'react-native'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminTabBar from '../../components/admin/AdminTabBar'

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF0C4' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyLabel: { fontSize: 10, letterSpacing: 3, color: '#8C1007', fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#7a5c5a' },
  list: { padding: 20, paddingBottom: 40 },
  count: { fontSize: 10, letterSpacing: 3, color: '#8C1007', fontWeight: '700', marginBottom: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 4, padding: 20, marginBottom: 12,
    shadowColor: '#3E0703', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#3E0703',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: '#FFF0C4', fontSize: 20, fontFamily: 'Georgia', fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontFamily: 'Georgia', color: '#3E0703', fontWeight: '700', marginBottom: 3 },
  cardEmail: { fontSize: 12, color: '#7a5c5a', marginBottom: 8 },
  rolePill: {
    alignSelf: 'flex-start', backgroundColor: '#FFF0C4',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2,
    borderWidth: 1, borderColor: '#8C1007',
  },
  rolePillText: { fontSize: 9, letterSpacing: 2, color: '#8C1007', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 4,
    borderWidth: 1, borderColor: '#8C1007', alignItems: 'center',
  },
  declineBtnText: { fontSize: 13, color: '#8C1007', fontWeight: '600' },
  verifyBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 4,
    backgroundColor: '#3E0703', alignItems: 'center',
  },
  verifyBtnText: { fontSize: 13, color: '#FFF0C4', fontWeight: '600' },
})

export default function AdminRequests() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPending = async () => {
    setLoading(true)
    try {
      // fetch all staff (FM + workers), then filter to unverified
      const data = await api.getStaff(null)
      setPending(data.filter(u => u.is_active === null))
    } catch (e) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [])

  const handleVerify = async (id) => {
    try {
      await api.verifyUser(id)
      fetchPending()
    } catch (e) {
      Alert.alert('Error', e.message)
    }
  }

  const handleDecline = async (id) => {
    Alert.alert('Decline Request', 'Are you sure you want to decline this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline', style: 'destructive',
        onPress: async () => {
          try {
            await api.deactivateUser(id)
            fetchPending()
          } catch (e) {
            Alert.alert('Error', e.message)
          }
        }
      }
    ])
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#3E0703" />
      {loading ? (
        <ActivityIndicator size="large" color="#8C1007" style={{ marginTop: 60 }} />
      ) : pending.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyLabel}>ALL CLEAR</Text>
          <Text style={styles.emptyText}>No pending verification requests</Text>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.count}>{pending.length} PENDING</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.full_name}</Text>
                  <Text style={styles.cardEmail}>{item.email}</Text>
                  <View style={styles.rolePill}>
                    <Text style={styles.rolePillText}>
                      {item.role === 'facility_manager' ? 'FACILITY MANAGER' : 'WORKER'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(item.id)}>
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.verifyBtn} onPress={() => handleVerify(item.id)}>
                  <Text style={styles.verifyBtnText}>Verify Account</Text>
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
