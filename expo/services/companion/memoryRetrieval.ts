import {
  CompanionMemoryStore,
  EpisodicMemory,
  SemanticMemory,
  SessionSummary,
  MemoryRetrievalContext,
  RetrievedMemoryContext,
} from '@/types/companionMemory';

const MAX_RELEVANT_EPISODES = 5;
const MAX_RELEVANT_TRAITS = 5;
const MAX_RECENT_SESSIONS = 3;

function scoreEpisodicRelevance(
  memory: EpisodicMemory,
  context: MemoryRetrievalContext,
): number {
  let score = 0;

  if (context.currentTrigger && memory.trigger.toLowerCase().includes(context.currentTrigger.toLowerCase())) {
    score += 3;
  }

  if (context.currentEmotion && memory.emotion.toLowerCase().includes(context.currentEmotion.toLowerCase())) {
    score += 2;
  }

  if (context.conversationTags) {
    const matchingTags = memory.tags.filter(t =>
      context.conversationTags!.some(ct => ct.toLowerCase() === t.toLowerCase()),
    );
    score += matchingTags.length;
  }

  if (context.recentMessageContent) {
    const words = context.recentMessageContent.toLowerCase().split(/\s+/);
    const matchCount = memory.tags.filter(tag =>
      words.some(w => w.includes(tag.toLowerCase()) || tag.toLowerCase().includes(w)),
    ).length;
    score += matchCount * 0.5;
  }

  const ageHours = (Date.now() - memory.timestamp) / (60 * 60 * 1000);
  const recencyBonus = Math.max(0, 1 - ageHours / (30 * 24));
  score += recencyBonus;

  if (memory.lesson) score += 0.5;
  if (memory.copingUsed && memory.copingUsed.length > 0) score += 0.5;

  return score;
}

function scoreSemanticRelevance(
  memory: SemanticMemory,
  context: MemoryRetrievalContext,
): number {
  let score = memory.confidence * 2;

  if (context.conversationTags) {
    const matchingTags = memory.tags.filter(t =>
      context.conversationTags!.some(ct => ct.toLowerCase() === t.toLowerCase()),
    );
    score += matchingTags.length * 1.5;
  }

  if (context.recentMessageContent) {
    const lower = context.recentMessageContent.toLowerCase();
    if (lower.includes(memory.trait.toLowerCase())) {
      score += 3;
    }
  }

  score += memory.observationCount * 0.2;

  return score;
}

export function retrieveRelevantMemories(
  store: CompanionMemoryStore,
  context: MemoryRetrievalContext,
): RetrievedMemoryContext {
  console.log('[MemoryRetrieval] Retrieving memories for context:', {
    trigger: context.currentTrigger,
    emotion: context.currentEmotion,
    state: context.currentState,
    tags: context.conversationTags,
  });

  const scoredEpisodes = store.episodicMemories
    .map(m => ({ memory: m, score: scoreEpisodicRelevance(m, context) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RELEVANT_EPISODES);

  const scoredTraits = store.semanticMemories
    .map(m => ({ memory: m, score: scoreSemanticRelevance(m, context) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RELEVANT_TRAITS);

  const recentSessions = store.sessionSummaries
    .slice(0, MAX_RECENT_SESSIONS);

  const suggestedCoping = extractSuggestedCoping(scoredEpisodes.map(s => s.memory));
  const patternWarning = detectPatternWarning(store, context);
  const contextNarrative = buildContextNarrative(
    scoredEpisodes.map(s => s.memory),
    scoredTraits.map(s => s.memory),
    recentSessions,
    suggestedCoping,
    patternWarning,
  );

  console.log('[MemoryRetrieval] Found:', scoredEpisodes.length, 'episodes,', scoredTraits.length, 'traits');

  return {
    relevantEpisodes: scoredEpisodes.map(s => s.memory),
    relevantTraits: scoredTraits.map(s => s.memory),
    recentSessions,
    suggestedCoping,
    patternWarning,
    contextNarrative,
    relevantRelationships: [],
    relevantCopingPreferences: [],
    recentStrugglesAndWins: [],
    memoryReferenceNarrative: '',
  };
}

function extractSuggestedCoping(episodes: EpisodicMemory[]): string[] {
  const copingMap = new Map<string, number>();

  for (const ep of episodes) {
    if (ep.copingUsed && ep.outcome && (ep.outcome === 'helped' || ep.outcome === 'managed')) {
      for (const tool of ep.copingUsed) {
        copingMap.set(tool, (copingMap.get(tool) ?? 0) + 1);
      }
    }
  }

  return Array.from(copingMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([tool]) => tool);
}

function detectPatternWarning(
  store: CompanionMemoryStore,
  context: MemoryRetrievalContext,
): string | undefined {
  if (!context.currentTrigger) return undefined;

  const recentEpisodes = store.episodicMemories.filter(m => {
    const isRecent = Date.now() - m.timestamp < 7 * 24 * 60 * 60 * 1000;
    const matchesTrigger = m.trigger.toLowerCase().includes(context.currentTrigger!.toLowerCase());
    return isRecent && matchesTrigger;
  });

  if (recentEpisodes.length >= 3) {
    return `This trigger ("${context.currentTrigger}") has come up ${recentEpisodes.length} times in the past week. This might be a recurring pattern worth exploring.`;
  }

  if (context.currentState === 'relationship_trigger' || context.currentState === 'abandonment_fear') {
    const relEpisodes = store.episodicMemories.filter(m =>
      m.relationshipContext && Date.now() - m.timestamp < 14 * 24 * 60 * 60 * 1000,
    );
    if (relEpisodes.length >= 3) {
      return 'There has been recurring relationship stress recently. Being extra gentle with yourself right now is important.';
    }
  }

  return undefined;
}

function buildContextNarrative(
  episodes: EpisodicMemory[],
  traits: SemanticMemory[],
  sessions: SessionSummary[],
  suggestedCoping: string[],
  patternWarning?: string,
): string {
  const parts: string[] = [];

  if (episodes.length === 0 && traits.length === 0) {
    return '';
  }

  parts.push('[Companion Long-Term Memory]');

  if (traits.length > 0) {
    const highConfidence = traits.filter(t => t.confidence >= 0.3);
    if (highConfidence.length > 0) {
      parts.push(`Known patterns: ${highConfidence.map(t => `"${t.trait}" (observed ${t.observationCount}x)`).join(', ')}.`);
    }
  }

  if (episodes.length > 0) {
    const recentEp = episodes[0];
    const timeAgo = formatTimeAgo(recentEp.timestamp);
    parts.push(`Recent related experience (${timeAgo}): Trigger was "${recentEp.trigger}", felt "${recentEp.emotion}".`);

    if (recentEp.lesson) {
      parts.push(`Lesson from that experience: "${recentEp.lesson}".`);
    }

    if (recentEp.copingUsed && recentEp.copingUsed.length > 0) {
      parts.push(`Coping used then: ${recentEp.copingUsed.join(', ')}.`);
    }
  }

  if (suggestedCoping.length > 0) {
    parts.push(`Previously helpful coping tools: ${suggestedCoping.join(', ')}.`);
  }

  if (sessions.length > 0) {
    const lastSession = sessions[0];
    if (lastSession.insight) {
      parts.push(`Recent session insight: "${lastSession.insight}".`);
    }
  }

  if (patternWarning) {
    parts.push(`Pattern alert: ${patternWarning}`);
  }

  return parts.join('\n');
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
