import { AssembledContext } from './contextAssembler';
import { CompanionMode } from '@/types/companionModes';
import { EmotionalState } from '@/types/companionMemory';

export type InferredNeed =
  | 'validation'
  | 'understanding'
  | 'advice'
  | 'calming'
  | 'help_responding'
  | 'pattern_insight'
  | 'reassurance'
  | 'containment'
  | 'clarity'
  | 'self_compassion'
  | 'reality_check'
  | 'connection'
  | 'permission'
  | 'normalization';

export type ResponseTone =
  | 'grounding'
  | 'curious'
  | 'warm_direct'
  | 'reflective'
  | 'structured'
  | 'compassionate'
  | 'steadying';

export interface ReasoningOutput {
  userEmotion: string;
  userInterpretation: string;
  alternativeExplanations: string[];
  relevantPastContext: string;
  relationshipContext: string;
  bestApproach: string;
  suggestedQuestion: string;
  urgencyLevel: 'low' | 'moderate' | 'high' | 'crisis';
  responseGuidance: string;
  inferredNeed: InferredNeed;
  inferredCoreEmotion: string;
  responseTone: ResponseTone;
  shouldUseMemory: boolean;
  memoryReferenceHint: string;
  conversationDepth: 'opening' | 'exploring' | 'deepening' | 'closing';
  userVulnerability: 'low' | 'moderate' | 'high';
  repetitionWarning: boolean;
  specificResponseAnchors: string[];
}

export function performReasoning(params: {
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  assembledContext: AssembledContext;
  detectedMode: CompanionMode;
  emotionalState: EmotionalState;
}): ReasoningOutput {
  const { userMessage, conversationHistory, assembledContext, detectedMode, emotionalState } = params;
  const lower = userMessage.toLowerCase();

  console.log('[ReasoningEngine] Analyzing message:', userMessage.substring(0, 60), 'mode:', detectedMode, 'state:', emotionalState);

  const userEmotion = inferPrimaryEmotion(lower, emotionalState);
  const inferredCoreEmotion = inferCoreEmotion(lower, userEmotion);
  const userInterpretation = inferUserInterpretation(lower, conversationHistory);
  const inferredNeed = inferUserNeed(lower, conversationHistory, emotionalState, detectedMode);
  const alternativeExplanations = generateAlternativeExplanations(lower, userInterpretation);
  const relevantPastContext = extractRelevantPastContext(assembledContext);
  const relationshipContext = extractRelationshipContext(lower, assembledContext);
  const urgencyLevel = assessUrgency(lower, emotionalState);
  const responseTone = selectResponseTone(detectedMode, urgencyLevel, inferredNeed);
  const conversationDepth = assessConversationDepth(conversationHistory);
  const userVulnerability = assessVulnerability(lower, emotionalState, conversationHistory);
  const shouldUseMemory = determineShouldUseMemory(assembledContext, conversationDepth);
  const memoryReferenceHint = buildMemoryReferenceHint(assembledContext, lower);
  const repetitionWarning = detectRepetitionRisk(conversationHistory);
  const specificResponseAnchors = extractResponseAnchors(userMessage, conversationHistory);
  const bestApproach = determineBestApproach(detectedMode, urgencyLevel, userEmotion, conversationHistory, inferredNeed, conversationDepth);
  const suggestedQuestion = generateSuggestedQuestion(detectedMode, userEmotion, conversationHistory, inferredNeed, conversationDepth);

  const responseGuidance = buildResponseGuidance({
    userEmotion,
    inferredCoreEmotion,
    userInterpretation,
    alternativeExplanations,
    relevantPastContext,
    relationshipContext,
    urgencyLevel,
    bestApproach,
    suggestedQuestion,
    detectedMode,
    conversationHistory,
    inferredNeed,
    responseTone,
    conversationDepth,
    userVulnerability,
    shouldUseMemory,
    memoryReferenceHint,
    repetitionWarning,
    specificResponseAnchors,
  });

  console.log('[ReasoningEngine] Reasoning complete - emotion:', userEmotion, 'need:', inferredNeed, 'urgency:', urgencyLevel, 'depth:', conversationDepth);

  return {
    userEmotion,
    userInterpretation,
    alternativeExplanations,
    relevantPastContext,
    relationshipContext,
    bestApproach,
    suggestedQuestion,
    urgencyLevel,
    responseGuidance,
    inferredNeed,
    inferredCoreEmotion,
    responseTone,
    shouldUseMemory,
    memoryReferenceHint,
    conversationDepth,
    userVulnerability,
    repetitionWarning,
    specificResponseAnchors,
  };
}

function inferPrimaryEmotion(lower: string, emotionalState: EmotionalState): string {
  const emotionMap: Array<{ keywords: string[]; emotion: string }> = [
    { keywords: ['terrified', 'scared', 'afraid', 'fear', 'panic', 'dread'], emotion: 'fear' },
    { keywords: ['furious', 'rage', 'angry', 'pissed', 'hate', 'mad'], emotion: 'anger' },
    { keywords: ['ashamed', 'shame', 'pathetic', 'worthless', 'disgusted with myself'], emotion: 'shame' },
    { keywords: ['abandoned', 'left me', 'leaving', 'no one cares', 'alone', 'forgotten'], emotion: 'abandonment fear' },
    { keywords: ['sad', 'crying', 'hopeless', 'depressed', 'empty', 'numb', 'hollow'], emotion: 'sadness' },
    { keywords: ['anxious', 'anxiety', 'worry', 'nervous', 'on edge', 'restless'], emotion: 'anxiety' },
    { keywords: ['overwhelmed', 'too much', 'can\'t handle', 'drowning', 'spiraling'], emotion: 'overwhelm' },
    { keywords: ['confused', 'don\'t know', 'can\'t tell', 'mixed up', 'lost'], emotion: 'confusion' },
    { keywords: ['guilty', 'fault', 'shouldn\'t have', 'messed up', 'ruined'], emotion: 'guilt' },
    { keywords: ['jealous', 'jealousy', 'envious'], emotion: 'jealousy' },
    { keywords: ['hurt', 'pain', 'wounded', 'betrayed', 'broken'], emotion: 'emotional pain' },
    { keywords: ['disrespect', 'disrespected', 'taken for granted', 'used'], emotion: 'feeling devalued' },
    { keywords: ['trapped', 'stuck', 'no way out', 'suffocating'], emotion: 'feeling trapped' },
    { keywords: ['invisible', 'unseen', 'don\'t matter', 'irrelevant'], emotion: 'feeling invisible' },
    { keywords: ['miss', 'missing', 'longing', 'ache for'], emotion: 'longing' },
  ];

  for (const { keywords, emotion } of emotionMap) {
    if (keywords.some(k => lower.includes(k))) return emotion;
  }

  if (emotionalState === 'high_distress') return 'intense distress';
  if (emotionalState === 'abandonment_fear') return 'abandonment fear';
  if (emotionalState === 'relationship_trigger') return 'relationship activation';
  if (emotionalState === 'emotional_overwhelm') return 'overwhelm';
  if (emotionalState === 'communication_anxiety') return 'communication anxiety';
  if (emotionalState === 'identity_confusion') return 'identity confusion';
  if (emotionalState === 'recent_conflict') return 'post-conflict distress';

  return 'unspecified emotional distress';
}

function inferCoreEmotion(lower: string, surfaceEmotion: string): string {
  if (surfaceEmotion === 'anger') {
    if (lower.includes('hurt') || lower.includes('pain')) return 'hurt underneath anger';
    if (lower.includes('unfair') || lower.includes('deserve')) return 'unmet need for fairness';
    if (lower.includes('ignore') || lower.includes('dismiss')) return 'feeling unseen';
    return 'boundary violation or unmet need';
  }
  if (surfaceEmotion === 'abandonment fear') {
    if (lower.includes('reply') || lower.includes('respond') || lower.includes('text')) return 'fear of disconnection through silence';
    if (lower.includes('leave') || lower.includes('go')) return 'attachment threat';
    return 'deep need for secure connection';
  }
  if (surfaceEmotion === 'shame') {
    return 'painful self-evaluation — shame says "I am the problem"';
  }
  if (surfaceEmotion === 'guilt') {
    return 'conflict between actions and values';
  }
  if (surfaceEmotion === 'feeling devalued') {
    return 'unmet need for respect and recognition';
  }
  if (surfaceEmotion === 'overwhelm') {
    return 'emotional system overloaded — too many signals at once';
  }
  return surfaceEmotion;
}

function inferUserNeed(
  lower: string,
  history: Array<{ role: string; content: string }>,
  emotionalState: EmotionalState,
  mode: CompanionMode,
): InferredNeed {
  if (lower.includes('am i overreacting') || lower.includes('am i crazy') || lower.includes('am i wrong') || lower.includes('too sensitive') || lower.includes('too much')) {
    return 'normalization';
  }
  if (lower.includes('is it okay') || lower.includes('is it normal') || lower.includes('allowed to')) {
    return 'permission';
  }
  if (lower.includes('what should i') || lower.includes('how do i') || lower.includes('help me respond') || lower.includes('what do i say')) {
    return 'advice';
  }
  if (lower.includes('calm') || lower.includes('breathe') || lower.includes('ground') || lower.includes('panic') || lower.includes('spiraling')) {
    return 'calming';
  }
  if (lower.includes('pattern') || lower.includes('why do i always') || lower.includes('keep doing') || lower.includes('notice')) {
    return 'pattern_insight';
  }
  if (lower.includes('help me understand') || lower.includes('what does it mean') || lower.includes('why did')) {
    return 'understanding';
  }
  if (lower.includes('do they care') || lower.includes('do they love') || lower.includes('am i enough') || lower.includes('will they leave')) {
    return 'reassurance';
  }
  if (lower.includes('what should i text') || lower.includes('help me write') || lower.includes('rewrite') || lower.includes('how to respond')) {
    return 'help_responding';
  }

  if (emotionalState === 'high_distress') return 'containment';
  if (emotionalState === 'post_conflict_reflection') return 'self_compassion';
  if (emotionalState === 'identity_confusion') return 'clarity';

  if (mode === 'calm' || mode === 'high_distress') return 'calming';
  if (mode === 'relationship') return 'understanding';
  if (mode === 'clarity') return 'clarity';
  if (mode === 'insight_review') return 'pattern_insight';
  if (mode === 'post_conflict_repair') return 'self_compassion';
  if (mode === 'coaching') return 'advice';

  const recentUser = history.filter(m => m.role === 'user').slice(-2);
  if (recentUser.length > 0) {
    const recent = recentUser.map(m => m.content.toLowerCase()).join(' ');
    if (recent.includes('i just need') || recent.includes('i want someone to')) return 'validation';
  }

  return 'validation';
}

function inferUserInterpretation(lower: string, history: Array<{ role: string; content: string }>): string {
  if (lower.includes('they don\'t care') || lower.includes('doesn\'t care')) {
    return 'The user believes someone important to them does not care about them.';
  }
  if (lower.includes('my fault') || lower.includes('i ruined') || lower.includes('i messed up')) {
    return 'The user is blaming themselves for a situation.';
  }
  if (lower.includes('overreacting') || lower.includes('too much') || lower.includes('too sensitive')) {
    return 'The user is questioning whether their emotional response is valid.';
  }
  if (lower.includes('always') || lower.includes('never') || lower.includes('every time')) {
    return 'The user is using absolute thinking patterns, seeing this as part of a permanent pattern.';
  }
  if (lower.includes('hate myself') || lower.includes('worthless') || lower.includes('pathetic')) {
    return 'The user is directing intense negative judgment inward.';
  }
  if (lower.includes('no point') || lower.includes('nothing matters') || lower.includes('give up')) {
    return 'The user is experiencing hopelessness about their situation or future.';
  }
  if (lower.includes('can\'t trust') || lower.includes('everyone leaves') || lower.includes('always end up alone')) {
    return 'The user is generalizing a painful experience into a permanent belief about relationships.';
  }
  if (lower.includes('disrespect') || lower.includes('doesn\'t respect') || lower.includes('taken for granted')) {
    return 'The user feels their boundaries or worth are not being honored.';
  }
  if (lower.includes('they\'re pulling away') || lower.includes('distance') || lower.includes('cold') || lower.includes('different lately')) {
    return 'The user is interpreting behavioral changes as emotional withdrawal.';
  }
  if (lower.includes('testing me') || lower.includes('on purpose') || lower.includes('trying to hurt')) {
    return 'The user is interpreting actions as intentionally harmful.';
  }

  const recentUser = history.filter(m => m.role === 'user').slice(-3);
  if (recentUser.length > 1) {
    const allRecent = recentUser.map(m => m.content.toLowerCase()).join(' ');
    if (allRecent.includes('again') || allRecent.includes('keep happening')) {
      return 'The user sees a repeating pattern and may feel stuck in a cycle.';
    }
  }

  return 'The user is sharing an emotional experience and seeking support.';
}

function generateAlternativeExplanations(lower: string, _interpretation: string): string[] {
  const alternatives: string[] = [];

  if (lower.includes('they don\'t care') || lower.includes('doesn\'t care') || lower.includes('ignoring')) {
    alternatives.push('The other person may be dealing with their own stress or distractions unrelated to the user.');
    alternatives.push('A delayed response might reflect the person\'s communication style, not their feelings.');
    alternatives.push('The user might be reading absence as rejection because of past experiences.');
  }

  if (lower.includes('my fault') || lower.includes('i ruined')) {
    alternatives.push('Conflict involves multiple people — responsibility is rarely entirely one-sided.');
    alternatives.push('Making a mistake in a difficult moment does not define the user as a person.');
    alternatives.push('The shame may be making the situation feel bigger than it actually is.');
  }

  if (lower.includes('overreacting') || lower.includes('too sensitive')) {
    alternatives.push('The intensity of the reaction may be proportional to past experiences, not just the current situation.');
    alternatives.push('Emotional sensitivity can also be a strength — it reflects deep capacity for feeling.');
    alternatives.push('Asking "am I overreacting" is itself a sign of self-awareness.');
  }

  if (lower.includes('always') || lower.includes('never') || lower.includes('every time')) {
    alternatives.push('When emotions are high, patterns can feel more absolute than they actually are.');
    alternatives.push('There may be exceptions to this pattern that are harder to see right now.');
  }

  if (lower.includes('disrespect') || lower.includes('taken for granted')) {
    alternatives.push('The other person may not realize the impact of their behavior.');
    alternatives.push('What feels like disrespect might be carelessness rather than intentional disregard.');
  }

  if (lower.includes('pulling away') || lower.includes('distance') || lower.includes('cold')) {
    alternatives.push('People sometimes need space for reasons unrelated to the relationship.');
    alternatives.push('Withdrawal might be their own stress response, not a reflection of their feelings.');
  }

  if (alternatives.length === 0) {
    alternatives.push('There may be more to this situation than what is visible in the current emotional state.');
  }

  return alternatives.slice(0, 3);
}

function extractRelevantPastContext(assembled: AssembledContext): string {
  const parts: string[] = [];

  if (assembled.retrievedMemories) {
    const { relevantEpisodes, relevantTraits, suggestedCoping, patternWarning } = assembled.retrievedMemories;

    if (relevantEpisodes.length > 0) {
      const ep = relevantEpisodes[0];
      parts.push(`The user experienced a similar situation before (trigger: "${ep.trigger}", emotion: "${ep.emotion}"${ep.lesson ? `, lesson learned: "${ep.lesson}"` : ''}).`);
    }

    if (relevantTraits.length > 0) {
      const traitDescriptions = relevantTraits
        .filter(t => t.confidence >= 0.3)
        .slice(0, 3)
        .map(t => `"${t.trait}" (observed ${t.observationCount} times)`);
      if (traitDescriptions.length > 0) {
        parts.push(`Known user patterns: ${traitDescriptions.join(', ')}.`);
      }
    }

    if (suggestedCoping.length > 0) {
      parts.push(`Previously helpful coping tools: ${suggestedCoping.join(', ')}.`);
    }

    if (patternWarning) {
      parts.push(`Pattern alert: ${patternWarning}`);
    }
  }

  if (assembled.relevantInsights.length > 0) {
    const topInsight = assembled.relevantInsights[0];
    parts.push(`Relevant pattern insight: ${topInsight.narrative}`);
  }

  return parts.join(' ');
}

function extractRelationshipContext(lower: string, assembled: AssembledContext): string {
  const isRelationshipTopic = lower.includes('partner') || lower.includes('boyfriend') || lower.includes('girlfriend') ||
    lower.includes('husband') || lower.includes('wife') || lower.includes('friend') ||
    lower.includes('relationship') || lower.includes('text') || lower.includes('message') ||
    lower.includes('fight') || lower.includes('conflict') || lower.includes('abandon');

  if (!isRelationshipTopic) return '';

  const parts: string[] = ['This involves a relationship situation.'];

  if (assembled.profileNarrative) {
    if (assembled.profileNarrative.includes('abandonment-sensitive')) {
      parts.push('The user tends to be sensitive to abandonment cues.');
    }
    if (assembled.profileNarrative.includes('conflict-avoidant')) {
      parts.push('The user tends to avoid conflict, which may lead to suppressed needs.');
    }
    if (assembled.profileNarrative.includes('reassurance-seeking')) {
      parts.push('The user often seeks reassurance in relationships.');
    }
  }

  return parts.join(' ');
}

function assessUrgency(lower: string, emotionalState: EmotionalState): 'low' | 'moderate' | 'high' | 'crisis' {
  const crisisWords = ['want to die', 'kill myself', 'hurt myself', 'self harm', 'ending it', 'can\'t take it anymore'];
  if (crisisWords.some(w => lower.includes(w))) return 'crisis';

  if (emotionalState === 'high_distress') return 'high';

  const highUrgencyWords = ['spiraling', 'can\'t breathe', 'losing control', 'can\'t stop', 'falling apart', 'desperate'];
  if (highUrgencyWords.some(w => lower.includes(w))) return 'high';

  const moderateWords = ['overwhelmed', 'anxious', 'panicking', 'scared', 'angry', 'ashamed', 'confused'];
  if (moderateWords.some(w => lower.includes(w))) return 'moderate';

  return 'low';
}

function selectResponseTone(mode: CompanionMode, urgency: string, need: InferredNeed): ResponseTone {
  if (urgency === 'crisis' || urgency === 'high') return 'grounding';
  if (need === 'calming' || need === 'containment') return 'steadying';
  if (need === 'self_compassion') return 'compassionate';
  if (need === 'pattern_insight') return 'reflective';
  if (need === 'advice' || need === 'help_responding') return 'structured';
  if (need === 'understanding' || need === 'clarity') return 'curious';
  if (mode === 'calm') return 'steadying';
  if (mode === 'reflection' || mode === 'insight_review') return 'reflective';
  if (mode === 'relationship') return 'warm_direct';
  return 'warm_direct';
}

function assessConversationDepth(history: Array<{ role: string; content: string }>): 'opening' | 'exploring' | 'deepening' | 'closing' {
  const userMsgCount = history.filter(m => m.role === 'user').length;
  if (userMsgCount === 0) return 'opening';
  if (userMsgCount <= 2) return 'exploring';
  if (userMsgCount <= 6) return 'deepening';
  return 'closing';
}

function assessVulnerability(lower: string, emotionalState: EmotionalState, _history: Array<{ role: string; content: string }>): 'low' | 'moderate' | 'high' {
  const highVulnerabilityWords = ['hate myself', 'worthless', 'pathetic', 'disgusting', 'unlovable', 'broken', 'can\'t do this'];
  if (highVulnerabilityWords.some(w => lower.includes(w))) return 'high';
  if (emotionalState === 'high_distress' || emotionalState === 'abandonment_fear') return 'high';
  if (emotionalState === 'post_conflict_reflection' || emotionalState === 'identity_confusion') return 'moderate';
  return 'low';
}

function determineShouldUseMemory(assembled: AssembledContext, depth: string): boolean {
  if (!assembled.retrievedMemories) return false;
  if (assembled.retrievedMemories.relevantEpisodes.length === 0 && assembled.retrievedMemories.relevantTraits.length === 0) return false;
  if (depth === 'opening') return false;
  return true;
}

function buildMemoryReferenceHint(assembled: AssembledContext, lower: string): string {
  if (!assembled.retrievedMemories) return '';
  const { relevantEpisodes, relevantTraits, relevantRelationships, relevantCopingPreferences, recentStrugglesAndWins } = assembled.retrievedMemories;

  const hints: string[] = [];

  if (relevantRelationships && relevantRelationships.length > 0) {
    for (const rel of relevantRelationships) {
      if (lower.includes(rel.name.toLowerCase()) || lower.includes(rel.relationship.toLowerCase())) {
        let hint = `The user has mentioned "${rel.name}" (${rel.relationship}) ${rel.mentionCount} times before`;
        if (rel.dynamics.length > 0) {
          hint += `. Known dynamics: ${rel.dynamics.slice(0, 2).join(', ')}`;
        }
        if (rel.recentContext) {
          hint += `. Recent context: "${rel.recentContext.substring(0, 80)}"`;
        }
        hint += '. Reference this naturally if it connects — e.g. "You\'ve mentioned this person before..." or "This seems connected to what you shared about..."';
        hints.push(hint);
        break;
      }
    }
  }

  if (relevantEpisodes.length > 0) {
    const ep = relevantEpisodes[0];
    if (lower.includes(ep.trigger.toLowerCase()) || lower.includes(ep.emotion.toLowerCase())) {
      let hint = `This feels similar to a past moment involving "${ep.trigger}"`;
      if (ep.lesson) {
        hint += `. Last time, the user realized: "${ep.lesson}"`;
      }
      hint += '. Reference gently: "This sounds like it might connect to..." or "I notice a familiar pattern here..."';
      hints.push(hint);
    }
  }

  if (recentStrugglesAndWins && recentStrugglesAndWins.length > 0) {
    const wins = recentStrugglesAndWins.filter(sw => sw.type === 'win');
    const struggles = recentStrugglesAndWins.filter(sw => sw.type === 'struggle');

    if (wins.length > 0) {
      hints.push(`Recent win to reference if encouraging: "${wins[0].description.substring(0, 80)}" — use this to remind them of their capacity.`);
    }
    if (struggles.length > 0 && lower.includes(struggles[0].emotion.toLowerCase())) {
      hints.push(`The user recently struggled with something similar: "${struggles[0].description.substring(0, 80)}" — acknowledge this gently without making them feel stuck.`);
    }
  }

  if (relevantCopingPreferences && relevantCopingPreferences.length > 0) {
    const preferred = relevantCopingPreferences.filter(cp => cp.userPreference === 'preferred');
    if (preferred.length > 0) {
      hints.push(`When suggesting coping, prioritize "${preferred[0].strategy}" — the user has found this helpful (${Math.round(preferred[0].effectiveness * 100)}% effective across ${preferred[0].timesUsed} uses).`);
    }
  }

  if (hints.length === 0 && relevantTraits.length > 0) {
    const topTrait = relevantTraits[0];
    if (topTrait.confidence >= 0.5) {
      hints.push(`The user has a known pattern: "${topTrait.trait}" — weave this naturally if relevant.`);
    }
  }

  return hints.slice(0, 3).join('\n');
}

function detectRepetitionRisk(history: Array<{ role: string; content: string }>): boolean {
  const assistantMessages = history.filter(m => m.role === 'assistant').slice(-3);
  if (assistantMessages.length < 2) return false;

  const openings = assistantMessages.map(m => m.content.substring(0, 40).toLowerCase());
  const uniqueOpenings = new Set(openings);
  return uniqueOpenings.size < openings.length;
}

function extractResponseAnchors(userMessage: string, history: Array<{ role: string; content: string }>): string[] {
  const anchors: string[] = [];

  const quotedPhrases = userMessage.match(/"([^"]+)"/g);
  if (quotedPhrases) {
    anchors.push(...quotedPhrases.slice(0, 2));
  }

  const specificPhrases = [
    /(?:they said|he said|she said) (.+?)(?:\.|$)/i,
    /(?:i feel like) (.+?)(?:\.|$)/i,
    /(?:i see it as) (.+?)(?:\.|$)/i,
    /(?:what happened was) (.+?)(?:\.|$)/i,
    /(?:the thing is) (.+?)(?:\.|$)/i,
  ];

  for (const regex of specificPhrases) {
    const match = userMessage.match(regex);
    if (match && match[1]) {
      anchors.push(match[1].trim().substring(0, 80));
    }
  }

  const lastAssistant = [...history].reverse().find(m => m.role === 'assistant');
  if (lastAssistant) {
    const questions = lastAssistant.content.match(/[^.!]*\?/g);
    if (questions && questions.length > 0) {
      anchors.push(`ANSWERING: ${questions[questions.length - 1].trim()}`);
    }
  }

  return anchors.slice(0, 4);
}

function determineBestApproach(
  mode: CompanionMode,
  urgency: 'low' | 'moderate' | 'high' | 'crisis',
  emotion: string,
  history: Array<{ role: string; content: string }>,
  need: InferredNeed,
  depth: string,
): string {
  if (urgency === 'crisis') {
    return 'Ultra-short, grounding-first. Acknowledge pain. One breath at a time. Suggest crisis resources if needed. Do NOT ask complex questions.';
  }

  if (urgency === 'high') {
    return 'Short and grounding. Validate first. One concrete step. Do not overwhelm with questions. Match the user\'s language.';
  }

  const parts: string[] = [];

  if (need === 'normalization') {
    parts.push('The user is questioning their own reactions. Normalize first, then gently explore what triggered the self-doubt.');
  } else if (need === 'permission') {
    parts.push('The user is seeking permission to feel something. Grant it clearly and warmly.');
  } else if (need === 'validation') {
    parts.push('Validate specifically — name WHAT you are validating, not just "that makes sense."');
  } else if (need === 'reassurance') {
    parts.push('Acknowledge the fear driving the need for reassurance. Do not just reassure — help the user see what is actually happening.');
  } else if (need === 'self_compassion') {
    parts.push('Lead with compassion. No analysis until the user feels held. Name that what they did was human.');
  }

  if (mode === 'calm') parts.push('Lead with grounding. Short, warm. Sensory anchoring. Minimal questions.');
  if (mode === 'reflection') parts.push('Curious and gentle. One thoughtful question. Name what you observe. Reference patterns softly.');
  if (mode === 'clarity') parts.push('Help separate feelings from facts. Organize confusion. Offer a simple framework.');
  if (mode === 'relationship') parts.push('Slow down urgency. Separate what happened from what fear predicts. Help with secure communication.');
  if (mode === 'action') parts.push('One clear, specific next step. Direct but kind. Practical and immediate.');
  if (mode === 'post_conflict_repair') parts.push('Acknowledge without blame. Process shame gently. One small repair action. Self-compassion first.');
  if (mode === 'insight_review') parts.push('Share observations from data. Use "I\'ve noticed" language. Connect patterns across time. Highlight growth.');
  if (mode === 'coaching') parts.push('Walk through a structured skill step by step. Keep each step short and actionable.');

  if (depth === 'deepening' || depth === 'closing') {
    parts.push('Build on what has already been discussed. Offer a synthesis or insight rather than asking new opening questions.');
  }

  if (history.length > 8) {
    parts.push('This is a longer conversation. Avoid repeating earlier points. Consider offering a summary or insight.');
  }

  return parts.join(' ');
}

function generateSuggestedQuestion(
  mode: CompanionMode,
  emotion: string,
  history: Array<{ role: string; content: string }>,
  need: InferredNeed,
  depth: string,
): string {
  if (mode === 'calm' || mode === 'high_distress') return '';
  if (need === 'calming' || need === 'containment') return '';

  if (depth === 'closing') {
    return 'What feels like the most important thing to take from this conversation?';
  }

  if (need === 'normalization') {
    return 'What made you start wondering if your reaction was too much?';
  }

  if (need === 'reassurance') {
    return 'What would you need to see or hear to feel more settled about this?';
  }

  if (mode === 'reflection') {
    if (emotion === 'abandonment fear') return 'What does this feeling remind you of?';
    if (emotion === 'anger') return 'Underneath the anger, is there something that feels hurt or unmet?';
    if (emotion === 'shame') return 'What would you say to someone you love who felt this way?';
    if (emotion === 'feeling devalued') return 'What exactly happened that made it feel like disrespect?';
    return 'What feels most alive in you right now?';
  }

  if (mode === 'clarity') {
    return 'If you could separate what happened from what your mind is telling you it means, what would each part look like?';
  }

  if (mode === 'relationship') {
    return 'What do you actually need from this person right now — the real need underneath the urgency?';
  }

  if (history.length > 6) {
    return 'What feels like the most important thing to take from this conversation?';
  }

  return 'What feels most urgent right now?';
}

function buildResponseGuidance(params: {
  userEmotion: string;
  inferredCoreEmotion: string;
  userInterpretation: string;
  alternativeExplanations: string[];
  relevantPastContext: string;
  relationshipContext: string;
  urgencyLevel: string;
  bestApproach: string;
  suggestedQuestion: string;
  detectedMode: CompanionMode;
  conversationHistory: Array<{ role: string; content: string }>;
  inferredNeed: InferredNeed;
  responseTone: ResponseTone;
  conversationDepth: string;
  userVulnerability: string;
  shouldUseMemory: boolean;
  memoryReferenceHint: string;
  repetitionWarning: boolean;
  specificResponseAnchors: string[];
}): string {
  const parts: string[] = [];

  parts.push(`[DEEP REASONING ANALYSIS]`);
  parts.push(`Primary emotion: ${params.userEmotion}`);
  parts.push(`Core emotion underneath: ${params.inferredCoreEmotion}`);
  parts.push(`User's interpretation: ${params.userInterpretation}`);
  parts.push(`What the user needs most: ${params.inferredNeed}`);
  parts.push(`Urgency: ${params.urgencyLevel}`);
  parts.push(`Vulnerability level: ${params.userVulnerability}`);
  parts.push(`Conversation depth: ${params.conversationDepth}`);
  parts.push(`Response tone: ${params.responseTone}`);
  parts.push(`Approach: ${params.bestApproach}`);

  if (params.alternativeExplanations.length > 0) {
    parts.push(`Alternative perspectives to gently offer (only if appropriate): ${params.alternativeExplanations.join(' | ')}`);
  }

  if (params.relevantPastContext) {
    parts.push(`Relevant past context: ${params.relevantPastContext}`);
  }

  if (params.relationshipContext) {
    parts.push(`Relationship context: ${params.relationshipContext}`);
  }

  if (params.shouldUseMemory && params.memoryReferenceHint) {
    parts.push(`Memory guidance: ${params.memoryReferenceHint}`);
  }

  if (params.suggestedQuestion) {
    parts.push(`Suggested question: ${params.suggestedQuestion}`);
  }

  if (params.specificResponseAnchors.length > 0) {
    parts.push(`IMPORTANT - Anchor your response to these specific things the user said: ${params.specificResponseAnchors.join(' | ')}`);
  }

  if (params.repetitionWarning) {
    parts.push('WARNING: Your recent responses have similar openings. Start this response differently. Vary your language.');
  }

  const userMsgCount = params.conversationHistory.filter(m => m.role === 'user').length;
  if (userMsgCount === 0) {
    parts.push('This is the first message. Prioritize warmth, validation, and showing you are listening deeply. Use the user\'s own words.');
  } else if (userMsgCount >= 4) {
    parts.push('This is a longer conversation. Avoid repeating earlier points. Build on what has been discussed. Consider offering a synthesis, insight, or gentle challenge.');
  }

  const lastAssistant = [...params.conversationHistory].reverse().find(m => m.role === 'assistant');
  if (lastAssistant) {
    const lastContent = lastAssistant.content.toLowerCase();
    if (lastContent.includes('breathe') || lastContent.includes('ground')) {
      parts.push('You just guided grounding. Check in on how they are feeling now rather than repeating grounding.');
    }
    if (lastContent.includes('?')) {
      parts.push('You asked a question in your last message. The user is likely answering it. ENGAGE WITH THEIR ANSWER before asking another question.');
    }
  }

  return parts.join('\n');
}

export function buildReasoningPromptSection(reasoning: ReasoningOutput): string {
  return reasoning.responseGuidance;
}
