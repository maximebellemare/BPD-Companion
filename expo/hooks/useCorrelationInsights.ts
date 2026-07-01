import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/providers/AppProvider';
import { useMedications } from '@/providers/MedicationProvider';
import { useAppointments } from '@/providers/AppointmentProvider';
import { useMovement } from '@/providers/MovementProvider';
import {
  generateCorrelationInsights,
  buildCorrelationSummary,
  buildWhatHelps,
  saveCorrelationInsights,
  getStoredCorrelationInsights,
  markCorrelationViewed,
} from '@/services/insights/correlationInsightService';
import { trackEvent } from '@/services/analytics/analyticsService';

export function useCorrelationInsights() {
  const { journalEntries, messageDrafts } = useApp();
  const medicationContext = useMedications();
  const appointmentContext = useAppointments();
  const medicationLogs = medicationContext?.logs ?? [];
  const appointments = appointmentContext?.appointments ?? [];
  const { entries: movementEntries } = useMovement();
  const queryClient = useQueryClient();

  const storedQuery = useQuery({
    queryKey: ['correlationInsights'],
    queryFn: getStoredCorrelationInsights,
  });

  const currentInsights = useMemo(() => {
    console.log('[useCorrelationInsights] Computing correlations');
    return generateCorrelationInsights(
      journalEntries,
      messageDrafts,
      medicationLogs,
      appointments,
      movementEntries,
    );
  }, [journalEntries, messageDrafts, medicationLogs, appointments, movementEntries]);

  const summary = useMemo(
    () => buildCorrelationSummary(currentInsights),
    [currentInsights],
  );

  const whatHelps = useMemo(
    () => buildWhatHelps(currentInsights),
    [currentInsights],
  );

  const generateAndSaveMutation = useMutation({
    mutationFn: async () => {
      const insights = generateCorrelationInsights(
        journalEntries,
        messageDrafts,
        medicationLogs,
        appointments,
        movementEntries,
      );
      await saveCorrelationInsights(insights);
      void trackEvent('correlation_insight_generated', { count: insights.length });
      return insights;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['correlationInsights'] });
    },
  });

  const markViewedMutation = useMutation({
    mutationFn: async (insightId: string) => {
      await markCorrelationViewed(insightId);
      void trackEvent('correlation_insight_viewed', { insight_id: insightId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['correlationInsights'] });
    },
  });

  const hasEnoughData = journalEntries.length >= 3;

  return {
    insights: currentInsights,
    storedInsights: storedQuery.data ?? [],
    summary,
    whatHelps,
    hasEnoughData,
    isLoading: storedQuery.isLoading,
    generateInsights: generateAndSaveMutation.mutate,
    markViewed: markViewedMutation.mutate,
    isGenerating: generateAndSaveMutation.isPending,
  };
}
