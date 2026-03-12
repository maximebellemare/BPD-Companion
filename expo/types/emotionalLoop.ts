export type LoopNodeType =
  | 'trigger'
  | 'emotion'
  | 'urge'
  | 'behavior'
  | 'outcome'
  | 'coping';

export interface LoopNode {
  id: string;
  type: LoopNodeType;
  label: string;
  frequency: number;
  averageIntensity: number;
}

export interface LoopEdge {
  sourceId: string;
  targetId: string;
  occurrences: number;
  probability: number;
}

export interface EmotionalLoop {
  id: string;
  nodes: LoopNode[];
  edges: LoopEdge[];
  occurrences: number;
  lastSeen: number;
  averageDistress: number;
  narrative: string;
  category: LoopCategory;
}

export type LoopCategory =
  | 'trigger_chain'
  | 'emotion_chain'
  | 'behavior_chain'
  | 'coping_chain';

export interface InterruptPoint {
  id: string;
  loopId: string;
  afterNodeId: string;
  afterNodeLabel: string;
  suggestions: InterruptSuggestion[];
  narrative: string;
}

export interface InterruptSuggestion {
  id: string;
  label: string;
  description: string;
  route: string;
  icon: string;
  effectiveness: number;
}

export interface EmotionalLoopReport {
  triggerChains: EmotionalLoop[];
  emotionChains: EmotionalLoop[];
  behaviorChains: EmotionalLoop[];
  interruptPoints: InterruptPoint[];
  topInsight: string;
  lastUpdated: number;
  totalPatternsDetected: number;
}
