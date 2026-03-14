export type SafetyLevel = 'safe' | 'elevated' | 'high_risk' | 'crisis';

export type SafetySignalType =
  | 'suicidal_ideation'
  | 'self_harm'
  | 'hopelessness'
  | 'extreme_distress'
  | 'dissociation'
  | 'substance_risk'
  | 'impulsive_danger'
  | 'severe_self_hatred';

export interface SafetySignal {
  type: SafetySignalType;
  matchedPhrase: string;
  confidence: number;
  requiresCrisisResource: boolean;
}

export interface SafetyAssessment {
  level: SafetyLevel;
  signals: SafetySignal[];
  requiresCrisisResources: boolean;
  requiresGrounding: boolean;
  shouldBlockHarmfulContent: boolean;
  recommendedActions: SafetyAction[];
  crisisResourceText: string | null;
  timestamp: number;
}

export type SafetyAction =
  | 'show_crisis_resources'
  | 'suggest_grounding'
  | 'suggest_breathing'
  | 'encourage_trusted_contact'
  | 'activate_crisis_mode'
  | 'block_harmful_response'
  | 'shift_to_supportive_tone'
  | 'suggest_professional_help'
  | 'offer_safety_plan';

export interface SafetyInterventionConfig {
  showCrisisHotline: boolean;
  showGroundingTools: boolean;
  showBreathingExercise: boolean;
  showTrustedContactPrompt: boolean;
  showSafetyPlanLink: boolean;
  toneOverride: 'supportive' | 'grounding' | 'crisis' | null;
  blockGenerativeResponse: boolean;
}

export interface AIOutputSafetyCheck {
  isAcceptable: boolean;
  violations: AIOutputViolation[];
  sanitizedContent: string | null;
}

export type AIOutputViolationType =
  | 'dismissive_of_pain'
  | 'minimizing_distress'
  | 'harmful_advice'
  | 'clinical_diagnosis'
  | 'encourages_self_harm'
  | 'inappropriate_positivity'
  | 'breaks_crisis_protocol'
  | 'upsell_during_crisis';

export interface AIOutputViolation {
  type: AIOutputViolationType;
  description: string;
  matchedContent: string;
}

export interface SafetyAnalyticsEvent {
  eventName: string;
  safetyLevel: SafetyLevel;
  signalTypes: SafetySignalType[];
  source: 'companion' | 'journal' | 'message_rewrite' | 'check_in';
  actionsTriggered: SafetyAction[];
  timestamp: number;
}

export const CRISIS_RESOURCES = {
  hotline988: {
    name: '988 Suicide & Crisis Lifeline',
    action: 'Call or text 988',
    description: 'Free, confidential support 24/7',
  },
  crisisText: {
    name: 'Crisis Text Line',
    action: 'Text HOME to 741741',
    description: 'Free crisis counseling via text',
  },
  emergencyServices: {
    name: 'Emergency Services',
    action: 'Call 911',
    description: 'For immediate danger',
  },
} as const;
