import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { OnboardingProfile, DEFAULT_ONBOARDING_PROFILE } from '@/types/onboarding';
import {
  loadOnboardingProfile,
  saveOnboardingProfile,
  isOnboardingComplete,
} from '@/services/onboarding/onboardingService';
import { useUserProfile } from '@/providers/UserProfileProvider';
import { createAccessFlowTimer } from '@/services/performance/accessFlowTiming';

export const [OnboardingProvider, useOnboarding] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { profile: accountProfile, completeOnboarding: completeAccountOnboarding } = useUserProfile();
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile>(DEFAULT_ONBOARDING_PROFILE);

  const profileQuery = useQuery({
    queryKey: ['onboarding_profile'],
    queryFn: loadOnboardingProfile,
  });

  useEffect(() => {
    if (profileQuery.data) {
      setOnboardingProfile(profileQuery.data);
    }
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (profile: OnboardingProfile) => saveOnboardingProfile(profile),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['onboarding_profile'] });
    },
  });

  const updateOnboarding = useCallback((updates: Partial<OnboardingProfile>) => {
    const updated = { ...onboardingProfile, ...updates };
    setOnboardingProfile(updated);
    saveMutation.mutate(updated);
  }, [onboardingProfile, saveMutation]);

  const skipOnboarding = useCallback(() => {
    const skipped = { ...onboardingProfile, skippedAt: Date.now() };
    setOnboardingProfile(skipped);
    saveMutation.mutate(skipped);
    console.log('[OnboardingProvider] Onboarding skipped');
  }, [onboardingProfile, saveMutation]);

  const hasCompletedOnboarding = useMemo(
    () => accountProfile?.onboarding_completed === true || isOnboardingComplete(onboardingProfile),
    [accountProfile?.onboarding_completed, onboardingProfile],
  );

  const completeOnboardingAndProfile = useCallback(async (finalProfile: OnboardingProfile) => {
    const timer = createAccessFlowTimer('onboarding');
    const completed = { ...finalProfile, completedAt: Date.now() };
    const nextProfile = await completeAccountOnboarding(completed as unknown as Record<string, unknown>);
    timer.mark('supabase_onboarding_update_complete');

    setOnboardingProfile(completed);
    queryClient.setQueryData(['onboarding_profile'], completed);

    const localPersistence = saveOnboardingProfile(completed)
      .then(() => {
        timer.mark('local_persistence_complete');
      })
      .catch((error) => {
        if (__DEV__) {
          console.log('[OnboardingProvider] local persistence failed after completion:', error);
        }
      });

    void localPersistence;
    console.log('[OnboardingProvider] Onboarding completed');
    return nextProfile;
  }, [completeAccountOnboarding, queryClient]);

  return useMemo(() => ({
    onboardingProfile,
    hasCompletedOnboarding,
    isLoading: profileQuery.isLoading,
    updateOnboarding,
    completeOnboarding: completeOnboardingAndProfile,
    skipOnboarding,
  }), [
    onboardingProfile,
    hasCompletedOnboarding,
    profileQuery.isLoading,
    updateOnboarding,
    completeOnboardingAndProfile,
    skipOnboarding,
  ]);
});
