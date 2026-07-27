import assert from 'node:assert/strict';
import { i18n } from '@/lib/i18n';
import { computeProgressSummary } from '@/services/progress/progressService';
import { generateGrowthSignals, generateOpeningReflection } from '@/services/reflection/reflectionGenerator';
import { buildClosingMessage } from '@/services/reflection/reflectionNarrativeBuilder';
import { generateTherapySummary } from '@/services/therapy/therapySummaryService';
import type { JournalEntry, MessageDraft } from '@/types';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const entries: JournalEntry[] = [0, 1, 2, 3, 4].map((offset) => ({
  id: `j-${offset}`,
  timestamp: now - offset * day,
  checkIn: {
    id: `c-${offset}`,
    timestamp: now - offset * day,
    triggers: [{ id: `t-${offset}`, label: 'late reply', category: 'relationship' }],
    emotions: [{ id: `e-${offset}`, label: 'Anxious', emoji: '', intensity: 7 }],
    urges: [],
    bodySensations: [],
    intensityLevel: offset === 0 ? 4 : 7,
    notes: '',
    copingUsed: ['Grounding'],
  },
  reflection: 'I noticed the pattern and chose to pause before reacting.',
  outcome: 'managed',
}));

const drafts: MessageDraft[] = [
  {
    id: 'draft-1',
    timestamp: now,
    originalText: 'Why are you ignoring me?',
    rewrittenText: 'I felt anxious when I did not hear back.',
    sent: false,
    paused: true,
  },
];

async function run() {
  await i18n.changeLanguage('en');
  const englishProgress = computeProgressSummary(entries, drafts);
  const englishGrowth = generateGrowthSignals(entries, drafts);
  const englishOpening = generateOpeningReflection(entries, drafts);
  const englishClosing = buildClosingMessage(entries, {
    improvements: [{ area: 'Lower distress', description: 'Distress is lower.', icon: 'chart' }],
    communicationWins: ['Paused before sending'],
    awarenessGains: ['Named a pattern'],
    narrative: 'Growth is visible.',
  });
  const englishTherapy = generateTherapySummary(entries, drafts, 14);

  await i18n.changeLanguage('es');
  const spanishProgress = computeProgressSummary(entries, drafts);
  const spanishGrowth = generateGrowthSignals(entries, drafts);
  const spanishOpening = generateOpeningReflection(entries, drafts);
  const spanishClosing = buildClosingMessage(entries, {
    improvements: [{ area: 'Menos malestar', description: 'El malestar bajó.', icon: 'chart' }],
    communicationWins: ['Pausa antes de enviar'],
    awarenessGains: ['Nombró un patrón'],
    narrative: 'El crecimiento es visible.',
  });
  const spanishTherapy = generateTherapySummary(entries, drafts, 14);

  assert.notEqual(spanishProgress.milestones[0].label, englishProgress.milestones[0].label, 'Progress milestone label is localized');
  assert.notEqual(spanishProgress.encouragingMessage, englishProgress.encouragingMessage, 'Progress encouragement is localized');
  assert.notEqual(spanishGrowth[0].area, englishGrowth[0].area, 'Growth signal area is localized');
  assert.notEqual(spanishOpening, englishOpening, 'Opening reflection is localized');
  assert.notEqual(spanishClosing, englishClosing, 'Weekly closing message is localized');
  assert.notEqual(
    spanishTherapy.progressHighlights[0].title,
    englishTherapy.progressHighlights[0].title,
    'Therapy highlight title is localized',
  );

  assert.equal(spanishProgress.milestones[0].id, englishProgress.milestones[0].id, 'Progress IDs remain stable');
  assert.equal(
    spanishTherapy.progressHighlights[0].id,
    englishTherapy.progressHighlights[0].id,
    'Therapy highlight IDs remain stable',
  );
}

void run();
