import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Check,
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  User,
  Stethoscope,
  HeartPulse,
  Users,
  MoreHorizontal,
  Bell,
  Plus,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Colors from '@/constants/colors';
import { useAppointments } from '@/providers/AppointmentProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  AppointmentType,
  AppointmentLocation,
  APPOINTMENT_TYPE_COLORS,
} from '@/types/appointment';

const APPOINTMENT_TYPES: { value: AppointmentType; label: string; icon: any }[] = [
  { value: 'therapist', label: 'Therapy', icon: User },
  { value: 'psychiatrist', label: 'Psychiatrist', icon: Stethoscope },
  { value: 'doctor', label: 'Doctor', icon: HeartPulse },
  { value: 'group', label: 'Group', icon: Users },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

const LOCATION_TYPES: { value: AppointmentLocation; label: string; icon: any }[] = [
  { value: 'in_person', label: 'In Person', icon: MapPin },
  { value: 'telehealth', label: 'Telehealth', icon: Video },
  { value: 'phone', label: 'Phone', icon: Phone },
];

const REMINDER_OPTIONS = [
  { value: 15, label: '15 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
];

const TIME_PRESETS = ['8:00 AM', '9:00 AM', '10:00 AM', '12:00 PM', '2:30 PM', '5:00 PM', '7:00 PM'];

function formatAppointmentInputTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatAppointmentInputDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseAppointmentInputTime(value: string): { hours: number; minutes: number } | null {
  const trimmed = value.trim().toUpperCase().replace(/\s+/g, ' ');
  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (!match) return null;

  const hourInput = Number(match[1]);
  const minuteInput = Number(match[2] ?? '0');
  const meridiem = match[3];

  if (!Number.isInteger(hourInput) || !Number.isInteger(minuteInput)) return null;
  if (hourInput < 1 || hourInput > 12 || minuteInput < 0 || minuteInput > 59) return null;

  let hours = hourInput % 12;
  if (meridiem === 'PM') hours += 12;
  return { hours, minutes: minuteInput };
}

export default function AppointmentAddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string }>();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const appointmentContext = useAppointments();
  const addAppointment = appointmentContext?.addAppointment ?? (async () => {
    throw new Error('Appointment tracking is still loading. Please try again.');
  });
  const updateAppointment = appointmentContext?.updateAppointment ?? (async () => null);
  const getAppointmentById = appointmentContext?.getAppointmentById ?? (() => null);
  const isAdding = appointmentContext?.isAdding ?? false;

  const existingAppt = params.editId ? getAppointmentById(params.editId) : null;
  const isEditing = !!existingAppt;

  const [providerName, setProviderName] = useState<string>(existingAppt?.providerName ?? '');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(existingAppt?.appointmentType ?? 'therapist');
  const [locationType, setLocationType] = useState<AppointmentLocation>(existingAppt?.locationType ?? 'in_person');
  const [locationDetail, setLocationDetail] = useState<string>(existingAppt?.locationDetail ?? '');
  const [notes, setNotes] = useState<string>(existingAppt?.notes ?? '');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(existingAppt?.reminderEnabled ?? true);
  const [reminderMinutes, setReminderMinutes] = useState<number>(existingAppt?.reminderMinutesBefore ?? 60);
  const [topics, setTopics] = useState<string[]>(existingAppt?.topicsToDiscuss ?? []);
  const [newTopic, setNewTopic] = useState<string>('');
  const [duration, setDuration] = useState<number>(existingAppt?.duration ?? 50);
  const defaultDate = existingAppt ? new Date(existingAppt.dateTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [appointmentDate, setAppointmentDate] = useState<Date>(defaultDate);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: isEditing ? 'appointment_edit' : 'appointment_add' });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, trackEvent, isEditing]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleAddTopic = useCallback(() => {
    const trimmed = newTopic.trim();
    if (trimmed) {
      setTopics(prev => [...prev, trimmed]);
      setNewTopic('');
    }
  }, [newTopic]);

  const handleRemoveTopic = useCallback((index: number) => {
    setTopics(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    setAppointmentDate((current) => {
      const next = new Date(current);
      next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      return next;
    });
  }, []);

  const handleTimeChange = useCallback((event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed' || !selectedTime) return;
    setAppointmentDate((current) => {
      const next = new Date(current);
      next.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      return next;
    });
  }, []);

  const applyTimePreset = useCallback((preset: string) => {
    const parsed = parseAppointmentInputTime(preset);
    if (!parsed) return;
    setAppointmentDate((current) => {
      const next = new Date(current);
      next.setHours(parsed.hours, parsed.minutes, 0, 0);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!providerName.trim()) {
      Alert.alert('Missing info', 'Please enter a provider name.');
      return;
    }

    const dateTime = appointmentDate.getTime();

    if (isNaN(dateTime)) {
      Alert.alert('Invalid date', 'Please choose a valid date and time.');
      return;
    }

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      if (isEditing && existingAppt) {
        await updateAppointment(existingAppt.id, {
          providerName: providerName.trim(),
          appointmentType,
          dateTime,
          duration,
          locationType,
          locationDetail: locationDetail.trim(),
          reminderEnabled,
          reminderMinutesBefore: reminderMinutes,
          notes: notes.trim(),
          topicsToDiscuss: topics,
        });
        trackEvent('appointment_edited', { type: appointmentType });
      } else {
        await addAppointment({
          providerName: providerName.trim(),
          appointmentType,
          dateTime,
          duration,
          locationType,
          locationDetail: locationDetail.trim(),
          reminderEnabled,
          reminderMinutesBefore: reminderMinutes,
          notes: notes.trim(),
          topicsToDiscuss: topics,
        });
        trackEvent('appointment_added', { type: appointmentType });
      }
      router.back();
    } catch (error) {
      console.log('[AppointmentAdd] Error saving:', error);
      Alert.alert('Error', 'Could not save appointment. Please try again.');
    }
  }, [
    providerName, appointmentType, appointmentDate, duration,
    locationType, locationDetail, reminderEnabled, reminderMinutes,
    notes, topics, isEditing, existingAppt, addAppointment,
    updateAppointment, trackEvent, router,
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{isEditing ? 'Edit Appointment' : 'New Appointment'}</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, isAdding && styles.saveBtnDisabled]}
          disabled={isAdding}
        >
          <Check size={18} color={Colors.white} />
          <Text style={styles.saveBtnText}>{isAdding ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Appointment Title</Text>
            <TextInput
                style={styles.textInput}
                value={providerName}
                onChangeText={setProviderName}
                placeholder="Therapy with Dr. Smith, Psychiatry follow-up..."
                placeholderTextColor={Colors.textMuted}
                testID="provider-name-input"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Appointment Type</Text>
              <View style={styles.typeGrid}>
                {APPOINTMENT_TYPES.map(({ value, label, icon: Icon }) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.typeChip,
                      appointmentType === value && {
                        backgroundColor: APPOINTMENT_TYPE_COLORS[value] + '18',
                        borderColor: APPOINTMENT_TYPE_COLORS[value],
                      },
                    ]}
                    onPress={() => setAppointmentType(value)}
                    activeOpacity={0.7}
                  >
                    <Icon size={16} color={appointmentType === value ? APPOINTMENT_TYPE_COLORS[value] : Colors.textMuted} />
                    <Text style={[
                      styles.typeChipText,
                      appointmentType === value && { color: APPOINTMENT_TYPE_COLORS[value] },
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => {
                  setShowDatePicker((visible) => !visible);
                  setShowTimePicker(false);
                }}
                activeOpacity={0.75}
                testID="appointment-date-picker-button"
                accessibilityRole="button"
                accessibilityLabel={`Choose appointment date, currently ${formatAppointmentInputDate(appointmentDate)}`}
              >
                <View style={styles.pickerIcon}>
                  <Calendar size={18} color={Colors.primary} />
                </View>
                <View style={styles.pickerTextBlock}>
                  <Text style={styles.pickerValue}>{formatAppointmentInputDate(appointmentDate)}</Text>
                  <Text style={styles.pickerHint}>Tap to choose from calendar</Text>
                </View>
              </TouchableOpacity>
              {showDatePicker && (
                <View style={styles.nativePickerWrap}>
                  <DateTimePicker
                    value={appointmentDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date(2000, 0, 1)}
                    themeVariant="light"
                    textColor={Colors.text}
                    accentColor={Colors.primary}
                    testID="appointment-date-picker"
                  />
                </View>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Time</Text>
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => {
                  setShowTimePicker((visible) => !visible);
                  setShowDatePicker(false);
                }}
                activeOpacity={0.75}
                testID="appointment-time-picker-button"
                accessibilityRole="button"
                accessibilityLabel={`Choose appointment time, currently ${formatAppointmentInputTime(appointmentDate)}`}
              >
                <View style={styles.pickerIcon}>
                  <Clock size={18} color={Colors.primary} />
                </View>
                <View style={styles.pickerTextBlock}>
                  <Text style={styles.pickerValue}>{formatAppointmentInputTime(appointmentDate)}</Text>
                  <Text style={styles.pickerHint}>Tap to choose time</Text>
                </View>
              </TouchableOpacity>
              {showTimePicker && (
                <View style={styles.nativePickerWrap}>
                  <DateTimePicker
                    value={appointmentDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                    minuteInterval={5}
                    themeVariant="light"
                    textColor={Colors.text}
                    accentColor={Colors.primary}
                    testID="appointment-time-picker"
                  />
                </View>
              )}
              <View style={styles.timePresetRow}>
                {TIME_PRESETS.map((preset) => {
                  const selected = formatAppointmentInputTime(appointmentDate) === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[styles.timePresetChip, selected && styles.timePresetChipActive]}
                      onPress={() => applyTimePreset(preset)}
                      activeOpacity={0.75}
                      testID={`appointment-time-${preset.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                    >
                      <Text style={[styles.timePresetText, selected && styles.timePresetTextActive]}>{preset}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Duration (minutes)</Text>
              <View style={styles.durationRow}>
                {[30, 45, 50, 60, 90].map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.durationChip, duration === d && styles.durationChipActive]}
                    onPress={() => setDuration(d)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.durationChipText, duration === d && styles.durationChipTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Location</Text>
              <View style={styles.locationRow}>
                {LOCATION_TYPES.map(({ value, label, icon: Icon }) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.locationChip, locationType === value && styles.locationChipActive]}
                    onPress={() => setLocationType(value)}
                    activeOpacity={0.7}
                  >
                    <Icon size={16} color={locationType === value ? Colors.primary : Colors.textMuted} />
                    <Text style={[styles.locationChipText, locationType === value && styles.locationChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.textInput, { marginTop: 10 }]}
                value={locationDetail}
                onChangeText={setLocationDetail}
                placeholder={locationType === 'telehealth' ? 'Meeting link or platform' : locationType === 'phone' ? 'Phone number' : 'Address or office name'}
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Reminder</Text>
              <TouchableOpacity
                style={styles.reminderToggle}
                onPress={() => setReminderEnabled(!reminderEnabled)}
                activeOpacity={0.7}
              >
                <Bell size={16} color={reminderEnabled ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.reminderToggleText, reminderEnabled && { color: Colors.text }]}>
                  {reminderEnabled ? 'Reminder enabled' : 'No reminder'}
                </Text>
                <View style={[styles.toggle, reminderEnabled && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, reminderEnabled && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
              {reminderEnabled && (
                <View style={styles.reminderOptions}>
                  {REMINDER_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.reminderChip, reminderMinutes === opt.value && styles.reminderChipActive]}
                      onPress={() => setReminderMinutes(opt.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.reminderChipText, reminderMinutes === opt.value && styles.reminderChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Topics to Discuss</Text>
              {topics.map((topic, idx) => (
                <View key={idx} style={styles.topicRow}>
                  <Text style={styles.topicText}>{topic}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTopic(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Trash2 size={14} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.addTopicRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                  value={newTopic}
                  onChangeText={setNewTopic}
                  placeholder="Add a topic…"
                  placeholderTextColor={Colors.textMuted}
                  onSubmitEditing={handleAddTopic}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[styles.addTopicBtn, !newTopic.trim() && { opacity: 0.4 }]}
                  onPress={handleAddTopic}
                  disabled={!newTopic.trim()}
                >
                  <Plus size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional notes…"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </Animated.View>
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
  keyboardAvoid: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  topTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  fieldHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    fontWeight: '500' as const,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  pickerIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTextBlock: {
    flex: 1,
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  pickerHint: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  nativePickerWrap: {
    marginTop: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  timePresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  timePresetChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timePresetChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  timePresetText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  timePresetTextActive: {
    color: Colors.primary,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locationChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  locationChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  locationChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  locationChipTextActive: {
    color: Colors.primaryDark,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  durationChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  durationChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  durationChipTextActive: {
    color: Colors.primaryDark,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reminderToggleText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  reminderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  reminderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  reminderChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  reminderChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  reminderChipTextActive: {
    color: Colors.primaryDark,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  topicText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  addTopicRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addTopicBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
