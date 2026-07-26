import React, { useCallback, useMemo } from 'react';
import StructuredReflectionTool, { StructuredReflectionStep } from '@/components/StructuredReflectionTool';
import { useTranslation } from 'react-i18next';

export default function UnderstandTriggerScreen() {
  const { t } = useTranslation('tools');
  const notRecorded = t('structured.notRecorded');
  const notSure = t('structured.notSure');

  const steps = useMemo<StructuredReflectionStep[]>(() => [
    { id: 'whatHappened', label: t('trigger.steps.whatHappened.label'), question: t('trigger.steps.whatHappened.question'), placeholder: t('trigger.steps.whatHappened.placeholder') },
    { id: 'meaning', label: t('trigger.steps.meaning.label'), question: t('trigger.steps.meaning.question'), placeholder: t('trigger.steps.meaning.placeholder') },
    { id: 'fear', label: t('trigger.steps.fear.label'), question: t('trigger.steps.fear.question'), placeholder: t('trigger.steps.fear.placeholder') },
    { id: 'emotion', label: t('trigger.steps.emotion.label'), question: t('trigger.steps.emotion.question'), placeholder: t('trigger.steps.emotion.placeholder') },
    { id: 'intensity', label: t('trigger.steps.intensity.label'), question: t('trigger.steps.intensity.question'), placeholder: t('trigger.steps.intensity.placeholder'), kind: 'intensity' },
    { id: 'urge', label: t('trigger.steps.urge.label'), question: t('trigger.steps.urge.question'), placeholder: t('trigger.steps.urge.placeholder') },
    { id: 'action', label: t('trigger.steps.action.label'), question: t('trigger.steps.action.question'), placeholder: t('trigger.steps.action.placeholder') },
    { id: 'outcome', label: t('trigger.steps.outcome.label'), question: t('trigger.steps.outcome.question'), placeholder: t('trigger.steps.outcome.placeholder') },
  ], [t]);

  const buildSummary = useCallback((responses: Record<string, string>): string => {
    const pattern = responses.whatHappened && responses.fear
      ? t('trigger.summary.patternWithFear', { trigger: responses.whatHappened, fear: responses.fear })
      : t('trigger.summary.patternFallback');
    return [
      t('trigger.summary.trigger', { value: responses.whatHappened || notRecorded }),
      t('trigger.summary.meaning', { value: responses.meaning || notRecorded }),
      t('trigger.summary.fear', { value: responses.fear || notRecorded }),
      t('trigger.summary.emotion', { value: responses.emotion || notRecorded }),
      t('trigger.summary.urge', { value: responses.urge || notRecorded }),
      t('trigger.summary.action', { value: responses.action || notRecorded }),
      t('trigger.summary.outcome', { value: responses.outcome || notRecorded }),
      '',
      t('trigger.summary.possiblePattern', { value: pattern }),
      t('trigger.summary.suggestedNextStep'),
    ].join('\n');
  }, [notRecorded, t]);

  const buildCompanionPrompt = useCallback((responses: Record<string, string>): string => t('trigger.companionPrompt', {
    whatHappened: responses.whatHappened || notSure,
    meaning: responses.meaning || notSure,
    fear: responses.fear || notSure,
    emotion: responses.emotion || notSure,
    urge: responses.urge || notSure,
    action: responses.action || notSure,
    outcome: responses.outcome || notSure,
  }), [notSure, t]);

  return (
    <StructuredReflectionTool
      eyebrow={t('trigger.eyebrow')}
      title={t('trigger.title')}
      subtitle={t('trigger.subtitle')}
      primaryPurpose={t('trigger.purpose')}
      visualIcon="🔍"
      visualTheme="investigation"
      steps={steps}
      eventName="understand_trigger"
      buildSummary={buildSummary}
      buildCompanionPrompt={buildCompanionPrompt}
    />
  );
}
