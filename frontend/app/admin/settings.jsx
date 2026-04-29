import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, StatusBar, ScrollView, TextInput, ActivityIndicator, Platform
} from 'react-native'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'expo-router'
import api from '../../services/api'
import AdminTabBar from '../../components/admin/AdminTabBar'

export default function AdminSettings() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [theme, setTheme] = useState('light')
  const [pointsPerTicket, setPointsPerTicket] = useState('')
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchConfig = async () => {
    try {
      const data = await api.getPointsConfig()
      if (data) setPointsPerTicket(String(data.points_per_ticket))
    } catch (e) {
      console.error('Failed to fetch points config:', e)
    } finally {
      setLoadingConfig(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleUpdatePoints = async () => {
    if (!pointsPerTicket) return
    setUpdating(true)
    try {
      await api.updatePointsConfig({ points_per_ticket: parseInt(pointsPerTicket) })
      Alert.alert('Success', 'Points configuration updated successfully.')
    } catch (e) {
      Alert.alert('Error', e.message)
    } finally {
      setUpdating(false)
    }
  }

  const performLogout = async () => {
    try {
      await logout()
      router.replace('/login')
    } catch (e) {
      console.error('Logout error:', e)
      router.replace('/login')
    }
  }

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        performLogout()
      }
      return
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: performLogout
      }
    ])
  }

  const bgColor = theme === 'dark' ? '#1a1a1a' : '#FFF0C4'
  const textColor = theme === 'dark' ? '#FFF0C4' : '#3E0703'
  const inputBg = theme === 'dark' ? '#333' : '#fff'

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="light-content" backgroundColor="#3E0703" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0)?.toUpperCase() || 'A'}
            </Text>
          </View>
          <Text style={styles.profileRole}>ADMINISTRATOR</Text>
          <Text style={[styles.profileEmail, { color: textColor }]}>{user?.email}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#333' : '#e8d5b0' }]} />

        {/* Points System Setting */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>POINTS SYSTEM</Text>
          <Text style={[styles.settingDesc, { color: textColor }]}>Set how many points users earn per completed ticket</Text>
          {loadingConfig ? (
            <ActivityIndicator size="small" color="#8C1007" />
          ) : (
            <View style={styles.configRow}>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                keyboardType="numeric"
                value={pointsPerTicket}
                onChangeText={setPointsPerTicket}
                placeholder="Points"
                placeholderTextColor="#b0937f"
              />
              <TouchableOpacity
                style={[styles.updateBtn, { opacity: updating ? 0.6 : 1 }]}
                onPress={handleUpdatePoints}
                disabled={updating}
              >
                <Text style={styles.updateBtnText}>{updating ? '...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#333' : '#e8d5b0' }]} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APPEARANCE</Text>
          <View style={styles.themeRow}>
            {['light', 'dark'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.themeBtn,
                  { borderColor: '#8C1007' },
                  theme === t && styles.themeBtnActive
                ]}
                onPress={() => setTheme(t)}
              >
                <Text style={[styles.themeBtnText, theme === t && styles.themeBtnTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#333' : '#e8d5b0' }]} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Campus Care Admin v1.0</Text>
      </ScrollView>
      <AdminTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { padding: 24, paddingBottom: 60 },
  profileSection: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#3E0703',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { color: '#FFF0C4', fontSize: 32, fontFamily: 'Georgia', fontWeight: '700' },
  profileRole: { fontSize: 10, letterSpacing: 3, color: '#8C1007', fontWeight: '700', marginBottom: 6 },
  profileEmail: { fontSize: 14, fontWeight: '500' },
  divider: { height: 1, marginVertical: 8 },
  section: { paddingVertical: 20 },
  sectionLabel: { fontSize: 10, letterSpacing: 3, color: '#8C1007', fontWeight: '700', marginBottom: 8 },
  settingDesc: { fontSize: 13, marginBottom: 16, opacity: 0.8 },
  configRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  input: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 2, borderWidth: 1, borderColor: '#e8d5b0',
    fontSize: 14, fontWeight: '600'
  },
  updateBtn: { backgroundColor: '#3E0703', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 2 },
  updateBtnText: { color: '#FFF0C4', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  themeRow: { flexDirection: 'row', gap: 12 },
  themeBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 2,
    borderWidth: 1, alignItems: 'center',
  },
  themeBtnActive: { backgroundColor: '#3E0703', borderColor: '#3E0703' },
  themeBtnText: { fontSize: 13, color: '#8C1007', fontWeight: '600', letterSpacing: 0.5 },
  themeBtnTextActive: { color: '#FFF0C4' },
  logoutBtn: {
    marginTop: 24, paddingVertical: 16, borderRadius: 2,
    borderWidth: 1, borderColor: '#660B05', alignItems: 'center',
  },
  logoutText: { color: '#660B05', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  version: { textAlign: 'center', marginTop: 32, fontSize: 11, color: '#b0937f', letterSpacing: 1 },
})