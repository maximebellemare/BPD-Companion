import {
  SkillExercise,
  SkillExerciseResult,
  EmotionalState,
} from '@/types/companionMemory';
import { storageService } from '@/services/storage/storageService';

const SKILL_RESULTS_KEY = 'bpd_companion_skill_results';

const SKILL_EXERCISES: SkillExercise[] = [
  {
    id: 'skill_grounding_54321',
    name: '5-4-3-2-1 Grounding',
    category: 'grounding',
    estimatedMinutes: 3,
    forEmotionalStates: ['high_distress', 'emotional_overwhelm', 'abandonment_fear'],
    steps: [
      { instruction: 'Take a slow, deep breath. Let your feet feel the ground beneath you.' },
      { instruction: 'Name 5 things you can see right now. Look around slowly.', reflectionPrompt: 'What did you notice?' },
      { instruction: 'Name 4 things you can touch. Feel the textures around you.' },
      { instruction: 'Name 3 things you can hear. Listen carefully.' },
      { instruction: 'Name 2 things you can smell.' },
      { instruction: 'Name 1 thing you can taste.' },
      { instruction: 'Take another slow breath. You are here. You are safe.', reflectionPrompt: 'How do you feel now compared to when you started?' },
    ],
  },
  {
    id: 'skill_breathing_box',
    name: 'Box Breathing',
    category: 'breathing',
    estimatedMinutes: 4,
    forEmotionalStates: ['high_distress', 'emotional_overwhelm', 'communication_anxiety'],
    steps: [
      { instruction: 'Find a comfortable position. Close your eyes if that feels safe.' },
      { instruction: 'Breathe in slowly for 4 counts... 1... 2... 3... 4...', duration: 4 },
      { instruction: 'Hold gently for 4 counts... 1... 2... 3... 4...', duration: 4 },
      { instruction: 'Breathe out slowly for 4 counts... 1... 2... 3... 4...', duration: 4 },
      { instruction: 'Hold empty for 4 counts... 1... 2... 3... 4...', duration: 4 },
      { instruction: 'Repeat this cycle 3 more times at your own pace.' },
      { instruction: 'Notice how your body feels now.', reflectionPrompt: 'Did anything shift in your body or mind?' },
    ],
  },
  {
    id: 'skill_pause_messaging',
    name: 'Pause Before Messaging',
    category: 'pause',
    estimatedMinutes: 3,
    forEmotionalStates: ['communication_anxiety', 'relationship_trigger', 'recent_conflict'],
    steps: [
      { instruction: 'Before you send that message, take a moment. Your feelings are real, but the urgency might not be.' },
      { instruction: 'Ask yourself: What am I actually feeling right now?', reflectionPrompt: 'Name the feeling underneath the urge to message.' },
      { instruction: 'Ask yourself: What do I actually need right now?', reflectionPrompt: 'Is it reassurance? Connection? To be heard?' },
      { instruction: 'Ask yourself: Will sending this message meet that need, or could it create a new problem?' },
      { instruction: 'If you still want to send it, try writing it here first. Let it sit for 10 minutes before sending.', reflectionPrompt: 'What would you want to say?' },
    ],
  },
  {
    id: 'skill_reframe_abandonment',
    name: 'Reframing Abandonment Thoughts',
    category: 'reframing',
    estimatedMinutes: 5,
    forEmotionalStates: ['abandonment_fear', 'relationship_trigger'],
    steps: [
      { instruction: 'When fear of abandonment arrives, it can feel absolutely certain. But feelings are not facts.' },
      { instruction: 'Notice the thought. What is the story your mind is telling you?', reflectionPrompt: 'What is the thought? (e.g., "They are going to leave me")' },
      { instruction: 'Now ask: What evidence do I actually have that this is true right now?' },
      { instruction: 'Is there another explanation? Could there be a simpler reason for what happened?', reflectionPrompt: 'What is one alternative explanation?' },
      { instruction: 'Remind yourself: "I have been through this feeling before, and I survived it. This feeling will pass."' },
      { instruction: 'What would you say to a friend who had this same fear?', reflectionPrompt: 'What compassionate words come to mind?' },
    ],
  },
  {
    id: 'skill_urge_surfing',
    name: 'Urge Surfing',
    category: 'urge_surfing',
    estimatedMinutes: 4,
    forEmotionalStates: ['high_distress', 'emotional_overwhelm', 'communication_anxiety'],
    steps: [
      { instruction: 'An urge is like a wave. It rises, peaks, and then naturally falls. You do not have to act on it.' },
      { instruction: 'Notice where in your body you feel the urge. Chest? Stomach? Hands?', reflectionPrompt: 'Where do you feel it most?' },
      { instruction: 'Describe the sensation without judging it. Is it tight? Hot? Buzzing? Heavy?' },
      { instruction: 'Now imagine you are watching the urge like a wave in the ocean. It is rising...' },
      { instruction: 'Stay with it. Breathe. The wave is reaching its peak...' },
      { instruction: 'Notice it beginning to soften. Even slightly. Waves always recede.', reflectionPrompt: 'Has the intensity changed at all?' },
    ],
  },
  {
    id: 'skill_self_compassion',
    name: 'Self-Compassion After Conflict',
    category: 'self_compassion',
    estimatedMinutes: 4,
    forEmotionalStates: ['post_conflict_reflection', 'recent_conflict', 'identity_confusion'],
    steps: [
      { instruction: 'After conflict, shame and self-blame often arrive quickly. Let us slow that down.' },
      { instruction: 'Place your hand gently on your chest. Feel the warmth of your own touch.' },
      { instruction: 'Say to yourself: "This is a moment of suffering. Suffering is part of being human."' },
      { instruction: 'Say to yourself: "I am not the only person who struggles with this. Many people feel this way."' },
      { instruction: 'Say to yourself: "May I be kind to myself right now. May I give myself what I need."', reflectionPrompt: 'What do you need most right now?' },
      { instruction: 'Whatever happened, you are still worthy of compassion. Growth does not require perfection.' },
    ],
  },
];

export function getSkillExercises(): SkillExercise[] {
  return SKILL_EXERCISES;
}

export function getExerciseForState(state: EmotionalState): SkillExercise | null {
  const matching = SKILL_EXERCISES.filter(ex =>
    ex.forEmotionalStates.includes(state),
  );

  if (matching.length === 0) return null;
  return matching[Math.floor(Math.random() * matching.length)];
}

export function getExerciseById(id: string): SkillExercise | null {
  return SKILL_EXERCISES.find(ex => ex.id === id) ?? null;
}

export function getExercisesByCategory(category: SkillExercise['category']): SkillExercise[] {
  return SKILL_EXERCISES.filter(ex => ex.category === category);
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
