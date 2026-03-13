import { JournalEntry, MessageDraft } from '@/types';
import {
  ReflectionTheme,
  RelationshipPattern,
  CopingInsight,
  GrowthSignal,
} from '@/types/reflectionMirror';

function getRecentEntries(entries: JournalEntry[], days: number): JournalEntry[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries.filter(e => e.timestamp >= cutoff);
}

function getRecentDrafts(drafts: MessageDraft[], days: number): MessageDraft[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return drafts.filter(d => d.timestamp >= cutoff);
}

export function generateEmotionalThemes(
  entries: JournalEntry[],
): ReflectionTheme[] {
  const recent = getRecentEntries(entries, 14);
  const older = entries.filter(e => {
    const age = Date.now() - e.timestamp;
    return age >= 14 * 24 * 60 * 60 * 1000 && age < 28 * 24 * 60 * 60 * 1000;
  });

  const recentCounts: Record<string, { emoji: string; count: number }> = {};
  const olderCounts: Record<string, number> = {};

  recent.forEach(entry => {
    entry.checkIn.emotions.forEach(em => {
      if (!recentCounts[em.label]) recentCounts[em.label] = { emoji: em.emoji, count: 0 };
      recentCounts[em.label].count += 1;
    });
  });

  older.forEach(entry => {
    entry.checkIn.emotions.forEach(em => {
      olderCounts[em.label] = (olderCounts[em.label] || 0) + 1;
    });
  });

  const themes: ReflectionTheme[] = Object.entries(recentCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 6)
    .map(([label, data], i) => {
      const olderCount = olderCounts[label] || 0;
      let trend: 'rising' | 'falling' | 'steady' = 'steady';
      if (data.count > olderCount + 1) trend = 'rising';
      else if (data.count < olderCount - 1) trend = 'falling';

      const descriptions: Record<string, string> = {
        'Anxious': 'You often feel anxious when communication feels uncertain.',
        'Afraid': 'Fear seems to show up during moments of perceived rejection.',
        'Angry': 'Anger may arise when boundaries feel crossed.',
        'Shame': 'Shame tends to appear after moments of conflict or vulnerability.',
        'Sad': 'Sadness seems connected to longing for connection.',
        'Overwhelmed': 'Feeling overwhelmed may signal emotional accumulation.',
        'Lonely': 'Loneliness often appears during periods of disconnection.',
        'Hurt': 'Feeling hurt seems linked to unmet expectations in relationships.',
        'Guilty': 'Guilt may surface when you feel your reactions affected someone.',
        'Numb': 'Numbness might be a protective response to sustained intensity.',
      };

      const description = descriptions[label] ||
        `${label} has been a recurring presence in your emotional landscape.`;

      return {
        id: `theme_${i}`,
        label,
        emoji: data.emoji,
        description,
        frequency: data.count,
        trend,
      };
    });

  console.log('[ReflectionGenerator] Generated emotional themes:', themes.length);
  return themes;
}

export function generateRelationshipPatterns(
  entries: JournalEntry[],
  drafts: MessageDraft[],
): RelationshipPattern[] {
  const recent = getRecentEntries(entries, 14);
  const patterns: RelationshipPattern[] = [];

  const relTriggers = recent.flatMap(e =>
    e.checkIn.triggers.filter(t => t.category === 'relationship')
  );

  const triggerCounts: Record<string, number> = {};
  relTriggers.forEach(t => {
    triggerCounts[t.label] = (triggerCounts[t.label] || 0) + 1;
  });

  const emotionsAfterRelTriggers: Record<string, string[]> = {};
  recent.forEach(entry => {
    const hasRelTrigger = entry.checkIn.triggers.some(t => t.category === 'relationship');
    if (hasRelTrigger) {
      entry.checkIn.triggers
        .filter(t => t.category === 'relationship')
        .forEach(t => {
          if (!emotionsAfterRelTriggers[t.label]) emotionsAfterRelTriggers[t.label] = [];
          entry.checkIn.emotions.forEach(em => {
            emotionsAfterRelTriggers[t.label].push(em.label);
          });
        });
    }
  });

  const recentDrafts = getRecentDrafts(drafts, 14);
  const reassuranceCount = recentDrafts.filter(d =>
    d.originalText.toLowerCase().includes('?') ||
    d.rewriteType === 'secure'
  ).length;

  Object.entries(triggerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .forEach(([trigger, count], i) => {
      const emotions = emotionsAfterRelTriggers[trigger] || [];
      const topEmotion = getTopFromArray(emotions) || 'distress';

      const narrativeTemplates: Record<string, string> = {
        'Delayed replies': `When replies feel delayed, ${topEmotion.toLowerCase()} often seems to follow. This pattern may be connected to how uncertainty activates deeper fears.`,
        'Mixed signals': `Mixed signals appear to trigger ${topEmotion.toLowerCase()}. The ambiguity may feel especially destabilizing.`,
        'Conflict': `Conflict situations tend to bring up ${topEmotion.toLowerCase()}. This is a common and understandable response.`,
        'Rejection': `Perceived rejection seems to activate ${topEmotion.toLowerCase()}. This may connect to deeper attachment needs.`,
        'Being ignored': `Feeling ignored often leads to ${topEmotion.toLowerCase()}. The silence may feel like it carries meaning it doesn't always have.`,
      };

      const narrative = narrativeTemplates[trigger] ||
        `"${trigger}" tends to activate ${topEmotion.toLowerCase()} for you. Noticing this pattern is already meaningful.`;

      patterns.push({
        id: `rel_${i}`,
        trigger,
        emotionalResponse: topEmotion,
        narrative,
        frequency: count,
      });
    });

  if (reassuranceCount >= 2 && patterns.length < 4) {
    patterns.push({
      id: `rel_reassurance`,
      trigger: 'Communication uncertainty',
      emotionalResponse: 'Reassurance-seeking',
      narrative: 'Reassurance-seeking patterns seem present during moments of communication uncertainty. This is a natural response to emotional activation.',
      frequency: reassuranceCount,
    });
  }

  console.log('[ReflectionGenerator] Generated relationship patterns:', patterns.length);
  return patterns;
}

export function generateCopingInsights(
  entries: JournalEntry[],
  drafts: MessageDraft[],
): CopingInsight[] {
  const recent = getRecentEntries(entries, 14);
  const insights: CopingInsight[] = [];

  const toolUsage: Record<string, { count: number; improved: number }> = {};
  const sorted = [...recent].sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const coping = entry.checkIn.copingUsed;
    if (!coping || coping.length === 0) continue;

    const before = entry.checkIn.intensityLevel;
    const next = sorted[i + 1];
    const after = next ? next.checkIn.intensityLevel : Math.max(1, before - 2);

    coping.forEach(tool => {
      if (!toolUsage[tool]) toolUsage[tool] = { count: 0, improved: 0 };
      toolUsage[tool].count += 1;
      if (after < before) toolUsage[tool].improved += 1;
    });
  }

  const recentDrafts = getRecentDrafts(drafts, 14);
  const pauseCount = recentDrafts.filter(d => d.paused).length;
  const rewriteCount = recentDrafts.filter(d => d.rewrittenText).length;

  if (pauseCount > 0) {
    toolUsage['Pausing before sending'] = {
      count: pauseCount,
      improved: Math.ceil(pauseCount * 0.7),
    };
  }

  if (rewriteCount > 0) {
    toolUsage['Message rewriting'] = {
      count: rewriteCount,
      improved: Math.ceil(rewriteCount * 0.6),
    };
  }

  const emojiMap: Record<string, string> = {
    'Breathing': '🌬️',
    'Grounding': '🌿',
    'Journaling': '📝',
    'Self-soothing': '🫶',
    'Reality check': '🔍',
    'Opposite action': '↩️',
    'Mindfulness': '🧘',
    'Pausing before sending': '⏸️',
    'Message rewriting': '✍️',
    'Exercise': '🏃',
    'Social support': '🤝',
  };

  Object.entries(toolUsage)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .forEach(([tool, data], i) => {
      const rate = data.count > 0 ? Math.round((data.improved / data.count) * 100) : 0;
      let helpfulnessNote = `Used ${data.count} time${data.count !== 1 ? 's' : ''} recently.`;
      if (rate >= 60) helpfulnessNote = `${tool} appears to help reduce distress for you.`;
      else if (rate >= 30) helpfulnessNote = `${tool} may help in certain situations.`;

      insights.push({
        id: `coping_${i}`,
        tool,
        timesUsed: data.count,
        helpfulnessNote,
        emoji: emojiMap[tool] || '🛠️',
      });
    });

  console.log('[ReflectionGenerator] Generated coping insights:', insights.length);
  return insights;
}

export function generateGrowthSignals(
  entries: JournalEntry[],
  drafts: MessageDraft[],
): GrowthSignal[] {
  const recent = getRecentEntries(entries, 14);
  const older = entries.filter(e => {
    const age = Date.now() - e.timestamp;
    return age >= 14 * 24 * 60 * 60 * 1000 && age < 28 * 24 * 60 * 60 * 1000;
  });

  const signals: GrowthSignal[] = [];

  const recentAvg = recent.length > 0
    ? recent.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / recent.length
    : 0;
  const olderAvg = older.length > 0
    ? older.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / older.length
    : 0;

  if (olderAvg > 0 && recentAvg < olderAvg - 0.5) {
    signals.push({
      id: 'growth_distress',
      area: 'Lower distress',
      description: 'Your overall distress levels seem to be softening over time.',
      emoji: '📉',
    });
  }

  const recentDrafts = getRecentDrafts(drafts, 14);
  const olderDrafts = drafts.filter(d => {
    const age = Date.now() - d.timestamp;
    return age >= 14 * 24 * 60 * 60 * 1000 && age < 28 * 24 * 60 * 60 * 1000;
  });

  const recentPauses = recentDrafts.filter(d => d.paused).length;
  const olderPauses = olderDrafts.filter(d => d.paused).length;
  if (recentPauses > olderPauses) {
    signals.push({
      id: 'growth_pausing',
      area: 'More pausing',
      description: 'You are pausing before reacting more often. This is a meaningful shift.',
      emoji: '⏸️',
    });
  }

  const recentReflections = recent.filter(e => e.reflection && e.reflection.length > 20).length;
  if (recentReflections >= 3) {
    signals.push({
      id: 'growth_reflection',
      area: 'Deeper reflections',
      description: 'Your reflections are becoming more thoughtful and detailed.',
      emoji: '✨',
    });
  }

  if (recent.length >= 5) {
    signals.push({
      id: 'growth_consistency',
      area: 'Consistent check-ins',
      description: 'Showing up regularly is building deeper self-awareness.',
      emoji: '🔄',
    });
  }

  const recentCoping = recent.reduce((s, e) => s + (e.checkIn.copingUsed?.length ?? 0), 0);
  const olderCoping = older.reduce((s, e) => s + (e.checkIn.copingUsed?.length ?? 0), 0);
  if (recentCoping > olderCoping && recentCoping >= 3) {
    signals.push({
      id: 'growth_coping',
      area: 'Active coping',
      description: 'You are reaching for coping tools more frequently.',
      emoji: '🧰',
    });
  }

  const recentRewrites = recentDrafts.filter(d => d.rewrittenText).length;
  if (recentRewrites >= 2) {
    signals.push({
      id: 'growth_communication',
      area: 'Mindful communication',
      description: 'Rewriting messages before sending shows growing self-regulation.',
      emoji: '💬',
    });
  }

  if (signals.length === 0) {
    signals.push({
      id: 'growth_presence',
      area: 'Being here',
      description: 'The fact that you are here, reflecting, is itself a sign of growth.',
      emoji: '🌱',
    });
  }

  console.log('[ReflectionGenerator] Generated growth signals:', signals.length);
  return signals;
}

export function generateOpeningReflection(
  entries: JournalEntry[],
  drafts: MessageDraft[],
): string {
  const recent = getRecentEntries(entries, 14);

  if (recent.length < 2) {
    return 'As you continue checking in, your reflection mirror will reveal deeper patterns and insights about your emotional world.';
  }

  const avgDistress = recent.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / recent.length;
  const topEmotion = getTopFromArray(
    recent.flatMap(e => e.checkIn.emotions.map(em => em.label))
  );
  const relTriggers = recent.flatMap(e =>
    e.checkIn.triggers.filter(t => t.category === 'relationship')
  );
  const recentDrafts = getRecentDrafts(drafts, 14);
  const pauseCount = recentDrafts.filter(d => d.paused).length;

  const parts: string[] = [];

  if (avgDistress >= 6) {
    parts.push('Recent days seem to have carried significant emotional weight.');
  } else if (avgDistress >= 3.5) {
    parts.push('Your emotional landscape recently has had its share of ups and downs.');
  } else {
    parts.push('Things seem to have been relatively calmer lately.');
  }

  if (topEmotion) {
    parts.push(`${topEmotion} has been your most present emotion.`);
  }

  if (relTriggers.length >= 3) {
    parts.push('Relationship themes have been particularly active.');
  }

  if (pauseCount > 0) {
    parts.push(`You paused before responding ${pauseCount} time${pauseCount !== 1 ? 's' : ''} — that takes real strength.`);
  }

  return parts.join(' ');
}

function getTopFromArray(items: string[]): string | null {
  const counts: Record<string, number> = {};
  items.forEach(item => { counts[item] = (counts[item] || 0) + 1; });
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  return sorted[0]?.[0] ?? null;
}
