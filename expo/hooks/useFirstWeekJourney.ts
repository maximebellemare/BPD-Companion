import { useMemo } from 'react';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { useApp } from '@/providers/AppProvider';
import { buildFirstWeekJourneySummary } from '@/services/insights/firstWeekJourneyService';
import { FirstWeekJourneySummary } from '@/types/firstWeekJourney';
import { useProgress } from '@/hooks/useProgress';

export function useFirstWeekJourney(): FirstWeekJourneySummary {
  const { journalEntries } = useApp();
  const { conversations, memoryProfile } = useAICompanion();
  const progress = useProgress();

  return useMemo(
    () => buildFirstWeekJourneySummary({
      journalEntries,
      conversations,
      memoryProfile,
      progress,
    }),
    [journalEntries, conversations, memoryProfile, progress],
  );
}
