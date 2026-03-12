import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import {
  generateDailyCoaching,
  getCoachingWins,
  getMessageCoachingNudge,
} from '@/services/coaching/behavioralCoachingService';
import { DailyCoaching, CoachingWin, CoachingNudge } from '@/types/coaching';

export function useCoaching(): {
  dailyCoaching: DailyCoaching | null;
  wins: CoachingWin[];
  hasData: boolean;
} {
  const { journalEntries, messageDrafts } = useApp();

  const hasData = journalEntries.length > 0 || messageDrafts.length > 0;

  const dailyCoaching = useMemo<DailyCoaching | null>(() => {
    if (!hasData) return null;
    try {
      return generateDailyCoaching(journalEntries, messageDrafts);
    } catch (err) {
      console.log('[useCoaching] Error generating coaching:', err);
      return null;
    }
  }, [journalEntries, messageDrafts, hasData]);

  const wins = useMemo<CoachingWin[]>(() => {
    if (!hasData) return [];
    try {
      return getCoachingWins(journalEntries, messageDrafts);
    } catch (err) {
      console.log('[useCoaching] Error generating wins:', err);
      return [];
    }
  }, [journalEntries, messageDrafts, hasData]);

  return { dailyCoaching, wins, hasData };
}

export function useMessageCoaching(): CoachingNudge | null {
  const { journalEntries, messageDrafts } = useApp();

  return useMemo<CoachingNudge | null>(() => {
    if (journalEntries.length === 0 && messageDrafts.length === 0) return null;
    try {
      return getMessageCoachingNudge(journalEntries, messageDrafts);
    } catch (err) {
      console.log('[useMessageCoaching] Error:', err);
      return null;
    }
  }, [journalEntries, messageDrafts]);
}
