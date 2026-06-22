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
      "🧭 Let’s slow this down.\n\nThis feels loud in your body right now, so the first goal is steadiness, not analysis. Put one hand on your chest and notice one slow breath.\n\nDo you want to steady the moment, or tell me what happened?",
      "Your system is asking for relief before answers.\n\nBreathe in for 4, hold for 2, breathe out for 6. Let the exhale give the urgency somewhere to go.\n\nWhat feels strongest in your body right now?",
      "This is a body-first moment.\n\nPress both feet into the floor and name one thing you can see. Then we can look at the story your mind is telling.\n\nIs this more fear, anger, shame, or overwhelm?",
    ],
    quickActions: ['Ground me', 'Safety mode'],
  },
  reflection: {
    responses: [
      "Let’s start with what happened.\n\nThe clearest first step is usually naming the event before trying to understand the pattern.\n\nWhat happened right before this feeling started?",
      "I want to keep this concrete.\n\nPick the part you can answer quickly: when did this start, who was involved, or what did you do next?",
      "We do not need the deep answer yet.\n\nFirst, name the strongest emotion if you can.\n\nDoes this feel more like anxiety, anger, sadness, shame, numbness, or rejection?",
    ],
    quickActions: ['Journal this', 'Show coping tools'],
  },
  clarity: {
    responses: [
      "Everything feels tangled, and that makes it hard to trust your read of the situation.\n\nLet’s find the first knot: what happened, what your mind says it means, or what you feel pulled to do.\n\nWhich one feels most charged?",
      "The confusion itself can become stressful.\n\nWhen two feelings are both true, the mind can treat that like a problem to solve. It may just be a real contradiction to hold gently.\n\nWhat are the two feelings that both seem true?",
      "You need one stable point in the middle of the fog.\n\nFind one thing you know for sure, even if it is small. Build from there.\n\nWhat is one fact you can name without guessing?",
    ],
    quickActions: ['Journal this', 'Slow this down'],
  },
  relationship: {
    responses: [
      "Before reacting, let’s start with facts.\n\nWas it a delay, a tone change, a short reply, no reply, or something they said?",
      "💙 The urgency makes sense because this person matters to you.\n\nProtect the connection by waiting until your message sounds like your need, not your panic.\n\nWhat do you actually want them to understand?",
      "Part of you wants relief now, and another part probably wants to avoid making it worse.\n\nStart with the next action, not the whole relationship.\n\nDo you feel pulled to text, argue, withdraw, apologize, or ask for reassurance?",
    ],
    quickActions: ['Help me rewrite a message', 'Slow this down', 'Journal this'],
  },
  action: {
    responses: [
      "You need something concrete, not a long analysis.\n\nStart with the action in front of you.\n\nWhat do you feel pulled to do right now?",
      "⚠️ The urge is pushing for a big action.\n\nBig actions can feel relieving for a few minutes and painful afterward. Choose the quiet action that makes tomorrow easier.\n\nWhat action would you be glad you waited on?",
      "You are trying to decide while activated.\n\nDelay the decision by five minutes. That is not avoidance; it is giving your wiser self a chance to catch up.\n\nWhat decision can safely wait?",
    ],
    quickActions: ['Ground me', 'Show coping tools', 'Help me rewrite a message'],
  },
  high_distress: {
    responses: [
      "🧭 Let’s make this smaller.\n\nIn through your nose. Out through your mouth. Nothing else has to happen yet.\n\nDo you want to steady the moment, or tell me what happened?",
      "Put both feet on the floor.\n\nPress down gently. Stay with that pressure for ten seconds, just enough to remind your body where you are.\n\nWhat number is the intensity right now, 1 to 10?",
      "This is a body-first moment.\n\nLong exhale. Drop your shoulders. Let the next decision wait.\n\nIs the strongest urge to text, withdraw, argue, or shut down?",
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
      additions.push(`\n\n${memoryProfile.mostEffectiveCoping.label} has helped before. That might be the gentlest next move here.`);
    }
  }

  if (mode === 'reflection') {
    if (memoryProfile.topTriggers.length > 0 && memoryProfile.topEmotions.length > 0) {
      additions.push(`\n\nThis sounds close to a pattern you've logged before: ${memoryProfile.topTriggers[0].label} showing up near ${memoryProfile.topEmotions[0].label}.`);
    }
    if (memoryProfile.intensityTrend === 'falling') {
      additions.push('\n\nYour recent intensity has been trending down. That does not erase this moment, but it is evidence that things can shift.');
    }
  }

  if (mode === 'relationship') {
    if (memoryProfile.messageUsage.totalRewrites > 2) {
      additions.push('\n\nYou have used message support before, which tells me part of you already knows pausing can protect the connection.');
    }
    if (memoryProfile.messageUsage.totalPauses > 1) {
      additions.push('\n\nPausing before sending has helped before. This may be another moment where waiting protects what you actually want.');
    }
  }

  if (mode === 'clarity') {
    if (memoryProfile.topEmotions.length >= 2) {
      const top2 = memoryProfile.topEmotions.slice(0, 2).map(e => e.label).join(' and ');
      additions.push(`\n\nLately, ${top2} have shown up often in your entries. One of them may be coloring how this situation feels.`);
    }
  }

  if (mode === 'action') {
    if (memoryProfile.mostEffectiveCoping) {
      additions.push(`\n\nA familiar stabilizer for you is ${memoryProfile.mostEffectiveCoping.label}. Use that before choosing the next move.`);
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
