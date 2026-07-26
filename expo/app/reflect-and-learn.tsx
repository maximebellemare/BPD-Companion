import React, { useCallback, useMemo } from 'react';
import StructuredReflectionTool, { StructuredReflectionStep } from '@/components/StructuredReflectionTool';
import { useTranslation } from 'react-i18next';

export default function ReflectAndLearnScreen() {
  const { t } = useTranslation('tools');
  const notRecorded = t('structured.notRecorded');
  const notSure = t('structured.notSure');

  const steps = useMemo<StructuredReflectionStep[]>(() => [
    {
      id: 'whatHappened',
      label: t('reflect.steps.event.label'),
      question: t('reflect.steps.event.question'),
      placeholder: t('reflect.steps.event.placeholder'),
    },
    {
      id: 'learned',
      label: t('reflect.steps.lesson.label'),
      question: t('reflect.steps.lesson.question'),
      placeholder: t('reflect.steps.lesson.placeholder'),
    },
    {
      id: 'different',
      label: t('reflect.steps.different.label'),
      question: t('reflect.steps.different.question'),
      placeholder: t('reflect.steps.different.placeholder'),
    },
    {
      id: 'helped',
      label: t('reflect.steps.helped.label'),
      question: t('reflect.steps.helped.question'),
      placeholder: t('reflect.steps.helped.placeholder'),
    },
    {
      id: 'worse',
      label: t('reflect.steps.worse.label'),
      question: t('reflect.steps.worse.question'),
      placeholder: t('reflect.steps.worse.placeholder'),
    },
    {
      id: 'mainEmotion',
      label: t('reflect.steps.emotion.label'),
      question: t('reflect.steps.emotion.question'),
      placeholder: t('reflect.steps.emotion.placeholder'),
    },
    {
      id: 'intensity',
      label: t('reflect.steps.intensity.label'),
      question: t('reflect.steps.intensity.question'),
      placeholder: t('reflect.steps.intensity.placeholder'),
      kind: 'intensity',
    },
  ], [t]);

  const buildSummary = useCallback((responses: Record<string, string>): string => [
    t('reflect.summary.whatHappened', { value: responses.whatHappened || notRecorded }),
    t('reflect.summary.learned', { value: responses.learned || notRecorded }),
    t('reflect.summary.different', { value: responses.different || notRecorded }),
    t('reflect.summary.helped', { value: responses.helped || notRecorded }),
    t('reflect.summary.worse', { value: responses.worse || notRecorded }),
  ].join('\n'), [notRecorded, t]);

  const buildCompanionPrompt = useCallback((responses: Record<string, string>): string => t('reflect.companionPrompt', {
    whatHappened: responses.whatHappened || notSure,
    learned: responses.learned || notSure,
    different: responses.different || notSure,
    helped: responses.helped || notSure,
    worse: responses.worse || notSure,
  }), [notSure, t]);

  return (
    <StructuredReflectionTool
      eyebrow={t('reflect.eyebrow')}
      title={t('reflect.title')}
      subtitle={t('reflect.subtitle')}
      primaryPurpose={t('reflect.purpose')}
      visualIcon="🌱"
      visualTheme="growth"
      steps={steps}
      eventName="reflect_and_learn"
      buildSummary={buildSummary}
      buildCompanionPrompt={buildCompanionPrompt}
    />
  );
}
