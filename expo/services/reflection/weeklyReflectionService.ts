import { JournalEntry, MessageDraft } from '@/types';
import { GraphPatternSummary } from '@/types/memoryGraph';
import { WeeklyReflection, ReflectionFeedback } from '@/types/weeklyReflection';
import { getGraphPatternSummary } from '@/services/memory/emotionalMemoryGraphService';
import {
  buildEmotionalLandscape,
  buildRelationshipReflection,
  buildWhatHelped,
  buildGrowthSignals,
  buildNextWeekFocus,
  buildOpeningNarrative,
  buildClosingMessage,
} from '@/services/reflection/reflectionNarrativeBuilder';

let cachedReflection: WeeklyReflection | null = null;
let cachedWeekKey = '';

function getWeekKey(): string {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  return `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
}

function getWeekBounds(): { start: number; end: number; startLabel: string; endLabel: string; weekLabel: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();

  const startDate = new Date(now);
  startDate.setDate(now.getDate() - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const startLabel = `${months[startDate.getMonth()]} ${startDate.getDate()}`;
  const endLabel = `${months[endDate.getMonth()]} ${endDate.getDate()}`;
  const weekLabel = `${startLabel} – ${endLabel}`;

  return {
    start: startDate.getTime(),
    end: endDate.getTime(),
    startLabel,
    endLabel,
    weekLabel,
  };
}

function isWithinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function filterThisWeek(entries: JournalEntry[]): JournalEntry[] {
  return entries.filter(e => isWithinDays(e.timestamp, 7));
}

function filterLastWeek(entries: JournalEntry[]): JournalEntry[] {
  return entries.filter(e => !isWithinDays(e.timestamp, 7) && isWithinDays(e.timestamp, 14));
}

function filterThisWeekDrafts(drafts: MessageDraft[]): MessageDraft[] {
  return drafts.filter(d => isWithinDays(d.timestamp, 7));
}

function filterLastWeekDrafts(drafts: MessageDraft[]): MessageDraft[] {
  return drafts.filter(d => !isWithinDays(d.timestamp, 7) && isWithinDays(d.timestamp, 14));
}

export function generateWeeklyReflection(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): WeeklyReflection {
  const weekKey = getWeekKey();

  if (cachedReflection && cachedWeekKey === weekKey) {
    console.log('[WeeklyReflectionService] Returning cached reflection');
    return cachedReflection;
  }

  console.log('[WeeklyReflectionService] Generating weekly reflection...');

  const thisWeek = filterThisWeek(journalEntries);
  const lastWeek = filterLastWeek(journalEntries);
  const thisWeekDrafts = filterThisWeekDrafts(messageDrafts);
  const lastWeekDrafts = filterLastWeekDrafts(messageDrafts);

  let graphSummary: GraphPatternSummary | null = null;
  try {
    graphSummary = getGraphPatternSummary(journalEntries, messageDrafts);
  } catch (err) {
    console.log('[WeeklyReflectionService] Graph summary unavailable:', err);
  }

  const { weekLabel, startLabel, endLabel } = getWeekBounds();

  const emotionalLandscape = buildEmotionalLandscape(journalEntries, thisWeek, lastWeek);
  const relationshipReflection = buildRelationshipReflection(thisWeek, lastWeek, thisWeekDrafts, lastWeekDrafts, graphSummary);
  const whatHelped = buildWhatHelped(thisWeek, thisWeekDrafts);
  const growthSignals = buildGrowthSignals(thisWeek, lastWeek, thisWeekDrafts, lastWeekDrafts, graphSummary);
  const nextWeekFocus = buildNextWeekFocus(thisWeek, thisWeekDrafts, graphSummary);
  const openingNarrative = buildOpeningNarrative(thisWeek, lastWeek, thisWeekDrafts);
  const closingMessage = buildClosingMessage(thisWeek, growthSignals);

  const hasEnoughData = thisWeek.length >= 2;

  const reflection: WeeklyReflection = {
    id: `reflection_${Date.now()}`,
    generatedAt: Date.now(),
    weekLabel,
    weekStartDate: startLabel,
    weekEndDate: endLabel,
    openingNarrative,
    emotionalLandscape,
    relationshipReflection,
    whatHelped,
    growthSignals,
    nextWeekFocus,
    closingMessage,
    hasEnoughData,
  };

  cachedReflection = reflection;
  cachedWeekKey = weekKey;

  console.log('[WeeklyReflectionService] Reflection generated:', {
    emotions: emotionalLandscape.strongestEmotions.length,
    triggers: emotionalLandscape.keyTriggers.length,
    tools: whatHelped.effectiveTools.length,
    improvements: growthSignals.improvements.length,
    hasEnoughData,
  });

  return reflection;
}

export function setReflectionFeedback(feedback: ReflectionFeedback): void {
  if (cachedReflection) {
    cachedReflection = { ...cachedReflection, feedback };
    console.log('[WeeklyReflectionService] Feedback set:', feedback);
  }
}

export function invalidateReflectionCache(): void {
  cachedReflection = null;
  cachedWeekKey = '';
  console.log('[WeeklyReflectionService] Cache invalidated');
}
