export type CrisisActivationReason =
  | 'high_distress'
  | 'rapid_rewrites'
  | 'repeated_triggers'
  | 'manual'
  | 'escalation_detected';

export interface CrisisSignal {
  id: string;
  reason: CrisisActivationReason;
  label: string;
  description: string;
  detectedAt: number;
  severity: number;
}

export type CrisisModePhase =
  | 'breathing'
  | 'grounding'
  | 'ai_calm'
  | 'message_delay'
  | 'contact_safe';

export interface GroundingPrompt {
  id: string;
  instruction: string;
  sense: 'sight' | 'sound' | 'touch' | 'smell' | 'taste';
  icon: string;
}

export interface MessageDelayOption {
  id: string;
  label: string;
  minutes: number;
}

export interface CrisisDetectionResult {
  shouldActivate: boolean;
  signals: CrisisSignal[];
  severity: number;
  message: string | null;
}

export interface CrisisModeState {
  active: boolean;
  activatedAt: number | null;
  reason: CrisisActivationReason | null;
  signals: CrisisSignal[];
  currentPhase: CrisisModePhase;
  messageDelayMinutes: number | null;
}

export type RegulationStep =
  | 'entry'
  | 'breathing'
  | 'grounding'
  | 'urge_surfing'
  | 'help_not_text'
  | 'calm_next';

export type BreathingDuration = 30 | 60 | 120;

export interface RegulationUrge {
  id: string;
  label: string;
  emoji: string;
}

export interface RegulationEntryChoice {
  id: string;
  label: string;
  targetStep: RegulationStep;
  icon: string;
}

export interface UrgeSurfingState {
  selectedUrge: string | null;
  intensity: number;
}

export interface HelpNotTextState {
  draftText: string;
  selectedDelay: number | null;
  draftSaved: boolean;
}

export interface RegulationSession {
  id: string;
  startedAt: number;
  completedAt: number | null;
  stepsVisited: RegulationStep[];
  selectedUrges: string[];
  urgeIntensity: number | null;
  breathingDuration: BreathingDuration | null;
  delayMinutes: number | null;
  draftSaved: boolean;
}
