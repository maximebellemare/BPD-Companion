export interface EmotionalLandscape {
  strongestEmotions: { label: string; emoji: string; count: number; trend: 'rising' | 'falling' | 'steady' }[];
  keyTriggers: { label: string; count: number; category: string }[];
  intensityTrend: 'decreasing' | 'increasing' | 'stable';
  avgIntensity: number;
  peakDay: string | null;
  narrative: string;
}

export interface RelationshipReflection {
  communicationThemes: string[];
  reassurancePatterns: { description: string; frequency: number }[];
  conflictImprovements: string[];
  pauseGrowth: { thisWeek: number; lastWeek: number; direction: 'improving' | 'declining' | 'stable' };
  narrative: string;
}

export interface WhatHelpedSection {
  effectiveTools: { tool: string; timesUsed: number; effectivenessNote: string }[];
  successfulPauses: number;
  helpfulPractices: string[];
  narrative: string;
}

export interface GrowthSignalSection {
  improvements: { area: string; description: string; icon: string }[];
  awarenessGains: string[];
  communicationWins: string[];
  narrative: string;
}

export interface NextWeekFocus {
  suggestedTheme: string;
  themeReason: string;
  skillToPractice: string;
  skillDescription: string;
  behavioralShift: string;
  shiftDescription: string;
}

export type ReflectionFeedback = 'accurate' | 'saved' | 'discuss';

export interface WeeklyReflection {
  id: string;
  generatedAt: number;
  weekLabel: string;
  weekStartDate: string;
  weekEndDate: string;
  openingNarrative: string;
  emotionalLandscape: EmotionalLandscape;
  relationshipReflection: RelationshipReflection;
  whatHelped: WhatHelpedSection;
  growthSignals: GrowthSignalSection;
  nextWeekFocus: NextWeekFocus;
  closingMessage: string;
  feedback?: ReflectionFeedback;
  hasEnoughData: boolean;
}
