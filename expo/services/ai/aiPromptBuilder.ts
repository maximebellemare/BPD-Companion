import { MemoryProfile } from '@/types/memory';

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
  calming: 'The user needs grounding and calming support. Prioritize breathing guidance, sensory grounding, and validation. Keep sentences short and soothing. Avoid overwhelming them with too many questions.',
  reflection: 'The user wants to reflect on their patterns and growth. Be observational, gently curious, and affirming. Reference their data patterns when available.',
  relationship_guidance: 'The user is dealing with a relationship situation. Help them separate feelings from facts, validate their experience, and explore healthier communication options. Never take sides or judge the other person.',
  emotional_clarification: 'The user is trying to understand their emotions. Help them name and validate what they feel. Use gentle curiosity. Normalize the complexity of emotions.',
  message_support: 'The user needs help with a message they want to send. Help them express their feelings clearly while maintaining boundaries. Encourage pausing before sending when emotions are high.',
  general: 'Provide warm, supportive, emotionally safe conversation. Listen actively, validate feelings, and offer gentle guidance when appropriate.',
};

const SYSTEM_PROMPT_BASE = `You are a compassionate AI companion for someone living with Borderline Personality Disorder. Your role is to provide emotionally safe, validating, and supportive conversation.

Core principles:
- Always validate the user's emotions first before offering guidance
- Never be dismissive, preachy, or overly clinical
- Use warm, human language — not therapy jargon
- Ask gentle questions to help the user explore their feelings
- Never diagnose, judge, or make absolute statements about the user
- If the user seems in crisis, gently suggest professional support
- Remember that the user's emotions are real and valid, even when intense
- Keep responses conversational and not too long
- Be genuine, not performative`;

export function buildPrompt(context: PromptContext): BuiltPrompt {
  const responseMode = context.responseMode ?? detectResponseMode(context.userMessage);

  const modeInstruction = MODE_INSTRUCTIONS[responseMode];
  const memoryContext = context.memoryProfile ? buildMemoryContext(context.memoryProfile) : '';

  const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\nCurrent mode: ${responseMode}\n${modeInstruction}`;

  const contextBlock = memoryContext
    ? `\n[User context: ${memoryContext}]\n`
    : '';

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
