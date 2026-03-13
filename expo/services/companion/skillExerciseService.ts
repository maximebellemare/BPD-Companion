import {
  SkillExercise,
  SkillExerciseResult,
  EmotionalState,
} from '@/types/companionMemory';
import { storageService } from '@/services/storage/storageService';
import { EXTENDED_SKILL_LIBRARY } from '@/data/skills/skillLibrary';

const SKILL_RESULTS_KEY = 'bpd_companion_skill_results';

export function getSkillExercises(): SkillExercise[] {
  return EXTENDED_SKILL_LIBRARY;
}

export function getExerciseForState(state: EmotionalState): SkillExercise | null {
  const matching = EXTENDED_SKILL_LIBRARY.filter(ex =>
    ex.forEmotionalStates.includes(state),
  );

  if (matching.length === 0) return null;
  return matching[Math.floor(Math.random() * matching.length)];
}

export function getExerciseById(id: string): SkillExercise | null {
  return EXTENDED_SKILL_LIBRARY.find(ex => ex.id === id) ?? null;
}

export function getExercisesByCategory(category: SkillExercise['category']): SkillExercise[] {
  return EXTENDED_SKILL_LIBRARY.filter(ex => ex.category === category);
}

export async function loadSkillResults(): Promise<SkillExerciseResult[]> {
  try {
    const stored = await storageService.get<SkillExerciseResult[]>(SKILL_RESULTS_KEY);
    return stored ?? [];
  } catch (error) {
    console.log('[SkillExercise] Error loading results:', error);
    return [];
  }
}

export async function saveSkillResult(result: SkillExerciseResult): Promise<void> {
  try {
    const existing = await loadSkillResults();
    const updated = [result, ...existing].slice(0, 100);
    await storageService.set(SKILL_RESULTS_KEY, updated);
    console.log('[SkillExercise] Saved result for:', result.exerciseId);
  } catch (error) {
    console.log('[SkillExercise] Error saving result:', error);
  }
}

export function buildSkillSuggestionForAI(state: EmotionalState): string | null {
  const exercise = getExerciseForState(state);
  if (!exercise) return null;

  return `\n\nI have a short exercise that might help right now: "${exercise.name}" (about ${exercise.estimatedMinutes} minutes). Would you like to try it together?`;
}

export function formatExerciseStepForChat(exercise: SkillExercise, stepIndex: number): string {
  const step = exercise.steps[stepIndex];
  if (!step) return '';

  let text = step.instruction;
  if (step.reflectionPrompt) {
    text += `\n\n${step.reflectionPrompt}`;
  }

  const isLast = stepIndex === exercise.steps.length - 1;
  if (!isLast) {
    text += '\n\n(Say "next" when you are ready to continue)';
  } else {
    text += '\n\nYou did great. How are you feeling now?';
  }

  return text;
}
