export type SecureSubtype =
  | 'calm_boundary'
  | 'calm_clarity'
  | 'calm_repair'
  | 'calm_exit'
  | 'calm_ask';

export interface SecureRewriteInput {
  originalDraft: string;
  emotionalState: string | null;
  interpretation: string | null;
  urge: string | null;
  desiredOutcome: string | null;
  relationshipContext: string | null;
  distressLevel: number;
  situation: string;
}

export interface SecureRewriteResult {
  subtype: SecureSubtype;
  label: string;
  emoji: string;
  color: string;
  text: string;
  whySecure: string;
  whenBestUsed: string;
  isRecommended: boolean;
}

export interface SecureRewriteQualityScore {
  clarity: number;
  dignity: number;
  emotionalHonesty: number;
  escalationRisk: number;
  reassuranceSeeking: number;
  overexplaining: number;
  boundaryStrength: number;
  regretRisk: number;
  overall: number;
  passed: boolean;
  issues: string[];
}

export interface SecureComparisonPoint {
  dimension: string;
  emoji: string;
  originalLevel: 'low' | 'moderate' | 'high';
  secureLevel: 'low' | 'moderate' | 'high';
  improvement: string;
}

export interface SecureTeachingPoint {
  id: string;
  title: string;
  explanation: string;
  emoji: string;
}

export interface SecureRewriteSession {
  id: string;
  timestamp: number;
  input: SecureRewriteInput;
  selectedSubtype: SecureSubtype | null;
  selectedText: string | null;
  comparisonViewed: boolean;
  teachingViewed: boolean;
  outcome: SecureRewriteSessionOutcome | null;
}

export type SecureRewriteSessionOutcome =
  | 'sent_helped'
  | 'sent_neutral'
  | 'sent_regretted'
  | 'not_sent_relieved'
  | 'saved_for_later'
  | 'switched_to_pause';

export const SECURE_SUBTYPE_META: Record<SecureSubtype, {
  label: string;
  emoji: string;
  color: string;
  description: string;
  bestFor: string;
}> = {
  calm_boundary: {
    label: 'Calm Boundary',
    emoji: '🛡️',
    color: '#5B8FB9',
    description: 'Distance, dignity, or closure',
    bestFor: 'When you want to step back and protect your peace',
  },
  calm_clarity: {
    label: 'Calm Clarity',
    emoji: '🎯',
    color: '#4A8B8D',
    description: 'Express clearly without escalation',
    bestFor: 'When you want to be understood without fighting',
  },
  calm_repair: {
    label: 'Calm Repair',
    emoji: '🌱',
    color: '#6BA38E',
    description: 'Reconnect without collapsing',
    bestFor: 'When you want connection without panic or over-apologizing',
  },
  calm_exit: {
    label: 'Calm Exit',
    emoji: '🚪',
    color: '#8E9BAA',
    description: 'Step back instead of chase',
    bestFor: 'When chasing will only push them further away',
  },
  calm_ask: {
    label: 'Calm Ask',
    emoji: '💬',
    color: '#9B8EC4',
    description: 'Ask for clarity with self-respect',
    bestFor: 'When you need answers without desperation',
  },
};

export const SECURE_OUTCOME_OPTIONS: {
  value: SecureRewriteSessionOutcome;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { value: 'sent_helped', label: 'Sent — it helped', emoji: '💚', color: '#6BA38E' },
  { value: 'sent_neutral', label: 'Sent — neutral', emoji: '😐', color: '#8E9BAA' },
  { value: 'sent_regretted', label: 'Sent — regretted it', emoji: '💔', color: '#C47878' },
  { value: 'not_sent_relieved', label: "Didn't send — relieved", emoji: '😌', color: '#7FA68E' },
  { value: 'saved_for_later', label: 'Saved for later', emoji: '📂', color: '#9B8EC4' },
  { value: 'switched_to_pause', label: 'Paused first', emoji: '⏳', color: '#C4956A' },
];
