import assert from 'node:assert/strict';
import { i18n } from '@/lib/i18n';
import { LESSONS } from '@/data/lessons';

const EXPECTED_LESSON_IDS = [
  'ubpd-1',
  'ubpd-2',
  'ubpd-3',
  'ubpd-4',
  'ubpd-5',
  'ubpd-6',
  'ubpd-7',
  'ubpd-8',
  'ubpd-9',
  'ubpd-10',
  'er-1',
  'er-2',
  'er-3',
  'er-4',
  'er-5',
  'er-6',
  'er-7',
  'er-8',
  'er-9',
  'er-10',
  'rel-1',
  'rel-2',
  'rel-3',
  'rel-4',
  'rel-5',
  'rel-6',
  'rel-7',
  'rel-8',
  'rel-9',
  'rel-10',
  'ta-1',
  'ta-2',
  'ta-3',
  'ta-4',
  'ta-5',
  'ta-6',
  'id-1',
  'id-2',
  'id-3',
  'id-4',
  'id-5',
  'id-6',
  'comm-1',
  'comm-2',
  'comm-3',
  'comm-4',
  'comm-5',
  'cs-1',
  'cs-2',
  'cs-3',
  'ds-1',
  'ds-2',
  'ds-3',
  'th-1',
  'th-2',
  'th-3',
  'th-4',
  'th-5',
  'th-6',
  'th-7',
] as const;

async function run() {
  assert.deepEqual(LESSONS.map((lesson) => lesson.id), EXPECTED_LESSON_IDS);

  await i18n.changeLanguage('en');
  const englishSnapshot = LESSONS.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    sectionIds: lesson.sections.map((section) => section.id),
    sectionTitles: lesson.sections.map((section) => section.title),
    sectionContent: lesson.sections.map((section) => section.content),
  }));

  await i18n.changeLanguage('es');
  for (const lesson of LESSONS) {
    const english = englishSnapshot.find((item) => item.id === lesson.id);
    assert(english, `English snapshot exists for ${lesson.id}`);
    assert.equal(lesson.sections.length, english.sectionIds.length, `${lesson.id} section count unchanged`);
    assert.deepEqual(
      lesson.sections.map((section) => section.id),
      english.sectionIds,
      `${lesson.id} section IDs unchanged`,
    );

    assert(lesson.title.trim().length > 0, `${lesson.id} Spanish title is present`);
    assert(lesson.description.trim().length > 0, `${lesson.id} Spanish description is present`);
    assert.notEqual(lesson.title, english.title, `${lesson.id} title is localized`);
    assert.notEqual(lesson.description, english.description, `${lesson.id} description is localized`);

    lesson.sections.forEach((section, index) => {
      assert(section.title.trim().length > 0, `${lesson.id}.${section.id} Spanish section title is present`);
      assert(section.content.trim().length > 0, `${lesson.id}.${section.id} Spanish section content is present`);
      assert.notEqual(section.title, english.sectionTitles[index], `${lesson.id}.${section.id} title is localized`);
      assert.notEqual(section.content, english.sectionContent[index], `${lesson.id}.${section.id} content is localized`);
    });
  }
}

void run();
