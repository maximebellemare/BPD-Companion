import { AIMode } from '@/types/aiModes';
import { MemoryProfile } from '@/types/memory';
import { getModeConfig } from './aiModeService';

export interface ModeResponseTemplate {
  responses: string[];
  quickActions: string[];
}

const MODE_RESPONSES: Record<AIMode, ModeResponseTemplate> = {
  calm: {
    responses: [
      "Let's slow everything down right now.\n\nPlace one hand on your chest. Feel it rise and fall.\n\nYou're here. You're breathing. That's all that matters in this moment.",
      "I'm right here with you. Nothing needs to be solved right now.\n\nTry this: breathe in for 4... hold for 4... out for 6.\n\nLet's do that together before anything else.",
      "Let's make this very simple.\n\nFeel your feet on the ground. Press them down gently.\n\nOne breath in... and one breath out.\n\nYou're doing this. I'm not going anywhere.",
      "Everything can wait for a moment.\n\nClose your eyes if you can. Take three slow breaths.\n\nWhen you're ready, we can talk about what's happening. No rush.",
      "You reached out — that's the right move.\n\nRight now, just notice one thing you can see. One thing you can hear.\n\nLet your senses bring you back to the present. I'm here.",
    ],
    quickActions: ['Ground me', 'Safety mode'],
  },
  reflection: {
    responses: [
      "That's something worth sitting with for a moment.\n\nWhat do you think is underneath that feeling? Sometimes the surface emotion is pointing to something deeper.",
      "I appreciate you wanting to look at this more closely. That kind of self-awareness takes courage.\n\nIf you could describe what you're feeling using a weather metaphor — is it a storm, fog, or something else?",
      "Let's explore that together.\n\nWhen you notice this feeling, where does it show up in your body? Sometimes the body holds clues that the mind hasn't named yet.",
      "There's something important in what you're describing.\n\nWhat pattern, if any, do you notice around when this feeling tends to show up? Is there a situation or a time that seems connected?",
      "Thank you for being willing to look at this.\n\nWhat do you think you need right now — not what you think you should need, but what you actually need?",
    ],
    quickActions: ['Journal this', 'Show coping tools'],
  },
  clarity: {
    responses: [
      "It sounds like there's a lot happening at once. Let's sort through it.\n\nIf you had to name the one thing that feels most urgent right now, what would it be?",
      "When everything feels tangled, it helps to separate the pieces.\n\nLet's try this: what are you feeling, and what are you thinking? Those are often different things, and untangling them can bring more clarity.",
      "That confusion makes sense — it usually means multiple emotions are happening at the same time.\n\nLet's start with what you know for sure, even if it's small. What's one thing you're certain about in this situation?",
      "Let me help you organize what's happening.\n\nThere's what happened, what your mind is telling you it means, and what you're feeling about it. Which of those would be most helpful to look at first?",
      "Sometimes clarity comes from narrowing focus.\n\nOf everything that's going on right now, what's the piece that, if you could understand it, would bring the most relief?",
    ],
    quickActions: ['Journal this', 'Slow this down'],
  },
  relationship: {
    responses: [
      "Relationship moments can feel so loaded. Let's slow this down before any decisions are made.\n\nWhat happened, and what is your mind telling you it means? Those are often two different things.",
      "When we care about someone, the stakes feel enormous. That intensity is real.\n\nBefore we think about what to say or do — what do you actually need from this person right now? The real need underneath the urgency.",
      "I hear how activated you are about this. That makes sense.\n\nLet's separate the facts from the fear. What actually happened versus what your mind is predicting will happen?",
      "Communication when emotions are high can change the whole direction of a situation.\n\nWould it help to think about what you want to express, and then find words that honor your feelings while keeping the door open?",
      "That's a lot of relationship pressure. Let's protect both you and the connection.\n\nWhat tone do you want this interaction to have? Sometimes choosing the tone first helps the words follow.",
    ],
    quickActions: ['Help me rewrite a message', 'Slow this down', 'Journal this'],
  },
  action: {
    responses: [
      "Here's one clear next step you can take right now:\n\nPause for 60 seconds before doing anything else. Then choose the smallest, safest action that moves you in the right direction.",
      "Let's make this practical.\n\nStep 1: Take a breath.\nStep 2: Name what you need most right now.\nStep 3: Do the smallest version of that.\n\nWhat's your Step 2?",
      "You want something actionable — I respect that.\n\nThe most helpful thing right now is probably the thing that feels least urgent but most stabilizing. What would that be for you?",
      "Here's what I'd suggest:\n\nDon't try to solve everything at once. Pick the one thing that, if handled, would make the rest feel more manageable.\n\nWhat is that one thing?",
      "Sometimes the best action is a non-action: choosing not to react for a set amount of time.\n\nWould a 5-minute pause before your next move feel manageable? That small gap can change everything.",
    ],
    quickActions: ['Ground me', 'Show coping tools', 'Help me rewrite a message'],
  },
  high_distress: {
    responses: [
      "I'm here.\n\nOne breath. In through your nose. Out through your mouth.\n\nThat's the only thing right now.",
      "You don't have to do anything right now.\n\nFeel your feet on the floor.\n\nI'm right here with you.",
      "Just breathe.\n\nIn... and out.\n\nNothing else matters in this moment. You're safe here.",
      "I hear you.\n\nOne step at a time.\n\nFirst step: place your hand on your chest. Feel it rise and fall.\n\nThat's all.",
      "You reached out. That matters.\n\nRight now, just be here. One breath.\n\nI'm not going anywhere.",
    ],
    quickActions: ['Ground me', 'Safety mode'],
  },
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getModeResponse(mode: AIMode): { content: string; quickActions: string[] } {
  const template = MODE_RESPONSES[mode];
  return {
    content: pickRandom(template.responses),
    quickActions: template.quickActions,
  };
}

export function personalizeForMode(
  content: string,
  mode: AIMode,
  memoryProfile?: MemoryProfile,
): string {
  if (!memoryProfile) return content;

  const config = getModeConfig(mode);
  const additions: string[] = [];

  if (mode === 'calm' || mode === 'high_distress') {
    if (memoryProfile.mostEffectiveCoping) {
      additions.push(`\n\n"${memoryProfile.mostEffectiveCoping.label}" has helped you before — would you like to try that?`);
    }
  }

  if (mode === 'reflection') {
    if (memoryProfile.topTriggers.length > 0 && memoryProfile.topEmotions.length > 0) {
      additions.push(`\n\nI've noticed "${memoryProfile.topTriggers[0].label}" often appears alongside "${memoryProfile.topEmotions[0].label}" in your patterns. Does that connect to what you're feeling now?`);
    }
    if (memoryProfile.intensityTrend === 'falling') {
      additions.push('\n\nYour overall distress has been trending down lately — that\'s something worth acknowledging.');
    }
  }

  if (mode === 'relationship') {
    if (memoryProfile.messageUsage.totalRewrites > 2) {
      additions.push('\n\nYou\'ve been using message support wisely — that awareness is a real strength.');
    }
    if (memoryProfile.messageUsage.totalPauses > 1) {
      additions.push('\n\nPausing before sending has worked well for you before. That instinct is getting stronger.');
    }
  }

  if (mode === 'clarity') {
    if (memoryProfile.topEmotions.length >= 2) {
      const top2 = memoryProfile.topEmotions.slice(0, 2).map(e => e.label).join(' and ');
      additions.push(`\n\nYour most frequent emotions lately have been ${top2}. Does either of those feel present right now?`);
    }
  }

  if (mode === 'action') {
    if (memoryProfile.mostEffectiveCoping) {
      additions.push(`\n\nOne proven action for you: "${memoryProfile.mostEffectiveCoping.label}" — it tends to help when things feel intense.`);
    }
  }

  if (config.responseStyle.maxLength === 'short' && additions.length > 0) {
    return content + additions[0];
  }

  if (additions.length > 0) {
    return content + additions.slice(0, 2).join('');
  }

  return content;
}

export function buildModeSystemPrompt(mode: AIMode): string {
  const config = getModeConfig(mode);
  const style = config.responseStyle;

  const lengthGuidance = style.maxLength === 'short'
    ? 'Keep responses brief — 2-4 sentences max. Be concise and warm.'
    : style.maxLength === 'medium'
      ? 'Keep responses moderate length. Be thorough but not overwhelming.'
      : 'Responses can be longer when needed for exploration.';

  const questionGuidance = style.askQuestions
    ? `Ask at most ${style.maxQuestions} gentle question to guide reflection.`
    : 'Do not ask questions. Provide direct support.';

  const groundingGuidance = style.groundingFirst
    ? 'Always lead with grounding — a breath, a sensory anchor, or a simple physical step.'
    : '';

  const actionGuidance = style.suggestActions
    ? 'End with a clear, practical suggestion or next step.'
    : '';

  return [
    `Current support mode: ${config.label}`,
    `Tone: ${style.tone}`,
    `Priority: ${style.priority}`,
    lengthGuidance,
    questionGuidance,
    groundingGuidance,
    actionGuidance,
  ].filter(Boolean).join('\n');
}
