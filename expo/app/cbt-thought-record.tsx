import React from 'react';
import StructuredReflectionTool, { StructuredReflectionStep } from '@/components/StructuredReflectionTool';

const STEPS: StructuredReflectionStep[] = [
  {
    id: 'situation',
    label: 'Situation',
    question: 'What happened?',
    placeholder: 'Describe the situation in one or two sentences...',
  },
  {
    id: 'automaticThought',
    label: 'Automatic thought',
    question: 'What went through your mind?',
    placeholder: 'Example: They hate me. I ruined everything. I’m too much...',
  },
  {
    id: 'emotion',
    label: 'Emotion',
    question: 'What emotion did you feel?',
    placeholder: 'Example: Anxiety, shame, anger, sadness...',
  },
  {
    id: 'emotionIntensity',
    label: 'Intensity',
    question: 'How intense was the emotion?',
    placeholder: 'Choose 1-10',
    kind: 'intensity',
  },
  {
    id: 'evidenceFor',
    label: 'Evidence for',
    question: 'What evidence supports the thought?',
    placeholder: 'List the facts that seem to support it...',
  },
  {
    id: 'evidenceAgainst',
    label: 'Evidence against',
    question: 'What evidence does not support the thought?',
    placeholder: 'List facts, context, or other explanations...',
  },
  {
    id: 'balancedThought',
    label: 'Balanced thought',
    question: 'What is a more balanced thought?',
    placeholder: 'Example: I don’t know what they think yet. I can ask directly when I’m calmer...',
  },
  {
    id: 'newEmotion',
    label: 'New emotion',
    question: 'What emotion do you feel now?',
    placeholder: 'Example: Still anxious, calmer, sad but clearer...',
  },
  {
    id: 'newIntensity',
    label: 'New intensity',
    question: 'How intense does it feel now?',
    placeholder: 'Choose 1-10',
    kind: 'intensity',
  },
];

function buildSummary(responses: Record<string, string>): string {
  return [
    `Situation: ${responses.situation || 'Not recorded'}`,
    `Automatic thought: ${responses.automaticThought || 'Not recorded'}`,
    `Emotion: ${responses.emotion || 'Not recorded'} (${responses.emotionIntensity || '?'}/10)`,
    `Evidence supporting: ${responses.evidenceFor || 'Not recorded'}`,
    `Evidence against: ${responses.evidenceAgainst || 'Not recorded'}`,
    `Balanced thought: ${responses.balancedThought || 'Not recorded'}`,
    `New emotion: ${responses.newEmotion || 'Not recorded'} (${responses.newIntensity || '?'}/10)`,
  ].join('\n');
}

function buildCompanionPrompt(responses: Record<string, string>): string {
  return [
    'Help me complete this CBT Thought Record without making it feel like a worksheet.',
    `Situation: ${responses.situation || 'Not sure yet.'}`,
    `Automatic thought: ${responses.automaticThought || 'Not sure yet.'}`,
    `Emotion: ${responses.emotion || 'Not sure yet.'}`,
    `Evidence for: ${responses.evidenceFor || 'Not sure yet.'}`,
    `Evidence against: ${responses.evidenceAgainst || 'Not sure yet.'}`,
    `Balanced thought: ${responses.balancedThought || 'Not sure yet.'}`,
    'Please help me challenge the thought gently and find a more balanced thought.',
  ].join('\n');
}

export default function CbtThoughtRecordScreen() {
  return (
    <StructuredReflectionTool
      eyebrow="CBT Thought Record"
      title="Challenge the thought"
      subtitle="Use this when a painful thought feels true. Compare the evidence, then build a steadier thought."
      primaryPurpose="Is there another way to understand this?"
      steps={STEPS}
      eventName="cbt_thought_record"
      buildSummary={buildSummary}
      buildCompanionPrompt={buildCompanionPrompt}
    />
  );
}
