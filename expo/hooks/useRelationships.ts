import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/providers/AppProvider';
import { useAICompanion } from '@/providers/AICompanionProvider';
import {
  RelationshipProfile,
  RelationshipEvent,
  RelationshipType,
  RelationshipProfileAnalysis,
} from '@/types/relationship';
import {
  getRelationshipProfiles,
  addRelationshipProfile as addProfileService,
  updateRelationshipProfile as updateProfileService,
  deleteRelationshipProfile as deleteProfileService,
  getRelationshipEvents,
  addRelationshipEvent as addEventService,
} from '@/services/relationships/relationshipService';
import { analyzeRelationshipProfile } from '@/services/relationships/relationshipPatternAnalyzer';

export function useRelationships() {
  const queryClient = useQueryClient();
  const { journalEntries, messageDrafts } = useApp();
  const { conversations } = useAICompanion();

  const profilesQuery = useQuery({
    queryKey: ['relationship_profiles'],
    queryFn: getRelationshipProfiles,
  });

  const eventsQuery = useQuery({
    queryKey: ['relationship_events'],
    queryFn: getRelationshipEvents,
  });

  const addProfileMutation = useMutation({
    mutationFn: ({ name, type, notes }: { name: string; type: RelationshipType; notes?: string }) =>
      addProfileService(name, type, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['relationship_profiles'] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<RelationshipProfile, 'id' | 'createdAt'>> }) =>
      updateProfileService(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['relationship_profiles'] });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) => deleteProfileService(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['relationship_profiles'] });
      void queryClient.invalidateQueries({ queryKey: ['relationship_events'] });
    },
  });

  const addEventMutation = useMutation({
    mutationFn: (event: Omit<RelationshipEvent, 'id'>) => addEventService(event),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['relationship_events'] });
    },
  });

  const profiles = profilesQuery.data ?? [];
  const storedEvents = eventsQuery.data ?? [];

  const analyses = useMemo<RelationshipProfileAnalysis[]>(() => {
    if (profiles.length === 0) return [];
    return profiles.map(profile =>
      analyzeRelationshipProfile(profile, journalEntries, messageDrafts, storedEvents, conversations)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, storedEvents, journalEntries, messageDrafts, conversations]);

  return {
    profiles,
    events: storedEvents,
    analyses,
    isLoading: profilesQuery.isLoading || eventsQuery.isLoading,
    addProfile: addProfileMutation.mutate,
    isAddingProfile: addProfileMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    deleteProfile: deleteProfileMutation.mutate,
    addEvent: addEventMutation.mutate,
  };
}

export function useRelationshipDetail(profileId: string) {
  const { profiles, analyses, isLoading, updateProfile, deleteProfile, addEvent } = useRelationships();

  const analysis = useMemo(() => {
    return analyses.find(a => a.profile.id === profileId) ?? null;
  }, [analyses, profileId]);

  const profile = useMemo(() => {
    return profiles.find(p => p.id === profileId) ?? null;
  }, [profiles, profileId]);

  return {
    profile,
    analysis,
    isLoading,
    updateProfile: useCallback(
      (updates: Partial<Omit<RelationshipProfile, 'id' | 'createdAt'>>) =>
        updateProfile({ id: profileId, updates }),
      [profileId, updateProfile]
    ),
    deleteProfile: useCallback(() => deleteProfile(profileId), [profileId, deleteProfile]),
    addEvent,
  };
}
