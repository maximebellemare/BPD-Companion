import {
  CompanionMemoryStore,
  WeeklyCompanionInsight,
} from '@/types/companionMemory';
import { storageService } from '@/services/storage/storageService';

const WEEKLY_INSIGHTS_KEY = 'bpd_companion_weekly_insights';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function loadWeeklyInsights(): Promise<WeeklyCompanionInsight[]> {
  try {
    const stored = await storageService.get<WeeklyCompanionInsight[]>(WEEKLY_INSIGHTS_KEY);
    return stored ?? [];
  } catch (error) {
    console.log('[WeeklyInsight] Error loading:', error);
    return [];
  }
}

export async function saveWeeklyInsights(insights: WeeklyCompanionInsight[]): Promise<void> {
  try {
    await storageService.set(WEEKLY_INSIGHTS_KEY, insights.slice(0, 12));
    console.log('[WeeklyInsight] Saved', insights.length, 'weekly insights');
  } catch (error) {
    console.log('[WeeklyInsight] Error saving:', error);
  }
}

export function shouldGenerateWeeklyInsight(existing: WeeklyCompanionInsight[]): boolean {
  if (existing.length === 0) return true;
  const latest = existing[0];
  return Date.now() - latest.generatedAt > ONE_WEEK_MS;
}

export function generateWeeklyInsight(
  store: CompanionMemoryStore,
): WeeklyCompanionInsight | null {
  const weekEnd = Date.now();
  const weekStart = weekEnd - ONE_WEEK_MS;

  const weekEpisodes = store.episodicMemories.filter(
    m => m.timestamp >= weekStart && m.timestamp <= weekEnd,
  );
  const weekSessions = store.sessionSummaries.filter(
    m => m.timestamp >= weekStart && m.timestamp <= weekEnd,
  );

  if (weekEpisodes.length === 0 && weekSessions.length === 0) {
    console.log('[WeeklyInsight] Not enough data for weekly insight');
    return null;
  }

  const emotionalPatterns = detectWeeklyEmotionalPatterns(weekEpisodes);
  const relationshipPatterns = detectWeeklyRelationshipPatterns(weekEpisodes);
  const helpfulStrategies = detectWeeklyHelpfulStrategies(weekEpisodes, weekSessions);
  const growthSignals = detectWeeklyGrowthSignals(weekEpisodes, weekSessions);
  const summary = buildWeeklySummary(
    weekEpisodes.length,
    weekSessions.length,
    emotionalPatterns,
    helpfulStrategies,
    growthSignals,
  );

  const insight: WeeklyCompanionInsight = {
    id: `weekly_${Date.now()}`,
    weekStart,
    weekEnd,
    emotionalPatterns,
    relationshipPatterns,
    helpfulStrategies,
    growthSignals,
    summary,
    generatedAt: Date.now(),
  };

  console.log('[WeeklyInsight] Generated weekly insight:', {
    emotions: emotionalPatterns.length,
    relationships: relationshipPatterns.length,
    strategies: helpfulStrategies.length,
    growth: growthSignals.length,
  });

  return insight;
}

function detectWeeklyEmotionalPatterns(
  episodes: CompanionMemoryStore['episodicMemories'],
): string[] {
  const patterns: string[] = [];
  const emotionCounts = new Map<string, number>();
  const triggerCounts = new Map<string, number>();

  for (const ep of episodes) {
    emotionCounts.set(ep.emotion, (emotionCounts.get(ep.emotion) ?? 0) + 1);
    triggerCounts.set(ep.trigger, (triggerCounts.get(ep.trigger) ?? 0) + 1);
  }

  const topEmotion = Array.from(emotionCounts.entries()).sort(([, a], [, b]) => b - a)[0];
  if (topEmotion && topEmotion[1] >= 2) {
    patterns.push(`"${topEmotion[0]}" was your most frequent emotion this week, appearing ${topEmotion[1]} times.`);
  }

  const topTrigger = Array.from(triggerCounts.entries()).sort(([, a], [, b]) => b - a)[0];
  if (topTrigger && topTrigger[1] >= 2) {
    patterns.push(`"${topTrigger[0]}" was the most common trigger, coming up ${topTrigger[1]} times.`);
  }

  const highIntensity = episodes.filter(m => m.intensity && m.intensity >= 7);
  if (highIntensity.length > 0) {
    patterns.push(`You experienced ${highIntensity.length} high-intensity moment${highIntensity.length !== 1 ? 's' : ''} this week.`);
  }

  return patterns.slice(0, 4);
}

function detectWeeklyRelationshipPatterns(
  episodes: CompanionMemoryStore['episodicMemories'],
): string[] {
  const patterns: string[] = [];
  const relEpisodes = episodes.filter(m => m.relationshipContext);

  if (relEpisodes.length === 0) return patterns;

  if (relEpisodes.length >= 2) {
    patterns.push(`Relationship-related situations came up ${relEpisodes.length} times this week.`);
  }

  const abandonmentEp = relEpisodes.filter(m =>
    m.trigger.toLowerCase().includes('abandon') || m.trigger.toLowerCase().includes('reject'),
  );
  if (abandonmentEp.length >= 1) {
    patterns.push('Abandonment-related feelings were present this week. Being gentle with yourself around these moments matters.');
  }

  return patterns.slice(0, 3);
}

function detectWeeklyHelpfulStrategies(
  episodes: CompanionMemoryStore['episodicMemories'],
  sessions: CompanionMemoryStore['sessionSummaries'],
): string[] {
  const strategies: string[] = [];
  const copingMap = new Map<string, number>();

  for (const ep of episodes) {
    if (ep.copingUsed && (ep.outcome === 'helped' || ep.outcome === 'managed')) {
      for (const tool of ep.copingUsed) {
        copingMap.set(tool, (copingMap.get(tool) ?? 0) + 1);
      }
    }
  }

  for (const sess of sessions) {
    for (const skill of sess.skillsPracticed) {
      copingMap.set(skill, (copingMap.get(skill) ?? 0) + 1);
    }
  }

  const sorted = Array.from(copingMap.entries()).sort(([, a], [, b]) => b - a);
  for (const [tool, count] of sorted.slice(0, 3)) {
    strategies.push(`"${tool}" was used ${count} time${count !== 1 ? 's' : ''} and appeared helpful.`);
  }

  return strategies;
}

function detectWeeklyGrowthSignals(
  episodes: CompanionMemoryStore['episodicMemories'],
  sessions: CompanionMemoryStore['sessionSummaries'],
): string[] {
  const signals: string[] = [];

  const managedEpisodes = episodes.filter(
    m => m.outcome === 'managed' || m.outcome === 'helped',
  );
  if (managedEpisodes.length >= 2) {
    signals.push(`You managed ${managedEpisodes.length} emotional situations successfully.`);
  }

  const insightSessions = sessions.filter(s => s.insight);
  if (insightSessions.length >= 1) {
    signals.push(`You gained ${insightSessions.length} meaningful insight${insightSessions.length !== 1 ? 's' : ''} through reflection.`);
  }

  const skillSessions = sessions.filter(s => s.skillsPracticed.length > 0);
  if (skillSessions.length >= 2) {
    signals.push('You practiced skills consistently throughout the week.');
  }

  if (episodes.length >= 3) {
    signals.push('You showed up for yourself consistently by engaging with emotional support.');
  }

  return signals.slice(0, 4);
}

function buildWeeklySummary(
  episodeCount: number,
  sessionCount: number,
  emotionalPatterns: string[],
  helpfulStrategies: string[],
  growthSignals: string[],
): string {
  const parts: string[] = [];

  if (episodeCount > 0 || sessionCount > 0) {
    parts.push(`This week you had ${episodeCount + sessionCount} meaningful emotional moment${(episodeCount + sessionCount) !== 1 ? 's' : ''}.`);
  }

  if (growthSignals.length > 0) {
    parts.push(growthSignals[0]);
  } else if (helpfulStrategies.length > 0) {
    parts.push(helpfulStrategies[0]);
  } else if (emotionalPatterns.length > 0) {
    parts.push(emotionalPatterns[0]);
  }

  if (parts.length === 0) {
    return 'Keep showing up for yourself. Every small step matters.';
  }

  return parts.join(' ');
}
