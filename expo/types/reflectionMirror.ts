export interface ReflectionTheme {
  id: string;
  label: string;
  emoji: string;
  description: string;
  frequency: number;
  trend: 'rising' | 'falling' | 'steady';
}

export interface RelationshipPattern {
  id: string;
  trigger: string;
  emotionalResponse: string;
  narrative: string;
  frequency: number;
}

export interface CopingInsight {
  id: string;
  tool: string;
  timesUsed: number;
  helpfulnessNote: string;
  emoji: string;
}

export interface GrowthSignal {
  id: string;
  area: string;
  description: string;
  emoji: string;
}

export interface ReflectionMirrorData {
  id: string;
  generatedAt: number;
  emotionalThemes: ReflectionTheme[];
  relationshipPatterns: RelationshipPattern[];
  copingInsights: CopingInsight[];
  growthSignals: GrowthSignal[];
  openingReflection: string;
  hasEnoughData: boolean;
}
