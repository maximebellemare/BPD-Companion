export type AIMode =
  | 'calm'
  | 'reflection'
  | 'clarity'
  | 'relationship'
  | 'action'
  | 'high_distress';

export interface AIModeConfig {
  id: AIMode;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  color: string;
  responseStyle: AIModeResponseStyle;
}

export interface AIModeResponseStyle {
  maxLength: 'short' | 'medium' | 'long';
  tone: string;
  priority: string;
  groundingFirst: boolean;
  askQuestions: boolean;
  maxQuestions: number;
  suggestActions: boolean;
}

export interface AIModeDetectionContext {
  messageContent: string;
  distressLevel?: number;
  recentTriggers?: string[];
  recentEmotions?: string[];
  conversationHistory?: Array<{ role: string; content: string }>;
  relationshipSignals?: boolean;
  intensityTrend?: string;
  averageIntensity?: number;
}

export interface AIModeDetectionResult {
  mode: AIMode;
  confidence: number;
  reason: string;
  wasAutoDetected: boolean;
}

export interface AIModeState {
  currentMode: AIMode;
  isManual: boolean;
  detectionResult: AIModeDetectionResult | null;
  history: AIModeHistoryEntry[];
}

export interface AIModeHistoryEntry {
  mode: AIMode;
  timestamp: number;
  wasManual: boolean;
}
