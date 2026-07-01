import { AIConversation } from '@/types/ai';
import { JournalEntry } from '@/types';
import { SmartJournalEntry } from '@/types/journalEntry';
import { SavedCompanionInsight } from '@/services/companion/companionInsightService';
import {
  CompanionMemorySignal,
  CompanionMemorySignalType,
  CompanionMemorySource,
  CompanionMemorySystem,
  EmotionalGPSMap,
  EmotionalTimelineEvent,
  EnhancedCompanionMemoryStore,
  RecurringEmotionalLoop,
  RelationshipMemory,
} from '@/types/companionMemory';
import {
  DESIRED_OUTCOME_OPTIONS,
  HARDEST_MOMENT_OPTIONS,
  OnboardingProfile,
  PRIMARY_REASON_OPTIONS,
  SUPPORT_GOAL_OPTIONS,
} from '@/types/onboarding';

type SignalDraft = {
  type: CompanionMemorySignalType;
  label: string;
  description: string;
  source: CompanionMemorySource;
  timestamp: number;
  relatedEmotion?: string;
  relatedTrigger?: string;
};

const FEAR_RULES: Array<{ label: string; description: string; terms: string[] }> = [
  {
    label: 'Fear of being abandoned',
    description: 'Moments involving silence, rejection, or distance may touch fear of being left.',
    terms: ['abandon', 'leave me', 'left me', 'leaving', 'pull away', 'ghost', 'replace me', 'forgotten'],
  },
  {
    label: 'Fear of being rejected',
    description: 'Rejection cues may quickly become emotionally intense.',
    terms: ['reject', 'rejected', 'unwanted', 'not chosen', 'excluded', 'left out'],
  },
  {
    label: 'Fear of being too much',
    description: 'The user may worry their emotions or needs are too much for others.',
    terms: ['too much', 'needy', 'clingy', 'burden', 'annoying', 'overreacting'],
  },
  {
    label: 'Fear of not mattering',
    description: 'Being ignored or dismissed may connect to feeling unimportant.',
    terms: ['ignored', 'dismissed', 'not matter', 'invisible', 'unimportant', 'erased'],
  },
  {
    label: 'Fear of conflict becoming rupture',
    description: 'Conflict may feel like the relationship itself is at risk.',
    terms: ['fight', 'argument', 'conflict', 'yelled', 'angry at me', 'break up'],
  },
];

const BELIEF_RULES: Array<{ label: string; description: string; terms: string[] }> = [
  {
    label: 'I am hard to love',
    description: 'Self-blame language may point to a belief that love has to be earned.',
    terms: ['hard to love', 'unlovable', 'no one will love me', 'who could love me'],
  },
  {
    label: 'People eventually leave',
    description: 'Relationship stress may activate an expectation that closeness will not last.',
    terms: ['everyone leaves', 'people leave', 'they always leave', 'will leave me'],
  },
  {
    label: 'My emotions ruin things',
    description: 'Shame after emotional intensity may create fear that feelings cause damage.',
    terms: ['ruin everything', 'mess everything up', 'too emotional', 'my emotions ruin'],
  },
  {
    label: 'I have to act now to feel safe',
    description: 'Urgent messaging or reassurance-seeking may feel like the only way to settle.',
    terms: ['need to text', 'have to text', 'need an answer', 'right now', 'can not wait', 'can\'t wait'],
  },
  {
    label: 'I cannot trust what I feel',
    description: 'Confusion or self-doubt may appear after intense emotional swings.',
    terms: ['can not trust myself', 'can\'t trust myself', 'i do not know what is real', 'i don\'t know what is real'],
  },
];

const URGE_RULES: Array<{ label: string; terms: string[] }> = [
  { label: 'text or seek reassurance', terms: ['text', 'message', 'call', 'reply', 'double text', 'ask again'] },
  { label: 'withdraw or shut down', terms: ['shut down', 'withdraw', 'disappear', 'isolate', 'go quiet'] },
  { label: 'argue or defend', terms: ['argue', 'fight', 'snap', 'yell', 'defend myself'] },
  { label: 'self-blame', terms: ['blame myself', 'hate myself', 'my fault', 'i ruined'] },
  { label: 'escape the feeling', terms: ['run away', 'escape', 'numb', 'make it stop'] },
];

const TRIGGER_LABELS: Record<string, string> = {
  abandonment: 'abandonment fear',
  rejected: 'rejection',
  rejection: 'rejection',
  ignored: 'silence or no response',
  silence: 'silence or no response',
  conflict: 'relationship conflict',
  fight: 'relationship conflict',
  argument: 'relationship conflict',
  lonely: 'loneliness',
  loneliness: 'loneliness',
  sleep: 'sleep disruption',
  work: 'work stress',
};

function makeId(prefix: string, value: string): string {
  return `${prefix}_${value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48)}`;
}

function normalize(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some(term => text.includes(term));
}

function pickFear(text: string, trigger?: string, emotion?: string): string {
  const haystack = `${text} ${trigger ?? ''} ${emotion ?? ''}`.toLowerCase();
  const rule = FEAR_RULES.find(item => includesAny(haystack, item.terms));
  if (rule) return rule.label;
  if (haystack.includes('relationship') || haystack.includes('conflict')) return 'Fear of connection becoming unsafe';
  if (haystack.includes('ashamed') || haystack.includes('shame')) return 'Fear of being the problem';
  return 'Not recorded yet';
}

function pickBeliefSignals(text: string, source: CompanionMemorySource, timestamp: number): SignalDraft[] {
  const lower = text.toLowerCase();
  return BELIEF_RULES
    .filter(rule => includesAny(lower, rule.terms))
    .map(rule => ({
      type: 'core_belief',
      label: rule.label,
      description: rule.description,
      source,
      timestamp,
    }));
}

function pickFearSignals(text: string, source: CompanionMemorySource, timestamp: number): SignalDraft[] {
  const lower = text.toLowerCase();
  return FEAR_RULES
    .filter(rule => includesAny(lower, rule.terms))
    .map(rule => ({
      type: 'core_fear',
      label: rule.label,
      description: rule.description,
      source,
      timestamp,
    }));
}

function inferTriggerFromText(text: string): string {
  const lower = text.toLowerCase();
  for (const [term, label] of Object.entries(TRIGGER_LABELS)) {
    if (lower.includes(term)) return label;
  }
  return 'Not recorded yet';
}

function inferEmotionFromText(text: string): string {
  const lower = text.toLowerCase();
  const emotionTerms = [
    'anxious',
    'angry',
    'sad',
    'empty',
    'ashamed',
    'calm',
    'triggered',
    'rejected',
    'abandoned',
    'overwhelmed',
    'numb',
    'lonely',
    'jealous',
    'hurt',
    'scared',
    'confused',
  ];
  return emotionTerms.find(term => lower.includes(term)) ?? 'Not recorded yet';
}

function inferUrge(text: string, fallback = 'Not recorded yet'): string {
  const lower = text.toLowerCase();
  const rule = URGE_RULES.find(item => includesAny(lower, item.terms));
  return rule?.label ?? fallback;
}

function inferAction(text: string, copingUsed?: string[]): string {
  if (copingUsed && copingUsed.length > 0) return `used ${copingUsed[0]}`;
  const lower = text.toLowerCase();
  if (lower.includes('paused') || lower.includes('waited')) return 'paused before reacting';
  if (lower.includes('sent') || lower.includes('texted')) return 'sent a message';
  if (lower.includes('journal')) return 'journaled';
  if (lower.includes('breathe') || lower.includes('ground')) return 'used grounding';
  return 'Not recorded yet';
}

function mapOutcome(outcome?: string): string {
  if (outcome === 'managed') return 'felt more regulated';
  if (outcome === 'struggled') return 'still felt difficult';
  if (outcome === 'neutral') return 'outcome unclear';
  if (outcome === 'helped') return 'helped';
  if (outcome === 'made_worse') return 'felt worse';
  if (outcome === 'not_sent') return 'paused instead of sending';
  if (outcome === 'sent') return 'sent the message';
  return 'Not recorded yet';
}

function confidenceFromCount(count: number): number {
  return Math.min(0.95, Math.max(0.25, count / 6));
}

function addSignal(map: Map<string, CompanionMemorySignal>, draft: SignalDraft): void {
  const key = `${draft.type}:${draft.label.toLowerCase()}`;
  const existing = map.get(key);
  if (existing) {
    existing.evidenceCount += 1;
    existing.confidence = confidenceFromCount(existing.evidenceCount);
    existing.lastSeenAt = Math.max(existing.lastSeenAt, draft.timestamp);
    if (!existing.sources.includes(draft.source)) existing.sources.push(draft.source);
    if (draft.relatedEmotion && !existing.relatedEmotions.includes(draft.relatedEmotion)) {
      existing.relatedEmotions.push(draft.relatedEmotion);
    }
    if (draft.relatedTrigger && !existing.relatedTriggers.includes(draft.relatedTrigger)) {
      existing.relatedTriggers.push(draft.relatedTrigger);
    }
    return;
  }

  map.set(key, {
    id: makeId(draft.type, draft.label),
    type: draft.type,
    label: draft.label,
    description: draft.description,
    evidenceCount: 1,
    confidence: confidenceFromCount(1),
    sources: [draft.source],
    firstSeenAt: draft.timestamp,
    lastSeenAt: draft.timestamp,
    relatedEmotions: draft.relatedEmotion ? [draft.relatedEmotion] : [],
    relatedTriggers: draft.relatedTrigger ? [draft.relatedTrigger] : [],
  });
}

function buildCheckInTimeline(entries: JournalEntry[]): EmotionalTimelineEvent[] {
  return entries.map(entry => {
    const trigger = normalize(entry.checkIn.triggers[0]?.label, 'Not recorded yet');
    const emotion = normalize(entry.checkIn.emotions[0]?.label, 'Not recorded yet');
    const text = [entry.checkIn.notes, entry.reflection, trigger, emotion].filter(Boolean).join(' ');
    const urge = normalize(entry.checkIn.urges[0]?.label, inferUrge(text));
    const relationshipContext = entry.checkIn.triggers.find(t => t.category === 'relationship')?.label;

    return {
      id: `tl_checkin_${entry.id}`,
      timestamp: entry.timestamp,
      source: 'check_in',
      trigger,
      emotion,
      fear: pickFear(text, trigger, emotion),
      urge,
      action: inferAction(text, entry.checkIn.copingUsed),
      outcome: mapOutcome(entry.outcome),
      intensity: entry.checkIn.intensityLevel,
      relationshipContext,
      journalEntryId: entry.id,
      confidence: 0.8,
      tags: [
        ...entry.checkIn.triggers.map(t => t.label),
        ...entry.checkIn.emotions.map(e => e.label),
        ...entry.checkIn.urges.map(u => u.label),
      ].slice(0, 8),
    };
  });
}

function buildSmartJournalTimeline(entries: SmartJournalEntry[]): EmotionalTimelineEvent[] {
  return entries.map(entry => {
    const trigger = normalize(entry.triggers[0]?.label, inferTriggerFromText(entry.content));
    const emotion = normalize(entry.emotions[0]?.label, inferEmotionFromText(entry.content));
    const fear = pickFear(entry.content, trigger, emotion);

    return {
      id: `tl_journal_${entry.id}`,
      timestamp: entry.timestamp,
      source: 'journal',
      trigger,
      emotion,
      fear,
      urge: normalize(entry.aiInsight?.mainUrge, inferUrge(entry.content)),
      action: inferAction(entry.content),
      outcome: normalize(entry.aiInsight?.summary, 'Not recorded yet'),
      intensity: entry.distressLevel,
      relationshipContext: entry.format === 'relationship_conflict' ? trigger : undefined,
      journalEntryId: entry.id,
      confidence: 0.7,
      tags: [
        entry.format,
        ...entry.triggers.map(t => t.label),
        ...entry.emotions.map(e => e.label),
        ...entry.tags.map(t => t.label),
      ].slice(0, 8),
    };
  });
}

function buildConversationTimeline(conversations: AIConversation[]): EmotionalTimelineEvent[] {
  const events: EmotionalTimelineEvent[] = [];

  for (const conversation of conversations) {
    const userMessages = conversation.messages.filter(message => message.role === 'user');
    if (userMessages.length === 0) continue;
    const latest = userMessages[userMessages.length - 1];
    const combinedText = userMessages.map(message => message.content).join(' ');
    const trigger = inferTriggerFromText(combinedText);
    const emotion = inferEmotionFromText(combinedText);

    if (trigger === 'Not recorded yet' && emotion === 'Not recorded yet' && combinedText.length < 40) continue;

    events.push({
      id: `tl_conversation_${conversation.id}`,
      timestamp: latest.timestamp || conversation.updatedAt,
      source: 'conversation',
      trigger,
      emotion,
      fear: pickFear(combinedText, trigger, emotion),
      urge: inferUrge(combinedText),
      action: inferAction(combinedText),
      outcome: 'conversation with Companion',
      relationshipContext: trigger.includes('relationship') || trigger.includes('rejection') || trigger.includes('abandonment') ? trigger : undefined,
      conversationId: conversation.id,
      confidence: 0.55,
      tags: conversation.tags.slice(0, 8),
    });
  }

  return events;
}

function buildInsightTimeline(insights: SavedCompanionInsight[]): EmotionalTimelineEvent[] {
  return insights.map(insight => {
    const trigger = inferTriggerFromText(insight.content);
    const emotion = inferEmotionFromText(insight.content);
    return {
      id: `tl_insight_${insight.id}`,
      timestamp: insight.createdAt,
      source: 'insight' as const,
      trigger,
      emotion,
      fear: pickFear(insight.content, trigger, emotion),
      urge: inferUrge(insight.content),
      action: inferAction(insight.content),
      outcome: 'saved as insight',
      conversationId: insight.conversationId,
      confidence: 0.6,
      tags: insight.tags.slice(0, 8),
    };
  }).filter(event => event.trigger !== 'Not recorded yet' || event.emotion !== 'Not recorded yet');
}

function buildRecurringLoops(events: EmotionalTimelineEvent[]): RecurringEmotionalLoop[] {
  const grouped = new Map<string, EmotionalTimelineEvent[]>();

  for (const event of events) {
    if (event.trigger === 'Not recorded yet' || event.emotion === 'Not recorded yet') continue;
    const signature = [
      event.trigger.toLowerCase(),
      event.emotion.toLowerCase(),
      event.fear.toLowerCase(),
      event.urge.toLowerCase(),
    ].join('|');
    const existing = grouped.get(signature) ?? [];
    existing.push(event);
    grouped.set(signature, existing);
  }

  return Array.from(grouped.entries())
    .filter(([, items]) => items.length >= 2)
    .map(([signature, items]) => {
      const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);
      const latest = sorted[sorted.length - 1];
      return {
        id: makeId('loop', signature),
        signature,
        count: items.length,
        firstSeenAt: sorted[0].timestamp,
        lastSeenAt: latest.timestamp,
        sources: [...new Set(items.map(item => item.source))],
        timelineEventIds: sorted.map(item => item.id),
        trigger: latest.trigger,
        emotion: latest.emotion,
        fear: latest.fear,
        urge: latest.urge,
        commonAction: mostCommon(items.map(item => item.action)),
        commonOutcome: mostCommon(items.map(item => item.outcome)),
        suggestedInterruption: suggestInterruption(latest),
        confidence: confidenceFromCount(items.length),
      };
    })
    .sort((a, b) => b.count - a.count || b.lastSeenAt - a.lastSeenAt)
    .slice(0, 12);
}

function mostCommon(items: string[]): string {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item || item === 'Not recorded yet') continue;
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'Not recorded yet';
}

function suggestInterruption(event: EmotionalTimelineEvent): string {
  const lower = `${event.trigger} ${event.emotion} ${event.fear} ${event.urge}`.toLowerCase();
  if (lower.includes('text') || lower.includes('message') || lower.includes('reassurance')) {
    return 'pause before messaging and name the feeling before the urge';
  }
  if (lower.includes('abandon') || lower.includes('reject') || lower.includes('silence')) {
    return 'ground first, then separate what happened from what the fear predicts';
  }
  if (lower.includes('anger') || lower.includes('angry') || lower.includes('conflict')) {
    return 'slow the body before trying to solve the relationship problem';
  }
  return 'name the emotion and choose one stabilizing action before reacting';
}

function buildEmotionalGPSMap(events: EmotionalTimelineEvent[], loops: RecurringEmotionalLoop[]): EmotionalGPSMap {
  const strongestLoop = loops[0] ?? null;
  const recentTimeline = events.slice(0, 8).map(event => (
    `${event.trigger} -> ${event.emotion} -> ${event.fear} -> ${event.urge} -> ${event.action} -> ${event.outcome}`
  ));

  return {
    timeline: events,
    recurringLoops: loops,
    strongestLoop,
    aiTimelineNarrative: [
      '[Emotional GPS Timeline]',
      'Every useful entry is mapped as: Trigger -> Emotion -> Fear -> Urge -> Action -> Outcome.',
      strongestLoop
        ? `Repeated pattern detected: ${strongestLoop.trigger} -> ${strongestLoop.emotion} -> ${strongestLoop.fear} -> ${strongestLoop.urge} -> ${strongestLoop.commonAction} -> ${strongestLoop.commonOutcome}. Seen ${strongestLoop.count} times.`
        : 'No repeated loop is strong enough to reference yet.',
      recentTimeline.length > 0 ? `Recent GPS events: ${recentTimeline.join(' | ')}.` : '',
      'When a current message matches a repeated loop, say: "We\'ve seen this pattern before." Then explain it softly and suggest one interruption point.',
    ].filter(Boolean).join('\n'),
    userPatternSummary: strongestLoop
      ? `We've seen this pattern before: ${strongestLoop.trigger} -> ${strongestLoop.emotion} -> ${strongestLoop.fear}.`
      : null,
    updatedAt: Date.now(),
  };
}

function buildSignals(params: {
  journalEntries: JournalEntry[];
  smartJournalEntries: SmartJournalEntry[];
  conversations: AIConversation[];
  savedInsights?: SavedCompanionInsight[];
  onboardingProfile: OnboardingProfile | null;
  enhancedMemoryStore: EnhancedCompanionMemoryStore | null;
  timeline: EmotionalTimelineEvent[];
  loops: RecurringEmotionalLoop[];
}): {
  coreFears: CompanionMemorySignal[];
  coreBeliefs: CompanionMemorySignal[];
  majorTriggers: CompanionMemorySignal[];
  longTermGoals: CompanionMemorySignal[];
  recurringPatterns: CompanionMemorySignal[];
} {
  const signals = new Map<string, CompanionMemorySignal>();

  for (const event of params.timeline) {
    addSignal(signals, {
      type: 'major_trigger',
      label: event.trigger,
      description: `"${event.trigger}" appears in emotional timeline entries.`,
      source: event.source,
      timestamp: event.timestamp,
      relatedEmotion: event.emotion,
      relatedTrigger: event.trigger,
    });
    if (event.fear !== 'Not recorded yet') {
      addSignal(signals, {
        type: 'core_fear',
        label: event.fear,
        description: `${event.fear} appears connected to ${event.trigger}.`,
        source: event.source,
        timestamp: event.timestamp,
        relatedEmotion: event.emotion,
        relatedTrigger: event.trigger,
      });
    }
  }

  for (const entry of params.journalEntries) {
    const text = [entry.checkIn.notes, entry.reflection].filter(Boolean).join(' ');
    const timestamp = entry.timestamp;
    pickFearSignals(text, 'check_in', timestamp).forEach(signal => addSignal(signals, signal));
    pickBeliefSignals(text, 'check_in', timestamp).forEach(signal => addSignal(signals, signal));
  }

  for (const entry of params.smartJournalEntries) {
    pickFearSignals(entry.content, 'journal', entry.timestamp).forEach(signal => addSignal(signals, signal));
    pickBeliefSignals(entry.content, 'journal', entry.timestamp).forEach(signal => addSignal(signals, signal));
  }

  for (const conversation of params.conversations) {
    const text = conversation.messages.filter(message => message.role === 'user').map(message => message.content).join(' ');
    pickFearSignals(text, 'conversation', conversation.updatedAt).forEach(signal => addSignal(signals, signal));
    pickBeliefSignals(text, 'conversation', conversation.updatedAt).forEach(signal => addSignal(signals, signal));
  }

  for (const goal of buildGoalSignals(params.onboardingProfile)) {
    addSignal(signals, goal);
  }

  for (const loop of params.loops) {
    addSignal(signals, {
      type: 'recurring_pattern',
      label: `${loop.trigger} -> ${loop.emotion}`,
      description: `This loop has appeared ${loop.count} times: ${loop.trigger} -> ${loop.emotion} -> ${loop.fear} -> ${loop.urge}.`,
      source: loop.sources[0] ?? 'memory',
      timestamp: loop.lastSeenAt,
      relatedEmotion: loop.emotion,
      relatedTrigger: loop.trigger,
    });
  }

  const all = Array.from(signals.values()).sort((a, b) => b.evidenceCount - a.evidenceCount || b.lastSeenAt - a.lastSeenAt);
  return {
    coreFears: all.filter(signal => signal.type === 'core_fear').slice(0, 8),
    coreBeliefs: all.filter(signal => signal.type === 'core_belief').slice(0, 8),
    majorTriggers: all.filter(signal => signal.type === 'major_trigger' && signal.label !== 'Not recorded yet').slice(0, 10),
    longTermGoals: all.filter(signal => signal.type === 'long_term_goal').slice(0, 8),
    recurringPatterns: all.filter(signal => signal.type === 'recurring_pattern').slice(0, 8),
  };
}

function buildGoalSignals(profile: OnboardingProfile | null): SignalDraft[] {
  if (!profile) return [];
  const now = profile.completedAt ?? Date.now();
  const goalLabels = [
    ...profile.primaryReasons.map(value => PRIMARY_REASON_OPTIONS.find(item => item.value === value)?.label),
    ...profile.preferredTools.map(value => SUPPORT_GOAL_OPTIONS.find(item => item.value === value)?.label),
    ...profile.desiredOutcomes.map(value => DESIRED_OUTCOME_OPTIONS.find(item => item.value === value)?.label),
    ...profile.hardestMoments.map(value => HARDEST_MOMENT_OPTIONS.find(item => item.value === value)?.label),
  ].filter((value): value is string => !!value);

  return [...new Set(goalLabels)].map(label => ({
    type: 'long_term_goal',
    label,
    description: `Onboarding goal or support need: ${label}.`,
    source: 'onboarding',
    timestamp: now,
  }));
}

function mergeRelationships(existing: RelationshipMemory[] | undefined): RelationshipMemory[] {
  return [...(existing ?? [])]
    .sort((a, b) => b.mentionCount - a.mentionCount || b.lastMentioned - a.lastMentioned)
    .slice(0, 12);
}

export function buildCompanionMemorySystem(params: {
  journalEntries: JournalEntry[];
  smartJournalEntries: SmartJournalEntry[];
  conversations: AIConversation[];
  savedInsights?: SavedCompanionInsight[];
  onboardingProfile: OnboardingProfile | null;
  enhancedMemoryStore: EnhancedCompanionMemoryStore | null;
}): CompanionMemorySystem {
  const checkInTimeline = buildCheckInTimeline(params.journalEntries);
  const journalTimeline = buildSmartJournalTimeline(params.smartJournalEntries);
  const conversationTimeline = buildConversationTimeline(params.conversations);
  const insightTimeline = buildInsightTimeline(params.savedInsights ?? []);
  const emotionalTimeline = [...checkInTimeline, ...journalTimeline, ...conversationTimeline, ...insightTimeline]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 120);
  const recurringLoops = buildRecurringLoops(emotionalTimeline);
  const emotionalGPS = buildEmotionalGPSMap(emotionalTimeline, recurringLoops);
  const signals = buildSignals({ ...params, timeline: emotionalTimeline, loops: recurringLoops });
  const importantRelationships = mergeRelationships(params.enhancedMemoryStore?.relationships);
  const system: CompanionMemorySystem = {
    emotionalGPS,
    ...signals,
    importantRelationships,
    emotionalTimeline,
    recurringLoops,
    narrative: '',
    updatedAt: Date.now(),
  };
  system.narrative = buildCompanionMemoryNarrative(system);
  return system;
}

export function mergeMemorySystemIntoEnhancedStore(
  store: EnhancedCompanionMemoryStore,
  system: CompanionMemorySystem,
): EnhancedCompanionMemoryStore {
  return {
    ...store,
    coreFears: system.coreFears,
    coreBeliefs: system.coreBeliefs,
    majorTriggers: system.majorTriggers,
    longTermGoals: system.longTermGoals,
    recurringPatterns: system.recurringPatterns,
    emotionalTimeline: system.emotionalTimeline,
    recurringLoops: system.recurringLoops,
    lastUpdated: Date.now(),
  };
}

export function buildCompanionMemoryNarrative(system: CompanionMemorySystem): string {
  const parts: string[] = ['[Companion Memory System]', system.emotionalGPS.aiTimelineNarrative];

  if (system.coreFears.length > 0) {
    parts.push(`Core fears noticed: ${system.coreFears.slice(0, 3).map(item => `${item.label} (${item.evidenceCount}x)`).join('; ')}.`);
  }
  if (system.coreBeliefs.length > 0) {
    parts.push(`Possible core beliefs: ${system.coreBeliefs.slice(0, 3).map(item => item.label).join('; ')}.`);
  }
  if (system.majorTriggers.length > 0) {
    parts.push(`Major triggers: ${system.majorTriggers.slice(0, 4).map(item => `${item.label} (${item.evidenceCount}x)`).join('; ')}.`);
  }
  if (system.importantRelationships.length > 0) {
    parts.push(`Important relationships: ${system.importantRelationships.slice(0, 3).map(rel => `${rel.name} (${rel.relationship}${rel.associatedTriggers.length > 0 ? `, often around ${rel.associatedTriggers.slice(0, 2).join('/')}` : ''})`).join('; ')}.`);
  }
  if (system.longTermGoals.length > 0) {
    parts.push(`Onboarding goals/support needs: ${system.longTermGoals.slice(0, 4).map(item => item.label).join('; ')}.`);
  }
  if (system.recurringLoops.length > 0) {
    const loop = system.recurringLoops[0];
    parts.push(`Strongest recurring loop: ${loop.trigger} -> ${loop.emotion} -> ${loop.fear} -> ${loop.urge} -> ${loop.commonAction} -> ${loop.commonOutcome}. Seen ${loop.count} times. Helpful interruption: ${loop.suggestedInterruption}.`);
  }
  if (system.emotionalTimeline.length > 0) {
    const recent = system.emotionalTimeline.slice(0, 3).map(event => {
      return `${event.trigger} -> ${event.emotion} -> ${event.fear} -> ${event.urge} -> ${event.action} -> ${event.outcome}`;
    });
    parts.push(`Recent emotional timeline: ${recent.join(' | ')}.`);
  }

  parts.push('Use this memory softly. Reference one relevant pattern or relationship only when it helps the current message. Say "based on your check-ins" or "this seems similar" instead of sounding certain.');
  return parts.join('\n');
}
