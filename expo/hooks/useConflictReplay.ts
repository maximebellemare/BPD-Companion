import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/providers/AppProvider';
import { useRelationshipCopilot } from '@/hooks/useRelationshipCopilot';
import {
  ConflictReplayEvent,
  ConflictReplayTimeline,
  ConflictInsightCard,
} from '@/types/conflictReplay';
import {
  getConflictReplayEvents,
  addConflictReplayEvent,
  deleteConflictReplayEvent,
  buildTimelineFromEvent,
  generatePatternInsights,
  buildEventsFromAppData,
} from '@/services/relationships/conflictReplayService';

export function useConflictReplay() {
  const queryClient = useQueryClient();
  const { journalEntries, messageDrafts } = useApp();
  const { sessions: copilotSessions } = useRelationshipCopilot();

  const manualEventsQuery = useQuery({
    queryKey: ['conflict_replay_events'],
    queryFn: getConflictReplayEvents,
  });

  const manualEvents = useMemo(() => manualEventsQuery.data ?? [], [manualEventsQuery.data]);

  const autoEvents = useMemo(
    () => buildEventsFromAppData(journalEntries, messageDrafts, copilotSessions),
    [journalEntries, messageDrafts, copilotSessions],
  );

  const allEvents = useMemo(() => {
    const combined = [...manualEvents, ...autoEvents];
    const uniqueMap = new Map<string, ConflictReplayEvent>();
    combined.forEach(e => uniqueMap.set(e.id, e));
    return Array.from(uniqueMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [manualEvents, autoEvents]);

  const timelines = useMemo<ConflictReplayTimeline[]>(
    () => allEvents.map(buildTimelineFromEvent),
    [allEvents],
  );

  const patternInsights = useMemo<ConflictInsightCard[]>(
    () => generatePatternInsights(allEvents),
    [allEvents],
  );

  const addEventMutation = useMutation({
    mutationFn: addConflictReplayEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conflict_replay_events'] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteConflictReplayEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conflict_replay_events'] });
    },
  });

  return {
    events: allEvents,
    timelines,
    patternInsights,
    isLoading: manualEventsQuery.isLoading,
    addEvent: addEventMutation.mutateAsync,
    isAdding: addEventMutation.isPending,
    deleteEvent: deleteEventMutation.mutate,
  };
}
