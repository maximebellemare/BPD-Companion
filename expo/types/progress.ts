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

export interface ProgressSummary {
  metrics: ProgressMetrics;
  weekComparison: WeekComparison;
  distressTrend: DistressTrendPoint[];
  emotionDistribution: EmotionDistributionItem[];
  copingSuccess: CopingSuccessItem[];
  encouragingMessage: string;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  label: string;
  achieved: boolean;
  icon: string;
  description: string;
}
