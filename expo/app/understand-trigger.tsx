import React from 'react';
import StructuredReflectionTool, { StructuredReflectionStep } from '@/components/StructuredReflectionTool';

const STEPS: StructuredReflectionStep[] = [
  {
    id: 'whatHappened',
    label: 'Trigger',
    question: 'What happened?',
    placeholder: 'Example: They replied with one word after I waited all day...',
  },
  {
    id: 'meaning',
    label: 'Meaning',
    question: 'What did it mean to you in that moment?',
    placeholder: 'Example: It felt like I did something wrong or they were pulling away...',
  },
  {
    id: 'fear',
    label: 'Fear',
    question: 'What were you afraid of?',
    placeholder: 'Example: That they would leave, reject me, or stop caring...',
  },
  {
    id: 'emotion',
    label: 'Emotion',
    question: 'What emotion showed up?',
    placeholder: 'Example: Anxiety, anger, shame, sadness, emptiness...',
  },
  {
    id: 'intensity',
    label: 'Intensity',
    question: 'How intense did it feel?',
    placeholder: 'Choose 1-10',
    kind: 'intensity',
  },
  {
    id: 'urge',
    label: 'Urge',
    question: 'What urge appeared?',
    placeholder: 'Example: Text again, withdraw, argue, apologize, check social media...',
  },
  {
    id: 'action',
    label: 'Action',
    question: 'What did you do?',
    placeholder: 'Example: I sent another text, stayed quiet, distracted myself...',
  },
  {
    id: 'outcome',
    label: 'Outcome',
    question: 'What happened next?',
    placeholder: 'Example: I felt relief for a minute, then more anxious...',
  },
];

function buildSummary(responses: Record<string, string>): string {
  return [
    `Trigger: ${responses.whatHappened || 'Not recorded'}`,
    `Meaning: ${responses.meaning || 'Not recorded'}`,
    `Fear: ${responses.fear || 'Not recorded'}`,
    `Emotion: ${responses.emotion || 'Not recorded'}`,
    `Urge: ${responses.urge || 'Not recorded'}`,
    `Action: ${responses.action || 'Not recorded'}`,
    `Outcome: ${responses.outcome || 'Not recorded'}`,
    '',
    `Possible pattern: ${responses.whatHappened && responses.fear ? `${responses.whatHappened} touched ${responses.fear}.` : 'Keep tracking this to see the pattern more clearly.'}`,
    'Suggested next step: choose one calming or delaying action before reacting further.',
  ].join('\n');
}

function buildCompanionPrompt(responses: Record<string, string>): string {
  return [
    'Help me understand this trigger using the emotional timeline.',
    `What happened: ${responses.whatHappened || 'I am still figuring it out.'}`,
    `What it meant to me: ${responses.meaning || 'Not sure yet.'}`,
    `Fear: ${responses.fear || 'Not sure yet.'}`,
    `Emotion: ${responses.emotion || 'Not sure yet.'}`,
    `Urge: ${responses.urge || 'Not sure yet.'}`,
    `Action: ${responses.action || 'Not sure yet.'}`,
    `Outcome: ${responses.outcome || 'Not sure yet.'}`,
    'Please summarize the possible fear, possible pattern, and one next step.',
  ].join('\n');
}

export default function UnderstandTriggerScreen() {
  return (
    <StructuredReflectionTool
      eyebrow="Understand the Trigger"
      title="Uncover the emotional chain"
      subtitle="Slow the moment down: trigger → meaning → fear → urge. This is for understanding what happened emotionally."
      primaryPurpose="What did this moment touch in me?"
      visualIcon="🔍"
      visualTheme="investigation"
      steps={STEPS}
      eventName="understand_trigger"
      buildSummary={buildSummary}
      buildCompanionPrompt={buildCompanionPrompt}
    />
  );
}
