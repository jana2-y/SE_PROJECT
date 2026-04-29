import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, StatusBar, ScrollView, TextInput, ActivityIndicator, Platform, ImageBackground
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useRouter } from 'expo-router'
import api from '../../services/api'
import AdminTabBar from '../../components/admin/AdminTabBar'

export default function AdminSettings() {
  const { user, logout } = useAuth()
  const { theme, setTheme, colors } = useTheme()
  const router = useRouter()
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

  return (
    <ImageBackground
      source={theme === 'dark'
        ? require('../../assets/images/bg.png')
        : require('../../assets/images/bg2.png')}
      style={styles.root}
      resizeMode="cover"
    >
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={[styles.heroLabel, { color: colors.primary }]}>ADMINISTRATION PORTAL</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Settings</Text>
          <View style={[styles.divider, { backgroundColor: colors.primary }]} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <View style={styles.profileSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.primaryBtnText }]}>
                {user?.email?.charAt(0)?.toUpperCase() || 'A'}
              </Text>
            </View>
            <Text style={[styles.profileRole, { color: colors.primary }]}>ADMINISTRATOR</Text>
            <Text style={[styles.profileEmail, { color: colors.text }]}>{user?.email}</Text>
          </View>
        </View>

        {/* Points System Setting */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>POINTS SYSTEM</Text>
          <Text style={[styles.settingDesc, { color: colors.textSub }]}>Set how many points users earn per completed ticket</Text>
          {loadingConfig ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.configRow}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
                keyboardType="numeric"
                value={pointsPerTicket}
                onChangeText={setPointsPerTicket}
                placeholder="Points"
                placeholderTextColor={colors.textFaint}
              />
              <TouchableOpacity
                style={[styles.updateBtn, { backgroundColor: colors.primary, opacity: updating ? 0.6 : 1 }]}
                onPress={handleUpdatePoints}
                disabled={updating}
              >
                <Text style={[styles.updateBtnText, { color: colors.primaryBtnText }]}>{updating ? '...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>APPEARANCE</Text>
          <View style={styles.themeRow}>
            {['light', 'dark'].map((t) => {
              const active = theme === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.themeBtn,
                    { borderColor: colors.primary },
                    active && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setTheme(t)}
                >
                  <Text style={[
                    styles.themeBtnText, 
                    { color: active ? colors.primaryBtnText : colors.primary }
                  ]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <TouchableOpacity 
          style={[styles.logoutBtn, { borderColor: colors.error }]} 
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textFaint }]}>Campus Care Admin v1.0</Text>
      </ScrollView>
      <AdminTabBar />
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', height: '100%' },
  container: { padding: 24, paddingBottom: 60 },
  hero: { marginBottom: 24 },
  heroLabel: { fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 8 },
  heroTitle: { fontSize: 32, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 12 },
  divider: { height: 2, width: 48, marginBottom: 24 },
  card: { borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1 },
  profileSection: { alignItems: 'center', paddingVertical: 16 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontFamily: 'Georgia', fontWeight: '700' },
  profileRole: { fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 6 },
  profileEmail: { fontSize: 14, fontWeight: '500' },
  section: { paddingVertical: 20 },
  sectionLabel: { fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 8 },
  settingDesc: { fontSize: 13, marginBottom: 16, opacity: 0.8 },
  configRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  input: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1,
    fontSize: 14, fontWeight: '600'
  },
  updateBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  updateBtnText: { fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  themeRow: { flexDirection: 'row', gap: 12 },
  themeBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 20,
    borderWidth: 1, alignItems: 'center',
  },
  themeBtnText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  logoutBtn: {
    marginTop: 24, paddingVertical: 16, borderRadius: 20,
    borderWidth: 1, alignItems: 'center',
  },
  logoutText: { fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  version: { textAlign: 'center', marginTop: 32, fontSize: 11, letterSpacing: 1 },
})