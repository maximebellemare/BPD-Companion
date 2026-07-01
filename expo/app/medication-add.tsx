import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, ChevronDown, Plus, Minus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMedications } from '@/providers/MedicationProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import {
  MedicationCategory,
  MedicationDayOfWeek,
  MedicationSchedule,
  MedicationTime,
  MEDICATION_CATEGORIES,
  MEDICATION_SCHEDULES,
  MEDICATION_WEEKDAYS,
  getDefaultDaysForSchedule,
  getDefaultTimesForSchedule,
  formatTime,
} from '@/types/medication';

export default function MedicationAddScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ editId?: string }>();
  const { trackEvent } = useAnalytics();
  const medicationContext = useMedications();
  const addMedication = medicationContext?.addMedication ?? (async () => {
    throw new Error('Medication tracking is still loading. Please try again.');
  });
  const updateMedication = medicationContext?.updateMedication ?? (async () => null);
  const getMedicationById = medicationContext?.getMedicationById ?? (() => null);
  const isAddingMedication = medicationContext?.isAddingMedication ?? false;

  const editMed = params.editId ? getMedicationById(params.editId) : null;
  const isEditing = !!editMed;

  const [name, setName] = useState<string>(editMed?.name ?? '');
  const [dosage, setDosage] = useState<string>(editMed?.dosage ?? '');
  const [category, setCategory] = useState<MedicationCategory>(editMed?.category ?? 'other');
  const [schedule, setSchedule] = useState<MedicationSchedule>(editMed?.schedule ?? 'daily');
  const [times, setTimes] = useState<MedicationTime[]>(editMed?.times ?? getDefaultTimesForSchedule('daily'));
  const [daysOfWeek, setDaysOfWeek] = useState<MedicationDayOfWeek[]>(
    editMed?.daysOfWeek ?? getDefaultDaysForSchedule(editMed?.schedule ?? 'daily'),
  );
  const [purpose, setPurpose] = useState<string>(editMed?.purpose ?? '');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(editMed?.reminderEnabled ?? true);
  const [sideEffectNotes, setSideEffectNotes] = useState<string>(editMed?.sideEffectNotes ?? '');
  const [generalNotes, setGeneralNotes] = useState<string>(editMed?.generalNotes ?? '');
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState<boolean>(false);

  const handleScheduleChange = useCallback((newSchedule: MedicationSchedule) => {
    setSchedule(newSchedule);
    setTimes(getDefaultTimesForSchedule(newSchedule));
    setDaysOfWeek(getDefaultDaysForSchedule(newSchedule));
    setShowSchedulePicker(false);
  }, []);

  const adjustTimeHour = useCallback((index: number, delta: number) => {
    setTimes(prev => prev.map((t, i) => {
      if (i !== index) return t;
      let newHour = t.hour + delta;
      if (newHour < 0) newHour = 23;
      if (newHour > 23) newHour = 0;
      return { ...t, hour: newHour };
    }));
  }, []);

  const adjustTimeMinute = useCallback((index: number, delta: number) => {
    setTimes(prev => prev.map((t, i) => {
      if (i !== index) return t;
      let newMinute = t.minute + delta;
      if (newMinute < 0) newMinute = 45;
      if (newMinute > 59) newMinute = 0;
      return { ...t, minute: newMinute };
    }));
  }, []);

  const addTimeSlot = useCallback(() => {
    setTimes(prev => [...prev, { hour: 12, minute: 0, label: `Dose ${prev.length + 1}` }]);
  }, []);

  const removeTimeSlot = useCallback((index: number) => {
    setTimes(prev => prev.filter((_, i) => i !== index));
  }, []);

  const toggleDay = useCallback((day: MedicationDayOfWeek) => {
    setDaysOfWeek(prev => (
      prev.includes(day)
        ? prev.filter(value => value !== day)
        : [...prev, day].sort((a, b) => {
          const order = [1, 2, 3, 4, 5, 6, 0];
          return order.indexOf(a) - order.indexOf(b);
        })
    ));
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter the medication name.');
      return;
    }
    if (schedule !== 'as_needed' && times.length === 0) {
      Alert.alert('Time required', 'Please add at least one time for this medication.');
      return;
    }
    if ((schedule === 'weekly' || schedule === 'custom') && daysOfWeek.length === 0) {
      Alert.alert('Days required', 'Please choose at least one day for this medication.');
      return;
    }

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      if (isEditing && editMed) {
        await updateMedication(editMed.id, {
          name: name.trim(),
          dosage: dosage.trim(),
          category,
          schedule,
          times,
          daysOfWeek,
          purpose: purpose.trim(),
          reminderEnabled,
          sideEffectNotes: sideEffectNotes.trim(),
          generalNotes: generalNotes.trim(),
        });
        trackEvent('medication_edited', { category });
      } else {
        await addMedication({
          name: name.trim(),
          dosage: dosage.trim(),
          category,
          schedule,
          times,
          daysOfWeek,
          purpose: purpose.trim(),
          startDate: Date.now(),
          active: true,
          reminderEnabled,
          sideEffectNotes: sideEffectNotes.trim(),
          generalNotes: generalNotes.trim(),
        });
        trackEvent('medication_added', { category, schedule });
      }
      router.back();
    } catch (error) {
      console.log('[MedicationAdd] Error saving:', error);
      Alert.alert('Error', 'Could not save medication. Please try again.');
    }
  }, [
    name, dosage, category, schedule, times, daysOfWeek, purpose, reminderEnabled,
    sideEffectNotes, generalNotes, isEditing, editMed,
    addMedication, updateMedication, trackEvent, router,
  ]);

  const selectedCategory = MEDICATION_CATEGORIES.find(c => c.value === category);
  const selectedSchedule = MEDICATION_SCHEDULES.find(s => s.value === schedule);
  const shouldShowDayPicker = schedule === 'weekly' || schedule === 'custom';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          testID="medication-add-close"
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? 'Edit Medication' : 'Add Medication'}</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, !name.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || isAddingMedication}
          testID="medication-save"
        >
          <Check size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Medication Name</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.borderLight, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Lamotrigine, Sertraline..."
              placeholderTextColor={colors.textMuted}
              testID="medication-name-input"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Dosage</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.borderLight, color: colors.text }]}
              value={dosage}
              onChangeText={setDosage}
              placeholder="e.g. 50mg, 100mg..."
              placeholderTextColor={colors.textMuted}
              testID="medication-dosage-input"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={[styles.pickerValue, { color: colors.text }]}>{selectedCategory?.label ?? 'Select'}</Text>
              <ChevronDown size={16} color={colors.textMuted} />
            </TouchableOpacity>
            {showCategoryPicker && (
              <View style={[styles.pickerOptions, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                {MEDICATION_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.pickerOption, { borderBottomColor: colors.borderLight }, category === cat.value && { backgroundColor: colors.primaryLight }]}
                    onPress={() => {
                      setCategory(cat.value);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      { color: category === cat.value ? colors.primary : colors.text },
                      category === cat.value && styles.pickerOptionTextSelected,
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Schedule</Text>
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              onPress={() => setShowSchedulePicker(!showSchedulePicker)}
            >
              <View>
                <Text style={[styles.pickerValue, { color: colors.text }]}>{selectedSchedule?.label ?? 'Select'}</Text>
                <Text style={[styles.pickerDesc, { color: colors.textMuted }]}>{selectedSchedule?.description}</Text>
              </View>
              <ChevronDown size={16} color={colors.textMuted} />
            </TouchableOpacity>
            {showSchedulePicker && (
              <View style={[styles.pickerOptions, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                {MEDICATION_SCHEDULES.map(sch => (
                  <TouchableOpacity
                    key={sch.value}
                    style={[styles.pickerOption, { borderBottomColor: colors.borderLight }, schedule === sch.value && { backgroundColor: colors.primaryLight }]}
                    onPress={() => handleScheduleChange(sch.value)}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      { color: schedule === sch.value ? colors.primary : colors.text },
                      schedule === sch.value && styles.pickerOptionTextSelected,
                    ]}>
                      {sch.label}
                    </Text>
                    <Text style={[styles.pickerOptionDesc, { color: colors.textMuted }]}>{sch.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {shouldShowDayPicker ? (
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Days</Text>
              <View style={styles.dayGrid}>
                {MEDICATION_WEEKDAYS.map(day => {
                  const active = daysOfWeek.includes(day.value);
                  return (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.dayChip,
                        { backgroundColor: colors.card, borderColor: colors.borderLight },
                        active && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => toggleDay(day.value)}
                      activeOpacity={0.78}
                      testID={`medication-day-${day.shortLabel.toLowerCase()}`}
                    >
                      <Text style={[styles.dayChipText, { color: active ? Colors.white : colors.textSecondary }]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {schedule !== 'as_needed' && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Times</Text>
              <Text style={[styles.fieldHint, { color: colors.textMuted }]}>
                Add as many dose times as this medication needs.
              </Text>
              {times.map((time, idx) => (
                <View key={idx} style={[styles.timeRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>{time.label}</Text>
                  <View style={styles.timeAdjuster}>
                    <TouchableOpacity
                      style={[styles.timeAdjustBtn, { backgroundColor: colors.surface }]}
                      onPress={() => adjustTimeHour(idx, -1)}
                    >
                      <Minus size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={[styles.timeValue, { color: colors.text }]}>{formatTime(time.hour, time.minute)}</Text>
                    <TouchableOpacity
                      style={[styles.timeAdjustBtn, { backgroundColor: colors.surface }]}
                      onPress={() => adjustTimeHour(idx, 1)}
                    >
                      <Plus size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timeAdjuster}>
                    <TouchableOpacity
                      style={[styles.timeAdjustBtn, { backgroundColor: colors.surface }]}
                      onPress={() => adjustTimeMinute(idx, -15)}
                    >
                      <Minus size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={[styles.timeMinLabel, { color: colors.textMuted }]}>min</Text>
                    <TouchableOpacity
                      style={[styles.timeAdjustBtn, { backgroundColor: colors.surface }]}
                      onPress={() => adjustTimeMinute(idx, 15)}
                    >
                      <Plus size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {times.length > 1 && (
                    <TouchableOpacity
                      style={styles.timeRemoveBtn}
                      onPress={() => removeTimeSlot(idx)}
                    >
                      <X size={14} color={Colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={[styles.addTimeBtn, { borderColor: colors.borderLight }]} onPress={addTimeSlot}>
                <Plus size={14} color={colors.primary} />
                <Text style={[styles.addTimeBtnText, { color: colors.primary }]}>Add Time</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Purpose (optional)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.borderLight, color: colors.text }]}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="e.g. Mood stability, anxiety..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Reminders</Text>
              <Text style={[styles.switchDesc, { color: colors.textMuted }]}>Get notified when it's time</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={reminderEnabled ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Side effects to watch (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, { backgroundColor: colors.card, borderColor: colors.borderLight, color: colors.text }]}
              value={sideEffectNotes}
              onChangeText={setSideEffectNotes}
              placeholder="Any side effects you want to track..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, { backgroundColor: colors.card, borderColor: colors.borderLight, color: colors.text }]}
              value={generalNotes}
              onChangeText={setGeneralNotes}
              placeholder="Any other notes..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  fieldHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: -2,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  pickerDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pickerOptions: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  pickerOptionText: {
    fontSize: 15,
    color: Colors.text,
  },
  pickerOptionTextSelected: {
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  pickerOptionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    minWidth: 60,
  },
  timeAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeAdjustBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    minWidth: 70,
    textAlign: 'center',
  },
  timeMinLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  timeRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  addTimeBtnText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  switchDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
