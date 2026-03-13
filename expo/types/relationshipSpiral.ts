export type GuardAlertLevel = 'none' | 'gentle' | 'moderate' | 'strong';

export type ResponseSimulationType = 'urgent' | 'avoidant' | 'secure';

export interface ResponseSimulation {
  id: string;
  type: ResponseSimulationType;
  label: string;
  emoji: string;
  exampleMessage: string;
  emotionalImpact: string;
  relationshipImpact: string;
  color: string;
  isRecommended: boolean;
}

export interface GuardSignalSummary {
  id: string;
  category: 'communication' | 'abandonment' | 'reassurance' | 'messaging' | 'conflict' | 'distress';
  title: string;
  narrative: string;
  strength: number;
  detectedAt: number;
  relatedTriggers: string[];
}

export interface GuardIntervention {
  id: string;
  type: 'pause' | 'ground' | 'breathe' | 'simulate' | 'rewrite' | 'companion' | 'journal';
  title: string;
  description: string;
  route: string;
  icon: string;
  priority: number;
}

export interface SpiralGuardResult {
  alertLevel: GuardAlertLevel;
  signals: GuardSignalSummary[];
  interventions: GuardIntervention[];
  simulations: ResponseSimulation[];
  primaryMessage: string | null;
  supportNarrative: string | null;
  score: number;
  shouldShowGuard: boolean;
  lastAnalyzed: number;
}

export interface SpiralGuardHistoryEntry {
  id: string;
  timestamp: number;
  alertLevel: GuardAlertLevel;
  signalCount: number;
  interventionUsed: string | null;
  resolvedAt: number | null;
}
