import { JournalEntry } from '@/types';
import { MemoryProfile, PatternItem, InsightCard } from '@/types/memory';
import {
  buildRelationshipPatterns,
  buildImprovements,
  calculateCopingSuccessRate,
  calculateWeeklyCheckInAvg,
} from '@/services/memory/emotionalMemoryService';

function getTopItems(counts: Record<string, number>, limit: number = 5): PatternItem[] {
  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

function calculateIntensityTrend(entries: JournalEntry[]): 'rising' | 'stable' | 'falling' | 'unknown' {
  if (entries.length < 3) return 'unknown';

  const recent = entries.slice(0, Math.min(5, entries.length));
  const older = entries.slice(Math.min(5, entries.length), Math.min(10, entries.length));

  if (older.length === 0) return 'unknown';

  const recentAvg = recent.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / recent.length;
  const olderAvg = older.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / older.length;

  const diff = recentAvg - olderAvg;
  if (diff > 0.5) return 'rising';
  if (diff < -0.5) return 'falling';
  return 'stable';
}

function extractThemes(entries: JournalEntry[]): string[] {
  const themes: string[] = [];
  const recentEntries = entries.slice(0, 10);

  const triggerCategories: Record<string, number> = {};
  recentEntries.forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      triggerCategories[t.category] = (triggerCategories[t.category] || 0) + 1;
    });
  });

  const topCategory = Object.entries(triggerCategories).sort(([, a], [, b]) => b - a)[0];
  if (topCategory) {
    const categoryLabels: Record<string, string> = {
      relationship: 'Relationship dynamics',
      self: 'Self-perception struggles',
      situation: 'Situational stressors',
      memory: 'Past experiences resurfacing',
      other: 'Various life challenges',
    };
    themes.push(categoryLabels[topCategory[0]] || topCategory[0]);
  }

  const hasHighIntensity = recentEntries.some(e => e.checkIn.intensityLevel >= 7);
  if (hasHighIntensity) {
    themes.push('Periods of high emotional intensity');
  }

  const outcomes = recentEntries.filter(e => e.outcome);
  const managedCount = outcomes.filter(e => e.outcome === 'managed').length;
  if (managedCount > outcomes.length / 2) {
    themes.push('Growing capacity to manage emotions');
  }

  return themes;
}

export function buildMemoryProfile(
  journalEntries: JournalEntry[],
  triggerCounts: Record<string, number>,
  emotionCounts: Record<string, number>,
  urgeCounts: Record<string, number>,
): MemoryProfile {
  const copingCounts: Record<string, number> = {};
  journalEntries.forEach(entry => {
    entry.checkIn.copingUsed?.forEach(tool => {
      copingCounts[tool] = (copingCounts[tool] || 0) + 1;
    });
  });

  const recentEntries = journalEntries.slice(0, 20);
  const avgIntensity = recentEntries.length > 0
    ? recentEntries.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / recentEntries.length
    : 0;

  const copingItems = getTopItems(copingCounts);

  return {
    topTriggers: getTopItems(triggerCounts),
    topEmotions: getTopItems(emotionCounts),
    topUrges: getTopItems(urgeCounts),
    copingToolsUsed: copingItems,
    relationshipPatterns: buildRelationshipPatterns(journalEntries),
    recentImprovements: buildImprovements(journalEntries),
    recentCheckInCount: journalEntries.length,
    averageIntensity: Math.round(avgIntensity * 10) / 10,
    intensityTrend: calculateIntensityTrend(journalEntries),
    recentThemes: extractThemes(journalEntries),
    lastCheckInDate: journalEntries.length > 0 ? journalEntries[0].timestamp : null,
    copingSuccessRate: calculateCopingSuccessRate(journalEntries),
    mostEffectiveCoping: copingItems.length > 0 ? copingItems[0] : null,
    weeklyCheckInAvg: calculateWeeklyCheckInAvg(journalEntries),
  };
}

export function buildInsightCards(profile: MemoryProfile): InsightCard[] {
  const cards: InsightCard[] = [];

  if (profile.topTriggers.length > 0) {
    cards.push({
      id: 'insight-triggers',
      type: 'trigger',
      title: 'Top Triggers',
      description: profile.topTriggers.length > 0
        ? `Your most common trigger is "${profile.topTriggers[0].label}" (${profile.topTriggers[0].percentage}% of check-ins)`
        : 'Start checking in to discover your trigger patterns',
      value: profile.topTriggers[0]?.label,
      trend: profile.intensityTrend === 'rising' ? 'up' : profile.intensityTrend === 'falling' ? 'down' : 'stable',
    });
  }

  if (profile.topEmotions.length > 0) {
    cards.push({
      id: 'insight-emotions',
      type: 'emotion',
      title: 'Strongest Emotions',
      description: `"${profile.topEmotions[0].label}" shows up most often in your check-ins`,
      value: profile.topEmotions[0]?.label,
    });
  }

  if (profile.topUrges.length > 0) {
    cards.push({
      id: 'insight-urges',
      type: 'urge',
      title: 'Common Urges',
      description: `When distressed, you most often feel the urge to "${profile.topUrges[0].label}"`,
      value: profile.topUrges[0]?.label,
    });
  }

  if (profile.copingToolsUsed.length > 0) {
    cards.push({
      id: 'insight-coping',
      type: 'coping',
      title: 'Coping Tools Used',
      description: `You've relied on "${profile.copingToolsUsed[0].label}" most often — that's a sign of building healthy habits`,
      value: profile.copingToolsUsed[0]?.label,
    });
  }

  if (profile.recentThemes.length > 0) {
    cards.push({
      id: 'insight-patterns',
      type: 'pattern',
      title: 'Recent Patterns',
      description: profile.recentThemes.join('. ') + '.',
    });
  }

  if (profile.recentCheckInCount > 0) {
    const trendLabel = profile.intensityTrend === 'falling'
      ? 'Your intensity levels are trending downward — that\'s progress'
      : profile.intensityTrend === 'rising'
        ? 'Your intensity has been higher recently — be gentle with yourself'
        : 'Your emotional intensity has been relatively stable';

    cards.push({
      id: 'insight-intensity',
      type: 'pattern',
      title: 'Intensity Trend',
      description: `Average intensity: ${profile.averageIntensity}/10. ${trendLabel}.`,
      trend: profile.intensityTrend === 'rising' ? 'up' : profile.intensityTrend === 'falling' ? 'down' : 'stable',
    });
  }

  return cards;
}

export function buildContextSummary(profile: MemoryProfile): string {
  const parts: string[] = [];

  parts.push(`The user has completed ${profile.recentCheckInCount} check-ins.`);

  if (profile.topTriggers.length > 0) {
    const triggers = profile.topTriggers.slice(0, 3).map(t => t.label).join(', ');
    parts.push(`Their most common triggers are: ${triggers}.`);
  }

  if (profile.topEmotions.length > 0) {
    const emotions = profile.topEmotions.slice(0, 3).map(e => e.label).join(', ');
    parts.push(`Their most frequent emotions are: ${emotions}.`);
  }

  if (profile.topUrges.length > 0) {
    const urges = profile.topUrges.slice(0, 3).map(u => u.label).join(', ');
    parts.push(`Their common urges include: ${urges}.`);
  }

  if (profile.copingToolsUsed.length > 0) {
    const tools = profile.copingToolsUsed.slice(0, 3).map(c => c.label).join(', ');
    parts.push(`They've been using these coping tools: ${tools}.`);
  }

  if (profile.averageIntensity > 0) {
    parts.push(`Their average emotional intensity is ${profile.averageIntensity}/10.`);
  }

  if (profile.intensityTrend !== 'unknown') {
    parts.push(`Their intensity trend is ${profile.intensityTrend}.`);
  }

  if (profile.recentThemes.length > 0) {
    parts.push(`Recent themes: ${profile.recentThemes.join(', ')}.`);
  }

  return parts.join(' ');
}
