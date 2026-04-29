import { View, Text, FlatList, ActivityIndicator, StyleSheet, StatusBar } from 'react-native'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import AdminTabBar from '../../components/admin/AdminTabBar'

export default function AdminLeaderboard() {
  const { user } = useAuth()
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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#3E0703" />
      {loading ? (
        <ActivityIndicator size="large" color="#8C1007" style={{ marginTop: 60 }} />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyLabel}>NO DATA</Text>
          <Text style={styles.emptyText}>No community members yet</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>RANKED BY POINTS</Text>
              <Text style={styles.heroTitle}>Leaderboard</Text>
              <View style={styles.divider} />
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={[styles.rank, index === 0 && styles.rankFirst]}>
                <Text style={[styles.rankText, index === 0 && styles.rankTextFirst]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.full_name}</Text>
                <Text style={styles.cardEmail}>{item.email}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsValue}>{item.points ?? 0}</Text>
                <Text style={styles.pointsLabel}>PTS</Text>
              </View>
            </View>
          )}
        />
      )}
      <AdminTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF0C4' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyLabel: { fontSize: 10, letterSpacing: 3, color: '#8C1007', fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#7a5c5a' },
  list: { padding: 24, paddingBottom: 40 },
  hero: { marginBottom: 24 },
  heroLabel: { fontSize: 10, letterSpacing: 3, color: '#8C1007', fontWeight: '700', marginBottom: 8 },
  heroTitle: { fontSize: 32, fontFamily: 'Georgia', color: '#3E0703', fontWeight: '700', marginBottom: 12 },
  divider: { height: 2, backgroundColor: '#8C1007', width: 48 },
  card: {
    backgroundColor: '#fff', borderRadius: 4, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#3E0703', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  rank: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0C4',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
    borderWidth: 1, borderColor: '#8C1007',
  },
  rankFirst: { backgroundColor: '#3E0703', borderColor: '#3E0703' },
  rankText: { fontSize: 14, fontWeight: '700', color: '#8C1007' },
  rankTextFirst: { color: '#FFF0C4' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: 'Georgia', color: '#3E0703', fontWeight: '700', marginBottom: 2 },
  cardEmail: { fontSize: 11, color: '#7a5c5a' },
  pointsBadge: { alignItems: 'flex-end' },
  pointsValue: { fontSize: 20, fontFamily: 'Georgia', color: '#3E0703', fontWeight: '700' },
  pointsLabel: { fontSize: 9, letterSpacing: 2, color: '#8C1007', fontWeight: '700' },
})