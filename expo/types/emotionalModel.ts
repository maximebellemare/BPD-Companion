export interface EmotionalTriggerProfile {
  label: string;
  frequency: number;
  averageDistress: number;
  commonEmotions: string[];
  commonUrges: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface EmotionSequence {
  id: string;
  chain: string[];
  occurrences: number;
  averageIntensity: number;
  narrative: string;
}

export interface UrgeProfile {
  label: string;
  frequency: number;
  averageIntensity: number;
  associatedTriggers: string[];
  associatedEmotions: string[];
  managedRate: number;
}

export interface RelationshipTriggerProfile {
  label: string;
  frequency: number;
  emotionalResponse: string;
  typicalUrge: string;
  escalationRisk: 'low' | 'moderate' | 'high';
  narrative: string;
}

export interface CopingEffectiveness {
  tool: string;
  timesUsed: number;
  helpfulRate: number;
  bestForTriggers: string[];
  bestForEmotions: string[];
  narrative: string;
}

export interface EscalationPattern {
  id: string;
  triggerPhase: string;
  emotionalPhase: string;
  urgePhase: string;
  behaviorPhase: string;
  frequency: number;
  averagePeakDistress: number;
  interruptionSuccess: number;
  narrative: string;
}

export interface PersonalEmotionalModel {
  id: string;
  lastUpdated: number;
  dataPointCount: number;
  topTriggers: EmotionalTriggerProfile[];
  emotionSequences: EmotionSequence[];
  frequentUrges: UrgeProfile[];
  relationshipTriggers: RelationshipTriggerProfile[];
  effectiveCoping: CopingEffectiveness[];
  escalationPatterns: EscalationPattern[];
  overallDistressTrend: 'improving' | 'stable' | 'worsening' | 'unknown';
  averageDistress: number;
  modelNarrative: string;
  growthAreas: string[];
  attentionAreas: string[];
}

export interface EmotionalModelInsight {
  id: string;
  category: 'trigger' | 'emotion' | 'urge' | 'relationship' | 'coping' | 'escalation' | 'growth';
  title: string;
  narrative: string;
  confidence: 'low' | 'moderate' | 'high';
  sentiment: 'positive' | 'neutral' | 'cautious';
  icon: string;
}

export interface AIPersonalizationContext {
  topTriggersSummary: string;
  emotionPatternsSummary: string;
  urgeTendenciesSummary: string;
  relationshipPatternsSummary: string;
  copingStrengthsSummary: string;
  escalationRiskSummary: string;
  growthNarrative: string;
  fullContextString: string;
}
