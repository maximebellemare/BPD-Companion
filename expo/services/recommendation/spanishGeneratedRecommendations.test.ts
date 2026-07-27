import assert from 'node:assert/strict';
import { i18n } from '@/lib/i18n';
import { JournalEntry, MessageDraft } from '@/types';
import { detectBreakthroughs } from '@/services/insights/breakthroughService';
import { generateCheckInRecommendations } from '@/services/recommendation/copingRecommendationService';
import { candidatesToRecommendations, matchToolsToContext } from '@/services/recommendation/toolMatchingService';
import { UserContextSnapshot } from '@/types/smartRecommendation';

const now = Date.now();

const checkInBase = {
  triggers: [{ id: 't1', label: 'conflicto', category: 'relationship' as const }],
  emotions: [{ id: 'e1', label: 'Anxious', emoji: '', intensity: 8 }],
  urges: [{ id: 'u1', label: 'send message', risk: 'high' as const }],
  bodySensations: [],
  intensityLevel: 8,
  notes: '',
};

const journalEntries: JournalEntry[] = [
  {
    id: 'j1',
    timestamp: now - 60_000,
    checkIn: { id: 'c1', timestamp: now - 60_000, ...checkInBase },
    reflection: 'A long enough reflection to count as meaningful for the breakthrough detector.',
    outcome: 'managed',
  },
];

const messageDrafts: MessageDraft[] = [
  {
    id: 'm1',
    timestamp: now,
    originalText: 'Why are you ignoring me?',
    rewrittenText: 'I felt anxious when I did not hear back.',
    sent: false,
    paused: true,
    outcome: 'helped',
  },
];

const context: UserContextSnapshot = {
  distressLevel: 8,
  latestEmotion: 'overwhelmed',
  latestTrigger: 'late reply',
  latestTriggerCategory: 'relationship',
  emotionalZone: 'activated',
  isRelationshipActivated: true,
  hasHighUrges: true,
  recentCheckInCount: 0,
  recentDraftCount: 2,
  recentPauseCount: 1,
  recentRewriteCount: 1,
  hasMedicationDue: false,
  hasMissedMedication: false,
  hasUpcomingAppointment: false,
  appointmentWithinHours: null,
  recentMovementCount: 0,
  isLateNight: true,
  primaryReasons: [],
  hardestMoments: [],
  preferredTools: [],
  topEmotionsThisWeek: ['Abandoned', 'Ashamed'],
  topTriggersThisWeek: ['late reply'],
  averageDistressThisWeek: 7,
  journalStreakDays: 2,
};

async function run() {
  await i18n.changeLanguage('en');
  const englishCheckIn = generateCheckInRecommendations(8, ['Sad'], [], ['relationship'], [{ label: 'text', risk: 'high' }]);
  const englishToolMatches = candidatesToRecommendations(matchToolsToContext(context));
  const englishBreakthroughs = detectBreakthroughs(journalEntries, messageDrafts);

  await i18n.changeLanguage('es');
  const spanishCheckIn = generateCheckInRecommendations(8, ['Sad'], [], ['relationship'], [{ label: 'text', risk: 'high' }]);
  const spanishToolMatches = candidatesToRecommendations(matchToolsToContext(context));
  const spanishBreakthroughs = detectBreakthroughs(journalEntries, messageDrafts);

  assert(spanishCheckIn.length > 0, 'Spanish check-in recommendations are generated');
  assert(spanishToolMatches.length > 0, 'Spanish smart recommendations are generated');
  assert(spanishBreakthroughs.length > 0, 'Spanish breakthrough moments are generated');

  assert.notEqual(spanishCheckIn[0].title, englishCheckIn[0].title, 'Check-in recommendation title is localized');
  assert.notEqual(spanishCheckIn[0].message, englishCheckIn[0].message, 'Check-in recommendation message is localized');
  assert.notEqual(spanishToolMatches[0].title, englishToolMatches[0].title, 'Smart recommendation title is localized');
  assert.notEqual(spanishToolMatches[0].message, englishToolMatches[0].message, 'Smart recommendation message is localized');
  assert.notEqual(spanishBreakthroughs[0].title, englishBreakthroughs[0].title, 'Breakthrough title is localized');
  assert.notEqual(spanishBreakthroughs[0].description, englishBreakthroughs[0].description, 'Breakthrough description is localized');

  assert.equal(spanishCheckIn[0].id, englishCheckIn[0].id, 'Recommendation IDs remain stable');
  assert.equal(spanishToolMatches[0].toolId, englishToolMatches[0].toolId, 'Tool IDs remain stable');
  assert.equal(spanishBreakthroughs[0].type, englishBreakthroughs[0].type, 'Breakthrough types remain stable');
}

void run();
