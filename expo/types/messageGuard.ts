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

const toneMeta: Record<MessageTone, { label: string; emoji: string; color: string; description: string }> = {
  anxious: { label: 'Anxious', emoji: '😰', color: '#67E8F9', description: 'Driven by fear of losing connection' },
  avoidant: { label: 'Avoidant', emoji: '🧊', color: '#3B82F6', description: 'Pulling away to protect yourself' },
  angry: { label: 'Angry', emoji: '🔥', color: '#3B82F6', description: 'Pain expressed as frustration' },
  over_explaining: { label: 'Over-explaining', emoji: '📝', color: '#3B82F6', description: 'Trying to control how they see you' },
  secure: { label: 'Secure', emoji: '🌿', color: '#14B8A6', description: 'Grounded, clear, and self-respecting' },
};

localizedFields(toneMeta.anxious, {
  label: { en: 'Anxious', es: 'Ansioso' },
  description: { en: 'Driven by fear of losing connection', es: 'Impulsado por el miedo a perder conexión' },
});
localizedFields(toneMeta.avoidant, {
  label: { en: 'Avoidant', es: 'Evitativo' },
  description: { en: 'Pulling away to protect yourself', es: 'Alejarte para protegerte' },
});
localizedFields(toneMeta.angry, {
  label: { en: 'Angry', es: 'Enojado' },
  description: { en: 'Pain expressed as frustration', es: 'Dolor expresado como frustración' },
});
localizedFields(toneMeta.over_explaining, {
  label: { en: 'Over-explaining', es: 'Sobreexplicando' },
  description: { en: 'Trying to control how they see you', es: 'Intentando controlar cómo te ven' },
});
localizedFields(toneMeta.secure, {
  label: { en: 'Secure', es: 'Seguro' },
  description: { en: 'Grounded, clear, and self-respecting', es: 'Centrado, claro y con respeto propio' },
});

export const TONE_META = toneMeta;

const emotionalSignalMeta: Record<EmotionalSignal, { label: string; emoji: string }> = {
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

localizedField(emotionalSignalMeta.abandonment_fear, 'label', 'Abandonment fear', 'Miedo al abandono');
localizedField(emotionalSignalMeta.rejection_sensitivity, 'label', 'Rejection sensitivity', 'Sensibilidad al rechazo');
localizedField(emotionalSignalMeta.urgency, 'label', 'Urgency', 'Urgencia');
localizedField(emotionalSignalMeta.shame, 'label', 'Shame', 'Vergüenza');
localizedField(emotionalSignalMeta.anger, 'label', 'Anger', 'Enojo');
localizedField(emotionalSignalMeta.people_pleasing, 'label', 'People-pleasing', 'Complacer a otros');
localizedField(emotionalSignalMeta.self_blame, 'label', 'Self-blame', 'Autoculpa');
localizedField(emotionalSignalMeta.catastrophizing, 'label', 'Catastrophizing', 'Catastrofización');
localizedField(emotionalSignalMeta.reassurance_seeking, 'label', 'Reassurance-seeking', 'Búsqueda de seguridad');

export const EMOTIONAL_SIGNAL_META = emotionalSignalMeta;

export const DELAY_OPTIONS: DelayOption[] = [
  localizedField({ id: 'delay_2', label: '2 min', minutes: 2, description: 'A quick breath' }, 'description', 'A quick breath', 'Una respiración rápida'),
  localizedField({ id: 'delay_5', label: '5 min', minutes: 5, description: 'Time to ground' }, 'description', 'Time to ground', 'Tiempo para aterrizar'),
  localizedField({ id: 'delay_10', label: '10 min', minutes: 10, description: 'Space to reflect' }, 'description', 'Space to reflect', 'Espacio para reflexionar'),
];
import { localizedField, localizedFields } from '@/lib/i18n/staticText';
