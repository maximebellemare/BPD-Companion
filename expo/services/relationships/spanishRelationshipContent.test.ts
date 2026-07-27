import assert from 'node:assert/strict';
import { i18n } from '@/lib/i18n';
import { generateCopilotResult } from '@/services/relationships/relationshipCopilotService';
import { analyzeRelationshipPatterns } from '@/services/relationships/relationshipInsightsService';
import { analyzeRelationshipProfile } from '@/services/relationships/relationshipPatternAnalyzer';
import type { JournalEntry, MessageDraft } from '@/types';
import type { RelationshipProfile } from '@/types/relationship';

const now = Date.now();

const draft: MessageDraft = {
  id: 'draft-1',
  timestamp: now,
  originalText: 'My partner ignored me and I feel abandoned',
  rewrittenText: 'I felt anxious when I did not hear back.',
  rewriteType: 'secure',
  sent: false,
  paused: true,
  outcome: 'helped',
  outcomeTimestamp: now,
};

const journalEntry: JournalEntry = {
  id: 'journal-1',
  timestamp: now,
  checkIn: {
    id: 'check-1',
    timestamp: now,
    triggers: [{ id: 'trigger-1', label: 'late reply', category: 'relationship' }],
    emotions: [{ id: 'emotion-1', label: 'Abandoned', emoji: '', intensity: 8 }],
    urges: [],
    bodySensations: [],
    intensityLevel: 8,
    notes: 'Partner late reply',
    copingUsed: ['Grounding'],
  },
  reflection: 'I felt afraid this meant they were leaving.',
  outcome: 'managed',
};

const profile: RelationshipProfile = {
  id: 'profile-1',
  name: 'Alex',
  relationshipType: 'partner',
  createdAt: now,
  updatedAt: now,
  emotionalTriggers: [],
  communicationPatterns: [],
  conflictPatterns: [],
  positiveInteractions: ['Had a calm conversation'],
  notes: '',
};

async function run() {
  await i18n.changeLanguage('en');
  const englishCopilot = generateCopilotResult({
    situation: 'no_reply',
    emotions: ['abandoned'],
    strongestUrge: 'text_again',
    intensity: 8,
    deepestNeed: 'reassurance',
  });
  const englishRelationships = analyzeRelationshipPatterns([draft], [journalEntry]);
  const englishProfile = analyzeRelationshipProfile(profile, [journalEntry], [draft], []);

  await i18n.changeLanguage('es');
  const spanishCopilot = generateCopilotResult({
    situation: 'no_reply',
    emotions: ['abandoned'],
    strongestUrge: 'text_again',
    intensity: 8,
    deepestNeed: 'reassurance',
  });
  const spanishRelationships = analyzeRelationshipPatterns([draft], [journalEntry]);
  const spanishProfile = analyzeRelationshipProfile(profile, [journalEntry], [draft], []);

  assert.notEqual(
    spanishCopilot.interpretation.whatMayBeHappening,
    englishCopilot.interpretation.whatMayBeHappening,
    'Copilot interpretation is localized',
  );
  assert.notEqual(spanishCopilot.nextSteps[0].label, englishCopilot.nextSteps[0].label, 'Copilot step label is localized');
  assert.notEqual(spanishCopilot.secureMessagePrompt, englishCopilot.secureMessagePrompt, 'Secure prompt is localized');
  assert.notEqual(spanishCopilot.affirmation, englishCopilot.affirmation, 'Affirmation is localized');

  assert(spanishRelationships.insights.length > 0, 'Relationship insights are generated');
  assert(spanishRelationships.suggestions.length > 0, 'Relationship suggestions are generated');
  assert.notEqual(spanishRelationships.insights[0].title, englishRelationships.insights[0].title, 'Relationship insight title is localized');
  assert.notEqual(
    spanishRelationships.suggestions[0].description,
    englishRelationships.suggestions[0].description,
    'Relationship suggestion description is localized',
  );

  assert(spanishProfile.insights.length > 0, 'Profile insights are generated');
  assert(spanishProfile.interventions.length > 0, 'Profile interventions are generated');
  assert.notEqual(spanishProfile.insights[0].title, englishProfile.insights[0].title, 'Profile insight title is localized');
  assert.notEqual(
    spanishProfile.interventions[0].actionLabel,
    englishProfile.interventions[0].actionLabel,
    'Profile intervention action is localized',
  );
}

void run();
