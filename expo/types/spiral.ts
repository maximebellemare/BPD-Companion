export type SpiralRiskLevel = 'low' | 'moderate' | 'high';

export type SpiralSignalType =
  | 'rapid_distress_escalation'
  | 'repeated_rejection_language'
  | 'relationship_conflict_loop'
  | 'late_night_spike'
  | 'emotional_volatility'
  | 'shame_cascade'
  | 'urge_intensification'
  | 'coping_abandonment'
  | 'isolation_pattern'
  | 'poor_sleep_vulnerability'
  | 'conversation_spiral_language'
  | 'familiar_spiral_pattern';

export interface SpiralSignal {
  id: string;
  type: SpiralSignalType;
  label: string;
  narrative: string;
  weight: number;
  dataPoints: number;
  detectedAt: number;
}

export interface SpiralIntervention {
  id: string;
  type: 'pause' | 'grounding' | 'breathing' | 'journal' | 'ai_companion' | 'dbt_tool' | 'relationship_copilot' | 'message_guard';
  title: string;
  description: string;
  route: string;
  icon: string;
  priority: number;
}

export interface SpiralDetectionResult {
  riskLevel: SpiralRiskLevel;
  signals: SpiralSignal[];
  interventions: SpiralIntervention[];
  narrative: string | null;
  confidenceScore: number;
  shouldIntervene: boolean;
  suggestedAction: SpiralIntervention | null;
  detectedAt: number;
}

export interface SpiralHistoryEntry {
  id: string;
  timestamp: number;
  riskLevel: SpiralRiskLevel;
  signals: SpiralSignalType[];
  interventionUsed: string | null;
  interventionSkipped: boolean;
  distressBefore: number | null;
  distressAfter: number | null;
}

export interface SpiralWeeklyInsight {
  id: string;
  weekStart: number;
  weekEnd: number;
  peakRiskLevel: SpiralRiskLevel;
  mostCommonSignals: { type: SpiralSignalType; count: number }[];
  spikeTimeOfDay: string | null;
  commonTriggers: string[];
  relationshipTriggerCount: number;
  toolsThatHelped: string[];
  narrative: string;
}

export interface SpiralPausePromptConfig {
  title: string;
  message: string;
  options: {
    id: string;
    label: string;
    route: string | null;
    icon: string;
  }[];
}
