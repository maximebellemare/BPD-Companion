import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Sun, Flame, ChevronRight, TrendingUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { DailyRitualEntry, RitualStreak, WeeklyReflectionSummary } from '@/types/ritual';

interface DailyReflectionCardProps {
  todayEntry: DailyRitualEntry | undefined;
  streak: RitualStreak;
  weeklySummary: WeeklyReflectionSummary;
  onPress: () => void;
}

export default function DailyReflectionCard({
  todayEntry,
  streak,
  weeklySummary,
  onPress,
}: DailyReflectionCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!todayEntry) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [todayEntry, pulseAnim]);

  const hasCheckedIn = !!todayEntry;

  return (
    <Animated.View style={{ transform: [{ scale: hasCheckedIn ? 1 : pulseAnim }] }}>
      <TouchableOpacity
        style={[styles.card, hasCheckedIn ? styles.cardCompleted : styles.cardPending]}
        onPress={onPress}
        activeOpacity={0.75}
        testID="daily-reflection-card"
      >
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, hasCheckedIn ? styles.iconCompleted : styles.iconPending]}>
            <Sun size={20} color={hasCheckedIn ? '#14B8A6' : '#67E8F9'} />
          </View>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>
              {hasCheckedIn ? 'Daily Reflection' : 'How are you feeling today?'}
            </Text>
            <Text style={styles.subtitle}>
              {hasCheckedIn
                ? `You're feeling ${todayEntry.mood.label.toLowerCase()} today`
                : 'Take a moment to check in with yourself'}
            </Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </View>

        {hasCheckedIn && (
          <View style={styles.moodRow}>
            <Text style={styles.moodEmoji}>{todayEntry.mood.emoji}</Text>
            <View style={styles.moodInfo}>
              <Text style={styles.moodLabel}>{todayEntry.mood.label}</Text>
              {todayEntry.emotionTags.length > 0 && (
                <Text style={styles.moodTags} numberOfLines={1}>
                  {todayEntry.emotionTags.map(t => t.emoji).join(' ')}
                </Text>
              )}
            </View>
            {todayEntry.intention ? (
              <View style={styles.intentionBadge}>
                <Text style={styles.intentionText} numberOfLines={1}>
                  {todayEntry.intention}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        <View style={styles.bottomRow}>
          {streak.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Flame size={14} color="#3B82F6" />
              <Text style={styles.streakText}>{streak.currentStreak} day streak</Text>
            </View>
          )}
          {weeklySummary.totalDays > 0 && (
            <View style={styles.weekBadge}>
              <TrendingUp size={12} color={Colors.primary} />
              <Text style={styles.weekText}>
                Week avg: {weeklySummary.averageMood}
              </Text>
            </View>
          )}
          {!hasCheckedIn && streak.currentStreak === 0 && weeklySummary.totalDays === 0 && (
            <Text style={styles.startText}>Start your daily ritual</Text>
          )}
        </View>

        {weeklySummary.totalDays > 0 && weeklySummary.averageStress > 0 && (
          <View style={styles.stressRow}>
            <Text style={styles.stressLabel}>Avg stress this week</Text>
            <View style={styles.stressBarBg}>
              <View
                style={[
                  styles.stressBarFill,
                  {
                    width: `${(weeklySummary.averageStress / 10) * 100}%`,
                    backgroundColor: weeklySummary.averageStress > 6
                      ? Colors.danger
                      : weeklySummary.averageStress > 3
                        ? Colors.accent
                        : Colors.success,
                  },
                ]}
              />
            </View>
            <Text style={styles.stressValue}>{weeklySummary.averageStress}/10</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPending: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D9E2EC',
  },
  cardCompleted: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconPending: {
    backgroundColor: '#D9E2EC',
  },
  iconCompleted: {
    backgroundColor: Colors.primaryLight,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  moodEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  moodInfo: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  moodTags: {
    fontSize: 14,
    marginTop: 2,
  },
  intentionBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 120,
  },
  intentionText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.primaryDark,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  weekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  weekText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.primaryDark,
  },
  startText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  stressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  stressLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  stressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stressValue: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
});
