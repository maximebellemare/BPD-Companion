import { RelationshipContext, EmotionalState, MessageIntent, MessageOutcome } from './messages';

export interface RelationshipPattern {
  relationship: RelationshipContext;
  emotionalTriggers: EmotionalFrequency[];
  commonIntents: IntentFrequency[];
  outcomes: OutcomeFrequency[];
  totalInteractions: number;
  conflictRate: number;
  rewriteStyles: StyleFrequency[];
}

export interface EmotionalFrequency {
  emotion: EmotionalState;
  count: number;
  percentage: number;
}

export interface IntentFrequency {
  intent: MessageIntent;
  count: number;
  percentage: number;
}

export interface OutcomeFrequency {
  outcome: MessageOutcome;
  count: number;
  percentage: number;
}

export interface StyleFrequency {
  style: string;
  count: number;
  percentage: number;
}

export interface RelationshipInsight {
  id: string;
  type: 'pattern' | 'trigger' | 'suggestion' | 'trend';
  title: string;
  description: string;
  emoji: string;
  severity: 'info' | 'gentle' | 'important';
}

export interface RelationshipSuggestion {
  id: string;
  title: string;
  description: string;
  emoji: string;
  actionLabel: string;
  actionRoute?: string;
}

export interface RelationshipAnalysis {
  patterns: RelationshipPattern[];
  insights: RelationshipInsight[];
  suggestions: RelationshipSuggestion[];
  topTriggerRelationship: RelationshipContext | null;
  mostCommonEmotion: EmotionalState | null;
  overallConflictTrend: 'rising' | 'stable' | 'falling' | 'insufficient_data';
  totalMessagesAnalyzed: number;
}
