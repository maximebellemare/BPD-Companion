import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/providers/AppProvider';
import { EmotionalMirrorReport } from '@/types/emotionalMirror';
import {
  generateEmotionalMirrorReport,
  saveReport,
  getStoredReports,
} from '@/services/insights/emotionalMirrorService';

export function useEmotionalMirror() {
  const { journalEntries, messageDrafts } = useApp();
  const queryClient = useQueryClient();

  const currentReport = useMemo(
    () => generateEmotionalMirrorReport(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const historyQuery = useQuery({
    queryKey: ['emotional_mirror_history'],
    queryFn: getStoredReports,
  });

  const saveMutation = useMutation({
    mutationFn: (report: EmotionalMirrorReport) => saveReport(report),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['emotional_mirror_history'] });
    },
  });

  const saveCurrentReport = useCallback(() => {
    saveMutation.mutate(currentReport);
  }, [saveMutation, currentReport]);

  return {
    currentReport,
    history: historyQuery.data ?? [],
    isLoadingHistory: historyQuery.isLoading,
    saveCurrentReport,
    isSaving: saveMutation.isPending,
  };
}
