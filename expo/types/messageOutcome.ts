export type DetailedOutcome =
  | 'sent_helped'
  | 'sent_neutral'
  | 'sent_regretted'
  | 'not_sent_relieved'
  | 'not_sent_unsure'
  | 'waited_then_sent'
  | 'rewrote_then_sent'
  | 'decided_not_to_send';

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
  category: 'pattern' | 'strength' | 'suggestion' | 'learning';
  emoji: string;
  timestamp: number;
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
