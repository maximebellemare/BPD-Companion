import { JournalEntry, MessageDraft } from '@/types';
import {
  TimelineEvent,
  TimelineFilters,
  TimelineMarker,
  TimelineStats,
} from '@/types/timeline';

function determineMarker(entry: JournalEntry): TimelineMarker {
  const hasRelationshipTrigger = entry.checkIn.triggers.some(
    (t) => t.category === 'relationship'
  );
  const isHighDistress = entry.checkIn.intensityLevel >= 7;
  const hasCoping =
    (entry.checkIn.copingUsed && entry.checkIn.copingUsed.length > 0) ||
    entry.outcome === 'managed';

  if (isHighDistress && hasRelationshipTrigger) return 'relationship_conflict';
  if (isHighDistress) return 'high_distress';
  if (hasCoping && entry.outcome === 'managed') return 'coping_success';
  if (entry.checkIn.intensityLevel <= 3) return 'low_distress';
  return 'none';
}

export function buildTimelineEvents(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  journalEntries.forEach((entry) => {
    events.push({
      id: `journal-${entry.id}`,
      type: 'journal',
      timestamp: entry.timestamp,
      title: entry.checkIn.emotions.length > 0
        ? entry.checkIn.emotions.map((e) => e.label).join(', ')
        : 'Check-in',
      description: entry.checkIn.notes || entry.reflection || 'No notes',
      intensity: entry.checkIn.intensityLevel,
      emotions: entry.checkIn.emotions.map((e) => e.label),
      triggers: entry.checkIn.triggers.map((t) => t.label),
      triggerCategories: entry.checkIn.triggers.map((t) => t.category),
      copingUsed: entry.checkIn.copingUsed || [],
      marker: determineMarker(entry),
      outcome: entry.outcome ?? undefined,
    });
  });

  messageDrafts.forEach((draft) => {
    events.push({
      id: `msg-${draft.id}`,
      type: 'message_draft',
      timestamp: draft.timestamp,
      title: draft.rewriteType
        ? `Message rewrite (${draft.rewriteType})`
        : 'Message draft',
      description: draft.paused
        ? 'Paused before sending'
        : draft.sent
        ? 'Sent'
        : 'Not sent',
      emotions: [],
      triggers: [],
      triggerCategories: [],
      copingUsed: draft.paused ? ['Message pause'] : [],
      marker: draft.paused ? 'coping_success' : 'none',
      outcome: draft.outcome ?? undefined,
    });
  });

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

export function filterTimelineEvents(
  events: TimelineEvent[],
  filters: TimelineFilters
): TimelineEvent[] {
  const now = Date.now();
  let rangeStart = 0;

  if (filters.dateRange === 'week') {
    rangeStart = now - 7 * 24 * 60 * 60 * 1000;
  } else if (filters.dateRange === 'month') {
    rangeStart = now - 30 * 24 * 60 * 60 * 1000;
  }

  return events.filter((event) => {
    if (event.timestamp < rangeStart) return false;

    if (
      filters.emotionType &&
      !event.emotions.some((e) =>
        e.toLowerCase().includes(filters.emotionType!.toLowerCase())
      )
    ) {
      return false;
    }

    if (
      filters.triggerType &&
      !event.triggerCategories.includes(filters.triggerType)
    ) {
      return false;
    }

    if (filters.markerFilter && event.marker !== filters.markerFilter) {
      return false;
    }

    return true;
  });
}

export function computeTimelineStats(events: TimelineEvent[]): TimelineStats {
  const emotionCounts: Record<string, number> = {};
  const triggerCounts: Record<string, number> = {};
  let totalIntensity = 0;
  let intensityCount = 0;
  let highDistressCount = 0;
  let copingSuccessCount = 0;
  let conflictCount = 0;

  events.forEach((event) => {
    if (event.intensity !== undefined) {
      totalIntensity += event.intensity;
      intensityCount++;
    }
    if (event.marker === 'high_distress') highDistressCount++;
    if (event.marker === 'coping_success') copingSuccessCount++;
    if (event.marker === 'relationship_conflict') conflictCount++;

    event.emotions.forEach((e) => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    });
    event.triggers.forEach((t) => {
      triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    });
  });

  const sortedEmotions = Object.entries(emotionCounts).sort(
    (a, b) => b[1] - a[1]
  );
  const sortedTriggers = Object.entries(triggerCounts).sort(
    (a, b) => b[1] - a[1]
  );

  return {
    totalEvents: events.length,
    avgIntensity: intensityCount > 0 ? totalIntensity / intensityCount : 0,
    highDistressCount,
    copingSuccessCount,
    conflictCount,
    topEmotion: sortedEmotions.length > 0 ? sortedEmotions[0][0] : null,
    topTrigger: sortedTriggers.length > 0 ? sortedTriggers[0][0] : null,
  };
}
