export interface EmotionalPatternInsight {
  id: string;
  label: string;
  emoji: string;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  narrative: string;
}

export interface RelationshipPatternInsight {
  id: string;
  pattern: string;
  frequency: number;
  context: string;
  suggestion: string;
}

export interface ProgressHighlight {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: 'growth' | 'consistency' | 'skill' | 'awareness';
}

export interface SuggestedFocusArea {
  id: string;
  area: string;
  reason: string;
  actionLabel: string;
  route?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CopingStrategyInsight {
  id: string;
  tool: string;
  timesUsed: number;
  effectiveness: 'helpful' | 'moderate' | 'unclear';
  narrative: string;
}

export interface TherapySummaryReport {
  id: string;
  generatedAt: number;
  periodLabel: string;
  periodDays: number;
  overallNarrative: string;
  emotionalPatterns: EmotionalPatternInsight[];
  relationshipPatterns: RelationshipPatternInsight[];
  progressHighlights: ProgressHighlight[];
  suggestedFocusAreas: SuggestedFocusArea[];
  copingStrategies: CopingStrategyInsight[];
  closingReflection: string;
  hasEnoughData: boolean;
}
