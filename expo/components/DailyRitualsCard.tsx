import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Sun, Cloud, Moon, Flame, ChevronRight, Check, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { RitualCompletion } from '@/types/ritual';
import {
  RITUAL_CONFIG,
  getTodayStatus,
  getCurrentRitualType,
  computeRitualStreak,
} from '@/services/rituals/ritualService';

interface DailyRitualsCardProps {
  completions: RitualCompletion[];
  onPress: () => void;
}

export default function DailyRitualsCard({ completions, onPress }: DailyRitualsCardProps) {
  const todayStatus = useMemo(() => getTodayStatus(completions), [completions]);
  const streak = useMemo(() => computeRitualStreak(completions), [completions]);
  const currentRitual = getCurrentRitualType();
  const allComplete = todayStatus.completedCount === 3;

  const ritualItems: Array<{ type: 'morning' | 'midday' | 'evening'; done: boolean }> = [
    { type: 'morning', done: todayStatus.morning },
    { type: 'midday', done: todayStatus.midday },
    { type: 'evening', done: todayStatus.evening },
  ];

  const IconMap = { morning: Sun, midday: Cloud, evening: Moon };

  return (
    <TouchableOpacity
      style={[styles.card, allComplete ? styles.cardComplete : styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.75}
      testID="daily-rituals-card"
    >
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>
            {allComplete ? 'All rituals complete ✨' : 'Daily Rituals'}
          </Text>
          <Text style={styles.subtitle}>
            {allComplete
              ? 'You showed up for yourself today'
              : `${todayStatus.completedCount}/3 complete`}
          </Text>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </View>

      <View style={styles.ritualsRow}>
        {ritualItems.map(({ type, done }) => {
          const config = RITUAL_CONFIG[type];
          const Icon = IconMap[type];
          const isCurrent = currentRitual === type && !done;

          return (
            <View
              key={type}
              style={[
                styles.ritualPill,
                done && styles.ritualPillDone,
                isCurrent && styles.ritualPillCurrent,
              ]}
            >
              {done ? (
                <Check size={14} color={config.color} />
              ) : (
                <Icon size={14} color={isCurrent ? config.color : Colors.textMuted} />
              )}
              <Text
                style={[
                  styles.ritualPillText,
                  done && { color: config.color },
                  isCurrent && { color: config.color },
                ]}
              >
                {config.shortLabel}
              </Text>
              {isCurrent && <Clock size={10} color={config.color} />}
            </View>
          );
        })}
      </View>

      {streak.currentStreak > 0 && (
        <View style={styles.streakRow}>
          <Flame size={14} color="#E17055" />
          <Text style={styles.streakText}>{streak.currentStreak} day streak</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    backgroundColor: '#FFF8F3',
    borderWidth: 1,
    borderColor: '#F5E6D8',
  },
  cardComplete: {
    backgroundColor: '#F7FBF9',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  ritualsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  ritualPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 4,
  },
  ritualPillDone: {
    backgroundColor: '#E3EDE8',
  },
  ritualPillCurrent: {
    backgroundColor: '#FFF0E6',
    borderWidth: 1,
    borderColor: '#E8A87C',
  },
  ritualPillText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#E17055',
  },
});
