export type RelationshipType =
  | 'partner'
  | 'ex'
  | 'friend'
  | 'parent'
  | 'sibling'
  | 'coworker'
  | 'therapist'
  | 'other';

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
  type: 'message_rewrite' | 'trigger' | 'emotion' | 'journal' | 'distress' | 'coping';
  label: string;
  detail: string;
  intensity: number;
  timestamp: number;
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

export const RELATIONSHIP_TYPE_META: Record<RelationshipType, { label: string; emoji: string; color: string }> = {
  partner: { label: 'Partner', emoji: '💕', color: '#3B82F6' },
  ex: { label: 'Ex', emoji: '💔', color: '#67E8F9' },
  friend: { label: 'Friend', emoji: '🤝', color: '#14B8A6' },
  parent: { label: 'Parent', emoji: '🏠', color: '#3B82F6' },
  sibling: { label: 'Sibling', emoji: '👫', color: '#3B82F6' },
  coworker: { label: 'Coworker', emoji: '💼', color: '#14B8A6' },
  therapist: { label: 'Therapist', emoji: '🧠', color: '#14B8A6' },
  other: { label: 'Other', emoji: '👤', color: '#2E2A72' },
};
