import { AnalyticsUserProperties } from '@/types/analytics';
import { analyticsEngine } from './analyticsEngine';

export async function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean>,
): Promise<void> {
  return analyticsEngine.trackEvent(name, properties);
}

export async function setUserProperties(properties: AnalyticsUserProperties): Promise<void> {
  return analyticsEngine.setUserProperties(properties);
}

export async function flush(): Promise<void> {
  return analyticsEngine.flush();
}

export async function trackScreenView(screenName: string): Promise<void> {
  return analyticsEngine.trackScreen(screenName);
}

export async function trackCheckIn(intensity: number, triggerCount: number): Promise<void> {
  return analyticsEngine.trackEvent('check_in_completed', {
    intensity,
    trigger_count: triggerCount,
  });
}

export async function trackExerciseStarted(exerciseId: string, exerciseName: string): Promise<void> {
  return analyticsEngine.trackEvent('exercise_started', {
    exercise_id: exerciseId,
    exercise_name: exerciseName,
  });
}

export async function trackMessageRewrite(style: string): Promise<void> {
  return analyticsEngine.trackEvent('message_rewrite', { style });
}

export async function trackLessonViewed(lessonId: string, categoryId: string): Promise<void> {
  return analyticsEngine.trackEvent('lesson_viewed', {
    lesson_id: lessonId,
    category_id: categoryId,
  });
}

export async function trackAIConversationStarted(): Promise<void> {
  return analyticsEngine.trackEvent('ai_conversation_started');
}

export async function trackCommunityPostCreated(category: string): Promise<void> {
  return analyticsEngine.trackEvent('community_post_created', { category });
}

export async function trackRelationshipCopilotOpened(): Promise<void> {
  return analyticsEngine.trackEvent('relationship_copilot_opened');
}

export async function trackRelationshipCopilotCompleted(properties?: Record<string, string | number | boolean>): Promise<void> {
  return analyticsEngine.trackEvent('relationship_copilot_completed', properties);
}

export async function trackCrisisMode(action: 'triggered' | 'regulation_started' | 'regulation_completed'): Promise<void> {
  return analyticsEngine.trackEvent(`crisis_${action === 'triggered' ? 'mode_triggered' : action}`);
}

export async function trackMessageGuard(action: string, properties?: Record<string, string | number | boolean>): Promise<void> {
  return analyticsEngine.trackEvent(`message_${action}`, properties);
}

export async function trackPremiumSignal(signal: string, properties?: Record<string, string | number | boolean>): Promise<void> {
  return analyticsEngine.trackEvent(signal, properties);
}

export async function trackRegulationOutcome(
  tool: string,
  distressBefore: number,
  distressAfter: number,
): Promise<void> {
  return analyticsEngine.trackRegulationOutcome({
    tool,
    distressBefore,
    distressAfter,
    timestamp: Date.now(),
  });
}

export async function trackOutcomeRecorded(
  outcome: string,
  journeyPhase: string,
  draftId?: string,
): Promise<void> {
  return analyticsEngine.trackEvent(`outcome_${outcome}`, {
    outcome,
    journey_phase: journeyPhase,
    ...(draftId ? { draft_id: draftId } : {}),
  });
}

export async function trackJourneyPhaseChange(
  fromPhase: string,
  toPhase: string,
  zone: string,
): Promise<void> {
  return analyticsEngine.trackEvent('journey_phase_changed', {
    from_phase: fromPhase,
    to_phase: toPhase,
    zone,
  });
}

export async function trackPremiumGate(
  action: 'shown' | 'dismissed' | 'accepted',
  feature: string,
  context?: string,
): Promise<void> {
  return analyticsEngine.trackEvent(`premium_gate_${action}`, {
    feature,
    ...(context ? { context } : {}),
  });
}

export async function trackCoreJourneyStep(
  step: string,
  properties?: Record<string, string | number | boolean>,
): Promise<void> {
  return analyticsEngine.trackEvent('core_journey_step', {
    step,
    ...properties,
  });
}

export async function trackNotificationScheduled(
  category: string,
  ruleId: string,
  priority: string,
  targetScreen: string,
  reason: string,
  safetyState: string,
  isPremium: boolean,
): Promise<void> {
  return analyticsEngine.trackEvent('notification_scheduled', {
    category,
    rule_id: ruleId,
    priority,
    target_screen: targetScreen,
    reason,
    safety_state: safetyState,
    is_premium: isPremium,
  });
}

export async function trackNotificationOpened(
  category: string,
  ruleId: string,
  targetScreen: string,
  timeSinceLastOpen: number,
): Promise<void> {
  return analyticsEngine.trackEvent('notification_opened', {
    category,
    rule_id: ruleId,
    target_screen: targetScreen,
    time_since_last_open_hours: Math.round(timeSinceLastOpen / (60 * 60 * 1000)),
  });
}

export async function trackNotificationSuppressed(
  category: string,
  ruleId: string,
  reason: string,
): Promise<void> {
  return analyticsEngine.trackEvent('notification_suppressed', {
    category,
    rule_id: ruleId,
    reason,
  });
}

export async function trackNotificationConverted(
  category: string,
  ruleId: string,
  targetScreen: string,
): Promise<void> {
  return analyticsEngine.trackEvent('notification_converted_to_action', {
    category,
    rule_id: ruleId,
    target_screen: targetScreen,
  });
}

export async function trackNotificationDeepLink(
  category: string,
  targetRoute: string,
  quickAction: string,
  sessionId: string,
): Promise<void> {
  return analyticsEngine.trackEvent('notification_deep_link', {
    category,
    target_route: targetRoute,
    quick_action: quickAction,
    session_id: sessionId,
  });
}

export async function trackNotificationConversionQuality(
  sessionId: string,
  category: string,
  outcome: string,
  durationSeconds: number,
  distressImprovement: number | null,
): Promise<void> {
  return analyticsEngine.trackEvent('notification_conversion_quality', {
    session_id: sessionId,
    category,
    outcome,
    duration_seconds: durationSeconds,
    distress_improvement: distressImprovement ?? 0,
  });
}

export async function trackPremiumReminderScheduled(
  reminderType: string,
  intentStrength: number,
  upgradeAnchor: string,
  safetyState: string,
  daysSinceLastUpgradeView: number,
): Promise<void> {
  return analyticsEngine.trackEvent('premium_reminder_scheduled', {
    reminder_type: reminderType,
    intent_strength: intentStrength,
    upgrade_anchor: upgradeAnchor,
    safety_state: safetyState,
    days_since_last_upgrade_view: daysSinceLastUpgradeView,
  });
}

export async function trackPremiumReminderOpened(
  reminderType: string,
  upgradeAnchor: string,
): Promise<void> {
  return analyticsEngine.trackEvent('premium_reminder_opened', {
    reminder_type: reminderType,
    upgrade_anchor: upgradeAnchor,
  });
}

export async function trackPremiumReminderDismissed(
  reminderType: string,
): Promise<void> {
  return analyticsEngine.trackEvent('premium_reminder_dismissed', {
    reminder_type: reminderType,
  });
}

export async function trackPremiumReminderConverted(
  reminderType: string,
): Promise<void> {
  return analyticsEngine.trackEvent('premium_reminder_converted', {
    reminder_type: reminderType,
  });
}

export async function trackLifeInsight(
  action: 'generated' | 'viewed',
  properties?: Record<string, string | number | boolean>,
): Promise<void> {
  return analyticsEngine.trackEvent(`insight_${action}`, properties);
}

export async function trackPremiumReminderSuppressed(
  reminderType: string,
  reason: string,
  safetyState: string,
): Promise<void> {
  return analyticsEngine.trackEvent('premium_reminder_suppressed_due_to_safety', {
    reminder_type: reminderType,
    reason,
    safety_state: safetyState,
  });
}

export async function trackSecureRewrite(
  action: string,
  properties?: Record<string, string | number | boolean>,
): Promise<void> {
  return analyticsEngine.trackEvent(`secure_rewrite_${action}`, properties);
}
