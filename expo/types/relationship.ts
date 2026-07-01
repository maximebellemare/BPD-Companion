export type RelationshipType =
  | 'partner'
  | 'ex'
  | 'friend'
  | 'parent'
  | 'sibling'
  | 'coworker'
  | 'therapist'
  | 'other';

export type RelationshipConfidence = 'low' | 'medium' | 'high';

export interface RelationshipProfile {
  id: string;
  name: string;
  relationshipType: RelationshipType;
  createdAt: number;
  updatedAt: number;
  emotionalTriggers: string[];
  communicationPatterns: string[];
  conflictPatterns: string[];
  positiveInteractions: string[];
  notes: string;
}

export interface RelationshipEvent {
  id: string;
  profileId: string;
  type: 'message_rewrite' | 'trigger' | 'emotion' | 'journal' | 'conversation' | 'distress' | 'coping';
  label: string;
  detail: string;
  intensity: number;
  timestamp: number;
  sourceType?: 'check_in' | 'journal' | 'conversation' | 'message' | 'manual';
  sourceId?: string;
  relationshipType?: RelationshipType;
  confidence?: RelationshipConfidence;
}

export interface RelationshipPatternInsight {
  id: string;
  profileId: string;
  type: 'emotional' | 'communication' | 'coping' | 'conflict' | 'growth';
  title: string;
  description: string;
  emoji: string;
  severity: 'info' | 'gentle' | 'important';
  frequency: number;
}

export interface RelationshipInterventionCard {
  id: string;
  profileId: string;
  title: string;
  description: string;
  emoji: string;
  actionRoute?: string;
  actionLabel?: string;
}

export interface RelationshipProfileAnalysis {
  profile: RelationshipProfile;
  events: RelationshipEvent[];
  insights: RelationshipPatternInsight[];
  interventions: RelationshipInterventionCard[];
  topEmotion: string | null;
  topTrigger: string | null;
  helpfulCopingTools: string[];
  recentDistressAvg: number;
  eventCount: number;
}

export interface RelationshipIntelligenceInsight {
  id: string;
  profileId: string;
  profileName: string;
  relationshipType: RelationshipType;
  title: string;
  description: string;
  evidence: string;
  severity: 'info' | 'gentle' | 'important';
  linkedSourceCount: number;
  confidence?: RelationshipConfidence;
  relationshipTypeLabel?: string;
}

export const RELATIONSHIP_TYPE_META: Record<RelationshipType, { label: string; emoji: string; color: string }> = {
  partner: { label: 'Partner', emoji: '💕', color: '#3B82F6' },
  parent: { label: 'Parent', emoji: '🏠', color: '#3B82F6' },
  friend: { label: 'Friend', emoji: '🤝', color: '#14B8A6' },
  ex: { label: 'Ex', emoji: '💔', color: '#67E8F9' },
  sibling: { label: 'Sibling', emoji: '👫', color: '#3B82F6' },
  coworker: { label: 'Coworker', emoji: '💼', color: '#14B8A6' },
  therapist: { label: 'Therapist', emoji: '🧠', color: '#14B8A6' },
  other: { label: 'Other', emoji: '👤', color: '#2E2A72' },
};

export const RELATIONSHIP_TAG_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'partner', label: 'Partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'friend', label: 'Friend' },
  { value: 'ex', label: 'Ex' },
  { value: 'coworker', label: 'Coworker' },
  { value: 'other', label: 'Other' },
];
