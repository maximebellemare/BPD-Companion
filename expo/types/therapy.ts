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
    color: '#3B82F6',
    bgColor: '#FFFFFF',
    icon: 'Shield',
  },
  emotional_regulation: {
    label: 'Emotional Regulation',
    color: '#14B8A6',
    bgColor: '#0B1238',
    icon: 'Heart',
  },
  interpersonal_effectiveness: {
    label: 'Interpersonal Effectiveness',
    color: '#3B82F6',
    bgColor: '#FFFFFF',
    icon: 'Users',
  },
  mindfulness: {
    label: 'Mindfulness',
    color: '#3B82F6',
    bgColor: '#FFFFFF',
    icon: 'Eye',
  },
  relationship_patterns: {
    label: 'Relationship Patterns',
    color: '#3B82F6',
    bgColor: '#FFFFFF',
    icon: 'HeartHandshake',
  },
  self_compassion: {
    label: 'Self-Compassion',
    color: '#67E8F9',
    bgColor: '#0B1238',
    icon: 'Sparkles',
  },
};
