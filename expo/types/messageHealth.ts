export interface MessageHealthScore {
  urgency: number;
  blame: number;
  reassuranceSeeking: number;
  overexplaining: number;
  hostility: number;
  clarity: number;
  emotionalFlooding: number;
  boundaryStrength: number;
  selfRespect: number;
  escalationRisk: number;
}

export type SendRecommendation =
  | 'safe_to_send'
  | 'better_after_pause'
  | 'better_rewritten'
  | 'better_not_sent';

export interface MessageHealthAnalysis {
  score: MessageHealthScore;
  overallRisk: number;
  recommendation: SendRecommendation;
  recommendationMessage: string;
  recommendationDetail: string;
  topConcerns: MessageConcern[];
  strengths: string[];
}

export interface MessageConcern {
  dimension: keyof MessageHealthScore;
  level: 'low' | 'moderate' | 'high';
  label: string;
  description: string;
}

export type MessageEmotionalState =
  | 'angry'
  | 'hurt'
  | 'anxious'
  | 'ashamed'
  | 'rejected'
  | 'overwhelmed'
  | 'confused'
  | 'calm_unsure';

export type MessageInterpretation =
  | 'no_respect'
  | 'rejecting_me'
  | 'dont_care'
  | 'being_dismissed'
  | 'not_sure';

export type MessageUrge =
  | 'explain_myself'
  | 'text_again'
  | 'demand_clarity'
  | 'withdraw'
  | 'apologize'
  | 'set_boundary'
  | 'attack'
  | 'ask_reassurance';

export type MessageDesiredOutcome =
  | 'feel_heard'
  | 'avoid_conflict'
  | 'protect_dignity'
  | 'reconnect'
  | 'get_clarity'
  | 'not_make_worse';

export interface EnhancedMessageContext {
  situation: string;
  draft: string;
  emotionalState: MessageEmotionalState | null;
  interpretation: MessageInterpretation | null;
  urge: MessageUrge | null;
  desiredOutcome: MessageDesiredOutcome | null;
}

export const EMOTIONAL_STATE_OPTIONS: { value: MessageEmotionalState; label: string; emoji: string }[] = [
  { value: 'angry', label: 'Angry', emoji: '🔥' },
  { value: 'hurt', label: 'Hurt', emoji: '💧' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'ashamed', label: 'Ashamed', emoji: '😣' },
  { value: 'rejected', label: 'Rejected', emoji: '🥀' },
  { value: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊' },
  { value: 'confused', label: 'Confused', emoji: '🌀' },
  { value: 'calm_unsure', label: 'Calm but unsure', emoji: '🤔' },
];

export const INTERPRETATION_OPTIONS: { value: MessageInterpretation; label: string; emoji: string }[] = [
  { value: 'no_respect', label: 'They don\'t respect me', emoji: '😤' },
  { value: 'rejecting_me', label: 'They are rejecting me', emoji: '💔' },
  { value: 'dont_care', label: 'They don\'t care', emoji: '😞' },
  { value: 'being_dismissed', label: 'I\'m being dismissed', emoji: '🚫' },
  { value: 'not_sure', label: 'I\'m not sure what it means', emoji: '❓' },
];

export const URGE_OPTIONS: { value: MessageUrge; label: string; emoji: string }[] = [
  { value: 'explain_myself', label: 'Explain myself', emoji: '💬' },
  { value: 'text_again', label: 'Text again', emoji: '📱' },
  { value: 'demand_clarity', label: 'Demand clarity', emoji: '⚡' },
  { value: 'withdraw', label: 'Withdraw', emoji: '🧊' },
  { value: 'apologize', label: 'Apologize', emoji: '🕊️' },
  { value: 'set_boundary', label: 'Set a boundary', emoji: '🛡️' },
  { value: 'attack', label: 'Attack back', emoji: '🔥' },
  { value: 'ask_reassurance', label: 'Ask for reassurance', emoji: '🤲' },
];

export const DESIRED_OUTCOME_OPTIONS: { value: MessageDesiredOutcome; label: string; emoji: string }[] = [
  { value: 'feel_heard', label: 'Feel heard', emoji: '👂' },
  { value: 'avoid_conflict', label: 'Avoid conflict', emoji: '☮️' },
  { value: 'protect_dignity', label: 'Protect my dignity', emoji: '👑' },
  { value: 'reconnect', label: 'Reconnect', emoji: '🌱' },
  { value: 'get_clarity', label: 'Get clarity', emoji: '✨' },
  { value: 'not_make_worse', label: 'Not make things worse', emoji: '🛑' },
];

export type QuickEntrySituation =
  | 'about_to_text'
  | 'need_help_what_to_send'
  | 'calm_before_reply'
  | 'should_i_send'
  | 'set_boundary'
  | 'repair_after_conflict';

export interface QuickEntryCard {
  id: QuickEntrySituation;
  label: string;
  subtitle: string;
  emoji: string;
  color: string;
  defaultEmotion: MessageEmotionalState;
}

export const QUICK_ENTRY_CARDS: QuickEntryCard[] = [
  {
    id: 'about_to_text',
    label: "I'm about to text someone",
    subtitle: 'Check before you send',
    emoji: '📱',
    color: '#5B8FB9',
    defaultEmotion: 'anxious',
  },
  {
    id: 'need_help_what_to_send',
    label: 'Help me figure out what to say',
    subtitle: 'Get clarity on your message',
    emoji: '💭',
    color: '#9B8EC4',
    defaultEmotion: 'confused',
  },
  {
    id: 'calm_before_reply',
    label: 'I need to calm down first',
    subtitle: 'Pause before responding',
    emoji: '🧘',
    color: '#6B9080',
    defaultEmotion: 'angry',
  },
  {
    id: 'should_i_send',
    label: "Should I send this?",
    subtitle: 'Get a recommendation',
    emoji: '🤔',
    color: '#C4956A',
    defaultEmotion: 'calm_unsure',
  },
  {
    id: 'set_boundary',
    label: 'Help me set a boundary',
    subtitle: 'Firm, kind, clear',
    emoji: '🛡️',
    color: '#5B8FB9',
    defaultEmotion: 'hurt',
  },
  {
    id: 'repair_after_conflict',
    label: 'Repair after conflict',
    subtitle: 'Reconnect without losing yourself',
    emoji: '🌱',
    color: '#7FA68E',
    defaultEmotion: 'ashamed',
  },
];
