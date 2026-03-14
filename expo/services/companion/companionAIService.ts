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

const QUICK_ACTIONS_BY_MODE: Record<CompanionMode, string[]> = {
  calm: ['Ground me', 'Safety mode'],
  reflection: ['Journal this', 'Show coping tools', 'Reflection'],
  clarity: ['Journal this', 'Slow this down'],
  relationship: ['Help me rewrite a message', 'Slow this down', 'Journal this'],
  action: ['Ground me', 'Show coping tools', 'Help me rewrite a message'],
  high_distress: ['Ground me', 'Safety mode'],
  post_conflict_repair: ['Journal this', 'Slow this down', 'Reflection'],
  insight_review: ['Journal this', 'Show coping tools'],
  coaching: ['Ground me', 'Show coping tools', 'Journal this'],
};

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
}

function buildFullSystemPrompt(
  detectedMode: CompanionMode,
  assembledContext: AssembledContext,
  reasoning: ReasoningOutput,
  memoryProfile: MemoryProfile,
  activeMode: AIMode,
  responseLengthRule: string,
): string {
  const basePrompt = buildCompanionSystemPrompt(detectedMode, assembledContext);
  const modePrompt = buildModeSystemPrompt(activeMode);
  const reasoningSection = buildReasoningPromptSection(reasoning);

  const personalContext = buildPersonalContextSection(memoryProfile);

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

  parts.push('');
  parts.push(`CRITICAL RESPONSE RULES:
- Respond DIRECTLY to what the user said. Do NOT give a generic response.
- If the user shares a specific situation, respond to THAT situation specifically — name the people, the actions, the context they described.
- If the user answers a question you asked, ENGAGE WITH THEIR ANSWER first. Do not ignore it and ask a new question.
- Reference specific words or phrases the user used to show you are truly listening. If they said "it feels like being erased", use that phrase back.
- Do NOT start every response with "I hear you" or "That makes sense" or "That sounds" — vary your openings every single time.
- Use the user's own language and emotional vocabulary when reflecting back. If they say "freaking out", don't translate to "experiencing distress."
- If you have memory context about this user, weave in ONE relevant reference naturally — do not dump all memories at once.
- Never list multiple coping tools at once. Suggest ONE specific thing tied to their current situation.
- Vary your endings: sometimes a question, sometimes a reflection, sometimes a practical suggestion, sometimes just sitting with what was said.
- Be specific, not generic. "That fear of being forgotten when they don't reply" is better than "That feeling of abandonment."
- When the user shares something vulnerable, validate the vulnerability before moving to solutions or questions.
- Name the emotion underneath the emotion: anger often hides hurt, numbness often hides overwhelm, people-pleasing often hides fear of abandonment.
- When appropriate, gently suggest ONE tool: journaling, grounding, message rewrite, or a DBT skill — but only when it fits naturally.
- If you notice a pattern repeating across the conversation, name it gently: "I notice this keeps coming back to..."
- ${responseLengthRule}`);

  return parts.join('\n');
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

  let systemPrompt = buildFullSystemPrompt(
    detectedMode,
    assembledContext,
    reasoning,
    memoryProfile,
    activeMode,
    responseLengthRule,
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

    const quickActions = selectQuickActions(detectedMode, reasoning);
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
    console.log('[CompanionAI] AI generation failed, falling back to contextual response:', error);
    const fallback = generateFallbackResponse(userMessage, detectedMode, reasoning, activeMode);
    if (safetyAssessment.level !== 'safe') {
      fallback.safetyAssessment = safetyAssessment;
    }
    return fallback;
  }
}

function selectQuickActions(mode: CompanionMode, reasoning: ReasoningOutput): string[] {
  const baseActions = QUICK_ACTIONS_BY_MODE[mode] ?? ['Ground me', 'Journal this', 'Show coping tools'];

  if (reasoning.urgencyLevel === 'crisis') {
    return ['Ground me', 'Safety mode'];
  }

  if (reasoning.urgencyLevel === 'high') {
    return ['Ground me', 'Safety mode', 'Slow this down'];
  }

  if (reasoning.relationshipContext) {
    const relActions = ['Help me rewrite a message', 'Slow this down'];
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
    content = "I'm here with you right now. Let's take one breath together — in through your nose, slowly out through your mouth.\n\nYou don't have to handle everything in this moment. If you're in danger, please reach out to the 988 Suicide & Crisis Lifeline by calling or texting 988.";
  } else if (reasoning.urgencyLevel === 'high') {
    content = `I can feel how intense this is right now. Let's slow everything down.\n\nFirst, just notice your feet on the ground. Press them down gently. You're here, you're breathing.\n\nWhat feels like the most urgent thing right now?`;
  } else if (reasoning.userEmotion === 'abandonment fear') {
    content = `That fear of being left or forgotten — it's one of the most painful things to sit with. And it makes sense that you'd feel it right now.\n\nCan you tell me what specifically triggered this feeling? Sometimes naming the exact moment helps us see what our mind is reacting to.`;
  } else if (reasoning.userEmotion === 'shame') {
    content = `Shame is so heavy because it tells us we ARE the problem, not that we HAVE a problem. But that's the shame talking, not the truth.\n\nYou're here, sharing this — that takes real courage. What happened that brought this feeling up?`;
  } else if (mode === 'relationship') {
    content = `When relationships activate us, everything can feel urgent — like we need to act right now. But that urgency is usually the emotion talking, not the situation.\n\nLet's slow this down. What happened, and what is your mind telling you it means?`;
  } else if (mode === 'clarity') {
    content = `There are a few things tangled together here. Let's separate them.\n\nThere's what happened, what your mind is telling you it means, and what you're feeling about the story your mind built. Which piece feels heaviest right now?`;
  } else if (mode === 'post_conflict_repair') {
    content = `After conflict, the shame can hit harder than the conflict itself. It tells you that you ARE the mistake, not that you MADE one. Those aren't the same thing.\n\nWhat happened, and what part of it is sitting heaviest with you right now?`;
  } else if (mode === 'insight_review') {
    content = `I've been paying attention to what you've shared over time, and there are some patterns worth looking at together.\n\nWould you like to explore what I've noticed, or is there a specific pattern you've been seeing on your own?`;
  } else {
    content = `Something about what you're describing carries real weight — even if it's hard to pin down exactly why.\n\nIf you had to name the one part of this that your mind keeps circling back to, what would it be?`;
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
