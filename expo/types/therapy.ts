export type TherapyFocusArea =
  | 'distress_tolerance'
  | 'emotional_regulation'
  | 'interpersonal_effectiveness'
  | 'mindfulness'
  | 'relationship_patterns'
  | 'self_compassion';

export interface TherapyPlanItem {
  id: string;
  type: 'skill' | 'exercise' | 'reflection' | 'strategy';
  title: string;
  description: string;
  reason: string;
  route?: string;
  icon: string;
  focusArea: TherapyFocusArea;
  completed: boolean;
  day: number;
}

export interface WeeklyTherapyPlan {
  id: string;
  weekStart: number;
  weekEnd: number;
  focusArea: TherapyFocusArea;
  focusLabel: string;
  focusDescription: string;
  items: TherapyPlanItem[];
  personalInsight: string;
  encouragement: string;
  generatedAt: number;
}

export interface TherapyPlanState {
  currentPlan: WeeklyTherapyPlan | null;
  previousPlans: WeeklyTherapyPlan[];
  lastGeneratedAt: number;
}

export const FOCUS_AREA_META: Record<TherapyFocusArea, { label: string; color: string; bgColor: string; icon: string }> = {
  distress_tolerance: {
    label: 'Distress Tolerance',
    color: '#E17055',
    bgColor: '#FDE8E3',
    icon: 'Shield',
  },
  emotional_regulation: {
    label: 'Emotional Regulation',
    color: '#6B9080',
    bgColor: '#E3EDE8',
    icon: 'Heart',
  },
  interpersonal_effectiveness: {
    label: 'Interpersonal Effectiveness',
    color: '#3B82F6',
    bgColor: '#E6F0FF',
    icon: 'Users',
  },
  mindfulness: {
    label: 'Mindfulness',
    color: '#8B5CF6',
    bgColor: '#F0E6FF',
    icon: 'Eye',
  },
  relationship_patterns: {
    label: 'Relationship Patterns',
    color: '#E84393',
    bgColor: '#FFE6F0',
    icon: 'HeartHandshake',
  },
  self_compassion: {
    label: 'Self-Compassion',
    color: '#D4956A',
    bgColor: '#F5E6D8',
    icon: 'Sparkles',
  },
};
