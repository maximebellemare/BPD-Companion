import { AIConversation } from '@/types/ai';
import { JournalEntry } from '@/types';
import {
  RelationshipConfidence,
  RelationshipType,
  RELATIONSHIP_TYPE_META,
} from '@/types/relationship';

const TAG_KEYWORDS: Record<RelationshipType, string[]> = {
  partner: ['partner', 'boyfriend', 'girlfriend', 'husband', 'wife', 'spouse', 'date', 'dating'],
  parent: ['parent', 'mom', 'mother', 'dad', 'father', 'family'],
  friend: ['friend', 'best friend', 'bestie', 'bff'],
  ex: ['ex', 'ex boyfriend', 'ex girlfriend', 'ex husband', 'ex wife'],
  coworker: ['coworker', 'colleague', 'boss', 'manager', 'work'],
  other: [],
  sibling: ['sister', 'brother', 'sibling'],
  therapist: ['therapist', 'counselor', 'psychiatrist', 'doctor'],
};

export type RelationshipTaggedSource = {
  id: string;
  timestamp: number;
  sourceType: 'check_in' | 'journal' | 'conversation';
  text: string;
  intensity: number;
  emotions: string[];
  triggers: string[];
  relationshipTags: RelationshipType[];
  confidence: RelationshipConfidence;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueRelationshipTags(tags: Array<RelationshipType | undefined | null>): RelationshipType[] {
  return [...new Set(tags.filter((tag): tag is RelationshipType => !!tag))];
}

function inferTagsFromText(text: string): RelationshipType[] {
  const lower = normalize(text);
  return uniqueRelationshipTags(
    (Object.keys(TAG_KEYWORDS) as RelationshipType[]).filter(type =>
      TAG_KEYWORDS[type].some(keyword => lower.includes(keyword)),
    ),
  ).filter(type => type !== 'therapist' && type !== 'sibling');
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
    ...(conversation.tags ?? []),
    ...conversation.messages.filter(message => message.role === 'user').map(message => message.content),
  ].join(' ');
}

export function getRelationshipTagsForEntry(entry: JournalEntry): RelationshipType[] {
  return uniqueRelationshipTags([
    ...(entry.relationshipTags ?? []),
    ...(entry.checkIn.relationshipTags ?? []),
    ...entry.checkIn.triggers.flatMap(trigger => trigger.relationshipTags ?? []),
    ...inferTagsFromText(entryText(entry)),
  ]);
}

export function getRelationshipTagsForConversation(conversation: AIConversation): RelationshipType[] {
  return uniqueRelationshipTags([
    ...(conversation.relationshipTags ?? []),
    ...inferTagsFromText(conversationText(conversation)),
  ]);
}

export function inferRelationshipTagsFromMessage(message: string): RelationshipType[] {
  return inferTagsFromText(message);
}

export function buildRelationshipTaggedSources(params: {
  journalEntries: JournalEntry[];
  conversations: AIConversation[];
  now?: number;
  maxAgeMs?: number;
}): RelationshipTaggedSource[] {
  const now = params.now ?? Date.now();
  const maxAgeMs = params.maxAgeMs ?? 30 * 24 * 60 * 60 * 1000;
  const sources: RelationshipTaggedSource[] = [];

  for (const entry of params.journalEntries) {
    if (now - entry.timestamp > maxAgeMs) continue;
    const explicitTags = uniqueRelationshipTags([
      ...(entry.relationshipTags ?? []),
      ...(entry.checkIn.relationshipTags ?? []),
      ...entry.checkIn.triggers.flatMap(trigger => trigger.relationshipTags ?? []),
    ]);
    const tags = explicitTags.length > 0 ? explicitTags : inferTagsFromText(entryText(entry));
    if (tags.length === 0) continue;
    sources.push({
      id: entry.id,
      timestamp: entry.timestamp,
      sourceType: entry.reflection ? 'journal' : 'check_in',
      text: entryText(entry),
      intensity: entry.checkIn.intensityLevel,
      emotions: entry.checkIn.emotions.map(emotion => emotion.label),
      triggers: entry.checkIn.triggers.map(trigger => trigger.label),
      relationshipTags: tags,
      confidence: explicitTags.length > 0 ? 'high' : 'medium',
    });
  }

  for (const conversation of params.conversations) {
    if (now - conversation.updatedAt > maxAgeMs) continue;
    const explicitTags = conversation.relationshipTags ?? [];
    const tags = explicitTags.length > 0 ? explicitTags : inferTagsFromText(conversationText(conversation));
    if (tags.length === 0) continue;
    sources.push({
      id: conversation.id,
      timestamp: conversation.updatedAt,
      sourceType: 'conversation',
      text: conversationText(conversation),
      intensity: 0,
      emotions: [],
      triggers: conversation.tags ?? [],
      relationshipTags: tags,
      confidence: explicitTags.length > 0 ? 'high' : 'medium',
    });
  }

  return sources.sort((a, b) => b.timestamp - a.timestamp);
}

export function formatRelationshipType(type: RelationshipType): string {
  return RELATIONSHIP_TYPE_META[type]?.label.toLowerCase() ?? type;
}

