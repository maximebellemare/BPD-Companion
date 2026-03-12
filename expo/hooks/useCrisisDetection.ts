import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import { detectCrisis } from '@/services/crisis/crisisDetectionService';
import { CrisisDetectionResult } from '@/types/crisis';

export function useCrisisDetection(): CrisisDetectionResult {
  const { journalEntries, messageDrafts } = useApp();

  const result = useMemo(() => {
    return detectCrisis(journalEntries, messageDrafts);
  }, [journalEntries, messageDrafts]);

  return result;
}
