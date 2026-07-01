import { JournalEntry } from '@/types';
import { SavedCompanionInsight } from '@/services/companion/companionInsightService';

export interface MorningBrief {
  hasYesterdayData: boolean;
  yesterday: {
    mainEmotion: string;
    mainTrigger: string;
    mainInsight: string;
  };
  today: {
    watchFor: string;
    suggestion: string;
  };
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getYesterdayRange(now = new Date()): { start: number; end: number } {
  const todayStart = startOfDay(now);
  return {
    start: todayStart - 24 * 60 * 60 * 1000,
    end: todayStart,
  };
}

function getMostFrequent(items: Array<{ label: string; weight?: number }>): string | null {
  if (items.length === 0) return null;

  const counts = new Map<string, { label: string; count: number; weight: number }>();
  items.forEach((item) => {
    const label = item.label.trim();
    if (!label) return;
    const key = label.toLowerCase();
    const existing = counts.get(key) ?? { label, count: 0, weight: 0 };
    counts.set(key, {
      label: existing.label,
      count: existing.count + 1,
      weight: existing.weight + (item.weight ?? 0),
    });
  });

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || b.weight - a.weight)[0]?.label ?? null;
}

function isMeaningfulNote(note: string | undefined): boolean {
  if (!note) return false;
  const normalized = note.trim().toLowerCase();
  return normalized.length > 8 && normalized !== 'quick today check-in';
}

function getMainInsight(entries: JournalEntry[], insights: SavedCompanionInsight[], start: number, end: number): string | null {
  const savedInsight = insights
    .filter(insight => insight.createdAt >= start && insight.createdAt < end)
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  if (savedInsight?.content) {
    return savedInsight.content.split('\n').map(line => line.trim()).filter(Boolean)[0]?.slice(0, 150) ?? null;
  }

  const reflectedEntry = entries.find(entry => isMeaningfulNote(entry.reflection));
  if (reflectedEntry?.reflection) {
    return reflectedEntry.reflection.trim().slice(0, 150);
  }

  const notedEntry = entries.find(entry => isMeaningfulNote(entry.checkIn.notes));
  if (notedEntry?.checkIn.notes) {
    return notedEntry.checkIn.notes.trim().slice(0, 150);
  }

  const copingEntry = entries.find(entry => entry.checkIn.copingUsed && entry.checkIn.copingUsed.length > 0);
  if (copingEntry?.checkIn.copingUsed?.[0]) {
    return `You used ${copingEntry.checkIn.copingUsed[0]} as support.`;
  }

  if (entries.some(entry => entry.outcome)) {
    const outcome = entries.find(entry => entry.outcome)?.outcome;
    return `You marked yesterday as ${outcome}.`;
  }

  return null;
}

export function buildMorningBrief(
  journalEntries: JournalEntry[],
  savedInsights: SavedCompanionInsight[] = [],
  now = new Date(),
): MorningBrief {
  const { start, end } = getYesterdayRange(now);
  const yesterdayEntries = journalEntries
    .filter(entry => entry.timestamp >= start && entry.timestamp < end)
    .sort((a, b) => b.timestamp - a.timestamp);

  const mainEmotion = getMostFrequent(
    yesterdayEntries.flatMap(entry => entry.checkIn.emotions.map(emotion => ({
      label: emotion.label,
      weight: emotion.intensity ?? entry.checkIn.intensityLevel,
    }))),
  );
  const mainTrigger = getMostFrequent(
    yesterdayEntries.flatMap(entry => entry.checkIn.triggers.map(trigger => ({ label: trigger.label }))),
  );
  const mainInsight = getMainInsight(yesterdayEntries, savedInsights, start, end);

  const hasYesterdayData = yesterdayEntries.length > 0 || savedInsights.some(
    insight => insight.createdAt >= start && insight.createdAt < end,
  );

  return {
    hasYesterdayData,
    yesterday: {
      mainEmotion: mainEmotion ?? 'No emotion captured yesterday.',
      mainTrigger: mainTrigger ?? 'No trigger captured yesterday.',
      mainInsight: mainInsight ?? 'No written insight captured yesterday.',
    },
    today: {
      watchFor: mainTrigger
        ? `Notice if ${mainTrigger.toLowerCase()} shows up again.`
        : mainEmotion
          ? `Notice when ${mainEmotion.toLowerCase()} starts to build.`
          : 'Watch for the first moment your emotions shift.',
      suggestion: mainEmotion || mainTrigger
        ? 'Do one quick check-in before reacting or withdrawing.'
        : 'Start with one quick check-in so tomorrow’s brief has real data.',
    },
  };
}
