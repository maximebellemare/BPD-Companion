import { storageService } from '@/services/storage/storageService';
import {
  CoachProgressState,
  CoachModuleProgress,
  CoachInsight,
} from '@/types/coachModule';

const COACH_PROGRESS_KEY = 'bpd_coach_progress';

const DEFAULT_STATE: CoachProgressState = {
  moduleProgress: {},
  completedModuleIds: [],
  skillsPracticed: [],
  totalReflections: 0,
  insights: [],
  lastSessionAt: null,
};

export async function getCoachProgressState(): Promise<CoachProgressState> {
  const data = await storageService.get<CoachProgressState>(COACH_PROGRESS_KEY);
  if (data) {
    console.log('[CoachProgress] Loaded progress state');
    return data;
  }
  console.log('[CoachProgress] No state found, using defaults');
  return DEFAULT_STATE;
}

export async function saveCoachProgressState(state: CoachProgressState): Promise<void> {
  await storageService.set(COACH_PROGRESS_KEY, state);
  console.log('[CoachProgress] Saved progress state');
}

export async function startModule(moduleId: string): Promise<CoachProgressState> {
  const state = await getCoachProgressState();
  const existing = state.moduleProgress[moduleId];

  if (existing && existing.completedAt) {
    console.log('[CoachProgress] Module already completed, restarting:', moduleId);
  }

  const progress: CoachModuleProgress = {
    moduleId,
    startedAt: Date.now(),
    completedAt: null,
    currentStepIndex: 0,
    reflectionResponses: existing?.reflectionResponses ?? {},
    insightGenerated: null,
    skillPracticed: null,
  };

  const newState: CoachProgressState = {
    ...state,
    moduleProgress: { ...state.moduleProgress, [moduleId]: progress },
    lastSessionAt: Date.now(),
  };

  await saveCoachProgressState(newState);
  console.log('[CoachProgress] Started module:', moduleId);
  return newState;
}

export async function updateStepProgress(
  moduleId: string,
  stepIndex: number,
  reflectionStepId?: string,
  reflectionResponse?: string,
): Promise<CoachProgressState> {
  const state = await getCoachProgressState();
  const existing = state.moduleProgress[moduleId];
  if (!existing) {
    console.log('[CoachProgress] No progress for module:', moduleId);
    return state;
  }

  const responses = { ...existing.reflectionResponses };
  let addedReflection = 0;
  if (reflectionStepId && reflectionResponse && reflectionResponse.trim()) {
    responses[reflectionStepId] = reflectionResponse;
    if (!existing.reflectionResponses[reflectionStepId]) {
      addedReflection = 1;
    }
  }

  const progress: CoachModuleProgress = {
    ...existing,
    currentStepIndex: Math.max(existing.currentStepIndex, stepIndex),
    reflectionResponses: responses,
  };

  const newState: CoachProgressState = {
    ...state,
    moduleProgress: { ...state.moduleProgress, [moduleId]: progress },
    totalReflections: state.totalReflections + addedReflection,
  };

  await saveCoachProgressState(newState);
  return newState;
}

export async function completeModule(
  moduleId: string,
  insightText: string,
  skillPracticed: string | null,
  moduleTitle: string,
): Promise<CoachProgressState> {
  const state = await getCoachProgressState();
  const existing = state.moduleProgress[moduleId];

  const progress: CoachModuleProgress = {
    ...(existing ?? {
      moduleId,
      startedAt: Date.now(),
      currentStepIndex: 0,
      reflectionResponses: {},
    }),
    completedAt: Date.now(),
    insightGenerated: insightText,
    skillPracticed,
  };

  const completedIds = state.completedModuleIds.includes(moduleId)
    ? state.completedModuleIds
    : [...state.completedModuleIds, moduleId];

  const skills = skillPracticed && !state.skillsPracticed.includes(skillPracticed)
    ? [...state.skillsPracticed, skillPracticed]
    : state.skillsPracticed;

  const insight: CoachInsight = {
    id: `ci-${Date.now()}-${moduleId}`,
    moduleId,
    moduleTitle,
    insightText,
    skillPracticed,
    createdAt: Date.now(),
    savedToJournal: false,
  };

  const newState: CoachProgressState = {
    ...state,
    moduleProgress: { ...state.moduleProgress, [moduleId]: progress },
    completedModuleIds: completedIds,
    skillsPracticed: skills,
    insights: [insight, ...state.insights].slice(0, 50),
    lastSessionAt: Date.now(),
  };

  await saveCoachProgressState(newState);
  console.log('[CoachProgress] Completed module:', moduleId);
  return newState;
}

export async function markInsightSavedToJournal(insightId: string): Promise<CoachProgressState> {
  const state = await getCoachProgressState();
  const insights = state.insights.map(i =>
    i.id === insightId ? { ...i, savedToJournal: true } : i
  );
  const newState = { ...state, insights };
  await saveCoachProgressState(newState);
  return newState;
}
