import { JournalEntry } from '@/types';
import {
  InsightsSummary,
  WeeklyIntensityPoint,
  TriggerFrequencyItem,
  MoodDistributionItem,
  ExerciseEffectiveness,
  CopingToolUsage,
} from '@/types/insights';

const TRIGGER_COLORS = ['#6B9080', '#D4956A', '#E17055', '#00B894', '#3B82F6', '#8B5CF6', '#E84393', '#FDCB6E', '#636E72', '#2D3436'];
const MOOD_COLORS = ['#E17055', '#FDCB6E', '#00B894', '#3B82F6', '#8B5CF6', '#E84393', '#6B9080', '#D4956A', '#636E72', '#2D3436'];

function getDayLabel(timestamp: number): string {
  const d = new Date(timestamp);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isWithinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function computeWeeklyIntensity(entries: JournalEntry[]): WeeklyIntensityPoint[] {
  const now = new Date();
  const points: WeeklyIntensityPoint[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = getDateKey(date.getTime());
    const dayLabel = getDayLabel(date.getTime());

    const dayEntries = entries.filter(e => getDateKey(e.timestamp) === dateKey);
    const avg = dayEntries.length > 0
      ? dayEntries.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / dayEntries.length
      : 0;

    points.push({
      day: dayLabel,
      value: Math.round(avg * 10) / 10,
      date: dateKey,
    });
  }

  return points;
}

function computeTriggerFrequency(entries: JournalEntry[]): TriggerFrequencyItem[] {
  const counts: Record<string, number> = {};
  entries.forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      counts[t.label] = (counts[t.label] || 0) + 1;
    });
  });

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([label, count], i) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: TRIGGER_COLORS[i % TRIGGER_COLORS.length],
    }));
}

function computeMoodDistribution(entries: JournalEntry[]): MoodDistributionItem[] {
  const counts: Record<string, { count: number; emoji: string }> = {};
  entries.forEach(entry => {
    entry.checkIn.emotions.forEach(e => {
      if (!counts[e.label]) {
        counts[e.label] = { count: 0, emoji: e.emoji };
      }
      counts[e.label].count += 1;
    });
  });

  const total = Object.values(counts).reduce((sum, c) => sum + c.count, 0);
  return Object.entries(counts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 8)
    .map(([label, data], i) => ({
      label,
      emoji: data.emoji,
      count: data.count,
      percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
      color: MOOD_COLORS[i % MOOD_COLORS.length],
    }));
}

function computeExerciseEffectiveness(entries: JournalEntry[]): ExerciseEffectiveness[] {
  const exerciseData: Record<string, { totalBefore: number; totalAfter: number; count: number }> = {};

  const sortedEntries = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const copingUsed = entry.checkIn.copingUsed;
    if (!copingUsed || copingUsed.length === 0) continue;

    const before = entry.checkIn.intensityLevel;
    const nextEntry = sortedEntries[i + 1];
    const after = nextEntry ? nextEntry.checkIn.intensityLevel : Math.max(1, before - 2);

    copingUsed.forEach(tool => {
      if (!exerciseData[tool]) {
        exerciseData[tool] = { totalBefore: 0, totalAfter: 0, count: 0 };
      }
      exerciseData[tool].totalBefore += before;
      exerciseData[tool].totalAfter += after;
      exerciseData[tool].count += 1;
    });
  }

  return Object.entries(exerciseData)
    .map(([name, data]) => ({
      exerciseId: name,
      exerciseName: name,
      avgBefore: Math.round((data.totalBefore / data.count) * 10) / 10,
      avgAfter: Math.round((data.totalAfter / data.count) * 10) / 10,
      timesUsed: data.count,
      reduction: Math.round(((data.totalBefore - data.totalAfter) / data.count) * 10) / 10,
    }))
    .sort((a, b) => b.reduction - a.reduction)
    .slice(0, 5);
}

function computeCopingTools(entries: JournalEntry[]): CopingToolUsage[] {
  const counts: Record<string, number> = {};
  entries.forEach(entry => {
    entry.checkIn.copingUsed?.forEach(tool => {
      counts[tool] = (counts[tool] || 0) + 1;
    });
  });

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

function computeStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;

  const sortedByDate = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const uniqueDays = new Set<string>();
  sortedByDate.forEach(e => uniqueDays.add(getDateKey(e.timestamp)));

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

function computeDistressTrend(entries: JournalEntry[]): 'rising' | 'stable' | 'falling' | 'unknown' {
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

export function computeInsightsSummary(allEntries: JournalEntry[]): InsightsSummary {
  const sorted = [...allEntries].sort((a, b) => b.timestamp - a.timestamp);
  const weekEntries = sorted.filter(e => isWithinDays(e.timestamp, 7));
  const monthEntries = sorted.filter(e => isWithinDays(e.timestamp, 30));

  const avgDistress = sorted.length > 0
    ? Math.round((sorted.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / sorted.length) * 10) / 10
    : 0;

  const weekTriggerCounts: Record<string, number> = {};
  weekEntries.forEach(e => {
    e.checkIn.triggers.forEach(t => {
      weekTriggerCounts[t.label] = (weekTriggerCounts[t.label] || 0) + 1;
    });
  });
  const topTriggerWeek = Object.entries(weekTriggerCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  const monthEmotionCounts: Record<string, number> = {};
  monthEntries.forEach(e => {
    e.checkIn.emotions.forEach(em => {
      monthEmotionCounts[em.label] = (monthEmotionCounts[em.label] || 0) + 1;
    });
  });
  const topEmotionMonth = Object.entries(monthEmotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  const urgeCounts: Record<string, number> = {};
  sorted.forEach(e => {
    e.checkIn.urges.forEach(u => {
      urgeCounts[u.label] = (urgeCounts[u.label] || 0) + 1;
    });
  });
  const topUrge = Object.entries(urgeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  return {
    totalCheckIns: sorted.length,
    averageDistress: avgDistress,
    topTriggerThisWeek: topTriggerWeek,
    topEmotionThisMonth: topEmotionMonth,
    topUrge,
    distressTrend: computeDistressTrend(sorted),
    weeklyIntensity: computeWeeklyIntensity(sorted),
    triggerFrequency: computeTriggerFrequency(monthEntries),
    moodDistribution: computeMoodDistribution(monthEntries),
    exerciseEffectiveness: computeExerciseEffectiveness(sorted),
    copingTools: computeCopingTools(sorted),
    streakDays: computeStreak(sorted),
    lastCheckIn: sorted.length > 0 ? sorted[0].timestamp : null,
  };
}
