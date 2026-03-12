export interface Emotion {
  id: string;
  label: string;
  emoji: string;
  intensity?: number;
}

export interface Trigger {
  id: string;
  label: string;
  category: 'relationship' | 'self' | 'situation' | 'memory' | 'other';
}

export interface BodySensation {
  id: string;
  label: string;
  area: string;
}

export interface Urge {
  id: string;
  label: string;
  risk: 'low' | 'medium' | 'high';
}

export interface CheckInEntry {
  id: string;
  timestamp: number;
  triggers: Trigger[];
  emotions: Emotion[];
  urges: Urge[];
  bodySensations: BodySensation[];
  intensityLevel: number;
  notes: string;
  copingUsed?: string[];
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  checkIn: CheckInEntry;
  reflection?: string;
  outcome?: 'managed' | 'struggled' | 'neutral';
}

export interface MessageDraft {
  id: string;
  timestamp: number;
  originalText: string;
  rewrittenText?: string;
  rewriteType?: 'softer' | 'clearer' | 'boundary' | 'nosend';
  sent: boolean;
  paused: boolean;
}

export type DistressLevel = 'low' | 'moderate' | 'high' | 'crisis';

export type CopingCategory = 'grounding' | 'self-soothing' | 'reality-check' | 'opposite-action';

export interface CopingExercise {
  id: string;
  title: string;
  description: string;
  category: CopingCategory;
  duration: string;
  steps: string[];
}
