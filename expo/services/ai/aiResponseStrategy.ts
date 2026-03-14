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
      "There's a layer underneath what you're describing that might be worth looking at.\n\nThe surface feeling is one thing — but what's the quieter feeling beneath it? The one that's harder to name?",
      "Something about this keeps pulling at you, which usually means it's connected to something that matters deeply.\n\nWhen this feeling shows up, does it feel familiar? Like you've been here before in a different situation?",
      "Your body often knows before your mind does.\n\nRight now, where do you feel this most — chest, stomach, throat, shoulders? That location sometimes tells us whether it's grief, anxiety, or something else.",
      "There's a pattern trying to get your attention here.\n\nIf you look back at the last few times you felt this way, is there a common thread — a type of situation, a specific person, a time of day?",
      "You're asking yourself an important question right now, even if you haven't said it out loud yet.\n\nIf you could separate what you need from what you think you deserve — what would the honest answer be?",
    ],
    quickActions: ['Journal this', 'Show coping tools'],
  },
  clarity: {
    responses: [
      "When everything feels tangled, it helps to pull one thread at a time.\n\nRight now — what's the loudest thing in your mind? Not the most rational, but the one that keeps interrupting everything else.",
      "There are usually three things happening at once: what actually occurred, the story your mind built around it, and the emotion reacting to the story.\n\nLet's start with what actually happened — just the facts, no interpretation yet.",
      "Confusion often means you're feeling two things that seem like they can't both be true. But they usually can.\n\nWhat are the two conflicting feelings? Let's hold them both without choosing sides.",
      "When your mind is spinning, the fastest way to steady it is to find one thing you know for certain — even something small.\n\nWhat's the one thing in this situation that you're sure about?",
      "The fog tends to lift when we stop trying to see the whole picture at once.\n\nPick one piece of this. The part that nags at you most. What would it mean if you could understand just that one part?",
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
      "One concrete step right now: put both feet flat on the floor. Press down. Then pick the smallest action that moves things in the right direction — not the biggest, the smallest.",
      "Here's the framework:\n\nStep 1: What am I feeling?\nStep 2: What do I actually need?\nStep 3: What's the smallest version of that need I can meet right now?\n\nStart with Step 1.",
      "The urge to do something big right now is your nervous system talking. The most useful move is usually the quietest one — the one that creates stability instead of drama.\n\nWhat would a calm version of you do next?",
      "Not everything needs to happen right now. Pick one thing — the one that, if handled, would take the most pressure off the rest.\n\nWhat's that one thing?",
      "The most powerful action you can take right now might be choosing not to act for the next five minutes. Urgency almost always comes from emotion, not from the situation itself.\n\nCan you give yourself that five minutes?",
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
