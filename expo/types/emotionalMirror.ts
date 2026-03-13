export interface EmotionalMirrorInsight {
  id: string;
  title: string;
  description: string;
  evidence: string;
  supportiveNote: string;
  recommendedAction: string;
  category: 'trigger' | 'relationship' | 'coping' | 'distress' | 'growth' | 'pattern';
  severity: 'gentle' | 'notable' | 'important';
  timestamp: number;
}

export interface DetectedPattern {
  id: string;
  patternType: 'relationship_trigger' | 'time_distress' | 'emotional_loop' | 'coping_success' | 'escalation' | 'communication_anxiety' | 'abandonment_fear' | 'conflict_cycle';
  description: string;
  supportiveExplanation: string;
  recommendedInsight: string;
  occurrences: number;
  confidence: number;
}

export interface GrowthSignalMirror {
  id: string;
  label: string;
  description: string;
  evidence: string;
  signalType: 'reduced_distress' | 'paused_before_reacting' | 'used_grounding' | 'fewer_escalations' | 'consistent_checkins' | 'coping_improvement';
}

export interface EmotionalLandscape {
  dominantEmotions: Array<{ label: string; emoji: string; count: number; percentage: number }>;
  averageDistress: number;
  distressTrend: 'improving' | 'stable' | 'elevated' | 'insufficient';
  peakDistressDay: string | null;
  calmestDay: string | null;
  totalCheckIns: number;
}

export interface RelationshipMirrorPattern {
  id: string;
  description: string;
  frequency: number;
  relatedEmotions: string[];
  supportiveNote: string;
}

export interface CopingMirrorSummary {
  toolsUsed: Array<{ name: string; count: number; avgReduction: number }>;
  mostEffective: string | null;
  totalCopingEvents: number;
}

export interface EmotionalMirrorReport {
  id: string;
  generatedAt: number;
  periodStart: number;
  periodEnd: number;
  landscape: EmotionalLandscape;
  insights: EmotionalMirrorInsight[];
  patterns: DetectedPattern[];
  growthSignals: GrowthSignalMirror[];
  relationshipPatterns: RelationshipMirrorPattern[];
  copingSummary: CopingMirrorSummary;
  weekLabel: string;
}
