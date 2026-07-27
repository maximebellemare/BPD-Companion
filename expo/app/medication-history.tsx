import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CheckCircle, XCircle, SkipForward, Filter } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { localizedText } from '@/lib/i18n/staticText';
import { useLanguage } from '@/hooks/useLanguage';
import { useMedications } from '@/providers/MedicationProvider';
import { MOOD_AFTER_OPTIONS, LogStatus } from '@/types/medication';

type FilterStatus = 'all' | LogStatus;

export default function MedicationHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const medicationContext = useMedications();
  const logs = medicationContext?.logs ?? [];
  const getMedicationById = medicationContext?.getMedicationById ?? (() => null);
  const overallAdherence = medicationContext?.overallAdherence ?? 0;
  const getAdherenceRate = medicationContext?.getAdherenceRate ?? (() => 0);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const medication = id ? getMedicationById(id) : null;
  const title = medication
    ? localizedText(`${medication.name} History`, `Historial de ${medication.name}`)
    : localizedText('Medication History', 'Historial de medicamentos');
  const adherence = id ? getAdherenceRate(id, 30) : overallAdherence;

  const filteredLogs = useMemo(() => {
    let filtered = id ? logs.filter(l => l.medicationId === id) : logs;
    if (filterStatus !== 'all') {
      filtered = filtered.filter(l => l.status === filterStatus);
    }
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, id, filterStatus]);

  const groupedLogs = useMemo(() => {
    const groups: Record<string, typeof filteredLogs> = {};
    filteredLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toLocaleDateString(language === 'es' ? 'es' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });
    return Object.entries(groups);
  }, [filteredLogs, language]);

  const handleFilterChange = useCallback((status: FilterStatus) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFilterStatus(status);
  }, []);

  const getMedName = useCallback((medId: string) => {
    const med = getMedicationById(medId);
    return med?.name ?? localizedText('Unknown', 'Desconocido');
  }, [getMedicationById]);

  const takenCount = useMemo(() => filteredLogs.filter(l => l.status === 'taken').length, [filteredLogs]);
  const missedCount = useMemo(() => filteredLogs.filter(l => l.status === 'missed').length, [filteredLogs]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>{takenCount}</Text>
              <Text style={styles.summaryLabel}>{localizedText('Taken', 'Tomado')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.danger }]}>{missedCount}</Text>
              <Text style={styles.summaryLabel}>{localizedText('Missed', 'No tomado')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: adherence >= 70 ? Colors.success : Colors.accent }]}>
                {adherence}%
              </Text>
              <Text style={styles.summaryLabel}>{localizedText('30-day rate', 'Tasa de 30 días')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          <Filter size={14} color={Colors.textMuted} />
          {(['all', 'taken', 'missed', 'skipped'] as FilterStatus[]).map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
              onPress={() => handleFilterChange(status)}
            >
              <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                {status === 'all'
                  ? localizedText('All', 'Todo')
                  : status === 'taken'
                    ? localizedText('Taken', 'Tomado')
                    : status === 'missed'
                      ? localizedText('Missed', 'No tomado')
                      : localizedText('Skipped', 'Omitido')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {groupedLogs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{localizedText('No logs yet', 'Aún no hay registros')}</Text>
            <Text style={styles.emptyDesc}>
              {filterStatus !== 'all'
                ? localizedText(
                  `No ${filterStatus} logs found. Try a different filter.`,
                  `No se encontraron registros de ${filterStatus === 'taken' ? 'tomados' : filterStatus === 'missed' ? 'no tomados' : 'omitidos'}. Prueba otro filtro.`,
                )
                : localizedText('Medication logs will appear here as you track.', 'Los registros de medicamentos aparecerán aquí cuando los lleves.')}
            </Text>
          </View>
        )}

        {groupedLogs.map(([dateKey, dayLogs]) => (
          <View key={dateKey} style={styles.dayGroup}>
            <Text style={styles.dayLabel}>{dateKey}</Text>
            {dayLogs.map(log => {
              const time = new Date(log.timestamp);
              const statusIcon = log.status === 'taken'
                ? <CheckCircle size={16} color={Colors.success} />
                : log.status === 'missed'
                  ? <XCircle size={16} color={Colors.danger} />
                  : <SkipForward size={16} color={Colors.textMuted} />;
              const statusColor = log.status === 'taken' ? Colors.success : log.status === 'missed' ? Colors.danger : Colors.textMuted;
              const moodOpt = log.moodAfter ? MOOD_AFTER_OPTIONS.find(m => m.value === log.moodAfter) : null;

              return (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logLeft}>
                    {statusIcon}
                  </View>
                  <View style={styles.logContent}>
                    <View style={styles.logTopRow}>
                      {!id && (
                        <Text style={styles.logMedName}>{getMedName(log.medicationId)}</Text>
                      )}
                      <Text style={[styles.logStatusText, { color: statusColor }]}>
                        {log.status === 'taken'
                          ? localizedText('Taken', 'Tomado')
                          : log.status === 'missed'
                            ? localizedText('Missed', 'No tomado')
                            : localizedText('Skipped', 'Omitido')}
                      </Text>
                    </View>
                    <Text style={styles.logTime}>
                      {time.toLocaleTimeString(language === 'es' ? 'es' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: language !== 'es' })}
                      {log.scheduledTime ? localizedText(` (scheduled ${log.scheduledTime.label})`, ` (programado: ${log.scheduledTime.label})`) : ''}
                    </Text>
                    {moodOpt && (
                      <Text style={styles.logMood}>{moodOpt.emoji} {moodOpt.label}</Text>
                    )}
                    {log.didItHelp !== null && (
                      <Text style={styles.logHelp}>
                        {log.didItHelp ? localizedText('Felt helpful', 'Se sintió útil') : localizedText('Didn\'t feel helpful', 'No se sintió útil')}
                      </Text>
                    )}
                    {log.sideEffects ? (
                      <Text style={styles.logSideEffect}>{localizedText('Side effects:', 'Efectos secundarios:')} {log.sideEffects}</Text>
                    ) : null}
                    {log.notes ? (
                      <Text style={styles.logNote}>{log.notes}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
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
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  summaryCard: {
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
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
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  dayGroup: {
    marginBottom: 20,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  logLeft: {
    marginRight: 12,
    marginTop: 2,
  },
  logContent: {
    flex: 1,
  },
  logTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  logMedName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  logStatusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  logTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  logMood: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logHelp: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    marginTop: 2,
  },
  logSideEffect: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 4,
  },
  logNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
});
