export type RecommendationToolId =
  | 'relationship_copilot'
  | 'message_guard'
  | 'crisis_mode'
  | 'crisis_regulation'
  | 'pause_mode'
  | 'guided_regulation'
  | 'check_in'
  | 'companion'
  | 'therapy_prep'
  | 'weekly_reflection'
  | 'daily_ritual'
  | 'grounding_exercise'
  | 'breathing_exercise'
  | 'opposite_action'
  | 'self_soothe'
  | 'reality_check'
  | 'conflict_reflection'
  | 'movement_log'
  | 'medication_log'
  | 'learn_article'
  | 'journal'
  | 'emotional_playbook'
  | 'identity_journal'
  | 'relationship_hub';

export type RecommendationSignal =
  | 'high_distress'
  | 'relationship_distress'
  | 'high_activation'
  | 'shame_after_conflict'
  | 'pre_therapy'
  | 'post_therapy'
  | 'missed_medication'
  | 'medication_due'
  | 'repeated_trigger'
  | 'frequent_messaging'
  | 'low_check_in_consistency'
  | 'no_check_in_today'
  | 'calm_state'
  | 'recovering'
  | 'late_night'
  | 'no_movement_recent'
  | 'high_urges'
  | 'emotional_overwhelm'
  | 'abandonment_fear'
  | 'conflict_active'
  | 'growth_opportunity';

export type RecommendationUrgency = 'immediate' | 'suggested' | 'gentle';

export interface SmartRecommendation {
  id: string;
  toolId: RecommendationToolId;
  title: string;
  message: string;
  route: string;
  icon: string;
  urgency: RecommendationUrgency;
  signal: RecommendationSignal;
  reason: string;
  score: number;
  contextTags: string[];
}

export interface SmartRecommendationResult {
  recommendations: SmartRecommendation[];
  topRecommendation: SmartRecommendation | null;
  signals: RecommendationSignal[];
  hasData: boolean;
}

export interface UserContextSnapshot {
  distressLevel: number;
  latestEmotion: string | null;
  latestTrigger: string | null;
  latestTriggerCategory: string | null;
  emotionalZone: string;
  isRelationshipActivated: boolean;
  hasHighUrges: boolean;
  recentCheckInCount: number;
  recentDraftCount: number;
  recentPauseCount: number;
  recentRewriteCount: number;
  hasMedicationDue: boolean;
  hasMissedMedication: boolean;
  hasUpcomingAppointment: boolean;
  appointmentWithinHours: number | null;
  recentMovementCount: number;
  isLateNight: boolean;
  primaryReasons: string[];
  hardestMoments: string[];
  preferredTools: string[];
  topEmotionsThisWeek: string[];
  topTriggersThisWeek: string[];
  averageDistressThisWeek: number;
  journalStreakDays: number;
}

export interface ToolEffectiveness {
  toolId: RecommendationToolId;
  usageCount: number;
  helpedCount: number;
  effectivenessScore: number;
}
