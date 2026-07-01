import { JournalEntry } from '@/types';
import { storageService } from '@/services/storage/storageService';

const FAVORITE_AHA_MOMENTS_KEY = 'bpd_companion_favorite_aha_moments';
const MIN_HIGH_CONFIDENCE_COUNT = 3;

export interface AhaMoment {
  id: string;
  title: string;
  observation: string;
  evidence: string;
  confidence: 'high';
  generatedAt: number;
}

export interface FavoriteAhaMoment extends AhaMoment {
  savedAt: number;
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function allEntryText(entry: JournalEntry): string {
  return [
    entry.reflection ?? '',
    entry.checkIn.notes ?? '',
    ...entry.checkIn.triggers.map(trigger => trigger.label),
    ...entry.checkIn.emotions.map(emotion => emotion.label),
    ...entry.checkIn.urges.map(urge => urge.label),
  ].join(' ').toLowerCase();
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some(term => text.includes(term));
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getEntriesByDay(entries: JournalEntry[]): Map<number, JournalEntry[]> {
  const days = new Map<number, JournalEntry[]>();
  entries.forEach((entry) => {
    const day = startOfDay(entry.timestamp);
    days.set(day, [...(days.get(day) ?? []), entry]);
  });
  days.forEach((dayEntries, day) => {
    days.set(day, [...dayEntries].sort((a, b) => a.timestamp - b.timestamp));
  });
  return days;
}

function hasEmotion(entry: JournalEntry, terms: string[]): boolean {
  const emotionText = entry.checkIn.emotions.map(emotion => normalize(emotion.label)).join(' ');
  return hasAny(emotionText, terms);
}

function buildAnxietyBeforeAnger(entries: JournalEntry[], generatedAt: number): AhaMoment | null {
  const days = getEntriesByDay(entries);
  let angerAfterAnxiety = 0;
  let angerEvents = 0;

  days.forEach((dayEntries) => {
    let sawAnxiety = false;
    dayEntries.forEach((entry) => {
      if (hasEmotion(entry, ['anxious', 'anxiety', 'worried', 'panic'])) {
        sawAnxiety = true;
      }
      if (hasEmotion(entry, ['angry', 'anger', 'furious', 'mad'])) {
        angerEvents += 1;
        if (sawAnxiety) angerAfterAnxiety += 1;
      }
    });
  });

  if (angerAfterAnxiety < MIN_HIGH_CONFIDENCE_COUNT || angerEvents === 0 || angerAfterAnxiety / angerEvents < 0.6) {
    return null;
  }

  return {
    id: 'aha_anxiety_before_anger',
    title: 'Anxiety may come before anger',
    observation: 'You often become anxious before you become angry.',
    evidence: `${angerAfterAnxiety} of ${angerEvents} anger-related check-ins happened after anxiety appeared earlier that day.`,
    confidence: 'high',
    generatedAt,
  };
}

function hasAbandonmentSignal(entry: JournalEntry): boolean {
  const text = allEntryText(entry);
  const emotionText = entry.checkIn.emotions.map(emotion => normalize(emotion.label)).join(' ');
  const triggerText = entry.checkIn.triggers.map(trigger => normalize(trigger.label)).join(' ');
  return hasAny(`${text} ${emotionText} ${triggerText}`, [
    'abandon',
    'abandoned',
    'abandonment',
    'left me',
    'leaving',
    'ignored',
    'no reply',
    'not replying',
    'rejected',
    'forgotten',
  ]);
}

function hasUncertaintySignal(text: string): boolean {
  return hasAny(text, ['uncertain', 'confused', 'mixed signal', 'no reply', 'ignored', 'silence', 'where i stand', 'not sure', 'don\'t know', 'unknown']);
}

function hasConflictSignal(text: string): boolean {
  return hasAny(text, ['conflict', 'fight', 'argument', 'arguing', 'yelled', 'criticism', 'criticized']);
}

function buildAbandonmentAfterUncertainty(entries: JournalEntry[], generatedAt: number): AhaMoment | null {
  const relationshipEntries = entries.filter((entry) => {
    const text = allEntryText(entry);
    return entry.checkIn.triggers.some(trigger => trigger.category === 'relationship') ||
      hasAny(text, ['partner', 'relationship', 'text back', 'reply', 'ignored', 'silence', 'friend', 'ex']);
  });
  const days = getEntriesByDay(relationshipEntries);
  let abandonmentEntries = 0;
  let uncertaintyBeforeOrAround = 0;
  let conflictBeforeOrAround = 0;

  days.forEach((dayEntries) => {
    dayEntries.forEach((entry, index) => {
      if (!hasAbandonmentSignal(entry)) return;
      abandonmentEntries += 1;

      const priorSameDayText = dayEntries
        .slice(0, index + 1)
        .map(allEntryText)
        .join(' ');
      if (hasUncertaintySignal(priorSameDayText)) uncertaintyBeforeOrAround += 1;
      if (hasConflictSignal(priorSameDayText)) conflictBeforeOrAround += 1;
    });
  });

  if (
    abandonmentEntries < 4 ||
    uncertaintyBeforeOrAround < MIN_HIGH_CONFIDENCE_COUNT ||
    uncertaintyBeforeOrAround / abandonmentEntries < 0.6 ||
    uncertaintyBeforeOrAround <= conflictBeforeOrAround
  ) {
    return null;
  }

  return {
    id: 'aha_abandonment_after_uncertainty',
    title: 'Uncertainty may come before abandonment fear',
    observation: 'Most abandonment fears appear after uncertainty rather than conflict.',
    evidence: `${uncertaintyBeforeOrAround} of ${abandonmentEntries} abandonment-related entries had uncertainty or silence earlier in the same day or entry, compared with ${conflictBeforeOrAround} with conflict language.`,
    confidence: 'high',
    generatedAt,
  };
}

function buildIgnoredMoreThanRejected(entries: JournalEntry[], generatedAt: number): AhaMoment | null {
  let ignored = 0;
  let rejected = 0;

  entries.forEach((entry) => {
    const text = allEntryText(entry);
    if (hasAny(text, ['ignored', 'ignore', 'no reply', 'not answering', 'left on read', 'ghosted', 'silence'])) ignored += 1;
    if (hasAny(text, ['rejected', 'reject', 'dismissed', 'unwanted', 'not chosen'])) rejected += 1;
  });

  if (ignored < MIN_HIGH_CONFIDENCE_COUNT || ignored < rejected + 2) {
    return null;
  }

  return {
    id: 'aha_ignored_more_than_rejected',
    title: 'Ignored shows up more than rejected',
    observation: 'Feeling ignored appears more often than feeling rejected.',
    evidence: `"Ignored/no reply" language appears in ${ignored} entries, while rejection language appears in ${rejected}.`,
    confidence: 'high',
    generatedAt,
  };
}

function buildSleepBeforeStrongDays(entries: JournalEntry[], generatedAt: number): AhaMoment | null {
  const days = getEntriesByDay(entries);
  const sleepDays = [...days.entries()].filter(([, dayEntries]) => (
    dayEntries.some(entry => hasAny(allEntryText(entry), ['poor sleep', 'bad sleep', 'no sleep', 'insomnia', 'exhausted', 'tired']))
  ));
  let sleepBeforeHigh = 0;

  sleepDays.forEach(([day]) => {
    const nextDayEntries = days.get(day + 24 * 60 * 60 * 1000) ?? [];
    if (nextDayEntries.some(entry => entry.checkIn.intensityLevel >= 7)) {
      sleepBeforeHigh += 1;
    }
  });

  if (sleepDays.length < MIN_HIGH_CONFIDENCE_COUNT || sleepBeforeHigh < MIN_HIGH_CONFIDENCE_COUNT || sleepBeforeHigh / sleepDays.length < 0.6) {
    return null;
  }

  return {
    id: 'aha_sleep_before_high_intensity',
    title: 'Sleep may shape emotional intensity',
    observation: 'Your strongest emotional days tend to happen after poor sleep.',
    evidence: `${sleepBeforeHigh} of ${sleepDays.length} poor-sleep days were followed by at least one 7+/10 check-in.`,
    confidence: 'high',
    generatedAt,
  };
}

export function generateAhaMoments(journalEntries: JournalEntry[], now = Date.now()): AhaMoment[] {
  if (journalEntries.length < 7) return [];
  const entries = [...journalEntries].sort((a, b) => a.timestamp - b.timestamp);
  return [
    buildAnxietyBeforeAnger(entries, now),
    buildAbandonmentAfterUncertainty(entries, now),
    buildIgnoredMoreThanRejected(entries, now),
    buildSleepBeforeStrongDays(entries, now),
  ].filter((moment): moment is AhaMoment => moment !== null);
}

export async function loadFavoriteAhaMoments(): Promise<FavoriteAhaMoment[]> {
  return (await storageService.get<FavoriteAhaMoment[]>(FAVORITE_AHA_MOMENTS_KEY)) ?? [];
}

export async function saveFavoriteAhaMoment(moment: AhaMoment): Promise<FavoriteAhaMoment[]> {
  const existing = await loadFavoriteAhaMoments();
  if (existing.some(item => item.id === moment.id)) return existing;

  const updated: FavoriteAhaMoment[] = [
    { ...moment, savedAt: Date.now() },
    ...existing,
  ].slice(0, 50);
  await storageService.set(FAVORITE_AHA_MOMENTS_KEY, updated);
  return updated;
}

export async function removeFavoriteAhaMoment(momentId: string): Promise<FavoriteAhaMoment[]> {
  const existing = await loadFavoriteAhaMoments();
  const updated = existing.filter(item => item.id !== momentId);
  await storageService.set(FAVORITE_AHA_MOMENTS_KEY, updated);
  return updated;
}
