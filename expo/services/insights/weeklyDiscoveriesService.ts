import { JournalEntry, MessageDraft } from '@/types';
import { storageService } from '@/services/storage/storageService';
import {
  buildRelationshipTaggedSources,
  formatRelationshipType,
} from '@/services/relationships/relationshipTaggingService';
import { RelationshipType } from '@/types/relationship';

export type DiscoveryConfidence = 'low' | 'medium' | 'high';

export interface WeeklyDiscoveryItem {
  id: string;
  label: string;
  title: string;
  body: string;
  confidence: DiscoveryConfidence;
  why: string;
}

export interface WeeklyDiscoveriesReport {
  id: string;
  generatedAt: number;
  weekStart: number;
  weekEnd: number;
  weekEntryCount: number;
  weekDraftCount: number;
  hasEnoughData: boolean;
  strongestEmotionalPattern: WeeklyDiscoveryItem;
  mostCommonTrigger: WeeklyDiscoveryItem;
  mostCommonRelationshipTheme: WeeklyDiscoveryItem;
  biggestImprovement: WeeklyDiscoveryItem;
  oneThingToWatchNextWeek: WeeklyDiscoveryItem;
  savedAt?: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SAVED_WEEKLY_DISCOVERIES_KEY = 'bpd_companion_saved_weekly_discoveries';

type CountItem = { label: string; count: number; weight: number };

function inRange(timestamp: number, start: number, end: number): boolean {
  return timestamp >= start && timestamp < end;
}

function countLabels(items: Array<{ label: string; weight?: number }>): CountItem[] {
  const counts = new Map<string, CountItem>();
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
  return [...counts.values()].sort((a, b) => b.count - a.count || b.weight - a.weight);
}

function averageIntensity(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, entry) => sum + entry.checkIn.intensityLevel, 0) / entries.length;
}

function confidenceFromCount(count: number, total: number): DiscoveryConfidence {
  if (count >= 4 || (total >= 5 && count / total >= 0.5)) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
}

function unavailable(id: string, label: string, title: string, why: string): WeeklyDiscoveryItem {
  return {
    id,
    label,
    title,
    body: 'No clear signal yet. Keep checking in and this will become more personal.',
    confidence: 'low',
    why,
  };
}

function buildStrongestPattern(entries: JournalEntry[]): WeeklyDiscoveryItem {
  const topEmotion = countLabels(entries.flatMap(entry => entry.checkIn.emotions.map(emotion => ({
    label: emotion.label,
    weight: emotion.intensity ?? entry.checkIn.intensityLevel,
  }))))[0];
  const topTrigger = countLabels(entries.flatMap(entry => entry.checkIn.triggers.map(trigger => ({
    label: trigger.label,
    weight: entry.checkIn.intensityLevel,
  }))))[0];

  if (!topEmotion && !topTrigger) {
    return unavailable(
      'weekly_pattern_empty',
      'Strongest emotional pattern',
      'Pattern still forming',
      'This needs at least one emotion or trigger from this week.',
    );
  }

  if (topEmotion && topTrigger) {
    const confidence = confidenceFromCount(Math.min(topEmotion.count, topTrigger.count), entries.length);
    return {
      id: 'weekly_pattern',
      label: 'Strongest emotional pattern',
      title: `${topEmotion.label} around ${topTrigger.label}`,
      body: `This week, ${topEmotion.label.toLowerCase()} appeared most often alongside ${topTrigger.label.toLowerCase()}.`,
      confidence,
      why: `${topEmotion.label} appeared ${topEmotion.count} time${topEmotion.count === 1 ? '' : 's'} and ${topTrigger.label} appeared ${topTrigger.count} time${topTrigger.count === 1 ? '' : 's'} in ${entries.length} check-in${entries.length === 1 ? '' : 's'}.`,
    };
  }

  const item = topEmotion ?? topTrigger;
  return {
    id: 'weekly_pattern_partial',
    label: 'Strongest emotional pattern',
    title: item ? `${item.label} stood out` : 'Pattern still forming',
    body: item
      ? `${item.label} was the clearest repeated signal this week. More paired trigger data will make the pattern sharper.`
      : 'No clear signal yet.',
    confidence: item ? confidenceFromCount(item.count, entries.length) : 'low',
    why: item ? `${item.label} appeared ${item.count} time${item.count === 1 ? '' : 's'} this week.` : 'No emotion or trigger labels were captured this week.',
  };
}

function buildMostCommonTrigger(entries: JournalEntry[]): WeeklyDiscoveryItem {
  const topTrigger = countLabels(entries.flatMap(entry => entry.checkIn.triggers.map(trigger => ({
    label: trigger.label,
    weight: entry.checkIn.intensityLevel,
  }))))[0];

  if (!topTrigger) {
    return unavailable(
      'weekly_trigger_empty',
      'Most common trigger',
      'No trigger stood out yet',
      'This week’s check-ins did not include a repeated trigger.',
    );
  }

  return {
    id: 'weekly_trigger',
    label: 'Most common trigger',
    title: topTrigger.label,
    body: `${topTrigger.label} was the trigger that appeared most often in this week’s entries.`,
    confidence: confidenceFromCount(topTrigger.count, entries.length),
    why: `${topTrigger.label} appeared ${topTrigger.count} time${topTrigger.count === 1 ? '' : 's'} across ${entries.length} check-in${entries.length === 1 ? '' : 's'}.`,
  };
}

function buildMostCommonRelationshipTheme(entries: JournalEntry[]): WeeklyDiscoveryItem {
  const taggedSources = buildRelationshipTaggedSources({
    journalEntries: entries,
    conversations: [],
    maxAgeMs: WEEK_MS,
  });

  const relationshipSignalSources = taggedSources.length > 0
    ? taggedSources
    : entries
      .filter(entry => entry.checkIn.triggers.some(trigger => trigger.category === 'relationship'))
      .map(entry => ({
        id: entry.id,
        text: [
          entry.reflection ?? '',
          entry.checkIn.notes ?? '',
          ...entry.checkIn.triggers.map(trigger => trigger.label),
          ...entry.checkIn.emotions.map(emotion => emotion.label),
          ...entry.checkIn.urges.map(urge => urge.label),
        ].join(' '),
        relationshipTags: [] as RelationshipType[],
      }));

  if (relationshipSignalSources.length < 2) {
    return unavailable(
      'weekly_relationship_theme_empty',
      'Most common relationship theme',
      'Relationship theme still forming',
      'This needs at least two relationship-related entries or relationship tags this week.',
    );
  }

  const themeCounts = new Map<string, number>();
  const tagCounts = new Map<RelationshipType, number>();

  relationshipSignalSources.forEach(source => {
    const lower = source.text.toLowerCase();
    source.relationshipTags.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
    if (/abandon|ignored|no reply|delayed reply|left on read|silence|rejected/.test(lower)) {
      themeCounts.set('abandonment or uncertainty', (themeCounts.get('abandonment or uncertainty') ?? 0) + 1);
    }
    if (/conflict|fight|argument|criticism|criticized|tone change/.test(lower)) {
      themeCounts.set('conflict or criticism', (themeCounts.get('conflict or criticism') ?? 0) + 1);
    }
    if (/shame|ashamed|too much|my fault|worthless|embarrassed/.test(lower)) {
      themeCounts.set('shame after connection stress', (themeCounts.get('shame after connection stress') ?? 0) + 1);
    }
    if (/withdraw|shut down|pull away|avoid|isolate/.test(lower)) {
      themeCounts.set('withdrawal or pulling away', (themeCounts.get('withdrawal or pulling away') ?? 0) + 1);
    }
  });

  const [topTheme, topThemeCount] = [...themeCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  const [topTag, topTagCount] = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  if (!topTheme && !topTag) {
    return unavailable(
      'weekly_relationship_theme_unclear',
      'Most common relationship theme',
      'Relationship theme still forming',
      'Relationship entries appeared this week, but no specific repeated theme was strong enough yet.',
    );
  }

  if (topTheme) {
    const tagContext = topTag ? `, especially in entries tagged with ${formatRelationshipType(topTag)}` : '';
    return {
      id: `weekly_relationship_theme_${topTheme.replace(/\W+/g, '_')}`,
      label: 'Most common relationship theme',
      title: `${topTheme[0].toUpperCase()}${topTheme.slice(1)}`,
      body: `${topTheme} appeared most often in relationship-related entries this week${tagContext}.`,
      confidence: confidenceFromCount(topThemeCount, relationshipSignalSources.length),
      why: `${topTheme} appeared in ${topThemeCount} of ${relationshipSignalSources.length} relationship-related source${relationshipSignalSources.length === 1 ? '' : 's'} this week.`,
    };
  }

  const tagLabel = formatRelationshipType(topTag);
  return {
    id: `weekly_relationship_theme_${topTag}`,
    label: 'Most common relationship theme',
    title: `Your ${tagLabel} showed up most`,
    body: `Entries tagged with ${tagLabel} appeared most often this week. More check-ins will clarify the emotion or trigger that tends to follow.`,
    confidence: confidenceFromCount(topTagCount, relationshipSignalSources.length),
    why: `${tagLabel} appeared in ${topTagCount} relationship-tagged entr${topTagCount === 1 ? 'y' : 'ies'} this week.`,
  };
}

function buildBiggestImprovement(thisWeek: JournalEntry[], lastWeek: JournalEntry[], drafts: MessageDraft[]): WeeklyDiscoveryItem {
  const thisAvg = averageIntensity(thisWeek);
  const lastAvg = averageIntensity(lastWeek);
  const pausedDrafts = drafts.filter(draft => draft.paused || draft.outcome === 'not_sent').length;
  const copingEntries = thisWeek.filter(entry => (entry.checkIn.copingUsed?.length ?? 0) > 0).length;

  if (lastWeek.length >= 2 && thisWeek.length >= 2 && lastAvg - thisAvg >= 1) {
    const drop = Number((lastAvg - thisAvg).toFixed(1));
    return {
      id: 'weekly_improvement_intensity',
      label: 'Biggest improvement',
      title: 'Intensity softened',
      body: `Your average check-in intensity was ${drop} point${drop === 1 ? '' : 's'} lower than the previous week.`,
      confidence: drop >= 2 ? 'high' : 'medium',
      why: `This week averaged ${thisAvg.toFixed(1)}/10 across ${thisWeek.length} check-ins; last week averaged ${lastAvg.toFixed(1)}/10 across ${lastWeek.length}.`,
    };
  }

  if (pausedDrafts > 0) {
    return {
      id: 'weekly_improvement_pause',
      label: 'Biggest improvement',
      title: 'You created a pause',
      body: 'You paused or chose not to send at least one message this week. That is a real interruption point.',
      confidence: pausedDrafts >= 2 ? 'medium' : 'low',
      why: `${pausedDrafts} message draft${pausedDrafts === 1 ? '' : 's'} were marked paused or not sent this week.`,
    };
  }

  if (copingEntries > 0) {
    return {
      id: 'weekly_improvement_coping',
      label: 'Biggest improvement',
      title: 'You used support tools',
      body: 'You logged coping support during check-ins this week.',
      confidence: copingEntries >= 2 ? 'medium' : 'low',
      why: `${copingEntries} check-in${copingEntries === 1 ? '' : 's'} included coping tools this week.`,
    };
  }

  return unavailable(
    'weekly_improvement_empty',
    'Biggest improvement',
    'No clear improvement signal yet',
    'This needs either previous-week comparison data, paused messages, or logged coping tools.',
  );
}

function buildOneThingToWatchNextWeek(entries: JournalEntry[], drafts: MessageDraft[]): WeeklyDiscoveryItem {
  const highIntensityEntries = entries.filter(entry => entry.checkIn.intensityLevel >= 7);
  const highWithoutTrigger = highIntensityEntries.filter(entry => entry.checkIn.triggers.length === 0);
  const highWithoutCoping = highIntensityEntries.filter(entry => (entry.checkIn.copingUsed?.length ?? 0) === 0);
  const reactiveDrafts = drafts.filter(draft => !draft.paused && draft.sent).length;

  if (highWithoutTrigger.length >= 2) {
    return {
      id: 'weekly_watch_trigger',
      label: 'One thing to watch next week',
      title: 'Name the trigger earlier',
      body: 'Several intense moments were logged without a trigger. Next week, gently naming “what may have started this” could make patterns easier to see.',
      confidence: highWithoutTrigger.length >= 3 ? 'medium' : 'low',
      why: `${highWithoutTrigger.length} high-intensity check-ins had no trigger attached.`,
    };
  }

  if (highWithoutCoping.length >= 2) {
    return {
      id: 'weekly_watch_support_step',
      label: 'One thing to watch next week',
      title: 'Add one support step when intensity rises',
      body: 'When emotions were intense, support tools were not always logged. Next week, the useful moment may be between feeling and action.',
      confidence: highWithoutCoping.length >= 3 ? 'medium' : 'low',
      why: `${highWithoutCoping.length} high-intensity check-ins did not include a coping tool.`,
    };
  }

  if (reactiveDrafts >= 2) {
    return {
      id: 'weekly_watch_message_pause',
      label: 'One thing to watch next week',
      title: 'Pause before sending',
      body: 'A few messages were sent without a recorded pause. Next week, watch the moment right before sending.',
      confidence: 'low',
      why: `${reactiveDrafts} message draft${reactiveDrafts === 1 ? '' : 's'} were marked sent without a pause.`,
    };
  }

  return unavailable(
    'weekly_watch_empty',
    'One thing to watch next week',
    'Keep watching the next small pattern',
    'This needs repeated high-intensity entries, missed supports, or message outcome data.',
  );
}

export function generateWeeklyDiscoveries(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  now = Date.now(),
): WeeklyDiscoveriesReport {
  const weekStart = now - WEEK_MS;
  const previousWeekStart = now - WEEK_MS * 2;
  const thisWeek = journalEntries.filter(entry => inRange(entry.timestamp, weekStart, now));
  const lastWeek = journalEntries.filter(entry => inRange(entry.timestamp, previousWeekStart, weekStart));
  const thisWeekDrafts = messageDrafts.filter(draft => inRange(draft.timestamp, weekStart, now));

  const strongestEmotionalPattern = buildStrongestPattern(thisWeek);
  const mostCommonTrigger = buildMostCommonTrigger(thisWeek);
  const mostCommonRelationshipTheme = buildMostCommonRelationshipTheme(thisWeek);
  const biggestImprovement = buildBiggestImprovement(thisWeek, lastWeek, thisWeekDrafts);
  const oneThingToWatchNextWeek = buildOneThingToWatchNextWeek(thisWeek, thisWeekDrafts);

  return {
    id: `weekly_discovery_${weekStart}_${now}`,
    generatedAt: now,
    weekStart,
    weekEnd: now,
    weekEntryCount: thisWeek.length,
    weekDraftCount: thisWeekDrafts.length,
    hasEnoughData: thisWeek.length + thisWeekDrafts.length >= 2,
    strongestEmotionalPattern,
    mostCommonTrigger,
    mostCommonRelationshipTheme,
    biggestImprovement,
    oneThingToWatchNextWeek,
  };
}

export function getWeeklyDiscoveryItems(report: WeeklyDiscoveriesReport): WeeklyDiscoveryItem[] {
  return [
    report.strongestEmotionalPattern,
    report.mostCommonTrigger,
    report.mostCommonRelationshipTheme,
    report.biggestImprovement,
    report.oneThingToWatchNextWeek,
  ];
}

export function formatWeeklyDiscoveriesForSharing(report: WeeklyDiscoveriesReport): string {
  const weekLabel = `${new Date(report.weekStart).toLocaleDateString()} - ${new Date(report.weekEnd).toLocaleDateString()}`;
  const items = getWeeklyDiscoveryItems(report)
    .map(item => `${item.label}\n${item.title}\n${item.body}\nWhy: ${item.why}`)
    .join('\n\n');
  return `BPD Companion Weekly Discovery\n${weekLabel}\n\n${items}\n\nEvidence-based reflection, not medical advice.`;
}

export async function loadSavedWeeklyDiscoveries(): Promise<WeeklyDiscoveriesReport[]> {
  return (await storageService.get<WeeklyDiscoveriesReport[]>(SAVED_WEEKLY_DISCOVERIES_KEY)) ?? [];
}

export async function saveWeeklyDiscoveryReport(report: WeeklyDiscoveriesReport): Promise<WeeklyDiscoveriesReport[]> {
  const existing = await loadSavedWeeklyDiscoveries();
  const savedReport: WeeklyDiscoveriesReport = {
    ...report,
    savedAt: Date.now(),
  };
  const updated = [
    savedReport,
    ...existing.filter(item => item.id !== report.id),
  ].slice(0, 24);
  await storageService.set(SAVED_WEEKLY_DISCOVERIES_KEY, updated);
  return updated;
}
