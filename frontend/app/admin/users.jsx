import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, StatusBar, Platform, ImageBackground
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import AdminTabBar from '../../components/admin/AdminTabBar'

const filters = [
  { label: 'All', value: null },
  { label: 'FM', value: 'facility_manager' },
  { label: 'Workers', value: 'worker' },
]

export default function AdminUsers() {
  const { user } = useAuth()
  const { theme, colors } = useTheme()
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
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Text style={[styles.heroLabel, { color: colors.primary }]}>USER MANAGEMENT</Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Accounts</Text>
              <View style={[styles.divider, { backgroundColor: colors.primary }]} />
              
              {/* Filter Row - Segmented Control style */}
              <View style={[styles.filterRow, { backgroundColor: colors.glass, borderColor: colors.glassBorder, marginTop: 24 }]}>
                {filters.map((f) => {
                  const active = filter === f.value;
                  return (
                    <TouchableOpacity
                      key={String(f.value)}
                      style={[styles.filterBtn, active && { backgroundColor: colors.primary }]}
                      onPress={() => setFilter(f.value)}
                    >
                      <Text style={[styles.filterText, { color: active ? colors.primaryBtnText : colors.textFaint }]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSub }]}>No accounts found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <View style={styles.cardLeft}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.primaryBtnText }]}>{item.full_name?.charAt(0)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{item.full_name}</Text>
                  <Text style={[styles.cardEmail, { color: colors.textSub }]}>{item.email}</Text>
                  <Text style={[styles.cardRole, { color: colors.primary }]}>{item.role?.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn, 
                    item.is_active 
                      ? { borderWidth: 1, borderColor: colors.primary } 
                      : { backgroundColor: colors.primary }
                  ]}
                  onPress={() => toggleActive(item.id, item.is_active)}
                >
                  <Text style={[
                    styles.toggleText, 
                    { color: item.is_active ? colors.primary : colors.primaryBtnText }
                  ]}>
                    {item.is_active ? 'Deactivate' : 'Activate'}
                  </Text>
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
  hero: { marginBottom: 24 },
  heroLabel: { fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 8 },
  heroTitle: { fontSize: 32, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 12 },
  divider: { height: 2, width: 48 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.08, zIndex: -1 },
  blob1: { top: -100, right: -100 },
  blob2: { bottom: -150, left: -100 },
  filterRow: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
  },
  filterText: { fontSize: 13, fontWeight: '600' },
  list: { padding: 20, paddingBottom: 40 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15 },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', fontFamily: 'Georgia' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 2 },
  cardEmail: { fontSize: 12, marginBottom: 4 },
  cardRole: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  cardRight: { marginLeft: 10 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, minWidth: 95, alignItems: 'center' },
  toggleText: { fontSize: 12, fontWeight: '700' },
})
