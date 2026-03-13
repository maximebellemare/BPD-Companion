export interface CoachingMoment {
  id: string;
  timestamp: number;
  type: 'pattern_insight' | 'timing_nudge' | 'coping_suggestion' | 'growth_recognition' | 'relationship_coaching' | 'regulation_tip';
  title: string;
  message: string;
  detail?: string;
  confidence: 'low' | 'moderate' | 'high';
  tone: 'encouraging' | 'grounding' | 'reflective' | 'celebratory';
  basedOn: string[];
  suggestedAction?: CoachAction;
  dismissed: boolean;
  helpful?: boolean;
}

export interface CoachAction {
  label: string;
  route: string;
  icon: string;
}

export interface BehavioralCoachProfile {
  lastUpdated: number;
  totalMoments: number;
  topPatternInsights: PatternCoachInsight[];
  timingNudges: TimingNudge[];
  copingSuggestions: CopingSuggestion[];
  growthRecognitions: GrowthRecognition[];
  relationshipCoaching: RelationshipCoachMoment[];
  regulationTips: RegulationTip[];
  dailySummary: string;
  weeklyTheme: string;
}

export interface PatternCoachInsight {
  id: string;
  pattern: string;
  observation: string;
  coaching: string;
  frequency: number;
  lastSeen: number;
  category: 'trigger' | 'emotion' | 'urge' | 'behavior';
}

export interface TimingNudge {
  id: string;
  context: string;
  suggestion: string;
  bestTimeWindow: string;
  reasoning: string;
}

export interface CopingSuggestion {
  id: string;
  situation: string;
  tool: string;
  why: string;
  effectiveness: number;
  alternativeTool?: string;
}

export interface GrowthRecognition {
  id: string;
  area: string;
  description: string;
  metric: string;
  direction: 'improving' | 'maintained';
  narrative: string;
}

export interface RelationshipCoachMoment {
  id: string;
  pattern: string;
  coaching: string;
  valuesAlignment: string;
  suggestedResponse: string;
}

export interface RegulationTip {
  id: string;
  trigger: string;
  currentPattern: string;
  suggestedShift: string;
  distressRange: string;
  tool: string;
}

export interface CoachSessionSummary {
  date: string;
  moments: CoachingMoment[];
  primaryFocus: string;
  overallTone: 'encouraging' | 'grounding' | 'reflective';
  hasEnoughData: boolean;
}
