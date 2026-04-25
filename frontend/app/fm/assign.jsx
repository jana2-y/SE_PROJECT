import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const AssignTicket = () => {
    const { ticketId } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { colors: c } = useTheme();
    const styles = useMemo(() => makeStyles(c), [c]);

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
        if (!selectedWorker) {
            Alert.alert(t('selectWorkerTitle'), t('selectWorkerMsg'));
            return;
        }
        if (deadline <= new Date()) {
            Alert.alert(t('invalidDeadlineTitle'), t('invalidDeadlineMsg'));
            return;
        }

        setSubmitting(true);
        try {
            await api.patch(`/fm/tickets/${ticketId}/assign`, {
                worker_id: selectedWorker.id,
                deadline: deadline.toISOString(),
                priority,
            });
            router.replace('/fm/dashboard');
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

                <Text style={styles.dateLabel}>{t('assignDate')}: {today}</Text>

                {/* Set Deadline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('setDeadline')}</Text>
                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            value={deadline.toISOString().split('T')[0]}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => e.target.value && setDeadline(new Date(e.target.value))}
                            style={{
                                padding: 12, borderRadius: 4, border: '1px solid #9CA3AF',
                                backgroundColor: c.inputBg, color: c.text, fontSize: 14,
                                width: '100%', boxSizing: 'border-box', cursor: 'pointer',
                            }}
                        />
                    ) : (
                        <>
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
                        </>
                    )}
                </View>

                {/* Priority */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('priority')}</Text>
                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={priority} onValueChange={setPriority} style={styles.picker} dropdownIconColor={c.text}>
                            <Picker.Item label={t('low')} value="low" color={c.text} style={styles.pickerItem} />
                            <Picker.Item label={t('medium')} value="medium" color={c.text} style={styles.pickerItem} />
                            <Picker.Item label={t('high')} value="high" color={c.text} style={styles.pickerItem} />
                            <Picker.Item label={t('critical')} value="critical" color={c.text} style={styles.pickerItem} />
                        </Picker>
                    </View>
                </View>

                {/* Assign Worker */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('assignWorker')}</Text>

                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('searchByName')}
                        placeholderTextColor={c.textSub}
                        value={search}
                        onChangeText={setSearch}
                    />

                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={specialtyFilter} onValueChange={setSpecialtyFilter} style={styles.picker} dropdownIconColor={c.text}>
                            <Picker.Item label={t('allSpecialties')}  value=""                          color={c.text} style={styles.pickerItem} />
                            <Picker.Item label={t('electricalTech')}  value="Electrical Technician"     color={c.text} style={styles.pickerItem} />
                            <Picker.Item label={t('plumber')}         value="Plumber"                   color={c.text} style={styles.pickerItem} />
                            <Picker.Item label={t('hvacTech')}        value="HVAC Technician"           color={c.text} style={styles.pickerItem} />
                            <Picker.Item label={t('cleaner')}         value="Cleaner/ Housekeeping Staff" color={c.text} style={styles.pickerItem} />
                            <Picker.Item label={t('itSupport')}       value="IT Support"                color={c.text} style={styles.pickerItem} />
                            <Picker.Item label={t('facilitiesTech')}  value="Facilities Technician"     color={c.text} style={styles.pickerItem} />
                            <Picker.Item label={t('groundskeeper')}   value="Groundskeeper"             color={c.text} style={styles.pickerItem} />
                        </Picker>
                    </View>

                    <ScrollView style={styles.workerList} nestedScrollEnabled showsVerticalScrollIndicator persistentScrollbar>
                        {filteredWorkers.length === 0 ? (
                            <Text style={styles.noWorkers}>{t('noWorkers')}</Text>
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
                                                {worker.specialty || t('general')}{worker.years_experience ? ` · ${worker.years_experience}y exp` : ''}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <Text style={styles.checkmark}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.assignBtn, submitting && styles.assignBtnDisabled]}
                    onPress={handleAssign}
                    disabled={submitting}
                >
                    {submitting
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.assignBtnText}>{t('assignTicketBtn')}</Text>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );
};

const makeStyles = (c) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
    scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    dateLabel: { fontSize: 12, fontWeight: '600', color: c.textMid, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 20 },
    section: { backgroundColor: c.surface, borderRadius: 8, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: c.text, marginBottom: 12 },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: c.border, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: c.inputBg },
    dateInputText: { fontSize: 14, color: c.text },
    dateInputIcon: { fontSize: 16 },
    pickerWrap: { borderRadius: 4, backgroundColor: c.inputBg, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#162948' },
    picker: { height: 44, color: c.text, backgroundColor: c.surface },
    pickerItem: { backgroundColor: c.surface, color: c.text },
    searchInput: { borderWidth: 1, borderColor: c.border, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: c.text, backgroundColor: c.inputBg, marginBottom: 8 },
    workerList: { borderWidth: 1, borderColor: c.border, borderRadius: 4, overflow: 'hidden', maxHeight: 320 },
    workerRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: c.border, backgroundColor: c.surface },
    workerRowSelected: { backgroundColor: c.workerSelected },
    workerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.avatarBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    workerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    workerInfo: { flex: 1 },
    workerName: { fontSize: 14, fontWeight: '600', color: c.text },
    workerNameSelected: { color: c.workerSelectedTx },
    workerSpecialty: { fontSize: 12, color: c.textSub, marginTop: 2 },
    checkmark: { fontSize: 18, color: c.primary, fontWeight: '700' },
    noWorkers: { padding: 16, color: c.textSub, textAlign: 'center' },
    footer: { padding: 16, backgroundColor: c.footerBg, borderTopWidth: 1, borderColor: c.border },
    assignBtn: { backgroundColor: c.btnBg, paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
    assignBtnDisabled: { opacity: 0.6 },
    assignBtnText: { color: c.btnText, fontWeight: '700', fontSize: 16 },
});

export default AssignTicket;
