export interface ProgressMetrics {
  averageDistressIntensity: number;
  totalCheckIns: number;
  journalStreak: number;
  copingExercisesUsed: number;
  successfulMessagePauses: number;
  relationshipConflictReduction: number;
}

export interface WeekComparison {
  thisWeekAvgDistress: number;
  lastWeekAvgDistress: number;
  changePercent: number;
  direction: 'improved' | 'worsened' | 'stable';
}

export interface DistressTrendPoint {
  label: string;
  value: number;
  date: string;
}

export interface EmotionDistributionItem {
  label: string;
  emoji: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CopingSuccessItem {
  tool: string;
  timesUsed: number;
  avgReduction: number;
  successRate: number;
}

export interface Milestone {
  id: string;
  label: string;
  achieved: boolean;
  icon: string;
  description: string;
}

export interface RegulationBehavior {
  pausesBeforeSending: number;
  groundingUsed: number;
  safetyModeActivations: number;
  rewritesUsed: number;
  constructiveOutcomes: number;
}

export interface ConsistencyStreak {
  journalStreak: number;
  ritualStreak: number;
  companionSessions: number;
  weeklyActiveDays: number;
}

export interface TriggerFrequencyItem {
  label: string;
  count: number;
  category: string;
}

export interface EncouragingInsight {
  id: string;
  text: string;
  type: 'regulation' | 'consistency' | 'growth' | 'coping' | 'awareness';
  icon: string;
}

export interface ProgressSummary {
  metrics: ProgressMetrics;
  weekComparison: WeekComparison;
  distressTrend: DistressTrendPoint[];
  emotionDistribution: EmotionDistributionItem[];
  copingSuccess: CopingSuccessItem[];
  encouragingMessage: string;
  milestones: Milestone[];
  regulation: RegulationBehavior;
  consistency: ConsistencyStreak;
  triggerFrequency: TriggerFrequencyItem[];
  encouragingInsights: EncouragingInsight[];
  hasEnoughData: boolean;
}
