import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useApp } from '@/providers/AppProvider';
import { useJournal } from '@/providers/JournalProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useAICompanion } from '@/providers/AICompanionProvider';
import {
  detectSpiralFromSmartEntries,
  generateWeeklySpiralInsight,
  getSpiralPausePrompt,
} from '@/services/emotions/spiralDetectionService';
import {
  getSpiralHistory,
  saveSpiralHistory,
  computeSpiralTrend,
  SpiralTrend,
} from '@/services/emotions/spiralHistoryService';
import {
  SpiralDetectionResult,
  SpiralHistoryEntry,
  SpiralWeeklyInsight,
  SpiralPausePromptConfig,
} from '@/types/spiral';

export const [SpiralPreventionProvider, useSpiralPrevention] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { journalEntries, messageDrafts } = useApp();
  const { conversations } = useAICompanion();
  const { smartEntries } = useJournal();
  const { trackEvent } = useAnalytics();
  const [history, setHistory] = useState<SpiralHistoryEntry[]>([]);
  const [showPausePrompt, setShowPausePrompt] = useState<boolean>(false);
  const [dismissedUntil, setDismissedUntil] = useState<number>(0);
  const lastRecordedRisk = useRef<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ['spiral_history'],
    queryFn: getSpiralHistory,
  });

  useEffect(() => {
    if (historyQuery.data) {
      setHistory(historyQuery.data);
    }
  }, [historyQuery.data]);

  const saveHistoryMutation = useMutation({
    mutationFn: (entries: SpiralHistoryEntry[]) => saveSpiralHistory(entries),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['spiral_history'] });
    },
  });

  const detection = useMemo<SpiralDetectionResult>(
    () => detectSpiralFromSmartEntries(smartEntries, journalEntries, messageDrafts, conversations),
    [smartEntries, journalEntries, messageDrafts, conversations],
  );

  const weeklyInsight = useMemo<SpiralWeeklyInsight | null>(
    () => generateWeeklySpiralInsight(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const pausePromptConfig = useMemo<SpiralPausePromptConfig>(
    () => getSpiralPausePrompt(detection.signals),
    [detection.signals],
  );

  const weekTrend = useMemo<SpiralTrend>(
    () => computeSpiralTrend(history, 'week'),
    [history],
  );

  const monthTrend = useMemo<SpiralTrend>(
    () => computeSpiralTrend(history, 'month'),
    [history],
  );

  useEffect(() => {
    if (!detection.shouldIntervene) {
      lastRecordedRisk.current = null;
      return;
    }

    const riskKey = `${detection.riskLevel}_${detection.signals.map(s => s.type).sort().join(',')}`;
    if (riskKey === lastRecordedRisk.current) return;
    lastRecordedRisk.current = riskKey;

    trackEvent('spiral_risk_detected', {
      risk_level: detection.riskLevel,
      signal_count: detection.signals.length,
      confidence: Math.round(detection.confidenceScore * 100),
    });

    const entry: SpiralHistoryEntry = {
      id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      riskLevel: detection.riskLevel,
      signals: detection.signals.map(s => s.type),
      interventionUsed: null,
      interventionSkipped: false,
      distressBefore: null,
      distressAfter: null,
    };

    const updated = [entry, ...history].slice(0, 200);
    setHistory(updated);
    saveHistoryMutation.mutate(updated);

    console.log('[SpiralPrevention] New detection recorded:', detection.riskLevel, detection.signals.length, 'signals');
  }, [detection.shouldIntervene, detection.riskLevel, detection.signals, detection.confidenceScore, trackEvent, history, saveHistoryMutation]);

  const recordInterventionUsed = useCallback((
    interventionId: string,
    distressBefore?: number,
    distressAfter?: number,
  ) => {
    trackEvent('spiral_intervention_used', {
      intervention_id: interventionId,
      risk_level: detection.riskLevel,
      distress_before: distressBefore ?? -1,
      distress_after: distressAfter ?? -1,
    });

    if (history.length > 0) {
      const latest = history[0];
      if (latest.interventionUsed === null && Date.now() - latest.timestamp < 30 * 60 * 1000) {
        const updated = [
          {
            ...latest,
            interventionUsed: interventionId,
            distressBefore: distressBefore ?? latest.distressBefore,
            distressAfter: distressAfter ?? latest.distressAfter,
          },
          ...history.slice(1),
        ];
        setHistory(updated);
        saveHistoryMutation.mutate(updated);
      }
    }
    console.log('[SpiralPrevention] Intervention used:', interventionId);
  }, [detection.riskLevel, history, trackEvent, saveHistoryMutation]);

  const recordInterventionSkipped = useCallback(() => {
    trackEvent('spiral_intervention_skipped', {
      risk_level: detection.riskLevel,
    });

    if (history.length > 0) {
      const latest = history[0];
      if (!latest.interventionSkipped && Date.now() - latest.timestamp < 30 * 60 * 1000) {
        const updated = [
          { ...latest, interventionSkipped: true },
          ...history.slice(1),
        ];
        setHistory(updated);
        saveHistoryMutation.mutate(updated);
      }
    }
    console.log('[SpiralPrevention] Intervention skipped');
  }, [detection.riskLevel, history, trackEvent, saveHistoryMutation]);

  const triggerPausePrompt = useCallback(() => {
    if (Date.now() < dismissedUntil) return;
    setShowPausePrompt(true);
    trackEvent('spiral_prompt_shown', { risk_level: detection.riskLevel });
  }, [dismissedUntil, detection.riskLevel, trackEvent]);

  const dismissPausePrompt = useCallback(() => {
    setShowPausePrompt(false);
    setDismissedUntil(Date.now() + 15 * 60 * 1000);
  }, []);

  const shouldShowBanner = useMemo<boolean>(() => {
    if (!detection.shouldIntervene) return false;
    if (Date.now() < dismissedUntil) return false;
    return true;
  }, [detection.shouldIntervene, dismissedUntil]);

  const dismissBanner = useCallback(() => {
    setDismissedUntil(Date.now() + 30 * 60 * 1000);
  }, []);

  const recentHighRiskCount = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    return history.filter(
      e => Date.now() - e.timestamp < dayMs && (e.riskLevel === 'high' || e.riskLevel === 'moderate')
    ).length;
  }, [history]);

  const interventionSuccessRate = useMemo(() => {
    const withOutcomes = history.filter(
      e => e.interventionUsed !== null && e.distressBefore !== null && e.distressAfter !== null
    );
    if (withOutcomes.length === 0) return null;
    const improved = withOutcomes.filter(e => (e.distressAfter ?? 0) < (e.distressBefore ?? 0));
    return improved.length / withOutcomes.length;
  }, [history]);

  return useMemo(() => ({
    detection,
    weeklyInsight,
    pausePromptConfig,
    history,
    weekTrend,
    monthTrend,
    showPausePrompt,
    shouldShowBanner,
    recentHighRiskCount,
    interventionSuccessRate,
    recordInterventionUsed,
    recordInterventionSkipped,
    triggerPausePrompt,
    dismissPausePrompt,
    dismissBanner,
    isLoading: historyQuery.isLoading,
  }), [
    detection,
    weeklyInsight,
    pausePromptConfig,
    history,
    weekTrend,
    monthTrend,
    showPausePrompt,
    shouldShowBanner,
    recentHighRiskCount,
    interventionSuccessRate,
    recordInterventionUsed,
    recordInterventionSkipped,
    triggerPausePrompt,
    dismissPausePrompt,
    dismissBanner,
    historyQuery.isLoading,
  ]);
});
