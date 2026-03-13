export interface DailyMood {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

export interface EmotionTag {
  id: string;
  label: string;
  emoji: string;
}

export interface DailyRitualEntry {
  id: string;
  timestamp: number;
  date: string;
  mood: DailyMood;
  emotionTags: EmotionTag[];
  stressLevel: number;
  reflection: string;
  intention: string;
}

export interface RitualStreak {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string;
  totalCheckIns: number;
}

export interface WeeklyReflectionSummary {
  averageMood: string;
  averageStress: number;
  topEmotions: EmotionTag[];
  totalDays: number;
  entries: DailyRitualEntry[];
}

export interface RitualState {
  entries: DailyRitualEntry[];
  streak: RitualStreak;
}

export type RitualType = 'morning' | 'midday' | 'evening';

export interface RitualCompletion {
  id: string;
  date: string;
  timestamp: number;
  type: RitualType;
  emotion?: string;
  energyLevel?: number;
  intention?: string;
  keyMoment?: string;
  copingUsed?: string[];
  lessonLearned?: string;
  breathingCompleted?: boolean;
  groundingCompleted?: boolean;
}

export interface RitualDayStatus {
  date: string;
  morning: boolean;
  midday: boolean;
  evening: boolean;
  completedCount: number;
}

export interface RitualStreakData {
  currentStreak: number;
  longestStreak: number;
  lastRitualDate: string;
  totalCompletions: number;
  weeklyCompletionRate: number;
}

export interface DailyRitualsState {
  completions: RitualCompletion[];
  streak: RitualStreakData;
}
