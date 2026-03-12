export interface WeeklyIntensityPoint {
  day: string;
  value: number;
  date: string;
}

export interface TriggerFrequencyItem {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface MoodDistributionItem {
  label: string;
  emoji: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ExerciseEffectiveness {
  exerciseId: string;
  exerciseName: string;
  avgBefore: number;
  avgAfter: number;
  timesUsed: number;
  reduction: number;
}

export interface CopingToolUsage {
  label: string;
  count: number;
  percentage: number;
}

export interface InsightsSummary {
  totalCheckIns: number;
  averageDistress: number;
  topTriggerThisWeek: string | null;
  topEmotionThisMonth: string | null;
  topUrge: string | null;
  distressTrend: 'rising' | 'stable' | 'falling' | 'unknown';
  weeklyIntensity: WeeklyIntensityPoint[];
  triggerFrequency: TriggerFrequencyItem[];
  moodDistribution: MoodDistributionItem[];
  exerciseEffectiveness: ExerciseEffectiveness[];
  copingTools: CopingToolUsage[];
  streakDays: number;
  lastCheckIn: number | null;
}
