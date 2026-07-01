import { AIConversation } from '@/types/ai';
import { JournalEntry, MessageDraft } from '@/types';
import {
  RelationshipEvent,
  RelationshipIntelligenceInsight,
  RelationshipProfile,
  RelationshipType,
  RELATIONSHIP_TYPE_META,
} from '@/types/relationship';
import {
  buildRelationshipTaggedSources,
  formatRelationshipType,
} from '@/services/relationships/relationshipTaggingService';

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const TYPE_KEYWORDS: Record<RelationshipType, string[]> = {
  partner: ['partner', 'boyfriend', 'girlfriend', 'husband', 'wife', 'spouse', 'date', 'dating'],
  parent: ['parent', 'mom', 'mother', 'dad', 'father'],
  friend: ['friend', 'best friend', 'bestie', 'bff'],
  ex: ['ex', 'ex boyfriend', 'ex girlfriend', 'ex husband', 'ex wife'],
  other: [],
  sibling: ['sister', 'brother', 'sibling'],
  coworker: ['boss', 'coworker', 'colleague', 'manager'],
  therapist: ['therapist', 'counselor', 'doctor'],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function withinLastMonth(timestamp: number, now: number): boolean {
  return now - timestamp <= MONTH_MS;
}

function includesTerm(text: string, term: string): boolean {
  const clean = normalize(term);
  if (!clean) return false;
  if (clean.length <= 3) return text.split(/\W+/).includes(clean);
  return text.includes(clean);
}

function profileReferenceText(profile: RelationshipProfile): string[] {
  const names = [profile.name, ...profile.name.split(/\s+/)].filter(part => part.trim().length >= 2);
  return [...names, ...TYPE_KEYWORDS[profile.relationshipType]];
}

function matchesProfile(text: string, profile: RelationshipProfile): boolean {
  const lower = normalize(text);
  return profileReferenceText(profile).some(term => includesTerm(lower, term));
}

function relationshipLabel(profile: RelationshipProfile): string {
  const typeLabel = RELATIONSHIP_TYPE_META[profile.relationshipType]?.label.toLowerCase() ?? profile.relationshipType;
  if (profile.name.trim()) return `${profile.name} (${typeLabel})`;
  return `your ${typeLabel}`;
}

function compactEvidence(count: number, source: string): string {
  return `${count} linked ${source}${count === 1 ? '' : 's'} in the last 30 days`;
}

function confidenceFromCount(count: number, total: number): 'low' | 'medium' | 'high' {
  if (count >= 4 || (total >= 5 && count / total >= 0.5)) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
}

function entryText(entry: JournalEntry): string {
  return [
    entry.reflection ?? '',
    entry.checkIn.notes ?? '',
    ...entry.checkIn.triggers.map(trigger => trigger.label),
    ...entry.checkIn.emotions.map(emotion => emotion.label),
    ...entry.checkIn.urges.map(urge => urge.label),
  ].join(' ');
}

function conversationText(conversation: AIConversation): string {
  return [
    conversation.title,
    conversation.preview,
    ...conversation.tags,
    ...conversation.messages.filter(message => message.role === 'user').map(message => message.content),
  ].join(' ');
}

function hasAbandonmentSignal(text: string): boolean {
  return ['abandon', 'left me', 'leaving', 'ignored', 'no reply', 'not texting', 'ghost', 'forgotten', 'rejected'].some(term => text.includes(term));
}

function hasConflictSignal(text: string): boolean {
  return ['conflict', 'fight', 'argument', 'arguing', 'yelled', 'criticism', 'criticized', 'dismissed'].some(term => text.includes(term));
}

function hasShameSignal(text: string): boolean {
  return ['shame', 'ashamed', 'embarrassed', 'bad person', 'too much', 'my fault', 'worthless'].some(term => text.includes(term));
}

export function buildRelationshipIntelligence(params: {
  profiles: RelationshipProfile[];
  journalEntries: JournalEntry[];
  messageDrafts: MessageDraft[];
  conversations: AIConversation[];
  storedEvents?: RelationshipEvent[];
  now?: number;
}): {
  linkedEvents: RelationshipEvent[];
  insights: RelationshipIntelligenceInsight[];
} {
  const now = params.now ?? Date.now();
  const linkedEvents: RelationshipEvent[] = [];
  const insights: RelationshipIntelligenceInsight[] = [];
  const taggedSources = buildRelationshipTaggedSources({
    journalEntries: params.journalEntries,
    conversations: params.conversations,
    now,
  });

  const typeCounts = new Map<RelationshipType, {
    total: number;
    emotions: Map<string, number>;
    triggers: Map<string, number>;
    anxiety: number;
    shame: number;
    conflict: number;
    withdrawal: number;
  }>();

  for (const source of taggedSources) {
    const lower = normalize(source.text);
    for (const relationshipType of source.relationshipTags) {
      const bucket = typeCounts.get(relationshipType) ?? {
        total: 0,
        emotions: new Map<string, number>(),
        triggers: new Map<string, number>(),
        anxiety: 0,
        shame: 0,
        conflict: 0,
        withdrawal: 0,
      };
      bucket.total += 1;
      source.emotions.forEach((emotion) => {
        const key = emotion.trim();
        if (key) bucket.emotions.set(key, (bucket.emotions.get(key) ?? 0) + 1);
      });
      source.triggers.forEach((trigger) => {
        const key = trigger.trim();
        if (key) bucket.triggers.set(key, (bucket.triggers.get(key) ?? 0) + 1);
      });
      if (includesTerm(lower, 'anxious') || includesTerm(lower, 'anxiety') || hasAbandonmentSignal(lower)) bucket.anxiety += 1;
      if (hasShameSignal(lower)) bucket.shame += 1;
      if (hasConflictSignal(lower)) bucket.conflict += 1;
      if (includesTerm(lower, 'withdraw') || includesTerm(lower, 'shut down') || includesTerm(lower, 'pull away')) bucket.withdrawal += 1;
      typeCounts.set(relationshipType, bucket);
    }
  }

  for (const [relationshipType, bucket] of typeCounts.entries()) {
    if (bucket.total < 2) continue;
    const typeLabel = formatRelationshipType(relationshipType);
    const topEmotion = [...bucket.emotions.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
    const confidence = confidenceFromCount(bucket.total, taggedSources.length);

    if (bucket.anxiety >= 2 || (topEmotion && normalize(topEmotion[0]).includes('anx'))) {
      insights.push({
        id: `ri_type_anxiety_${relationshipType}`,
        profileId: `relationship_type_${relationshipType}`,
        profileName: RELATIONSHIP_TYPE_META[relationshipType]?.label ?? relationshipType,
        relationshipType,
        relationshipTypeLabel: RELATIONSHIP_TYPE_META[relationshipType]?.label ?? relationshipType,
        title: `Relationship anxiety may appear most often with your ${typeLabel}`,
        description: `Anxiety or abandonment-related language appears repeatedly in entries tagged with ${typeLabel}.`,
        evidence: `${bucket.anxiety || topEmotion?.[1] || bucket.total} ${typeLabel} linked source${bucket.total === 1 ? '' : 's'} in the last 30 days`,
        severity: confidence === 'high' ? 'important' : 'gentle',
        linkedSourceCount: bucket.total,
        confidence,
      });
    }

    if (bucket.shame >= 2) {
      insights.push({
        id: `ri_type_shame_${relationshipType}`,
        profileId: `relationship_type_${relationshipType}`,
        profileName: RELATIONSHIP_TYPE_META[relationshipType]?.label ?? relationshipType,
        relationshipType,
        relationshipTypeLabel: RELATIONSHIP_TYPE_META[relationshipType]?.label ?? relationshipType,
        title: `Shame-related entries may involve your ${typeLabel}`,
        description: `Shame-related language appears repeatedly in entries or conversations tagged with ${typeLabel}.`,
        evidence: `${bucket.shame} shame-related ${typeLabel} source${bucket.shame === 1 ? '' : 's'} in the last 30 days`,
        severity: 'gentle',
        linkedSourceCount: bucket.total,
        confidence: confidenceFromCount(bucket.shame, bucket.total),
      });
    }

    if (bucket.conflict >= 2 && bucket.withdrawal >= 1) {
      insights.push({
        id: `ri_type_conflict_withdrawal_${relationshipType}`,
        profileId: `relationship_type_${relationshipType}`,
        profileName: RELATIONSHIP_TYPE_META[relationshipType]?.label ?? relationshipType,
        relationshipType,
        relationshipTypeLabel: RELATIONSHIP_TYPE_META[relationshipType]?.label ?? relationshipType,
        title: `Conflict with your ${typeLabel} may precede withdrawal`,
        description: `Conflict and withdrawal language appear together enough to watch gently.`,
        evidence: `${bucket.conflict} conflict signal${bucket.conflict === 1 ? '' : 's'} and ${bucket.withdrawal} withdrawal signal${bucket.withdrawal === 1 ? '' : 's'}`,
        severity: 'gentle',
        linkedSourceCount: bucket.total,
        confidence: confidenceFromCount(Math.min(bucket.conflict, bucket.withdrawal + 1), bucket.total),
      });
    }
  }

  for (const profile of params.profiles) {
    const profileLabel = relationshipLabel(profile);
    const journalMatches = params.journalEntries
      .filter(entry => withinLastMonth(entry.timestamp, now))
      .filter(entry => matchesProfile(entryText(entry), profile));
    const draftMatches = params.messageDrafts
      .filter(draft => withinLastMonth(draft.timestamp, now))
      .filter(draft => matchesProfile(draft.originalText, profile));
    const conversationMatches = params.conversations
      .filter(conversation => withinLastMonth(conversation.updatedAt, now))
      .filter(conversation => matchesProfile(conversationText(conversation), profile));
    const storedMatches = (params.storedEvents ?? [])
      .filter(event => event.profileId === profile.id && withinLastMonth(event.timestamp, now));

    journalMatches.forEach((entry) => {
      linkedEvents.push({
        id: `ri_journal_${profile.id}_${entry.id}`,
        profileId: profile.id,
        type: 'journal',
        label: 'Linked check-in or journal',
        detail: entry.checkIn.notes || entry.reflection || 'Relationship-related entry',
        intensity: entry.checkIn.intensityLevel,
        timestamp: entry.timestamp,
        sourceType: entry.reflection ? 'journal' : 'check_in',
        sourceId: entry.id,
      });
    });

    draftMatches.forEach((draft) => {
      linkedEvents.push({
        id: `ri_message_${profile.id}_${draft.id}`,
        profileId: profile.id,
        type: 'message_rewrite',
        label: 'Linked message draft',
        detail: draft.paused ? 'Paused before sending' : draft.sent ? 'Sent' : 'Drafted',
        intensity: 0,
        timestamp: draft.timestamp,
        sourceType: 'message',
        sourceId: draft.id,
      });
    });

    conversationMatches.forEach((conversation) => {
      linkedEvents.push({
        id: `ri_conversation_${profile.id}_${conversation.id}`,
        profileId: profile.id,
        type: 'conversation',
        label: 'Linked Companion conversation',
        detail: conversation.preview || conversation.title,
        intensity: 0,
        timestamp: conversation.updatedAt,
        sourceType: 'conversation',
        sourceId: conversation.id,
      });
    });

    const linkedCount = journalMatches.length + draftMatches.length + conversationMatches.length + storedMatches.length;
    if (linkedCount < 2) continue;

    const journalTexts = journalMatches.map(entry => normalize(entryText(entry)));
    const conversationTexts = conversationMatches.map(conversation => normalize(conversationText(conversation)));
    const draftTexts = draftMatches.map(draft => normalize(draft.originalText));
    const allTexts = [...journalTexts, ...conversationTexts, ...draftTexts];
    const abandonmentCount = allTexts.filter(hasAbandonmentSignal).length;
    const conflictCount = allTexts.filter(hasConflictSignal).length;
    const shameCount = allTexts.filter(hasShameSignal).length;
    const conflictAndShameCount = allTexts.filter(text => hasConflictSignal(text) && hasShameSignal(text)).length;

    if (abandonmentCount >= 2) {
      insights.push({
        id: `ri_abandonment_${profile.id}`,
        profileId: profile.id,
        profileName: profile.name,
        relationshipType: profile.relationshipType,
        title: `Abandonment fears may cluster around ${profileLabel}`,
        description: `Abandonment or rejection language appears repeatedly in entries linked to ${profileLabel}.`,
        evidence: compactEvidence(abandonmentCount, 'abandonment-related moment'),
        severity: abandonmentCount >= 4 ? 'important' : 'gentle',
        linkedSourceCount: linkedCount,
        confidence: confidenceFromCount(abandonmentCount, linkedCount),
      });
    }

    if (conflictAndShameCount >= 2) {
      insights.push({
        id: `ri_conflict_shame_${profile.id}`,
        profileId: profile.id,
        profileName: profile.name,
        relationshipType: profile.relationshipType,
        title: `Conflict with ${profileLabel} may precede shame`,
        description: `When conflict shows up around ${profileLabel}, shame-related language also appears in your linked entries.`,
        evidence: compactEvidence(conflictAndShameCount, 'conflict-and-shame pattern'),
        severity: 'gentle',
        linkedSourceCount: linkedCount,
        confidence: confidenceFromCount(conflictAndShameCount, linkedCount),
      });
    }

    if (conflictCount >= 2 && conflictAndShameCount < 2) {
      insights.push({
        id: `ri_conflict_${profile.id}`,
        profileId: profile.id,
        profileName: profile.name,
        relationshipType: profile.relationshipType,
        title: `Conflict is a repeated theme with ${profileLabel}`,
        description: `Conflict-related language appears more than once in entries or conversations linked to ${profileLabel}.`,
        evidence: compactEvidence(conflictCount, 'conflict-related moment'),
        severity: conflictCount >= 4 ? 'important' : 'info',
        linkedSourceCount: linkedCount,
        confidence: confidenceFromCount(conflictCount, linkedCount),
      });
    }

    if (shameCount >= 2 && conflictAndShameCount < 2) {
      insights.push({
        id: `ri_shame_${profile.id}`,
        profileId: profile.id,
        profileName: profile.name,
        relationshipType: profile.relationshipType,
        title: `Shame appears around ${profileLabel}`,
        description: `Shame-related language appears repeatedly in relationship data linked to ${profileLabel}.`,
        evidence: compactEvidence(shameCount, 'shame-related moment'),
        severity: 'gentle',
        linkedSourceCount: linkedCount,
        confidence: confidenceFromCount(shameCount, linkedCount),
      });
    }
  }

  return {
    linkedEvents: linkedEvents.sort((a, b) => b.timestamp - a.timestamp),
    insights: insights.sort((a, b) => b.linkedSourceCount - a.linkedSourceCount),
  };
}
