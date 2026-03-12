import { GroundingPrompt, MessageDelayOption, CrisisModePhase } from '@/types/crisis';

export const GROUNDING_PROMPTS: GroundingPrompt[] = [
  {
    id: 'g1',
    instruction: 'Name 5 things you can see right now',
    sense: 'sight',
    icon: 'Eye',
  },
  {
    id: 'g2',
    instruction: 'Name 4 things you can touch or feel',
    sense: 'touch',
    icon: 'Hand',
  },
  {
    id: 'g3',
    instruction: 'Name 3 things you can hear',
    sense: 'sound',
    icon: 'Ear',
  },
  {
    id: 'g4',
    instruction: 'Name 2 things you can smell',
    sense: 'smell',
    icon: 'Flower2',
  },
  {
    id: 'g5',
    instruction: 'Name 1 thing you can taste',
    sense: 'taste',
    icon: 'Coffee',
  },
];

export const MESSAGE_DELAY_OPTIONS: MessageDelayOption[] = [
  { id: 'delay_2', label: '2 minutes', minutes: 2 },
  { id: 'delay_5', label: '5 minutes', minutes: 5 },
  { id: 'delay_10', label: '10 minutes', minutes: 10 },
];

export const CRISIS_PHASES: { phase: CrisisModePhase; label: string; description: string }[] = [
  {
    phase: 'breathing',
    label: 'Breathe',
    description: 'Slow breathing to calm your nervous system',
  },
  {
    phase: 'grounding',
    label: 'Ground',
    description: 'Reconnect with the present moment',
  },
  {
    phase: 'ai_calm',
    label: 'Support',
    description: 'Simple, short guidance',
  },
  {
    phase: 'message_delay',
    label: 'Pause',
    description: 'Delay sending messages',
  },
  {
    phase: 'contact_safe',
    label: 'Reach Out',
    description: 'Contact someone safe',
  },
];

export const AI_CALM_RESPONSES: string[] = [
  "You're safe right now. Let's take this one moment at a time.",
  "This feeling is intense, but it will pass. You've made it through before.",
  "Right now, nothing needs to be decided. Just breathe.",
  "You don't have to respond to anything right now. This moment is just for you.",
  "Your feelings are valid. Let's just slow down together.",
  "One breath at a time. That's all you need to do right now.",
  "It's okay to feel overwhelmed. You're already doing something brave by being here.",
  "Nothing urgent needs your attention right now. Just be here.",
];

export function getCalmnessResponse(index: number): string {
  return AI_CALM_RESPONSES[index % AI_CALM_RESPONSES.length];
}

export function getNextPhase(current: CrisisModePhase): CrisisModePhase | null {
  const order: CrisisModePhase[] = ['breathing', 'grounding', 'ai_calm', 'message_delay', 'contact_safe'];
  const idx = order.indexOf(current);
  if (idx < order.length - 1) return order[idx + 1];
  return null;
}

export function getPreviousPhase(current: CrisisModePhase): CrisisModePhase | null {
  const order: CrisisModePhase[] = ['breathing', 'grounding', 'ai_calm', 'message_delay', 'contact_safe'];
  const idx = order.indexOf(current);
  if (idx > 0) return order[idx - 1];
  return null;
}
