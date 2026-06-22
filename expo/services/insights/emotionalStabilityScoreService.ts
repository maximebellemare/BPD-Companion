import { JournalEntry, MessageDraft } from '@/types';

export type EmotionalStabilityTrend = 'up' | 'down' | 'steady' | 'building';

export interface EmotionalStabilityFactor {
  id: 'consistency' | 'intensity' | 'urges' | 'relationships' | 'coping';
  label: string;
  score: number;
  weight: number;
  summary: string;
}

export interface EmotionalStabilityScoreReport {
  score: number;
  previousScore: number | null;
  weeklyChange: number | null;
  trend: EmotionalStabilityTrend;
  hasEnoughData: boolean;
  summary: string;
  changeReasons: string[];
  factors: EmotionalStabilityFactor[];
  dataSummary: {
    checkInsThisWeek: number;
    checkInDaysThisWeek: number;
    averageIntensityThisWeek: number | null;
    highRiskUrgesThisWeek: number;
    relationshipDistressThisWeek: number;
    copingUsesThisWeek: number;
  };
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const RELATIONSHIP_WORDS = [
  'relationship',
  'partner',
  'boyfriend',
  'girlfriend',
  'spouse',
  'friend',
  'parent',
  'mother',
  'father',
  'ex',
  'abandon',
  'ignored',
  'rejected',
  'conflict',
  'argument',
  'fight',
  'text',
  'reply',
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function inRange(timestamp: number, start: number, end: number): boolean {
  return timestamp >= start && timestamp < end;
}

function dayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function averageIntensity(entries: JournalEntry[]): number | null {
  if (entries.length === 0) return null;
  return entries.reduce((sum, entry) => sum + entry.checkIn.intensityLevel, 0) / entries.length;
}

function countReflections(entries: JournalEntry[]): number {
  return entries.filter(entry => (entry.reflection?.trim().length ?? 0) >= 12).length;
}

function countCopingUses(entries: JournalEntry[]): number {
  return entries.reduce((sum, entry) => sum + (entry.checkIn.copingUsed?.length ?? 0), 0);
}

function countHighRiskUrges(entries: JournalEntry[]): number {
  return entries.reduce((sum, entry) => (
    sum + entry.checkIn.urges.filter(urge => urge.risk === 'high').length
  ), 0);
}

function countImpulsiveDraftSignals(drafts: MessageDraft[]): number {
  return drafts.filter(draft => draft.sent && !draft.paused && draft.outcome !== 'helped').length;
}

function countPausedDrafts(drafts: MessageDraft[]): number {
  return drafts.filter(draft => draft.paused || draft.outcome === 'not_sent').length;
}

function entryHasRelationshipSignal(entry: JournalEntry): boolean {
  if (entry.checkIn.triggers.some(trigger => trigger.category === 'relationship')) return true;
  const text = [
    entry.checkIn.notes,
    entry.reflection,
    ...entry.checkIn.triggers.map(trigger => trigger.label),
    ...entry.checkIn.emotions.map(emotion => emotion.label),
    ...entry.checkIn.urges.map(urge => urge.label),
  ].filter(Boolean).join(' ').toLowerCase();
  return RELATIONSHIP_WORDS.some(word => text.includes(word));
}

function countRelationshipDistress(entries: JournalEntry[]): number {
  return entries.filter(entry => entry.checkIn.intensityLevel >= 6 && entryHasRelationshipSignal(entry)).length;
}

function scoreRange(entries: JournalEntry[], drafts: MessageDraft[], start: number, end: number) {
  const rangeEntries = entries.filter(entry => inRange(entry.timestamp, start, end));
  const rangeDrafts = drafts.filter(draft => inRange(draft.timestamp, start, end));
  const days = new Set(rangeEntries.map(entry => dayKey(entry.timestamp))).size;
  const average = averageIntensity(rangeEntries);
  const highRiskUrges = countHighRiskUrges(rangeEntries);
  const impulsiveDraftSignals = countImpulsiveDraftSignals(rangeDrafts);
  const pausedDrafts = countPausedDrafts(rangeDrafts);
  const relationshipDistress = countRelationshipDistress(rangeEntries);
  const copingUses = countCopingUses(rangeEntries);
  const reflections = countReflections(rangeEntries);

  const consistencyScore = clamp((days / 7) * 100);
  const intensityScore = average === null ? 50 : clamp(105 - average * 10);
  const impulseSignals = highRiskUrges + impulsiveDraftSignals;
  const urgeScore = clamp(100 - impulseSignals * 16 + pausedDrafts * 8);
  const relationshipScore = clamp(100 - relationshipDistress * 14);
  const copingScore = rangeEntries.length === 0
    ? 45
    : clamp(((rangeEntries.filter(entry => (entry.checkIn.copingUsed?.length ?? 0) > 0).length / rangeEntries.length) * 70) + Math.min(reflections * 6, 30));

  const factors: EmotionalStabilityFactor[] = [
    {
      id: 'consistency',
      label: 'Check-in consistency',
      score: Math.round(consistencyScore),
      weight: 0.2,
      summary: `${days}/7 day${days === 1 ? '' : 's'} checked in`,
    },
    {
      id: 'intensity',
      label: 'Intensity trend',
      score: Math.round(intensityScore),
      weight: 0.25,
      summary: average === null ? 'No intensity data yet' : `${average.toFixed(1)}/10 average intensity`,
    },
    {
      id: 'urges',
      label: 'Impulsive urges',
      score: Math.round(urgeScore),
      weight: 0.2,
      summary: impulseSignals === 0 ? 'No high-risk urge signals logged' : `${impulseSignals} high-urgency signal${impulseSignals === 1 ? '' : 's'}`,
    },
    {
      id: 'relationships',
      label: 'Relationship distress',
      score: Math.round(relationshipScore),
      weight: 0.2,
      summary: relationshipDistress === 0 ? 'No repeated relationship distress signal' : `${relationshipDistress} relationship distress signal${relationshipDistress === 1 ? '' : 's'}`,
    },
    {
      id: 'coping',
      label: 'Coping usage',
      score: Math.round(copingScore),
      weight: 0.15,
      summary: copingUses === 0 ? 'No coping tools logged yet' : `${copingUses} coping tool use${copingUses === 1 ? '' : 's'} logged`,
    },
  ];

  const score = Math.round(factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0));

  return {
    score: clamp(score),
    factors,
    entries: rangeEntries,
    drafts: rangeDrafts,
    days,
    average,
    highRiskUrges,
    impulsiveDraftSignals,
    pausedDrafts,
    relationshipDistress,
    copingUses,
    reflections,
  };
}

function buildChangeReasons(current: ReturnType<typeof scoreRange>, previous: ReturnType<typeof scoreRange>): string[] {
  const reasons: string[] = [];

  if (current.average !== null && previous.average !== null) {
    const intensityDelta = previous.average - current.average;
    if (intensityDelta >= 0.5) reasons.push('lower average emotional intensity');
    if (intensityDelta <= -0.5) reasons.push('higher average emotional intensity');
  }

  if (current.days > previous.days) reasons.push('more consistent check-ins');
  if (current.days < previous.days) reasons.push('fewer check-in days');

  if (current.reflections > previous.reflections) reasons.push('more reflections');
  if (current.reflections < previous.reflections) reasons.push('fewer reflections');

  const currentImpulse = current.highRiskUrges + current.impulsiveDraftSignals;
  const previousImpulse = previous.highRiskUrges + previous.impulsiveDraftSignals;
  if (currentImpulse < previousImpulse) reasons.push('fewer impulsive urge signals');
  if (currentImpulse > previousImpulse) reasons.push('more impulsive urge signals');

  if (current.relationshipDistress < previous.relationshipDistress) reasons.push('fewer relationship distress signals');
  if (current.relationshipDistress > previous.relationshipDistress) reasons.push('more relationship distress signals');

  if (current.copingUses > previous.copingUses) reasons.push('more coping tools logged');
  if (current.pausedDrafts > previous.pausedDrafts) reasons.push('more pauses before sending');

  return reasons.slice(0, 4);
}

function trendFromChange(change: number | null, hasEnoughData: boolean): EmotionalStabilityTrend {
  if (!hasEnoughData || change === null) return 'building';
  if (change >= 3) return 'up';
  if (change <= -3) return 'down';
  return 'steady';
}

function summaryForTrend(trend: EmotionalStabilityTrend, score: number): string {
  if (trend === 'building') {
    return 'Your stability reflection is still forming as you add check-ins.';
  }
  if (trend === 'up') {
    return 'Your recent entries show a steadier week compared with the previous one.';
  }
  if (trend === 'down') {
    return 'Your recent entries show more strain this week, so gentle support may matter more.';
  }
  if (score >= 75) return 'Your recent data looks relatively steady this week.';
  if (score >= 50) return 'Your recent data shows a mixed week with some supportive signals.';
  return 'Your recent data suggests this may be a higher-support week.';
}

export function generateEmotionalStabilityScore(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  now = Date.now(),
): EmotionalStabilityScoreReport {
  const current = scoreRange(journalEntries, messageDrafts, now - WEEK_MS, now);
  const previous = scoreRange(journalEntries, messageDrafts, now - WEEK_MS * 2, now - WEEK_MS);
  const hasEnoughData = current.entries.length + current.drafts.length >= 2;
  const previousScore = previous.entries.length + previous.drafts.length >= 2 ? previous.score : null;
  const weeklyChange = previousScore === null ? null : current.score - previousScore;
  const trend = trendFromChange(weeklyChange, hasEnoughData);
  const changeReasons = previousScore === null
    ? [
      current.entries.length > 0 ? 'your first check-ins are creating a baseline' : 'your baseline needs more check-ins',
      current.copingUses > 0 ? 'coping tools have already been logged' : 'coping usage will appear here once tracked',
    ].slice(0, 2)
    : buildChangeReasons(current, previous);

  return {
    score: current.score,
    previousScore,
    weeklyChange,
    trend,
    hasEnoughData,
    summary: summaryForTrend(trend, current.score),
    changeReasons,
    factors: current.factors,
    dataSummary: {
      checkInsThisWeek: current.entries.length,
      checkInDaysThisWeek: current.days,
      averageIntensityThisWeek: current.average,
      highRiskUrgesThisWeek: current.highRiskUrges + current.impulsiveDraftSignals,
      relationshipDistressThisWeek: current.relationshipDistress,
      copingUsesThisWeek: current.copingUses,
    },
  };
}
