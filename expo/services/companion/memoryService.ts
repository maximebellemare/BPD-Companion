import {
  CompanionMemory,
  CompanionMemoryStore,
  EpisodicMemory,
  SemanticMemory,
  SessionSummary,
  EmotionalState,
  EnhancedCompanionMemoryStore,
  MemoryReferenceLog,
} from '@/types/companionMemory';
import { storageService } from '@/services/storage/storageService';

const MEMORY_STORE_KEY = 'bpd_companion_memory_store';
const ENHANCED_STORE_KEY = 'bpd_companion_enhanced_memory';
const MEMORY_VERSION = 1;
const SHORT_TERM_EXPIRY_MS = 24 * 60 * 60 * 1000;
const MAX_SHORT_TERM = 50;
const MAX_EPISODIC = 200;
const MAX_SEMANTIC = 100;
const MAX_SESSION_SUMMARIES = 100;

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function loadMemoryStore(): Promise<CompanionMemoryStore> {
  try {
    const stored = await storageService.get<CompanionMemoryStore>(MEMORY_STORE_KEY);
    if (stored && stored.version === MEMORY_VERSION) {
      console.log('[CompanionMemory] Loaded store:', stored.episodicMemories.length, 'episodic,', stored.semanticMemories.length, 'semantic');
      return pruneExpiredMemories(stored);
    }
    return createEmptyStore();
  } catch (error) {
    console.log('[CompanionMemory] Error loading store:', error);
    return createEmptyStore();
  }
}

export async function saveMemoryStore(store: CompanionMemoryStore): Promise<void> {
  try {
    store.lastUpdated = Date.now();
    await storageService.set(MEMORY_STORE_KEY, store);
    console.log('[CompanionMemory] Saved store');
  } catch (error) {
    console.log('[CompanionMemory] Error saving store:', error);
  }
}

function createEmptyStore(): CompanionMemoryStore {
  return {
    shortTermMemories: [],
    episodicMemories: [],
    semanticMemories: [],
    sessionSummaries: [],
    lastUpdated: 0,
    version: MEMORY_VERSION,
  };
}

export function createEmptyEnhancedStore(): EnhancedCompanionMemoryStore {
  return {
    ...createEmptyStore(),
    relationships: [],
    copingPreferences: [],
    strugglesAndWins: [],
    referenceLog: [],
  };
}

export async function loadEnhancedMemoryStore(): Promise<EnhancedCompanionMemoryStore> {
  try {
    const stored = await storageService.get<EnhancedCompanionMemoryStore>(ENHANCED_STORE_KEY);
    if (stored) {
      console.log('[CompanionMemory] Loaded enhanced store:', stored.relationships?.length ?? 0, 'relationships,', stored.copingPreferences?.length ?? 0, 'coping prefs,', stored.strugglesAndWins?.length ?? 0, 'struggles/wins');
      return {
        ...stored,
        relationships: stored.relationships ?? [],
        copingPreferences: stored.copingPreferences ?? [],
        strugglesAndWins: stored.strugglesAndWins ?? [],
        referenceLog: stored.referenceLog ?? [],
      };
    }
    return createEmptyEnhancedStore();
  } catch (error) {
    console.log('[CompanionMemory] Error loading enhanced store:', error);
    return createEmptyEnhancedStore();
  }
}

export async function saveEnhancedMemoryStore(store: EnhancedCompanionMemoryStore): Promise<void> {
  try {
    store.lastUpdated = Date.now();
    await storageService.set(ENHANCED_STORE_KEY, store);
    console.log('[CompanionMemory] Saved enhanced store');
  } catch (error) {
    console.log('[CompanionMemory] Error saving enhanced store:', error);
  }
}

export function logMemoryReference(
  store: EnhancedCompanionMemoryStore,
  memoryId: string,
  memoryType: string,
  conversationId: string,
): EnhancedCompanionMemoryStore {
  const log: MemoryReferenceLog = {
    memoryId,
    memoryType,
    referencedAt: Date.now(),
    conversationId,
  };
  const updatedLog = [log, ...store.referenceLog].slice(0, 200);
  return { ...store, referenceLog: updatedLog };
}

export function getRecentReferenceCount(
  store: EnhancedCompanionMemoryStore,
  memoryId: string,
  windowMs: number = 7 * 24 * 60 * 60 * 1000,
): number {
  const cutoff = Date.now() - windowMs;
  return store.referenceLog.filter(
    r => r.memoryId === memoryId && r.referencedAt > cutoff,
  ).length;
}

export function wasRecentlyReferenced(
  store: EnhancedCompanionMemoryStore,
  memoryId: string,
  cooldownMs: number = 24 * 60 * 60 * 1000,
): boolean {
  const cutoff = Date.now() - cooldownMs;
  return store.referenceLog.some(
    r => r.memoryId === memoryId && r.referencedAt > cutoff,
  );
}

export function mergeBaseIntoEnhanced(
  base: CompanionMemoryStore,
  enhanced: EnhancedCompanionMemoryStore,
): EnhancedCompanionMemoryStore {
  return {
    ...base,
    relationships: enhanced.relationships,
    copingPreferences: enhanced.copingPreferences,
    strugglesAndWins: enhanced.strugglesAndWins,
    referenceLog: enhanced.referenceLog,
  };
}

function pruneExpiredMemories(store: CompanionMemoryStore): CompanionMemoryStore {
  const now = Date.now();
  store.shortTermMemories = store.shortTermMemories.filter(
    m => !m.expiresAt || m.expiresAt > now,
  );
  return store;
}

export function addShortTermMemory(
  store: CompanionMemoryStore,
  context: string,
  tags: string[],
  conversationId?: string,
): CompanionMemoryStore {
  const memory: CompanionMemory = {
    id: generateId('stm'),
    type: 'short_term',
    timestamp: Date.now(),
    context,
    tags,
    conversationId,
    expiresAt: Date.now() + SHORT_TERM_EXPIRY_MS,
  };

  store.shortTermMemories = [memory, ...store.shortTermMemories].slice(0, MAX_SHORT_TERM);
  store.lastUpdated = Date.now();
  console.log('[CompanionMemory] Added short-term memory:', context.substring(0, 50));
  return store;
}

export function addEpisodicMemory(
  store: CompanionMemoryStore,
  params: {
    trigger: string;
    emotion: string;
    context: string;
    outcome?: string;
    lesson?: string;
    intensity?: number;
    urge?: string;
    action?: string;
    copingUsed?: string[];
    relationshipContext?: string;
    conversationId?: string;
    tags?: string[];
  },
): CompanionMemoryStore {
  const memory: EpisodicMemory = {
    id: generateId('epi'),
    type: 'episodic',
    timestamp: Date.now(),
    trigger: params.trigger,
    emotion: params.emotion,
    context: params.context,
    outcome: params.outcome,
    lesson: params.lesson,
    intensity: params.intensity,
    urge: params.urge,
    action: params.action,
    copingUsed: params.copingUsed,
    relationshipContext: params.relationshipContext,
    conversationId: params.conversationId,
    tags: params.tags ?? [params.trigger.toLowerCase(), params.emotion.toLowerCase()],
  };

  store.episodicMemories = [memory, ...store.episodicMemories].slice(0, MAX_EPISODIC);
  store.lastUpdated = Date.now();
  console.log('[CompanionMemory] Added episodic memory:', params.trigger, '->', params.emotion);
  return store;
}

export function upsertSemanticMemory(
  store: CompanionMemoryStore,
  trait: string,
  context: string,
  tags: string[],
): CompanionMemoryStore {
  const existing = store.semanticMemories.find(
    m => m.trait.toLowerCase() === trait.toLowerCase(),
  );

  if (existing) {
    existing.observationCount += 1;
    existing.confidence = Math.min(1, existing.observationCount / 10);
    existing.lastReinforced = Date.now();
    existing.context = context;
    console.log('[CompanionMemory] Reinforced semantic memory:', trait, 'count:', existing.observationCount);
  } else {
    const memory: SemanticMemory = {
      id: generateId('sem'),
      type: 'semantic',
      timestamp: Date.now(),
      trait,
      context,
      confidence: 0.1,
      observationCount: 1,
      lastReinforced: Date.now(),
      tags,
    };
    store.semanticMemories = [memory, ...store.semanticMemories].slice(0, MAX_SEMANTIC);
    console.log('[CompanionMemory] Added semantic memory:', trait);
  }

  store.lastUpdated = Date.now();
  return store;
}

export function addSessionSummary(
  store: CompanionMemoryStore,
  summary: Omit<SessionSummary, 'id'>,
): CompanionMemoryStore {
  const sessionSummary: SessionSummary = {
    ...summary,
    id: generateId('sess'),
  };

  store.sessionSummaries = [sessionSummary, ...store.sessionSummaries].slice(0, MAX_SESSION_SUMMARIES);
  store.lastUpdated = Date.now();
  console.log('[CompanionMemory] Added session summary for conversation:', summary.conversationId);
  return store;
}

export function detectEmotionalState(message: string): EmotionalState {
  const lower = message.toLowerCase();

  if (lower.includes('crisis') || lower.includes('can\'t handle') || lower.includes('too much') || lower.includes('want to die') || lower.includes('hurt myself')) {
    return 'high_distress';
  }
  if (lower.includes('abandon') || lower.includes('left me') || lower.includes('leaving') || lower.includes('no one cares')) {
    return 'abandonment_fear';
  }
  if (lower.includes('relationship') || lower.includes('partner') || lower.includes('fight') || lower.includes('boyfriend') || lower.includes('girlfriend')) {
    return 'relationship_trigger';
  }
  if (lower.includes('overwhelm') || lower.includes('spiraling') || lower.includes('can\'t breathe') || lower.includes('panic')) {
    return 'emotional_overwhelm';
  }
  if (lower.includes('text') || lower.includes('message') || lower.includes('say') || lower.includes('reply') || lower.includes('respond')) {
    return 'communication_anxiety';
  }
  if (lower.includes('who am i') || lower.includes('don\'t know myself') || lower.includes('identity') || lower.includes('empty')) {
    return 'identity_confusion';
  }
  if (lower.includes('conflict') || lower.includes('argue') || lower.includes('yell') || lower.includes('screamed')) {
    return 'recent_conflict';
  }
  if (lower.includes('after') || lower.includes('reflect') || lower.includes('looking back') || lower.includes('realize')) {
    return 'post_conflict_reflection';
  }
  if (lower.includes('calm') || lower.includes('peaceful') || lower.includes('better') || lower.includes('okay')) {
    return 'calm';
  }

  return 'neutral';
}

export function extractConversationSignals(
  messages: Array<{ role: string; content: string }>,
): {
  triggers: string[];
  emotions: string[];
  isHighDistress: boolean;
  isRelationship: boolean;
  hasCopingMention: boolean;
  hasInsight: boolean;
} {
  const triggers: string[] = [];
  const emotions: string[] = [];
  let isHighDistress = false;
  let isRelationship = false;
  let hasCopingMention = false;
  let hasInsight = false;

  const triggerKeywords: Record<string, string> = {
    abandon: 'abandonment',
    reject: 'rejection',
    ignor: 'being ignored',
    criticiz: 'criticism',
    invalidat: 'invalidation',
    alone: 'loneliness',
    betray: 'betrayal',
    dismiss: 'dismissal',
    silent: 'silence/stonewalling',
    cancel: 'plans cancelled',
  };

  const emotionKeywords: Record<string, string> = {
    angry: 'anger',
    rage: 'rage',
    sad: 'sadness',
    anxious: 'anxiety',
    scared: 'fear',
    ashamed: 'shame',
    guilt: 'guilt',
    jealous: 'jealousy',
    empty: 'emptiness',
    numb: 'numbness',
    overwhelm: 'overwhelm',
    panic: 'panic',
    hopeless: 'hopelessness',
  };

  const copingKeywords = ['breathe', 'ground', 'pause', 'walk', 'journal', 'music', 'bath', 'exercise', 'meditat'];
  const insightKeywords = ['realize', 'notice', 'pattern', 'understand', 'learn', 'growth', 'better'];

  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());

  for (const msg of userMessages) {
    for (const [keyword, trigger] of Object.entries(triggerKeywords)) {
      if (msg.includes(keyword) && !triggers.includes(trigger)) {
        triggers.push(trigger);
      }
    }

    for (const [keyword, emotion] of Object.entries(emotionKeywords)) {
      if (msg.includes(keyword) && !emotions.includes(emotion)) {
        emotions.push(emotion);
      }
    }

    if (copingKeywords.some(k => msg.includes(k))) hasCopingMention = true;
    if (insightKeywords.some(k => msg.includes(k))) hasInsight = true;

    const distressKeywords = ['crisis', 'can\'t handle', 'too much', 'want to die', 'hurt myself', 'end it'];
    if (distressKeywords.some(k => msg.includes(k))) isHighDistress = true;

    const relKeywords = ['relationship', 'partner', 'boyfriend', 'girlfriend', 'husband', 'wife', 'friend', 'family'];
    if (relKeywords.some(k => msg.includes(k))) isRelationship = true;
  }

  return { triggers, emotions, isHighDistress, isRelationship, hasCopingMention, hasInsight };
}

export function deleteMemoryById(
  store: CompanionMemoryStore,
  memoryId: string,
): CompanionMemoryStore {
  store.shortTermMemories = store.shortTermMemories.filter(m => m.id !== memoryId);
  store.episodicMemories = store.episodicMemories.filter(m => m.id !== memoryId);
  store.semanticMemories = store.semanticMemories.filter(m => m.id !== memoryId);
  store.sessionSummaries = store.sessionSummaries.filter(m => m.id !== memoryId);
  store.lastUpdated = Date.now();
  console.log('[CompanionMemory] Deleted memory:', memoryId);
  return store;
}

export function editEpisodicMemoryLesson(
  store: CompanionMemoryStore,
  memoryId: string,
  newLesson: string,
): CompanionMemoryStore {
  const memory = store.episodicMemories.find(m => m.id === memoryId);
  if (memory) {
    memory.lesson = newLesson;
    store.lastUpdated = Date.now();
    console.log('[CompanionMemory] Edited episodic memory lesson:', memoryId);
  }
  return store;
}

export function shouldCreateMemory(
  messages: Array<{ role: string; content: string }>,
): boolean {
  if (messages.length < 4) return false;

  const signals = extractConversationSignals(messages);
  return (
    signals.isHighDistress ||
    signals.triggers.length > 0 ||
    signals.hasInsight ||
    signals.isRelationship ||
    messages.length >= 8
  );
}
