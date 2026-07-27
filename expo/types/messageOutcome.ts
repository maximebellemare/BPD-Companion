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
  { value: 'sent_helped', get label() { return localizedText('Sent — it helped', 'Lo envié; ayudó'); }, emoji: '💚', color: '#14B8A6' },
  { value: 'sent_neutral', get label() { return localizedText('Sent — neutral', 'Lo envié; fue neutral'); }, emoji: '😐', color: '#2E2A72' },
  { value: 'sent_regretted', get label() { return localizedText('Sent — regretted it', 'Lo envié y me arrepentí'); }, emoji: '💔', color: '#3B82F6' },
  { value: 'not_sent_relieved', get label() { return localizedText("Didn't send — relieved", 'No lo envié; sentí alivio'); }, emoji: '😌', color: '#14B8A6' },
  { value: 'not_sent_unsure', get label() { return localizedText("Didn't send — still unsure", 'No lo envié; sigo con dudas'); }, emoji: '🤔', color: '#67E8F9' },
  { value: 'waited_then_sent', get label() { return localizedText('Waited, then sent', 'Esperé y luego lo envié'); }, emoji: '⏳', color: '#3B82F6' },
  { value: 'rewrote_then_sent', get label() { return localizedText('Rewrote, then sent', 'Lo reescribí y luego lo envié'); }, emoji: '✏️', color: '#3B82F6' },
  { value: 'decided_not_to_send', get label() { return localizedText('Decided not to send', 'Decidí no enviarlo'); }, emoji: '🛑', color: '#3B82F6' },
];

export const SENT_STATUS_OPTIONS: { value: SentStatus; label: string; emoji: string; color: string }[] = [
  { value: 'sent_now', get label() { return localizedText('Sent it', 'Lo envié'); }, emoji: '📤', color: '#14B8A6' },
  { value: 'sent_later', get label() { return localizedText('Sent later', 'Lo envié después'); }, emoji: '⏳', color: '#3B82F6' },
  { value: 'saved_unsent', get label() { return localizedText('Saved, not sent', 'Guardado, sin enviar'); }, emoji: '📂', color: '#67E8F9' },
  { value: 'not_sent', get label() { return localizedText('Chose not to send', 'Elegí no enviarlo'); }, emoji: '🛑', color: '#3B82F6' },
];

export const CONFLICT_RESULT_OPTIONS: { value: ConflictResult; label: string; emoji: string; color: string }[] = [
  { value: 'helped', get label() { return localizedText('It helped', 'Ayudó'); }, emoji: '💚', color: '#14B8A6' },
  { value: 'neutral', get label() { return localizedText('Neutral', 'Neutral'); }, emoji: '😐', color: '#2E2A72' },
  { value: 'escalated', get label() { return localizedText('Things escalated', 'Las cosas escalaron'); }, emoji: '📈', color: '#3B82F6' },
  { value: 'not_sure', get label() { return localizedText('Not sure yet', 'Aún no lo sé'); }, emoji: '🤔', color: '#67E8F9' },
];

export const OUTCOME_CAPTURE_QUESTIONS = {
  get sentStatus() { return localizedText('What happened with the message?', '¿Qué pasó con el mensaje?'); },
  get regret() { return localizedText('Do you regret sending it?', '¿Te arrepientes de haberlo enviado?'); },
  get conflictResult() { return localizedText('How did it affect the situation?', '¿Cómo afectó la situación?'); },
  get waitingHelped() { return localizedText('Did waiting help?', '¿Ayudó esperar?'); },
  get distressAfter() { return localizedText('How do you feel now? (1-10)', '¿Cómo te sientes ahora? (1-10)'); },
  get selfRespect() { return localizedText('Did you feel you protected your dignity?', '¿Sentiste que protegiste tu dignidad?'); },
} as const;
import { localizedText } from '@/lib/i18n/staticText';
