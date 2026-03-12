export type ResponseStyle = 'anxious' | 'calm' | 'boundary' | 'avoidance';

export interface EmotionalOutcome {
  emotion: string;
  intensity: 'low' | 'moderate' | 'high';
  description: string;
}

export interface RelationshipImpact {
  direction: 'positive' | 'neutral' | 'negative';
  description: string;
}

export interface SimulatedResponse {
  style: ResponseStyle;
  label: string;
  emoji: string;
  color: string;
  exampleResponse: string;
  emotionalOutcome: EmotionalOutcome;
  relationshipImpact: RelationshipImpact;
  healthierAlternative: string;
  isRecommended: boolean;
}

export interface SimulationResult {
  id: string;
  situation: string;
  timestamp: number;
  responses: SimulatedResponse[];
  summary: string;
}

export interface SimulationScenario {
  id: string;
  label: string;
  emoji: string;
  situation: string;
}
