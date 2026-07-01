import { MemoryProfile } from '@/types/memory';
import { MemorySnapshot } from '@/types/userMemory';
import { buildAIMemoryContext } from '@/services/memory/userMemoryService';

export type ResponseMode =
  | 'reflection'
  | 'calming'
  | 'relationship_guidance'
  | 'emotional_clarification'
  | 'message_support'
  | 'general';

export interface PromptContext {
  userMessage: string;
  memoryProfile?: MemoryProfile;
  memorySnapshot?: MemorySnapshot;
  conversationHistory?: Array<{ role: string; content: string }>;
  responseMode?: ResponseMode;
}

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  contextBlock: string;
  responseMode: ResponseMode;
}

function detectResponseMode(message: string): ResponseMode {
  const lower = message.toLowerCase();

  if (lower.includes('calm') || lower.includes('overwhelm') || lower.includes('panic') || lower.includes('breathe') || lower.includes('spiraling')) {
    return 'calming';
  }
  if (lower.includes('relationship') || lower.includes('partner') || lower.includes('friend') || lower.includes('fight') || lower.includes('conflict')) {
    return 'relationship_guidance';
  }
  if (lower.includes('feeling') || lower.includes('understand') || lower.includes('confused') || lower.includes('what am i')) {
    return 'emotional_clarification';
  }
  if (lower.includes('message') || lower.includes('text') || lower.includes('send') || lower.includes('reply') || lower.includes('rewrite')) {
    return 'message_support';
  }
  if (lower.includes('pattern') || lower.includes('notice') || lower.includes('reflect') || lower.includes('journal')) {
    return 'reflection';
  }

  return 'general';
}

function buildMemoryContext(profile: MemoryProfile): string {
  const parts: string[] = [];

  if (profile.recentCheckInCount > 0) {
    parts.push(`User has completed ${profile.recentCheckInCount} check-ins.`);
  }

  if (profile.topTriggers.length > 0) {
    const triggers = profile.topTriggers.slice(0, 3).map(t => t.label).join(', ');
    parts.push(`Common triggers: ${triggers}.`);
  }

  if (profile.topEmotions.length > 0) {
    const emotions = profile.topEmotions.slice(0, 3).map(e => e.label).join(', ');
    parts.push(`Frequent emotions: ${emotions}.`);
  }

  if (profile.topUrges.length > 0) {
    const urges = profile.topUrges.slice(0, 3).map(u => u.label).join(', ');
    parts.push(`Common urges: ${urges}.`);
  }

  if (profile.copingToolsUsed.length > 0) {
    const tools = profile.copingToolsUsed.slice(0, 3).map(c => c.label).join(', ');
    parts.push(`Coping tools used: ${tools}.`);
  }

  if (profile.averageIntensity > 0) {
    parts.push(`Average emotional intensity: ${profile.averageIntensity}/10.`);
  }

  if (profile.intensityTrend !== 'unknown') {
    parts.push(`Intensity trend: ${profile.intensityTrend}.`);
  }

  if (profile.mostEffectiveCoping) {
    parts.push(`Most effective coping tool: "${profile.mostEffectiveCoping.label}".`);
  }

  if (profile.recentThemes.length > 0) {
    parts.push(`Recent themes: ${profile.recentThemes.join(', ')}.`);
  }

  if (profile.relationshipPatterns.length > 0) {
    const patterns = profile.relationshipPatterns.slice(0, 2).map(p => p.pattern).join(' ');
    parts.push(`Relationship patterns: ${patterns}`);
  }

  return parts.join(' ');
}

const MODE_INSTRUCTIONS: Record<ResponseMode, string> = {
  calming: 'The user needs grounding right now. Lead with a sensory anchor or breathing cue. Keep sentences short and steady. Do NOT ask questions unless absolutely needed. One grounding step at a time. Match their pace — do not rush to fix.',
  reflection: 'The user wants to understand their patterns. Be gently curious, not directive. Name the concrete behavior, event, urge, person, or phrase first. Reference emotional data only when useful. Ask ONE specific question that goes one layer deeper from that concrete signal.',
  relationship_guidance: 'The user is dealing with a relationship situation. Start with facts: what happened, who was involved, and what happened next. Then help name the strongest emotion or urge. Never take sides. If they want to send a message, suggest the rewrite tool.',
  emotional_clarification: 'The user is trying to understand their emotions. Help them name what they feel using their own language, not clinical terms. Normalize emotional complexity — it is okay to feel two contradictory things at once. Offer the "what happened vs. what my mind says it means vs. what I feel" framework when confusion is high.',
  message_support: 'The user needs help with a message. Ask what they want the message to accomplish: express hurt, set a boundary, get clarity, apologize, or repair. Encourage pausing when emotions are high. Suggest the secure rewrite tool. Frame rewrites as protecting both dignity and connection.',
  general: 'Respond specifically to what the user shared. Reference their exact words. Offer one concrete insight tied to the behavior, event, urge, person, or phrase they named. Vary your endings — sometimes a question, sometimes a reflection, sometimes a suggested next step. Be warm and specific, never generic.',
};

const SYSTEM_PROMPT_BASE = `You are a calm, emotionally intelligent AI companion for someone living with Borderline Personality Disorder. You are not a chatbot — you are a thoughtful presence that listens deeply and responds with genuine insight.

Response structure for every reply:
1. REFLECT — Reference what the user actually said. Use their specific words. Show you heard the situation, not just the emotion category.
2. INSIGHT — Offer ONE useful perspective tied to the concrete behavior, event, urge, person, or phrase. Name a possible emotion only when it fits.
3. QUESTION or NEXT STEP — Either ask ONE specific follow-up question OR suggest one concrete action. Not both.

Core principles:
- Validate the user's emotions first, always. Be specific about WHAT you are validating.
- Never be dismissive, preachy, or overly clinical. No therapy jargon.
- Use the user's own words and emotional vocabulary when reflecting back.
- Never diagnose, judge, or make absolute statements about the user.
- If the user seems in crisis, acknowledge their pain and gently suggest professional support.
- Keep responses conversational — 2-5 sentences typically. Longer only when exploring something complex.
- Be genuine, not performative. No fake enthusiasm or hollow reassurance.

Anti-patterns (never do these):
- Do NOT start with "I hear you" or "That makes sense" or "Thank you for sharing" — vary every opening.
- Do NOT say "Tell me more" or "How does that make you feel?" — be specific.
- Do NOT list multiple coping strategies. Suggest ONE that fits their situation.
- Do NOT use clinical terms like "catastrophizing", "splitting", or "cognitive distortion" — describe patterns in plain language.
- Do NOT end every message with a question. Sometimes a reflection or validation is the right ending.
- Do NOT offer premature solutions before acknowledging the emotion.
- When appropriate, suggest ONE practical tool: journaling, grounding, message rewrite, or a breathing exercise.`;

export function buildPrompt(context: PromptContext): BuiltPrompt {
  const responseMode = context.responseMode ?? detectResponseMode(context.userMessage);

  const modeInstruction = MODE_INSTRUCTIONS[responseMode];
  const memoryContext = context.memoryProfile ? buildMemoryContext(context.memoryProfile) : '';
  const persistentMemoryContext = context.memorySnapshot ? buildAIMemoryContext(context.memorySnapshot) : '';

  let memoryInstruction = '';
  if (persistentMemoryContext) {
    memoryInstruction = '\n\nYou have access to persistent memory about this user. Reference specific memories when relevant to make responses feel personalized. Use phrases like "I remember..." or "This seems similar to..." when referencing past patterns.';
  }

  const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\nCurrent mode: ${responseMode}\n${modeInstruction}${memoryInstruction}`;

  const contextParts: string[] = [];
  if (memoryContext) {
    contextParts.push(`[User context: ${memoryContext}]`);
  }
  if (persistentMemoryContext) {
    contextParts.push(persistentMemoryContext);
  }

  const contextBlock = contextParts.length > 0 ? `\n${contextParts.join('\n')}\n` : '';

  return {
    systemPrompt,
    userPrompt: context.userMessage,
    contextBlock,
    responseMode,
  };
}

export function buildConversationTags(message: string): string[] {
  const lower = message.toLowerCase();
  const tags: string[] = [];

  if (lower.includes('abandon') || lower.includes('left me') || lower.includes('leaving')) tags.push('abandonment');
  if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('worry') || lower.includes('panic')) tags.push('anxiety');
  if (lower.includes('relationship') || lower.includes('partner') || lower.includes('friend')) tags.push('relationship');
  if (lower.includes('conflict') || lower.includes('fight') || lower.includes('argue')) tags.push('conflict');
  if (lower.includes('text') || lower.includes('message') || lower.includes('send') || lower.includes('reply')) tags.push('texting');
  if (lower.includes('reassur') || lower.includes('need to know') || lower.includes('do you care')) tags.push('reassurance');
  if (lower.includes('calm') || lower.includes('breathe') || lower.includes('ground')) tags.push('grounding');
  if (lower.includes('sad') || lower.includes('crying') || lower.includes('hopeless')) tags.push('sadness');
  if (lower.includes('angry') || lower.includes('rage') || lower.includes('furious')) tags.push('anger');

  return tags.slice(0, 4);
}
