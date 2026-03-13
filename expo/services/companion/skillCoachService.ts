import { SkillExerciseResult, EmotionalState } from '@/types/companionMemory';
import {
  SkillCoachingSession,
  SkillReflection,
  PersonalizedSkillRanking,
  SkillCoachingHistory,
} from '@/types/skillCoaching';
import { storageService } from '@/services/storage/storageService';
import { EXTENDED_SKILL_LIBRARY, getSkillById } from '@/data/skills/skillLibrary';

const COACHING_HISTORY_KEY = 'bpd_skill_coaching_history';
const ACTIVE_SESSION_KEY = 'bpd_skill_active_session';

export async function loadCoachingHistory(): Promise<SkillCoachingHistory> {
  try {
    const stored = await storageService.get<SkillCoachingHistory>(COACHING_HISTORY_KEY);
    return stored ?? {
      sessions: [],
      results: [],
      effectiveness: [],
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.log('[SkillCoach] Error loading history:', error);
    return { sessions: [], results: [], effectiveness: [], lastUpdated: Date.now() };
  }
}

export async function saveCoachingHistory(history: SkillCoachingHistory): Promise<void> {
  try {
    history.lastUpdated = Date.now();
    await storageService.set(COACHING_HISTORY_KEY, history);
    console.log('[SkillCoach] History saved');
  } catch (error) {
    console.log('[SkillCoach] Error saving history:', error);
  }
}

export function startCoachingSession(
  exerciseId: string,
  distressBefore: number,
): SkillCoachingSession {
  const session: SkillCoachingSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    exerciseId,
    startedAt: Date.now(),
    currentStepIndex: 0,
    distressBefore,
    reflections: [],
    status: 'in_progress',
  };
  console.log('[SkillCoach] Session started:', session.id, 'exercise:', exerciseId);
  return session;
}

export function advanceStep(session: SkillCoachingSession): SkillCoachingSession {
  const exercise = getSkillById(session.exerciseId);
  if (!exercise) return session;

  const nextIndex = session.currentStepIndex + 1;
  if (nextIndex >= exercise.steps.length) {
    return { ...session, currentStepIndex: nextIndex, status: 'completed', completedAt: Date.now() };
  }
  return { ...session, currentStepIndex: nextIndex };
}

export function addReflection(
  session: SkillCoachingSession,
  stepIndex: number,
  prompt: string,
  response: string,
): SkillCoachingSession {
  const reflection: SkillReflection = {
    stepIndex,
    prompt,
    response,
    timestamp: Date.now(),
  };
  return {
    ...session,
    reflections: [...session.reflections, reflection],
  };
}

export function completeSession(
  session: SkillCoachingSession,
  distressAfter: number,
): { session: SkillCoachingSession; result: SkillExerciseResult } {
  const completedSession: SkillCoachingSession = {
    ...session,
    status: 'completed',
    completedAt: Date.now(),
    distressAfter,
  };

  const result: SkillExerciseResult = {
    exerciseId: session.exerciseId,
    startedAt: session.startedAt,
    completedAt: Date.now(),
    distressBefore: session.distressBefore,
    distressAfter,
    helpful: distressAfter < session.distressBefore,
    notes: session.reflections.map(r => r.response).filter(Boolean).join(' | '),
  };

  console.log('[SkillCoach] Session completed:', session.id, 'distress:', session.distressBefore, '->', distressAfter);
  return { session: completedSession, result };
}

export async function persistSessionResult(
  session: SkillCoachingSession,
  result: SkillExerciseResult,
): Promise<void> {
  const history = await loadCoachingHistory();

  history.sessions = [session, ...history.sessions].slice(0, 200);
  history.results = [result, ...history.results].slice(0, 200);

  updateEffectiveness(history, result);
  await saveCoachingHistory(history);
}

function updateEffectiveness(history: SkillCoachingHistory, result: SkillExerciseResult): void {
  const exercise = getSkillById(result.exerciseId);
  if (!exercise) return;

  const existing = history.effectiveness.find(e => e.exerciseId === result.exerciseId);
  if (existing) {
    existing.totalAttempts += 1;
    if (result.distressAfter !== undefined) {
      existing.totalCompletions += 1;
      const reduction = (result.distressBefore ?? 0) - (result.distressAfter ?? 0);
      const prevTotal = existing.averageDistressReduction * (existing.totalCompletions - 1);
      existing.averageDistressReduction = (prevTotal + reduction) / existing.totalCompletions;
    }
    existing.lastUsed = Date.now();
  } else {
    const reduction = (result.distressBefore ?? 0) - (result.distressAfter ?? 0);
    history.effectiveness.push({
      exerciseId: result.exerciseId,
      category: exercise.category,
      totalAttempts: 1,
      totalCompletions: result.distressAfter !== undefined ? 1 : 0,
      averageDistressReduction: reduction,
      lastUsed: Date.now(),
    });
  }
}

export async function getPersonalizedRecommendations(
  state: EmotionalState,
  limit: number = 3,
): Promise<PersonalizedSkillRanking[]> {
  const history = await loadCoachingHistory();
  const matching = EXTENDED_SKILL_LIBRARY.filter(ex =>
    ex.forEmotionalStates.includes(state),
  );

  const rankings: PersonalizedSkillRanking[] = matching.map(exercise => {
    const eff = history.effectiveness.find(e => e.exerciseId === exercise.id);
    let score = 50;
    let reason = 'Recommended for your current state';

    if (eff) {
      if (eff.averageDistressReduction > 2) {
        score += 30;
        reason = 'This skill has helped reduce your distress before';
      } else if (eff.averageDistressReduction > 0) {
        score += 15;
        reason = 'You have found this helpful in the past';
      }

      if (eff.totalCompletions > 3) {
        score += 10;
        reason = 'One of your most-practiced skills';
      }

      const daysSinceUse = (Date.now() - eff.lastUsed) / (1000 * 60 * 60 * 24);
      if (daysSinceUse > 7) {
        score += 5;
      }
    } else {
      score += 10;
      reason = 'A new skill to try for this situation';
    }

    return { exercise, score, reason };
  });

  rankings.sort((a, b) => b.score - a.score);
  return rankings.slice(0, limit);
}

export async function getSkillStats(): Promise<{
  totalSessions: number;
  completedSessions: number;
  averageDistressReduction: number;
  mostEffectiveSkill: string | null;
  totalPracticeMinutes: number;
}> {
  const history = await loadCoachingHistory();
  const completed = history.results.filter(r => r.distressAfter !== undefined);

  let avgReduction = 0;
  if (completed.length > 0) {
    const totalReduction = completed.reduce(
      (sum, r) => sum + ((r.distressBefore ?? 0) - (r.distressAfter ?? 0)),
      0,
    );
    avgReduction = totalReduction / completed.length;
  }

  const sorted = [...history.effectiveness].sort(
    (a, b) => b.averageDistressReduction - a.averageDistressReduction,
  );
  const mostEffective = sorted.length > 0 ? sorted[0].exerciseId : null;
  const mostEffectiveName = mostEffective ? getSkillById(mostEffective)?.name ?? null : null;

  const totalMinutes = history.results.reduce((sum, r) => {
    const exercise = getSkillById(r.exerciseId);
    return sum + (exercise?.estimatedMinutes ?? 3);
  }, 0);

  return {
    totalSessions: history.sessions.length,
    completedSessions: completed.length,
    averageDistressReduction: Math.round(avgReduction * 10) / 10,
    mostEffectiveSkill: mostEffectiveName,
    totalPracticeMinutes: totalMinutes,
  };
}

export function generateSessionInsight(session: SkillCoachingSession): string {
  const exercise = getSkillById(session.exerciseId);
  if (!exercise) return 'You completed a skill practice session.';

  const reduction = session.distressAfter !== undefined
    ? session.distressBefore - session.distressAfter
    : 0;

  if (reduction >= 3) {
    return `${exercise.name} made a real difference. Your distress dropped significantly. Remember this skill when you need it.`;
  } else if (reduction > 0) {
    return `You practiced ${exercise.name} and your distress eased a little. Even small shifts add up over time.`;
  } else if (reduction === 0) {
    return `You showed up and practiced ${exercise.name}. Even when it does not feel like much, the act of practicing builds resilience.`;
  } else {
    return `Sometimes distress fluctuates during practice. What matters is that you chose to try. ${exercise.name} may work better next time.`;
  }
}

export async function saveActiveSession(session: SkillCoachingSession): Promise<void> {
  await storageService.set(ACTIVE_SESSION_KEY, session);
}

export async function loadActiveSession(): Promise<SkillCoachingSession | null> {
  return storageService.get<SkillCoachingSession>(ACTIVE_SESSION_KEY);
}

export async function clearActiveSession(): Promise<void> {
  await storageService.remove(ACTIVE_SESSION_KEY);
}
