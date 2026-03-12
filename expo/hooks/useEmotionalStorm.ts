import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import { detectEmotionalStorm, EmotionalStormResult } from '@/services/prediction/emotionalStormService';

export function useEmotionalStorm(): EmotionalStormResult {
  const { journalEntries, messageDrafts } = useApp();

  const result = useMemo(() => {
    return detectEmotionalStorm(journalEntries, messageDrafts);
  }, [journalEntries, messageDrafts]);

  return result;
}
