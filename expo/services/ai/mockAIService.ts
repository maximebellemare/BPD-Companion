import { AIServiceResponse } from '@/types/ai';
import { AIMode } from '@/types/aiModes';
import {
  EmotionalIntent,
  RESPONSE_TEMPLATES,
  HIGH_DISTRESS_KEYWORDS,
  FOLLOW_UP_RESPONSES,
} from './aiResponseTemplates';
import { detectAIMode } from './aiModeService';
import { getModeResponse, personalizeForMode } from './aiResponseStrategy';
import { MemoryProfile } from '@/types/memory';
import { MemorySnapshot } from '@/types/userMemory';
import { getMemoryBasedSuggestion } from '@/services/memory/userMemoryService';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectHighDistress(message: string): boolean {
  const lower = message.toLowerCase();
  return HIGH_DISTRESS_KEYWORDS.some(keyword => lower.includes(keyword));
}

function detectIntent(message: string): EmotionalIntent {
  const lower = message.toLowerCase();

  if (detectHighDistress(message)) {
    return 'high_distress';
  }

  if (lower.includes('abandon') || lower.includes('left me') || lower.includes('leaving me') || lower.includes('no one cares') || lower.includes('don\'t care about me')) {
    return 'abandoned';
  }
  if (lower.includes('angry') || lower.includes('rage') || lower.includes('furious') || lower.includes('pissed') || lower.includes('hate them') || lower.includes('so mad')) {
    return 'angry';
  }
  if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('worry') || lower.includes('panic') || lower.includes('dread') || lower.includes('scared')) {
    return 'anxious';
  }
  if (lower.includes('ashamed') || lower.includes('shame') || lower.includes('embarrass') || lower.includes('pathetic') || lower.includes('worthless') || lower.includes('disgusted with myself')) {
    return 'ashamed';
  }
  if (lower.includes('confused') || lower.includes('don\'t know what i feel') || lower.includes('can\'t tell') || lower.includes('overreacting') || lower.includes('what am i feeling') || lower.includes('mixed up')) {
    return 'confused';
  }
  if (lower.includes('calm') || lower.includes('overwhelm') || lower.includes('slow down') || lower.includes('breathe') || lower.includes('spiraling') || lower.includes('too much')) {
    return 'calming';
  }
  if (lower.includes('rewrite') || lower.includes('help me text') || lower.includes('what should i say') || lower.includes('send this') || lower.includes('draft a message') || lower.includes('reply to')) {
    return 'rewrite';
  }
  if (lower.includes('trigger') || lower.includes('relationship') || lower.includes('partner') || lower.includes('friend') || lower.includes('fight') || lower.includes('conflict') || lower.includes('boyfriend') || lower.includes('girlfriend')) {
    return 'relationship';
  }
  if (lower.includes('pattern') || lower.includes('notice') || lower.includes('keep doing') || lower.includes('cycle') || lower.includes('always do this')) {
    return 'pattern';
  }
  if (lower.includes('feeling') || lower.includes('what i\'m') || lower.includes('understand') || lower.includes('what is this')) {
    return 'confused';
  }
  if (lower.includes('message') || lower.includes('text') || lower.includes('send') || lower.includes('reply')) {
    return 'rewrite';
  }
  if (lower.includes('not calm') || lower.includes('stressed') || lower.includes('tense') || lower.includes('on edge')) {
    return 'calming';
  }

  return 'general';
}

function detectConversationContext(
  messageHistory: Array<{ role: string; content: string }>,
  currentMessage: string,
): string | null {
  if (messageHistory.length < 2) return null;

  const lastAssistant = [...messageHistory].reverse().find(m => m.role === 'assistant');
  if (!lastAssistant) return null;

  const lower = currentMessage.toLowerCase();
  if (lower.includes('yes') || lower.includes('okay') || lower.includes('yeah') || lower.includes('sure') || lower.includes('please')) {
    if (lastAssistant.content.includes('ground') || lastAssistant.content.includes('breath')) {
      return 'after_grounding';
    }
    return 'after_venting';
  }

  if (currentMessage.length > 150) {
    return 'after_venting';
  }

  return null;
}

export interface MemoryPersonalization {
  topTrigger?: string;
  topEmotion?: string;
  topUrge?: string;
  mostEffectiveCoping?: string;
  intensityTrend?: string;
  messageRewriteFrequent?: boolean;
  pauseFrequent?: boolean;
  averageIntensity?: number;
}

export interface MockResponseOptions {
  contextSummary?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  personalization?: MemoryPersonalization;
  activeMode?: AIMode;
  memoryProfile?: MemoryProfile;
  memorySnapshot?: MemorySnapshot;
}

function personalizeResponse(
  content: string,
  intent: EmotionalIntent,
  personalization?: MemoryPersonalization,
): string {
  if (!personalization) return content;

  const additions: string[] = [];

  if (intent === 'calming' || intent === 'high_distress') {
    if (personalization.mostEffectiveCoping) {
      additions.push(`\n\nI know "${personalization.mostEffectiveCoping}" has helped you before \u2014 would you like to try that now?`);
    }
  }

  if (intent === 'relationship' || intent === 'abandoned') {
    if (personalization.topTrigger) {
      const triggerLower = personalization.topTrigger.toLowerCase();
      if (triggerLower.includes('abandon') || triggerLower.includes('reject') || triggerLower.includes('ignor')) {
        additions.push('\n\nI\'ve noticed this kind of trigger has come up for you before. You\'re not imagining it \u2014 this is a real pattern, and it makes sense why it hurts.');
      }
    }
    if (personalization.messageRewriteFrequent) {
      additions.push('\n\nWould it help to rewrite what you want to say first? That\'s worked for you before.');
    }
  }

  if (intent === 'rewrite') {
    if (personalization.pauseFrequent) {
      additions.push('\n\nYou\'ve been getting better at pausing before sending \u2014 that awareness is a real strength.');
    }
  }

  if (intent === 'pattern') {
    if (personalization.topTrigger && personalization.topEmotion) {
      additions.push(`\n\nFrom what I've seen, "${personalization.topTrigger}" seems to be your most common trigger, and it often brings up "${personalization.topEmotion}." Does that match how you're feeling now?`);
    }
    if (personalization.intensityTrend === 'falling') {
      additions.push('\n\nYour overall intensity has been trending downward lately \u2014 that\'s progress worth noticing.');
    }
  }

  if (intent === 'anxious' && personalization.averageIntensity && personalization.averageIntensity >= 6) {
    if (personalization.mostEffectiveCoping) {
      additions.push(`\n\nYour intensity has been on the higher side recently. "${personalization.mostEffectiveCoping}" might help bring it down \u2014 it's worked for you before.`);
    }
  }

  if (additions.length > 0) {
    return content + additions[0];
  }

  return content;
}

export async function generateMockResponse(
  userMessage: string,
  _contextSummary?: string,
  options?: MockResponseOptions,
): Promise<AIServiceResponse & { intent: EmotionalIntent; quickActions: string[]; activeMode: AIMode }> {
  const delay = detectHighDistress(userMessage) ? 800 + Math.random() * 600 : 1200 + Math.random() * 1500;
  await new Promise(resolve => setTimeout(resolve, delay));

  const history = options?.conversationHistory ?? [];
  const contextType = detectConversationContext(history, userMessage);

  const modeDetection = detectAIMode({
    messageContent: userMessage,
    conversationHistory: history,
    averageIntensity: options?.personalization?.averageIntensity,
    relationshipSignals: options?.personalization?.topTrigger?.toLowerCase().includes('relationship'),
  });

  const activeMode = options?.activeMode ?? modeDetection.mode;

  let content: string;
  let intent: EmotionalIntent;
  let quickActions: string[];

  if (contextType && FOLLOW_UP_RESPONSES[contextType]) {
    content = pickRandom(FOLLOW_UP_RESPONSES[contextType]);
    intent = 'general';
    quickActions = RESPONSE_TEMPLATES.general.quickActions ?? [];
  } else {
    const modeResponse = getModeResponse(activeMode);
    intent = detectIntent(userMessage);

    const useModePrimary = options?.activeMode != null || modeDetection.confidence >= 0.6;

    if (useModePrimary) {
      content = modeResponse.content;
      quickActions = modeResponse.quickActions;
      content = personalizeForMode(content, activeMode, options?.memoryProfile);
    } else {
      const template = RESPONSE_TEMPLATES[intent];
      content = pickRandom(template.responses);
      quickActions = template.quickActions ?? [];
      content = personalizeResponse(content, intent, options?.personalization);
    }
  }

  if (options?.memorySnapshot) {
    const memorySuggestion = getMemoryBasedSuggestion(
      options.memorySnapshot,
      options.personalization?.topTrigger,
      options.personalization?.topEmotion,
    );
    if (memorySuggestion && !content.includes('remember') && !content.includes('noticed')) {
      content = content + '\n\n' + memorySuggestion;
    }
  }

  console.log('[MockAI] Detected intent:', intent, 'mode:', activeMode, 'context:', contextType, 'personalized:', !!options?.personalization, 'hasMemory:', !!options?.memorySnapshot);

  return {
    content,
    timestamp: Date.now(),
    intent,
    quickActions,
    activeMode,
  };
}

export function generateConversationTitle(firstMessage: string): string {
  const lower = firstMessage.toLowerCase();

  if (detectHighDistress(firstMessage)) return 'Moment of support';
  if (lower.includes('abandon') || lower.includes('left me') || lower.includes('leaving')) return 'When connection feels uncertain';
  if (lower.includes('calm') || lower.includes('overwhelm') || lower.includes('spiraling')) return 'Finding steady ground';
  if (lower.includes('feeling') || lower.includes('understand')) return 'Making sense of feelings';
  if (lower.includes('rewrite') || lower.includes('message') || lower.includes('text')) return 'Crafting the right words';
  if (lower.includes('trigger') || lower.includes('relationship') || lower.includes('partner')) return 'Navigating a relationship moment';
  if (lower.includes('pattern') || lower.includes('cycle') || lower.includes('keep doing')) return 'Noticing a pattern';
  if (lower.includes('angry') || lower.includes('anger') || lower.includes('rage') || lower.includes('furious')) return 'Sitting with anger';
  if (lower.includes('sad') || lower.includes('crying') || lower.includes('empty')) return 'A heavy moment';
  if (lower.includes('scared') || lower.includes('afraid') || lower.includes('anxious') || lower.includes('worried')) return 'When worry takes over';
  if (lower.includes('ashamed') || lower.includes('shame') || lower.includes('worthless')) return 'Carrying something heavy';
  if (lower.includes('confused') || lower.includes('overreacting') || lower.includes('don\'t know')) return 'Untangling the confusion';
  if (lower.includes('lonely') || lower.includes('alone') || lower.includes('no one')) return 'Feeling alone in it';
  if (lower.includes('guilty') || lower.includes('fault') || lower.includes('messed up')) return 'Working through guilt';
  if (lower.includes('hurt') || lower.includes('pain') || lower.includes('betrayed')) return 'Processing hurt';

  const words = firstMessage.split(' ').slice(0, 5).join(' ');
  return words.length > 30 ? words.substring(0, 30) + '...' : words;
}
