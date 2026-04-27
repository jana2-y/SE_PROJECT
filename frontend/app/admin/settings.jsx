import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'expo-router'

export default function AdminSettings() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [theme, setTheme] = useState('light')

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/login') } }
    ])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.themeRow}>
          {['light', 'dark'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.themeBtn, theme === t && styles.themeBtnActive]}
              onPress={() => setTheme(t)}
            >
              <Text style={[styles.themeText, theme === t && styles.themeTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.changePass} onPress={() => Alert.alert('Coming soon', 'Change password via email reset.')}>
        <Text style={styles.changePassText}>🔑 Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24, color: '#1a1a1a' },
  section: { marginBottom: 20 },
  label: { fontSize: 12, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  themeRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  themeBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  themeBtnActive: { backgroundColor: '#004e92' },
  themeText: { color: '#555', fontWeight: '600' },
  themeTextActive: { color: '#fff' },
  changePass: { padding: 16, backgroundColor: '#f0f4ff', borderRadius: 10, marginBottom: 12 },
  changePassText: { color: '#004e92', fontWeight: '600', fontSize: 15 },
  logoutBtn: { padding: 16, backgroundColor: '#c62828', borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})