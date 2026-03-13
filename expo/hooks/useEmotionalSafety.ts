import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import { predictEmotionalSafety } from '@/services/prediction/emotionalPredictor';
import { SafetyPrediction } from '@/types/safetyPredictor';

export function useEmotionalSafety(): SafetyPrediction {
  const { journalEntries, messageDrafts } = useApp();

  const prediction = useMemo(() => {
    return predictEmotionalSafety(journalEntries, messageDrafts);
  }, [journalEntries, messageDrafts]);

  return prediction;
}
