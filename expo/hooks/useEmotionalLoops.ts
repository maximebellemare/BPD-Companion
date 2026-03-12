import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import { detectEmotionalLoops } from '@/services/patterns/emotionalLoopService';
import { EmotionalLoopReport } from '@/types/emotionalLoop';

export function useEmotionalLoops(): EmotionalLoopReport {
  const { journalEntries, messageDrafts } = useApp();

  const report = useMemo(() => {
    return detectEmotionalLoops(journalEntries, messageDrafts);
  }, [journalEntries, messageDrafts]);

  return report;
}
