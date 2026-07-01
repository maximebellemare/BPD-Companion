import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, Pill, Clock, CheckCircle, XCircle, ChevronRight, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMedications } from '@/providers/MedicationProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { formatMedicationSchedule, formatTime, getCategoryColor, Medication, MedicationTime } from '@/types/medication';
import { useAppTheme } from '@/providers/ThemeProvider';

export default function MedicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { trackEvent } = useAnalytics();
  const medicationContext = useMedications();
  const activeMedications = medicationContext?.activeMedications ?? [];
  const inactiveMedications = medicationContext?.inactiveMedications ?? [];
  const dueMedications = medicationContext?.dueMedications ?? [];
  const todayLogs = medicationContext?.todayLogs ?? [];
  const overallAdherence = medicationContext?.overallAdherence ?? 0;
  const isLoading = medicationContext?.isLoading ?? false;
  const logMedication = medicationContext?.logMedication ?? (async () => {
    if (__DEV__) console.log('[Medications] Medication context unavailable while logging.');
  });
  const isLogging = medicationContext?.isLogging ?? false;

  const [loggingId, setLoggingId] = useState<string | null>(null);

  const handleQuickLog = useCallback(async (medicationId: string, time: MedicationTime | null) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLoggingId(medicationId);
    try {
      await logMedication({
        medicationId,
        status: 'taken',
        scheduledTime: time,
      });
      trackEvent('medication_logged_taken', { medicationId });
    } catch (error) {
      console.log('[Medications] Error logging medication:', error);
    } finally {
      setLoggingId(null);
    }
  }, [logMedication, trackEvent]);

  const handleQuickMiss = useCallback(async (medicationId: string, time: MedicationTime | null) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLoggingId(medicationId);
    try {
      await logMedication({
        medicationId,
        status: 'missed',
        scheduledTime: time,
      });
      trackEvent('medication_logged_missed', { medicationId });
    } catch (error) {
      console.log('[Medications] Error logging medication:', error);
    } finally {
      setLoggingId(null);
    }
  }, [logMedication, trackEvent]);

  const takenToday = useMemo(() => todayLogs.filter(l => l.status === 'taken').length, [todayLogs]);
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          testID="medications-close"
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Medications</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/medication-add')}
          testID="add-medication"
        >
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeMedications.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{takenToday}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Taken today</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{activeMedications.length}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Active</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: overallAdherence >= 70 ? Colors.success : Colors.accent }]}>
                  {overallAdherence}%
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>7-day rate</Text>
              </View>
            </View>
          </View>
        )}

        {dueMedications.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Due Now</Text>
            {dueMedications.map((item, idx) => (
              <View key={`due-${item.medication.id}-${idx}`} style={[styles.dueCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <View style={[styles.dueDot, { backgroundColor: getCategoryColor(item.medication.category) }]} />
                <View style={styles.dueInfo}>
                  <Text style={[styles.dueName, { color: colors.text }]}>{item.medication.name}</Text>
                  <Text style={[styles.dueDosage, { color: colors.textSecondary }]}>
                    {item.medication.dosage} · {item.time.label} · {formatTime(item.time.hour, item.time.minute)}
                  </Text>
                </View>
                {item.logged ? (
                  <View style={styles.loggedBadge}>
                    <CheckCircle size={16} color={Colors.success} />
                    <Text style={styles.loggedText}>Done</Text>
                  </View>
                ) : (
                  <View style={styles.dueActions}>
                    <TouchableOpacity
                      style={styles.dueActionTaken}
                      onPress={() => handleQuickLog(item.medication.id, item.time)}
                      disabled={isLogging && loggingId === item.medication.id}
                      testID={`quick-log-${item.medication.id}`}
                    >
                      {isLogging && loggingId === item.medication.id ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <CheckCircle size={16} color={Colors.white} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dueActionMissed}
                      onPress={() => handleQuickMiss(item.medication.id, item.time)}
                      disabled={isLogging && loggingId === item.medication.id}
                    >
                      <XCircle size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {activeMedications.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Active Medications</Text>
            {activeMedications.map(med => (
              <MedicationRow
                key={med.id}
                medication={med}
                onPress={() => router.push(`/medication-detail?id=${med.id}` as any)}
                colors={colors}
              />
            ))}
          </View>
        )}

        {inactiveMedications.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Inactive</Text>
            {inactiveMedications.map(med => (
              <MedicationRow
                key={med.id}
                medication={med}
                onPress={() => router.push(`/medication-detail?id=${med.id}` as any)}
                inactive
                colors={colors}
              />
            ))}
          </View>
        )}

        {activeMedications.length === 0 && inactiveMedications.length === 0 && (
          <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Pill size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No medications yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Add your medications to track adherence, side effects, and how they affect your mood.
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/medication-add')}
            >
              <Plus size={18} color={Colors.white} />
              <Text style={styles.emptyButtonText}>Add Medication</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeMedications.length > 0 && (
          <TouchableOpacity
            style={styles.historyBanner}
            onPress={() => router.push('/medication-history' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.historyBannerLeft}>
              <View style={styles.historyBannerIcon}>
                <Calendar size={20} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.historyBannerTitle}>View Full History</Text>
                <Text style={styles.historyBannerDesc}>See adherence log and mood trends</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.white} style={{ opacity: 0.7 }} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const MedicationRow = React.memo(({ medication, onPress, inactive, colors }: {
  medication: Medication;
  onPress: () => void;
  inactive?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) => {
  const scheduleLabel = formatMedicationSchedule(medication);

  return (
    <TouchableOpacity
      style={[styles.medRow, { backgroundColor: colors.card, shadowColor: colors.shadow }, inactive && styles.medRowInactive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.medDot, { backgroundColor: getCategoryColor(medication.category) }]} />
      <View style={styles.medInfo}>
        <Text style={[styles.medName, { color: inactive ? colors.textMuted : colors.text }]}>{medication.name}</Text>
        <Text style={[styles.medDosage, { color: colors.textSecondary }]}>{medication.dosage}</Text>
        <View style={styles.medScheduleRow}>
          <Clock size={12} color={colors.textMuted} />
          <Text style={[styles.medSchedule, { color: colors.textMuted }]}>{scheduleLabel}</Text>
        </View>
      </View>
      <ChevronRight size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  dueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dueDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  dueInfo: {
    flex: 1,
  },
  dueName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dueDosage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dueActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dueActionTaken: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueActionMissed: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  loggedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  medRowInactive: {
    opacity: 0.6,
  },
  medDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  medNameInactive: {
    color: Colors.textMuted,
  },
  medDosage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  medScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  medSchedule: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  historyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  historyBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBannerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  historyBannerDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
});
