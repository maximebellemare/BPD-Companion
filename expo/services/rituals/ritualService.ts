import {
  RitualType,
  RitualCompletion,
  RitualDayStatus,
  RitualStreakData,
} from '@/types/ritual';
import { localizedArrayProxy, localizedFields } from '@/lib/i18n/staticText';

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

const EMOTIONS_MORNING_ES = [
  { id: 'hopeful', label: 'Esperanzado/a', emoji: '🌱' },
  { id: 'anxious', label: 'Ansioso/a', emoji: '😟' },
  { id: 'calm', label: 'En calma', emoji: '🌊' },
  { id: 'tired', label: 'Cansado/a', emoji: '😴' },
  { id: 'energized', label: 'Con energía', emoji: '⚡' },
  { id: 'heavy', label: 'Pesado/a', emoji: '🪨' },
  { id: 'grateful', label: 'Agradecido/a', emoji: '🙏' },
  { id: 'uncertain', label: 'Inseguro/a', emoji: '🌫️' },
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

const EMOTIONS_EVENING_ES = [
  { id: 'relieved', label: 'Aliviado/a', emoji: '😮‍💨' },
  { id: 'proud', label: 'Orgulloso/a', emoji: '💪' },
  { id: 'drained', label: 'Agotado/a', emoji: '🫠' },
  { id: 'peaceful', label: 'En paz', emoji: '☁️' },
  { id: 'frustrated', label: 'Frustrado/a', emoji: '😤' },
  { id: 'sad', label: 'Triste', emoji: '💧' },
  { id: 'content', label: 'Contento/a', emoji: '😌' },
  { id: 'overwhelmed', label: 'Abrumado/a', emoji: '🌊' },
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

const INTENTION_SUGGESTIONS_ES = [
  'Ser amable conmigo',
  'Mantenerme presente en conversaciones',
  'Pausar antes de reaccionar',
  'Honrar mis límites',
  'Practicar autocompasión',
  'Atravesar la incomodidad poco a poco',
  'Pedir apoyo si lo necesito',
  'Celebrar avances pequeños',
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

const COPING_TOOLS_ES = [
  { id: 'breathing', label: 'Respiración', emoji: '🌬️' },
  { id: 'grounding', label: 'Anclaje', emoji: '🌿' },
  { id: 'journaling', label: 'Escritura', emoji: '📝' },
  { id: 'movement', label: 'Movimiento', emoji: '🏃' },
  { id: 'talking', label: 'Hablar con alguien', emoji: '💬' },
  { id: 'music', label: 'Música', emoji: '🎵' },
  { id: 'nature', label: 'Naturaleza', emoji: '🌳' },
  { id: 'rest', label: 'Descanso', emoji: '🛌' },
];

function localizeOptionArray<T extends { id: string; label: string }>(
  english: T[],
  spanish: Pick<T, 'id' | 'label'>[],
): T[] {
  return english.map(item => localizedFields({ ...item }, {
    label: {
      en: item.label,
      es: spanish.find(option => option.id === item.id)?.label ?? item.label,
    },
  }));
}

export const RITUAL_CONFIG = {
  morning: localizedFields({
    label: 'Morning Check-In',
    shortLabel: 'Morning',
    emoji: '🌅',
    color: '#67E8F9',
    prompt: 'How are you feeling today?',
    description: 'Start your day with awareness',
    windowStart: 5,
    windowEnd: 12,
    emotions: localizeOptionArray(EMOTIONS_MORNING, EMOTIONS_MORNING_ES),
    intentionSuggestions: localizedArrayProxy(INTENTION_SUGGESTIONS, INTENTION_SUGGESTIONS_ES),
  }, {
    label: { en: 'Morning Check-In', es: 'Check-in de la mañana' },
    shortLabel: { en: 'Morning', es: 'Mañana' },
    prompt: { en: 'How are you feeling today?', es: '¿Cómo te sientes hoy?' },
    description: { en: 'Start your day with awareness', es: 'Empieza el día con conciencia' },
  }),
  midday: localizedFields({
    label: 'Midday Pause',
    shortLabel: 'Midday',
    emoji: '☀️',
    color: '#14B8A6',
    prompt: 'Take a moment to breathe.',
    description: 'A gentle reset in the middle of your day',
    windowStart: 11,
    windowEnd: 17,
    emotions: [],
    intentionSuggestions: [],
  }, {
    label: { en: 'Midday Pause', es: 'Pausa del mediodía' },
    shortLabel: { en: 'Midday', es: 'Mediodía' },
    prompt: { en: 'Take a moment to breathe.', es: 'Toma un momento para respirar.' },
    description: { en: 'A gentle reset in the middle of your day', es: 'Un reinicio suave a mitad del día' },
  }),
  evening: localizedFields({
    label: 'Evening Reflection',
    shortLabel: 'Evening',
    emoji: '🌙',
    color: '#3B82F6',
    prompt: 'What stood out emotionally today?',
    description: 'Close the day with reflection',
    windowStart: 17,
    windowEnd: 24,
    emotions: localizeOptionArray(EMOTIONS_EVENING, EMOTIONS_EVENING_ES),
    copingTools: localizeOptionArray(COPING_TOOLS, COPING_TOOLS_ES),
  }, {
    label: { en: 'Evening Reflection', es: 'Reflexión de la noche' },
    shortLabel: { en: 'Evening', es: 'Noche' },
    prompt: { en: 'What stood out emotionally today?', es: '¿Qué destacó emocionalmente hoy?' },
    description: { en: 'Close the day with reflection', es: 'Cierra el día con reflexión' },
  }),
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
