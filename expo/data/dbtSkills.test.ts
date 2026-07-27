import assert from 'node:assert/strict';
import { i18n } from '@/lib/i18n';
import { DBT_MODULES, DBT_SITUATIONAL_ENTRIES, DBT_SKILLS } from '@/data/dbtSkills';

const EXPECTED_MODULE_IDS = [
  'mindfulness',
  'distress-tolerance',
  'emotional-regulation',
  'interpersonal-effectiveness',
];

const EXPECTED_SITUATIONAL_IDS = [
  'sit-before-texting',
  'sit-after-conflict',
  'sit-feel-rejected',
  'sit-feel-ashamed',
  'sit-overwhelmed',
  'sit-angry',
  'sit-anxious',
  'sit-lonely',
];

const EXPECTED_SKILL_IDS = [
  'mf-wise-mind',
  'mf-observe',
  'mf-one-mindfully',
  'mf-non-judgmental',
  'mf-participate',
  'mf-effectiveness',
  'mf-beginner-mind',
  'dt-tip',
  'dt-stop',
  'dt-self-soothe',
  'dt-pros-cons',
  'dt-radical-acceptance',
  'dt-urge-surfing',
  'dt-improve',
  'dt-ten-minute-pause',
  'dt-temperature-reset',
  'er-opposite-action',
  'er-check-facts',
  'er-abc-please',
  'er-wave',
  'er-name-emotion',
  'er-cope-ahead',
  'er-emotional-exposure',
  'er-build-positives',
  'ie-dear-man',
  'ie-give',
  'ie-fast',
  'ie-validation',
  'ie-boundary-clarity',
  'ie-repair-after-conflict',
  'ie-ask-reassurance',
  'ie-validate-before-respond',
];

async function run() {
  assert.deepEqual(DBT_MODULES.map((module) => module.id), EXPECTED_MODULE_IDS);
  assert.deepEqual(DBT_SITUATIONAL_ENTRIES.map((entry) => entry.id), EXPECTED_SITUATIONAL_IDS);
  assert.deepEqual(DBT_SKILLS.map((skill) => skill.id), EXPECTED_SKILL_IDS);

  await i18n.changeLanguage('en');
  const englishModules = DBT_MODULES.map((module) => ({
    id: module.id,
    title: module.title,
    description: module.description,
  }));
  const englishEntries = DBT_SITUATIONAL_ENTRIES.map((entry) => ({
    id: entry.id,
    label: entry.label,
    sublabel: entry.sublabel,
  }));
  const englishSkills = DBT_SKILLS.map((skill) => ({
    id: skill.id,
    title: skill.title,
    subtitle: skill.subtitle,
    description: skill.description,
    stepCount: skill.steps.length,
    quickStepCount: skill.quickSteps?.length ?? 0,
    whenToUseCount: skill.whenToUse.length,
    stepTitles: skill.steps.map((step) => step.title),
    stepInstructions: skill.steps.map((step) => step.instruction),
    quickStepTitles: skill.quickSteps?.map((step) => step.title) ?? [],
    quickStepInstructions: skill.quickSteps?.map((step) => step.instruction) ?? [],
    whenToUse: [...skill.whenToUse],
  }));

  await i18n.changeLanguage('es');

  for (const module of DBT_MODULES) {
    const english = englishModules.find((item) => item.id === module.id);
    assert(english, `English module snapshot exists for ${module.id}`);
    assert(module.title.trim().length > 0, `${module.id} Spanish title exists`);
    assert(module.description.trim().length > 0, `${module.id} Spanish description exists`);
    assert.notEqual(module.title, english.title, `${module.id} module title is localized`);
    assert.notEqual(module.description, english.description, `${module.id} module description is localized`);
  }

  for (const entry of DBT_SITUATIONAL_ENTRIES) {
    const english = englishEntries.find((item) => item.id === entry.id);
    assert(english, `English situational snapshot exists for ${entry.id}`);
    assert.notEqual(entry.label, english.label, `${entry.id} situational label is localized`);
    assert.notEqual(entry.sublabel, english.sublabel, `${entry.id} situational sublabel is localized`);
  }

  for (const skill of DBT_SKILLS) {
    const english = englishSkills.find((item) => item.id === skill.id);
    assert(english, `English skill snapshot exists for ${skill.id}`);
    assert.equal(skill.steps.length, english.stepCount, `${skill.id} step count unchanged`);
    assert.equal(skill.quickSteps?.length ?? 0, english.quickStepCount, `${skill.id} quick step count unchanged`);
    assert.equal(skill.whenToUse.length, english.whenToUseCount, `${skill.id} when-to-use count unchanged`);
    assert.notEqual(skill.title, english.title, `${skill.id} title is localized`);
    assert.notEqual(skill.subtitle, english.subtitle, `${skill.id} subtitle is localized`);
    assert.notEqual(skill.description, english.description, `${skill.id} description is localized`);

    skill.steps.forEach((step, index) => {
      assert(step.title.trim().length > 0, `${skill.id} step ${index} Spanish title exists`);
      assert(step.instruction.trim().length > 0, `${skill.id} step ${index} Spanish instruction exists`);
      assert.notEqual(step.title, english.stepTitles[index], `${skill.id} step ${index} title is localized`);
      assert.notEqual(step.instruction, english.stepInstructions[index], `${skill.id} step ${index} instruction is localized`);
    });

    skill.quickSteps?.forEach((step, index) => {
      assert.notEqual(step.title, english.quickStepTitles[index], `${skill.id} quick step ${index} title is localized`);
      assert.notEqual(step.instruction, english.quickStepInstructions[index], `${skill.id} quick step ${index} instruction is localized`);
    });

    skill.whenToUse.forEach((item, index) => {
      assert.notEqual(item, english.whenToUse[index], `${skill.id} when-to-use ${index} is localized`);
    });
  }
}

void run();
