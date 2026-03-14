import {
  CompanionMemoryStore,
  EpisodicMemory,
  SemanticMemory,
  MemoryRetrievalContext,
  RetrievedMemoryContext,
  EnhancedCompanionMemoryStore,
  RelationshipMemory,
  CopingPreference,
  StruggleWinMemory,
} from '@/types/companionMemory';
import { estimateTokens } from '@/services/ai/tokenBudgetService';
import { wasRecentlyReferenced, getRecentReferenceCount } from './memoryService';

const MAX_EPISODES = 3;
const MAX_TRAITS = 3;
const MAX_SESSIONS = 2;
const MAX_RELATIONSHIPS = 2;
const MAX_COPING = 3;
const MAX_STRUGGLES_WINS = 3;
const DEFAULT_MEMORY_TOKEN_BUDGET = 400;
const REFERENCE_COOLDOWN_MS = 48 * 60 * 60 * 1000;
const MAX_REFERENCES_PER_WEEK = 3;

export function retrieveRankedMemories(
  store: CompanionMemoryStore,
  context: MemoryRetrievalContext,
  tokenBudget: number = DEFAULT_MEMORY_TOKEN_BUDGET,
  enhancedStore?: EnhancedCompanionMemoryStore,
): RetrievedMemoryContext {
  console.log('[MemoryRanking] Ranking memories with budget:', tokenBudget, 'tokens');

  let scoredEpisodes = store.episodicMemories
    .map(m => ({ memory: m, score: scoreEpisode(m, context) }))
    .filter(s => s.score > 1)
    .sort((a, b) => b.score - a.score);

  if (enhancedStore) {
    scoredEpisodes = scoredEpisodes.map(s => {
      const recentlyReferenced = wasRecentlyReferenced(enhancedStore, s.memory.id, REFERENCE_COOLDOWN_MS);
      const weeklyCount = getRecentReferenceCount(enhancedStore, s.memory.id);
      let penalty = 0;
      if (recentlyReferenced) penalty += 2;
      if (weeklyCount >= MAX_REFERENCES_PER_WEEK) penalty += 3;
      return { ...s, score: Math.max(0, s.score - penalty) };
    }).filter(s => s.score > 0);
  }

  scoredEpisodes = scoredEpisodes.slice(0, MAX_EPISODES);

  const scoredTraits = store.semanticMemories
    .map(m => ({ memory: m, score: scoreTrait(m, context) }))
    .filter(s => s.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_TRAITS);

  const recentSessions = store.sessionSummaries.slice(0, MAX_SESSIONS);

  const suggestedCoping = extractCoping(scoredEpisodes.map(s => s.memory));
  const patternWarning = detectPattern(store, context);

  const relevantRelationships = enhancedStore
    ? retrieveRelevantRelationships(enhancedStore, context)
    : [];
  const relevantCopingPreferences = enhancedStore
    ? retrieveRelevantCopingPreferences(enhancedStore, context)
    : [];
  const recentStrugglesAndWins = enhancedStore
    ? retrieveRecentStrugglesAndWins(enhancedStore, context)
    : [];

  const memoryReferenceNarrative = buildMemoryReferenceNarrative(
    relevantRelationships,
    relevantCopingPreferences,
    recentStrugglesAndWins,
  );

  const narrative = buildBudgetedNarrative(
    scoredEpisodes.map(s => s.memory),
    scoredTraits.map(s => s.memory),
    recentSessions,
    suggestedCoping,
    patternWarning,
    tokenBudget,
    memoryReferenceNarrative,
  );

  console.log('[MemoryRanking] Selected:', scoredEpisodes.length, 'episodes,', scoredTraits.length, 'traits,', relevantRelationships.length, 'relationships,', recentStrugglesAndWins.length, 'struggles/wins, narrative tokens:', estimateTokens(narrative));

  return {
    relevantEpisodes: scoredEpisodes.map(s => s.memory),
    relevantTraits: scoredTraits.map(s => s.memory),
    recentSessions,
    suggestedCoping,
    patternWarning,
    contextNarrative: narrative,
    relevantRelationships,
    relevantCopingPreferences,
    recentStrugglesAndWins,
    memoryReferenceNarrative,
  };
}

function scoreEpisode(memory: EpisodicMemory, context: MemoryRetrievalContext): number {
  let score = 0;

  if (context.currentTrigger) {
    const triggerLower = context.currentTrigger.toLowerCase();
    const memTriggerLower = memory.trigger.toLowerCase();
    if (memTriggerLower === triggerLower) {
      score += 4;
    } else if (memTriggerLower.includes(triggerLower) || triggerLower.includes(memTriggerLower)) {
      score += 2;
    }
  }

  if (context.currentEmotion) {
    const emotionLower = context.currentEmotion.toLowerCase();
    if (memory.emotion.toLowerCase().includes(emotionLower)) {
      score += 2;
    }
  }

  if (context.conversationTags && context.conversationTags.length > 0) {
    const matchCount = memory.tags.filter(t =>
      context.conversationTags!.some(ct => ct.toLowerCase() === t.toLowerCase()),
    ).length;
    score += Math.min(matchCount * 0.8, 2.4);
  }

  const ageHours = (Date.now() - memory.timestamp) / (60 * 60 * 1000);
  if (ageHours < 24) score += 1.5;
  else if (ageHours < 72) score += 1;
  else if (ageHours < 168) score += 0.5;

  if (memory.lesson) score += 1;
  if (memory.copingUsed && memory.copingUsed.length > 0 && memory.outcome === 'helped') score += 1;

  return score;
}

function scoreTrait(memory: SemanticMemory, context: MemoryRetrievalContext): number {
  let score = memory.confidence;

  if (context.conversationTags) {
    const matchCount = memory.tags.filter(t =>
      context.conversationTags!.some(ct => ct.toLowerCase() === t.toLowerCase()),
    ).length;
    score += matchCount * 1.2;
  }

  if (context.recentMessageContent) {
    const lower = context.recentMessageContent.toLowerCase();
    if (lower.includes(memory.trait.toLowerCase())) {
      score += 2;
    }
  }

  if (memory.observationCount >= 5) score += 0.5;

  return score;
}

function extractCoping(episodes: EpisodicMemory[]): string[] {
  const copingMap = new Map<string, number>();
  for (const ep of episodes) {
    if (ep.copingUsed && (ep.outcome === 'helped' || ep.outcome === 'managed')) {
      for (const tool of ep.copingUsed) {
        copingMap.set(tool, (copingMap.get(tool) ?? 0) + 1);
      }
    }
  }
  return Array.from(copingMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([tool]) => tool);
}

function detectPattern(store: CompanionMemoryStore, context: MemoryRetrievalContext): string | undefined {
  if (!context.currentTrigger) return undefined;

  const recentEpisodes = store.episodicMemories.filter(m => {
    const isRecent = Date.now() - m.timestamp < 7 * 24 * 60 * 60 * 1000;
    return isRecent && m.trigger.toLowerCase().includes(context.currentTrigger!.toLowerCase());
  });

  if (recentEpisodes.length >= 3) {
    return `"${context.currentTrigger}" has come up ${recentEpisodes.length}x this week.`;
  }

  return undefined;
}

function retrieveRelevantRelationships(
  store: EnhancedCompanionMemoryStore,
  context: MemoryRetrievalContext,
): RelationshipMemory[] {
  if (!store.relationships || store.relationships.length === 0) return [];

  const lower = (context.recentMessageContent ?? '').toLowerCase();

  return store.relationships
    .map(r => {
      let score = 0;
      if (lower.includes(r.name.toLowerCase())) score += 5;
      if (lower.includes(r.relationship.toLowerCase())) score += 2;
      for (const trigger of r.associatedTriggers) {
        if (lower.includes(trigger.toLowerCase())) score += 1.5;
      }
      for (const emotion of r.associatedEmotions) {
        if (lower.includes(emotion.toLowerCase())) score += 1;
      }
      if (context.currentTrigger && r.associatedTriggers.some(t => t.toLowerCase().includes(context.currentTrigger!.toLowerCase()))) {
        score += 2;
      }
      const recency = (Date.now() - r.lastMentioned) / (24 * 60 * 60 * 1000);
      if (recency < 7) score += 1;
      score += Math.min(r.mentionCount * 0.2, 1);
      return { rel: r, score };
    })
    .filter(s => s.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RELATIONSHIPS)
    .map(s => s.rel);
}

function retrieveRelevantCopingPreferences(
  store: EnhancedCompanionMemoryStore,
  context: MemoryRetrievalContext,
): CopingPreference[] {
  if (!store.copingPreferences || store.copingPreferences.length === 0) return [];

  return store.copingPreferences
    .filter(cp => cp.userPreference !== 'disliked')
    .map(cp => {
      let score = cp.effectiveness * 3;
      if (cp.userPreference === 'preferred') score += 2;
      if (context.currentEmotion && cp.bestForEmotions.some(e => e.toLowerCase().includes(context.currentEmotion!.toLowerCase()))) {
        score += 2;
      }
      if (context.currentTrigger && cp.bestForTriggers.some(t => t.toLowerCase().includes(context.currentTrigger!.toLowerCase()))) {
        score += 1.5;
      }
      const recency = (Date.now() - cp.lastUsed) / (24 * 60 * 60 * 1000);
      if (recency < 14) score += 0.5;
      return { cp, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_COPING)
    .map(s => s.cp);
}

function retrieveRecentStrugglesAndWins(
  store: EnhancedCompanionMemoryStore,
  context: MemoryRetrievalContext,
): StruggleWinMemory[] {
  if (!store.strugglesAndWins || store.strugglesAndWins.length === 0) return [];

  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const lower = (context.recentMessageContent ?? '').toLowerCase();

  return store.strugglesAndWins
    .filter(sw => sw.timestamp > twoWeeksAgo)
    .map(sw => {
      let score = sw.type === 'win' ? 1.5 : 1;
      for (const tag of sw.tags) {
        if (lower.includes(tag.toLowerCase())) score += 1;
      }
      if (context.currentEmotion && sw.emotion.toLowerCase().includes(context.currentEmotion.toLowerCase())) {
        score += 1.5;
      }
      if (sw.relatedTrigger && context.currentTrigger &&
        sw.relatedTrigger.toLowerCase().includes(context.currentTrigger.toLowerCase())) {
        score += 2;
      }
      const recency = (Date.now() - sw.timestamp) / (24 * 60 * 60 * 1000);
      if (recency < 3) score += 1;
      return { sw, score };
    })
    .filter(s => s.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_STRUGGLES_WINS)
    .map(s => s.sw);
}

function buildMemoryReferenceNarrative(
  relationships: RelationshipMemory[],
  copingPrefs: CopingPreference[],
  strugglesAndWins: StruggleWinMemory[],
): string {
  const parts: string[] = [];

  if (relationships.length > 0) {
    for (const rel of relationships) {
      let line = `Important person: "${rel.name}" (${rel.relationship})`;
      if (rel.dynamics.length > 0) {
        line += ` — dynamics: ${rel.dynamics.slice(0, 3).join(', ')}`;
      }
      if (rel.recentContext) {
        line += ` — recent: "${rel.recentContext.substring(0, 80)}"`;
      }
      parts.push(line);
    }
  }

  if (copingPrefs.length > 0) {
    const preferred = copingPrefs.filter(cp => cp.userPreference === 'preferred');
    if (preferred.length > 0) {
      parts.push(`Preferred coping: ${preferred.map(cp => `"${cp.strategy}" (${Math.round(cp.effectiveness * 100)}% effective)`).join(', ')}`);
    }
  }

  const recentWins = strugglesAndWins.filter(sw => sw.type === 'win');
  const recentStruggles = strugglesAndWins.filter(sw => sw.type === 'struggle');

  if (recentWins.length > 0) {
    const winDesc = recentWins[0].description.substring(0, 100);
    const timeAgo = formatTimeAgo(recentWins[0].timestamp);
    parts.push(`Recent win (${timeAgo}): "${winDesc}"`);
  }

  if (recentStruggles.length > 0) {
    const strugDesc = recentStruggles[0].description.substring(0, 100);
    const timeAgo = formatTimeAgo(recentStruggles[0].timestamp);
    parts.push(`Recent struggle (${timeAgo}): "${strugDesc}"`);
  }

  return parts.join('\n');
}

function buildBudgetedNarrative(
  episodes: EpisodicMemory[],
  traits: SemanticMemory[],
  sessions: Array<{ insight?: string }>,
  suggestedCoping: string[],
  patternWarning: string | undefined,
  tokenBudget: number,
  enhancedNarrative?: string,
): string {
  if (episodes.length === 0 && traits.length === 0 && !enhancedNarrative) return '';

  const parts: string[] = ['[Memory]'];
  let currentTokens = estimateTokens(parts[0]);

  if (traits.length > 0) {
    const traitLine = `Known: ${traits.filter(t => t.confidence >= 0.3).map(t => `"${t.trait}"`).join(', ')}`;
    if (currentTokens + estimateTokens(traitLine) < tokenBudget) {
      parts.push(traitLine);
      currentTokens += estimateTokens(traitLine);
    }
  }

  if (episodes.length > 0) {
    const ep = episodes[0];
    const timeAgo = formatTimeAgo(ep.timestamp);
    let epLine = `Recent (${timeAgo}): "${ep.trigger}" → "${ep.emotion}"`;
    if (ep.lesson) epLine += ` — "${ep.lesson}"`;
    if (currentTokens + estimateTokens(epLine) < tokenBudget) {
      parts.push(epLine);
      currentTokens += estimateTokens(epLine);
    }
  }

  if (suggestedCoping.length > 0) {
    const copingLine = `Helpful tools: ${suggestedCoping.join(', ')}`;
    if (currentTokens + estimateTokens(copingLine) < tokenBudget) {
      parts.push(copingLine);
      currentTokens += estimateTokens(copingLine);
    }
  }

  if (sessions.length > 0 && sessions[0].insight) {
    const insightLine = `Last insight: "${sessions[0].insight}"`;
    if (currentTokens + estimateTokens(insightLine) < tokenBudget) {
      parts.push(insightLine);
      currentTokens += estimateTokens(insightLine);
    }
  }

  if (patternWarning) {
    const warnLine = `Pattern: ${patternWarning}`;
    if (currentTokens + estimateTokens(warnLine) < tokenBudget) {
      parts.push(warnLine);
      currentTokens += estimateTokens(warnLine);
    }
  }

  if (enhancedNarrative) {
    const enhancedLines = enhancedNarrative.split('\n');
    for (const line of enhancedLines) {
      if (currentTokens + estimateTokens(line) < tokenBudget) {
        parts.push(line);
        currentTokens += estimateTokens(line);
      }
    }
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
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
