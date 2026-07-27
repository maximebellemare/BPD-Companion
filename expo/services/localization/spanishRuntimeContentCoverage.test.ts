import assert from 'node:assert/strict';
import { i18n } from '@/lib/i18n';
import { simulateResponses, EXAMPLE_SCENARIOS } from '@/services/simulator/emotionalSimulationService';
import { generateWeeklyPlan } from '@/services/therapy/adaptiveTherapyService';
import { simulateResponsePaths } from '@/services/messages/messageSimulationService';
import { scoreRewrite } from '@/services/games/rewriteMessageGameService';
import { RELATIONSHIP_SIMULATOR_SCENARIOS } from '@/services/games/relationshipSimulatorService';
import { detectEmotionalStorm } from '@/services/prediction/emotionalStormService';
import { analyzePatterns as analyzeEarlyWarnings } from '@/services/prediction/patternPredictionService';
import { buildCommunicationNudges } from '@/services/coaching/coachingPromptBuilder';
import { RITUAL_CONFIG } from '@/services/rituals/ritualService';
import { getRandomTemplate } from '@/services/notifications/notificationTemplates';
import { NOTIFICATION_CATEGORIES } from '@/services/notifications/notificationCategories';
import type { JournalEntry, MessageDraft } from '@/types';
import type { MemoryProfile } from '@/types/memory';
import type { GraphPatternSummary } from '@/types/memoryGraph';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const entries: JournalEntry[] = [0, 1, 2, 3, 4].map((offset) => ({
  id: `entry-${offset}`,
  timestamp: now - offset * day,
  checkIn: {
    id: `check-${offset}`,
    timestamp: now - offset * day,
    triggers: [{ id: `trigger-${offset}`, label: 'late reply', category: 'relationship' }],
    emotions: [{ id: `emotion-${offset}`, label: 'Anxious', emoji: '', intensity: 8 }],
    urges: [{ id: `urge-${offset}`, label: 'text for reassurance', emoji: '', risk: 'medium' }],
    bodySensations: [],
    intensityLevel: offset < 3 ? 8 : 5,
    notes: '',
    copingUsed: ['Grounding'],
  },
  reflection: 'I noticed a relationship trigger.',
  outcome: 'managed',
}));

const drafts: MessageDraft[] = [0, 1, 2, 3].map((offset) => ({
  id: `draft-${offset}`,
  timestamp: now - offset * day,
  originalText: 'Why are you ignoring me?',
  rewrittenText: 'I felt anxious when I did not hear back.',
  sent: false,
  paused: true,
}));

const profile: MemoryProfile = {
  topTriggers: [{ label: 'no reply', count: 4, percentage: 80 }],
  topEmotions: [{ label: 'Anxious', count: 5, percentage: 90 }],
  topUrges: [{ label: 'text for reassurance', count: 3, percentage: 60 }],
  copingToolsUsed: [{ label: 'Grounding', count: 3, percentage: 60 }],
  relationshipPatterns: [],
  recentImprovements: [],
  recentCheckInCount: 5,
  averageIntensity: 7,
  intensityTrend: 'rising',
  recentThemes: ['relationship'],
  lastCheckInDate: now,
  weeklyCheckInAvg: 4,
  messageUsage: {
    totalRewrites: 4,
    totalPauses: 3,
    rewriteTypes: {},
    sentAfterRewrite: 1,
    notSentAfterPause: 2,
    pauseSuccessRate: 67,
  },
  copingSuccessRate: 60,
  mostEffectiveCoping: { label: 'Grounding', count: 3, percentage: 60 },
  supportiveSummary: '',
  relationshipPatternSummary: '',
  distressTrendDescription: '',
};

const graphSummary: GraphPatternSummary = {
  topTriggerChains: [
    {
      id: 'chain-1',
      trigger: { id: 'trigger-node', type: 'trigger', label: 'no reply', weight: 4, firstSeen: now - day, lastSeen: now },
      emotions: [{ id: 'emotion-node', type: 'emotion', label: 'anxiety', weight: 4, firstSeen: now - day, lastSeen: now }],
      urges: [],
      copingTools: [{ id: 'coping-node', type: 'coping', label: 'Grounding', weight: 3, firstSeen: now - day, lastSeen: now }],
      averageIntensity: 7,
      occurrences: 4,
      narrative: '',
    },
  ],
  topEmotionClusters: [],
  relationshipPatterns: [
    {
      id: 'rel-chain-1',
      situation: 'late replies',
      emotionalResponse: 'anxiety',
      behavioralUrge: 'text again',
      communicationStyle: 'anxious',
      occurrences: 4,
      narrative: '',
    },
  ],
  mostEffectiveCalming: [
    {
      id: 'calm-1',
      trigger: 'late reply',
      emotion: 'anxiety',
      copingTool: 'Grounding',
      effectivenessScore: 70,
      timesUsed: 3,
      narrative: 'Grounding has helped several times.',
    },
  ],
  growthSignals: [],
  personalizedNarrative: '',
};

function assertNoKnownEnglish(value: unknown, label: string): void {
  const text = JSON.stringify(value);
  const forbidden = [
    'No reply for hours',
    'Anxious / Urgent',
    'Abandonment fears are one of the most powerful',
    'Keep checking in regularly',
    'TIP Skills Practice',
    'This path has the highest regret',
    'Stress levels have been increasing',
    'Grounding Exercise',
    'A pattern you might notice',
    'Morning Check-In',
    'Daily Check-in',
    'Take a moment to check in with yourself',
  ];
  for (const phrase of forbidden) {
    assert(!text.includes(phrase), `${label} should not include English fallback: ${phrase}`);
  }
}

async function run() {
  await i18n.changeLanguage('es');

  const simulator = simulateResponses('My partner has not replied for hours.');
  assertNoKnownEnglish(EXAMPLE_SCENARIOS, 'example scenarios');
  assertNoKnownEnglish(simulator, 'emotional simulator');
  assert.equal(simulator.responses[0].label, 'Ansiosa / urgente');

  const therapyPlan = generateWeeklyPlan(entries, drafts);
  assertNoKnownEnglish(therapyPlan, 'adaptive therapy plan');
  assert(therapyPlan.focusLabel.length > 0, 'Spanish therapy focus is present');

  const messageSimulation = simulateResponsePaths('Why are you ignoring me? You never care!', {
    draft: 'Why are you ignoring me? You never care!',
    situation: 'late reply',
    emotionalState: 'anxious',
    interpretation: 'They do not care',
    urge: 'ask_reassurance',
    desiredOutcome: 'reconnect',
    riskLevel: 'high',
  });
  assertNoKnownEnglish(messageSimulation, 'message simulation');

  const rewriteScore = scoreRewrite('Me siento ansioso/a y quiero entender qué pasó.');
  assertNoKnownEnglish(rewriteScore.feedback, 'rewrite feedback');

  assertNoKnownEnglish(RELATIONSHIP_SIMULATOR_SCENARIOS, 'relationship simulator');

  const storm = detectEmotionalStorm(entries, drafts);
  assertNoKnownEnglish(storm, 'emotional storm');

  const warning = analyzeEarlyWarnings(entries, drafts);
  assertNoKnownEnglish(warning, 'early warning prediction');

  const nudges = buildCommunicationNudges(profile, graphSummary);
  assertNoKnownEnglish(nudges, 'coaching nudges');

  assertNoKnownEnglish(RITUAL_CONFIG, 'ritual config');
  assertNoKnownEnglish(NOTIFICATION_CATEGORIES, 'notification categories');
  assertNoKnownEnglish(getRandomTemplate('daily_checkin'), 'notification template');
}

void run();
