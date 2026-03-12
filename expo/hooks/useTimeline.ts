import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/providers/AppProvider';
import { TimelineFilters } from '@/types/timeline';
import {
  buildTimelineEvents,
  filterTimelineEvents,
  computeTimelineStats,
} from '@/services/timeline/timelineService';

const DEFAULT_FILTERS: TimelineFilters = {
  emotionType: null,
  triggerType: null,
  dateRange: 'month',
  markerFilter: null,
};

export function useTimeline() {
  const { journalEntries, messageDrafts } = useApp();
  const [filters, setFilters] = useState<TimelineFilters>(DEFAULT_FILTERS);

  const allEvents = useMemo(
    () => buildTimelineEvents(journalEntries, messageDrafts),
    [journalEntries, messageDrafts]
  );

  const filteredEvents = useMemo(
    () => filterTimelineEvents(allEvents, filters),
    [allEvents, filters]
  );

  const stats = useMemo(
    () => computeTimelineStats(filteredEvents),
    [filteredEvents]
  );

  const uniqueEmotions = useMemo(() => {
    const set = new Set<string>();
    allEvents.forEach((e) => e.emotions.forEach((em) => set.add(em)));
    return Array.from(set).sort();
  }, [allEvents]);

  const uniqueTriggerCategories = useMemo(() => {
    const set = new Set<string>();
    allEvents.forEach((e) =>
      e.triggerCategories.forEach((tc) => set.add(tc))
    );
    return Array.from(set).sort();
  }, [allEvents]);

  const updateFilter = useCallback(
    <K extends keyof TimelineFilters>(key: K, value: TimelineFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    events: filteredEvents,
    allEvents,
    stats,
    filters,
    updateFilter,
    resetFilters,
    uniqueEmotions,
    uniqueTriggerCategories,
  };
}
