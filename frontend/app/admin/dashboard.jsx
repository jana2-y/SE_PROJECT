import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ImageBackground } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import AdminTabBar from '../../components/admin/AdminTabBar'

const cards = [
  {
    title: 'Manage Accounts',
    subtitle: 'View, activate or deactivate FM & Worker accounts',
    route: '/admin/users',
    tag: 'USER MANAGEMENT',
  },
  {
    title: 'Verification Requests',
    subtitle: 'Approve or decline pending FM & Worker signups',
    route: '/admin/requests',
    tag: 'PENDING REVIEW',
  },
  {
    title: 'Leaderboard',
    subtitle: 'Top community members ranked by points',
    route: '/admin/leaderboard',
    tag: 'ENGAGEMENT',
  },
  {
    title: 'Rewards',
    subtitle: 'Create and manage rewards for community members',
    route: '/admin/rewards',
    tag: 'GAMIFICATION',
  },
]

export default function AdminDashboard() {
  const router = useRouter()
  const { theme, colors } = useTheme()

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
        <View style={[styles.blob, styles.blob3, { backgroundColor: colors.primary }]} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={[styles.heroLabel, { color: colors.primary }]}>ADMINISTRATION PORTAL</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Dashboard</Text>
          <View style={[styles.divider, { backgroundColor: colors.primary }]} />
        </View>

        {cards.map((card, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
            onPress={() => router.push(card.route)}
            activeOpacity={0.85}
          >
            <Text style={[styles.cardTag, { color: colors.primary }]}>{card.tag}</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{card.title}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSub }]}>{card.subtitle}</Text>
            <View style={[styles.cardArrow, { backgroundColor: colors.pillBg }]}>
              <Text style={[styles.cardArrowText, { color: colors.primary }]}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <AdminTabBar />
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', height: '100%' },
  container: { padding: 24, paddingBottom: 48 },
  hero: { marginBottom: 32 },
  heroLabel: { fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 8 },
  heroTitle: { fontSize: 36, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 16 },
  divider: { height: 2, width: 48 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.08, zIndex: -1 },
  blob1: { top: -100, right: -100 },
  blob2: { bottom: -150, left: -100 },
  blob3: { top: '30%', left: -200 },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTag: { fontSize: 9, letterSpacing: 2.5, fontWeight: '700', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 6 },
  cardSubtitle: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  cardArrow: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardArrowText: { fontSize: 16, fontWeight: '700' },
})