export type DetailedOutcome =
  | 'sent_helped'
  | 'sent_neutral'
  | 'sent_regretted'
  | 'not_sent_relieved'
  | 'not_sent_unsure'
  | 'waited_then_sent'
  | 'rewrote_then_sent'
  | 'decided_not_to_send';

export type SentStatus = 'sent_now' | 'saved_unsent' | 'not_sent' | 'sent_later';
export type ConflictResult = 'helped' | 'neutral' | 'escalated' | 'not_sure';

export interface MessageOutcomeRecord {
  id: string;
  sessionId: string;
  timestamp: number;
  outcome: DetailedOutcome;
  didSend: boolean;
  didHelp: boolean;
  didRegret: boolean;
  didWaitHelp: boolean;
  didRewriteHelp: boolean;
  rewriteStyleUsed: string | null;
  emotionalState: string | null;
  notes: string;
}

export interface EnhancedMessageOutcome {
  id: string;
  createdAt: number;
  originalDraft: string;
  rewrittenDraftUsed: string | null;
  pathTypeSelected: string | null;
  riskLevel: string | null;
  emotionalState: string | null;
  interpretation: string | null;
  urge: string | null;
  desiredOutcome: string | null;
  relationshipContext: string | null;
  distressBefore: number | null;
  distressAfter: number | null;
  pauseUsed: boolean;
  pauseDurationSeconds: number | null;
  groundingUsed: boolean;
  sentStatus: SentStatus;
  regretReported: boolean | null;
  conflictResult: ConflictResult | null;
  userHelpfulnessRating: number | null;
  notes: string;
  sourceFlow: 'message_flow' | 'secure_rewrite' | 'simulation' | 'guard' | 'quick_entry';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night';
  rewriteSubtype: string | null;
}

export interface CommunicationPattern {
  id: string;
  label: string;
  description: string;
  frequency: number;
  trend: 'improving' | 'stable' | 'worsening';
  relatedEmotion: string;
}

export interface CommunicationInsight {
  id: string;
  text: string;
  category: 'pattern' | 'strength' | 'suggestion' | 'learning' | 'growth';
  emoji: string;
  timestamp: number;
  priority?: number;
}

export interface CommunicationTendency {
  id: string;
  label: string;
  score: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  description: string;
}

export interface GrowthSignal {
  id: string;
  label: string;
  description: string;
  emoji: string;
  firstSeen: number;
  occurrences: number;
}

export interface PlaybookEntry {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: 'best_style' | 'before_texting' | 'regret_triggers' | 'do_not_send' | 'after_silence' | 'after_disrespect' | 'secure_style';
  confidence: 'high' | 'medium' | 'low';
  basedOnOutcomes: number;
}

export interface WhatHelpedReminder {
  id: string;
  text: string;
  emoji: string;
  matchedContext: string;
  basedOnOutcomes: number;
}

export interface DraftVaultEntry {
  id: string;
  timestamp: number;
  originalText: string;
  rewrittenText: string | null;
  rewriteStyle: string | null;
  situation: string;
  emotionalState: string | null;
  reason: 'saved_for_later' | 'chose_not_to_send' | 'paused' | 'vault_review';
  reviewed: boolean;
  reviewNotes: string | null;
  notSendingHelped: boolean | null;
}

export const DETAILED_OUTCOME_OPTIONS: { value: DetailedOutcome; label: string; emoji: string; color: string }[] = [
  { value: 'sent_helped', label: 'Sent — it helped', emoji: '💚', color: '#6B9080' },
  { value: 'sent_neutral', label: 'Sent — neutral', emoji: '😐', color: '#8E9BAA' },
  { value: 'sent_regretted', label: 'Sent — regretted it', emoji: '💔', color: '#E17055' },
  { value: 'not_sent_relieved', label: 'Didn\'t send — relieved', emoji: '😌', color: '#7FA68E' },
  { value: 'not_sent_unsure', label: 'Didn\'t send — still unsure', emoji: '🤔', color: '#C4956A' },
  { value: 'waited_then_sent', label: 'Waited, then sent', emoji: '⏳', color: '#9B8EC4' },
  { value: 'rewrote_then_sent', label: 'Rewrote, then sent', emoji: '✏️', color: '#5B8FB9' },
  { value: 'decided_not_to_send', label: 'Decided not to send', emoji: '🛑', color: '#C47878' },
];

export const SENT_STATUS_OPTIONS: { value: SentStatus; label: string; emoji: string; color: string }[] = [
  { value: 'sent_now', label: 'Sent it', emoji: '📤', color: '#4A8B8D' },
  { value: 'sent_later', label: 'Sent later', emoji: '⏳', color: '#9B8EC4' },
  { value: 'saved_unsent', label: 'Saved, not sent', emoji: '📂', color: '#C4956A' },
  { value: 'not_sent', label: 'Chose not to send', emoji: '🛑', color: '#C47878' },
];

export const CONFLICT_RESULT_OPTIONS: { value: ConflictResult; label: string; emoji: string; color: string }[] = [
  { value: 'helped', label: 'It helped', emoji: '💚', color: '#6B9080' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: '#8E9BAA' },
  { value: 'escalated', label: 'Things escalated', emoji: '📈', color: '#E17055' },
  { value: 'not_sure', label: 'Not sure yet', emoji: '🤔', color: '#C4956A' },
];

export const OUTCOME_CAPTURE_QUESTIONS = {
  sentStatus: 'What happened with the message?',
  regret: 'Do you regret sending it?',
  conflictResult: 'How did it affect the situation?',
  waitingHelped: 'Did waiting help?',
  distressAfter: 'How do you feel now? (1-10)',
  selfRespect: 'Did you feel you protected your dignity?',
} as const;
