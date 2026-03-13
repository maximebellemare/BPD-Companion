import {
  RitualType,
  RitualCompletion,
  RitualDayStatus,
  RitualStreakData,
} from '@/types/ritual';

const EMOTIONS_MORNING = [
  { id: 'hopeful', label: 'Hopeful', emoji: '🌱' },
  { id: 'anxious', label: 'Anxious', emoji: '😟' },
  { id: 'calm', label: 'Calm', emoji: '🌊' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'energized', label: 'Energized', emoji: '⚡' },
  { id: 'heavy', label: 'Heavy', emoji: '🪨' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'uncertain', label: 'Uncertain', emoji: '🌫️' },
];

const EMOTIONS_EVENING = [
  { id: 'relieved', label: 'Relieved', emoji: '😮‍💨' },
  { id: 'proud', label: 'Proud', emoji: '💪' },
  { id: 'drained', label: 'Drained', emoji: '🫠' },
  { id: 'peaceful', label: 'Peaceful', emoji: '☁️' },
  { id: 'frustrated', label: 'Frustrated', emoji: '😤' },
  { id: 'sad', label: 'Sad', emoji: '💧' },
  { id: 'content', label: 'Content', emoji: '😌' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊' },
];

const INTENTION_SUGGESTIONS = [
  'Be gentle with myself',
  'Stay present in conversations',
  'Pause before reacting',
  'Honor my boundaries',
  'Practice self-compassion',
  'Move through discomfort slowly',
  'Reach out if I need support',
  'Celebrate small wins',
];

const COPING_TOOLS = [
  { id: 'breathing', label: 'Breathing', emoji: '🌬️' },
  { id: 'grounding', label: 'Grounding', emoji: '🌿' },
  { id: 'journaling', label: 'Journaling', emoji: '📝' },
  { id: 'movement', label: 'Movement', emoji: '🏃' },
  { id: 'talking', label: 'Talking to someone', emoji: '💬' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'nature', label: 'Nature', emoji: '🌳' },
  { id: 'rest', label: 'Rest', emoji: '🛌' },
];

export const RITUAL_CONFIG = {
  morning: {
    label: 'Morning Check-In',
    shortLabel: 'Morning',
    emoji: '🌅',
    color: '#E8A87C',
    prompt: 'How are you feeling today?',
    description: 'Start your day with awareness',
    windowStart: 5,
    windowEnd: 12,
    emotions: EMOTIONS_MORNING,
    intentionSuggestions: INTENTION_SUGGESTIONS,
  },
  midday: {
    label: 'Midday Pause',
    shortLabel: 'Midday',
    emoji: '☀️',
    color: '#6B9080',
    prompt: 'Take a moment to breathe.',
    description: 'A gentle reset in the middle of your day',
    windowStart: 11,
    windowEnd: 17,
    emotions: [],
    intentionSuggestions: [],
  },
  evening: {
    label: 'Evening Reflection',
    shortLabel: 'Evening',
    emoji: '🌙',
    color: '#7B8CDE',
    prompt: 'What stood out emotionally today?',
    description: 'Close the day with reflection',
    windowStart: 17,
    windowEnd: 24,
    emotions: EMOTIONS_EVENING,
    copingTools: COPING_TOOLS,
  },
} as const;

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentRitualType(): RitualType {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'midday';
  return 'evening';
}

export function getNextAvailableRitual(completions: RitualCompletion[]): RitualType | null {
  const today = getTodayDateString();
  const todayCompletions = completions.filter(c => c.date === today);
  const completedTypes = new Set(todayCompletions.map(c => c.type));

  const order: RitualType[] = ['morning', 'midday', 'evening'];
  const current = getCurrentRitualType();
  const currentIndex = order.indexOf(current);

  for (let i = currentIndex; i < order.length; i++) {
    if (!completedTypes.has(order[i])) return order[i];
  }

  for (let i = 0; i < currentIndex; i++) {
    if (!completedTypes.has(order[i])) return order[i];
  }

  return null;
}

export function isRitualCompleted(completions: RitualCompletion[], type: RitualType): boolean {
  const today = getTodayDateString();
  return completions.some(c => c.date === today && c.type === type);
}

export function getTodayStatus(completions: RitualCompletion[]): RitualDayStatus {
  const today = getTodayDateString();
  const todayCompletions = completions.filter(c => c.date === today);
  const completedTypes = new Set(todayCompletions.map(c => c.type));

  return {
    date: today,
    morning: completedTypes.has('morning'),
    midday: completedTypes.has('midday'),
    evening: completedTypes.has('evening'),
    completedCount: completedTypes.size,
  };
}

export function computeRitualStreak(completions: RitualCompletion[]): RitualStreakData {
  if (completions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastRitualDate: '',
      totalCompletions: 0,
      weeklyCompletionRate: 0,
    };
  }

  const dateSet = new Set(completions.map(c => c.date));
  const sortedDates = [...dateSet].sort().reverse();
  const today = getTodayDateString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]).getTime();
      const curr = new Date(sortedDates[i]).getTime();
      if (prev - curr <= 86400000 * 1.5) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  let longestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]).getTime();
    const curr = new Date(sortedDates[i]).getTime();
    if (prev - curr <= 86400000 * 1.5) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekCompletions = completions.filter(c => c.timestamp >= weekAgo);
  const weekDays = new Set(weekCompletions.map(c => c.date)).size;
  const weeklyCompletionRate = Math.round((weekDays / 7) * 100);

  return {
    currentStreak: Math.max(currentStreak, 0),
    longestStreak: Math.max(longestStreak, currentStreak),
    lastRitualDate: sortedDates[0] ?? '',
    totalCompletions: completions.length,
    weeklyCompletionRate,
  };
}

export function getRecentReflections(completions: RitualCompletion[], limit: number = 5): RitualCompletion[] {
  return completions
    .filter(c => c.keyMoment || c.lessonLearned || c.intention)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function getWeeklyRitualData(completions: RitualCompletion[]): RitualDayStatus[] {
  const days: RitualDayStatus[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const dayCompletions = completions.filter(c => c.date === date);
    const types = new Set(dayCompletions.map(c => c.type));
    days.push({
      date,
      morning: types.has('morning'),
      midday: types.has('midday'),
      evening: types.has('evening'),
      completedCount: types.size,
    });
  }
  return days;
}

export function getRitualStreakMessage(streak: RitualStreakData): string {
  if (streak.currentStreak === 0) return 'Start your ritual streak today';
  if (streak.currentStreak === 1) return 'Day 1 — every journey starts here';
  if (streak.currentStreak <= 3) return `${streak.currentStreak} days of showing up`;
  if (streak.currentStreak <= 7) return `${streak.currentStreak} days — building a real habit`;
  if (streak.currentStreak <= 14) return `${streak.currentStreak} days — impressive consistency`;
  return `${streak.currentStreak} days — remarkable dedication`;
}

export { COPING_TOOLS };
