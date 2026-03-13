import { JournalEntry, MessageDraft } from '@/types';
import { GraphPatternSummary } from '@/types/memoryGraph';
import {
  EmotionalLandscape,
  RelationshipReflection,
  WhatHelpedSection,
  WhatEscalatedSection,
  GrowthSignalSection,
  NextWeekFocus,
} from '@/types/weeklyReflection';

function getDayLabel(timestamp: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(timestamp).getDay()];
}

export function buildEmotionalLandscape(
  entries: JournalEntry[],
  thisWeek: JournalEntry[],
  lastWeek: JournalEntry[],
): EmotionalLandscape {
  const emotionMap: Record<string, { emoji: string; thisWeek: number; lastWeek: number }> = {};

  thisWeek.forEach(entry => {
    entry.checkIn.emotions.forEach(e => {
      if (!emotionMap[e.label]) emotionMap[e.label] = { emoji: e.emoji, thisWeek: 0, lastWeek: 0 };
      emotionMap[e.label].thisWeek += 1;
    });
  });

  lastWeek.forEach(entry => {
    entry.checkIn.emotions.forEach(e => {
      if (!emotionMap[e.label]) emotionMap[e.label] = { emoji: e.emoji, thisWeek: 0, lastWeek: 0 };
      emotionMap[e.label].lastWeek += 1;
    });
  });

  const strongestEmotions = Object.entries(emotionMap)
    .sort(([, a], [, b]) => b.thisWeek - a.thisWeek)
    .slice(0, 5)
    .map(([label, data]) => {
      let trend: 'rising' | 'falling' | 'steady' = 'steady';
      if (data.thisWeek > data.lastWeek + 1) trend = 'rising';
      else if (data.thisWeek < data.lastWeek - 1) trend = 'falling';
      return { label, emoji: data.emoji, count: data.thisWeek, trend };
    });

  const triggerMap: Record<string, { count: number; category: string }> = {};
  thisWeek.forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      if (!triggerMap[t.label]) triggerMap[t.label] = { count: 0, category: t.category };
      triggerMap[t.label].count += 1;
    });
  });

  const keyTriggers = Object.entries(triggerMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 4)
    .map(([label, data]) => ({ label, count: data.count, category: data.category }));

  const thisAvg = thisWeek.length > 0
    ? thisWeek.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / thisWeek.length
    : 0;
  const lastAvg = lastWeek.length > 0
    ? lastWeek.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / lastWeek.length
    : 0;

  let intensityTrend: 'decreasing' | 'increasing' | 'stable' = 'stable';
  if (thisAvg < lastAvg - 0.5) intensityTrend = 'decreasing';
  else if (thisAvg > lastAvg + 0.5) intensityTrend = 'increasing';

  let peakDay: string | null = null;
  if (thisWeek.length > 0) {
    const peakEntry = thisWeek.reduce((max, e) =>
      e.checkIn.intensityLevel > max.checkIn.intensityLevel ? e : max, thisWeek[0]);
    peakDay = getDayLabel(peakEntry.timestamp);
  }

  const narrative = buildEmotionalNarrative(strongestEmotions, intensityTrend, thisAvg, keyTriggers, peakDay);

  return {
    strongestEmotions,
    keyTriggers,
    intensityTrend,
    avgIntensity: Math.round(thisAvg * 10) / 10,
    peakDay,
    narrative,
  };
}

function buildEmotionalNarrative(
  emotions: { label: string; trend: string }[],
  intensityTrend: string,
  avgIntensity: number,
  triggers: { label: string; count: number }[],
  peakDay: string | null,
): string {
  const parts: string[] = [];

  if (emotions.length > 0) {
    const top = emotions[0];
    const trendWord = top.trend === 'rising' ? 'more present than before' :
      top.trend === 'falling' ? 'less intense than recently' : 'a steady presence';
    parts.push(`${top.label} seems to have been ${trendWord} this week.`);
  }

  if (intensityTrend === 'decreasing') {
    parts.push('Overall intensity appears to have softened compared to last week.');
  } else if (intensityTrend === 'increasing') {
    parts.push('This week seems to have carried more emotional weight than the last.');
  }

  if (triggers.length > 0) {
    parts.push(`"${triggers[0].label}" appeared as a recurring theme.`);
  }

  if (peakDay) {
    parts.push(`${peakDay} may have been the most intense day.`);
  }

  if (parts.length === 0) {
    return 'This week held its own emotional landscape. Each feeling you noticed matters.';
  }

  return parts.join(' ');
}

export function buildRelationshipReflection(
  thisWeek: JournalEntry[],
  lastWeek: JournalEntry[],
  thisWeekDrafts: MessageDraft[],
  lastWeekDrafts: MessageDraft[],
  _graphSummary: GraphPatternSummary | null,
): RelationshipReflection {
  const communicationThemes: string[] = [];
  const reassurancePatterns: { description: string; frequency: number }[] = [];
  const conflictImprovements: string[] = [];

  const relTriggers = thisWeek.flatMap(e =>
    e.checkIn.triggers.filter(t => t.category === 'relationship')
  );

  const relLabels: Record<string, number> = {};
  relTriggers.forEach(t => {
    relLabels[t.label] = (relLabels[t.label] || 0) + 1;
  });

  Object.entries(relLabels)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .forEach(([label]) => {
      communicationThemes.push(label);
    });

  const reassuranceTerms = ['reassurance', 'abandon', 'ignored', 'uncertain', 'rejection'];
  const reassuranceTriggers = relTriggers.filter(t =>
    reassuranceTerms.some(term => t.label.toLowerCase().includes(term))
  );

  if (reassuranceTriggers.length > 0) {
    reassurancePatterns.push({
      description: 'Reassurance-seeking patterns were present this week, often connected to communication uncertainty.',
      frequency: reassuranceTriggers.length,
    });
  }

  const thisWeekPauses = thisWeekDrafts.filter(d => d.paused).length;
  const lastWeekPauses = lastWeekDrafts.filter(d => d.paused).length;

  let pauseDirection: 'improving' | 'declining' | 'stable' = 'stable';
  if (thisWeekPauses > lastWeekPauses) pauseDirection = 'improving';
  else if (thisWeekPauses < lastWeekPauses && lastWeekPauses > 0) pauseDirection = 'declining';

  const thisWeekConflicts = thisWeek.filter(e =>
    e.checkIn.triggers.some(t => t.label.toLowerCase().includes('conflict'))
  ).length;
  const lastWeekConflicts = lastWeek.filter(e =>
    e.checkIn.triggers.some(t => t.label.toLowerCase().includes('conflict'))
  ).length;

  if (lastWeekConflicts > 0 && thisWeekConflicts < lastWeekConflicts) {
    conflictImprovements.push('Conflict-related triggers appeared less frequently this week.');
  }

  if (thisWeekPauses > 0) {
    conflictImprovements.push(`You paused before sending ${thisWeekPauses} message${thisWeekPauses !== 1 ? 's' : ''} this week.`);
  }

  const thisWeekRewrites = thisWeekDrafts.filter(d => d.rewrittenText).length;
  if (thisWeekRewrites > 0) {
    conflictImprovements.push(`You rewrote ${thisWeekRewrites} message${thisWeekRewrites !== 1 ? 's' : ''} for clearer communication.`);
  }

  const narrativeParts: string[] = [];
  if (communicationThemes.length > 0) {
    narrativeParts.push(`Relationship themes this week included "${communicationThemes[0]}."`)
  }
  if (pauseDirection === 'improving') {
    narrativeParts.push('You seem to be pausing more before responding, which may be helping protect your relationships.');
  }
  if (reassurancePatterns.length > 0) {
    narrativeParts.push('Reassurance-seeking tendencies were present — noticing this is already a step toward change.');
  }
  if (narrativeParts.length === 0) {
    narrativeParts.push('Relationship patterns this week were relatively quiet. That may reflect growing stability.');
  }

  return {
    communicationThemes,
    reassurancePatterns,
    conflictImprovements,
    pauseGrowth: {
      thisWeek: thisWeekPauses,
      lastWeek: lastWeekPauses,
      direction: pauseDirection,
    },
    narrative: narrativeParts.join(' '),
  };
}

export function buildWhatHelped(
  thisWeek: JournalEntry[],
  thisWeekDrafts: MessageDraft[],
): WhatHelpedSection {
  const toolUsage: Record<string, { count: number; improved: number }> = {};
  const sorted = [...thisWeek].sort((a, b) => a.timestamp - b.timestamp);

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

  const effectiveTools = Object.entries(toolUsage)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 4)
    .map(([tool, data]) => {
      const rate = data.count > 0 ? Math.round((data.improved / data.count) * 100) : 0;
      let effectivenessNote = 'Used but more data may help clarify its impact.';
      if (rate >= 60) effectivenessNote = 'This tool seems to be particularly helpful for you.';
      else if (rate >= 30) effectivenessNote = 'This tool may help in certain situations.';
      return { tool, timesUsed: data.count, effectivenessNote };
    });

  const successfulPauses = thisWeekDrafts.filter(d => d.paused).length;
  const helpedOutcomes = thisWeekDrafts.filter(d => d.outcome === 'helped').length;
  const totalOutcomes = thisWeekDrafts.filter(d => d.outcome).length;

  const helpfulPractices: string[] = [];
  const reflections = thisWeek.filter(e => e.reflection && e.reflection.length > 15).length;
  if (reflections >= 2) helpfulPractices.push('Journaling with deeper reflections');
  if (successfulPauses > 0) helpfulPractices.push('Pausing before sending messages');
  if (effectiveTools.length > 0) helpfulPractices.push(`Using ${effectiveTools[0].tool}`);
  if (thisWeek.length >= 3) helpfulPractices.push('Consistent check-ins');
  if (helpedOutcomes > 0) helpfulPractices.push('Recording and learning from communication outcomes');

  const narrativeParts: string[] = [];
  if (effectiveTools.length > 0) {
    narrativeParts.push(`${effectiveTools[0].tool} was your most-used tool this week.`);
  }
  if (successfulPauses > 0) {
    narrativeParts.push(`Pausing before sending helped ${successfulPauses} time${successfulPauses !== 1 ? 's' : ''}.`);
  }
  if (helpedOutcomes > 0 && totalOutcomes > 0) {
    const helpRate = Math.round((helpedOutcomes / totalOutcomes) * 100);
    narrativeParts.push(`${helpRate}% of recorded communication outcomes were rated as helpful — your intentionality is making a difference.`);
  }
  if (reflections >= 2) {
    narrativeParts.push('Writing deeper reflections seems to be supporting your awareness.');
  }
  if (narrativeParts.length === 0) {
    narrativeParts.push('Every small action — checking in, noticing, breathing — counts as progress.');
  }

  return {
    effectiveTools,
    successfulPauses,
    helpfulPractices,
    narrative: narrativeParts.join(' '),
  };
}

export function buildGrowthSignals(
  thisWeek: JournalEntry[],
  lastWeek: JournalEntry[],
  thisWeekDrafts: MessageDraft[],
  lastWeekDrafts: MessageDraft[],
  graphSummary: GraphPatternSummary | null,
): GrowthSignalSection {
  const improvements: { area: string; description: string; icon: string }[] = [];
  const awarenessGains: string[] = [];
  const communicationWins: string[] = [];

  const thisAvg = thisWeek.length > 0
    ? thisWeek.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / thisWeek.length
    : 0;
  const lastAvg = lastWeek.length > 0
    ? lastWeek.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / lastWeek.length
    : 0;

  if (lastAvg > 0 && thisAvg < lastAvg - 0.5) {
    const drop = Math.round(((lastAvg - thisAvg) / lastAvg) * 100);
    improvements.push({
      area: 'Lower Distress',
      description: `Average distress dropped by about ${drop}% this week.`,
      icon: '📉',
    });
  }

  const thisWeekHighIntensity = thisWeek.filter(e => e.checkIn.intensityLevel >= 7).length;
  const lastWeekHighIntensity = lastWeek.filter(e => e.checkIn.intensityLevel >= 7).length;
  if (lastWeekHighIntensity > 0 && thisWeekHighIntensity < lastWeekHighIntensity) {
    improvements.push({
      area: 'Fewer Peaks',
      description: 'You had fewer high-intensity moments compared to last week.',
      icon: '🌤️',
    });
  }

  const thisWeekPauses = thisWeekDrafts.filter(d => d.paused).length;
  const lastWeekPauses = lastWeekDrafts.filter(d => d.paused).length;
  if (thisWeekPauses > lastWeekPauses) {
    communicationWins.push('You paused more often before sending messages this week.');
  }

  const thisWeekRewrites = thisWeekDrafts.filter(d => d.rewrittenText).length;
  if (thisWeekRewrites > 0) {
    communicationWins.push(`You rewrote ${thisWeekRewrites} message${thisWeekRewrites !== 1 ? 's' : ''} for clarity.`);
  }

  const reflections = thisWeek.filter(e => e.reflection && e.reflection.length > 15).length;
  if (reflections >= 2) {
    awarenessGains.push('Your reflections are getting more thoughtful.');
  }

  if (thisWeek.length >= 5) {
    awarenessGains.push('Checking in most days shows deepening self-awareness.');
  }

  const copingCount = thisWeek.reduce((s, e) => s + (e.checkIn.copingUsed?.length ?? 0), 0);
  if (copingCount >= 3) {
    improvements.push({
      area: 'Active Coping',
      description: `You reached for coping tools ${copingCount} times this week.`,
      icon: '🧰',
    });
  }

  if (graphSummary?.growthSignals) {
    graphSummary.growthSignals
      .filter(g => g.direction === 'improving')
      .slice(0, 2)
      .forEach(g => {
        awarenessGains.push(g.narrative);
      });
  }

  const narrativeParts: string[] = [];
  if (improvements.length > 0) {
    narrativeParts.push(`This week showed signs of growth in ${improvements[0].area.toLowerCase()}.`);
  }
  if (communicationWins.length > 0) {
    narrativeParts.push('Your communication patterns seem to be shifting in a healthier direction.');
  }
  if (awarenessGains.length > 0) {
    narrativeParts.push('Your emotional awareness appears to be deepening.');
  }
  if (narrativeParts.length === 0) {
    narrativeParts.push('Growth often happens quietly. The fact that you are here, reflecting, is meaningful.');
  }

  return {
    improvements,
    awarenessGains,
    communicationWins,
    narrative: narrativeParts.join(' '),
  };
}

export function buildNextWeekFocus(
  thisWeek: JournalEntry[],
  thisWeekDrafts: MessageDraft[],
  _graphSummary: GraphPatternSummary | null,
): NextWeekFocus {
  const avgDistress = thisWeek.length > 0
    ? thisWeek.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / thisWeek.length
    : 0;

  const hasRelTriggers = thisWeek.some(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship')
  );
  const hasAnxiety = thisWeek.some(e =>
    e.checkIn.emotions.some(em =>
      ['Anxious', 'Afraid', 'Overwhelmed', 'Worried'].includes(em.label)
    )
  );
  const hasShame = thisWeek.some(e =>
    e.checkIn.emotions.some(em =>
      ['Shame', 'Guilt', 'Worthless'].includes(em.label)
    )
  );
  const lowPauses = thisWeekDrafts.filter(d => d.paused).length < 2 && thisWeekDrafts.length > 2;

  if (avgDistress >= 6) {
    return {
      suggestedTheme: 'Gentleness with yourself',
      themeReason: 'This was an intense week. Next week, try to meet yourself with extra kindness.',
      skillToPractice: 'Self-soothing',
      skillDescription: 'Choose one soothing activity each day — even something small like a warm drink or a few deep breaths.',
      behavioralShift: 'Notice before reacting',
      shiftDescription: 'When intensity rises, try naming what you feel before taking action.',
    };
  }

  if (hasRelTriggers && lowPauses) {
    return {
      suggestedTheme: 'Mindful communication',
      themeReason: 'Relationship themes were present this week. Slowing down communication may help.',
      skillToPractice: 'Pause and breathe',
      skillDescription: 'Before sending a message that feels urgent, take three slow breaths first.',
      behavioralShift: 'Choose timing intentionally',
      shiftDescription: 'Notice if urgency is driving your replies, and try waiting a few minutes when it does.',
    };
  }

  if (hasShame) {
    return {
      suggestedTheme: 'Self-compassion',
      themeReason: 'Shame was present this week. Practicing self-compassion may help soften its grip.',
      skillToPractice: 'Opposite action for shame',
      skillDescription: 'When shame tells you to hide, try one small act of connection instead.',
      behavioralShift: 'Challenge shame narratives',
      shiftDescription: 'When shame arises, try writing down what it tells you — then ask if that story is fully true.',
    };
  }

  if (hasAnxiety) {
    return {
      suggestedTheme: 'Grounding and presence',
      themeReason: 'Anxiety was active this week. Grounding may help you stay present.',
      skillToPractice: '5-4-3-2-1 grounding',
      skillDescription: 'When anxiety rises, name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.',
      behavioralShift: 'Return to now',
      shiftDescription: 'When your mind races ahead, gently bring attention back to this moment.',
    };
  }

  return {
    suggestedTheme: 'Continuing the momentum',
    themeReason: 'You are building good patterns. Keep showing up for yourself next week.',
    skillToPractice: 'Daily check-in',
    skillDescription: 'Try to check in with yourself at the same time each day to build a rhythm.',
    behavioralShift: 'One intentional pause per day',
    shiftDescription: 'Choose one moment each day to pause, breathe, and notice how you feel.',
  };
}

export function buildOpeningNarrative(
  thisWeek: JournalEntry[],
  lastWeek: JournalEntry[],
  thisWeekDrafts: MessageDraft[],
): string {
  if (thisWeek.length < 2) {
    return 'This week is still unfolding. As you check in more, your weekly reflections will become richer and more personalized.';
  }

  const avgDistress = thisWeek.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / thisWeek.length;
  const topEmotion = getTopItem(thisWeek.flatMap(e => e.checkIn.emotions.map(em => em.label)));
  const checkInCount = thisWeek.length;
  const pauseCount = thisWeekDrafts.filter(d => d.paused).length;
  const rewriteCount = thisWeekDrafts.filter(d => d.rewrittenText).length;
  const hasRelTriggers = thisWeek.some(e => e.checkIn.triggers.some(t => t.category === 'relationship'));
  const managedCount = thisWeek.filter(e => e.outcome === 'managed').length;

  const parts: string[] = [];

  if (avgDistress >= 7) {
    parts.push('This week held a lot of emotional intensity. The fact that you kept showing up through it says something important about your resilience.');
  } else if (avgDistress >= 4) {
    parts.push('This week carried its share of emotional weight, though there were moments of steadiness too.');
  } else if (managedCount > 0 && avgDistress < 4) {
    parts.push('This seems to have been a quieter week — a sign that something may be settling.');
  } else {
    parts.push('This week felt relatively calm. That calm is worth noticing and appreciating.');
  }

  if (topEmotion) {
    parts.push(`${topEmotion} was the emotion that appeared most often.`);
  }

  if (hasRelTriggers && rewriteCount > 0) {
    parts.push(`Relationship themes were present, and you chose to rewrite ${rewriteCount} message${rewriteCount !== 1 ? 's' : ''} before sending — a meaningful act of self-regulation.`);
  } else if (pauseCount > 0) {
    parts.push(`You paused before sending ${pauseCount} message${pauseCount !== 1 ? 's' : ''}, which takes real awareness in activated moments.`);
  }

  parts.push(`You checked in ${checkInCount} time${checkInCount !== 1 ? 's' : ''} this week.`);

  return parts.join(' ');
}

export function buildClosingMessage(
  thisWeek: JournalEntry[],
  growthSignals: GrowthSignalSection,
): string {
  if (thisWeek.length < 2) {
    return 'Your journey is unfolding. Every small check-in builds a deeper understanding of yourself.';
  }

  const hasRelWork = thisWeek.some(e => e.checkIn.triggers.some(t => t.category === 'relationship'));
  const avgDistress = thisWeek.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / thisWeek.length;

  if (avgDistress >= 7 && growthSignals.improvements.length > 0) {
    return 'This was a hard week, and you still found ways to grow through it. That is not nothing — it is courage.';
  }

  if (growthSignals.improvements.length >= 2) {
    return 'This week showed meaningful signs of growth. You are building something real — keep going, even on the days it feels invisible.';
  }

  if (hasRelWork && growthSignals.communicationWins.length > 0) {
    return 'The way you are approaching relationships is shifting. Choosing care over urgency is one of the hardest things to do — and you did it this week.';
  }

  if (growthSignals.communicationWins.length > 0) {
    return 'Your communication patterns are shifting. The effort you are putting in matters more than you might realize right now.';
  }

  if (growthSignals.awarenessGains.length > 0) {
    return 'Your awareness is deepening. Understanding your patterns is one of the most powerful things you can do for yourself.';
  }

  return 'Another week of showing up for yourself. That consistency, even when it feels small, is building something stronger underneath.';
}

export function buildWhatEscalated(
  thisWeek: JournalEntry[],
  thisWeekDrafts: MessageDraft[],
): WhatEscalatedSection {
  const escalationPatterns: string[] = [];

  const highDistressMoments = thisWeek.filter(e => e.checkIn.intensityLevel >= 7).length;
  const struggledOutcomes = thisWeek.filter(e => e.outcome === 'struggled').length;
  const sentWithoutPause = thisWeekDrafts.filter(d => d.sent && !d.paused && !d.rewrittenText).length;
  const madeWorse = thisWeekDrafts.filter(d => d.outcome === 'made_worse').length;

  const missedPauses = sentWithoutPause;

  if (highDistressMoments >= 2) {
    escalationPatterns.push(
      `There were ${highDistressMoments} moments of high distress (7+/10) this week. These peaks may be worth exploring gently.`
    );
  }

  if (struggledOutcomes >= 2) {
    escalationPatterns.push(
      'Several check-ins ended with difficulty managing emotions. This is not failure — it is information about what needs more support.'
    );
  }

  if (sentWithoutPause >= 2) {
    escalationPatterns.push(
      `${sentWithoutPause} message${sentWithoutPause !== 1 ? 's were' : ' was'} sent without pausing or rewriting. Slowing down in those moments may help next time.`
    );
  }

  if (madeWorse > 0) {
    escalationPatterns.push(
      `${madeWorse} communication outcome${madeWorse !== 1 ? 's were' : ' was'} recorded as making things harder. Understanding what happened there could be valuable.`
    );
  }

  const relEscalation = thisWeek.filter(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship') &&
    e.checkIn.intensityLevel >= 6
  ).length;
  if (relEscalation >= 2) {
    escalationPatterns.push(
      'Relationship-triggered distress appeared multiple times at moderate-to-high intensity. This pattern may benefit from the Relationship Copilot.'
    );
  }

  const narrativeParts: string[] = [];
  if (escalationPatterns.length === 0) {
    narrativeParts.push('No major escalation patterns stood out this week. That is a quiet sign of stability.');
  } else {
    narrativeParts.push('Some moments this week were harder than others.');
    if (highDistressMoments > 0) {
      narrativeParts.push('Understanding what drives those peaks — without judgment — can help you prepare for next time.');
    }
  }

  return {
    escalationPatterns,
    missedPauses,
    highDistressMoments,
    narrative: narrativeParts.join(' '),
  };
}

function getTopItem(items: string[]): string | null {
  const counts: Record<string, number> = {};
  items.forEach(item => { counts[item] = (counts[item] || 0) + 1; });
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  return sorted[0]?.[0] ?? null;
}
