import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Trash2, TrendingUp, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMovement } from '@/providers/MovementProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  MovementEntry,
  getMovementTypeLabel,
  getMovementTypeIcon,
  getMoodEmoji,
  formatDuration,
  getIntensityColor,
  MOVEMENT_TYPES,
} from '@/types/movement';
import { movementService } from '@/services/movement/movementService';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

function WeekSummary({ entries }: { entries: MovementEntry[] }) {
  useLanguage();
  const weekEntries = useMemo(() => movementService.getWeekEntries(entries), [entries]);
  const totalMinutes = useMemo(() => weekEntries.reduce((s, e) => s + e.duration, 0), [weekEntries]);
  const avgShift = useMemo(() => movementService.getAverageMoodShift(weekEntries), [weekEntries]);
  const typeCounts = useMemo(() => movementService.getEntriesByType(weekEntries), [weekEntries]);

  const topTypes = useMemo(() => {
    return Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  }, [typeCounts]);

  if (weekEntries.length === 0) return null;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{localizedText('This Week', 'Esta semana')}</Text>
      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>{weekEntries.length}</Text>
          <Text style={styles.summaryStatLabel}>{localizedText('sessions', 'sesiones')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>{formatDuration(totalMinutes)}</Text>
          <Text style={styles.summaryStatLabel}>{localizedText('total', 'total')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStat}>
          <Text style={[styles.summaryStatValue, { color: avgShift >= 0 ? Colors.success : Colors.danger }]}>
            {avgShift > 0 ? '+' : ''}{avgShift}
          </Text>
          <Text style={styles.summaryStatLabel}>{localizedText('mood shift', 'cambio de ánimo')}</Text>
        </View>
      </View>
      {topTypes.length > 0 && (
        <View style={styles.topTypesRow}>
          {topTypes.map(([type, count]) => {
            const info = MOVEMENT_TYPES.find(t => t.value === type);
            return (
              <View key={type} style={styles.topTypeChip}>
                <Text style={styles.topTypeEmoji}>{info?.icon ?? '✨'}</Text>
                <Text style={styles.topTypeText}>{getMovementTypeLabel(type as MovementEntry['type'])} ({count})</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function MovementHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const { trackEvent } = useAnalytics();
  const { entries, deleteEntry } = useMovement();
  useLanguage();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    trackEvent('movement_history_viewed');
  }, [fadeAnim, trackEvent]);

  const groupedByMonth = useMemo(() => {
    const groups: { month: string; entries: MovementEntry[] }[] = [];
    const map = new Map<string, MovementEntry[]>();

    entries.forEach(entry => {
      const d = new Date(entry.timestamp);
      const key = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const existing = map.get(key) ?? [];
      existing.push(entry);
      map.set(key, existing);
    });

    map.forEach((items, month) => groups.push({ month, entries: items }));
    return groups;
  }, [entries]);

  const handleDelete = useCallback((entry: MovementEntry) => {
    Alert.alert(
      localizedText('Remove Entry', 'Eliminar entrada'),
      localizedText(
        `Remove this ${getMovementTypeLabel(entry.type)} entry?`,
        `¿Eliminar esta entrada de ${getMovementTypeLabel(entry.type)}?`,
      ),
      [
        { text: localizedText('Cancel', 'Cancelar'), style: 'cancel' },
        {
          text: localizedText('Remove', 'Eliminar'),
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            try {
              await deleteEntry(entry.id);
              trackEvent('movement_entry_deleted', { type: entry.type });
            } catch (error) {
              console.log('[MovementHistory] Delete error:', error);
            }
          },
        },
      ],
    );
  }, [deleteEntry, trackEvent]);

  const renderEntry = useCallback((entry: MovementEntry) => {
    const time = new Date(entry.timestamp);
    const dateStr = time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const intensityColor = getIntensityColor(entry.intensity);
    const moodDiff = entry.moodAfter - entry.moodBefore;
    const isHighlighted = highlight === entry.id;

    return (
      <View
        key={entry.id}
        style={[styles.entryCard, isHighlighted && styles.entryCardHighlighted]}
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryHeaderLeft}>
            <Text style={styles.entryEmoji}>{getMovementTypeIcon(entry.type)}</Text>
            <View>
              <Text style={styles.entryType}>{getMovementTypeLabel(entry.type)}</Text>
              <Text style={styles.entryDate}>{dateStr} {localizedText('at', 'a las')} {timeStr}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(entry)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.entryDetails}>
          <View style={styles.detailChip}>
            <Text style={styles.detailChipText}>{formatDuration(entry.duration)}</Text>
          </View>
          <View style={[styles.detailChip, { borderColor: intensityColor }]}>
            <View style={[styles.detailDot, { backgroundColor: intensityColor }]} />
            <Text style={[styles.detailChipText, { color: intensityColor }]}>{entry.intensity}</Text>
          </View>
        </View>

        <View style={styles.moodSection}>
          <View style={styles.moodBeforeAfter}>
            <View style={styles.moodItem}>
              <Text style={styles.moodLabel}>{localizedText('Before', 'Antes')}</Text>
              <Text style={styles.moodBigEmoji}>{getMoodEmoji(entry.moodBefore)}</Text>
            </View>
            <View style={styles.moodArrowWrap}>
              <TrendingUp size={18} color={moodDiff > 0 ? Colors.success : moodDiff < 0 ? Colors.danger : Colors.textMuted} />
            </View>
            <View style={styles.moodItem}>
              <Text style={styles.moodLabel}>{localizedText('After', 'Después')}</Text>
              <Text style={styles.moodBigEmoji}>{getMoodEmoji(entry.moodAfter)}</Text>
            </View>
          </View>
          {moodDiff !== 0 && (
            <View style={[styles.moodShiftBadge, {
              backgroundColor: moodDiff > 0 ? Colors.successLight : Colors.dangerLight,
            }]}>
              <Text style={[styles.moodShiftText, {
                color: moodDiff > 0 ? Colors.success : Colors.danger,
              }]}>
                {moodDiff > 0
                  ? localizedText('Mood improved', 'El ánimo mejoró')
                  : localizedText('Mood shifted down', 'El ánimo bajó')} ({moodDiff > 0 ? '+' : ''}{moodDiff})
              </Text>
            </View>
          )}
        </View>

        {entry.notes.length > 0 && (
          <View style={styles.notesSection}>
            <Text style={styles.notesText}>{entry.notes}</Text>
          </View>
        )}
      </View>
    );
  }, [highlight, handleDelete]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} testID="movement-history-close">
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{localizedText('Movement History', 'Historial de movimiento')}</Text>
        <View style={styles.headerRight}>
          <BarChart3 size={20} color={Colors.primary} />
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <WeekSummary entries={entries} />

          {groupedByMonth.length > 0 ? (
            groupedByMonth.map(group => (
              <View key={group.month} style={styles.monthGroup}>
                <Text style={styles.monthLabel}>{group.month}</Text>
                {group.entries.map(renderEntry)}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌿</Text>
              <Text style={styles.emptyTitle}>{localizedText('No movement history yet', 'Aún no hay historial de movimiento')}</Text>
              <Text style={styles.emptySubtitle}>
                {localizedText(
                  'Log your first movement to start tracking how it helps',
                  'Registra tu primer movimiento para empezar a ver cómo te ayuda',
                )}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerRight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  topTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  topTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  topTypeEmoji: {
    fontSize: 14,
  },
  topTypeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  monthGroup: {
    marginBottom: 20,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  entryCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  entryCardHighlighted: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  entryEmoji: {
    fontSize: 24,
  },
  entryType: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  entryDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  entryDetails: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  detailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detailChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  moodSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  moodBeforeAfter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  moodItem: {
    alignItems: 'center',
    gap: 4,
  },
  moodLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  moodBigEmoji: {
    fontSize: 28,
  },
  moodArrowWrap: {
    paddingTop: 16,
  },
  moodShiftBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    alignSelf: 'center',
  },
  moodShiftText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  notesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
