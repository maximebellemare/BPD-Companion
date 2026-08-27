import { buildFirstWeekJourneySummary } from '@/services/insights/firstWeekJourneyService';
import { generateDay2PersonalizedAhaInsight } from '@/services/insights/ahaMomentsService';
import type { AIConversation } from '@/types/ai';
import type { JournalEntry } from '@/types';
import type { MemoryProfile } from '@/types/memory';
import { DEFAULT_ONBOARDING_PROFILE, type OnboardingProfile } from '@/types/onboarding';
import type { ProgressSummary } from '@/types/progress';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`First-week journey regression failed: ${message}`);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function entry(index: number, timestamp: number, emotion: string, trigger: string): JournalEntry {
  return {
    id: `entry_${index}`,
    timestamp,
    reflection: `${emotion} around ${trigger}`,
    checkIn: {
      id: `checkin_${index}`,
      timestamp,
      emotions: [{ id: `emotion_${index}`, label: emotion, emoji: '', intensity: 7 }],
      triggers: [{ id: `trigger_${index}`, label: trigger, category: 'relationship' }],
      urges: [],
      bodySensations: [],
      intensityLevel: 7,
      notes: trigger,
      copingUsed: index % 2 === 0 ? ['grounding'] : [],
    },
  };
}

const memoryProfile: MemoryProfile = {
  topTriggers: [{ label: 'Delayed replies', count: 2, percentage: 67 }],
  topEmotions: [{ label: 'Anxious', count: 2, percentage: 67 }],
  topUrges: [],
  copingToolsUsed: [],
  relationshipPatterns: [],
  recentImprovements: [],
  recentCheckInCount: 3,
  averageIntensity: 7,
  intensityTrend: 'stable',
  recentThemes: [],
  lastCheckInDate: null,
  copingSuccessRate: 0,
  mostEffectiveCoping: null,
  weeklyCheckInAvg: 3,
  messageUsage: {
    totalRewrites: 0,
    totalPauses: 1,
    rewriteTypes: {},
    pauseSuccessRate: 0,
    sentAfterRewrite: 0,
    notSentAfterPause: 1,
  },
  supportiveSummary: 'Supportive context is building',
  relationshipPatternSummary: '',
  distressTrendDescription: 'stable',
};

const progress: ProgressSummary = {
  metrics: {
    averageDistressIntensity: 7,
    totalCheckIns: 3,
    journalStreak: 2,
    copingExercisesUsed: 1,
    successfulMessagePauses: 1,
    relationshipConflictReduction: 0,
  },
  weekComparison: {
    thisWeekAvgDistress: 7,
    lastWeekAvgDistress: 0,
    changePercent: 0,
    direction: 'stable',
  },
  distressTrend: [],
  emotionDistribution: [],
  copingSuccess: [],
  encouragingMessage: '',
  milestones: [],
  regulation: {
    pausesBeforeSending: 1,
    groundingUsed: 1,
    safetyModeActivations: 0,
    rewritesUsed: 0,
    constructiveOutcomes: 0,
  },
  consistency: {
    journalStreak: 2,
    ritualStreak: 0,
    companionSessions: 1,
    weeklyActiveDays: 2,
  },
  triggerFrequency: [],
  encouragingInsights: [],
  hasEnoughData: true,
};

export function assertFirstWeekJourneyRetentionScenarios(): true {
  const now = Date.now();
  const entries = [
    entry(1, now - DAY_MS * 2, 'Anxious', 'Delayed replies'),
    entry(2, now - DAY_MS, 'Anxious', 'Delayed replies'),
    entry(3, now, 'Ashamed', 'Conflict'),
  ];
  const onboardingProfile: OnboardingProfile = {
    ...DEFAULT_ONBOARDING_PROFILE,
    primaryReasons: ['fear_of_abandonment'],
    hardestMoments: ['delayed_replies'],
  };

  const aha = generateDay2PersonalizedAhaInsight({
    journalEntries: entries.slice(0, 2),
    onboardingProfile,
  });
  if (!aha) throw new Error('First-week journey regression failed: day-2 aha is generated after two entries');
  assert(aha.value === 'Anxious around Delayed replies', 'day-2 aha uses early emotion and trigger data');
  assert(aha.description.includes('Based on what you told us'), 'day-2 onboarding context is explicitly labeled');
  assert(aha.description.includes('relationship stress'), 'day-2 aha reflects onboarding focus without claiming it was detected');

  const sparseAha = generateDay2PersonalizedAhaInsight({
    journalEntries: [{
      ...entry(4, now, '', ''),
      reflection: '',
      checkIn: {
        ...entry(4, now, '', '').checkIn,
        emotions: [],
        triggers: [],
      },
    }, {
      ...entry(5, now, '', ''),
      reflection: '',
      checkIn: {
        ...entry(5, now, '', '').checkIn,
        emotions: [],
        triggers: [],
      },
    }],
    onboardingProfile,
  });
  assert(sparseAha === null, 'sparse data does not fabricate a day-2 insight');

  const summary = buildFirstWeekJourneySummary({
    journalEntries: entries,
    conversations: [{
      id: 'conversation_1',
      title: 'Pattern conversation',
      createdAt: now,
      updatedAt: now,
      messages: [],
      preview: 'You named the pattern.',
      saved: true,
      tags: [],
    } as AIConversation],
    memoryProfile,
    onboardingProfile,
    progress,
    trialStartedAt: now - DAY_MS * 2,
    now,
  });

  assert(summary.day2AhaInsight?.id === 'day2_aha_emotion_trigger', 'summary exposes day-2 personalized aha insight');
  assert(summary.day3ProgressRecap?.id === 'day3_progress_recap', 'summary exposes day-3 progress recap');
  assert(summary.day3ProgressRecap?.value.includes('check-ins'), 'day-3 recap describes accumulated value');
  assert(summary.premiumInsights.length > 0, 'existing premium insights remain available');

  const beforeDay2 = buildFirstWeekJourneySummary({
    journalEntries: entries,
    conversations: [],
    memoryProfile,
    onboardingProfile,
    progress,
    trialStartedAt: now - DAY_MS + 1000,
    now,
  });
  assert(beforeDay2.currentDay === 1, 'day-2 timing waits at least 24h from RevenueCat trial start');
  assert(beforeDay2.day2AhaInsight === null, 'day-2 insight is locked before 24h from trial start');

  const beforeDay3 = buildFirstWeekJourneySummary({
    journalEntries: entries,
    conversations: [],
    memoryProfile,
    onboardingProfile,
    progress,
    trialStartedAt: now - DAY_MS * 2 + 1000,
    now,
  });
  assert(beforeDay3.currentDay === 2, 'day-3 timing waits at least 48h from RevenueCat trial start');
  assert(beforeDay3.day3ProgressRecap === null, 'day-3 recap is locked before 48h from trial start');

  const noTrialStart = buildFirstWeekJourneySummary({
    journalEntries: entries,
    conversations: [],
    memoryProfile,
    onboardingProfile,
    progress,
    trialStartedAt: null,
    now,
  });
  assert(noTrialStart.currentDay === 1, 'journey timing does not fall back to onboarding or first activity');
  assert(noTrialStart.day2AhaInsight === null, 'day-2 does not run without RevenueCat trial start');

  const zeroMetricProgress: ProgressSummary = {
    ...progress,
    metrics: {
      ...progress.metrics,
      copingExercisesUsed: 0,
      successfulMessagePauses: 0,
    },
  };
  const zeroMetricSummary = buildFirstWeekJourneySummary({
    journalEntries: [],
    conversations: [{
      id: 'conversation_zero',
      title: 'One conversation',
      createdAt: now,
      updatedAt: now,
      messages: [],
      preview: '',
      saved: false,
      tags: [],
    } as AIConversation],
    memoryProfile,
    onboardingProfile,
    progress: zeroMetricProgress,
    trialStartedAt: now - DAY_MS * 2,
    now,
  });
  assert(!zeroMetricSummary.day3ProgressRecap?.description.includes('0 '), 'day-3 recap omits zero-value metrics');

  return true;
}

export const firstWeekJourneyRetentionTestsPassed =
  assertFirstWeekJourneyRetentionScenarios();
