import {
  RelationshipMemory,
  CopingPreference,
  StruggleWinMemory,
  EnhancedCompanionMemoryStore,
} from '@/types/companionMemory';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

const RELATIONSHIP_KEYWORDS: Record<string, string> = {
  partner: 'romantic partner',
  boyfriend: 'romantic partner',
  girlfriend: 'romantic partner',
  husband: 'spouse',
  wife: 'spouse',
  ex: 'ex-partner',
  mom: 'parent',
  mother: 'parent',
  dad: 'parent',
  father: 'parent',
  sister: 'sibling',
  brother: 'sibling',
  friend: 'friend',
  'best friend': 'close friend',
  boss: 'workplace',
  coworker: 'workplace',
  therapist: 'therapist',
  roommate: 'roommate',
};

const COPING_KEYWORDS: Record<string, string> = {
  breathe: 'breathing exercise',
  breathing: 'breathing exercise',
  ground: 'grounding',
  grounding: 'grounding',
  journal: 'journaling',
  walk: 'walking',
  exercise: 'physical exercise',
  meditat: 'meditation',
  music: 'listening to music',
  bath: 'taking a bath',
  pause: 'pausing before reacting',
  wait: 'waiting before responding',
  rewrite: 'message rewriting',
  'ice cube': 'ice cube technique',
  'cold water': 'cold water technique',
  yoga: 'yoga',
  'self-compassion': 'self-compassion practice',
  'urge surf': 'urge surfing',
  distract: 'distraction technique',
  'check the facts': 'check the facts skill',
  'opposite action': 'opposite action skill',
  art: 'creative expression',
  draw: 'creative expression',
  cook: 'cooking',
  clean: 'cleaning/organizing',
  sleep: 'rest/sleep',
  nap: 'rest/sleep',
  'talk to': 'reaching out to someone',
  call: 'calling someone',
};

const WIN_INDICATORS = [
  'i managed to', 'i was able to', 'i paused', 'i didn\'t react',
  'i held back', 'i stayed calm', 'i used', 'it worked',
  'i felt proud', 'i did it', 'i handled it', 'i chose to',
  'i walked away', 'i took a breath', 'growth', 'breakthrough',
  'i\'m getting better', 'progress', 'small win', 'proud of myself',
  'i noticed', 'i caught myself', 'instead of reacting',
];

const STRUGGLE_INDICATORS = [
  'i couldn\'t stop', 'i lost control', 'i blew up', 'i snapped',
  'i spiraled', 'i regret', 'i shouldn\'t have', 'i messed up',
  'i failed', 'i can\'t seem to', 'i keep doing', 'i always end up',
  'it happened again', 'same pattern', 'i fell apart',
  'i couldn\'t handle', 'i broke down', 'i gave in',
];

export function extractRelationships(
  messages: Array<{ role: string; content: string }>,
  existingRelationships: RelationshipMemory[],
): RelationshipMemory[] {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  const allText = userMessages.join(' ').toLowerCase();
  const updatedRelationships = [...existingRelationships];

  for (const [keyword, relType] of Object.entries(RELATIONSHIP_KEYWORDS)) {
    if (!allText.includes(keyword)) continue;

    const nameMatch = extractNameNearKeyword(allText, keyword);
    const displayName = nameMatch ?? keyword;

    const existing = updatedRelationships.find(
      r => r.name.toLowerCase() === displayName.toLowerCase() ||
        (r.relationship === relType && !nameMatch),
    );

    const dynamics = extractRelationshipDynamics(allText, keyword);
    const triggers = extractAssociatedTriggers(allText);
    const emotions = extractAssociatedEmotions(allText);

    const contextSnippet = userMessages
      .filter(m => m.toLowerCase().includes(keyword))
      .slice(-1)[0]?.substring(0, 150);

    if (existing) {
      existing.mentionCount += 1;
      existing.lastMentioned = Date.now();
      if (contextSnippet) existing.recentContext = contextSnippet;
      for (const d of dynamics) {
        if (!existing.dynamics.includes(d)) existing.dynamics.push(d);
      }
      for (const t of triggers) {
        if (!existing.associatedTriggers.includes(t)) existing.associatedTriggers.push(t);
      }
      for (const e of emotions) {
        if (!existing.associatedEmotions.includes(e)) existing.associatedEmotions.push(e);
      }
      existing.dynamics = existing.dynamics.slice(0, 8);
      existing.associatedTriggers = existing.associatedTriggers.slice(0, 6);
      existing.associatedEmotions = existing.associatedEmotions.slice(0, 6);
    } else {
      updatedRelationships.push({
        id: generateId('rel'),
        name: displayName,
        relationship: relType,
        dynamics,
        emotionalSignificance: dynamics.length >= 2 ? 'high' : 'medium',
        associatedTriggers: triggers,
        associatedEmotions: emotions,
        lastMentioned: Date.now(),
        mentionCount: 1,
        recentContext: contextSnippet,
      });
    }
  }

  return updatedRelationships.slice(0, 20);
}

function extractNameNearKeyword(text: string, keyword: string): string | null {
  const patterns = [
    new RegExp(`my\\s+${keyword}\\s+([A-Z][a-z]+)`, 'i'),
    new RegExp(`([A-Z][a-z]+),?\\s+my\\s+${keyword}`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 1 && match[1].length < 20) {
      return match[1];
    }
  }
  return null;
}

function extractRelationshipDynamics(text: string, _keyword: string): string[] {
  const dynamics: string[] = [];
  const dynamicPatterns: Record<string, string> = {
    'silent treatment': 'uses silence/withdrawal',
    'doesn\'t respond': 'communication gaps',
    'doesn\'t reply': 'communication gaps',
    'ignore': 'feels ignored',
    'dismiss': 'feels dismissed',
    'criticize': 'criticism dynamic',
    'invalidat': 'feels invalidated',
    'gaslight': 'gaslighting concern',
    'control': 'control dynamic',
    'jealous': 'jealousy dynamic',
    'trust': 'trust issues',
    'cheated': 'infidelity',
    'lie': 'dishonesty concern',
    'fight': 'frequent conflict',
    'argue': 'frequent conflict',
    'support': 'supportive dynamic',
    'safe': 'feels safe',
    'love': 'love expressed',
    'care': 'caring dynamic',
    'abandon': 'abandonment fear',
    'leave me': 'abandonment fear',
    'pull away': 'withdrawal pattern',
    'hot and cold': 'inconsistent behavior',
    'mixed signals': 'mixed signals',
  };

  for (const [pattern, dynamic] of Object.entries(dynamicPatterns)) {
    if (text.includes(pattern) && !dynamics.includes(dynamic)) {
      dynamics.push(dynamic);
    }
  }

  return dynamics.slice(0, 5);
}

function extractAssociatedTriggers(text: string): string[] {
  const triggers: string[] = [];
  const triggerMap: Record<string, string> = {
    'not respond': 'silence/no response',
    'not reply': 'silence/no response',
    'left on read': 'left on read',
    'cancel': 'cancelled plans',
    'late': 'being kept waiting',
    'forgot': 'being forgotten',
    'reject': 'rejection',
    'dismiss': 'dismissal',
    'criticiz': 'criticism',
    'compare': 'comparison',
    'alone': 'being alone',
    'exclude': 'exclusion',
  };

  for (const [keyword, trigger] of Object.entries(triggerMap)) {
    if (text.includes(keyword) && !triggers.includes(trigger)) {
      triggers.push(trigger);
    }
  }

  return triggers.slice(0, 4);
}

function extractAssociatedEmotions(text: string): string[] {
  const emotions: string[] = [];
  const emotionMap: Record<string, string> = {
    'angry': 'anger', 'rage': 'rage', 'furious': 'anger',
    'sad': 'sadness', 'hurt': 'hurt', 'pain': 'pain',
    'anxious': 'anxiety', 'scared': 'fear', 'afraid': 'fear',
    'ashamed': 'shame', 'guilty': 'guilt',
    'jealous': 'jealousy', 'abandon': 'abandonment fear',
    'reject': 'rejection', 'worthless': 'worthlessness',
    'overwhelm': 'overwhelm', 'empty': 'emptiness',
    'confused': 'confusion', 'betray': 'betrayal',
  };

  for (const [keyword, emotion] of Object.entries(emotionMap)) {
    if (text.includes(keyword) && !emotions.includes(emotion)) {
      emotions.push(emotion);
    }
  }

  return emotions.slice(0, 4);
}

export function extractCopingPreferences(
  messages: Array<{ role: string; content: string }>,
  existingPreferences: CopingPreference[],
): CopingPreference[] {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
  const allText = userMessages.join(' ');
  const updated = [...existingPreferences];

  for (const [keyword, strategy] of Object.entries(COPING_KEYWORDS)) {
    if (!allText.includes(keyword)) continue;

    const isPositiveMention = WIN_INDICATORS.some(w => allText.includes(w)) ||
      allText.includes('helped') || allText.includes('worked') || allText.includes('better');
    const isNegativeMention = allText.includes('didn\'t help') || allText.includes('doesn\'t work') ||
      allText.includes('hate') || allText.includes('can\'t do');

    const existing = updated.find(p => p.strategy === strategy);

    if (existing) {
      existing.timesUsed += 1;
      existing.lastUsed = Date.now();
      if (isPositiveMention) {
        existing.timesHelped += 1;
        existing.userPreference = existing.timesHelped / existing.timesUsed >= 0.6 ? 'preferred' : 'neutral';
      }
      if (isNegativeMention) {
        existing.userPreference = 'disliked';
      }
      existing.effectiveness = existing.timesUsed > 0 ? existing.timesHelped / existing.timesUsed : 0;

      const emotions = extractAssociatedEmotions(allText);
      const triggers = extractAssociatedTriggers(allText);
      for (const e of emotions) {
        if (!existing.bestForEmotions.includes(e)) existing.bestForEmotions.push(e);
      }
      for (const t of triggers) {
        if (!existing.bestForTriggers.includes(t)) existing.bestForTriggers.push(t);
      }
      existing.bestForEmotions = existing.bestForEmotions.slice(0, 5);
      existing.bestForTriggers = existing.bestForTriggers.slice(0, 5);
    } else {
      updated.push({
        id: generateId('cope'),
        strategy,
        effectiveness: isPositiveMention ? 0.7 : isNegativeMention ? 0.2 : 0.5,
        timesUsed: 1,
        timesHelped: isPositiveMention ? 1 : 0,
        bestForEmotions: extractAssociatedEmotions(allText).slice(0, 3),
        bestForTriggers: extractAssociatedTriggers(allText).slice(0, 3),
        lastUsed: Date.now(),
        userPreference: isPositiveMention ? 'preferred' : isNegativeMention ? 'disliked' : 'unknown',
      });
    }
  }

  return updated.slice(0, 25);
}

export function extractStrugglesAndWins(
  messages: Array<{ role: string; content: string }>,
  existingItems: StruggleWinMemory[],
): StruggleWinMemory[] {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  const updated = [...existingItems];

  for (const msg of userMessages) {
    const lower = msg.toLowerCase();

    const isWin = WIN_INDICATORS.some(w => lower.includes(w));
    const isStruggle = STRUGGLE_INDICATORS.some(w => lower.includes(w));

    if (!isWin && !isStruggle) continue;

    const isDuplicate = updated.some(item => {
      if (Date.now() - item.timestamp > 24 * 60 * 60 * 1000) return false;
      const similarity = calculateTextSimilarity(item.description, msg);
      return similarity > 0.6;
    });

    if (isDuplicate) continue;

    const emotions = extractAssociatedEmotions(lower);
    const triggers = extractAssociatedTriggers(lower);

    const newItem: StruggleWinMemory = {
      id: generateId(isWin ? 'win' : 'str'),
      type: isWin ? 'win' : 'struggle',
      description: msg.substring(0, 200),
      emotion: emotions[0] ?? (isWin ? 'pride' : 'frustration'),
      context: isWin ? 'positive progress moment' : 'difficult moment',
      timestamp: Date.now(),
      relatedTrigger: triggers[0],
      copingUsed: isWin ? extractCopingFromText(lower) : undefined,
      tags: [
        isWin ? 'win' : 'struggle',
        ...emotions.slice(0, 2),
        ...triggers.slice(0, 2),
      ],
    };

    updated.push(newItem);
  }

  return updated
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);
}

function extractCopingFromText(text: string): string[] {
  const found: string[] = [];
  for (const [keyword, strategy] of Object.entries(COPING_KEYWORDS)) {
    if (text.includes(keyword) && !found.includes(strategy)) {
      found.push(strategy);
    }
  }
  return found.slice(0, 3);
}

function calculateTextSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }

  return overlap / Math.max(wordsA.size, wordsB.size);
}

export function processConversationIntoEnhancedMemory(
  store: EnhancedCompanionMemoryStore,
  messages: Array<{ role: string; content: string }>,
): EnhancedCompanionMemoryStore {
  if (messages.length < 3) return store;

  console.log('[MemoryExtractor] Processing conversation into enhanced memory, messages:', messages.length);

  const updatedRelationships = extractRelationships(messages, store.relationships);
  const updatedCoping = extractCopingPreferences(messages, store.copingPreferences);
  const updatedStrugglesWins = extractStrugglesAndWins(messages, store.strugglesAndWins);

  const newRelCount = updatedRelationships.length - store.relationships.length;
  const newCopingCount = updatedCoping.length - store.copingPreferences.length;
  const newSwCount = updatedStrugglesWins.length - store.strugglesAndWins.length;

  console.log('[MemoryExtractor] Extracted:', newRelCount, 'new relationships,', newCopingCount, 'new coping prefs,', newSwCount, 'new struggles/wins');

  return {
    ...store,
    relationships: updatedRelationships,
    copingPreferences: updatedCoping,
    strugglesAndWins: updatedStrugglesWins,
    lastUpdated: Date.now(),
  };
}
