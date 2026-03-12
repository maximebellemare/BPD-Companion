import { MemoryProfile } from '@/types/memory';
import { GraphPatternSummary, TriggerChain, CalmingPattern } from '@/types/memoryGraph';
import {
  CoachingNudge,
  CoachingInsight,
  CoachingCategory,
  CoachingSuggestedAction,
  CoachingWin,
} from '@/types/coaching';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pickAction(category: CoachingCategory): CoachingSuggestedAction {
  const actions: Record<CoachingCategory, CoachingSuggestedAction> = {
    communication: { label: 'Open Message Tool', route: '/messages', icon: 'message-square' },
    emotional_regulation: { label: 'Try Grounding', route: '/exercise?id=c1', icon: 'wind' },
    reassurance_seeking: { label: 'Pause & Reflect', route: '/exercise?id=c5', icon: 'pause' },
    conflict_recovery: { label: 'Guided Regulation', route: '/guided-regulation', icon: 'zap' },
    pause_training: { label: 'Practice Pausing', route: '/exercise?id=c1', icon: 'timer' },
    self_soothing: { label: 'Self-Soothe', route: '/exercise?id=c3', icon: 'heart' },
    shame_recovery: { label: 'Ground Yourself', route: '/exercise?id=c2', icon: 'sparkles' },
  };
  return actions[category];
}

export function buildCommunicationNudges(
  profile: MemoryProfile,
  graphSummary: GraphPatternSummary | null,
): CoachingNudge[] {
  const nudges: CoachingNudge[] = [];
  const { messageUsage } = profile;

  if (messageUsage.totalRewrites > 2) {
    nudges.push({
      id: makeId('comm-rewrite'),
      category: 'communication',
      title: 'A pattern you might notice',
      message: `You've rewritten ${messageUsage.totalRewrites} messages recently. This suggests you're already building the habit of pausing before communicating.`,
      supportingDetail: 'One small shift: try reading your message aloud before deciding on the rewrite. Sometimes hearing it changes how it feels.',
      suggestedAction: pickAction('communication'),
      intensity: 'gentle',
      relevanceScore: 0.7,
      basedOn: ['message_rewrites'],
      createdAt: Date.now(),
    });
  }

  if (messageUsage.totalPauses > 0 && messageUsage.pauseSuccessRate > 40) {
    nudges.push({
      id: makeId('comm-pause'),
      category: 'pause_training',
      title: 'Pausing is working for you',
      message: `When you pause before sending, it seems to help — you chose not to send ${messageUsage.notSentAfterPause} time${messageUsage.notSentAfterPause !== 1 ? 's' : ''} after pausing. That's real emotional regulation.`,
      suggestedAction: pickAction('pause_training'),
      intensity: 'gentle',
      relevanceScore: 0.8,
      basedOn: ['message_pauses'],
      createdAt: Date.now(),
    });
  }

  const relChains = graphSummary?.relationshipPatterns ?? [];
  if (relChains.length > 0) {
    const top = relChains[0];
    nudges.push({
      id: makeId('comm-rel'),
      category: 'communication',
      title: 'Before you respond',
      message: `When ${top.situation.toLowerCase()} happens, ${top.emotionalResponse.toLowerCase()} often follows. A 2-minute pause may help you respond from a calmer place.`,
      supportingDetail: 'You don\'t have to act on the first feeling. The second wave is usually calmer.',
      suggestedAction: pickAction('communication'),
      intensity: 'moderate',
      relevanceScore: 0.75,
      basedOn: ['relationship_patterns'],
      createdAt: Date.now(),
    });
  }

  return nudges;
}

export function buildRegulationNudges(
  profile: MemoryProfile,
  graphSummary: GraphPatternSummary | null,
): CoachingNudge[] {
  const nudges: CoachingNudge[] = [];

  if (profile.intensityTrend === 'rising') {
    nudges.push({
      id: makeId('reg-rising'),
      category: 'emotional_regulation',
      title: 'Intensity has been higher lately',
      message: 'Your recent check-ins suggest things have felt more intense. Being aware of this is already a meaningful step.',
      supportingDetail: 'On days like this, even one grounding exercise before bed may help reset the next day.',
      suggestedAction: pickAction('emotional_regulation'),
      intensity: 'moderate',
      relevanceScore: 0.85,
      basedOn: ['intensity_trend'],
      createdAt: Date.now(),
    });
  }

  if (profile.intensityTrend === 'falling') {
    nudges.push({
      id: makeId('reg-falling'),
      category: 'emotional_regulation',
      title: 'Your intensity is easing',
      message: 'Your average distress has been trending downward. Whatever you\'re doing seems to be helping — keep it up.',
      intensity: 'gentle',
      relevanceScore: 0.6,
      basedOn: ['intensity_trend'],
      createdAt: Date.now(),
    });
  }

  const calmingPatterns = graphSummary?.mostEffectiveCalming ?? [];
  if (calmingPatterns.length > 0) {
    const best = calmingPatterns[0];
    nudges.push({
      id: makeId('reg-coping'),
      category: 'emotional_regulation',
      title: 'What seems to help most',
      message: `${best.copingTool} appears to be especially helpful when you feel ${best.emotion.toLowerCase()}.`,
      supportingDetail: `You've used it ${best.timesUsed} time${best.timesUsed !== 1 ? 's' : ''}. Leaning into what works is a form of self-knowledge.`,
      suggestedAction: pickAction('emotional_regulation'),
      intensity: 'gentle',
      relevanceScore: 0.7,
      basedOn: ['calming_patterns'],
      createdAt: Date.now(),
    });
  }

  return nudges;
}

export function buildReassuranceNudges(
  profile: MemoryProfile,
  graphSummary: GraphPatternSummary | null,
): CoachingNudge[] {
  const nudges: CoachingNudge[] = [];

  const hasReassuranceTrigger = profile.topTriggers.some(
    t => t.label.toLowerCase().includes('uncertain') ||
      t.label.toLowerCase().includes('no reply') ||
      t.label.toLowerCase().includes('silence') ||
      t.label.toLowerCase().includes('ignored')
  );

  const hasReassuranceUrge = profile.topUrges.some(
    u => u.label.toLowerCase().includes('text') ||
      u.label.toLowerCase().includes('reach out') ||
      u.label.toLowerCase().includes('reassurance') ||
      u.label.toLowerCase().includes('check')
  );

  if (hasReassuranceTrigger || hasReassuranceUrge) {
    nudges.push({
      id: makeId('reassure-comm'),
      category: 'reassurance_seeking',
      title: 'When uncertainty feels urgent',
      message: 'Communication uncertainty often triggers the urge to reach out quickly. A short pause may help you choose a response that feels more grounded.',
      supportingDetail: 'Try this: set a 2-minute timer. If the urge still feels strong after, you can act — but from a calmer place.',
      suggestedAction: pickAction('reassurance_seeking'),
      intensity: 'moderate',
      relevanceScore: 0.85,
      basedOn: ['trigger_patterns', 'urge_patterns'],
      createdAt: Date.now(),
    });
  }

  const triggerChains = graphSummary?.topTriggerChains ?? [];
  const abandonmentChain = triggerChains.find(
    tc => tc.trigger.label.toLowerCase().includes('abandon') ||
      tc.trigger.label.toLowerCase().includes('reject') ||
      tc.trigger.label.toLowerCase().includes('left out')
  );

  if (abandonmentChain) {
    const emotions = abandonmentChain.emotions.slice(0, 2).map(e => e.label.toLowerCase());
    const copingTools = abandonmentChain.copingTools.slice(0, 1).map(c => c.label);

    nudges.push({
      id: makeId('reassure-abandon'),
      category: 'reassurance_seeking',
      title: 'When abandonment fear rises',
      message: `"${abandonmentChain.trigger.label}" tends to bring up ${emotions.join(' and ')}. ${copingTools.length > 0 ? `${copingTools[0]} may help in those moments.` : 'A grounding exercise may help before acting.'}`,
      suggestedAction: pickAction('reassurance_seeking'),
      intensity: 'moderate',
      relevanceScore: 0.9,
      basedOn: ['trigger_chains'],
      createdAt: Date.now(),
    });
  }

  return nudges;
}

export function buildShameNudges(profile: MemoryProfile, _graphSummary: GraphPatternSummary | null): CoachingNudge[] {
  const nudges: CoachingNudge[] = [];

  const hasShame = profile.topEmotions.some(
    e => e.label.toLowerCase().includes('shame') ||
      e.label.toLowerCase().includes('guilt') ||
      e.label.toLowerCase().includes('worthless')
  );

  if (hasShame) {
    nudges.push({
      id: makeId('shame-ground'),
      category: 'shame_recovery',
      title: 'When shame feels heavy',
      message: 'Shame often makes you want to withdraw or hide. A short grounding step may make it easier to respond with more clarity instead of disappearing.',
      supportingDetail: 'Shame tells you something is wrong with you. That\'s the emotion talking, not the truth.',
      suggestedAction: pickAction('shame_recovery'),
      intensity: 'gentle',
      relevanceScore: 0.8,
      basedOn: ['emotion_patterns'],
      createdAt: Date.now(),
    });
  }

  const hasConflictTrigger = profile.topTriggers.some(
    t => t.label.toLowerCase().includes('conflict') ||
      t.label.toLowerCase().includes('argument') ||
      t.label.toLowerCase().includes('fight')
  );

  if (hasConflictTrigger && hasShame) {
    nudges.push({
      id: makeId('shame-conflict'),
      category: 'conflict_recovery',
      title: 'After conflict',
      message: 'Conflict seems to bring up shame for you. That\'s a very common pattern with BPD. Separating what happened from how you feel about yourself may help.',
      suggestedAction: pickAction('conflict_recovery'),
      intensity: 'moderate',
      relevanceScore: 0.85,
      basedOn: ['trigger_patterns', 'emotion_patterns'],
      createdAt: Date.now(),
    });
  }

  return nudges;
}

export function buildSelfSoothingNudges(
  profile: MemoryProfile,
  _graphSummary: GraphPatternSummary | null,
): CoachingNudge[] {
  const nudges: CoachingNudge[] = [];

  if (profile.averageIntensity >= 6 && profile.copingToolsUsed.length > 0) {
    nudges.push({
      id: makeId('soothe-high'),
      category: 'self_soothing',
      title: 'Your calming toolkit',
      message: `When intensity is high, "${profile.copingToolsUsed[0].label}" has been your most-used tool. Your patterns suggest it may work best in the 6–7 intensity range.`,
      supportingDetail: 'After intensity peaks, journaling may help process what happened. Different tools for different moments.',
      suggestedAction: pickAction('self_soothing'),
      intensity: 'gentle',
      relevanceScore: 0.7,
      basedOn: ['coping_usage', 'intensity_levels'],
      createdAt: Date.now(),
    });
  }

  return nudges;
}

export function buildCoachingInsights(
  profile: MemoryProfile,
  graphSummary: GraphPatternSummary | null,
): CoachingInsight[] {
  const insights: CoachingInsight[] = [];

  const triggerChains = graphSummary?.topTriggerChains ?? [];
  triggerChains.slice(0, 3).forEach((chain: TriggerChain) => {
    const emotionLabels = chain.emotions.slice(0, 2).map(e => e.label.toLowerCase());
    const copingLabels = chain.copingTools.slice(0, 1).map(c => c.label);

    insights.push({
      id: makeId('insight-chain'),
      pattern: `${chain.trigger.label} → ${emotionLabels.join(', ')}`,
      observation: `When "${chain.trigger.label}" happens, ${emotionLabels.join(' and ')} often follow.`,
      suggestion: copingLabels.length > 0
        ? `${copingLabels[0]} may help in these moments.`
        : 'A brief grounding pause may help interrupt the cycle.',
      category: 'emotional_regulation',
      confidence: chain.occurrences >= 5 ? 'high' : chain.occurrences >= 3 ? 'medium' : 'low',
    });
  });

  if (profile.messageUsage.totalPauses > 3 && profile.messageUsage.pauseSuccessRate > 50) {
    insights.push({
      id: makeId('insight-pause'),
      pattern: 'Pause → Calmer response',
      observation: 'Pausing before sending seems to consistently help you make calmer choices.',
      suggestion: 'Consider making the pause a default habit, even when urgency feels low.',
      category: 'pause_training',
      confidence: 'high',
    });
  }

  const calmingPatterns = graphSummary?.mostEffectiveCalming ?? [];
  calmingPatterns.slice(0, 2).forEach((cp: CalmingPattern) => {
    insights.push({
      id: makeId('insight-calming'),
      pattern: `${cp.emotion} → ${cp.copingTool}`,
      observation: cp.narrative,
      suggestion: `Keep ${cp.copingTool.toLowerCase()} easily accessible for moments of ${cp.emotion.toLowerCase()}.`,
      category: 'self_soothing',
      confidence: cp.timesUsed >= 4 ? 'high' : 'medium',
    });
  });

  return insights;
}

export function buildCoachingWins(
  profile: MemoryProfile,
  graphSummary: GraphPatternSummary | null,
): CoachingWin[] {
  const wins: CoachingWin[] = [];

  if (profile.intensityTrend === 'falling') {
    wins.push({
      id: makeId('win-intensity'),
      description: 'Your average distress intensity is trending downward.',
      metric: 'distress_trend',
      changeDirection: 'positive',
      category: 'emotional_regulation',
    });
  }

  if (profile.messageUsage.totalPauses > 0) {
    wins.push({
      id: makeId('win-pause'),
      description: `You've paused before reacting ${profile.messageUsage.totalPauses} time${profile.messageUsage.totalPauses !== 1 ? 's' : ''}. That takes real strength.`,
      metric: 'pause_count',
      changeDirection: 'positive',
      category: 'pause_training',
    });
  }

  if (profile.copingSuccessRate >= 50) {
    wins.push({
      id: makeId('win-coping'),
      description: 'You\'re managing emotions effectively more often than not.',
      metric: 'coping_success',
      changeDirection: 'positive',
      category: 'emotional_regulation',
    });
  }

  if (profile.messageUsage.totalRewrites > 3) {
    wins.push({
      id: makeId('win-rewrite'),
      description: 'You\'re consistently choosing to rewrite messages before sending. That\'s mindful communication.',
      metric: 'rewrite_count',
      changeDirection: 'positive',
      category: 'communication',
    });
  }

  const growthSignals = graphSummary?.growthSignals ?? [];
  growthSignals.filter(g => g.direction === 'improving').forEach(g => {
    wins.push({
      id: makeId('win-growth'),
      description: g.narrative,
      metric: g.metric,
      changeDirection: 'positive',
      category: 'emotional_regulation',
    });
  });

  return wins;
}

export function buildMessageCoachingNudge(
  profile: MemoryProfile,
  _graphSummary: GraphPatternSummary | null,
): CoachingNudge | null {
  const hasRelTrigger = profile.topTriggers.some(t =>
    t.label.toLowerCase().includes('abandon') ||
    t.label.toLowerCase().includes('reject') ||
    t.label.toLowerCase().includes('uncertain') ||
    t.label.toLowerCase().includes('ignored')
  );

  if (hasRelTrigger && profile.messageUsage.totalRewrites > 0) {
    return {
      id: makeId('msg-nudge'),
      category: 'communication',
      title: 'Before you write',
      message: 'You often use message support when feeling emotionally activated. That may be a strong moment to slow down and choose a secure tone.',
      suggestedAction: pickAction('communication'),
      intensity: 'gentle',
      relevanceScore: 0.8,
      basedOn: ['trigger_patterns', 'message_usage'],
      createdAt: Date.now(),
    };
  }

  if (profile.messageUsage.totalPauses > 0) {
    return {
      id: makeId('msg-pause-nudge'),
      category: 'pause_training',
      title: 'A gentle reminder',
      message: 'Pausing has helped you before. Consider taking a breath before writing this message.',
      suggestedAction: pickAction('pause_training'),
      intensity: 'gentle',
      relevanceScore: 0.6,
      basedOn: ['pause_history'],
      createdAt: Date.now(),
    };
  }

  return null;
}
