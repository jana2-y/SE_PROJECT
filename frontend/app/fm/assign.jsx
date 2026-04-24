import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AssignTicket = () => {
    const { ticketId } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const [workers, setWorkers] = useState([]);
    const [filteredWorkers, setFilteredWorkers] = useState([]);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [search, setSearch] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const [deadline, setDeadline] = useState(tomorrow);
    const [showPicker, setShowPicker] = useState(false);
    const [priority, setPriority] = useState('medium');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const today = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    useEffect(() => {
        const fetchWorkers = async () => {
            try {
                const data = await api.get('/fm/workers', user.token);
                setWorkers(data);
                setFilteredWorkers(data);
            } catch (err) {
                Alert.alert('Error', err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkers();
    }, []);

    useEffect(() => {
        let result = workers;
        if (search.trim()) {
            result = result.filter(w =>
                w.full_name.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (specialtyFilter) {
            result = result.filter(w => w.specialty === specialtyFilter);
        }
        setFilteredWorkers(result);
    }, [search, specialtyFilter, workers]);

    const specialties = [...new Set(workers.map(w => w.specialty).filter(Boolean))];

    const handleAssign = async () => {
        console.log('handleAssign fired');
        console.log('selectedWorker:', selectedWorker);
        console.log('deadline:', deadline);
        console.log('ticketId:', ticketId);
        if (!selectedWorker) {
            Alert.alert('Select a worker', 'Please select a worker before assigning.');
            return;
        }
        if (deadline <= new Date()) {
            Alert.alert('Invalid deadline', 'Deadline must be in the future.');
            return;
        }

        setSubmitting(true);
        try {
            console.log('calling api...');
            await api.patch(`/fm/tickets/${ticketId}/assign`, {
                worker_id: selectedWorker.id,
                deadline: deadline.toISOString(),
                priority,
            });
            router.replace('/fm/dashboard');
        } catch (err) {
            console.log('api error:', err.message);
            Alert.alert('Error', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0078D4" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* Assign date */}
                <Text style={styles.dateLabel}>Assign date: {today}</Text>

                {/* Set Deadline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Set Deadline</Text>
                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)}>
                        <Text style={styles.dateInputText}>
                            {deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                        <Text style={styles.dateInputIcon}>📅</Text>
                    </TouchableOpacity>
                    {showPicker && (
                        <DateTimePicker
                            value={deadline}
                            mode="date"
                            minimumDate={new Date()}
                            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                            onChange={(event, selected) => {
                                setShowPicker(Platform.OS === 'ios');
                                if (selected) setDeadline(selected);
                            }}
                        />
                    )}
                </View>

                {/* Priority */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Priority</Text>
                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={priority} onValueChange={setPriority} style={styles.picker}>
                            <Picker.Item label="Low" value="low" />
                            <Picker.Item label="Medium" value="medium" />
                            <Picker.Item label="High" value="high" />
                            <Picker.Item label="Critical" value="critical" />
                        </Picker>
                    </View>
                </View>

                {/* Assign Worker */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Assign Worker</Text>

                    {/* Search */}
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name..."
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                    />

                    {/* Specialty filter */}
                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={specialtyFilter} onValueChange={setSpecialtyFilter} style={styles.picker}>
                            <Picker.Item label="All specialties" value="" />
                            {specialties.map(s => (
                                <Picker.Item key={s} label={s} value={s} />
                            ))}
                        </Picker>
                    </View>

                    {/* Worker list */}
                    <View style={styles.workerList}>
                        {filteredWorkers.length === 0 ? (
                            <Text style={styles.noWorkers}>No workers found.</Text>
                        ) : (
                            filteredWorkers.map(worker => {
                                const isSelected = selectedWorker?.id === worker.id;
                                return (
                                    <TouchableOpacity
                                        key={worker.id}
                                        style={[styles.workerRow, isSelected && styles.workerRowSelected]}
                                        onPress={() => setSelectedWorker(worker)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.workerAvatar}>
                                            <Text style={styles.workerAvatarText}>
                                                {worker.full_name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.workerInfo}>
                                            <Text style={[styles.workerName, isSelected && styles.workerNameSelected]}>
                                                {worker.full_name}
                                            </Text>
                                            <Text style={styles.workerSpecialty}>
                                                {worker.specialty || 'General'}{worker.years_experience ? ` · ${worker.years_experience}y exp` : ''}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <Text style={styles.checkmark}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Assign button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.assignBtn, submitting && styles.assignBtnDisabled]}
                    onPress={handleAssign}
                    disabled={submitting}
                >
                    {submitting
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.assignBtnText}>Assign Ticket</Text>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F3F3' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    dateLabel: { fontSize: 12, fontWeight: '600', color: '#404752', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 20 },
    section: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', padding: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#181C22', marginBottom: 12 },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F3F3F3' },
    dateInputText: { fontSize: 14, color: '#181C22' },
    dateInputIcon: { fontSize: 16 },
    pickerWrap: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 4, backgroundColor: '#F3F3F3', marginBottom: 8 },
    picker: { height: 44 },
    searchInput: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#181C22', backgroundColor: '#F3F3F3', marginBottom: 8 },
    workerList: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 4, overflow: 'hidden', maxHeight: 320 },
    workerRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#F3F3F3', backgroundColor: '#fff' },
    workerRowSelected: { backgroundColor: '#D3E3FF' },
    workerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0078D4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    workerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    workerInfo: { flex: 1 },
    workerName: { fontSize: 14, fontWeight: '600', color: '#181C22' },
    workerNameSelected: { color: '#004883' },
    workerSpecialty: { fontSize: 12, color: '#717783', marginTop: 2 },
    checkmark: { fontSize: 18, color: '#0078D4', fontWeight: '700' },
    noWorkers: { padding: 16, color: '#717783', textAlign: 'center' },
    footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E5E5E5' },
    assignBtn: { backgroundColor: '#0078D4', paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
    assignBtnDisabled: { opacity: 0.6 },
    assignBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default AssignTicket;