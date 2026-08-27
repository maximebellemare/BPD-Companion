import { useMemo } from 'react';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { useApp } from '@/providers/AppProvider';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { buildFirstWeekJourneySummary } from '@/services/insights/firstWeekJourneyService';
import { FirstWeekJourneySummary } from '@/types/firstWeekJourney';
import { useProgress } from '@/hooks/useProgress';

export function useFirstWeekJourney(): FirstWeekJourneySummary {
  const { journalEntries } = useApp();
  const { conversations, memoryProfile } = useAICompanion();
  const { onboardingProfile } = useOnboarding();
  const { state } = useSubscription();
  const progress = useProgress();

  return useMemo(
    () => buildFirstWeekJourneySummary({
      journalEntries,
      conversations,
      memoryProfile,
      onboardingProfile,
      progress,
      trialStartedAt: state.isTrialActive ? state.startedAt : null,
    }),
    [journalEntries, conversations, memoryProfile, onboardingProfile, progress, state.isTrialActive, state.startedAt],
  );
}
