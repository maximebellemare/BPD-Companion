import { JournalEntry } from '@/types';
import { storageService } from '@/services/storage/storageService';
import type { OnboardingProfile } from '@/types/onboarding';

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

export interface Day2AhaInsight {
  id: string;
  title: string;
  value: string;
  description: string;
  confidence: 'building' | 'emerging';
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

function getMostFrequentLabel(entries: JournalEntry[], kind: 'emotion' | 'trigger'): string | null {
  const counts = new Map<string, { label: string; count: number }>();
  entries.forEach((entry) => {
    const items = kind === 'emotion' ? entry.checkIn.emotions : entry.checkIn.triggers;
    items.forEach((item) => {
      const label = item.label.trim();
      if (!label) return;
      const key = label.toLowerCase();
      const existing = counts.get(key) ?? { label, count: 0 };
      counts.set(key, { label: existing.label, count: existing.count + 1 });
    });
  });
  return [...counts.values()].sort((a, b) => b.count - a.count)[0]?.label ?? null;
}

function getOnboardingFocus(profile: OnboardingProfile | null | undefined): string {
  if (!profile) return 'your first emotional pattern';
  if (
    profile.primaryReasons.includes('relationship_spirals') ||
    profile.primaryReasons.includes('relationship_conflict') ||
    profile.primaryReasons.includes('fear_of_abandonment') ||
    profile.hardestMoments.includes('delayed_replies') ||
    profile.hardestMoments.includes('feeling_rejected')
  ) {
    return 'relationship stress';
  }
  if (
    profile.primaryReasons.includes('impulsive_messaging') ||
    profile.primaryReasons.includes('impulsive_urges') ||
    profile.preferredTools.includes('pause_before_messaging')
  ) {
    return 'the pause before reacting';
  }
  if (
    profile.primaryReasons.includes('emotional_overwhelm') ||
    profile.primaryReasons.includes('intense_emotions') ||
    profile.preferredTools.includes('calm_emotional_spikes')
  ) {
    return 'emotional intensity';
  }
  if (
    profile.primaryReasons.includes('understanding_patterns') ||
    profile.preferredTools.includes('track_moods_triggers') ||
    profile.preferredTools.includes('reflections_insights')
  ) {
    return 'your pattern map';
  }
  return 'your first emotional pattern';
}

export function generateDay2PersonalizedAhaInsight(params: {
  journalEntries: JournalEntry[];
  onboardingProfile?: OnboardingProfile | null;
  now?: number;
}): Day2AhaInsight | null {
  const entries = [...params.journalEntries].sort((a, b) => b.timestamp - a.timestamp);
  if (entries.length < 2) return null;

  const recent = entries.slice(0, 4);
  const emotion = getMostFrequentLabel(recent, 'emotion');
  const trigger = getMostFrequentLabel(recent, 'trigger');
  const onboardingFocus = getOnboardingFocus(params.onboardingProfile);
  const onboardingContext = params.onboardingProfile
    ? `Based on what you told us, ${onboardingFocus} is one area BPD Companion will watch as real check-in patterns build.`
    : 'BPD Companion will keep watching for real check-in patterns as you log more moments.';

  if (emotion && trigger) {
    return {
      id: 'day2_aha_emotion_trigger',
      title: 'Your first pattern is starting to show',
      value: `${emotion} around ${trigger}`,
      description: `After a couple of check-ins, BPD Companion detected ${emotion.toLowerCase()} showing up around ${trigger.toLowerCase()}. ${onboardingContext} Keep logging small moments so this gets sharper.`,
      confidence: recent.length >= 3 ? 'emerging' : 'building',
    };
  }

  if (emotion) {
    return {
      id: 'day2_aha_emotion',
      title: 'One emotion is showing up early',
      value: emotion,
      description: `This is an early signal from your check-ins, not a conclusion. ${onboardingContext} A few more check-ins will help connect ${emotion.toLowerCase()} with the situations that tend to come before it.`,
      confidence: recent.length >= 3 ? 'emerging' : 'building',
    };
  }

  if (trigger) {
    return {
      id: 'day2_aha_trigger',
      title: 'One trigger is worth watching',
      value: trigger,
      description: `This is an early trigger signal from your check-ins, not a conclusion. ${onboardingContext} More check-ins will show whether it repeats.`,
      confidence: recent.length >= 3 ? 'emerging' : 'building',
    };
  }

  return null;
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
