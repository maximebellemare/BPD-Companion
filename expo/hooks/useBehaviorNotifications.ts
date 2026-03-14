import { useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useProfile } from '@/providers/ProfileProvider';
import { useEmotionalContext } from '@/providers/EmotionalContextProvider';
import { useApp } from '@/providers/AppProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { behaviorTrackingService } from '@/services/notifications/behaviorTrackingService';
import { behaviorNotificationEngine, BehaviorNotificationPreferences } from '@/services/notifications/behaviorNotificationEngine';
import { QuietHours } from '@/types/notifications';

const EVAL_INTERVAL_MS = 20 * 60 * 1000;
const MIN_EVAL_GAP_MS = 10 * 60 * 1000;

export function useBehaviorNotifications() {
  const { profile } = useProfile();
  const { activeContext } = useEmotionalContext();
  const { journalEntries, messageDrafts } = useApp();
  const { trackEvent } = useAnalytics();
  const lastEvalRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);
  const prevCheckInCountRef = useRef<number>(0);
  const prevJournalCountRef = useRef<number>(0);
  const prevDraftCountRef = useRef<number>(0);

  const quietHours = useMemo<QuietHours>(() => ({
    enabled: profile.notifications.quietHoursEnabled,
    startTime: profile.notifications.quietHoursStart,
    endTime: profile.notifications.quietHoursEnd,
  }), [
    profile.notifications.quietHoursEnabled,
    profile.notifications.quietHoursStart,
    profile.notifications.quietHoursEnd,
  ]);

  const frequency = profile.notifications.frequency ?? 'balanced';

  const behaviorPrefs = useMemo<BehaviorNotificationPreferences>(() => ({
    behaviorCheckIns: profile.notifications.behaviorCheckIns ?? true,
    behaviorDistressSupport: profile.notifications.behaviorDistressSupport ?? true,
    behaviorJournalPrompts: profile.notifications.behaviorJournalPrompts ?? true,
    behaviorProgressCelebrations: profile.notifications.behaviorProgressCelebrations ?? true,
  }), [
    profile.notifications.behaviorCheckIns,
    profile.notifications.behaviorDistressSupport,
    profile.notifications.behaviorJournalPrompts,
    profile.notifications.behaviorProgressCelebrations,
  ]);

  const runEvaluation = useCallback(async () => {
    const now = Date.now();
    if (now - lastEvalRef.current < MIN_EVAL_GAP_MS) {
      return;
    }
    lastEvalRef.current = now;

    try {
      const result = await behaviorNotificationEngine.evaluate(
        activeContext.latestIntensity,
        quietHours,
        frequency,
        behaviorPrefs,
      );

      for (const decision of result.fired) {
        await behaviorNotificationEngine.fireDecision(
          decision,
          quietHours,
          activeContext.latestIntensity,
        );

        trackEvent('behavior_notification_evaluated', {
          signal_type: decision.signalType,
          priority: decision.priority,
          should_fire: true,
        });
      }

      for (const suppressed of result.suppressed) {
        trackEvent('behavior_notification_suppressed', {
          signal_type: suppressed.signalType,
          reason: suppressed.reason,
        });
      }
    } catch (error) {
      console.error('[useBehaviorNotifications] Evaluation error:', error);
    }
  }, [activeContext.latestIntensity, quietHours, frequency, behaviorPrefs, trackEvent]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      await behaviorTrackingService.initialize();
      await behaviorTrackingService.recordAppOpen();
      prevCheckInCountRef.current = journalEntries.length;
      prevJournalCountRef.current = journalEntries.length;
      prevDraftCountRef.current = messageDrafts.length;

      setTimeout(() => {
        void runEvaluation();
      }, 5000);
    };
    void init();
  }, [runEvaluation, journalEntries.length, messageDrafts.length]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      void runEvaluation();
    }, EVAL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [runEvaluation]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void behaviorTrackingService.recordAppOpen();
        void runEvaluation();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [runEvaluation]);

  useEffect(() => {
    if (journalEntries.length > prevCheckInCountRef.current) {
      const latest = journalEntries[0];
      if (latest) {
        void behaviorTrackingService.recordCheckIn(latest.checkIn.intensityLevel);
        void behaviorTrackingService.recordJournalEntry();
      }
    }
    prevCheckInCountRef.current = journalEntries.length;
  }, [journalEntries.length, journalEntries]);

  useEffect(() => {
    if (messageDrafts.length > prevDraftCountRef.current) {
      const latest = messageDrafts[0];
      const wasIntense = latest?.rewriteType === 'nosend' ||
        latest?.rewriteType === 'boundary' ||
        latest?.rewriteType === 'secure';
      void behaviorTrackingService.recordMessageSession(wasIntense);
    }
    prevDraftCountRef.current = messageDrafts.length;
  }, [messageDrafts.length, messageDrafts]);

  const recordCompanionSession = useCallback(() => {
    void behaviorTrackingService.recordCompanionSession();
  }, []);

  const recordGrowthSignal = useCallback((signal: string) => {
    void behaviorTrackingService.recordGrowthSignal(signal);
  }, []);

  return {
    runEvaluation,
    recordCompanionSession,
    recordGrowthSignal,
  };
}
