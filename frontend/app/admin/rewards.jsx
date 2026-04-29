import React, { useState, useEffect } from 'react'
import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
  StatusBar, TouchableOpacity, Alert, Modal, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ImageBackground
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import AdminTabBar from '../../components/admin/AdminTabBar'

const EMPTY_FORM = {
  name: '',
  description: '',
  discount_percentage: '',
  points_required: '',
  duration_date: '',
}

export default function AdminRewards() {
  const { user } = useAuth()
  const { theme, colors } = useTheme()
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchRewards = async () => {
    setLoading(true)
    try {
      const data = await api.getRewards()
      setRewards(data)
    } catch (e) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRewards() }, [])

  const handleCreate = async () => {
    if (!form.name || !form.discount_percentage || !form.points_required || !form.duration_date) {
      Alert.alert('Missing Fields', 'Please fill out all required fields.')
      return
    }
    setSubmitting(true)
    try {
      await api.createReward({
        ...form,
        discount_percentage: parseInt(form.discount_percentage),
        points_required: parseInt(form.points_required),
        duration_date: new Date(form.duration_date).toISOString(),
      })
      setModalVisible(false)
      setForm(EMPTY_FORM)
      fetchRewards()
    } catch (e) {
      Alert.alert('Error', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id) => {
    Alert.alert('Delete Reward', 'Are you sure you want to delete this reward?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteReward(id)
            fetchRewards()
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
        <View style={[styles.blob, styles.blob3, { backgroundColor: colors.primary }]} />
      </View>

      {/* Create Reward Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.primary }]} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Reward</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSub }]}>Fill in the details for the new reward</Text>

              <Text style={[styles.inputLabel, { color: colors.primary }]}>REWARD NAME <Text style={{ color: colors.error }}>*</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
                placeholder='e.g. "10% off boosters for finals week"'
                placeholderTextColor={colors.textFaint}
                value={form.name}
                onChangeText={(v) => setForm(p => ({ ...p, name: v }))}
              />

              <Text style={[styles.inputLabel, { color: colors.primary }]}>DESCRIPTION <Text style={{ color: colors.textFaint, fontWeight: '400' }}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
                placeholder="Any conditions or details..."
                placeholderTextColor={colors.textFaint}
                multiline
                numberOfLines={3}
                value={form.description}
                onChangeText={(v) => setForm(p => ({ ...p, description: v }))}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.primary }]}>DISCOUNT % <Text style={{ color: colors.error }}>*</Text></Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
                    placeholder="e.g. 10"
                    placeholderTextColor={colors.textFaint}
                    keyboardType="numeric"
                    value={form.discount_percentage}
                    onChangeText={(v) => setForm(p => ({ ...p, discount_percentage: v }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.primary }]}>POINTS <Text style={{ color: colors.error }}>*</Text></Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
                    placeholder="e.g. 100"
                    placeholderTextColor={colors.textFaint}
                    keyboardType="numeric"
                    value={form.points_required}
                    onChangeText={(v) => setForm(p => ({ ...p, points_required: v }))}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.primary }]}>EXPIRY DATE <Text style={{ color: colors.error }}>*</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textFaint}
                value={form.duration_date}
                onChangeText={(v) => setForm(p => ({ ...p, duration_date: v }))}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.primary }]}
                  onPress={() => { setModalVisible(false); setForm(EMPTY_FORM) }}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                  onPress={handleCreate}
                  disabled={submitting}
                >
                  <Text style={[styles.submitBtnText, { color: colors.primaryBtnText }]}>
                    {submitting ? 'Creating...' : 'Create Reward'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rewards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Text style={[styles.heroLabel, { color: colors.primary }]}>GAMIFICATION</Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Rewards</Text>
              <View style={[styles.divider, { backgroundColor: colors.primary }]} />
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary }]}
                onPress={() => setModalVisible(true)}
              >
                <Text style={[styles.createBtnText, { color: colors.primaryBtnText }]}>+ Create Reward</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyLabel, { color: colors.primary }]}>NO REWARDS</Text>
              <Text style={[styles.emptyText, { color: colors.textSub }]}>Create your first reward above</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <View style={styles.cardTop}>
                <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.discountText, { color: colors.primaryBtnText }]}>{item.discount_percentage}% OFF</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={[styles.deleteText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
              {item.description && (
                <Text style={[styles.cardDesc, { color: colors.textSub }]}>{item.description}</Text>
              )}
              <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
                <View style={styles.footerItem}>
                  <Text style={[styles.footerLabel, { color: colors.primary }]}>POINTS REQUIRED</Text>
                  <Text style={[styles.footerValue, { color: colors.text }]}>{item.points_required}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Text style={[styles.footerLabel, { color: colors.primary }]}>EXPIRES</Text>
                  <Text style={[styles.footerValue, { color: colors.text }]}>
                    {new Date(item.duration_date).toLocaleDateString()}
                  </Text>
                </View>
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
  list: { padding: 24, paddingBottom: 100 },
  hero: { marginBottom: 24 },
  heroLabel: { fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 8 },
  heroTitle: { fontSize: 32, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 12 },
  divider: { height: 2, width: 48, marginBottom: 20 },
  createBtn: { paddingVertical: 14, borderRadius: 24, alignItems: 'center', elevation: 4 },
  createBtnText: { fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyLabel: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  emptyText: { fontSize: 14 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.08, zIndex: -1 },
  blob1: { top: -100, right: -100 },
  blob3: { top: '30%', left: -200 },
  card: {
    borderRadius: 24, padding: 20, marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  discountBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  discountText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  deleteText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  cardName: { fontSize: 17, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  cardFooter: {
    flexDirection: 'row', gap: 24, marginTop: 8,
    borderTopWidth: 1, paddingTop: 12,
  },
  footerItem: { gap: 4 },
  footerLabel: { fontSize: 9, letterSpacing: 2, fontWeight: '700' },
  footerValue: { fontSize: 14, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, maxHeight: '90%', borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
  },
  modalHandle: {
    width: 40, height: 4,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 24, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, marginBottom: 24 },
  inputLabel: { fontSize: 9, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  input: {
    borderRadius: 12, padding: 14,
    fontSize: 14, marginBottom: 20,
    borderWidth: 1,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 20,
    borderWidth: 1, alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '700', fontSize: 13 },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: 20, alignItems: 'center' },
  submitBtnText: { fontWeight: '700', fontSize: 13 },
})