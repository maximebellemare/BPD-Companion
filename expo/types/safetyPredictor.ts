export type SafetyState = 'calm' | 'elevated' | 'high_distress' | 'critical';

export interface EscalationSignal {
  id: string;
  type: 'rising_distress' | 'relationship_trigger' | 'repeated_rewrites' | 'abandonment_conversation' | 'coping_burst' | 'rapid_checkins' | 'high_urge_cluster';
  label: string;
  description: string;
  weight: number;
  timestamp: number;
}

export interface SafetyIntervention {
  id: string;
  type: 'grounding' | 'ai_reflection' | 'relationship_copilot' | 'message_pause' | 'crisis_regulation' | 'breathing' | 'check_in';
  title: string;
  description: string;
  route: string;
  icon: string;
  priority: number;
  urgency: SafetyState;
}

export interface SafetyPrediction {
  state: SafetyState;
  score: number;
  signals: EscalationSignal[];
  interventions: SafetyIntervention[];
  narrative: string | null;
  trend: 'escalating' | 'stable' | 'de_escalating' | 'unknown';
  lastUpdated: number;
}
