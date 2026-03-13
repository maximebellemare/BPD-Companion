export type ConflictTrigger =
  | 'no_reply'
  | 'tone_change'
  | 'rejection'
  | 'conflict'
  | 'mixed_signals'
  | 'criticism'
  | 'boundary_crossed'
  | 'abandonment_fear'
  | 'shame'
  | 'other';

export type ConflictAction =
  | 'paused'
  | 'rewrote_message'
  | 'sent_message'
  | 'used_grounding'
  | 'used_breathing'
  | 'journaled'
  | 'talked_to_companion'
  | 'used_copilot'
  | 'withdrew'
  | 'lashed_out'
  | 'sought_reassurance'
  | 'did_nothing';

export type ConflictOutcome =
  | 'calm'
  | 'resolved'
  | 'regret'
  | 'shame'
  | 'relief'
  | 'escalated'
  | 'neutral'
  | 'unclear';

export interface ConflictReplayEvent {
  id: string;
  timestamp: number;
  relationshipProfileId?: string;
  relationshipName?: string;
  trigger: ConflictTrigger;
  triggerDetail?: string;
  emotion: string;
  emotionIntensity: number;
  distressLevel: number;
  urge: string;
  action: ConflictAction;
  actionDetail?: string;
  outcome: ConflictOutcome;
  outcomeNotes?: string;
  aiInsight?: string;
  learningSuggestions?: string[];
}

export interface ConflictReplayTimeline {
  event: ConflictReplayEvent;
  steps: ConflictTimelineStep[];
}

export interface ConflictTimelineStep {
  type: 'trigger' | 'emotion' | 'urge' | 'action' | 'outcome';
  label: string;
  detail: string;
  emoji: string;
  intensity?: number;
  timestamp: number;
}

export interface ConflictInsightCard {
  id: string;
  title: string;
  narrative: string;
  emoji: string;
  type: 'pattern' | 'growth' | 'warning' | 'suggestion';
}

export const CONFLICT_TRIGGER_META: Record<ConflictTrigger, { label: string; emoji: string }> = {
  no_reply: { label: 'No reply', emoji: '📱' },
  tone_change: { label: 'Tone changed', emoji: '❄️' },
  rejection: { label: 'Felt rejected', emoji: '💔' },
  conflict: { label: 'Had conflict', emoji: '⚡' },
  mixed_signals: { label: 'Mixed signals', emoji: '🔀' },
  criticism: { label: 'Criticism', emoji: '🗣️' },
  boundary_crossed: { label: 'Boundary crossed', emoji: '🚧' },
  abandonment_fear: { label: 'Fear of abandonment', emoji: '🥀' },
  shame: { label: 'Shame', emoji: '😞' },
  other: { label: 'Something else', emoji: '💭' },
};

export const CONFLICT_ACTION_META: Record<ConflictAction, { label: string; emoji: string }> = {
  paused: { label: 'Paused first', emoji: '⏸️' },
  rewrote_message: { label: 'Rewrote message', emoji: '✏️' },
  sent_message: { label: 'Sent message', emoji: '📤' },
  used_grounding: { label: 'Used grounding', emoji: '🌿' },
  used_breathing: { label: 'Used breathing', emoji: '🌬️' },
  journaled: { label: 'Journaled', emoji: '📝' },
  talked_to_companion: { label: 'Talked to AI', emoji: '✨' },
  used_copilot: { label: 'Used Copilot', emoji: '🧭' },
  withdrew: { label: 'Withdrew', emoji: '🚪' },
  lashed_out: { label: 'Lashed out', emoji: '💥' },
  sought_reassurance: { label: 'Sought reassurance', emoji: '🫂' },
  did_nothing: { label: 'Did nothing', emoji: '🧘' },
};

export const CONFLICT_OUTCOME_META: Record<ConflictOutcome, { label: string; emoji: string; color: string }> = {
  calm: { label: 'Felt calmer', emoji: '🌊', color: '#6B9080' },
  resolved: { label: 'Resolved', emoji: '✅', color: '#00B894' },
  regret: { label: 'Regret', emoji: '😔', color: '#D4956A' },
  shame: { label: 'Shame', emoji: '😞', color: '#E17055' },
  relief: { label: 'Relief', emoji: '😮‍💨', color: '#6B9080' },
  escalated: { label: 'Escalated', emoji: '📈', color: '#E17055' },
  neutral: { label: 'Neutral', emoji: '😐', color: '#636E72' },
  unclear: { label: 'Unclear', emoji: '🤷', color: '#A8B0B5' },
};
