export type DBTModule = 'distress-tolerance' | 'emotional-regulation' | 'interpersonal-effectiveness' | 'mindfulness';

export interface DBTSkill {
  id: string;
  moduleId: DBTModule;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: DBTStep[];
  whenToUse: string[];
  tags: string[];
}

export interface DBTStep {
  title: string;
  instruction: string;
  tip?: string;
}

export interface DBTModuleInfo {
  id: DBTModule;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  iconName: string;
  skillCount: number;
}

export interface DBTProgress {
  completedSkills: Record<string, number>;
  lastPracticedAt: Record<string, number>;
  favoriteSkills: string[];
  totalPractices: number;
}

export interface DBTRecommendation {
  skillId: string;
  reason: string;
  priority: number;
}

export const DEFAULT_DBT_PROGRESS: DBTProgress = {
  completedSkills: {},
  lastPracticedAt: {},
  favoriteSkills: [],
  totalPractices: 0,
};
