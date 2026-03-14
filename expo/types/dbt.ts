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
  quickSteps?: DBTQuickStep[];
  whenToUse: string[];
  tags: string[];
  situationalTags?: string[];
}

export interface DBTStep {
  title: string;
  instruction: string;
  tip?: string;
}

export interface DBTQuickStep {
  letter?: string;
  title: string;
  instruction: string;
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

export interface DBTPracticeLog {
  id: string;
  skillId: string;
  moduleId: DBTModule;
  timestamp: number;
  distressBefore: number;
  distressAfter: number;
  helpful: boolean | null;
  situationTag?: string;
  relationshipContext?: string;
  notes?: string;
  quickMode: boolean;
}

export interface DBTSkillInsight {
  skillId: string;
  totalUses: number;
  helpfulCount: number;
  avgDistressReduction: number;
  bestDistressRange: string;
  lastUsed: number;
}

export interface DBTSituationalEntry {
  id: string;
  label: string;
  sublabel: string;
  iconName: string;
  color: string;
  bgColor: string;
  skillIds: string[];
}

export const DEFAULT_DBT_PROGRESS: DBTProgress = {
  completedSkills: {},
  lastPracticedAt: {},
  favoriteSkills: [],
  totalPractices: 0,
};
