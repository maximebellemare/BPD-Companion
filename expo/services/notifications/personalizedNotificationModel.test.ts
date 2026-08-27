import {
  selectPersonalizedNotificationCopy,
} from '@/services/notifications/personalizedNotificationModel';
import { DEFAULT_ONBOARDING_PROFILE, type OnboardingProfile } from '@/types/onboarding';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Personalized notification regression failed: ${message}`);
}

const fallback = {
  title: 'Fallback title',
  body: 'Fallback body',
};

export function assertPersonalizedNotificationScenarios(): true {
  const relationshipProfile: OnboardingProfile = {
    ...DEFAULT_ONBOARDING_PROFILE,
    primaryReasons: ['fear_of_abandonment'],
    hardestMoments: ['delayed_replies'],
  };
  const pauseProfile: OnboardingProfile = {
    ...DEFAULT_ONBOARDING_PROFILE,
    primaryReasons: ['impulsive_messaging'],
    preferredTools: ['pause_before_messaging'],
  };
  const regulationProfile: OnboardingProfile = {
    ...DEFAULT_ONBOARDING_PROFILE,
    primaryReasons: ['emotional_overwhelm'],
    preferredTools: ['grounding'],
  };

  assert(
    selectPersonalizedNotificationCopy('journal_prompt', { onboardingProfile: relationshipProfile }, fallback).title ===
      'A gentle relationship check-in',
    'relationship onboarding personalizes journal prompt copy',
  );
  assert(
    selectPersonalizedNotificationCopy('message_session_intense', { onboardingProfile: pauseProfile }, fallback).title ===
      'A pause is available',
    'pause onboarding personalizes message-session copy',
  );
  assert(
    selectPersonalizedNotificationCopy('distress_pattern', { onboardingProfile: regulationProfile }, fallback).title ===
      'A steadier moment is here',
    'regulation onboarding personalizes distress support copy',
  );
  const untouched = selectPersonalizedNotificationCopy('inactivity', { onboardingProfile: relationshipProfile }, fallback);
  assert(untouched === fallback, 'unmapped signal keeps existing notification copy');
  assert(!untouched.title.toLowerCase().includes('bpd'), 'fallback assertion keeps lock-screen copy discreet in this test');

  return true;
}

export const personalizedNotificationTestsPassed =
  assertPersonalizedNotificationScenarios();
