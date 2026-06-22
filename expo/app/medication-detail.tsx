import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X, Edit3, Trash2, CheckCircle, XCircle, Clock, Flame,
  ChevronRight, ToggleLeft, ToggleRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMedications } from '@/providers/MedicationProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  formatTime,
  formatMedicationSchedule,
  getCategoryColor,
  MOOD_AFTER_OPTIONS,
  MoodAfter,
  MedicationTime,
  MEDICATION_CATEGORIES,
  shouldMedicationOccurOnDay,
} from '@/types/medication';

export default function MedicationDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trackEvent } = useAnalytics();
  const medicationContext = useMedications();
  const getMedicationById = medicationContext?.getMedicationById ?? (() => null);
  const getLogsForMedication = medicationContext?.getLogsForMedication ?? (() => []);
  const getAdherenceRate = medicationContext?.getAdherenceRate ?? (() => 0);
  const getStreak = medicationContext?.getStreak ?? (() => 0);
  const logMedication = medicationContext?.logMedication ?? (async () => {
    if (__DEV__) console.log('[MedicationDetail] Medication context unavailable while logging.');
  });
  const toggleActive = medicationContext?.toggleActive ?? (async () => null);
  const deleteMedication = medicationContext?.deleteMedication ?? (async () => undefined);
  const isLogging = medicationContext?.isLogging ?? false;

  const medication = id ? getMedicationById(id) : null;
  const logs = useMemo(() => id ? getLogsForMedication(id) : [], [id, getLogsForMedication]);
  const adherence7 = useMemo(() => id ? getAdherenceRate(id, 7) : 0, [id, getAdherenceRate]);
  const adherence30 = useMemo(() => id ? getAdherenceRate(id, 30) : 0, [id, getAdherenceRate]);
  const streak = useMemo(() => id ? getStreak(id) : 0, [id, getStreak]);

  const recentLogs = useMemo(() => logs.slice(0, 10), [logs]);

  const [showLogForm, setShowLogForm] = useState<boolean>(false);
  const [logMood, setLogMood] = useState<MoodAfter | null>(null);
  const [logSideEffects, setLogSideEffects] = useState<string>('');
  const [logNotes, setLogNotes] = useState<string>('');
  const [logDidHelp, setLogDidHelp] = useState<boolean | null>(null);

  const handleQuickLog = useCallback(async (status: 'taken' | 'missed', time: MedicationTime | null) => {
    if (!id) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await logMedication({
        medicationId: id,
        status,
        scheduledTime: time,
      });
      trackEvent(status === 'taken' ? 'medication_logged_taken' : 'medication_logged_missed', { medicationId: id });
    } catch (error) {
      console.log('[MedicationDetail] Error logging:', error);
    }
  }, [id, logMedication, trackEvent]);

  const handleDetailedLog = useCallback(async (time: MedicationTime | null) => {
    if (!id) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await logMedication({
        medicationId: id,
        status: 'taken',
        scheduledTime: time,
        moodAfter: logMood,
        sideEffects: logSideEffects.trim(),
        didItHelp: logDidHelp,
        notes: logNotes.trim(),
      });
      trackEvent('medication_logged_taken', { medicationId: id, hasMoodLog: !!logMood });
      if (logNotes.trim() || logSideEffects.trim()) {
        trackEvent('medication_note_added', { medicationId: id });
      }
      setShowLogForm(false);
      setLogMood(null);
      setLogSideEffects('');
      setLogNotes('');
      setLogDidHelp(null);
    } catch (error) {
      console.log('[MedicationDetail] Error detailed log:', error);
    }
  }, [id, logMedication, logMood, logSideEffects, logNotes, logDidHelp, trackEvent]);

  const handleToggleActive = useCallback(async () => {
    if (!id) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await toggleActive(id);
  }, [id, toggleActive]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert(
      'Remove medication?',
      'This will also remove all logs for this medication. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteMedication(id);
            router.back();
          },
        },
      ],
    );
  }, [id, deleteMedication, router]);

  if (!medication) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medication</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Medication not found</Text>
        </View>
      </View>
    );
  }

  const categoryLabel = MEDICATION_CATEGORIES.find(c => c.value === medication.category)?.label ?? medication.category;
  const medicationTimes = Array.isArray(medication.times) ? medication.times : [];
  const isScheduledToday = shouldMedicationOccurOnDay(medication);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{medication.name}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/medication-add?editId=${medication.id}` as any)}
        >
          <Edit3 size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(medication.category) + '20' }]}>
              <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(medication.category) }]} />
              <Text style={[styles.categoryText, { color: getCategoryColor(medication.category) }]}>{categoryLabel}</Text>
            </View>
            {!medication.active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactive</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroDosage}>{medication.dosage || 'No dosage set'}</Text>
          {medication.purpose ? (
            <Text style={styles.heroPurpose}>{medication.purpose}</Text>
          ) : null}
          <View style={styles.heroSchedule}>
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={styles.heroScheduleText}>
              {formatMedicationSchedule(medication)}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{adherence7}%</Text>
            <Text style={styles.statLabel}>7-day</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{adherence30}%</Text>
            <Text style={styles.statLabel}>30-day</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Flame size={14} color={Colors.accent} />
              <Text style={styles.statValue}>{streak}</Text>
            </View>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {medication.active && medication.schedule !== 'as_needed' && isScheduledToday && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Log</Text>
            {medicationTimes.map((time, idx) => (
              <View key={idx} style={styles.quickLogRow}>
                <Text style={styles.quickLogTime}>{time.label} · {formatTime(time.hour, time.minute)}</Text>
                <View style={styles.quickLogActions}>
                  <TouchableOpacity
                    style={styles.quickLogTaken}
                    onPress={() => handleQuickLog('taken', time)}
                    disabled={isLogging}
                  >
                    <CheckCircle size={16} color={Colors.white} />
                    <Text style={styles.quickLogBtnText}>Taken</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickLogMissed}
                    onPress={() => handleQuickLog('missed', time)}
                    disabled={isLogging}
                  >
                    <XCircle size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {medication.active && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.detailedLogToggle}
              onPress={() => setShowLogForm(!showLogForm)}
            >
              <Text style={styles.detailedLogToggleText}>
                {showLogForm ? 'Hide detailed log' : 'Log with details (mood, side effects)'}
              </Text>
              <ChevronRight
                size={16}
                color={Colors.primary}
                style={{ transform: [{ rotate: showLogForm ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {showLogForm && (
              <View style={styles.detailedLogForm}>
                <Text style={styles.formLabel}>How do you feel after taking it?</Text>
                <View style={styles.moodRow}>
                  {MOOD_AFTER_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.moodChip, logMood === opt.value && styles.moodChipSelected]}
                      onPress={() => setLogMood(logMood === opt.value ? null : opt.value)}
                    >
                      <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.moodLabel, logMood === opt.value && styles.moodLabelSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Did it seem to help today?</Text>
                <View style={styles.helpRow}>
                  {[
                    { value: true, label: 'Yes' },
                    { value: false, label: 'Not really' },
                    { value: null, label: 'Not sure' },
                  ].map(opt => (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={[styles.helpChip, logDidHelp === opt.value && styles.helpChipSelected]}
                      onPress={() => setLogDidHelp(opt.value)}
                    >
                      <Text style={[styles.helpChipText, logDidHelp === opt.value && styles.helpChipTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Side effects (optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={logSideEffects}
                  onChangeText={setLogSideEffects}
                  placeholder="Any side effects today..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />

                <Text style={styles.formLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={logNotes}
                  onChangeText={setLogNotes}
                  placeholder="How you're feeling..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />

                <TouchableOpacity
                  style={styles.formSubmit}
                  onPress={() => handleDetailedLog(medicationTimes[0] ?? null)}
                  disabled={isLogging}
                >
                  <CheckCircle size={18} color={Colors.white} />
                  <Text style={styles.formSubmitText}>Log Medication</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {recentLogs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Logs</Text>
              <TouchableOpacity onPress={() => router.push(`/medication-history?id=${medication.id}` as any)}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentLogs.map(log => {
              const date = new Date(log.timestamp);
              const statusColor = log.status === 'taken' ? Colors.success : log.status === 'missed' ? Colors.danger : Colors.textMuted;
              const moodOpt = log.moodAfter ? MOOD_AFTER_OPTIONS.find(m => m.value === log.moodAfter) : null;
              return (
                <View key={log.id} style={styles.logRow}>
                  <View style={[styles.logDot, { backgroundColor: statusColor }]} />
                  <View style={styles.logInfo}>
                    <Text style={styles.logDate}>
                      {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                    <Text style={[styles.logStatus, { color: statusColor }]}>
                      {log.status === 'taken' ? 'Taken' : log.status === 'missed' ? 'Missed' : 'Skipped'}
                      {moodOpt ? ` · ${moodOpt.emoji} ${moodOpt.label}` : ''}
                    </Text>
                    {log.sideEffects ? <Text style={styles.logNote}>SE: {log.sideEffects}</Text> : null}
                    {log.notes ? <Text style={styles.logNote}>{log.notes}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {medication.sideEffectNotes ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Side Effects to Watch</Text>
            <Text style={styles.noteText}>{medication.sideEffectNotes}</Text>
          </View>
        ) : null}

        {medication.generalNotes ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Notes</Text>
            <Text style={styles.noteText}>{medication.generalNotes}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionRow} onPress={handleToggleActive}>
            {medication.active ? (
              <ToggleRight size={20} color={Colors.primary} />
            ) : (
              <ToggleLeft size={20} color={Colors.textMuted} />
            )}
            <Text style={styles.actionText}>
              {medication.active ? 'Mark as inactive' : 'Mark as active'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
            <Trash2 size={20} color={Colors.danger} />
            <Text style={[styles.actionText, { color: Colors.danger }]}>Remove medication</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  inactiveBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inactiveBadgeText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  heroDosage: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  heroPurpose: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  heroSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroScheduleText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 12,
  },
  quickLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  quickLogTime: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  quickLogActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickLogTaken: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickLogMissed: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLogBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  detailedLogToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
  },
  detailedLogToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  detailedLogForm: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  moodChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  moodLabelSelected: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  helpRow: {
    flexDirection: 'row',
    gap: 8,
  },
  helpChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  helpChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  helpChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  helpChipTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  formInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top' as const,
  },
  formSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
  },
  formSubmitText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logDate: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  logStatus: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  logNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  noteCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  actions: {
    marginTop: 16,
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
});
