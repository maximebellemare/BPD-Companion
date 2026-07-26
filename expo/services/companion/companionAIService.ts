import { generateText } from '@rork-ai/toolkit-sdk';
import { AIMode } from '@/types/aiModes';
import { CompanionMode } from '@/types/companionModes';
import { MemoryProfile } from '@/types/memory';
import { MemorySnapshot } from '@/types/userMemory';
import { EmotionalState } from '@/types/companionMemory';
import { EmotionalIntent } from '@/services/ai/aiResponseTemplates';
import { AssembledContext } from './contextAssembler';
import { ReasoningOutput, performReasoning, buildReasoningPromptSection } from './reasoningEngine';
import { buildCompanionSystemPrompt } from './companionPromptBuilder';
import { detectAIMode } from '@/services/ai/aiModeService';
import { detectEmotionalState } from './memoryService';
import { buildModeSystemPrompt } from '@/services/ai/aiResponseStrategy';
import { compressConversationHistory } from './contextCompressionService';
import { routeToModel, getResponseLengthInstruction } from '@/services/ai/modelRouterService';
import { enforceTokenBudget, estimateTokens } from '@/services/ai/tokenBudgetService';
import { trackEvent } from '@/services/analytics/analyticsService';
import { assessInputSafety, checkOutputSafety, augmentResponseWithSafety, buildSafetyPromptInjection } from '@/services/ai/aiSafetyService';
import { SafetyAssessment } from '@/types/aiSafety';
import { CompanionContextSummary } from '@/types/ai';
import { getPrimaryCrisisResourceText } from '@/services/safety/crisisResources';
import { getAiLanguageInstruction, i18n } from '@/lib/i18n';
import { normalizeLanguageTag } from '@/lib/i18n/languageStorage';

const QUICK_ACTIONS_BY_MODE: Record<CompanionMode, string[]> = {
  calm: ['Ground me', 'Safety mode'],
  reflection: ['Journal this', 'Show coping tools', 'Reflection'],
  clarity: ['Journal this', 'Slow this down'],
  relationship: ["Don't Send It", 'Slow this down', 'Journal this'],
  action: ['Ground me', 'Show coping tools', "Don't Send It"],
  high_distress: ['Ground me', 'Safety mode'],
  post_conflict_repair: ['Journal this', 'Slow this down', 'Reflection'],
  insight_review: ['Journal this', 'Show coping tools'],
  coaching: ['Ground me', 'Show coping tools', 'Journal this'],
};

type ConcreteSignal = {
  significantStatement: string;
  riskyBehavior: string | null;
  concretePattern: string;
  bestQuestion: string;
  responseSeed: string;
};

const VAGUE_RESPONSE_PATTERNS = [
  /surface moment/i,
  /surface event/i,
  /surface details/i,
  /there may be more here/i,
  /something i notice/i,
  /what is alive in you/i,
  /your system/i,
  /for the next minute/i,
  /the silence/i,
  /something important may be happening/i,
  /something about this has weight/i,
  /deeper nerve/i,
  /underneath this/i,
];

const ABSTRACT_QUESTION_PATTERNS = [
  /what part .* familiar\?/i,
  /what does .* mean\?/i,
  /what did .* mean\?/i,
  /what are you protecting\?/i,
  /where does .* fact .* fear\?/i,
  /what would you be trying to protect/i,
  /if this feeling had .* sentence/i,
  /what did this seem to say/i,
  /what were you trying to get relief from/i,
  /what did you need from them/i,
];

function compactUserStatement(message: string): string {
  return message.replace(/\s+/g, ' ').trim().slice(0, 180);
}

function identifyConcreteSignal(userMessage: string): ConcreteSignal {
  const statement = compactUserStatement(userMessage);
  const lower = statement.toLowerCase();

  if (/\b(drink|drinking|alcohol|beer|wine|vodka|whiskey|get drunk)\b/.test(lower)) {
    const boredom = /\b(bored|boredom)\b/.test(lower);
    return {
      significantStatement: statement,
      riskyBehavior: 'drinking',
      concretePattern: boredom ? 'boredom turning into drinking as a way to escape or numb out' : 'drinking showing up as a coping urge',
      bestQuestion: boredom
        ? "When boredom hits, what usually happens first: restlessness, loneliness, anxiety, or the thought “I need something”?"
        : 'Right before you want to drink, what feeling or thought usually shows up first?',
      responseSeed: boredom
        ? 'That’s important. It sounds like boredom may be turning into an urge to escape or numb out.'
        : 'That’s important. Drinking sounds like it may be connected to an urge to change how you feel quickly.',
    };
  }

  if (/\b(empty|emptiness)\b/.test(lower)) {
    return {
      significantStatement: statement,
      riskyBehavior: null,
      concretePattern: 'emptiness needing a more specific name',
      bestQuestion: 'When you say empty, is it more like numb, lonely, disconnected, bored, or hopeless?',
      responseSeed: 'That empty feeling can be really painful.',
    };
  }

  if (/\b(i don'?t know|idk|not sure)\b/.test(lower)) {
    return {
      significantStatement: statement,
      riskyBehavior: null,
      concretePattern: 'not having words yet',
      bestQuestion: 'Can we start smaller: does it feel more physical, emotional, or like your mind is just blank?',
      responseSeed: 'That’s okay. We don’t need to force an answer.',
    };
  }

  if (/\b(girlfriend|boyfriend|partner|wife|husband|friend|ex)\b/.test(lower) && /\b(answer|reply|respond|text|message|left on read|ignored)\b/.test(lower)) {
    return {
      significantStatement: statement,
      riskyBehavior: null,
      concretePattern: 'a delayed response triggering uncertainty',
      bestQuestion: 'What did the wait seem to mean in that moment: “they’re busy,” “I’m not important,” or “they’re pulling away”?',
      responseSeed: 'That sounds like it may be triggering uncertainty.',
    };
  }

  if (/\b(text|message|reply|dm|send)\b/.test(lower) && /\b(again|react|angry|mad|regret|impulsive|urge)\b/.test(lower)) {
    return {
      significantStatement: statement,
      riskyBehavior: 'reactive messaging',
      concretePattern: 'an urge to respond before the feeling has settled',
      bestQuestion: 'What are you hoping the message will do: get reassurance, express hurt, make them understand, or release anger?',
      responseSeed: 'That urge to send something matters. It may be trying to get relief fast.',
    };
  }

  if (/\b(angry|mad|furious|rage|pissed)\b/.test(lower)) {
    return {
      significantStatement: statement,
      riskyBehavior: null,
      concretePattern: 'anger that may be covering hurt, fear, or feeling disrespected',
      bestQuestion: 'What happened right before the anger: did you feel ignored, criticized, rejected, controlled, or disrespected?',
      responseSeed: 'That anger sounds intense enough that it deserves to be taken seriously.',
    };
  }

  return {
    significantStatement: statement,
    riskyBehavior: null,
    concretePattern: 'the concrete situation the user named',
    bestQuestion: 'What happened right before this started?',
    responseSeed: statement
      ? `I want to stay with the concrete part: “${statement}.”`
      : 'I want to stay with the concrete part of what happened.',
  };
}

function buildConcreteSignalResponse(signal: ConcreteSignal): string {
  return [
    signal.responseSeed,
    signal.riskyBehavior
      ? `The key pattern to look at is ${signal.concretePattern}.`
      : undefined,
    signal.bestQuestion,
  ].filter(Boolean).join('\n\n');
}

function guardConcreteResponse(content: string, userMessage: string): string {
  const signal = identifyConcreteSignal(userMessage);
  const lower = content.toLowerCase();
  const missesConcreteSignal = signal.riskyBehavior !== null && !lower.includes(signal.riskyBehavior.toLowerCase());
  const hasVagueLanguage = VAGUE_RESPONSE_PATTERNS.some(pattern => pattern.test(content));
  const hasAbstractQuestion = ABSTRACT_QUESTION_PATTERNS.some(pattern => pattern.test(content));

  if (hasVagueLanguage || missesConcreteSignal || hasAbstractQuestion) {
    return buildConcreteSignalResponse(signal);
  }

  return content
    .replace(/^\s*🔍\s*Something I notice\s*:?\s*/gim, '')
    .replace(/\bthe silence\b/gi, 'the wait')
    .replace(/\byour system\b/gi, 'part of you')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const INTENT_BY_MODE: Record<CompanionMode, EmotionalIntent> = {
  calm: 'calming',
  reflection: 'general',
  clarity: 'confused',
  relationship: 'relationship',
  action: 'general',
  high_distress: 'high_distress',
  post_conflict_repair: 'ashamed',
  insight_review: 'pattern',
  coaching: 'general',
};

export interface CostMetrics {
  modelTier: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  wasCompressed: boolean;
  conversationCompressed: boolean;
  memoriesUsed: number;
}

export interface CompanionAIResponse {
  content: string;
  timestamp: number;
  intent: EmotionalIntent;
  quickActions: string[];
  activeMode: AIMode;
  reasoning: ReasoningOutput;
  costMetrics?: CostMetrics;
  safetyAssessment?: SafetyAssessment;
}

export interface CompanionAIRequestParams {
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  assembledContext: AssembledContext;
  detectedMode: CompanionMode;
  manualMode: AIMode | null;
  memoryProfile: MemoryProfile;
  memorySnapshot: MemorySnapshot | null;
  companionContextSummary?: CompanionContextSummary;
}

function buildFullSystemPrompt(
  detectedMode: CompanionMode,
  assembledContext: AssembledContext,
  reasoning: ReasoningOutput,
  memoryProfile: MemoryProfile,
  activeMode: AIMode,
  responseLengthRule: string,
  companionContextSummary?: CompanionContextSummary,
  concreteSignal?: ConcreteSignal,
): string {
  const basePrompt = buildCompanionSystemPrompt(detectedMode, assembledContext);
  const modePrompt = buildModeSystemPrompt(activeMode);
  const reasoningSection = buildReasoningPromptSection(reasoning);

  const personalContext = buildPersonalContextSection(memoryProfile);
  const hasMemoryData = Boolean(
    assembledContext.retrievedMemories?.relevantEpisodes.length ||
    assembledContext.retrievedMemories?.relevantTraits.length ||
    assembledContext.retrievedMemories?.relevantRelationships.length ||
    assembledContext.relevantInsights.length ||
    assembledContext.companionMemorySystemNarrative ||
    companionContextSummary?.promptContext,
  );

  const parts = [
    basePrompt,
    '',
    modePrompt,
    '',
    reasoningSection,
  ];

  if (personalContext) {
    parts.push('');
    parts.push(personalContext);
  }

  if (companionContextSummary?.promptContext) {
    parts.push('');
    parts.push(`[RECENT APP CONTEXT]\n${companionContextSummary.promptContext}`);
  }

  if (concreteSignal) {
    parts.push('');
    parts.push(`[CONCRETE SIGNAL TO RESPOND TO]
Most emotionally significant statement: ${concreteSignal.significantStatement}
Most risky/important behavior: ${concreteSignal.riskyBehavior ?? 'none named'}
Most concrete pattern: ${concreteSignal.concretePattern}
Best next question: ${concreteSignal.bestQuestion}

You must respond to this concrete signal first. Do not pivot to abstract interpretations.`);
  }

  const aiLanguageInstruction = getAiLanguageInstruction(normalizeLanguageTag(i18n.language) ?? 'en');
  if (aiLanguageInstruction) {
    parts.push('');
    parts.push(`[LANGUAGE PREFERENCE]\n${aiLanguageInstruction}`);
  }

  if (companionContextSummary?.highIntensity && reasoning.urgencyLevel === 'high') {
    parts.push('');
    parts.push(`RECENT HIGH-INTENSITY CONTEXT:
- The user's latest recorded intensity is ${companionContextSummary.currentIntensity}/10.
- Use this only as background context. Do not display it as a banner or say "using recent context."
- Do not assume the current message is a crisis because of an older check-in.
- Keep the response brief and curious unless the current message itself shows immediate risk.
- Include a simple safety note when needed: this app is not crisis support; if they may hurt themselves or someone else, contact local emergency services or a crisis line now.`);
  }

  parts.push('');
  parts.push(`CRITICAL RESPONSE RULES:
- Respond DIRECTLY to what the user said. Do NOT give a generic response.
- Before responding, identify the most concrete signal in the user's message: the behavior, event, person, urge, or exact phrase that matters most. Respond to that first.
- If the user names a behavior such as drinking, texting repeatedly, arguing, withdrawing, spending, or checking, focus on that behavior and the feeling right before it. Do not pivot to vague emptiness or general emotional pain.
- Avoid vague phrases such as "surface moment", "surface event", "surface details", "what is alive in you", "your system", "there may be more here", "something important may be happening", and generic "Something I notice" labels.
- No poetic metaphors unless the user uses one first.
- Prefer concrete words: boredom, drinking, delayed reply, urge to text, feeling ignored, fear of being left, shame after conflict.
- If the user shares a specific situation, respond to THAT situation specifically — name the people, the actions, the context they described.
- If the user answers a question you asked, ENGAGE WITH THEIR ANSWER first. Do not ignore it and ask a new question.
- Reference specific words or phrases the user used to show you are truly listening. If they said "it feels like being erased", use that phrase back.
- Do NOT start every response with "I hear you" or "That makes sense" or "That sounds" — vary your openings every single time.
- Use the user's own language and emotional vocabulary when reflecting back. If they say "freaking out", don't translate to "experiencing distress."
- Never sound like a worksheet, intake form, therapy handout, or generic coaching script.
- Avoid repetitive therapy language. Use ordinary words before clinical words.
- Do not ask "How does that make you feel?", "What do you think?", "Can you tell me more?", or "Let's unpack that." Ask a specific, situational question only when a question is truly useful.
- If you have memory context about this user, weave in ONE relevant reference naturally — do not dump all memories at once. Memory should feel like recognition, not surveillance.
- If the Companion Memory System includes an emotional timeline or recurring loop relevant to the user's message, name the pattern gently and connect the pieces in plain language.
- If Emotional GPS says a loop has repeated and it matches the current situation, include: "We've seen this pattern before." Then map Trigger -> Emotion -> Fear -> Urge -> Action -> Outcome in one short sentence.
- When useful, connect the current message to previous conversations, tracked emotions, onboarding goals, or relationship history. Do this briefly and only when it helps the user feel understood.
- Never list multiple coping tools at once. Suggest ONE specific thing tied to their current situation.
- Vary your endings: sometimes a question, sometimes a reflection, sometimes a practical suggestion, sometimes just sitting with what was said.
- Be specific, not generic. "That fear of being forgotten when they don't reply" is better than "That feeling of abandonment."
- When the user shares something vulnerable, validate the vulnerability before moving to solutions or questions.
- Name a possible emotion only after the facts are clear: anger may come with hurt, numbness may come with overwhelm, people-pleasing may come with fear of being left.
- When appropriate, gently suggest ONE tool: journaling, grounding, Don’t Send It, or a DBT skill — but only when it fits naturally.
- Use recent app context when relevant: recent emotions, triggers, onboarding goals, and common patterns. Do not claim certainty; say "appears," "may suggest," or "based on your entries."
- If relationship tags are available, use them softly and with confidence language: "based on your tagged entries," "this appears more often with partner-related entries," or "low/medium/high confidence." Do not assume one relationship type explains everything.
- Use appointment and medication context only as neutral organization context. Never give medication advice. Never comment on whether a medication is right or wrong. Use phrases like "You marked this as taken," "You missed 2 logged doses," or "You have therapy tomorrow."
- If medication tracking comes up, include that medication tracking is for organization only and does not replace medical advice.
- Use memory to guide the next step: if the pattern is Trigger -> Emotion -> Fear -> Urge, help the user interrupt the chain before action.
- Do not say the app treats, cures, or diagnoses BPD.
- If you notice a pattern repeating across the conversation, name it gently: "I notice this keeps coming back to..."
- Format normal replies for mobile chat using short paragraphs, not markdown. Do NOT use **bold**, markdown headings, or numbered lists.
- Do NOT use a repeated listening-summary heading. Vary openings naturally, such as "That sounds really hard.", "Let's slow this down.", "I can see why this would hit you.", "Something important may be happening here.", or "Before reacting, let's separate facts from fears."
- If structure helps, use at most one lightweight label that names the concrete issue, such as "About the drinking urge" or "About the delayed reply." Avoid generic labels.
- Keep replies short with clean spacing between paragraphs.
- Keep replies short unless the user explicitly asks to go deeper.
- Focus on patterns and understanding. The user should feel: "this app remembers me and helps me understand what is happening," not "this app gave me homework."
- Optimize for discovery over advice. The user should leave the conversation understanding one new piece of their trigger, fear, need, urge, or pattern.
- Treat the first reply as a doorway, not a conclusion. Keep it short and ask the question that opens the next layer.
- Go deeper over multiple messages. Do not complete the whole emotional timeline unless the user has already shared enough detail.
- Ask exactly one strong, specific question in most non-crisis replies. Avoid stacking questions.
- If this is a follow-up message, engage the user's latest answer directly before adding any new observation.
- Avoid closing the loop too early. Do not make the response feel like the conversation is finished.
- Memory/data availability for this reply: ${hasMemoryData ? 'enough context exists. Use ONE relevant detail if it fits.' : 'little context exists. Do not invent history or patterns.'}
- If you make an observation, it must contain an actual concrete detail tied to the message, memory, emotional timeline, relationship history, trigger data, fear pattern, or previous conversation.
- If no reliable pattern exists, omit pattern language and keep it conversational.
- ${responseLengthRule}`);

  return parts.join('\n');
}

function cleanCompanionMarkdown(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/^\s*💙?\s*What I(?:'|’)m hearing\s*:?\s*$/gim, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeCompanionSectionLabels(content: string): string {
  const labelMap: Record<string, string> = {
    'one next step': '➡️ One thing to try',
    'one thing to try': '➡️ One thing to try',
    'what might help': '➡️ One thing to try',
    'next step': '➡️ One thing to try',
  };

  return content
    .split('\n')
    .map(line => {
      const clean = line
        .replace(/^[💙🔍➡️❤️🧭]\s*/, '')
        .replace(/[:\-–—]\s*$/, '')
        .trim()
        .toLowerCase();
      return labelMap[clean] ?? line;
    })
    .join('\n');
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);
}

const QUALITY_OPENINGS = [
  '💙 I want to stay with the exact thing you named.',
  'Let’s look at the concrete part first.',
  'I can see why that specific moment would feel charged.',
  'The important clue is in what happened right before the feeling.',
  'Before reacting, let’s separate the facts from the fear.',
  'This sounds specific, and I do not want to blur it into generic advice.',
  'I want to help you pause without dismissing the feeling.',
  'Let’s name the behavior, urge, or fear directly.',
];

const QUALITY_QUESTIONS = [
  'What happened right before this started?',
  'When did this start?',
  'What emotion feels strongest right now?',
  'What do you usually do when this happens?',
  'What are you hoping will change?',
  'Does this feel more like boredom, loneliness, sadness, or numbness?',
  'What did you notice first: the feeling, the thought, or the urge?',
  'What happened next?',
  'Did you want to text, leave, argue, drink, shut down, or get reassurance?',
  'What was the last concrete thing that happened before this feeling got stronger?',
  'Did this feel more like anger, fear, shame, or rejection?',
];

function chooseBySeed<T>(items: T[], seed: string, offset = 0): T {
  const total = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), offset);
  return items[total % items.length];
}

function ensureQuestion(text: string, seed: string): string {
  if (/[?]\s*$/.test(text.trim())) return text.trim();
  return `${text.trim()}\n\n${chooseBySeed(QUALITY_QUESTIONS, seed, 17)}`;
}

function buildQualityResponseShape(params: {
  seed: string;
  hearing: string;
  pattern?: string;
  step?: string;
  hasMemoryData: boolean;
  highIntensity: boolean;
  urgencyLevel: ReasoningOutput['urgencyLevel'];
  isFollowUp?: boolean;
}): string {
  const { seed, hearing, pattern, step, hasMemoryData, highIntensity, urgencyLevel, isFollowUp = false } = params;
  const variant = seed.length % 3;

  if (urgencyLevel === 'crisis') {
    const body = [
      hearing,
      'This may be too much to hold alone. If you might hurt yourself or someone else, contact local emergency services now.',
      'Can you move near another person or a safer place right now?',
    ].filter(Boolean).join('\n\n');
    return body;
  }

  if (urgencyLevel === 'high') {
    const question = chooseBySeed([
      'Do you want to start with what happened, or with the urge that showed up?',
      'What feels most urgent right now: texting, leaving, arguing, shutting down, or getting reassurance?',
      'What do you feel pulled to do right now?',
    ], seed, 29);
    return [
      hearing,
      pattern ? `This may be pointing to ${pattern.toLowerCase()}` : 'The urgency itself is useful information, but it does not have to choose your next move.',
      question,
    ].filter(Boolean).join('\n\n');
  }

  const question = chooseBySeed(QUALITY_QUESTIONS, seed, isFollowUp ? 41 : 17);

  if (variant === 0) {
    return [
      `💙 ${hearing}`,
      pattern ? `🔍 ${pattern}` : undefined,
      isFollowUp ? undefined : 'Let’s start with the concrete part.',
      question,
    ].filter(Boolean).join('\n\n');
  }

  if (variant === 1) {
    const opening = chooseBySeed(QUALITY_OPENINGS, seed);
    return [
      opening,
      pattern || 'Let’s keep this simple and start with what happened.',
      question,
    ].join('\n\n');
  }

  return [
    hearing,
    hasMemoryData && pattern ? pattern : pattern,
    step && isFollowUp ? step : undefined,
    question,
  ].filter(Boolean).join('\n\n');
}

function enforceCompanionResponseShape(
  rawContent: string,
  params: {
    hasMemoryData: boolean;
    highIntensity: boolean;
    urgencyLevel: ReasoningOutput['urgencyLevel'];
    isFollowUp?: boolean;
  },
): string {
  let content = normalizeCompanionSectionLabels(cleanCompanionMarkdown(rawContent));
  if (!content) return content;

  content = content
    .replace(/^\s*💙?\s*What I(?:'|’)m hearing\s*:?\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const sentences = splitSentences(content);
  if (params.urgencyLevel === 'high' || params.urgencyLevel === 'crisis') {
    const hearing = sentences.slice(0, 2).join(' ') || content;
    const step = sentences.slice(2, 4).join(' ') || 'Put both feet on the floor and take three slow breaths before deciding what to do next.';
    return buildQualityResponseShape({
      seed: content,
      hearing,
      step,
      hasMemoryData: params.hasMemoryData,
      highIntensity: false,
      urgencyLevel: params.urgencyLevel,
      isFollowUp: params.isFollowUp,
    });
  }

  const hearing = sentences.slice(0, 2).join(' ') || content;
  const middle = sentences.slice(2, params.hasMemoryData ? 4 : 3).join(' ');
  const ending = sentences.slice(params.hasMemoryData ? 4 : 3, params.hasMemoryData ? 6 : 5).join(' ');
  const fallbackStep = 'Notice the exact urge that appeared before choosing what to do with it.';

  return buildQualityResponseShape({
    seed: content,
    hearing,
    pattern: middle || undefined,
    step: ending || middle || fallbackStep,
    hasMemoryData: params.hasMemoryData,
    highIntensity: params.highIntensity,
    urgencyLevel: params.urgencyLevel,
    isFollowUp: params.isFollowUp,
  });
}

function buildPersonalContextSection(memoryProfile: MemoryProfile): string {
  const parts: string[] = [];

  if (memoryProfile.topTriggers.length > 0) {
    parts.push(`User's known triggers: ${memoryProfile.topTriggers.slice(0, 3).map(t => t.label).join(', ')}`);
  }

  if (memoryProfile.topEmotions.length > 0) {
    parts.push(`Frequent emotions: ${memoryProfile.topEmotions.slice(0, 3).map(e => e.label).join(', ')}`);
  }

  if (memoryProfile.mostEffectiveCoping) {
    parts.push(`Most effective coping tool: "${memoryProfile.mostEffectiveCoping.label}"`);
  }

  if (memoryProfile.intensityTrend && memoryProfile.intensityTrend !== 'unknown') {
    parts.push(`Recent intensity trend: ${memoryProfile.intensityTrend}`);
  }

  if (memoryProfile.relationshipPatterns.length > 0) {
    parts.push(`Relationship patterns: ${memoryProfile.relationshipPatterns.slice(0, 2).map(p => p.pattern).join('; ')}`);
  }

  if (parts.length === 0) return '';
  return `[PERSONAL CONTEXT]\n${parts.join('\n')}`;
}

function buildConversationMessages(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  messages.push({
    role: 'user' as const,
    content: `[System context — do not repeat this to the user]\n${systemPrompt}\n[End system context]\n\nUser's message: ${conversationHistory.length === 0 ? userMessage : '(see conversation below)'}`,
  });

  messages.push({
    role: 'assistant' as const,
    content: 'I understand the context. I will respond as the companion, directly to the user.',
  });

  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    });
  }

  if (conversationHistory.length > 0) {
    messages.push({
      role: 'user' as const,
      content: userMessage,
    });
  }

  return messages;
}

export async function generateCompanionResponse(
  params: CompanionAIRequestParams,
): Promise<CompanionAIResponse> {
  const {
    userMessage,
    conversationHistory,
    assembledContext,
    detectedMode,
    manualMode,
    memoryProfile,
    companionContextSummary,
  } = params;

  console.log('[CompanionAI] Generating response for:', userMessage.substring(0, 60));
  console.log('[CompanionAI] Mode:', detectedMode, 'manual:', manualMode);

  const safetyAssessment = assessInputSafety(userMessage);
  if (safetyAssessment.level !== 'safe') {
    console.log('[CompanionAI] Safety assessment:', safetyAssessment.level, 'signals:', safetyAssessment.signals.map(s => s.type).join(', '));
    void trackEvent('safety_concern_detected', {
      level: safetyAssessment.level,
      signals: safetyAssessment.signals.map(s => s.type).join(','),
      source: 'companion',
    });
  }

  const emotionalState = detectEmotionalState(userMessage);

  const reasoning = performReasoning({
    userMessage,
    conversationHistory,
    assembledContext,
    detectedMode,
    emotionalState,
  });

  const modeDetection = detectAIMode({
    messageContent: userMessage,
    conversationHistory,
    averageIntensity: memoryProfile.averageIntensity,
    relationshipSignals: memoryProfile.topTriggers.some(t => t.label.toLowerCase().includes('relationship')),
  });

  const activeMode: AIMode = manualMode ?? modeDetection.mode;

  const routingDecision = routeToModel({
    userMessage,
    conversationLength: conversationHistory.length,
    emotionalState: emotionalState as EmotionalState,
    hasRelationshipContext: memoryProfile.topTriggers.some(t => t.label.toLowerCase().includes('relationship')),
    isFollowUp: conversationHistory.length > 0,
    hasMemoryContext: !!assembledContext.retrievedMemories && assembledContext.retrievedMemories.relevantEpisodes.length > 0,
  });

  const responseLengthRule = getResponseLengthInstruction(routingDecision.tier, emotionalState as EmotionalState);

  const concreteSignal = identifyConcreteSignal(userMessage);

  let systemPrompt = buildFullSystemPrompt(
    detectedMode,
    assembledContext,
    reasoning,
    memoryProfile,
    activeMode,
    responseLengthRule,
    companionContextSummary,
    concreteSignal,
  );

  const safetyInjection = buildSafetyPromptInjection(safetyAssessment);
  if (safetyInjection) {
    systemPrompt = `${safetyInjection}\n\n${systemPrompt}`;
  }

  const compressed = compressConversationHistory(conversationHistory);

  let effectiveHistory = compressed.recentMessages;
  if (compressed.summary) {
    effectiveHistory = [
      { role: 'user', content: `[Context: ${compressed.summary}]` },
      { role: 'assistant', content: 'I understand the earlier context.' },
      ...compressed.recentMessages,
    ];
  }

  const rawMessages = buildConversationMessages(systemPrompt, effectiveHistory, userMessage);

  const budgetResult = enforceTokenBudget({
    systemPrompt,
    conversationMessages: rawMessages,
    memoryNarrative: assembledContext.memoryNarrative,
    contextNarrative: assembledContext.fullContext,
    tier: routingDecision.tier,
  });

  const messages = budgetResult.conversationMessages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const memoriesUsed = assembledContext.retrievedMemories
    ? assembledContext.retrievedMemories.relevantEpisodes.length + assembledContext.retrievedMemories.relevantTraits.length
    : 0;

  console.log('[CompanionAI] Cost optimization:', {
    modelTier: routingDecision.tier,
    reason: routingDecision.reason,
    originalTokens: budgetResult.originalTokens,
    finalTokens: budgetResult.finalTokens,
    wasCompressed: budgetResult.wasCompressed,
    conversationCompressed: compressed.tokensSaved > 0,
    tokensSavedFromConversation: compressed.tokensSaved,
    memoriesUsed,
  });

  try {
    let content = await generateText({ messages });

    const outputSafetyCheck = checkOutputSafety(content, safetyAssessment);
    if (outputSafetyCheck.sanitizedContent) {
      console.log('[CompanionAI] Output failed safety check, using safe fallback. Violations:', outputSafetyCheck.violations.map(v => v.type).join(', '));
      content = outputSafetyCheck.sanitizedContent;
      void trackEvent('ai_output_safety_blocked', {
        violations: outputSafetyCheck.violations.map(v => v.type).join(','),
        source: 'companion',
      });
    } else if (!outputSafetyCheck.isAcceptable) {
      console.log('[CompanionAI] Output has non-critical safety concerns:', outputSafetyCheck.violations.map(v => v.type).join(', '));
    }

    content = augmentResponseWithSafety(content, safetyAssessment);
    content = enforceCompanionResponseShape(content, {
      hasMemoryData: memoriesUsed > 0 || assembledContext.relevantInsights.length > 0 || Boolean(assembledContext.companionMemorySystemNarrative),
      highIntensity: false,
      urgencyLevel: reasoning.urgencyLevel,
      isFollowUp: conversationHistory.length > 0,
    });
    content = guardConcreteResponse(content, userMessage);

    const outputTokens = estimateTokens(content);
    console.log('[CompanionAI] AI response generated, length:', content.length, 'output tokens:', outputTokens);

    void trackEvent('companion_request_sent', {
      model_tier: routingDecision.tier,
      input_tokens: budgetResult.finalTokens,
      output_tokens: outputTokens,
      was_compressed: budgetResult.wasCompressed,
      conversation_compressed: compressed.tokensSaved > 0,
      memories_used: memoriesUsed,
      routing_reason: routingDecision.reason,
    });

    const quickActions = selectQuickActions(detectedMode, reasoning, companionContextSummary);
    const intent = INTENT_BY_MODE[detectedMode] ?? 'general';

    return {
      content,
      timestamp: Date.now(),
      intent,
      quickActions,
      activeMode,
      reasoning,
      safetyAssessment: safetyAssessment.level !== 'safe' ? safetyAssessment : undefined,
      costMetrics: {
        modelTier: routingDecision.tier,
        estimatedInputTokens: budgetResult.finalTokens,
        estimatedOutputTokens: outputTokens,
        wasCompressed: budgetResult.wasCompressed,
        conversationCompressed: compressed.tokensSaved > 0,
        memoriesUsed,
      },
    };
  } catch (error) {
    if (!__DEV__) {
      const quickActions = selectQuickActions(detectedMode, reasoning, companionContextSummary);
      return {
        content: 'Companion is temporarily unavailable. Please try again later.',
        timestamp: Date.now(),
        intent: INTENT_BY_MODE[detectedMode] ?? 'general',
        quickActions,
        activeMode,
        reasoning,
        safetyAssessment: safetyAssessment.level !== 'safe' ? safetyAssessment : undefined,
      };
    }
    console.log('[CompanionAI] AI generation failed, using development contextual response:', error);
    const fallback = generateFallbackResponse(userMessage, detectedMode, reasoning, activeMode);
    if (safetyAssessment.level !== 'safe') {
      fallback.safetyAssessment = safetyAssessment;
    }
    return fallback;
  }
}

function selectQuickActions(mode: CompanionMode, reasoning: ReasoningOutput, context?: CompanionContextSummary): string[] {
  const baseActions = QUICK_ACTIONS_BY_MODE[mode] ?? ['Ground me', 'Journal this', 'Show coping tools'];

  if (reasoning.urgencyLevel === 'crisis') {
    return ['Ground me', 'Safety mode'];
  }

  if (reasoning.urgencyLevel === 'high') {
    return ['Ground me', 'Safety mode', 'Slow this down'];
  }

  if (reasoning.relationshipContext) {
    const relActions = ["Don't Send It", 'Slow this down'];
    const merged = [...new Set([...relActions, ...baseActions])];
    return merged.slice(0, 3);
  }

  return baseActions.slice(0, 4);
}

function generateFallbackResponse(
  _userMessage: string,
  mode: CompanionMode,
  reasoning: ReasoningOutput,
  activeMode: AIMode,
): CompanionAIResponse {
  console.log('[CompanionAI] Generating fallback response');

  let content: string;

  if (reasoning.urgencyLevel === 'crisis') {
    content = `This feels like too much to hold alone right now.\n\nTake one slow breath with me: in through your nose, out through your mouth.\n\nIf you're in danger or might hurt yourself, please contact local emergency services now. ${getPrimaryCrisisResourceText()}`;
  } else if (reasoning.urgencyLevel === 'high') {
    content = `This feels urgent and loud, like your whole system wants an answer immediately.\n\nThe urgency matters, but it does not have to choose your next move.\n\nWhat feels most urgent right now: texting, leaving, arguing, shutting down, or getting reassurance?`;
  } else if (reasoning.userEmotion === 'abandonment fear') {
    content = `💙 I can see why this would hit you.\n\nWhen the fear is “I’m being left,” waiting can feel less like waiting and more like danger. The urge to text, check, or push may be your mind trying to end uncertainty fast.\n\nWhat were you afraid would happen next?`;
  } else if (reasoning.userEmotion === 'shame') {
    content = `🫶 That sounds heavy, especially if the feeling is turning inward.\n\nShame can make one moment feel like proof of who you are. I want to slow down the jump from “something happened” to “I am the problem.”\n\nWhat exactly happened right before the shame hit?`;
  } else if (mode === 'relationship') {
    content = `Before reacting, let’s start with facts.\n\nThe specific event matters: what they did, what you noticed, and what happened next.\n\nWas it a delay, a tone change, a short reply, no reply, or something they said?`;
  } else if (mode === 'clarity') {
    content = `A few things are tangled together, which makes it hard to trust your read of the situation.\n\nWe only need one concrete starting point.\n\nWhat happened right before this started?`;
  } else if (mode === 'post_conflict_repair') {
    content = `That after-feeling can be heavy.\n\nThe conflict may be over, but something is still sitting on you. After conflict, shame can blur “I regret what happened” into “I am the problem.” Those are not the same.\n\nWhat part are you replaying most?`;
  } else if (mode === 'insight_review') {
    content = `You’re trying to understand the pattern, not just get through the moment.\n\nStart with the repeatable part: what happened, what emotion showed up, and what you usually do next.\n\nWhat usually happens first when this pattern starts?`;
  } else {
    content = guardConcreteResponse(
      `💙 I want to stay with the exact thing you named.\n\nThe most useful clue is usually the behavior, urge, or concrete event.\n\nWhat happened right before this started?`,
      _userMessage,
    );
  }

  const quickActions = selectQuickActions(mode, reasoning);
  const intent = INTENT_BY_MODE[mode] ?? 'general';

  return {
    content,
    timestamp: Date.now(),
    intent,
    quickActions,
    activeMode,
    reasoning,
  };
}

export function __devSmokeGenerateCompanionFallback(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  const reasoning: ReasoningOutput = {
    userEmotion: lower.includes('empty') ? 'emptiness' : 'uncertainty',
    userInterpretation: '',
    alternativeExplanations: [],
    relevantPastContext: '',
    relationshipContext: '',
    bestApproach: '',
    suggestedQuestion: '',
    urgencyLevel: 'low',
    responseGuidance: '',
    inferredNeed: 'understanding' as ReasoningOutput['inferredNeed'],
    inferredCoreEmotion: lower.includes('empty') ? 'emptiness' : 'uncertainty',
    responseTone: 'curious' as ReasoningOutput['responseTone'],
    shouldUseMemory: false,
    memoryReferenceHint: '',
    conversationDepth: 'opening',
    userVulnerability: 'moderate',
    repetitionWarning: false,
    specificResponseAnchors: [],
  };

  return generateFallbackResponse(userMessage, 'reflection', reasoning, 'reflection').content;
}
