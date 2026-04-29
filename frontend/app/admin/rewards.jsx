import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
  StatusBar, TouchableOpacity, Alert, Modal, TextInput,
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminTabBar from '../../components/admin/AdminTabBar'

const EMPTY_FORM = {
  name: '',
  description: '',
  discount_percentage: '',
  points_required: '',
  duration_date: '',
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF0C4' },
  list: { padding: 24, paddingBottom: 100 },
  hero: { marginBottom: 24 },
  heroLabel: { fontSize: 10, letterSpacing: 3, color: '#8C1007', fontWeight: '700', marginBottom: 8 },
  heroTitle: { fontSize: 32, fontFamily: 'Georgia', color: '#3E0703', fontWeight: '700', marginBottom: 12 },
  divider: { height: 2, backgroundColor: '#8C1007', width: 48, marginBottom: 20 },
  createBtn: { backgroundColor: '#3E0703', paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
  createBtnText: { color: '#FFF0C4', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyLabel: { fontSize: 10, letterSpacing: 3, color: '#8C1007', fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#7a5c5a' },
  card: {
    backgroundColor: '#fff', borderRadius: 4, padding: 20, marginBottom: 12,
    shadowColor: '#3E0703', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  discountBadge: { backgroundColor: '#3E0703', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2 },
  discountText: { color: '#FFF0C4', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  deleteText: { fontSize: 12, color: '#660B05', fontWeight: '700', letterSpacing: 0.5 },
  cardName: { fontSize: 17, fontFamily: 'Georgia', color: '#3E0703', fontWeight: '700', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#7a5c5a', lineHeight: 20, marginBottom: 12 },
  cardFooter: {
    flexDirection: 'row', gap: 24, marginTop: 8,
    borderTopWidth: 1, borderTopColor: '#f0e0c0', paddingTop: 12,
  },
  footerItem: { gap: 4 },
  footerLabel: { fontSize: 9, letterSpacing: 2, color: '#8C1007', fontWeight: '700' },
  footerValue: { fontSize: 14, color: '#3E0703', fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: '#FFF0C4', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 24, maxHeight: '90%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#8C1007',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 24, fontFamily: 'Georgia', color: '#3E0703', fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#7a5c5a', marginBottom: 24 },
  inputLabel: { fontSize: 9, letterSpacing: 2, color: '#8C1007', fontWeight: '700', marginBottom: 8 },
  required: { color: '#660B05' },
  optional: { color: '#b0937f', fontWeight: '400', letterSpacing: 0 },
  input: {
    backgroundColor: '#fff', borderRadius: 4, padding: 14,
    fontSize: 14, color: '#3E0703', marginBottom: 20,
    borderWidth: 1, borderColor: '#e8d5b0',
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 2,
    borderWidth: 1, borderColor: '#8C1007', alignItems: 'center',
  },
  cancelBtnText: { color: '#8C1007', fontWeight: '700', fontSize: 13 },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: 2, backgroundColor: '#3E0703', alignItems: 'center' },
  submitBtnText: { color: '#FFF0C4', fontWeight: '700', fontSize: 13 },
})

export default function AdminRewards() {
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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#3E0703" />

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
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>New Reward</Text>
              <Text style={styles.modalSubtitle}>Fill in the details for the new reward</Text>

              <Text style={styles.inputLabel}>REWARD NAME <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder='e.g. "10% off boosters for finals week"'
                placeholderTextColor="#b0937f"
                value={form.name}
                onChangeText={(v) => setForm(p => ({ ...p, name: v }))}
              />

              <Text style={styles.inputLabel}>DESCRIPTION <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any conditions or details..."
                placeholderTextColor="#b0937f"
                multiline
                numberOfLines={3}
                value={form.description}
                onChangeText={(v) => setForm(p => ({ ...p, description: v }))}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>DISCOUNT % <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 10"
                    placeholderTextColor="#b0937f"
                    keyboardType="numeric"
                    value={form.discount_percentage}
                    onChangeText={(v) => setForm(p => ({ ...p, discount_percentage: v }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>POINTS <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 100"
                    placeholderTextColor="#b0937f"
                    keyboardType="numeric"
                    value={form.points_required}
                    onChangeText={(v) => setForm(p => ({ ...p, points_required: v }))}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>EXPIRY DATE <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#b0937f"
                value={form.duration_date}
                onChangeText={(v) => setForm(p => ({ ...p, duration_date: v }))}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setModalVisible(false); setForm(EMPTY_FORM) }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleCreate}
                  disabled={submitting}
                >
                  <Text style={styles.submitBtnText}>
                    {submitting ? 'Creating...' : 'Create Reward'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {loading ? (
        <ActivityIndicator size="large" color="#8C1007" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={rewards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>GAMIFICATION</Text>
              <Text style={styles.heroTitle}>Rewards</Text>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.createBtnText}>+ Create Reward</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyLabel}>NO REWARDS</Text>
              <Text style={styles.emptyText}>Create your first reward above</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{item.discount_percentage}% OFF</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.cardDesc}>{item.description}</Text>
              )}
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>POINTS REQUIRED</Text>
                  <Text style={styles.footerValue}>{item.points_required}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>EXPIRES</Text>
                  <Text style={styles.footerValue}>
                    {new Date(item.duration_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
      <AdminTabBar />
    </View>
  )
}