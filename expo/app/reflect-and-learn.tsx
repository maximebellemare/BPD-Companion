import React from 'react';
import StructuredReflectionTool, { StructuredReflectionStep } from '@/components/StructuredReflectionTool';

const STEPS: StructuredReflectionStep[] = [
  {
    id: 'whatHappened',
    label: 'Event',
    question: 'What happened?',
    placeholder: 'Describe the situation briefly...',
  },
  {
    id: 'learned',
    label: 'Lesson',
    question: 'What did you learn?',
    placeholder: 'Example: I need to pause before asking for reassurance...',
  },
  {
    id: 'different',
    label: 'Next time',
    question: 'What would you do differently next time?',
    placeholder: 'Example: Wait 20 minutes, use Don’t Send It, ask directly...',
  },
  {
    id: 'helped',
    label: 'Helped',
    question: 'What helped?',
    placeholder: 'Example: Breathing, walking away, talking to Companion...',
  },
  {
    id: 'worse',
    label: 'Harder',
    question: 'What made things worse?',
    placeholder: 'Example: Checking my phone repeatedly, sending messages quickly...',
  },
  {
    id: 'mainEmotion',
    label: 'Emotion',
    question: 'What emotion mattered most in this reflection?',
    placeholder: 'Example: Anxiety, shame, anger, sadness...',
  },
  {
    id: 'intensity',
    label: 'Intensity',
    question: 'How intense was it at the peak?',
    placeholder: 'Choose 1-10',
    kind: 'intensity',
  },
];

function buildSummary(responses: Record<string, string>): string {
  return [
    `What happened: ${responses.whatHappened || 'Not recorded'}`,
    `What I learned: ${responses.learned || 'Not recorded'}`,
    `Next time I want to try: ${responses.different || 'Not recorded'}`,
    `What helped: ${responses.helped || 'Not recorded'}`,
    `What made things worse: ${responses.worse || 'Not recorded'}`,
  ].join('\n');
}

function buildCompanionPrompt(responses: Record<string, string>): string {
  return [
    'Help me turn this reflection into one practical lesson.',
    `What happened: ${responses.whatHappened || 'Not sure yet.'}`,
    `What I learned: ${responses.learned || 'Not sure yet.'}`,
    `What I would do differently: ${responses.different || 'Not sure yet.'}`,
    `What helped: ${responses.helped || 'Not sure yet.'}`,
    `What made it worse: ${responses.worse || 'Not sure yet.'}`,
    'Please keep it short and help me choose one next experiment.',
  ].join('\n');
}

export default function ReflectAndLearnScreen() {
  return (
    <StructuredReflectionTool
      eyebrow="Reflect & Learn"
      title="Extract the lesson"
      subtitle="This is for after something happened. Notice what helped, what made it harder, and what you want to try next time."
      primaryPurpose="What can I learn from this?"
      visualIcon="🌱"
      visualTheme="growth"
      steps={STEPS}
      eventName="reflect_and_learn"
      buildSummary={buildSummary}
      buildCompanionPrompt={buildCompanionPrompt}
    />
  );
}
