import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry, MessageDraft } from '@/types';
import { BreakthroughMoment, BreakthroughType, BreakthroughSummary } from '@/types/breakthrough';

const STORAGE_KEY = 'bpd_breakthroughs';

function generateId(): string {
  return `bt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function isWithinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function detectDistressReductions(entries: JournalEntry[]): BreakthroughMoment[] {
  const moments: BreakthroughMoment[] = [];
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const timeDiff = curr.timestamp - prev.timestamp;

    if (timeDiff > 24 * 60 * 60 * 1000) continue;

    const drop = prev.checkIn.intensityLevel - curr.checkIn.intensityLevel;
    const copingUsed = prev.checkIn.copingUsed?.[0];

    if (drop >= 3 && copingUsed) {
      moments.push({
        id: generateId(),
        timestamp: curr.timestamp,
        type: 'distress_reduction',
        title: 'Distress came down',
        description: `Your distress dropped from ${prev.checkIn.intensityLevel} to ${curr.checkIn.intensityLevel} after using ${copingUsed}.`,
        supportiveNote: 'You found something that works for you. That takes real awareness.',
        actionSuggestion: 'Try this tool again next time distress rises',
        sourceData: {
          distressBefore: prev.checkIn.intensityLevel,
          distressAfter: curr.checkIn.intensityLevel,
          toolUsed: copingUsed,
        },
        saved: false,
        shared: false,
      });
    }
  }

  return moments;
}

function detectPauseBeforeSend(drafts: MessageDraft[]): BreakthroughMoment[] {
  const moments: BreakthroughMoment[] = [];

  drafts.forEach(draft => {
    if (draft.paused && draft.rewrittenText) {
      moments.push({
        id: generateId(),
        timestamp: draft.timestamp,
        type: 'pause_before_send',
        title: 'You paused before responding',
        description: 'You chose to pause and rewrite a message instead of sending impulsively.',
        supportiveNote: 'Pausing takes courage. It means you value the relationship and yourself.',
        actionSuggestion: 'Keep building this habit — it gets easier',
        actionRoute: '/message-guard',
        saved: false,
        shared: false,
      });
    }

    if (draft.rewrittenText && !draft.sent) {
      moments.push({
        id: generateId(),
        timestamp: draft.timestamp,
        type: 'pause_before_send',
        title: 'You chose not to send',
        description: 'You wrote a message, rewrote it, and decided not to send. That takes strength.',
        supportiveNote: 'Sometimes the bravest thing is holding back.',
        saved: false,
        shared: false,
      });
    }
  });

  return moments;
}

function detectEmotionalAwareness(entries: JournalEntry[]): BreakthroughMoment[] {
  const moments: BreakthroughMoment[] = [];
  const recentEntries = entries.filter(e => isWithinDays(e.timestamp, 7));

  if (recentEntries.length >= 3) {
    const emotionSet = new Set<string>();
    recentEntries.forEach(e => e.checkIn.emotions.forEach(em => emotionSet.add(em.label)));

    if (emotionSet.size >= 3) {
      moments.push({
        id: generateId(),
        timestamp: Date.now(),
        type: 'emotional_awareness',
        title: 'Growing emotional vocabulary',
        description: `You identified ${emotionSet.size} different emotions this week. That's deep self-awareness.`,
        supportiveNote: 'Naming emotions is the first step to understanding them.',
        saved: false,
        shared: false,
      });
    }
  }

  const reflectionEntries = entries.filter(e => e.reflection && e.reflection.length > 30);
  if (reflectionEntries.length > 0) {
    const latest = reflectionEntries.sort((a, b) => b.timestamp - a.timestamp)[0];
    moments.push({
      id: generateId(),
      timestamp: latest.timestamp,
      type: 'journal_reflection',
      title: 'Meaningful reflection',
      description: 'You took time to reflect deeply on your experience.',
      supportiveNote: 'Writing helps process emotions in ways thinking alone cannot.',
      actionSuggestion: 'Continue journaling — patterns will emerge',
      actionRoute: '/(tabs)/journal',
      saved: false,
      shared: false,
    });
  }

  return moments;
}

function detectCopingSuccess(entries: JournalEntry[]): BreakthroughMoment[] {
  const moments: BreakthroughMoment[] = [];
  const copingCounts: Record<string, number> = {};

  entries.forEach(e => {
    e.checkIn.copingUsed?.forEach(tool => {
      copingCounts[tool] = (copingCounts[tool] || 0) + 1;
    });
  });

  const frequentTools = Object.entries(copingCounts)
    .filter(([, count]) => count >= 3)
    .sort(([, a], [, b]) => b - a);

  if (frequentTools.length > 0) {
    const [topTool, count] = frequentTools[0];
    moments.push({
      id: generateId(),
      timestamp: Date.now(),
      type: 'coping_success',
      title: `${topTool} is becoming your go-to`,
      description: `You've used ${topTool} ${count} times. It's becoming part of your regulation toolkit.`,
      supportiveNote: 'Building reliable coping strategies is real progress.',
      saved: false,
      shared: false,
    });
  }

  return moments;
}

function detectConsistentCheckins(entries: JournalEntry[]): BreakthroughMoment[] {
  const moments: BreakthroughMoment[] = [];
  const recentEntries = entries.filter(e => isWithinDays(e.timestamp, 7));

  if (recentEntries.length >= 5) {
    moments.push({
      id: generateId(),
      timestamp: Date.now(),
      type: 'consistent_checkin',
      title: 'Consistent self-awareness',
      description: `${recentEntries.length} check-ins this week. You're building a powerful habit.`,
      supportiveNote: "Showing up for yourself, even when it's hard, is growth.",
      saved: false,
      shared: false,
    });
  } else if (recentEntries.length >= 3) {
    moments.push({
      id: generateId(),
      timestamp: Date.now(),
      type: 'consistent_checkin',
      title: 'Building momentum',
      description: `${recentEntries.length} check-ins this week. You're creating a pattern of awareness.`,
      supportiveNote: 'Every check-in is an act of courage.',
      saved: false,
      shared: false,
    });
  }

  return moments;
}

function detectRelationshipRegulation(
  entries: JournalEntry[],
  drafts: MessageDraft[],
): BreakthroughMoment[] {
  const moments: BreakthroughMoment[] = [];

  const relEntries = entries.filter(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship')
  );
  const managedAfterRelTrigger = relEntries.filter(e => e.outcome === 'managed');

  if (managedAfterRelTrigger.length > 0) {
    const latest = managedAfterRelTrigger.sort((a, b) => b.timestamp - a.timestamp)[0];
    const trigger = latest.checkIn.triggers.find(t => t.category === 'relationship');
    moments.push({
      id: generateId(),
      timestamp: latest.timestamp,
      type: 'relationship_regulation',
      title: 'Navigated relationship stress',
      description: trigger
        ? `After "${trigger.label}", you managed the situation without escalating.`
        : 'You managed relationship stress without escalating.',
      supportiveNote: 'Regulating during relationship stress is one of the hardest things to do.',
      actionSuggestion: 'Review this in Relationship Copilot',
      actionRoute: '/relationship-copilot',
      sourceData: {
        triggerLabel: trigger?.label,
        emotionLabel: latest.checkIn.emotions[0]?.label,
      },
      saved: false,
      shared: false,
    });
  }

  const helpfulRewrites = drafts.filter(d => d.rewrittenText && d.outcome === 'helped');
  if (helpfulRewrites.length > 0) {
    const latest = helpfulRewrites.sort((a, b) => b.timestamp - a.timestamp)[0];
    moments.push({
      id: generateId(),
      timestamp: latest.timestamp,
      type: 'relationship_regulation',
      title: 'Rewrite that helped',
      description: 'A message you rewrote led to a better outcome.',
      supportiveNote: 'Choosing your words carefully changes conversations.',
      actionRoute: '/message-guard',
      saved: false,
      shared: false,
    });
  }

  return moments;
}

export function detectBreakthroughs(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): BreakthroughMoment[] {
  const all: BreakthroughMoment[] = [
    ...detectDistressReductions(journalEntries),
    ...detectPauseBeforeSend(messageDrafts),
    ...detectEmotionalAwareness(journalEntries),
    ...detectCopingSuccess(journalEntries),
    ...detectConsistentCheckins(journalEntries),
    ...detectRelationshipRegulation(journalEntries, messageDrafts),
  ];

  const uniqueByType = new Map<string, BreakthroughMoment>();
  all.forEach(m => {
    const key = `${m.type}_${Math.floor(m.timestamp / (12 * 60 * 60 * 1000))}`;
    if (!uniqueByType.has(key) || m.timestamp > (uniqueByType.get(key)?.timestamp ?? 0)) {
      uniqueByType.set(key, m);
    }
  });

  return Array.from(uniqueByType.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 30);
}

export function computeBreakthroughSummary(moments: BreakthroughMoment[]): BreakthroughSummary {
  const thisWeek = moments.filter(m => isWithinDays(m.timestamp, 7));
  const typeCounts: Partial<Record<BreakthroughType, number>> = {};
  moments.forEach(m => {
    typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
  });

  const topType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] as BreakthroughType | undefined;

  const days = new Set(moments.map(m => new Date(m.timestamp).toDateString()));
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    totalBreakthroughs: moments.length,
    thisWeekCount: thisWeek.length,
    topType: topType ?? null,
    latestBreakthrough: moments[0] ?? null,
    streakDays: streak,
  };
}

export async function getSavedBreakthroughs(): Promise<BreakthroughMoment[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as BreakthroughMoment[] : [];
  } catch (e) {
    console.log('[BreakthroughService] Error reading saved breakthroughs:', e);
    return [];
  }
}

export async function saveBreakthrough(moment: BreakthroughMoment): Promise<BreakthroughMoment[]> {
  const existing = await getSavedBreakthroughs();
  const updated = [{ ...moment, saved: true }, ...existing.filter(m => m.id !== moment.id)];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 100)));
  console.log('[BreakthroughService] Breakthrough saved:', moment.title);
  return updated;
}

export async function removeBreakthrough(id: string): Promise<BreakthroughMoment[]> {
  const existing = await getSavedBreakthroughs();
  const updated = existing.filter(m => m.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function markShared(id: string): Promise<BreakthroughMoment[]> {
  const existing = await getSavedBreakthroughs();
  const updated = existing.map(m => m.id === id ? { ...m, shared: true } : m);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
