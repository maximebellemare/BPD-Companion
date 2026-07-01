import { JournalEntry } from '@/types';
import { CompanionContextSummary } from '@/types/ai';
import {
  OnboardingProfile,
  PRIMARY_REASON_OPTIONS,
  SUPPORT_GOAL_OPTIONS,
  DESIRED_OUTCOME_OPTIONS,
} from '@/types/onboarding';
import { MemoryProfile } from '@/types/memory';
import {
  buildRelationshipTaggedSources,
  formatRelationshipType,
} from '@/services/relationships/relationshipTaggingService';
import { RelationshipType } from '@/types/relationship';

function uniqueTop(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach(value => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

function labelsFromOptions<T extends string>(values: T[], options: { value: T; label: string }[]): string[] {
  return values
    .map(value => options.find(option => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));
}

function getRecent(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
}

function relationshipStressCount(entries: JournalEntry[]): number {
  return entries.filter(entry => entry.checkIn.triggers.some(trigger => {
    const label = trigger.label.toLowerCase();
    return trigger.category === 'relationship' ||
      /relationship|abandon|conflict|rejected|ignored|criticism/.test(label);
  })).length;
}

export function buildCompanionContextSummary(params: {
  journalEntries: JournalEntry[];
  onboardingProfile: OnboardingProfile;
  memoryProfile: MemoryProfile;
}): CompanionContextSummary {
  const { journalEntries, onboardingProfile, memoryProfile } = params;
  const recentEntries = getRecent(journalEntries);
  const latestEntry = recentEntries[0] ?? null;
  const recentEmotions = uniqueTop(
    recentEntries.flatMap(entry => entry.checkIn.emotions.map(emotion => emotion.label)),
    4,
  );
  const recentTriggers = uniqueTop(
    recentEntries.flatMap(entry => entry.checkIn.triggers.map(trigger => trigger.label)),
    4,
  );
  const onboardingGoals = [
    ...labelsFromOptions(onboardingProfile.primaryReasons, PRIMARY_REASON_OPTIONS),
    ...labelsFromOptions(onboardingProfile.preferredTools, SUPPORT_GOAL_OPTIONS),
    ...labelsFromOptions(onboardingProfile.desiredOutcomes, DESIRED_OUTCOME_OPTIONS),
  ].slice(0, 5);

  const commonPatterns = [
    memoryProfile.topEmotions[0] ? `Most common emotion: ${memoryProfile.topEmotions[0].label}` : '',
    memoryProfile.topTriggers[0] ? `Most common trigger: ${memoryProfile.topTriggers[0].label}` : '',
    memoryProfile.relationshipPatternSummary,
    memoryProfile.distressTrendDescription,
  ].filter(Boolean).slice(0, 5);

  const currentIntensity = latestEntry?.checkIn.intensityLevel ?? null;
  const relationshipCount = relationshipStressCount(recentEntries);
  const relationshipSources = buildRelationshipTaggedSources({
    journalEntries: recentEntries,
    conversations: [],
    maxAgeMs: 14 * 24 * 60 * 60 * 1000,
  });
  const relationshipTagCounts = new Map<string, number>();
  relationshipSources.forEach(source => {
    source.relationshipTags.forEach(tag => {
      relationshipTagCounts.set(tag, (relationshipTagCounts.get(tag) ?? 0) + 1);
    });
  });
  const relationshipPatternContext = [...relationshipTagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([tag, count]) => `${formatRelationshipType(tag as RelationshipType)} appears in ${count} recent tagged entr${count === 1 ? 'y' : 'ies'}`);

  const promptParts = [
    recentEmotions.length > 0 ? `Recent emotions: ${recentEmotions.join(', ')}` : '',
    recentTriggers.length > 0 ? `Recent triggers: ${recentTriggers.join(', ')}` : '',
    currentIntensity !== null ? `Current/latest intensity: ${currentIntensity}/10` : '',
    onboardingGoals.length > 0 ? `Onboarding goals: ${onboardingGoals.join(', ')}` : '',
    commonPatterns.length > 0 ? `Common patterns: ${commonPatterns.join('; ')}` : '',
    relationshipCount > 0 ? `Relationship stress appears in ${relationshipCount} recent check-ins` : '',
    relationshipPatternContext.length > 0 ? `Relationship tag patterns: ${relationshipPatternContext.join('; ')}` : '',
  ].filter(Boolean);

  return {
    recentEmotions,
    recentTriggers,
    currentIntensity,
    onboardingGoals,
    commonPatterns,
    relationshipStressCount: relationshipCount,
    highIntensity: (currentIntensity ?? 0) >= 7,
    promptContext: promptParts.join('\n'),
  };
}
