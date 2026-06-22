import { useMemo, useCallback, useRef } from 'react';
import { useApp } from '@/providers/AppProvider';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { useMedications } from '@/providers/MedicationProvider';
import { useAppointments } from '@/providers/AppointmentProvider';
import { useMovement } from '@/providers/MovementProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  buildContextSnapshot,
  generateSmartRecommendations,
} from '@/services/recommendation/recommendationEngine';
import { SmartRecommendationResult, SmartRecommendation } from '@/types/smartRecommendation';

export function useSmartRecommendations(): SmartRecommendationResult & {
  trackShown: () => void;
  trackClicked: (rec: SmartRecommendation) => void;
  trackCompleted: (rec: SmartRecommendation) => void;
  trackIgnored: (rec: SmartRecommendation) => void;
} {
  const { journalEntries, messageDrafts } = useApp();
  const { onboardingProfile } = useOnboarding();
  const medicationContext = useMedications();
  const appointmentContext = useAppointments();
  const activeMedications = medicationContext?.activeMedications ?? [];
  const medicationLogs = medicationContext?.logs ?? [];
  const appointments = appointmentContext?.appointments ?? [];
  const { entries: movementEntries } = useMovement();
  const { trackEvent } = useAnalytics();
  const shownTrackedRef = useRef(false);

  const ctx = useMemo(
    () => buildContextSnapshot(
      journalEntries,
      messageDrafts,
      onboardingProfile,
      activeMedications,
      medicationLogs,
      appointments,
      movementEntries,
    ),
    [
      journalEntries,
      messageDrafts,
      onboardingProfile,
      activeMedications,
      medicationLogs,
      appointments,
      movementEntries,
    ],
  );

  const result = useMemo(
    () => generateSmartRecommendations(ctx),
    [ctx],
  );

  const trackShown = useCallback(() => {
    if (shownTrackedRef.current || result.recommendations.length === 0) return;
    shownTrackedRef.current = true;
    trackEvent('recommendation_shown', {
      count: result.recommendations.length,
      top_tool: result.topRecommendation?.toolId ?? 'none',
      top_signal: result.signals[0] ?? 'none',
      zone: ctx.emotionalZone,
    });
  }, [result, ctx.emotionalZone, trackEvent]);

  const trackClicked = useCallback((rec: SmartRecommendation) => {
    trackEvent('recommendation_clicked', {
      tool_id: rec.toolId,
      signal: rec.signal,
      urgency: rec.urgency,
      score: rec.score,
      zone: ctx.emotionalZone,
    });
  }, [ctx.emotionalZone, trackEvent]);

  const trackCompleted = useCallback((rec: SmartRecommendation) => {
    trackEvent('recommendation_completed', {
      tool_id: rec.toolId,
      signal: rec.signal,
    });
  }, [trackEvent]);

  const trackIgnored = useCallback((rec: SmartRecommendation) => {
    trackEvent('recommendation_ignored', {
      tool_id: rec.toolId,
      signal: rec.signal,
    });
  }, [trackEvent]);

  return {
    ...result,
    trackShown,
    trackClicked,
    trackCompleted,
    trackIgnored,
  };
}
