import { JournalEntry, MessageDraft } from '@/types';
import {
  InsightsDashboardData,
  DistressDataPoint,
  WeeklyMoodAverage,
  EmotionFrequency,
  TriggerPattern,
  UrgePattern,
  CopingEffectivenessItem,
  AISummaryCard,
} from '@/types/insightsDashboard';

const EMOTION_COLORS = [
  '#3B82F6', '#0B1238', '#14B8A6', '#3B82F6', '#3B82F6',
  '#3B82F6', '#14B8A6', '#67E8F9', '#2E2A72', '#2E2A72',
];

const TRIGGER_COLORS = [
  '#14B8A6', '#67E8F9', '#3B82F6', '#14B8A6', '#3B82F6',
  '#3B82F6', '#3B82F6', '#0B1238', '#2E2A72', '#2E2A72',
];

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayLabel(timestamp: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(timestamp).getDay()];
}

function isWithinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function computeDistressTrend(entries: JournalEntry[], days: number): DistressDataPoint[] {
  const now = new Date();
  const points: DistressDataPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = getDateKey(date.getTime());
    const dayLabel = getDayLabel(date.getTime());

    const dayEntries = entries.filter(e => getDateKey(e.timestamp) === dateKey);
    const avg = dayEntries.length > 0
      ? dayEntries.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / dayEntries.length
      : 0;

    points.push({
      date: dateKey,
      dayLabel,
      value: Math.round(avg * 10) / 10,
      checkInCount: dayEntries.length,
    });
  }

  return points;
}

function computeWeeklyMoodAverages(entries: JournalEntry[]): WeeklyMoodAverage[] {
  const now = Date.now();
  const averages: WeeklyMoodAverage[] = [];

  for (let w = 3; w >= 0; w--) {
    const weekStart = now - (w + 1) * 7 * 24 * 60 * 60 * 1000;
    const weekEnd = now - w * 7 * 24 * 60 * 60 * 1000;
    const weekEntries = entries.filter(e => e.timestamp >= weekStart && e.timestamp < weekEnd);

    const avg = weekEntries.length > 0
      ? weekEntries.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / weekEntries.length
      : 0;

    averages.push({
      weekLabel: w === 0 ? 'This Week' : w === 1 ? 'Last Week' : `${w} Weeks Ago`,
      average: Math.round(avg * 10) / 10,
      checkIns: weekEntries.length,
    });
  }

  return averages;
}

function computeEmotionDistribution(entries: JournalEntry[]): EmotionFrequency[] {
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
      color: EMOTION_COLORS[i % EMOTION_COLORS.length],
    }));
}

function computeTriggerPatterns(
  entries: JournalEntry[],
  allEntries: JournalEntry[],
): TriggerPattern[] {
  const currentCounts: Record<string, number> = {};
  entries.forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      currentCounts[t.label] = (currentCounts[t.label] || 0) + 1;
    });
  });

  const olderEntries = allEntries.filter(e => !entries.includes(e));
  const olderCounts: Record<string, number> = {};
  olderEntries.forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      olderCounts[t.label] = (olderCounts[t.label] || 0) + 1;
    });
  });

  const total = Object.values(currentCounts).reduce((sum, c) => sum + c, 0);

  return Object.entries(currentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([label, count], i) => {
      const olderCount = olderCounts[label] || 0;
      const olderTotal = Object.values(olderCounts).reduce((s, c) => s + c, 0);
      const currentRate = total > 0 ? count / total : 0;
      const olderRate = olderTotal > 0 ? olderCount / olderTotal : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (currentRate > olderRate + 0.05) trend = 'up';
      else if (currentRate < olderRate - 0.05) trend = 'down';

      return {
        label,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        trend,
        color: TRIGGER_COLORS[i % TRIGGER_COLORS.length],
      };
    });
}

function computeUrgePatterns(entries: JournalEntry[]): UrgePattern[] {
  const counts: Record<string, { count: number; risk: 'low' | 'medium' | 'high' }> = {};
  entries.forEach(entry => {
    entry.checkIn.urges.forEach(u => {
      if (!counts[u.label]) {
        counts[u.label] = { count: 0, risk: u.risk };
      }
      counts[u.label].count += 1;
    });
  });

  const total = Object.values(counts).reduce((sum, c) => sum + c.count, 0);
  return Object.entries(counts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 6)
    .map(([label, data]) => ({
      label,
      count: data.count,
      percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
      risk: data.risk,
    }));
}

function computeCopingEffectiveness(entries: JournalEntry[]): CopingEffectivenessItem[] {
  const toolData: Record<string, { totalBefore: number; totalAfter: number; count: number }> = {};
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const copingUsed = entry.checkIn.copingUsed;
    if (!copingUsed || copingUsed.length === 0) continue;

    const before = entry.checkIn.intensityLevel;
    const next = sorted[i + 1];
    const after = next ? next.checkIn.intensityLevel : Math.max(1, before - 2);

    copingUsed.forEach(tool => {
      if (!toolData[tool]) {
        toolData[tool] = { totalBefore: 0, totalAfter: 0, count: 0 };
      }
      toolData[tool].totalBefore += before;
      toolData[tool].totalAfter += after;
      toolData[tool].count += 1;
    });
  }

  return Object.entries(toolData)
    .map(([tool, data]) => {
      const avgBefore = data.totalBefore / data.count;
      const avgAfter = data.totalAfter / data.count;
      const reduction = avgBefore > 0 ? ((avgBefore - avgAfter) / avgBefore) * 100 : 0;
      return {
        tool,
        timesUsed: data.count,
        avgDistressBefore: Math.round(avgBefore * 10) / 10,
        avgDistressAfter: Math.round(avgAfter * 10) / 10,
        reductionPercent: Math.round(reduction),
      };
    })
    .sort((a, b) => b.reductionPercent - a.reductionPercent)
    .slice(0, 5);
}

function generateAISummaries(
  entries: JournalEntry[],
  messageDrafts: MessageDraft[],
  triggerPatterns: TriggerPattern[],
  emotionDist: EmotionFrequency[],
  copingEff: CopingEffectivenessItem[],
  distressDirection: 'rising' | 'stable' | 'falling' | 'unknown',
): AISummaryCard[] {
  const summaries: AISummaryCard[] = [];

  if (entries.length === 0) {
    summaries.push({
      id: 'ai-empty',
      text: 'Start checking in to build a picture of your emotional patterns. Every entry helps.',
      sentiment: 'encouraging',
      icon: '🌱',
    });
    return summaries;
  }

  if (triggerPatterns.length > 0) {
    const top = triggerPatterns[0];
    summaries.push({
      id: 'ai-trigger',
      text: `Your recent entries suggest "${top.label}" has been a frequent trigger this period.`,
      sentiment: 'observational',
      icon: '⚡',
    });
  }

  if (distressDirection === 'falling') {
    summaries.push({
      id: 'ai-trend-down',
      text: 'Your distress levels appear to be trending downward. That suggests your efforts are making a real difference.',
      sentiment: 'encouraging',
      icon: '📉',
    });
  } else if (distressDirection === 'rising') {
    summaries.push({
      id: 'ai-trend-up',
      text: 'Things seem to have felt more intense lately. Be extra gentle with yourself — noticing this is already awareness in action.',
      sentiment: 'gentle',
      icon: '💛',
    });
  }

  if (emotionDist.length >= 2) {
    summaries.push({
      id: 'ai-emotions',
      text: `"${emotionDist[0].label}" and "${emotionDist[1].label}" seem to be your most frequent emotional states recently.`,
      sentiment: 'observational',
      icon: '💜',
    });
  }

  if (copingEff.length > 0 && copingEff[0].reductionPercent > 10) {
    summaries.push({
      id: 'ai-coping',
      text: `"${copingEff[0].tool}" appears to reduce your distress effectively. Leaning into what works is a sign of self-awareness.`,
      sentiment: 'encouraging',
      icon: '🛡️',
    });
  }

  const rewriteCount = messageDrafts.filter(m => m.rewrittenText).length;
  const pauseCount = messageDrafts.filter(m => m.paused).length;
  if (rewriteCount > 0 || pauseCount > 0) {
    summaries.push({
      id: 'ai-messages',
      text: 'You have been pausing and reflecting before reacting in messages. That space between impulse and action is where change happens.',
      sentiment: 'encouraging',
      icon: '✨',
    });
  }

  return summaries;
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

function computeDistressDirection(entries: JournalEntry[]): 'rising' | 'stable' | 'falling' | 'unknown' {
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

export function computeInsightsDashboard(
  allEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  timeRangeDays: number,
): InsightsDashboardData {
  console.log('[InsightsDashboard] Computing dashboard for', allEntries.length, 'entries, range:', timeRangeDays, 'days');

  const sorted = [...allEntries].sort((a, b) => b.timestamp - a.timestamp);
  const rangeEntries = timeRangeDays === 0
    ? sorted
    : sorted.filter(e => isWithinDays(e.timestamp, timeRangeDays));

  const chartDays = Math.min(timeRangeDays || 30, 30);
  const distressTrend = computeDistressTrend(sorted, chartDays);
  const weeklyMoodAverages = computeWeeklyMoodAverages(sorted);
  const emotionDistribution = computeEmotionDistribution(rangeEntries);
  const triggerPatterns = computeTriggerPatterns(rangeEntries, sorted);
  const urgePatterns = computeUrgePatterns(rangeEntries);
  const copingEffectiveness = computeCopingEffectiveness(rangeEntries);
  const distressTrendDirection = computeDistressDirection(sorted);

  const avgDistress = rangeEntries.length > 0
    ? Math.round((rangeEntries.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / rangeEntries.length) * 10) / 10
    : 0;

  const aiSummaries = generateAISummaries(
    rangeEntries, messageDrafts, triggerPatterns,
    emotionDistribution, copingEffectiveness, distressTrendDirection,
  );

  return {
    distressTrend,
    weeklyMoodAverages,
    emotionDistribution,
    triggerPatterns,
    urgePatterns,
    copingEffectiveness,
    aiSummaries,
    totalCheckIns: rangeEntries.length,
    averageDistress: avgDistress,
    distressTrendDirection,
    journalStreak: computeStreak(sorted),
    messageRewriteCount: messageDrafts.filter(m => m.rewrittenText).length,
    pauseCount: messageDrafts.filter(m => m.paused).length,
  };
}
