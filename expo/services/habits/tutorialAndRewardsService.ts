import { JournalEntry } from '@/types';
import { storageService } from '@/services/storage/storageService';

export const TODAY_TUTORIAL_KEY = 'today_tutorial_seen_v1';
const ACHIEVEMENTS_KEY = 'habit_achievements_seen_v1';

export type HabitAchievementId =
  | 'first_checkin'
  | 'first_insight'
  | 'first_calm_me_down'
  | 'first_saved_insight'
  | 'five_day_reflection'
  | 'seven_day_checkin'
  | 'first_week_complete'
  | 'first_community_post'
  | 'first_dont_send_it'
  | 'first_week_completed';

export interface HabitAchievement {
  id: HabitAchievementId;
  title: string;
  body: string;
}

export async function hasSeenTodayTutorial(): Promise<boolean> {
  return (await storageService.get<boolean>(TODAY_TUTORIAL_KEY)) === true;
}

export async function markTodayTutorialSeen(): Promise<void> {
  await storageService.set(TODAY_TUTORIAL_KEY, true);
}

export async function resetTodayTutorial(): Promise<void> {
  await storageService.remove(TODAY_TUTORIAL_KEY);
}

async function loadSeenAchievements(): Promise<HabitAchievementId[]> {
  return (await storageService.get<HabitAchievementId[]>(ACHIEVEMENTS_KEY)) ?? [];
}

async function markAchievementSeen(id: HabitAchievementId): Promise<void> {
  const seen = await loadSeenAchievements();
  if (!seen.includes(id)) {
    await storageService.set(ACHIEVEMENTS_KEY, [...seen, id]);
  }
}

function getStreak(entries: JournalEntry[]): number {
  const days = new Set(entries.map(entry => new Date(entry.timestamp).toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 30; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function getNextHabitAchievement(params: {
  entries: JournalEntry[];
  savedInsightCount?: number;
  dontSendItCount?: number;
  calmSessionCount?: number;
  communityPostCount?: number;
}): Promise<HabitAchievement | null> {
  const seen = await loadSeenAchievements();
  const checkIns = params.entries.length;
  const streak = getStreak(params.entries);
  const reflectionDays = new Set(params.entries.map(entry => new Date(entry.timestamp).toISOString().slice(0, 10))).size;
  const candidates: HabitAchievement[] = [
    { id: 'first_checkin', title: 'First Check-In', body: 'You created the first signal in your emotional map.' },
    { id: 'first_insight', title: 'First Insight', body: 'A pattern is starting to become visible.' },
    { id: 'first_calm_me_down', title: 'First Calm Me Down', body: 'You practiced settling your body before moving forward.' },
    { id: 'first_saved_insight', title: 'First Saved Insight', body: 'You kept something meaningful for later reflection.' },
    { id: 'five_day_reflection', title: '5 Day Reflection', body: 'Reflection is becoming part of how you care for yourself.' },
    { id: 'seven_day_checkin', title: '7 Day Check-In', body: 'Seven days of awareness gives your patterns more shape.' },
    { id: 'first_week_complete', title: 'First Week Complete', body: 'Your first week of signals is ready to become insight.' },
    { id: 'first_community_post', title: 'First Community Post', body: 'You reached for peer support without having to carry it alone.' },
    { id: 'first_dont_send_it', title: "First Don't Send It", body: 'You made space between emotion and action.' },
  ];
  const unlocked = candidates.find((item) => {
    if (seen.includes(item.id)) return false;
    if (item.id === 'first_checkin') return checkIns >= 1;
    if (item.id === 'first_insight') return checkIns >= 3;
    if (item.id === 'first_calm_me_down') return (params.calmSessionCount ?? 0) > 0;
    if (item.id === 'first_saved_insight') return (params.savedInsightCount ?? 0) > 0;
    if (item.id === 'five_day_reflection') return reflectionDays >= 5;
    if (item.id === 'seven_day_checkin') return streak >= 7 || checkIns >= 7;
    if (item.id === 'first_week_complete') return checkIns >= 7;
    if (item.id === 'first_community_post') return (params.communityPostCount ?? 0) > 0;
    if (item.id === 'first_dont_send_it') return (params.dontSendItCount ?? 0) > 0;
    return false;
  });

  if (!unlocked) return null;
  await markAchievementSeen(unlocked.id);
  return unlocked;
}
