import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Pill, CheckCircle, ChevronRight, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMedications } from '@/providers/MedicationProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { formatTime, getCategoryColor } from '@/types/medication';

const MedicationHomeCard = React.memo(() => {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const medicationContext = useMedications();
  const activeMedications = medicationContext?.activeMedications ?? [];
  const dueMedications = medicationContext?.dueMedications ?? [];
  const todayLogs = medicationContext?.todayLogs ?? [];
  const logMedication = medicationContext?.logMedication ?? (async () => {
    if (__DEV__) console.log('[MedicationHomeCard] Medication context unavailable while logging.');
  });
  const isLogging = medicationContext?.isLogging ?? false;

  const handleQuickLog = useCallback(async (medicationId: string, time: any) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await logMedication({
        medicationId,
        status: 'taken',
        scheduledTime: time,
      });
      trackEvent('medication_logged_taken', { medicationId, source: 'home' });
    } catch (error) {
      console.log('[MedicationHomeCard] Error logging:', error);
    }
  }, [logMedication, trackEvent]);

  if (activeMedications.length === 0) return null;

  const unloggedDue = dueMedications.filter(d => !d.logged);
  const takenToday = todayLogs.filter(l => l.status === 'taken').length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/medications' as any)}
      activeOpacity={0.7}
      testID="medication-home-card"
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Pill size={18} color={Colors.primary} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Medications</Text>
          <Text style={styles.cardSubtitle}>
            {takenToday > 0
              ? `${takenToday} taken today`
              : 'No doses logged yet today'}
          </Text>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </View>

      {unloggedDue.length > 0 && (
        <View style={styles.dueSection}>
          {unloggedDue.slice(0, 3).map((item, idx) => (
            <View key={`${item.medication.id}-${idx}`} style={styles.dueRow}>
              <View style={[styles.dueDot, { backgroundColor: getCategoryColor(item.medication.category) }]} />
              <View style={styles.dueInfo}>
                <Text style={styles.dueName} numberOfLines={1}>{item.medication.name}</Text>
                <View style={styles.dueTimeRow}>
                  <Clock size={10} color={Colors.textMuted} />
                  <Text style={styles.dueTime}>{formatTime(item.time.hour, item.time.minute)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.quickLogBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  void handleQuickLog(item.medication.id, item.time);
                }}
                disabled={isLogging}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isLogging ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <CheckCircle size={14} color={Colors.white} />
                )}
                <Text style={styles.quickLogText}>Take</Text>
              </TouchableOpacity>
            </View>
          ))}
          {unloggedDue.length > 3 && (
            <Text style={styles.moreText}>+{unloggedDue.length - 3} more</Text>
          )}
        </View>
      )}

      {unloggedDue.length === 0 && takenToday > 0 && (
        <View style={styles.allDoneRow}>
          <CheckCircle size={16} color={Colors.success} />
          <Text style={styles.allDoneText}>All caught up for now</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default MedicationHomeCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  dueSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 8,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  dueInfo: {
    flex: 1,
  },
  dueName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dueTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  dueTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  quickLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickLogText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  moreText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  allDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  allDoneText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500' as const,
  },
});
