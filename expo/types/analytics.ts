export interface AnalyticsEvent {
  id: string;
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
  sessionId?: string;
}

export interface AnalyticsUserProperties {
  userId?: string;
  checkInCount?: number;
  journalStreak?: number;
  topTrigger?: string;
  appVersion?: string;
  isPremium?: boolean;
}

export interface AnalyticsFlowState {
  flowName: string;
  startedAt: number;
  steps: string[];
  currentStep: string;
  completed: boolean;
}

export interface RegulationOutcome {
  tool: string;
  distressBefore: number;
  distressAfter: number;
  urgeBefore?: number;
  urgeAfter?: number;
  timestamp: number;
}

export interface AnalyticsProviderInterface {
  name: string;
  initialize(): Promise<void>;
  trackEvent(name: string, properties?: Record<string, string | number | boolean>): Promise<void>;
  trackScreen(screenName: string): Promise<void>;
  setUserProperties(properties: AnalyticsUserProperties): Promise<void>;
  flush(): Promise<void>;
}

export interface AnalyticsSummary {
  totalEvents: number;
  eventCounts: Record<string, number>;
  flowCompletionRates: Record<string, { started: number; completed: number }>;
  recentEvents: AnalyticsEvent[];
  screenViews: Record<string, number>;
  premiumSignals: Record<string, number>;
}

export type AnalyticsEventName =
  | 'screen_view'
  | 'check_in_completed'
  | 'exercise_started'
  | 'exercise_completed'
  | 'message_rewrite'
  | 'lesson_viewed'
  | 'ai_conversation_started'
  | 'community_post_created'
  | 'relationship_copilot_opened'
  | 'relationship_copilot_step'
  | 'relationship_copilot_completed'
  | 'relationship_spiral_detected'
  | 'relationship_intervention_used'
  | 'message_guard_opened'
  | 'message_pause_used'
  | 'message_simulator_used'
  | 'message_rewrite_completed'
  | 'message_sent_after_pause'
  | 'message_not_sent'
  | 'crisis_mode_triggered'
  | 'crisis_regulation_started'
  | 'crisis_regulation_completed'
  | 'ai_companion_opened'
  | 'ai_conversation_completed'
  | 'ai_relationship_discussion'
  | 'ai_emotional_support'
  | 'grounding_started'
  | 'grounding_completed'
  | 'dbt_skill_used'
  | 'journal_entry_created'
  | 'emotional_loop_viewed'
  | 'emotional_profile_viewed'
  | 'emotional_timeline_viewed'
  | 'reflection_mirror_viewed'
  | 'weekly_reflection_viewed'
  | 'therapy_report_viewed'
  | 'values_explorer_viewed'
  | 'self_trust_prompts_viewed'
  | 'regulation_effectiveness'
  | 'flow_start'
  | 'flow_step'
  | 'flow_complete'
  | 'upgrade_screen_viewed'
  | 'premium_feature_attempted'
  | 'weekly_reflection_locked'
  | 'therapist_report_locked'
  | 'ai_limit_reached'
  | 'upgrade_clicked'
  | 'safety_mode_activated'
  | 'safety_mode_deactivated'
  | 'relationship_profile_created'
  | 'relationship_profile_viewed'
  | 'daily_ritual_completed'
  | 'anchor_statement_viewed'
  | 'conflict_alignment_opened'
  | 'identity_journal_opened'
  | 'loop_interrupt_plan_created'
  | 'outcome_recorded'
  | 'outcome_helped'
  | 'outcome_made_worse'
  | 'outcome_neutral'
  | 'outcome_not_sent'
  | 'journey_phase_changed'
  | 'home_zone_changed'
  | 'core_journey_completed'
  | 'message_support_to_outcome'
  | 'regulation_to_reflection'
  | 'distress_reduction_detected'
  | 'premium_gate_shown'
  | 'premium_gate_dismissed'
  | 'premium_gate_accepted';
