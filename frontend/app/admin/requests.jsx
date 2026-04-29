import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, StatusBar, ImageBackground
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import AdminTabBar from '../../components/admin/AdminTabBar'

export default function AdminRequests() {
  const { theme, colors } = useTheme()
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
    <ImageBackground
      source={theme === 'dark'
        ? require('../../assets/images/bg.png')
        : require('../../assets/images/bg2.png')}
      style={styles.root}
      resizeMode="cover"
    >
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Organic blob decorations */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.blob, styles.blob1, { backgroundColor: colors.primary }]} />
        <View style={[styles.blob, styles.blob2, { backgroundColor: colors.primary }]} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : pending.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.hero}>
            <Text style={[styles.heroLabel, { color: colors.primary }]}>VERIFICATION REQUESTS</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Pending</Text>
            <View style={[styles.divider, { backgroundColor: colors.primary }]} />
          </View>
          <View style={styles.emptyContent}>
            <Text style={[styles.emptyLabel, { color: colors.primary }]}>ALL CLEAR</Text>
            <Text style={[styles.emptyText, { color: colors.textSub }]}>No pending verification requests</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Text style={[styles.heroLabel, { color: colors.primary }]}>VERIFICATION REQUESTS</Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Pending</Text>
              <View style={[styles.divider, { backgroundColor: colors.primary }]} />
              <Text style={[styles.count, { color: colors.primary, marginTop: 24 }]}>{pending.length} PENDING REVIEW</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.primaryBtnText }]}>
                    {item.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{item.full_name}</Text>
                  <Text style={[styles.cardEmail, { color: colors.textSub }]}>{item.email}</Text>
                  <View style={[styles.rolePill, { backgroundColor: colors.pillBg, borderColor: colors.primary }]}>
                    <Text style={[styles.rolePillText, { color: colors.primary }]}>
                      {item.role === 'facility_manager' ? 'FACILITY MANAGER' : 'WORKER'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.declineBtn, { borderColor: colors.primary }]} 
                  onPress={() => handleDecline(item.id)}
                >
                  <Text style={[styles.declineBtnText, { color: colors.primary }]}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.verifyBtn, { backgroundColor: colors.primary }]} 
                  onPress={() => handleVerify(item.id)}
                >
                  <Text style={[styles.verifyBtnText, { color: colors.primaryBtnText }]}>Verify Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <AdminTabBar />
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, padding: 24 },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 40 },
  emptyLabel: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  emptyText: { fontSize: 14 },
  list: { padding: 24, paddingBottom: 40 },
  hero: { marginBottom: 24 },
  heroLabel: { fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 8 },
  heroTitle: { fontSize: 32, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 12 },
  divider: { height: 2, width: 48 },
  count: { fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 16 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.08, zIndex: -1 },
  blob1: { top: -100, right: -100 },
  blob2: { bottom: -150, left: -100 },
  card: {
    borderRadius: 24, padding: 20, marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 20, fontFamily: 'Georgia', fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 3 },
  cardEmail: { fontSize: 12, marginBottom: 8 },
  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 0.5,
  },
  rolePillText: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, alignItems: 'center',
  },
  declineBtnText: { fontSize: 13, fontWeight: '600' },
  verifyBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 20,
    alignItems: 'center',
  },
  verifyBtnText: { fontSize: 13, fontWeight: '600' },
})
