export type ResponsePath =
  | 'urgent'
  | 'avoidant'
  | 'soft'
  | 'boundary'
  | 'secure'
  | 'do_not_send';

export type RiskTier = 'low' | 'moderate' | 'high';

export interface PathImpactScore {
  regretRisk: RiskTier;
  dignityProtection: RiskTier;
  clarityLevel: RiskTier;
  escalationRisk: RiskTier;
  selfRespect: RiskTier;
}

export interface ResponsePathSimulation {
  path: ResponsePath;
  label: string;
  emoji: string;
  color: string;
  exampleMessage: string;
  shortTermEffect: string;
  relationshipEffect: string;
  selfEffect: string;
  impact: PathImpactScore;
  isRecommended: boolean;
  recommendationNote: string;
  actionLabel: string;
  actionType: 'use_rewrite' | 'save_draft' | 'pause' | 'journal' | 'secure_rewrite' | 'grounding';
}

export interface SimulationContext {
  draft: string;
  situation: string;
  emotionalState: string | null;
  interpretation: string | null;
  urge: string | null;
  desiredOutcome: string | null;
  riskLevel: string | null;
}

export interface SimulationResult {
  id: string;
  timestamp: number;
  context: SimulationContext;
  paths: ResponsePathSimulation[];
  recommendedPathType: ResponsePath;
  recommendationReason: string;
}

export type SimulationOutcomeResult =
  | 'sent_helped'
  | 'sent_neutral'
  | 'sent_regretted'
  | 'not_sent_relieved'
  | 'not_sent_unsure'
  | 'paused_first'
  | 'journaled_instead'
  | 'used_grounding';

export interface SimulationOutcomeRecord {
  id: string;
  simulationId: string;
  timestamp: number;
  selectedPath: ResponsePath;
  outcome: SimulationOutcomeResult | null;
  didSend: boolean;
  didRegret: boolean;
  conflictEscalated: boolean;
  waitingHelped: boolean;
  emotionalState: string | null;
  desiredOutcome: string | null;
  draftRiskLevel: string | null;
}

export const SIMULATION_OUTCOME_OPTIONS: {
  value: SimulationOutcomeResult;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { value: 'sent_helped', label: 'Sent — it helped', emoji: '💚', color: '#14B8A6' },
  { value: 'sent_neutral', label: 'Sent — neutral', emoji: '😐', color: '#2E2A72' },
  { value: 'sent_regretted', label: 'Sent — regretted it', emoji: '💔', color: '#3B82F6' },
  { value: 'not_sent_relieved', label: "Didn't send — relieved", emoji: '😌', color: '#14B8A6' },
  { value: 'not_sent_unsure', label: "Didn't send — still unsure", emoji: '🤔', color: '#67E8F9' },
  { value: 'paused_first', label: 'Paused first', emoji: '⏳', color: '#3B82F6' },
  { value: 'journaled_instead', label: 'Journaled instead', emoji: '📝', color: '#3B82F6' },
  { value: 'used_grounding', label: 'Used grounding', emoji: '🧘', color: '#14B8A6' },
];

export const RESPONSE_PATH_META: Record<ResponsePath, { label: string; emoji: string; color: string; description: string }> = {
  urgent: {
    label: 'Urgent',
    emoji: '⚡',
    color: '#3B82F6',
    description: 'The emotionally driven, pressuring response',
  },
  avoidant: {
    label: 'Avoidant',
    emoji: '🧊',
    color: '#3B82F6',
    description: 'The shutdown, cold distance response',
  },
  soft: {
    label: 'Soft',
    emoji: '🪶',
    color: '#67E8F9',
    description: 'The gentle, emotionally open response',
  },
  boundary: {
    label: 'Boundary',
    emoji: '🛡️',
    color: '#3B82F6',
    description: 'The clear, dignity-protecting response',
  },
  secure: {
    label: 'Secure',
    emoji: '🌿',
    color: '#14B8A6',
    description: 'The calm, self-respecting response',
  },
  do_not_send: {
    label: 'Do Not Send',
    emoji: '🛑',
    color: '#3B82F6',
    description: 'The strategic pause — regulate first',
  },
};
