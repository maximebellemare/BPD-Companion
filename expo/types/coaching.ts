export type CoachingCategory =
  | 'communication'
  | 'emotional_regulation'
  | 'reassurance_seeking'
  | 'conflict_recovery'
  | 'pause_training'
  | 'self_soothing'
  | 'shame_recovery';

export interface CoachingNudge {
  id: string;
  category: CoachingCategory;
  title: string;
  message: string;
  supportingDetail?: string;
  suggestedAction?: CoachingSuggestedAction;
  intensity: 'gentle' | 'moderate' | 'direct';
  relevanceScore: number;
  basedOn: string[];
  createdAt: number;
}

export interface CoachingSuggestedAction {
  label: string;
  route: string;
  icon: string;
}

export interface CoachingInsight {
  id: string;
  pattern: string;
  observation: string;
  suggestion: string;
  category: CoachingCategory;
  confidence: 'low' | 'medium' | 'high';
}

export interface DailyCoaching {
  date: string;
  primaryNudge: CoachingNudge;
  secondaryNudges: CoachingNudge[];
  insights: CoachingInsight[];
  focusArea: string;
  focusDescription: string;
}

export interface CoachingWin {
  id: string;
  description: string;
  metric: string;
  changeDirection: 'positive' | 'neutral';
  category: CoachingCategory;
}

export const COACHING_CATEGORY_META: Record<CoachingCategory, { label: string; emoji: string; color: string }> = {
  communication: { label: 'Communication', emoji: '💬', color: '#3B82F6' },
  emotional_regulation: { label: 'Emotional Regulation', emoji: '🌊', color: '#6B9080' },
  reassurance_seeking: { label: 'Reassurance Patterns', emoji: '🔄', color: '#D4956A' },
  conflict_recovery: { label: 'Conflict Recovery', emoji: '🕊️', color: '#8B5CF6' },
  pause_training: { label: 'Pause Training', emoji: '⏸️', color: '#E84393' },
  self_soothing: { label: 'Self-Soothing', emoji: '🫶', color: '#00B894' },
  shame_recovery: { label: 'Shame Recovery', emoji: '💛', color: '#F59E0B' },
};
