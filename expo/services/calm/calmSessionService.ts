import { storageService } from '@/services/storage/storageService';

const CALM_SESSIONS_KEY = 'calm_me_down_sessions_v1';

export type CalmMeDownSession = {
  id: string;
  timestamp: number;
  beforeIntensity: number;
  afterIntensity: number;
  durationCompletedSeconds: number;
  triggerLabel?: string | null;
  emotionLabel?: string | null;
};

export type CalmMeDownSummary = {
  sessionCount: number;
  averageReduction: number;
  bestReduction: number;
  mostCommonTrigger: string | null;
};

export async function loadCalmMeDownSessions(): Promise<CalmMeDownSession[]> {
  return (await storageService.get<CalmMeDownSession[]>(CALM_SESSIONS_KEY)) ?? [];
}

export async function saveCalmMeDownSession(session: CalmMeDownSession): Promise<CalmMeDownSession[]> {
  const existing = await loadCalmMeDownSessions();
  const updated = [session, ...existing].slice(0, 100);
  await storageService.set(CALM_SESSIONS_KEY, updated);
  return updated;
}

export function summarizeCalmMeDownSessions(sessions: CalmMeDownSession[]): CalmMeDownSummary {
  if (sessions.length === 0) {
    return {
      sessionCount: 0,
      averageReduction: 0,
      bestReduction: 0,
      mostCommonTrigger: null,
    };
  }

  const reductions = sessions.map((session) => Math.max(0, session.beforeIntensity - session.afterIntensity));
  const triggerCounts = new Map<string, number>();
  sessions.forEach((session) => {
    const trigger = session.triggerLabel?.trim();
    if (!trigger) return;
    triggerCounts.set(trigger, (triggerCounts.get(trigger) ?? 0) + 1);
  });
  const mostCommonTrigger = Array.from(triggerCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;

  return {
    sessionCount: sessions.length,
    averageReduction: reductions.reduce((sum, value) => sum + value, 0) / sessions.length,
    bestReduction: Math.max(...reductions),
    mostCommonTrigger,
  };
}
