import { JournalEntry, MessageDraft } from '@/types';
import {
  EmotionalMirrorReport,
  EmotionalMirrorInsight,
  EmotionalLandscape,
  GrowthSignalMirror,
  RelationshipMirrorPattern,
  CopingMirrorSummary,
} from '@/types/emotionalMirror';
import { detectPatterns } from './patternDetectionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MIRROR_STORAGE_KEY = 'emotional_mirror_reports';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayName(timestamp: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(timestamp).getDay()];
}

function getWeekLabel(start: number, end: number): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[startDate.getMonth()]} ${startDate.getDate()} - ${months[endDate.getMonth()]} ${endDate.getDate()}`;
}

function buildLandscape(entries: JournalEntry[]): EmotionalLandscape {
  if (entries.length === 0) {
    return {
      dominantEmotions: [],
      averageDistress: 0,
      distressTrend: 'insufficient',
      peakDistressDay: null,
      calmestDay: null,
      totalCheckIns: 0,
    };
  }

  const emotionCounts: Record<string, { emoji: string; count: number }> = {};
  entries.forEach(e => {
    e.checkIn.emotions.forEach(em => {
      if (!emotionCounts[em.label]) {
        emotionCounts[em.label] = { emoji: em.emoji, count: 0 };
      }
      emotionCounts[em.label].count += 1;
    });
  });

  const totalEmotions = Object.values(emotionCounts).reduce((s, c) => s + c.count, 0);
  const dominantEmotions = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([label, data]) => ({
      label,
      emoji: data.emoji,
      count: data.count,
      percentage: totalEmotions > 0 ? Math.round((data.count / totalEmotions) * 100) : 0,
    }));

  const avgDistress = Math.round(
    (entries.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / entries.length) * 10
  ) / 10;

  const dayDistress: Record<string, { total: number; count: number; dayName: string }> = {};
  entries.forEach(e => {
    const key = getDateKey(e.timestamp);
    if (!dayDistress[key]) {
      dayDistress[key] = { total: 0, count: 0, dayName: getDayName(e.timestamp) };
    }
    dayDistress[key].total += e.checkIn.intensityLevel;
    dayDistress[key].count += 1;
  });

  const dayAverages = Object.entries(dayDistress).map(([date, d]) => ({
    date,
    dayName: d.dayName,
    avg: d.total / d.count,
  }));

  const sorted = [...dayAverages].sort((a, b) => b.avg - a.avg);
  const peakDistressDay = sorted[0]?.dayName ?? null;
  const calmestDay = sorted.length > 1 ? sorted[sorted.length - 1].dayName : null;

  let distressTrend: EmotionalLandscape['distressTrend'] = 'insufficient';
  if (entries.length >= 4) {
    const half = Math.floor(entries.length / 2);
    const sortedByTime = [...entries].sort((a, b) => a.timestamp - b.timestamp);
    const firstHalf = sortedByTime.slice(0, half);
    const secondHalf = sortedByTime.slice(half);
    const firstAvg = firstHalf.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    distressTrend = diff < -0.5 ? 'improving' : diff > 0.5 ? 'elevated' : 'stable';
  }

  return {
    dominantEmotions,
    averageDistress: avgDistress,
    distressTrend,
    peakDistressDay,
    calmestDay,
    totalCheckIns: entries.length,
  };
}

function buildInsights(
  entries: JournalEntry[],
  messageDrafts: MessageDraft[],
  landscape: EmotionalLandscape,
): EmotionalMirrorInsight[] {
  const insights: EmotionalMirrorInsight[] = [];
  const now = Date.now();

  if (landscape.distressTrend === 'improving') {
    insights.push({
      id: 'distress_improving',
      title: 'Distress is easing',
      description: 'Your distress levels have been trending downward this week.',
      evidence: `Average distress: ${landscape.averageDistress}/10`,
      supportiveNote: 'This is meaningful progress. The work you are doing matters.',
      recommendedAction: 'Keep leaning into the tools and practices that have been helping.',
      category: 'growth',
      severity: 'gentle',
      timestamp: now,
    });
  } else if (landscape.distressTrend === 'elevated') {
    insights.push({
      id: 'distress_elevated',
      title: 'Emotions have been intense',
      description: 'Distress levels have been higher in the second half of this week.',
      evidence: `Average distress: ${landscape.averageDistress}/10`,
      supportiveNote: 'Higher intensity does not mean you are failing. It means something important is happening emotionally.',
      recommendedAction: 'Consider extra grounding or self-soothing practices during this period.',
      category: 'distress',
      severity: 'notable',
      timestamp: now,
    });
  }

  const topTriggers: Record<string, number> = {};
  entries.forEach(e => {
    e.checkIn.triggers.forEach(t => {
      topTriggers[t.label] = (topTriggers[t.label] || 0) + 1;
    });
  });
  const sortedTriggers = Object.entries(topTriggers).sort(([, a], [, b]) => b - a);

  if (sortedTriggers.length > 0 && sortedTriggers[0][1] >= 2) {
    const [label, count] = sortedTriggers[0];
    insights.push({
      id: 'top_trigger',
      title: `"${label}" keeps appearing`,
      description: `This trigger showed up ${count} times in your check-ins this week.`,
      evidence: `${count} out of ${entries.length} check-ins`,
      supportiveNote: 'Recurring triggers often point to something that matters deeply to you.',
      recommendedAction: 'When this trigger appears, try naming it out loud before reacting.',
      category: 'trigger',
      severity: count >= 3 ? 'important' : 'notable',
      timestamp: now,
    });
  }

  const rewriteCount = messageDrafts.filter(m => m.rewrittenText).length;
  const pauseCount = messageDrafts.filter(m => m.paused).length;
  if (rewriteCount + pauseCount >= 2) {
    insights.push({
      id: 'message_awareness',
      title: 'Thoughtful communication',
      description: `You paused or rewrote ${rewriteCount + pauseCount} messages this week.`,
      evidence: `${pauseCount} pauses, ${rewriteCount} rewrites`,
      supportiveNote: 'Creating space between feeling and sending is a powerful skill you are building.',
      recommendedAction: 'Continue using the message guard when emotions feel strong.',
      category: 'growth',
      severity: 'gentle',
      timestamp: now,
    });
  }

  if (landscape.peakDistressDay && landscape.calmestDay && landscape.peakDistressDay !== landscape.calmestDay) {
    insights.push({
      id: 'day_pattern',
      title: 'Daily rhythm',
      description: `${landscape.peakDistressDay} tended to be more intense, while ${landscape.calmestDay} was calmer.`,
      evidence: 'Based on average distress by day',
      supportiveNote: 'Understanding your emotional rhythm helps you plan self-care around your needs.',
      recommendedAction: `Consider scheduling extra support or gentler activities on ${landscape.peakDistressDay}s.`,
      category: 'pattern',
      severity: 'gentle',
      timestamp: now,
    });
  }

  if (landscape.dominantEmotions.length >= 2) {
    const top = landscape.dominantEmotions.slice(0, 2);
    insights.push({
      id: 'dominant_emotions',
      title: 'Emotional theme',
      description: `${top[0].emoji} ${top[0].label} and ${top[1].emoji} ${top[1].label} were your most frequent emotions.`,
      evidence: `${top[0].percentage}% and ${top[1].percentage}% of emotional check-ins`,
      supportiveNote: 'Your emotional landscape is complex and valid. Every feeling carries information.',
      recommendedAction: 'Notice what situations bring these emotions, and what helps them ease.',
      category: 'pattern',
      severity: 'gentle',
      timestamp: now,
    });
  }

  return insights;
}

function buildGrowthSignals(
  entries: JournalEntry[],
  messageDrafts: MessageDraft[],
  landscape: EmotionalLandscape,
): GrowthSignalMirror[] {
  const signals: GrowthSignalMirror[] = [];

  if (landscape.distressTrend === 'improving') {
    signals.push({
      id: 'growth_reduced_distress',
      label: 'Lower distress peaks',
      description: 'Your distress peaks were lower this week compared to earlier days.',
      evidence: `Average distress: ${landscape.averageDistress}/10`,
      signalType: 'reduced_distress',
    });
  }

  const pauseCount = messageDrafts.filter(m => m.paused).length;
  if (pauseCount >= 2) {
    signals.push({
      id: 'growth_pausing',
      label: 'Pausing before reacting',
      description: `You paused before responding in ${pauseCount} situations this week.`,
      evidence: `${pauseCount} message pauses`,
      signalType: 'paused_before_reacting',
    });
  }

  const copingEntries = entries.filter(e => e.checkIn.copingUsed && e.checkIn.copingUsed.length > 0);
  if (copingEntries.length >= 2) {
    signals.push({
      id: 'growth_coping',
      label: 'Active coping',
      description: `You used coping tools in ${copingEntries.length} check-ins this week.`,
      evidence: `${copingEntries.length} times using tools`,
      signalType: 'coping_improvement',
    });
  }

  if (landscape.totalCheckIns >= 5) {
    signals.push({
      id: 'growth_consistency',
      label: 'Consistent self-awareness',
      description: `${landscape.totalCheckIns} check-ins this week shows commitment to understanding yourself.`,
      evidence: `${landscape.totalCheckIns} check-ins`,
      signalType: 'consistent_checkins',
    });
  }

  const managedEntries = entries.filter(e => e.outcome === 'managed');
  if (managedEntries.length >= 2) {
    signals.push({
      id: 'growth_managed',
      label: 'Emotional management',
      description: `You managed your emotions effectively in ${managedEntries.length} situations.`,
      evidence: `${managedEntries.length} managed outcomes`,
      signalType: 'fewer_escalations',
    });
  }

  return signals;
}

function buildRelationshipPatterns(entries: JournalEntry[]): RelationshipMirrorPattern[] {
  const patterns: RelationshipMirrorPattern[] = [];

  const relEntries = entries.filter(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship')
  );

  if (relEntries.length < 2) return patterns;

  const triggerCounts: Record<string, { count: number; emotions: Set<string> }> = {};
  relEntries.forEach(e => {
    e.checkIn.triggers
      .filter(t => t.category === 'relationship')
      .forEach(t => {
        if (!triggerCounts[t.label]) {
          triggerCounts[t.label] = { count: 0, emotions: new Set() };
        }
        triggerCounts[t.label].count += 1;
        e.checkIn.emotions.forEach(em => triggerCounts[t.label].emotions.add(em.label));
      });
  });

  Object.entries(triggerCounts)
    .filter(([, data]) => data.count >= 2)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3)
    .forEach(([label, data], i) => {
      patterns.push({
        id: `rel_pattern_${i}`,
        description: `"${label}" appeared ${data.count} times in relationship-related moments.`,
        frequency: data.count,
        relatedEmotions: Array.from(data.emotions).slice(0, 3),
        supportiveNote: 'Relationship patterns often reflect deep emotional needs. Understanding them is a form of self-care.',
      });
    });

  return patterns;
}

function buildCopingSummary(entries: JournalEntry[]): CopingMirrorSummary {
  const toolCounts: Record<string, { count: number; reductions: number[] }> = {};
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (!entry.checkIn.copingUsed || entry.checkIn.copingUsed.length === 0) continue;

    const next = sorted[i + 1];
    const reduction = next
      ? entry.checkIn.intensityLevel - next.checkIn.intensityLevel
      : 0;

    entry.checkIn.copingUsed.forEach(tool => {
      if (!toolCounts[tool]) toolCounts[tool] = { count: 0, reductions: [] };
      toolCounts[tool].count += 1;
      toolCounts[tool].reductions.push(reduction);
    });
  }

  const toolsUsed = Object.entries(toolCounts)
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgReduction: data.reductions.length > 0
        ? Math.round((data.reductions.reduce((s, r) => s + r, 0) / data.reductions.length) * 10) / 10
        : 0,
    }))
    .sort((a, b) => b.avgReduction - a.avgReduction);

  const mostEffective = toolsUsed.find(t => t.avgReduction > 0)?.name ?? null;
  const totalCopingEvents = toolsUsed.reduce((s, t) => s + t.count, 0);

  return { toolsUsed, mostEffective, totalCopingEvents };
}

export function generateEmotionalMirrorReport(
  allEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): EmotionalMirrorReport {
  console.log('[EmotionalMirror] Generating report from', allEntries.length, 'entries');

  const now = Date.now();
  const weekAgo = now - SEVEN_DAYS;

  const weekEntries = allEntries
    .filter(e => e.timestamp >= weekAgo)
    .sort((a, b) => b.timestamp - a.timestamp);

  const weekMessages = messageDrafts.filter(m => m.timestamp >= weekAgo);

  const landscape = buildLandscape(weekEntries);
  const insights = buildInsights(weekEntries, weekMessages, landscape);
  const patterns = detectPatterns(weekEntries, weekMessages);
  const growthSignals = buildGrowthSignals(weekEntries, weekMessages, landscape);
  const relationshipPatterns = buildRelationshipPatterns(weekEntries);
  const copingSummary = buildCopingSummary(weekEntries);

  const report: EmotionalMirrorReport = {
    id: `mirror_${now}`,
    generatedAt: now,
    periodStart: weekAgo,
    periodEnd: now,
    landscape,
    insights,
    patterns,
    growthSignals,
    relationshipPatterns,
    copingSummary,
    weekLabel: getWeekLabel(weekAgo, now),
  };

  console.log('[EmotionalMirror] Report generated:', {
    insights: insights.length,
    patterns: patterns.length,
    growthSignals: growthSignals.length,
    relationshipPatterns: relationshipPatterns.length,
  });

  return report;
}

export async function saveReport(report: EmotionalMirrorReport): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(MIRROR_STORAGE_KEY);
    const reports: EmotionalMirrorReport[] = stored ? JSON.parse(stored) : [];
    reports.unshift(report);
    const trimmed = reports.slice(0, 12);
    await AsyncStorage.setItem(MIRROR_STORAGE_KEY, JSON.stringify(trimmed));
    console.log('[EmotionalMirror] Report saved, total stored:', trimmed.length);
  } catch (error) {
    console.error('[EmotionalMirror] Failed to save report:', error);
  }
}

export async function getStoredReports(): Promise<EmotionalMirrorReport[]> {
  try {
    const stored = await AsyncStorage.getItem(MIRROR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[EmotionalMirror] Failed to load reports:', error);
    return [];
  }
}
