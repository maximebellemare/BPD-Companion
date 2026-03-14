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
  | 'app_opened'
  | 'app_backgrounded'
  | 'session_started'
  | 'session_ended'
  | 'check_in_completed'
  | 'check_in_skipped'
  | 'exercise_started'
  | 'exercise_completed'
  | 'exercise_abandoned'
  | 'message_rewrite'
  | 'message_draft_analyzed'
  | 'message_draft_risk_detected'
  | 'message_sent'
  | 'message_regret_logged'
  | 'message_do_not_send_shown'
  | 'message_saved_to_vault'
  | 'lesson_viewed'
  | 'lesson_completed'
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
  | 'crisis_mode_activated'
  | 'crisis_mode_completed'
  | 'crisis_regulation_started'
  | 'crisis_regulation_completed'
  | 'ai_companion_opened'
  | 'ai_conversation_completed'
  | 'ai_relationship_discussion'
  | 'ai_emotional_support'
  | 'companion_chat_started'
  | 'companion_chat_completed'
  | 'companion_message_sent'
  | 'companion_insight_shown'
  | 'companion_tool_suggested'
  | 'grounding_started'
  | 'grounding_completed'
  | 'dbt_skill_used'
  | 'journal_entry_created'
  | 'journal_entry_analyzed'
  | 'journal_prompt_used'
  | 'journal_streak_achieved'
  | 'emotional_loop_viewed'
  | 'emotional_profile_viewed'
  | 'emotional_timeline_viewed'
  | 'reflection_mirror_viewed'
  | 'weekly_reflection_viewed'
  | 'weekly_reflection_completed'
  | 'therapy_report_viewed'
  | 'therapy_report_generated'
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
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'subscription_restored'
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
  | 'premium_gate_accepted'
  | 'insight_generated'
  | 'insight_viewed'
  | 'insight_acted_on'
  | 'tool_used'
  | 'tool_completed'
  | 'tool_abandoned'
  | 'secure_rewrite_generated'
  | 'secure_rewrite_selected'
  | 'secure_rewrite_sent'
  | 'secure_rewrite_saved'
  | 'secure_rewrite_helpful'
  | 'secure_rewrite_teaching_viewed'
  | 'secure_rewrite_comparison_viewed'
  | 'message_simulation_started'
  | 'message_simulation_path_viewed'
  | 'message_simulation_path_selected'
  | 'message_simulation_outcome_logged'
  | 'communication_pattern_viewed'
  | 'communication_playbook_opened'
  | 'notification_tapped'
  | 'notification_dismissed'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'onboarding_step_completed'
  | 'medication_logged'
  | 'medication_missed'
  | 'appointment_created'
  | 'appointment_completed'
  | 'movement_logged'
  | 'daily_insight_viewed'
  | 'daily_insight_acted_on'
  | 'error_occurred'
  | 'feature_discovery';

export interface EventPropertyMap {
  journal_entry_created: {
    format?: string;
    emotion_count?: number;
    trigger_count?: number;
    distress_level?: number;
    word_count?: number;
    has_ai_analysis?: boolean;
  };
  message_draft_analyzed: {
    risk_level?: string;
    hostility_score?: number;
    escalation_risk?: number;
    word_count?: number;
    contains_profanity?: boolean;
  };
  secure_rewrite_generated: {
    subtype?: string;
    draft_risk_level?: string;
    quality_score?: number;
  };
  secure_rewrite_selected: {
    subtype?: string;
    draft_risk_level?: string;
  };
  message_sent: {
    was_rewritten?: boolean;
    rewrite_style?: string;
    risk_level?: string;
    pause_used?: boolean;
    pause_duration_seconds?: number;
  };
  message_regret_logged: {
    was_rewritten?: boolean;
    path_type?: string;
    time_since_sent_minutes?: number;
  };
  companion_chat_started: {
    entry_point?: string;
    emotional_state?: string;
    distress_level?: number;
  };
  companion_chat_completed: {
    message_count?: number;
    duration_seconds?: number;
    tools_suggested?: number;
  };
  crisis_mode_activated: {
    distress_level?: number;
    trigger?: string;
    source?: string;
  };
  tool_used: {
    tool_id?: string;
    tool_name?: string;
    category?: string;
    source?: string;
  };
  insight_generated: {
    type?: string;
    source?: string;
    count?: number;
  };
  subscription_started: {
    plan_id?: string;
    source?: string;
    trial?: boolean;
  };
  error_occurred: {
    error_type?: string;
    screen?: string;
    message?: string;
  };
}

export interface AnalyticsMetricSnapshot {
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
  journalEntries: number;
  checkIns: number;
  messageDraftsAnalyzed: number;
  secureRewritesUsed: number;
  companionChats: number;
  toolsUsed: number;
  crisisActivations: number;
  insightsGenerated: number;
  avgDistressLevel: number | null;
  pauseBeforeSendCount: number;
  regretCount: number;
}

export interface AnalyticsAggregation {
  eventName: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  properties?: Record<string, Record<string, number>>;
}
