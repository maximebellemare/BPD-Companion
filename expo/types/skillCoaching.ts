import { SkillExercise, SkillExerciseResult } from '@/types/companionMemory';

export interface SkillCategory {
  id: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  iconName: string;
}

export interface SkillCoachingSession {
  id: string;
  exerciseId: string;
  startedAt: number;
  completedAt?: number;
  currentStepIndex: number;
  identifiedEmotion?: string;
  identifiedTrigger?: string;
  distressBefore: number;
  distressAfter?: number;
  reflections: SkillReflection[];
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface SkillReflection {
  stepIndex: number;
  prompt: string;
  response: string;
  timestamp: number;
}

export interface SkillEffectiveness {
  exerciseId: string;
  category: string;
  totalAttempts: number;
  totalCompletions: number;
  averageDistressReduction: number;
  lastUsed: number;
}

export interface PersonalizedSkillRanking {
  exercise: SkillExercise;
  score: number;
  reason: string;
}

export interface SkillCoachingHistory {
  sessions: SkillCoachingSession[];
  results: SkillExerciseResult[];
  effectiveness: SkillEffectiveness[];
  lastUpdated: number;
}
