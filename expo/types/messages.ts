export type RelationshipContext =
  | 'romantic_partner'
  | 'ex'
  | 'friend'
  | 'family'
  | 'coworker';

export type EmotionalState =
  | 'abandoned'
  | 'angry'
  | 'anxious'
  | 'ashamed'
  | 'confused'
  | 'numb'
  | 'hurt';

export type MessageIntent =
  | 'reconnect'
  | 'express_hurt'
  | 'ask_reassurance'
  | 'set_boundary'
  | 'apologize'
  | 'pause_not_send';

export type DesiredOutcome =
  | 'feel_heard'
  | 'avoid_conflict'
  | 'communicate_clearly'
  | 'protect_dignity'
  | 'slow_down';

export type RewriteStyle =
  | 'softer'
  | 'clearer'
  | 'warmer'
  | 'boundaried'
  | 'secure'
  | 'delay'
  | 'nosend';

export interface MessageContext {
  relationship: RelationshipContext | null;
  emotionalState: EmotionalState | null;
  intent: MessageIntent | null;
  desiredOutcome: DesiredOutcome | null;
}

export interface RewriteResult {
  style: RewriteStyle;
  text: string;
  whyThisHelps: string;
}

export interface PauseDuration {
  label: string;
  seconds: number;
  description: string;
}

export interface TriggerSuggestion {
  label: string;
  description: string;
  relevance: string;
}

export type MessageOutcome = 'sent' | 'not_sent' | 'helped' | 'made_worse';

export const MESSAGE_OUTCOME_OPTIONS: { value: MessageOutcome; label: string; emoji: string; color: string }[] = [
  { value: 'sent', label: 'Sent', emoji: '📤', color: '#14B8A6' },
  { value: 'not_sent', label: 'Did not send', emoji: '🚫', color: '#3B82F6' },
  { value: 'helped', label: 'Helped', emoji: '💚', color: '#14B8A6' },
  { value: 'made_worse', label: 'Made things worse', emoji: '💔', color: '#3B82F6' },
];

export const RELATIONSHIP_OPTIONS: { value: RelationshipContext; label: string; emoji: string }[] = [
  { value: 'romantic_partner', label: 'Partner', emoji: '💕' },
  { value: 'ex', label: 'Ex', emoji: '💔' },
  { value: 'friend', label: 'Friend', emoji: '🤝' },
  { value: 'family', label: 'Family', emoji: '🏠' },
  { value: 'coworker', label: 'Coworker', emoji: '💼' },
];

export const EMOTIONAL_STATE_OPTIONS: { value: EmotionalState; label: string; emoji: string }[] = [
  { value: 'abandoned', label: 'Abandoned', emoji: '🥀' },
  { value: 'angry', label: 'Angry', emoji: '🔥' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'ashamed', label: 'Ashamed', emoji: '😣' },
  { value: 'confused', label: 'Confused', emoji: '🌀' },
  { value: 'numb', label: 'Numb', emoji: '🧊' },
  { value: 'hurt', label: 'Hurt', emoji: '💧' },
];

export const INTENT_OPTIONS: { value: MessageIntent; label: string; emoji: string }[] = [
  { value: 'reconnect', label: 'Reconnect', emoji: '🌱' },
  { value: 'express_hurt', label: 'Express hurt', emoji: '💬' },
  { value: 'ask_reassurance', label: 'Ask for reassurance', emoji: '🤲' },
  { value: 'set_boundary', label: 'Set a boundary', emoji: '🛡️' },
  { value: 'apologize', label: 'Apologize', emoji: '🕊️' },
  { value: 'pause_not_send', label: 'Pause & not send', emoji: '⏸️' },
];

export const OUTCOME_OPTIONS: { value: DesiredOutcome; label: string; emoji: string }[] = [
  { value: 'feel_heard', label: 'Feel heard', emoji: '👂' },
  { value: 'avoid_conflict', label: 'Avoid conflict', emoji: '☮️' },
  { value: 'communicate_clearly', label: 'Communicate clearly', emoji: '✨' },
  { value: 'protect_dignity', label: 'Protect my dignity', emoji: '👑' },
  { value: 'slow_down', label: 'Slow down', emoji: '🐢' },
];

export const PAUSE_DURATIONS: PauseDuration[] = [
  { label: '30 sec', seconds: 30, description: 'A quick breath' },
  { label: '2 min', seconds: 120, description: 'A moment to ground' },
  { label: '10 min', seconds: 600, description: 'Space to reflect' },
];
