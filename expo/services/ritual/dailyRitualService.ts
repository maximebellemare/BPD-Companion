import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { DailyRitualEntry, RitualStreak } from '@/types/ritual';
import { getWeeklyReflection } from '@/services/ritual/dailyCheckInService';

export interface RitualAnalytics {
  weeklyTrend: 'improving' | 'declining' | 'stable' | 'not_enough_data';
  weeklyTrendLabel: string;
  mostCommonEmotion: { label: string; emoji: string; count: number } | null;
  daysCheckedIn: number;
  totalDaysThisWeek: number;
  averageStress: number;
  stressTrend: 'rising' | 'falling' | 'stable' | 'not_enough_data';
  stressTrendLabel: string;
  supportiveMessage: string;
}

const SUPPORTIVE_MESSAGES = {
  improving: [
    'Your emotional landscape seems to be shifting in a positive direction.',
    'There appears to be a gentle upward trend this week.',
    'Things seem to be feeling a little lighter lately.',
  ],
  declining: [
    'This week has felt heavier. That takes strength to face.',
    'It seems like things have been harder recently. You are still showing up.',
    'Difficult stretches happen. You are doing something brave by tracking this.',
  ],
  stable: [
    'Your week has been steady. Consistency is a quiet form of strength.',
    'Staying even can be its own kind of resilience.',
    'A stable week is worth noticing.',
  ],
  not_enough_data: [
    'Keep checking in — patterns will start to emerge.',
    'A few more days and this space will feel more personal.',
    'Each check-in builds a clearer picture of your inner world.',
  ],
};

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function computeRitualAnalytics(entries: DailyRitualEntry[]): RitualAnalytics {
  const weeklySummary = getWeeklyReflection(entries);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekEntries = entries.filter(e => e.timestamp >= weekAgo);

  const moodScores: Record<string, number> = {
    great: 5, good: 4, okay: 3, low: 2, struggling: 1,
  };

  let weeklyTrend: RitualAnalytics['weeklyTrend'] = 'not_enough_data';
  let weeklyTrendLabel = 'Not enough data yet';

  if (weekEntries.length >= 3) {
    const mid = Math.floor(weekEntries.length / 2);
    const sorted = [...weekEntries].sort((a, b) => a.timestamp - b.timestamp);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const avgFirst = firstHalf.reduce((s, e) => s + (moodScores[e.mood.id] ?? 3), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, e) => s + (moodScores[e.mood.id] ?? 3), 0) / secondHalf.length;
    const diff = avgSecond - avgFirst;

    if (diff > 0.4) {
      weeklyTrend = 'improving';
      weeklyTrendLabel = 'Trending up';
    } else if (diff < -0.4) {
      weeklyTrend = 'declining';
      weeklyTrendLabel = 'A harder stretch';
    } else {
      weeklyTrend = 'stable';
      weeklyTrendLabel = 'Steady week';
    }
  }

  let stressTrend: RitualAnalytics['stressTrend'] = 'not_enough_data';
  let stressTrendLabel = 'Not enough data';

  if (weekEntries.length >= 3) {
    const sorted = [...weekEntries].sort((a, b) => a.timestamp - b.timestamp);
    const mid = Math.floor(sorted.length / 2);
    const avgStressFirst = sorted.slice(0, mid).reduce((s, e) => s + e.stressLevel, 0) / mid;
    const avgStressSecond = sorted.slice(mid).reduce((s, e) => s + e.stressLevel, 0) / (sorted.length - mid);
    const stressDiff = avgStressSecond - avgStressFirst;

    if (stressDiff > 0.5) {
      stressTrend = 'rising';
      stressTrendLabel = 'Stress rising';
    } else if (stressDiff < -0.5) {
      stressTrend = 'falling';
      stressTrendLabel = 'Stress easing';
    } else {
      stressTrend = 'stable';
      stressTrendLabel = 'Stress steady';
    }
  }

  const emotionCounts = new Map<string, { label: string; emoji: string; count: number }>();
  weekEntries.forEach(e => {
    e.emotionTags.forEach(tag => {
      const existing = emotionCounts.get(tag.id);
      if (existing) {
        existing.count++;
      } else {
        emotionCounts.set(tag.id, { label: tag.label, emoji: tag.emoji, count: 1 });
      }
    });
  });

  const emotionsSorted = [...emotionCounts.values()].sort((a, b) => b.count - a.count);
  const mostCommonEmotion = emotionsSorted.length > 0 ? emotionsSorted[0] : null;

  return {
    weeklyTrend,
    weeklyTrendLabel,
    mostCommonEmotion,
    daysCheckedIn: weeklySummary.totalDays,
    totalDaysThisWeek: 7,
    averageStress: weeklySummary.averageStress,
    stressTrend,
    stressTrendLabel,
    supportiveMessage: pickRandom(SUPPORTIVE_MESSAGES[weeklyTrend]),
  };
}

export async function scheduleRitualReminder(hour: number = 9, minute: number = 0): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('[DailyRitualService] Notifications not supported on web');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[DailyRitualService] Notification permissions not granted');
      return null;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Check-In',
        body: 'Take a moment to check in with yourself today.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    console.log('[DailyRitualService] Scheduled daily reminder at', hour, ':', minute, 'id:', id);
    return id;
  } catch (error) {
    console.log('[DailyRitualService] Failed to schedule reminder:', error);
    return null;
  }
}

export async function cancelRitualReminders(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[DailyRitualService] Cancelled all reminders');
  } catch (error) {
    console.log('[DailyRitualService] Failed to cancel reminders:', error);
  }
}

export function getStreakMessage(streak: RitualStreak): string {
  if (streak.currentStreak === 0) return 'Start your streak today';
  if (streak.currentStreak === 1) return 'Day 1 — every journey starts here';
  if (streak.currentStreak <= 3) return `${streak.currentStreak} days strong`;
  if (streak.currentStreak <= 7) return `${streak.currentStreak} days — building a real habit`;
  if (streak.currentStreak <= 14) return `${streak.currentStreak} days — impressive consistency`;
  return `${streak.currentStreak} days — remarkable dedication`;
}
