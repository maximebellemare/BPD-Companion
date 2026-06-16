import { DailyRitualEntry, DailyMood, EmotionTag, WeeklyReflectionSummary } from '@/types/ritual';

export const DAILY_MOODS: DailyMood[] = [
  { id: 'great', emoji: '😊', label: 'Great', color: '#14B8A6' },
  { id: 'good', emoji: '🙂', label: 'Good', color: '#14B8A6' },
  { id: 'okay', emoji: '😐', label: 'Okay', color: '#67E8F9' },
  { id: 'low', emoji: '😔', label: 'Low', color: '#67E8F9' },
  { id: 'struggling', emoji: '😢', label: 'Struggling', color: '#3B82F6' },
];

export const RITUAL_EMOTION_TAGS: EmotionTag[] = [
  { id: 're1', label: 'Hopeful', emoji: '🌱' },
  { id: 're2', label: 'Grateful', emoji: '🙏' },
  { id: 're3', label: 'Calm', emoji: '🌊' },
  { id: 're4', label: 'Anxious', emoji: '😟' },
  { id: 're5', label: 'Lonely', emoji: '🫂' },
  { id: 're6', label: 'Frustrated', emoji: '😤' },
  { id: 're7', label: 'Sad', emoji: '💧' },
  { id: 're8', label: 'Loved', emoji: '💕' },
  { id: 're9', label: 'Restless', emoji: '🌀' },
  { id: 're10', label: 'Peaceful', emoji: '☁️' },
  { id: 're11', label: 'Overwhelmed', emoji: '🌊' },
  { id: 're12', label: 'Motivated', emoji: '✨' },
  { id: 're13', label: 'Numb', emoji: '🫥' },
  { id: 're14', label: 'Afraid', emoji: '😰' },
  { id: 're15', label: 'Content', emoji: '😌' },
  { id: 're16', label: 'Irritable', emoji: '😒' },
];

export const REFLECTION_PROMPTS = [
  "What's one small thing that went well today?",
  "What do you need most right now?",
  "What are you carrying that you could set down?",
  "What would you tell a friend feeling this way?",
  "What moment today made you feel most like yourself?",
  "What is one kind thing you did for yourself today?",
  "What emotion surprised you today?",
  "What are you learning about yourself lately?",
];

export const INTENTION_SUGGESTIONS = [
  'Be gentle with myself',
  'Take one thing at a time',
  'Reach out to someone I trust',
  'Practice a coping skill',
  'Set one small boundary',
  'Move my body',
  'Rest without guilt',
  'Stay present',
  'Let go of something I cannot control',
  'Celebrate a small win',
];

export function getRandomReflectionPrompt(): string {
  return REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function hasCheckedInToday(entries: DailyRitualEntry[]): boolean {
  const today = getTodayDateString();
  return entries.some(e => e.date === today);
}

export function getTodayEntry(entries: DailyRitualEntry[]): DailyRitualEntry | undefined {
  const today = getTodayDateString();
  return entries.find(e => e.date === today);
}

export function getWeeklyReflection(entries: DailyRitualEntry[]): WeeklyReflectionSummary {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekEntries = entries.filter(e => e.timestamp >= weekAgo);

  const moodScores: Record<string, number> = {
    great: 5,
    good: 4,
    okay: 3,
    low: 2,
    struggling: 1,
  };

  const avgScore = weekEntries.length > 0
    ? weekEntries.reduce((sum, e) => sum + (moodScores[e.mood.id] ?? 3), 0) / weekEntries.length
    : 0;

  let averageMood = 'No data';
  if (avgScore >= 4.5) averageMood = 'Great';
  else if (avgScore >= 3.5) averageMood = 'Good';
  else if (avgScore >= 2.5) averageMood = 'Okay';
  else if (avgScore >= 1.5) averageMood = 'Low';
  else if (avgScore > 0) averageMood = 'Struggling';

  const emotionCounts = new Map<string, { tag: EmotionTag; count: number }>();
  weekEntries.forEach(e => {
    e.emotionTags.forEach(tag => {
      const existing = emotionCounts.get(tag.id);
      if (existing) {
        existing.count++;
      } else {
        emotionCounts.set(tag.id, { tag, count: 1 });
      }
    });
  });

  const topEmotions = [...emotionCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(e => e.tag);

  const avgStress = weekEntries.length > 0
    ? weekEntries.reduce((sum, e) => sum + e.stressLevel, 0) / weekEntries.length
    : 0;

  return {
    averageMood,
    averageStress: Math.round(avgStress * 10) / 10,
    topEmotions,
    totalDays: weekEntries.length,
    entries: weekEntries,
  };
}
