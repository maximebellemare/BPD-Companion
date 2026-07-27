import assert from 'node:assert/strict';
import { DAILY_INSIGHTS_LIBRARY } from '@/data/learn/insightsLibrary';
import { i18n } from '@/lib/i18n';

async function run() {
  await i18n.changeLanguage('en');
  const englishSnapshot = DAILY_INSIGHTS_LIBRARY.map((insight) => ({
    id: insight.id,
    title: insight.title,
    explanation: insight.explanation,
    scenario: insight.scenario,
    suggestedToolId: insight.suggestedToolId,
    suggestedToolLabel: insight.suggestedToolLabel,
    relatedPatternTags: [...insight.relatedPatternTags],
    relatedLessonIds: [...insight.relatedLessonIds],
  }));

  assert.equal(englishSnapshot.length, 110, 'All production insights are present');

  await i18n.changeLanguage('es');

  assert.deepEqual(
    DAILY_INSIGHTS_LIBRARY.map((insight) => insight.id),
    englishSnapshot.map((insight) => insight.id),
    'Insight IDs and ordering are unchanged',
  );

  for (const insight of DAILY_INSIGHTS_LIBRARY) {
    const english = englishSnapshot.find((item) => item.id === insight.id);
    assert(english, `English snapshot exists for ${insight.id}`);
    assert.equal(insight.suggestedToolId, english.suggestedToolId, `${insight.id} tool ID is stable`);
    assert.deepEqual(insight.relatedPatternTags, english.relatedPatternTags, `${insight.id} tags are stable`);
    assert.deepEqual(insight.relatedLessonIds, english.relatedLessonIds, `${insight.id} lesson IDs are stable`);

    assert(insight.title.trim().length > 0, `${insight.id} Spanish title is present`);
    assert(insight.explanation.trim().length > 0, `${insight.id} Spanish explanation is present`);
    assert(insight.scenario.trim().length > 0, `${insight.id} Spanish scenario is present`);
    assert(insight.suggestedToolLabel.trim().length > 0, `${insight.id} Spanish tool label is present`);

    assert.notEqual(insight.title, english.title, `${insight.id} title is localized`);
    assert.notEqual(insight.explanation, english.explanation, `${insight.id} explanation is localized`);
    assert.notEqual(insight.scenario, english.scenario, `${insight.id} scenario is localized`);
    assert.notEqual(insight.suggestedToolLabel, english.suggestedToolLabel, `${insight.id} tool label is localized`);
  }
}

void run();
