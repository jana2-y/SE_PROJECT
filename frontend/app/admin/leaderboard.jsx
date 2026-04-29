import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, StyleSheet, StatusBar, ImageBackground } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import AdminTabBar from '../../components/admin/AdminTabBar'

export default function AdminLeaderboard() {
  const { user } = useAuth()
  const { theme, colors } = useTheme()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getLeaderboard()
        setData(res)
      } catch (e) {
        console.error(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyLabel, { color: colors.primary }]}>NO DATA</Text>
          <Text style={[styles.emptyText, { color: colors.textSub }]}>No community members yet</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Text style={[styles.heroLabel, { color: colors.primary }]}>RANKED BY POINTS</Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Leaderboard</Text>
              <View style={[styles.divider, { backgroundColor: colors.primary }]} />
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <View style={[
                styles.rank, 
                { backgroundColor: colors.pillBg, borderColor: colors.primary },
                index === 0 && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}>
                <Text style={[
                  styles.rankText, 
                  { color: colors.primary },
                  index === 0 && { color: colors.primaryBtnText }
                ]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: colors.text }]}>{item.full_name}</Text>
                <Text style={[styles.cardEmail, { color: colors.textSub }]}>{item.email}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={[styles.pointsValue, { color: colors.text }]}>{item.points ?? 0}</Text>
                <Text style={[styles.pointsLabel, { color: colors.primary }]}>PTS</Text>
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
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyLabel: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  emptyText: { fontSize: 14 },
  list: { padding: 24, paddingBottom: 40 },
  hero: { marginBottom: 24 },
  heroLabel: { fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 8 },
  heroTitle: { fontSize: 32, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 12 },
  divider: { height: 2, width: 48 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.08, zIndex: -1 },
  blob1: { top: -100, right: -100 },
  blob2: { bottom: -150, left: -100 },
  card: {
    borderRadius: 20, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  rank: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
    borderWidth: 1,
  },
  rankText: { fontSize: 14, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 2 },
  cardEmail: { fontSize: 11 },
  pointsBadge: { alignItems: 'flex-end' },
  pointsValue: { fontSize: 20, fontFamily: 'Georgia', fontWeight: '700' },
  pointsLabel: { fontSize: 9, letterSpacing: 2, fontWeight: '700' },
})