export interface CoachModuleStep {
  id: string;
  type: 'introduction' | 'explanation' | 'reflection' | 'exercise' | 'closing';
  promptText: string;
  reflectionQuestion?: string;
  optionalExercise?: string;
  optionalExample?: string;
  tipText?: string;
}

export interface CoachModule {
  id: string;
  title: string;
  category: CoachModuleCategory;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  introText: string;
  steps: CoachModuleStep[];
  tags: string[];
  isPremium: boolean;
}

export type CoachModuleCategory =
  | 'emotional_regulation'
  | 'relationships'
  | 'triggers_abandonment'
  | 'self_identity'
  | 'communication'
  | 'crisis_coping'
  | 'grounding';

export const COACH_CATEGORY_META: Record<CoachModuleCategory, { label: string; color: string; icon: string }> = {
  emotional_regulation: { label: 'Emotional Regulation', color: '#D4956A', icon: 'heart' },
  relationships: { label: 'Relationships', color: '#7B8CDE', icon: 'users' },
  triggers_abandonment: { label: 'Triggers & Abandonment', color: '#E17055', icon: 'anchor' },
  self_identity: { label: 'Self & Identity', color: '#A29BFE', icon: 'fingerprint' },
  communication: { label: 'Communication', color: '#00B894', icon: 'message-circle' },
  crisis_coping: { label: 'Crisis & Coping', color: '#F0A500', icon: 'cloud-lightning' },
  grounding: { label: 'Grounding', color: '#6B9080', icon: 'anchor' },
};

export interface CoachModuleProgress {
  moduleId: string;
  startedAt: number;
  completedAt: number | null;
  currentStepIndex: number;
  reflectionResponses: Record<string, string>;
  insightGenerated: string | null;
  skillPracticed: string | null;
}

export interface CoachProgressState {
  moduleProgress: Record<string, CoachModuleProgress>;
  completedModuleIds: string[];
  skillsPracticed: string[];
  totalReflections: number;
  insights: CoachInsight[];
  lastSessionAt: number | null;
}

export interface CoachInsight {
  id: string;
  moduleId: string;
  moduleTitle: string;
  insightText: string;
  skillPracticed: string | null;
  createdAt: number;
  savedToJournal: boolean;
}

export interface CoachSessionState {
  moduleId: string;
  currentStepIndex: number;
  responses: Record<string, string>;
  isComplete: boolean;
  startedAt: number;
}
