import type { OnboardingProfile } from '@/types/onboarding';
import type { BehaviorSignalType } from '@/types/behaviorNotifications';

export interface PersonalizedNotificationContext {
  onboardingProfile?: OnboardingProfile | null;
}

export interface NotificationCopy {
  title: string;
  body: string;
}

function hasAny(values: readonly string[] | undefined, targets: readonly string[]): boolean {
  return targets.some(target => values?.includes(target));
}

function wantsRelationshipSupport(profile: OnboardingProfile): boolean {
  return hasAny(profile.primaryReasons, [
    'relationship_conflict',
    'fear_of_abandonment',
    'relationship_spirals',
  ]) || hasAny(profile.hardestMoments, [
    'delayed_replies',
    'conflict',
    'feeling_rejected',
    'fear_of_being_too_much',
  ]);
}

function wantsPauseSupport(profile: OnboardingProfile): boolean {
  return hasAny(profile.primaryReasons, [
    'impulsive_urges',
    'impulsive_messaging',
  ]) || hasAny(profile.preferredTools, [
    'pause_before_messaging',
  ]);
}

function wantsRegulationSupport(profile: OnboardingProfile): boolean {
  return hasAny(profile.primaryReasons, [
    'intense_emotions',
    'emotional_overwhelm',
    'mood_swings',
  ]) || hasAny(profile.preferredTools, [
    'calm_emotional_spikes',
    'grounding',
  ]);
}

export function selectPersonalizedNotificationCopy(
  signalType: BehaviorSignalType,
  context: PersonalizedNotificationContext | null | undefined,
  fallback: NotificationCopy,
): NotificationCopy {
  const profile = context?.onboardingProfile ?? null;
  if (!profile) return fallback;

  if (signalType === 'message_session_intense' && wantsPauseSupport(profile)) {
    return {
      title: 'A pause is available',
      body: 'If that message stirred things up, a few lines of reflection can help.',
    };
  }

  if ((signalType === 'distress_pattern' || signalType === 'evening_unprocessed') && wantsRegulationSupport(profile)) {
    return {
      title: 'A steadier moment is here',
      body: 'A short grounding check-in is ready when you want support.',
    };
  }

  if ((signalType === 'journal_prompt' || signalType === 'companion_absence') && wantsRelationshipSupport(profile)) {
    return {
      title: 'A gentle relationship check-in',
      body: 'You can sort through what happened without sending anything.',
    };
  }

  if (signalType === 'growth_signal' && wantsRelationshipSupport(profile)) {
    return {
      title: 'A little progress to notice',
      body: 'The way you are tracking patterns can make hard moments easier to read.',
    };
  }

  return fallback;
}
