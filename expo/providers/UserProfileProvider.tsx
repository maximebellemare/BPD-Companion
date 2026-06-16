import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';
import {
  completeProfileOnboarding,
  getOrCreateProfile,
} from '@/lib/supabase/profiles';
import type { AccountProfile } from '@/types/accountProfile';

export const [UserProfileProvider, useUserProfile] = createContextHook(() => {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!isInitialized) return null;
    if (!isAuthenticated || !user) {
      setProfile(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const next = await getOrCreateProfile(user.id, user.email, new Date(user.createdAt).toISOString());
      setProfile(next);
      return next;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to load profile';
      setError(message);
      console.log('[UserProfileProvider] load error:', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isInitialized, user]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const completeOnboarding = useCallback(
    async (personalization: Record<string, unknown>) => {
      if (!user) throw new Error('You must be signed in to complete onboarding.');
      const next = await completeProfileOnboarding(user.id, personalization);
      setProfile(next);
      return next;
    },
    [user],
  );

  return useMemo(
    () => ({
      profile,
      isLoading,
      error,
      refreshProfile,
      completeOnboarding,
    }),
    [profile, isLoading, error, refreshProfile, completeOnboarding],
  );
});
