import { AIConversation } from '@/types/ai';
import { FirstWeekJourneyStep, FirstWeekJourneySummary, PremiumInsightItem } from '@/types/firstWeekJourney';
import { JournalEntry } from '@/types';
import { MemoryProfile } from '@/types/memory';
import { ProgressSummary } from '@/types/progress';

const DAY_MS = 24 * 60 * 60 * 1000;

function getFirstActivityAt(entries: JournalEntry[], conversations: AIConversation[]): number {
  const timestamps = [
    ...entries.map(entry => entry.timestamp),
    ...conversations.map(conversation => conversation.createdAt),
  ].filter(Boolean);

  return timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
}

function getUniqueActiveDays(entries: JournalEntry[], conversations: AIConversation[]): number {
  const days = new Set<string>();
  [...entries.map(entry => entry.timestamp), ...conversations.map(conversation => conversation.createdAt)]
    .filter(Boolean)
    .forEach(timestamp => {
      days.add(new Date(timestamp).toDateString());
    });
  return days.size;
}

function getCurrentJourneyDay(entries: JournalEntry[], conversations: AIConversation[]): number {
  const firstActivityAt = getFirstActivityAt(entries, conversations);
  const day = Math.floor((Date.now() - firstActivityAt) / DAY_MS) + 1;
  return Math.max(1, Math.min(7, day));
}

function getStatus(done: boolean, active: boolean): FirstWeekJourneyStep['status'] {
  if (done) return 'complete';
  return active ? 'active' : 'locked';
}

function buildSteps(params: {
  currentDay: number;
  checkInCount: number;
  aiConversationCount: number;
  activeDays: number;
  hasPatterns: boolean;
  emotionalReportReady: boolean;
}): FirstWeekJourneyStep[] {
  const { currentDay, checkInCount, aiConversationCount, activeDays, hasPatterns, emotionalReportReady } = params;

  return [
    {
      id: 'day1_checkin',
      dayLabel: 'Day 1',
      title: 'First check-in',
      description: 'Start the pattern map with one honest emotional snapshot.',
      status: getStatus(checkInCount > 0, currentDay === 1),
      ctaLabel: 'Check in',
      route: '/check-in',
    },
    {
      id: 'day1_ai',
      dayLabel: 'Day 1',
      title: 'First AI conversation',
      description: 'Let the companion learn what support feels useful to you.',
      status: getStatus(aiConversationCount > 0, checkInCount > 0 || currentDay === 1),
      ctaLabel: 'Talk to AI',
      route: '/(tabs)/companion',
    },
    {
      id: 'day2_4_habit',
      dayLabel: 'Days 2-4',
      title: 'Build the habit',
      description: 'Repeat small check-ins so your messages become more personal.',
      status: getStatus(activeDays >= 3 || checkInCount >= 3, currentDay >= 2 && currentDay <= 4),
      ctaLabel: 'Keep going',
      route: '/check-in',
    },
    {
      id: 'day5_patterns',
      dayLabel: 'Day 5',
      title: 'First pattern detection',
      description: 'Reveal early trigger, relationship, and emotional trend signals.',
      status: getStatus(hasPatterns, currentDay >= 5),
      ctaLabel: 'See patterns',
      route: '/insights',
    },
    {
      id: 'day7_report',
      dayLabel: 'Day 7',
      title: 'Personal emotional report',
      description: 'Turn the week into a clear map of triggers, trends, and progress.',
      status: getStatus(emotionalReportReady, currentDay >= 7),
      ctaLabel: 'Open report',
      route: '/weekly-reflection',
    },
  ];
}

function getInsightConfidence(checkInCount: number): PremiumInsightItem['confidence'] {
  if (checkInCount >= 7) return 'personalized';
  if (checkInCount >= 3) return 'emerging';
  return 'building';
}

function buildPremiumInsights(
  memoryProfile: MemoryProfile,
  progress: ProgressSummary,
  conversations: AIConversation[],
): PremiumInsightItem[] {
  const confidence = getInsightConfidence(memoryProfile.recentCheckInCount);
  const topTrigger = memoryProfile.topTriggers[0]?.label ?? 'Your strongest triggers';
  const topEmotion = memoryProfile.topEmotions[0]?.label ?? 'Your most common emotional state';
  const relationshipPattern = memoryProfile.relationshipPatterns[0]?.pattern ?? memoryProfile.relationshipPatternSummary;
  const aiObservation = conversations[0]?.preview || memoryProfile.supportiveSummary;
  const progressValue = progress.weekComparison.direction === 'improved'
    ? `${progress.weekComparison.changePercent}% lower distress`
    : progress.metrics.copingExercisesUsed > 0
      ? `${progress.metrics.copingExercisesUsed} coping tools used`
      : `${progress.metrics.totalCheckIns} check-ins logged`;

  return [
    {
      id: 'trigger_patterns',
      title: 'Trigger patterns',
      value: topTrigger,
      description: 'Highlights what tends to activate emotional spikes so the app can suggest earlier support.',
      confidence,
    },
    {
      id: 'relationship_patterns',
      title: 'Relationship patterns',
      value: relationshipPattern || 'Relationship signals are building',
      description: 'Connects conflicts, reassurance needs, pauses, and communication patterns over time.',
      confidence,
    },
    {
      id: 'emotional_trends',
      title: 'Emotional trends',
      value: topEmotion,
      description: `Tracks whether distress is ${memoryProfile.distressTrendDescription.toLowerCase()} and what emotions show up most.`,
      confidence,
    },
    {
      id: 'ai_observations',
      title: 'AI observations',
      value: aiObservation || 'Conversation memory is building',
      description: 'Turns companion conversations into gentle observations about needs, patterns, and supports.',
      confidence,
    },
    {
      id: 'progress_summaries',
      title: 'Progress summaries',
      value: progressValue,
      description: 'Shows what is changing across check-ins, tools used, pauses, and weekly reflection.',
      confidence,
    },
  ];
}

export function buildFirstWeekJourneySummary(params: {
  journalEntries: JournalEntry[];
  conversations: AIConversation[];
  memoryProfile: MemoryProfile;
  progress: ProgressSummary;
}): FirstWeekJourneySummary {
  const { journalEntries, conversations, memoryProfile, progress } = params;
  const currentDay = getCurrentJourneyDay(journalEntries, conversations);
  const checkInCount = journalEntries.length;
  const aiConversationCount = conversations.length;
  const activeDays = getUniqueActiveDays(journalEntries, conversations);
  const hasPatterns =
    memoryProfile.recentCheckInCount >= 3 ||
    memoryProfile.topTriggers.length > 0 ||
    memoryProfile.relationshipPatterns.length > 0;
  const emotionalReportReady = checkInCount >= 5 || currentDay >= 7;

  const steps = buildSteps({
    currentDay,
    checkInCount,
    aiConversationCount,
    activeDays,
    hasPatterns,
    emotionalReportReady,
  });
  const nextStep = steps.find(step => step.status === 'active') ?? steps.find(step => step.status === 'locked') ?? steps[steps.length - 1];
  const completedSteps = steps.filter(step => step.status === 'complete').length;
  const premiumInsights = buildPremiumInsights(memoryProfile, progress, conversations);
  const insightDepth = Math.min(100, Math.round(
    checkInCount * 9 +
    aiConversationCount * 12 +
    memoryProfile.topTriggers.length * 8 +
    memoryProfile.relationshipPatterns.length * 10 +
    progress.metrics.copingExercisesUsed * 4,
  ));

  return {
    currentDay,
    completedSteps,
    totalSteps: steps.length,
    checkInCount,
    aiConversationCount,
    insightDepth,
    nextStep,
    steps,
    premiumInsights,
    emotionalReportReady,
    paywallLossHeadline: emotionalReportReady
      ? 'Your first emotional report is ready to unlock'
      : 'Your emotional pattern map is starting to form',
    paywallLossBullets: [
      'Your trigger and relationship patterns stop updating after the trial.',
      'Your Day 7 emotional report stays available with membership.',
      'AI observations lose the context that makes support feel personal.',
    ],
  };
}
