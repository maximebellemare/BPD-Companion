import { JournalEntry } from '@/types';
import { MemoryProfile, MemoryInsight, RelationshipPattern, Improvement } from '@/types/memory';

export function generateMemoryInsights(profile: MemoryProfile): MemoryInsight[] {
  const insights: MemoryInsight[] = [];

  if (profile.topTriggers.length > 0) {
    const top = profile.topTriggers[0];
    insights.push({
      id: 'mem-trigger-top',
      category: 'trigger',
      icon: '⚡',
      title: 'Most Common Trigger',
      description: `"${top.label}" appears in ${top.percentage}% of your check-ins.`,
      detail: profile.topTriggers.length > 1
        ? `Also watch for "${profile.topTriggers[1].label}" (${profile.topTriggers[1].percentage}%).`
        : undefined,
      sentiment: 'neutral',
    });
  }

  if (profile.topTriggers.length >= 2) {
    const labels = profile.topTriggers.slice(0, 3).map(t => t.label).join(', ');
    insights.push({
      id: 'mem-trigger-pattern',
      category: 'trigger',
      icon: '🔄',
      title: 'Trigger Patterns',
      description: `Your recurring triggers are: ${labels}.`,
      detail: 'Recognizing patterns is the first step to managing them.',
      sentiment: 'neutral',
    });
  }

  if (profile.topEmotions.length > 0) {
    const top = profile.topEmotions[0];
    insights.push({
      id: 'mem-emotion-top',
      category: 'emotion',
      icon: '💜',
      title: 'Dominant Emotion',
      description: `You often feel "${top.label}" — it shows up in ${top.percentage}% of entries.`,
      detail: profile.topEmotions.length > 1
        ? `"${profile.topEmotions[1].label}" is also frequent.`
        : undefined,
      sentiment: 'neutral',
    });
  }

  if (profile.mostEffectiveCoping) {
    insights.push({
      id: 'mem-coping-best',
      category: 'coping',
      icon: '🛡️',
      title: 'Most Effective Tool',
      description: `"${profile.mostEffectiveCoping.label}" has been your go-to coping tool.`,
      detail: `Used ${profile.mostEffectiveCoping.count} times. Keep it in your toolkit.`,
      sentiment: 'positive',
    });
  }

  if (profile.copingToolsUsed.length >= 2) {
    const tools = profile.copingToolsUsed.slice(0, 3).map(t => t.label).join(', ');
    insights.push({
      id: 'mem-coping-variety',
      category: 'coping',
      icon: '🧰',
      title: 'Your Coping Toolkit',
      description: `You regularly use: ${tools}.`,
      detail: 'Having multiple tools means more options in difficult moments.',
      sentiment: 'positive',
    });
  }

  if (profile.copingSuccessRate > 0) {
    const sentiment = profile.copingSuccessRate >= 50 ? 'positive' as const : 'cautious' as const;
    insights.push({
      id: 'mem-coping-rate',
      category: 'coping',
      icon: profile.copingSuccessRate >= 50 ? '✅' : '📊',
      title: 'Coping Success Rate',
      description: `${profile.copingSuccessRate}% of your entries show managed outcomes.`,
      detail: sentiment === 'positive'
        ? 'You\'re building real emotional resilience.'
        : 'Every attempt at coping is progress — keep going.',
      sentiment,
    });
  }

  profile.relationshipPatterns.forEach((rp, i) => {
    if (i < 2) {
      insights.push({
        id: `mem-rel-${rp.id}`,
        category: 'relationship',
        icon: '💬',
        title: 'Relationship Pattern',
        description: rp.pattern,
        detail: `Often triggered by "${rp.associatedTrigger}" and leads to feeling "${rp.associatedEmotion}".`,
        sentiment: 'cautious',
      });
    }
  });

  profile.recentImprovements.forEach((imp) => {
    insights.push({
      id: `mem-imp-${imp.id}`,
      category: 'improvement',
      icon: '🌱',
      title: imp.area,
      description: imp.description,
      sentiment: 'positive',
    });
  });

  if (profile.intensityTrend === 'falling') {
    insights.push({
      id: 'mem-trend-falling',
      category: 'pattern',
      icon: '📉',
      title: 'Intensity Decreasing',
      description: 'Your emotional intensity has been trending downward recently.',
      detail: 'This suggests your coping strategies are working.',
      sentiment: 'positive',
    });
  } else if (profile.intensityTrend === 'rising') {
    insights.push({
      id: 'mem-trend-rising',
      category: 'pattern',
      icon: '📈',
      title: 'Intensity Increasing',
      description: 'Your emotional intensity has been higher lately.',
      detail: 'Be extra gentle with yourself and lean on your coping tools.',
      sentiment: 'cautious',
    });
  }

  if (profile.weeklyCheckInAvg > 0) {
    insights.push({
      id: 'mem-checkin-freq',
      category: 'pattern',
      icon: '📅',
      title: 'Check-In Consistency',
      description: `You average ${profile.weeklyCheckInAvg.toFixed(1)} check-ins per week.`,
      detail: profile.weeklyCheckInAvg >= 3
        ? 'Great consistency — regular reflection strengthens self-awareness.'
        : 'Try checking in more often to build stronger patterns.',
      sentiment: profile.weeklyCheckInAvg >= 3 ? 'positive' : 'neutral',
    });
  }

  return insights;
}

export function buildRelationshipPatterns(entries: JournalEntry[]): RelationshipPattern[] {
  const patterns: RelationshipPattern[] = [];
  const relationshipTriggers = entries.filter(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship')
  );

  if (relationshipTriggers.length === 0) return patterns;

  const triggerEmotionMap: Record<string, Record<string, number>> = {};

  relationshipTriggers.forEach(entry => {
    const relTriggers = entry.checkIn.triggers.filter(t => t.category === 'relationship');
    relTriggers.forEach(trigger => {
      if (!triggerEmotionMap[trigger.label]) {
        triggerEmotionMap[trigger.label] = {};
      }
      entry.checkIn.emotions.forEach(emotion => {
        triggerEmotionMap[trigger.label][emotion.label] =
          (triggerEmotionMap[trigger.label][emotion.label] || 0) + 1;
      });
    });
  });

  let patternIndex = 0;
  Object.entries(triggerEmotionMap).forEach(([trigger, emotions]) => {
    const topEmotion = Object.entries(emotions).sort(([, a], [, b]) => b - a)[0];
    if (topEmotion) {
      const frequency = Object.values(emotions).reduce((s, c) => s + c, 0);
      if (frequency >= 2) {
        patterns.push({
          id: `rp-${patternIndex++}`,
          pattern: `When "${trigger}" happens, you tend to feel "${topEmotion[0]}".`,
          frequency,
          associatedTrigger: trigger,
          associatedEmotion: topEmotion[0],
        });
      }
    }
  });

  return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
}

export function buildImprovements(entries: JournalEntry[]): Improvement[] {
  const improvements: Improvement[] = [];

  if (entries.length < 5) return improvements;

  const recent = entries.slice(0, Math.min(10, entries.length));
  const older = entries.slice(Math.min(10, entries.length), Math.min(20, entries.length));

  if (older.length < 3) return improvements;

  const recentAvgIntensity = recent.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / recent.length;
  const olderAvgIntensity = older.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / older.length;
  const intensityChange = olderAvgIntensity - recentAvgIntensity;

  if (intensityChange > 0.5) {
    improvements.push({
      id: 'imp-intensity',
      area: 'Lower Distress Levels',
      description: `Your average intensity dropped by ${intensityChange.toFixed(1)} points recently.`,
      metric: 'intensity',
      change: intensityChange,
    });
  }

  const recentManaged = recent.filter(e => e.outcome === 'managed').length;
  const olderManaged = older.filter(e => e.outcome === 'managed').length;
  const recentRate = recent.length > 0 ? recentManaged / recent.length : 0;
  const olderRate = older.length > 0 ? olderManaged / older.length : 0;

  if (recentRate > olderRate + 0.1) {
    improvements.push({
      id: 'imp-coping',
      area: 'Better Coping Outcomes',
      description: `You are managing emotions more effectively — ${Math.round(recentRate * 100)}% managed recently vs ${Math.round(olderRate * 100)}% before.`,
      metric: 'coping',
      change: recentRate - olderRate,
    });
  }

  const recentCopingTools = new Set<string>();
  recent.forEach(e => e.checkIn.copingUsed?.forEach(t => recentCopingTools.add(t)));
  const olderCopingTools = new Set<string>();
  older.forEach(e => e.checkIn.copingUsed?.forEach(t => olderCopingTools.add(t)));

  if (recentCopingTools.size > olderCopingTools.size) {
    improvements.push({
      id: 'imp-toolkit',
      area: 'Expanding Your Toolkit',
      description: `You are using ${recentCopingTools.size} different coping tools now, up from ${olderCopingTools.size}.`,
      metric: 'coping',
      change: recentCopingTools.size - olderCopingTools.size,
    });
  }

  return improvements;
}

export function calculateCopingSuccessRate(entries: JournalEntry[]): number {
  const withOutcome = entries.filter(e => e.outcome);
  if (withOutcome.length === 0) return 0;
  const managed = withOutcome.filter(e => e.outcome === 'managed').length;
  return Math.round((managed / withOutcome.length) * 100);
}

export function calculateWeeklyCheckInAvg(entries: JournalEntry[]): number {
  if (entries.length < 2) return entries.length;

  const newest = entries[0].timestamp;
  const oldest = entries[entries.length - 1].timestamp;
  const weeks = Math.max(1, (newest - oldest) / (7 * 24 * 60 * 60 * 1000));

  return entries.length / weeks;
}
