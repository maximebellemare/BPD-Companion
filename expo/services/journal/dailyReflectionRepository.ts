import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyReflection, DailyReflectionStreak } from '@/types/journalDaily';

const STORAGE_KEY = 'daily_reflections';

class DailyReflectionRepository {
  async getAll(): Promise<DailyReflection[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      console.log('[DailyReflectionRepo] Loaded', items.length, 'reflections');
      return items;
    } catch (error) {
      console.error('[DailyReflectionRepo] Failed to load:', error);
      return [];
    }
  }

  async save(items: DailyReflection[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      console.log('[DailyReflectionRepo] Saved', items.length, 'reflections');
    } catch (error) {
      console.error('[DailyReflectionRepo] Failed to save:', error);
    }
  }
}

export const dailyReflectionRepository = new DailyReflectionRepository();

export function computeReflectionStreak(reflections: DailyReflection[]): DailyReflectionStreak {
  if (reflections.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalMornings: reflections.filter(r => r.type === 'morning').length,
      totalEvenings: reflections.filter(r => r.type === 'evening').length,
      lastMorningDate: null,
      lastEveningDate: null,
      thisWeekDays: 0,
    };
  }

  const uniqueDates = [...new Set(reflections.map(r => r.date))].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  let currentStreak = 0;
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    if (uniqueDates.includes(dateStr)) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  let longestStreak = 0;
  let tempStreak = 0;
  const allDates = [...new Set(reflections.map(r => r.date))].sort();
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(allDates[i - 1]);
      const curr = new Date(allDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const thisWeekDays = uniqueDates.filter(d => d >= weekStartStr && d <= todayStr).length;

  const mornings = reflections.filter(r => r.type === 'morning');
  const evenings = reflections.filter(r => r.type === 'evening');

  return {
    currentStreak,
    longestStreak,
    totalMornings: mornings.length,
    totalEvenings: evenings.length,
    lastMorningDate: mornings.length > 0 ? mornings.sort((a, b) => b.timestamp - a.timestamp)[0].date : null,
    lastEveningDate: evenings.length > 0 ? evenings.sort((a, b) => b.timestamp - a.timestamp)[0].date : null,
    thisWeekDays,
  };
}
