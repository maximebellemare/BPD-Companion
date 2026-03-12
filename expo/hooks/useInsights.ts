import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import { computeInsightsSummary } from '@/services/insights/insightsService';
import { InsightsSummary } from '@/types/insights';

export function useInsights(): { insights: InsightsSummary; isLoading: boolean } {
  const { journalEntries, isLoading } = useApp();

  const insights = useMemo(() => {
    console.log('[useInsights] Computing insights from', journalEntries.length, 'entries');
    return computeInsightsSummary(journalEntries);
  }, [journalEntries]);

  return { insights, isLoading };
}
