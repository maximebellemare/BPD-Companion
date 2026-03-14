import {
  CompanionMemoryStore,
  UserPsychProfile,
  WeeklyCompanionInsight,
  MemoryRetrievalContext,
  RetrievedMemoryContext,
  EnhancedCompanionMemoryStore,
} from '@/types/companionMemory';
import { MemoryProfile } from '@/types/memory';
import { retrieveRankedMemories } from './memoryRankingService';
import { buildProfileContext } from './userPsychProfile';
import { detectEmotionalState } from './memoryService';
import { buildConversationTags } from '@/services/ai/aiPromptBuilder';
import { CompanionPatternInsight } from './patternInsightService';
import { estimateTokens } from '@/services/ai/tokenBudgetService';

export interface AssembledContext {
  memoryNarrative: string;
  profileNarrative: string;
  patternNarrative: string;
  weeklyNarrative: string;
  fullContext: string;
  liveContextNarrative: string;
  retrievedMemories: RetrievedMemoryContext | null;
  emotionalState: string;
  relevantInsights: CompanionPatternInsight[];
  suggestedApproach: string;
}

export function assembleCompanionContext(params: {
  userMessage: string;
  memoryStore: CompanionMemoryStore | null;
  enhancedMemoryStore?: EnhancedCompanionMemoryStore | null;
  psychProfile: UserPsychProfile | null;
  memoryProfile: MemoryProfile;
  patternInsights: CompanionPatternInsight[];
  weeklyInsights: WeeklyCompanionInsight[];
  conversationHistory?: Array<{ role: string; content: string }>;
  conversationId?: string;
}): AssembledContext {
  const {
    userMessage,
    memoryStore,
    enhancedMemoryStore,
    psychProfile,
    memoryProfile,
    patternInsights,
    weeklyInsights,
    conversationHistory,
    conversationId,
  } = params;

  console.log('[ContextAssembler] Assembling context for message:', userMessage.substring(0, 50));

  let memoryNarrative = '';
  let retrievedMemories: RetrievedMemoryContext | null = null;
  const emotionalState = detectEmotionalState(userMessage);

  if (memoryStore) {
    const retrievalContext: MemoryRetrievalContext = {
      currentTrigger: memoryProfile.topTriggers[0]?.label,
      currentEmotion: memoryProfile.topEmotions[0]?.label,
      currentState: emotionalState,
      conversationTags: buildConversationTags(userMessage),
      recentMessageContent: userMessage,
      conversationId,
    };
    retrievedMemories = retrieveRankedMemories(memoryStore, retrievalContext, 400, enhancedMemoryStore ?? undefined);
    memoryNarrative = retrievedMemories.contextNarrative;
  }

  let profileNarrative = '';
  if (psychProfile) {
    profileNarrative = buildProfileContext(psychProfile);
  }

  const relevantInsights = selectRelevantInsights(patternInsights, userMessage, emotionalState);
  const patternNarrative = buildPatternNarrative(relevantInsights);

  const weeklyNarrative = buildWeeklyNarrative(weeklyInsights);

  const suggestedApproach = determineSuggestedApproach(
    emotionalState,
    retrievedMemories,
    psychProfile,
    conversationHistory,
  );

  const contextParts = [
    memoryNarrative,
    profileNarrative,
    patternNarrative,
    weeklyNarrative,
    suggestedApproach ? `[Suggested approach: ${suggestedApproach}]` : '',
  ].filter(Boolean);

  const fullContext = contextParts.join('\n\n');

  const contextTokens = estimateTokens(fullContext);
  console.log('[ContextAssembler] Assembled context length:', fullContext.length, 'chars,', contextTokens, 'tokens, relevant insights:', relevantInsights.length);

  return {
    memoryNarrative,
    profileNarrative,
    patternNarrative,
    weeklyNarrative,
    fullContext,
    liveContextNarrative: '',
    retrievedMemories,
    emotionalState,
    relevantInsights,
    suggestedApproach,
  };
}

function selectRelevantInsights(
  insights: CompanionPatternInsight[],
  message: string,
  emotionalState: string,
): CompanionPatternInsight[] {
  const lower = message.toLowerCase();
  const scored = insights.map(insight => {
    let score = 0;

    if (insight.importance === 'high') score += 2;
    if (insight.importance === 'medium') score += 1;

    if (emotionalState === 'relationship_trigger' && insight.category === 'relationship') score += 3;
    if (emotionalState === 'abandonment_fear' && insight.category === 'relationship') score += 3;
    if (emotionalState === 'high_distress' && insight.category === 'coping') score += 2;

    const narrativeWords = insight.narrative.toLowerCase().split(/\s+/);
    const messageWords = lower.split(/\s+/);
    const overlap = narrativeWords.filter(w => messageWords.includes(w) && w.length > 3).length;
    score += Math.min(overlap, 3);

    return { insight, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(s => s.insight);
}

function buildPatternNarrative(insights: CompanionPatternInsight[]): string {
  if (insights.length === 0) return '';

  const parts = ['[Relevant Pattern Insights]'];
  for (const insight of insights) {
    parts.push(`- ${insight.title}: ${insight.narrative}`);
  }
  return parts.join('\n');
}

function buildWeeklyNarrative(weeklyInsights: WeeklyCompanionInsight[]): string {
  if (weeklyInsights.length === 0) return '';

  const latest = weeklyInsights[0];
  const isRecent = Date.now() - latest.generatedAt < 10 * 24 * 60 * 60 * 1000;
  if (!isRecent) return '';

  const parts = ['[This Week\'s Summary]'];
  parts.push(latest.summary);

  if (latest.growthSignals.length > 0) {
    parts.push(`Growth: ${latest.growthSignals[0]}`);
  }
  if (latest.helpfulStrategies.length > 0) {
    parts.push(`Helpful: ${latest.helpfulStrategies[0]}`);
  }

  return parts.join('\n');
}

function determineSuggestedApproach(
  emotionalState: string,
  retrieved: RetrievedMemoryContext | null,
  profile: UserPsychProfile | null,
  history?: Array<{ role: string; content: string }>,
): string {
  const approaches: string[] = [];

  if (emotionalState === 'high_distress') {
    approaches.push('Use very short, calm responses. One step at a time. Ground first.');
    if (retrieved?.suggestedCoping && retrieved.suggestedCoping.length > 0) {
      approaches.push(`Previously helpful: ${retrieved.suggestedCoping[0]}.`);
    }
    return approaches.join(' ');
  }

  if (emotionalState === 'abandonment_fear') {
    approaches.push('Validate the fear. Use soft language like "seems" and "may." Avoid dismissing.');
    if (profile?.relationshipStyle === 'abandonment-sensitive') {
      approaches.push('This is a known pattern for this user. Reference gently.');
    }
  }

  if (emotionalState === 'post_conflict_reflection') {
    approaches.push('Support reflection. Avoid blame. Focus on what the user learned or could do differently.');
  }

  if (emotionalState === 'communication_anxiety') {
    approaches.push('Help slow down messaging urge. Encourage pause before sending.');
    if (profile?.communicationPatterns.some(p => p.includes('pause'))) {
      approaches.push('User is developing pause skills - reinforce this.');
    }
  }

  if (retrieved?.patternWarning) {
    approaches.push(`Note: ${retrieved.patternWarning}`);
  }

  if (history && history.length > 6) {
    approaches.push('This is a longer conversation. Consider offering a summary or next step.');
  }

  return approaches.join(' ');
}
