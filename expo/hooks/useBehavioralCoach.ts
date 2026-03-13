import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import {
  buildBehavioralCoachProfile,
  getCoachSessionSummary,
  getHomeCoachingMoment,
} from '@/services/coaching/behavioralCoachService';
import { BehavioralCoachProfile, CoachSessionSummary, CoachingMoment } from '@/types/behavioralCoach';

export function useBehavioralCoach(): {
  profile: BehavioralCoachProfile | null;
  session: CoachSessionSummary | null;
  homeMoment: CoachingMoment | null;
  hasData: boolean;
} {
  const { journalEntries, messageDrafts } = useApp();

  const hasData = journalEntries.length >= 2;

  const profile = useMemo<BehavioralCoachProfile | null>(() => {
    if (!hasData) return null;
    try {
      return buildBehavioralCoachProfile(journalEntries, messageDrafts);
    } catch (err) {
      console.log('[useBehavioralCoach] Error building profile:', err);
      return null;
    }
  }, [journalEntries, messageDrafts, hasData]);

  const session = useMemo<CoachSessionSummary | null>(() => {
    if (!hasData) return null;
    try {
      return getCoachSessionSummary(journalEntries, messageDrafts);
    } catch (err) {
      console.log('[useBehavioralCoach] Error building session:', err);
      return null;
    }
  }, [journalEntries, messageDrafts, hasData]);

  const homeMoment = useMemo<CoachingMoment | null>(() => {
    if (!hasData) return null;
    try {
      return getHomeCoachingMoment(journalEntries, messageDrafts);
    } catch (err) {
      console.log('[useBehavioralCoach] Error getting home moment:', err);
      return null;
    }
  }, [journalEntries, messageDrafts, hasData]);

  return { profile, session, homeMoment, hasData };
}
