import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { UserProfile, PatternSummary } from '@/types/profile';
import { DEFAULT_PROFILE } from '@/types/profile';
import { profileRepository } from '@/services/repositories';
import { computePatternSummary } from '@/services/profile/profileService';
import { useApp } from '@/providers/AppProvider';

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { journalEntries } = useApp();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileRepository.load(),
  });

  useEffect(() => {
    if (profileQuery.data) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (p: UserProfile) => profileRepository.save(p),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    saveMutation.mutate(updated);
  }, [profile, saveMutation]);

  const updateCrisisSupport = useCallback((updates: Partial<UserProfile['crisisSupport']>) => {
    const updated = { ...profile, crisisSupport: { ...profile.crisisSupport, ...updates } };
    setProfile(updated);
    saveMutation.mutate(updated);
  }, [profile, saveMutation]);

  const updateNotifications = useCallback((updates: Partial<UserProfile['notifications']>) => {
    const updated = { ...profile, notifications: { ...profile.notifications, ...updates } };
    setProfile(updated);
    saveMutation.mutate(updated);
  }, [profile, saveMutation]);

  const updatePrivacy = useCallback((updates: Partial<UserProfile['privacy']>) => {
    const updated = { ...profile, privacy: { ...profile.privacy, ...updates } };
    setProfile(updated);
    saveMutation.mutate(updated);
  }, [profile, saveMutation]);

  const patternSummary = useMemo<PatternSummary>(() => {
    return computePatternSummary(journalEntries);
  }, [journalEntries]);

  return useMemo(() => ({
    profile,
    patternSummary,
    updateProfile,
    updateCrisisSupport,
    updateNotifications,
    updatePrivacy,
    isLoading: profileQuery.isLoading,
    isSaving: saveMutation.isPending,
  }), [
    profile,
    patternSummary,
    updateProfile,
    updateCrisisSupport,
    updateNotifications,
    updatePrivacy,
    profileQuery.isLoading,
    saveMutation.isPending,
  ]);
});
