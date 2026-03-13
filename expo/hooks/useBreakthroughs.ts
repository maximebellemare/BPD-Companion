import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/providers/AppProvider';
import {
  detectBreakthroughs,
  computeBreakthroughSummary,
  getSavedBreakthroughs,
  saveBreakthrough,
  removeBreakthrough,
  markShared,
} from '@/services/insights/breakthroughService';
import type { BreakthroughMoment } from '@/types/breakthrough';

export function useBreakthroughs() {
  const queryClient = useQueryClient();
  const { journalEntries, messageDrafts } = useApp();

  const savedQuery = useQuery({
    queryKey: ['saved_breakthroughs'],
    queryFn: getSavedBreakthroughs,
  });

  const detected = useMemo(
    () => detectBreakthroughs(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const savedMoments = useMemo(() => savedQuery.data ?? [], [savedQuery.data]);

  const allMoments = useMemo(() => {
    const savedIds = new Set(savedMoments.map(m => m.id));
    const merged = [
      ...savedMoments,
      ...detected.filter(d => !savedIds.has(d.id)),
    ];
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  }, [detected, savedMoments]);

  const summary = useMemo(
    () => computeBreakthroughSummary(allMoments),
    [allMoments],
  );

  const saveMutation = useMutation({
    mutationFn: (moment: BreakthroughMoment) => saveBreakthrough(moment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved_breakthroughs'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeBreakthrough(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved_breakthroughs'] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: (id: string) => markShared(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved_breakthroughs'] });
    },
  });

  return {
    moments: allMoments,
    detected,
    savedMoments,
    summary,
    isLoading: savedQuery.isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    remove: removeMutation.mutate,
    markShared: shareMutation.mutate,
  };
}
