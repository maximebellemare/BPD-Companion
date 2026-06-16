export type MessageTone =
  | 'anxious'
  | 'avoidant'
  | 'angry'
  | 'over_explaining'
  | 'secure';

export type EmotionalSignal =
  | 'abandonment_fear'
  | 'rejection_sensitivity'
  | 'urgency'
  | 'shame'
  | 'anger'
  | 'people_pleasing'
  | 'self_blame'
  | 'catastrophizing'
  | 'reassurance_seeking';

export interface ToneAnalysis {
  primaryTone: MessageTone;
  signals: EmotionalSignal[];
  urgencyLevel: number;
  emotionalIntensity: number;
}

export interface ResponseStyleCard {
  tone: MessageTone;
  label: string;
  emoji: string;
  color: string;
  rewrittenMessage: string;
  emotionalImpact: string;
  relationshipImpact: string;
  isRecommended: boolean;
}

export interface SecureRewriteOptions {
  reduceUrgency: boolean;
  removeBlame: boolean;
  addEmotionalClarity: boolean;
  addBoundaries: boolean;
}

export type DelayOption = {
  id: string;
  label: string;
  minutes: number;
  description: string;
};

export interface MessageGuardSession {
  id: string;
  originalMessage: string;
  toneAnalysis: ToneAnalysis;
  responseStyles: ResponseStyleCard[];
  selectedTone: MessageTone | null;
  secureRewrite: string | null;
  delayMinutes: number | null;
  savedAsDraft: boolean;
  timestamp: number;
}

export type MessageGuardStep =
  | 'input'
  | 'analysis'
  | 'styles'
  | 'refine'
  | 'pause';

export const TONE_META: Record<MessageTone, { label: string; emoji: string; color: string; description: string }> = {
  anxious: { label: 'Anxious', emoji: '😰', color: '#67E8F9', description: 'Driven by fear of losing connection' },
  avoidant: { label: 'Avoidant', emoji: '🧊', color: '#3B82F6', description: 'Pulling away to protect yourself' },
  angry: { label: 'Angry', emoji: '🔥', color: '#3B82F6', description: 'Pain expressed as frustration' },
  over_explaining: { label: 'Over-explaining', emoji: '📝', color: '#3B82F6', description: 'Trying to control how they see you' },
  secure: { label: 'Secure', emoji: '🌿', color: '#14B8A6', description: 'Grounded, clear, and self-respecting' },
};

export const EMOTIONAL_SIGNAL_META: Record<EmotionalSignal, { label: string; emoji: string }> = {
  abandonment_fear: { label: 'Abandonment fear', emoji: '🥀' },
  rejection_sensitivity: { label: 'Rejection sensitivity', emoji: '💔' },
  urgency: { label: 'Urgency', emoji: '⚡' },
  shame: { label: 'Shame', emoji: '😣' },
  anger: { label: 'Anger', emoji: '🔥' },
  people_pleasing: { label: 'People-pleasing', emoji: '🎭' },
  self_blame: { label: 'Self-blame', emoji: '😔' },
  catastrophizing: { label: 'Catastrophizing', emoji: '🌀' },
  reassurance_seeking: { label: 'Reassurance-seeking', emoji: '🤲' },
};

export const DELAY_OPTIONS: DelayOption[] = [
  { id: 'delay_2', label: '2 min', minutes: 2, description: 'A quick breath' },
  { id: 'delay_5', label: '5 min', minutes: 5, description: 'Time to ground' },
  { id: 'delay_10', label: '10 min', minutes: 10, description: 'Space to reflect' },
];
