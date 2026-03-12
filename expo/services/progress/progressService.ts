import { JournalEntry, MessageDraft } from '@/types';
import {
  ProgressSummary,
  ProgressMetrics,
  WeekComparison,
  DistressTrendPoint,
  EmotionDistributionItem,
  CopingSuccessItem,
  Milestone,
  RegulationBehavior,
  ConsistencyStreak,
  TriggerFrequencyItem,
  EncouragingInsight,
} from '@/types/progress';

const EMOTION_COLORS = ['#6B9080', '#D4956A', '#E17055', '#00B894', '#3B82F6', '#8B5CF6', '#E84393', '#FDCB6E'];

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isWithinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function computeStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const uniqueDays = new Set<string>();
  entries.forEach(e => uniqueDays.add(getDateKey(e.timestamp)));
  const dayKeys = Array.from(uniqueDays).sort().reverse();
  const today = getDateKey(Date.now());
  const yesterday = getDateKey(Date.now() - 24 * 60 * 60 * 1000);
  if (dayKeys[0] !== today && dayKeys[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dayKeys.length; i++) {
    const prevDate = new Date(dayKeys[i - 1]);
    const currDate = new Date(dayKeys[i]);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function computeMetrics(entries: JournalEntry[], drafts: MessageDraft[]): ProgressMetrics {
  const avgDistress = entries.length > 0
    ? Math.round((entries.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / entries.length) * 10) / 10
    : 0;

  const copingCount = entries.reduce((s, e) => s + (e.checkIn.copingUsed?.length ?? 0), 0);
  const pausedMessages = drafts.filter(d => d.paused).length;

  const recentConflicts = entries.filter(e =>
    isWithinDays(e.timestamp, 7) &&
    e.checkIn.triggers.some(t => t.category === 'relationship')
  ).length;
  const olderConflicts = entries.filter(e =>
    !isWithinDays(e.timestamp, 7) &&
    isWithinDays(e.timestamp, 14) &&
    e.checkIn.triggers.some(t => t.category === 'relationship')
  ).length;

  const conflictReduction = olderConflicts > 0
    ? Math.round(((olderConflicts - recentConflicts) / olderConflicts) * 100)
    : 0;

  return {
    averageDistressIntensity: avgDistress,
    totalCheckIns: entries.length,
    journalStreak: computeStreak(entries),
    copingExercisesUsed: copingCount,
    successfulMessagePauses: pausedMessages,
    relationshipConflictReduction: conflictReduction,
  };
}

function computeWeekComparison(entries: JournalEntry[]): WeekComparison {
  const thisWeek = entries.filter(e => isWithinDays(e.timestamp, 7));
  const lastWeek = entries.filter(e => !isWithinDays(e.timestamp, 7) && isWithinDays(e.timestamp, 14));

  const thisAvg = thisWeek.length > 0
    ? Math.round((thisWeek.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / thisWeek.length) * 10) / 10
    : 0;
  const lastAvg = lastWeek.length > 0
    ? Math.round((lastWeek.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / lastWeek.length) * 10) / 10
    : 0;

  const change = lastAvg > 0 ? Math.round(((thisAvg - lastAvg) / lastAvg) * 100) : 0;
  const direction = change < -5 ? 'improved' as const : change > 5 ? 'worsened' as const : 'stable' as const;

  return {
    thisWeekAvgDistress: thisAvg,
    lastWeekAvgDistress: lastAvg,
    changePercent: Math.abs(change),
    direction,
  };
}

function computeDistressTrend(entries: JournalEntry[]): DistressTrendPoint[] {
  const points: DistressTrendPoint[] = [];
  const now = new Date();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = getDateKey(date.getTime());
    const dayEntries = entries.filter(e => getDateKey(e.timestamp) === dateKey);
    const avg = dayEntries.length > 0
      ? Math.round((dayEntries.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / dayEntries.length) * 10) / 10
      : 0;
    points.push({
      label: i <= 6 ? dayLabels[date.getDay()] : `${date.getMonth() + 1}/${date.getDate()}`,
      value: avg,
      date: dateKey,
    });
  }
  return points;
}

function computeEmotionDistribution(entries: JournalEntry[]): EmotionDistributionItem[] {
  const counts: Record<string, { count: number; emoji: string }> = {};
  entries.forEach(entry => {
    entry.checkIn.emotions.forEach(e => {
      if (!counts[e.label]) counts[e.label] = { count: 0, emoji: e.emoji };
      counts[e.label].count += 1;
    });
  });

  const total = Object.values(counts).reduce((s, c) => s + c.count, 0);
  return Object.entries(counts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 8)
    .map(([label, data], i) => ({
      label,
      emoji: data.emoji,
      count: data.count,
      percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
      color: EMOTION_COLORS[i % EMOTION_COLORS.length],
    }));
}

function computeCopingSuccess(entries: JournalEntry[]): CopingSuccessItem[] {
  const toolData: Record<string, { totalBefore: number; totalAfter: number; count: number; improved: number }> = {};
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const coping = entry.checkIn.copingUsed;
    if (!coping || coping.length === 0) continue;

    const before = entry.checkIn.intensityLevel;
    const next = sorted[i + 1];
    const after = next ? next.checkIn.intensityLevel : Math.max(1, before - 2);

    coping.forEach(tool => {
      if (!toolData[tool]) toolData[tool] = { totalBefore: 0, totalAfter: 0, count: 0, improved: 0 };
      toolData[tool].totalBefore += before;
      toolData[tool].totalAfter += after;
      toolData[tool].count += 1;
      if (after < before) toolData[tool].improved += 1;
    });
  }

  return Object.entries(toolData)
    .map(([tool, data]) => ({
      tool,
      timesUsed: data.count,
      avgReduction: Math.round(((data.totalBefore - data.totalAfter) / data.count) * 10) / 10,
      successRate: data.count > 0 ? Math.round((data.improved / data.count) * 100) : 0,
    }))
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 6);
}

function computeMilestones(entries: JournalEntry[], drafts: MessageDraft[]): Milestone[] {
  const streak = computeStreak(entries);
  const totalCheckIns = entries.length;
  const copingCount = entries.reduce((s, e) => s + (e.checkIn.copingUsed?.length ?? 0), 0);
  const pausedCount = drafts.filter(d => d.paused).length;
  const rewriteCount = drafts.filter(d => d.rewrittenText).length;

  return [
    {
      id: 'first_checkin',
      label: 'First Check-In',
      achieved: totalCheckIns >= 1,
      icon: '🌱',
      description: 'Complete your first emotional check-in',
    },
    {
      id: 'week_streak',
      label: '7-Day Streak',
      achieved: streak >= 7,
      icon: '🔥',
      description: 'Check in for 7 days in a row',
    },
    {
      id: 'ten_checkins',
      label: '10 Check-Ins',
      achieved: totalCheckIns >= 10,
      icon: '⭐',
      description: 'Complete 10 emotional check-ins',
    },
    {
      id: 'coping_explorer',
      label: 'Coping Explorer',
      achieved: copingCount >= 5,
      icon: '🧭',
      description: 'Use coping tools 5 times',
    },
    {
      id: 'mindful_messenger',
      label: 'Mindful Messenger',
      achieved: pausedCount >= 3,
      icon: '💭',
      description: 'Successfully pause 3 messages',
    },
    {
      id: 'rewrite_master',
      label: 'Rewrite Mastery',
      achieved: rewriteCount >= 5,
      icon: '✍️',
      description: 'Rewrite 5 messages mindfully',
    },
    {
      id: 'month_warrior',
      label: 'Month Warrior',
      achieved: totalCheckIns >= 30,
      icon: '🏆',
      description: 'Complete 30 check-ins',
    },
    {
      id: 'regulation_pro',
      label: 'Regulation Pro',
      achieved: copingCount >= 20,
      icon: '🎯',
      description: 'Use coping tools 20 times',
    },
  ];
}

function computeRegulation(entries: JournalEntry[], drafts: MessageDraft[]): RegulationBehavior {
  const recentEntries = entries.filter(e => isWithinDays(e.timestamp, 30));
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, 30));

  const pausesBeforeSending = recentDrafts.filter(d => d.paused).length;
  const rewritesUsed = recentDrafts.filter(d => d.rewrittenText).length;
  const constructiveOutcomes = recentDrafts.filter(d => d.outcome === 'helped' || d.outcome === 'not_sent').length;

  const groundingUsed = recentEntries.reduce((count, e) => {
    const copingTools = e.checkIn.copingUsed ?? [];
    return count + copingTools.filter(t =>
      t.toLowerCase().includes('ground') ||
      t.toLowerCase().includes('breath') ||
      t.toLowerCase().includes('sooth')
    ).length;
  }, 0);

  const safetyModeActivations = recentEntries.filter(e =>
    e.checkIn.intensityLevel >= 8
  ).length;

  return {
    pausesBeforeSending,
    groundingUsed,
    safetyModeActivations,
    rewritesUsed,
    constructiveOutcomes,
  };
}

function computeConsistency(entries: JournalEntry[], ritualStreak: number): ConsistencyStreak {
  const journalStreak = computeStreak(entries);
  const weekEntries = entries.filter(e => isWithinDays(e.timestamp, 7));
  const uniqueDays = new Set<string>();
  weekEntries.forEach(e => uniqueDays.add(getDateKey(e.timestamp)));

  return {
    journalStreak,
    ritualStreak,
    companionSessions: 0,
    weeklyActiveDays: uniqueDays.size,
  };
}

function computeTriggerFrequency(entries: JournalEntry[]): TriggerFrequencyItem[] {
  const recentEntries = entries.filter(e => isWithinDays(e.timestamp, 30));
  const counts: Record<string, { count: number; category: string }> = {};

  recentEntries.forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      if (!counts[t.label]) counts[t.label] = { count: 0, category: t.category };
      counts[t.label].count += 1;
    });
  });

  return Object.entries(counts)
    .map(([label, data]) => ({ label, count: data.count, category: data.category }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function computeEncouragingInsights(
  metrics: ProgressMetrics,
  weekComparison: WeekComparison,
  regulation: RegulationBehavior,
  consistency: ConsistencyStreak,
  entries: JournalEntry[],
  _drafts: MessageDraft[],
): EncouragingInsight[] {
  const insights: EncouragingInsight[] = [];
  let idCounter = 0;
  const makeId = () => `insight_${++idCounter}`;

  if (regulation.pausesBeforeSending > 0) {
    insights.push({
      id: makeId(),
      text: `You paused before sending ${regulation.pausesBeforeSending} message${regulation.pausesBeforeSending !== 1 ? 's' : ''} recently. That takes real self-awareness.`,
      type: 'regulation',
      icon: '⏸️',
    });
  }

  if (regulation.rewritesUsed > 0) {
    insights.push({
      id: makeId(),
      text: `You rewrote ${regulation.rewritesUsed} message${regulation.rewritesUsed !== 1 ? 's' : ''} to express yourself more clearly. That's meaningful growth.`,
      type: 'regulation',
      icon: '✍️',
    });
  }

  if (weekComparison.direction === 'improved') {
    insights.push({
      id: makeId(),
      text: `Your average distress dropped ${weekComparison.changePercent}% compared to last week. You seem to be finding more stability.`,
      type: 'growth',
      icon: '📉',
    });
  }

  if (consistency.journalStreak >= 3) {
    insights.push({
      id: makeId(),
      text: `${consistency.journalStreak} days checking in consistently. Showing up for yourself is a quiet form of strength.`,
      type: 'consistency',
      icon: '🔥',
    });
  }

  if (consistency.weeklyActiveDays >= 5) {
    insights.push({
      id: makeId(),
      text: `You were active ${consistency.weeklyActiveDays} out of 7 days this week. Consistency builds resilience.`,
      type: 'consistency',
      icon: '📅',
    });
  }

  if (regulation.groundingUsed > 0) {
    insights.push({
      id: makeId(),
      text: `You used grounding or breathing ${regulation.groundingUsed} time${regulation.groundingUsed !== 1 ? 's' : ''} recently. Those moments of regulation add up.`,
      type: 'coping',
      icon: '🌿',
    });
  }

  if (regulation.constructiveOutcomes > 0) {
    insights.push({
      id: makeId(),
      text: `${regulation.constructiveOutcomes} of your recent messages had a constructive outcome. You're building better patterns.`,
      type: 'regulation',
      icon: '💬',
    });
  }

  if (metrics.copingExercisesUsed >= 5) {
    insights.push({
      id: makeId(),
      text: `You've used coping tools ${metrics.copingExercisesUsed} times. Reaching for support instead of reacting is real progress.`,
      type: 'coping',
      icon: '🧰',
    });
  }

  const recentHigh = entries.filter(e => isWithinDays(e.timestamp, 7) && e.checkIn.intensityLevel >= 7).length;
  const olderHigh = entries.filter(e => !isWithinDays(e.timestamp, 7) && isWithinDays(e.timestamp, 14) && e.checkIn.intensityLevel >= 7).length;
  if (olderHigh > 0 && recentHigh < olderHigh) {
    insights.push({
      id: makeId(),
      text: 'You seem to have fewer high-intensity moments this week. That may suggest growing stabilization.',
      type: 'growth',
      icon: '🌤️',
    });
  }

  const reflections = entries.filter(e => isWithinDays(e.timestamp, 14) && e.reflection && e.reflection.length > 20).length;
  if (reflections >= 3) {
    insights.push({
      id: makeId(),
      text: `You reflected thoughtfully ${reflections} times recently. Self-reflection deepens your emotional awareness.`,
      type: 'awareness',
      icon: '🪞',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: makeId(),
      text: 'Every check-in, every pause, every breath — they all count. Keep going.',
      type: 'growth',
      icon: '🌱',
    });
  }

  return insights.slice(0, 6);
}

function generateEncouragingMessage(comparison: WeekComparison, metrics: ProgressMetrics): string {
  if (comparison.direction === 'improved') {
    return `You handled distress better this week than last week. Your average dropped by ${comparison.changePercent}%.`;
  }
  if (metrics.journalStreak >= 7) {
    return `Amazing — ${metrics.journalStreak} day streak! Consistency is a powerful form of self-care.`;
  }
  if (metrics.copingExercisesUsed > 0) {
    return `You've used coping tools ${metrics.copingExercisesUsed} times. Every small step counts.`;
  }
  if (metrics.successfulMessagePauses > 0) {
    return `You paused before sending ${metrics.successfulMessagePauses} message${metrics.successfulMessagePauses !== 1 ? 's' : ''}. That takes real strength.`;
  }
  if (metrics.totalCheckIns > 0) {
    return 'Showing up to check in with yourself is brave. Keep going.';
  }
  return 'Start your first check-in to begin tracking your recovery journey.';
}

export function computeProgressSummary(
  entries: JournalEntry[],
  drafts: MessageDraft[],
  ritualStreak?: number,
): ProgressSummary {
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const monthEntries = sorted.filter(e => isWithinDays(e.timestamp, 30));

  const metrics = computeMetrics(sorted, drafts);
  const weekComparison = computeWeekComparison(sorted);
  const regulation = computeRegulation(sorted, drafts);
  const consistency = computeConsistency(sorted, ritualStreak ?? 0);

  return {
    metrics,
    weekComparison,
    distressTrend: computeDistressTrend(sorted),
    emotionDistribution: computeEmotionDistribution(monthEntries),
    copingSuccess: computeCopingSuccess(sorted),
    encouragingMessage: generateEncouragingMessage(weekComparison, metrics),
    milestones: computeMilestones(sorted, drafts),
    regulation,
    consistency,
    triggerFrequency: computeTriggerFrequency(sorted),
    encouragingInsights: computeEncouragingInsights(metrics, weekComparison, regulation, consistency, sorted, drafts),
    hasEnoughData: entries.length >= 2,
  };
}
