export interface TherapyReportEmotionSummary {
  label: string;
  emoji: string;
  count: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TherapyReportTriggerSummary {
  label: string;
  category: string;
  count: number;
  associatedEmotions: string[];
}

export interface TherapyReportDistressTrend {
  average: number;
  peak: number;
  lowest: number;
  direction: 'improving' | 'worsening' | 'stable';
  dailyPoints: { day: string; value: number }[];
  narrative: string;
}

export interface TherapyReportRelationshipSection {
  topTriggers: string[];
  communicationPatterns: string[];
  rewriteCount: number;
  pauseCount: number;
  narrative: string;
}

export interface TherapyReportCopingSection {
  toolsUsed: { tool: string; count: number; effectiveness: 'helpful' | 'moderate' | 'unclear' }[];
  mostEffective: string | null;
  narrative: string;
}

export interface TherapyReportProgressSection {
  highlights: string[];
  skillsGained: string[];
  narrative: string;
}

export interface TherapyReportUrgeSection {
  topUrges: { label: string; count: number; risk: string }[];
  narrative: string;
}

export interface TherapyDiscussionPrompt {
  topic: string;
  context: string;
  category: 'emotional' | 'relational' | 'behavioral' | 'growth';
}

export type TherapyReportPeriod = '7' | '14' | '30';

export interface TherapyReport {
  id: string;
  generatedAt: number;
  periodDays: number;
  periodLabel: string;
  dateRange: string;
  overviewNarrative: string;
  emotions: TherapyReportEmotionSummary[];
  triggers: TherapyReportTriggerSummary[];
  distressTrend: TherapyReportDistressTrend;
  relationships: TherapyReportRelationshipSection;
  coping: TherapyReportCopingSection;
  urges: TherapyReportUrgeSection;
  progress: TherapyReportProgressSection;
  therapistNote: string;
  checkInCount: number;
  journalReflectionCount: number;
  discussionPrompts: TherapyDiscussionPrompt[];
  hasEnoughData: boolean;
}
