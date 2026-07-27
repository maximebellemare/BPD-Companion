import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, Activity, TrendingUp, Clock, Calendar, ChevronRight, Footprints } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMovement } from '@/providers/MovementProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  getMovementTypeLabel,
  getMovementTypeIcon,
  getMoodEmoji,
  formatDuration,
  getIntensityColor,
  MovementEntry,
} from '@/types/movement';
import { localizedText } from '@/lib/i18n/staticText';
import { useLanguage } from '@/hooks/useLanguage';

function MoodShiftBadge({ before, after }: { before: number; after: number }) {
  const diff = after - before;
  if (diff === 0) return null;
  const isPositive = diff > 0;
  return (
    <View style={[styles.moodShiftBadge, { backgroundColor: isPositive ? Colors.successLight : Colors.dangerLight }]}>
      <Text style={[styles.moodShiftText, { color: isPositive ? Colors.success : Colors.danger }]}>
        {isPositive ? '+' : ''}{diff}
      </Text>
    </View>
  );
}

function EntryCard({ entry, onPress }: { entry: MovementEntry; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  }, [scaleAnim]);

  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const intensityColor = getIntensityColor(entry.intensity);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.entryCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        testID={`movement-entry-${entry.id}`}
      >
        <View style={styles.entryLeft}>
          <Text style={styles.entryIcon}>{getMovementTypeIcon(entry.type)}</Text>
          <View style={styles.entryInfo}>
            <Text style={styles.entryType}>{getMovementTypeLabel(entry.type)}</Text>
            <View style={styles.entryMeta}>
              <Text style={styles.entryDuration}>{formatDuration(entry.duration)}</Text>
              <View style={[styles.intensityDot, { backgroundColor: intensityColor }]} />
              <Text style={[styles.entryIntensity, { color: intensityColor }]}>{entry.intensity}</Text>
            </View>
          </View>
        </View>
        <View style={styles.entryRight}>
          <View style={styles.moodRow}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(entry.moodBefore)}</Text>
            <Text style={styles.moodArrow}>→</Text>
            <Text style={styles.moodEmoji}>{getMoodEmoji(entry.moodAfter)}</Text>
            <MoodShiftBadge before={entry.moodBefore} after={entry.moodAfter} />
          </View>
          <Text style={styles.entryTime}>{timeStr}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MovementLogScreen() {
  useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const {
    entries,
    totalMinutesToday,
    totalMinutesWeek,
    averageMoodShift,
    streakDays,
    moodImpact,
    isLoading,
  } = useMovement();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    trackEvent('movement_viewed');
  }, [fadeAnim, trackEvent]);

  const recentEntries = useMemo(() => entries.slice(0, 20), [entries]);

  const groupedByDate = useMemo(() => {
    const groups: { date: string; entries: MovementEntry[] }[] = [];
    const map = new Map<string, MovementEntry[]>();

    recentEntries.forEach(entry => {
      const d = new Date(entry.timestamp);
      const key = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const existing = map.get(key) ?? [];
      existing.push(entry);
      map.set(key, existing);
    });

    map.forEach((entries, date) => groups.push({ date, entries }));
    return groups;
  }, [recentEntries]);

  const handleAdd = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/movement-add' as never);
  }, [router]);

  const handleHistory = useCallback(() => {
    router.push('/movement-history' as never);
  }, [router]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} testID="movement-close">
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Movement</Text>
        <TouchableOpacity onPress={handleHistory} style={styles.historyBtn} testID="movement-history-btn">
          <Calendar size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroIconWrap}>
              <Footprints size={28} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>{localizedText('Supportive Movement', 'Movimiento de apoyo')}</Text>
            <Text style={styles.heroSubtitle}>
              Movement as regulation — track how it shifts your emotional state
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Clock size={16} color={Colors.primary} />
              <Text style={styles.statValue}>{formatDuration(totalMinutesToday)}</Text>
              <Text style={styles.statLabel}>{localizedText('Today', 'Hoy')}</Text>
            </View>
            <View style={styles.statCard}>
              <Activity size={16} color={Colors.accent} />
              <Text style={styles.statValue}>{formatDuration(totalMinutesWeek)}</Text>
              <Text style={styles.statLabel}>This week</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={16} color={averageMoodShift >= 0 ? Colors.success : Colors.danger} />
              <Text style={styles.statValue}>
                {averageMoodShift > 0 ? '+' : ''}{averageMoodShift}
              </Text>
              <Text style={styles.statLabel}>Avg shift</Text>
            </View>
          </View>

          {moodImpact.total > 0 && (
            <View style={styles.impactCard}>
              <Text style={styles.impactTitle}>{localizedText('How movement helps', 'Como ayuda el movimiento')}</Text>
              <View style={styles.impactRow}>
                <View style={styles.impactItem}>
                  <Text style={styles.impactNumber}>{moodImpact.improved}</Text>
                  <Text style={styles.impactLabel}>Felt better</Text>
                </View>
                <View style={styles.impactDivider} />
                <View style={styles.impactItem}>
                  <Text style={styles.impactNumber}>{moodImpact.same}</Text>
                  <Text style={styles.impactLabel}>Same</Text>
                </View>
                <View style={styles.impactDivider} />
                <View style={styles.impactItem}>
                  <Text style={styles.impactNumber}>{moodImpact.declined}</Text>
                  <Text style={styles.impactLabel}>Felt lower</Text>
                </View>
              </View>
              {moodImpact.improved > moodImpact.declined && (
                <Text style={styles.impactNote}>
                  Movement seems to help you feel better most of the time
                </Text>
              )}
            </View>
          )}

          {streakDays > 1 && (
            <View style={styles.streakBanner}>
              <Text style={styles.streakEmoji}>🌿</Text>
              <View style={styles.streakText}>
                <Text style={styles.streakTitle}>{streakDays}-day movement streak</Text>
                <Text style={styles.streakSubtitle}>Showing up for yourself consistently</Text>
              </View>
            </View>
          )}

          {groupedByDate.length > 0 ? (
            groupedByDate.map(group => (
              <View key={group.date} style={styles.dateGroup}>
                <Text style={styles.dateLabel}>{group.date}</Text>
                {group.entries.map(entry => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onPress={() => router.push(`/movement-history?highlight=${entry.id}` as never)}
                  />
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>{localizedText('No movement logged yet', 'Aun no registraste movimiento')}</Text>
              <Text style={styles.emptySubtitle}>
                Log a walk, stretch, or any calming movement to see how it affects your mood
              </Text>
            </View>
          )}

          {entries.length > 20 && (
            <TouchableOpacity style={styles.viewAllBtn} onPress={handleHistory}>
              <Text style={styles.viewAllText}>{localizedText('View full history', 'Ver historial completo')}</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>

      <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.fab} onPress={handleAdd} testID="movement-add-btn">
          <Plus size={24} color={Colors.white} />
          <Text style={styles.fabText}>Log Movement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.background,
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
  historyBtn: {
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
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  impactCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  impactTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  impactItem: {
    alignItems: 'center',
    flex: 1,
  },
  impactNumber: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  impactLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  impactDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderLight,
  },
  impactNote: {
    fontSize: 13,
    color: Colors.success,
    textAlign: 'center',
    marginTop: 14,
    fontStyle: 'italic',
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  streakEmoji: {
    fontSize: 24,
  },
  streakText: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  streakSubtitle: {
    fontSize: 12,
    color: Colors.primaryDark,
    opacity: 0.7,
    marginTop: 2,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  entryCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  entryIcon: {
    fontSize: 24,
  },
  entryInfo: {
    flex: 1,
  },
  entryType: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  entryDuration: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  intensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  entryIntensity: {
    fontSize: 12,
    fontWeight: '500' as const,
    textTransform: 'capitalize' as const,
  },
  entryRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodArrow: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  moodShiftBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  moodShiftText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  entryTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  fabContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
