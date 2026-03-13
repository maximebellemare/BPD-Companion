import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getValuesState,
  toggleValue,
  updateValueReflection,
  reorderValues,
  getSelfTrustResponses,
  saveSelfTrustResponse,
  toggleSelfTrustFavorite,
  CORE_VALUES,
} from '@/services/identity/valuesService';
import {
  getAnchorStatements,
  saveAnchorStatement,
  toggleAnchorPin,
  toggleAnchorFavorite,
  deleteAnchorStatement,
  getConflictSessions,
  saveConflictSession,
  deleteConflictSession,
} from '@/services/identity/selfTrustService';
import {
  getIdentityJournalEntries,
  saveIdentityJournalEntry,
  updateIdentityJournalEntry,
  deleteIdentityJournalEntry,
  toggleIdentityJournalFavorite,
} from '@/services/identity/identityJournalService';
import type { ConflictAlignmentSession } from '@/types/identity';

export function useIdentityValues() {
  const queryClient = useQueryClient();

  const valuesQuery = useQuery({
    queryKey: ['identity_values'],
    queryFn: getValuesState,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ valueId, reflection }: { valueId: string; reflection?: string }) =>
      toggleValue(valueId, reflection),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['identity_values'] });
    },
  });

  const reflectionMutation = useMutation({
    mutationFn: ({ valueId, reflection }: { valueId: string; reflection: string }) =>
      updateValueReflection(valueId, reflection),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['identity_values'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderValues(orderedIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['identity_values'] });
    },
  });

  const state = valuesQuery.data ?? { selectedValues: [], updatedAt: 0 };
  const selectedIds = state.selectedValues.map(v => v.valueId);
  const selectedValues = CORE_VALUES.filter(v => selectedIds.includes(v.id))
    .sort((a, b) => {
      const rankA = state.selectedValues.find(sv => sv.valueId === a.id)?.rank ?? 999;
      const rankB = state.selectedValues.find(sv => sv.valueId === b.id)?.rank ?? 999;
      return rankA - rankB;
    });

  return {
    state,
    selectedValues,
    selectedIds,
    isLoading: valuesQuery.isLoading,
    toggle: toggleMutation.mutate,
    updateReflection: reflectionMutation.mutate,
    reorder: reorderMutation.mutate,
  };
}

export function useSelfTrustPrompts() {
  const queryClient = useQueryClient();

  const responsesQuery = useQuery({
    queryKey: ['self_trust_responses'],
    queryFn: getSelfTrustResponses,
  });

  const saveMutation = useMutation({
    mutationFn: ({ promptId, promptText, response }: { promptId: string; promptText: string; response: string }) =>
      saveSelfTrustResponse(promptId, promptText, response),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['self_trust_responses'] });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (responseId: string) => toggleSelfTrustFavorite(responseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['self_trust_responses'] });
    },
  });

  return {
    responses: responsesQuery.data ?? [],
    isLoading: responsesQuery.isLoading,
    saveResponse: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    toggleFavorite: favoriteMutation.mutate,
  };
}

export function useAnchorStatements() {
  const queryClient = useQueryClient();

  const anchorsQuery = useQuery({
    queryKey: ['anchor_statements'],
    queryFn: getAnchorStatements,
  });

  const saveMutation = useMutation({
    mutationFn: (text: string) => saveAnchorStatement(text),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['anchor_statements'] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: (id: string) => toggleAnchorPin(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['anchor_statements'] });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => toggleAnchorFavorite(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['anchor_statements'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnchorStatement(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['anchor_statements'] });
    },
  });

  const anchors = anchorsQuery.data ?? [];
  const pinnedAnchors = anchors.filter(a => a.isPinned);

  return {
    anchors,
    pinnedAnchors,
    isLoading: anchorsQuery.isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    togglePin: pinMutation.mutate,
    toggleFavorite: favoriteMutation.mutate,
    remove: deleteMutation.mutate,
  };
}

export function useIdentityJournal() {
  const queryClient = useQueryClient();

  const entriesQuery = useQuery({
    queryKey: ['identity_journal'],
    queryFn: getIdentityJournalEntries,
  });

  const saveMutation = useMutation({
    mutationFn: ({ promptId, promptText, content, tags }: { promptId: string; promptText: string; content: string; tags: string[] }) =>
      saveIdentityJournalEntry(promptId, promptText, content, tags),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['identity_journal'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<{ content: string; tags: string[]; isFavorite: boolean }> }) =>
      updateIdentityJournalEntry(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['identity_journal'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIdentityJournalEntry(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['identity_journal'] });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => toggleIdentityJournalFavorite(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['identity_journal'] });
    },
  });

  return {
    entries: entriesQuery.data ?? [],
    isLoading: entriesQuery.isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    toggleFavorite: favoriteMutation.mutate,
  };
}

export function useConflictAlignment() {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['conflict_sessions'],
    queryFn: getConflictSessions,
  });

  const saveMutation = useMutation({
    mutationFn: (session: Omit<ConflictAlignmentSession, 'id' | 'createdAt'>) =>
      saveConflictSession(session),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conflict_sessions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConflictSession(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conflict_sessions'] });
    },
  });

  return {
    sessions: sessionsQuery.data ?? [],
    isLoading: sessionsQuery.isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    remove: deleteMutation.mutate,
  };
}
