import {
  EnhancedMessageOutcome,
  CommunicationTendency,
  GrowthSignal,
  PlaybookEntry,
  WhatHelpedReminder,
} from '@/types/messageOutcome';

export function buildCommunicationTendencies(
  outcomes: EnhancedMessageOutcome[],
): CommunicationTendency[] {
  console.log('[CommProfile] Building tendencies from', outcomes.length, 'outcomes');
  const tendencies: CommunicationTendency[] = [];

  if (outcomes.length < 3) return tendencies;

  const midpoint = Math.floor(outcomes.length / 2);
  const recent = outcomes.slice(0, midpoint);
  const older = outcomes.slice(midpoint);

  const urgencyRecent = recent.filter(o => o.urge === 'explain_myself' || o.urge === 'demand_clarity' || o.urge === 'text_again').length / Math.max(recent.length, 1);
  const urgencyOlder = older.filter(o => o.urge === 'explain_myself' || o.urge === 'demand_clarity' || o.urge === 'text_again').length / Math.max(older.length, 1);
  tendencies.push({
    id: 'urgency',
    label: 'Urgency',
    score: Math.round(urgencyRecent * 100),
    trend: urgencyRecent < urgencyOlder - 0.1 ? 'decreasing' : urgencyRecent > urgencyOlder + 0.1 ? 'increasing' : 'stable',
    description: urgencyRecent > 0.4 ? 'You may move quickly toward pressure when activated.' : 'Your urgency levels seem manageable.',
  });

  const overexplainRecent = recent.filter(o => o.urge === 'explain_myself').length / Math.max(recent.length, 1);
  const overexplainOlder = older.filter(o => o.urge === 'explain_myself').length / Math.max(older.length, 1);
  tendencies.push({
    id: 'overexplaining',
    label: 'Overexplaining',
    score: Math.round(overexplainRecent * 100),
    trend: overexplainRecent < overexplainOlder - 0.1 ? 'decreasing' : overexplainRecent > overexplainOlder + 0.1 ? 'increasing' : 'stable',
    description: overexplainRecent > 0.3 ? 'When hurt, you may try to explain everything. Shorter messages tend to land better.' : 'You seem to keep messages reasonably concise.',
  });

  const reassuranceRecent = recent.filter(o => o.urge === 'ask_reassurance').length / Math.max(recent.length, 1);
  const reassuranceOlder = older.filter(o => o.urge === 'ask_reassurance').length / Math.max(older.length, 1);
  tendencies.push({
    id: 'reassurance_seeking',
    label: 'Reassurance-seeking',
    score: Math.round(reassuranceRecent * 100),
    trend: reassuranceRecent < reassuranceOlder - 0.1 ? 'decreasing' : reassuranceRecent > reassuranceOlder + 0.1 ? 'increasing' : 'stable',
    description: reassuranceRecent > 0.3 ? 'You may seek reassurance when feeling uncertain. This is understandable but can create pressure.' : 'Reassurance-seeking does not appear to be a major pattern.',
  });

  const boundaryRecent = recent.filter(o => o.pathTypeSelected === 'boundary' || o.rewriteSubtype === 'calm_boundary').length / Math.max(recent.length, 1);
  const boundaryOlder = older.filter(o => o.pathTypeSelected === 'boundary' || o.rewriteSubtype === 'calm_boundary').length / Math.max(older.length, 1);
  tendencies.push({
    id: 'boundary_strength',
    label: 'Boundary strength',
    score: Math.round(boundaryRecent * 100),
    trend: boundaryRecent > boundaryOlder + 0.1 ? 'increasing' : boundaryRecent < boundaryOlder - 0.1 ? 'decreasing' : 'stable',
    description: boundaryRecent > 0.2 ? 'You are using boundaries more often. This protects your dignity.' : 'Boundary-setting may be an area to explore more.',
  });

  const pauseRecent = recent.filter(o => o.pauseUsed).length / Math.max(recent.length, 1);
  const pauseOlder = older.filter(o => o.pauseUsed).length / Math.max(older.length, 1);
  tendencies.push({
    id: 'self_regulation',
    label: 'Self-regulation',
    score: Math.round(pauseRecent * 100),
    trend: pauseRecent > pauseOlder + 0.1 ? 'increasing' : pauseRecent < pauseOlder - 0.1 ? 'decreasing' : 'stable',
    description: pauseRecent > 0.3 ? 'You are pausing before reacting more often. This is a strong sign of growth.' : 'Pausing before sending could become a more frequent tool.',
  });

  return tendencies;
}

export function detectGrowthSignals(
  outcomes: EnhancedMessageOutcome[],
): GrowthSignal[] {
  console.log('[CommProfile] Detecting growth signals');
  const signals: GrowthSignal[] = [];

  if (outcomes.length < 5) return signals;

  const recent = outcomes.slice(0, Math.min(outcomes.length, 15));
  const older = outcomes.slice(Math.min(outcomes.length, 15));

  const recentPauses = recent.filter(o => o.pauseUsed).length;
  const olderPauseRate = older.length > 0 ? older.filter(o => o.pauseUsed).length / older.length : 0;
  const recentPauseRate = recent.length > 0 ? recentPauses / recent.length : 0;
  if (recentPauseRate > olderPauseRate + 0.15 && recentPauses >= 2) {
    signals.push({
      id: 'more_pauses',
      label: 'More pauses before reacting',
      description: 'You are pausing before responding more consistently.',
      emoji: '\u23f3',
      firstSeen: recent[recent.length - 1]?.createdAt ?? Date.now(),
      occurrences: recentPauses,
    });
  }

  const recentNotSent = recent.filter(o => o.sentStatus === 'not_sent' || o.sentStatus === 'saved_unsent').length;
  if (recentNotSent >= 3) {
    signals.push({
      id: 'choosing_not_to_send',
      label: 'Choosing not to send',
      description: 'You are choosing not to send impulsive messages more often.',
      emoji: '\ud83d\udee1\ufe0f',
      firstSeen: recent[recent.length - 1]?.createdAt ?? Date.now(),
      occurrences: recentNotSent,
    });
  }

  const recentSecure = recent.filter(o =>
    o.pathTypeSelected === 'secure' || o.rewriteSubtype?.startsWith('calm_')
  ).length;
  if (recentSecure >= 3) {
    signals.push({
      id: 'secure_communication',
      label: 'More secure communication',
      description: 'You are choosing secure, self-respecting responses more often.',
      emoji: '\ud83c\udf3f',
      firstSeen: recent[recent.length - 1]?.createdAt ?? Date.now(),
      occurrences: recentSecure,
    });
  }

  const recentRegrets = recent.filter(o => o.regretReported === true).length;
  const olderRegretRate = older.length > 0 ? older.filter(o => o.regretReported === true).length / older.length : 0.5;
  const recentRegretRate = recent.length > 0 ? recentRegrets / recent.length : 0;
  if (recentRegretRate < olderRegretRate - 0.1 && outcomes.length >= 8) {
    signals.push({
      id: 'fewer_regrets',
      label: 'Fewer regrets',
      description: 'You seem to be making communication choices you feel better about.',
      emoji: '\ud83d\udc9a',
      firstSeen: Date.now(),
      occurrences: recent.length - recentRegrets,
    });
  }

  const recentBoundary = recent.filter(o =>
    o.pathTypeSelected === 'boundary' || o.rewriteSubtype === 'calm_boundary'
  ).length;
  if (recentBoundary >= 2) {
    signals.push({
      id: 'stronger_boundaries',
      label: 'Stronger boundaries',
      description: 'You are protecting your dignity more often.',
      emoji: '\ud83d\udee1\ufe0f',
      firstSeen: recent[recent.length - 1]?.createdAt ?? Date.now(),
      occurrences: recentBoundary,
    });
  }

  return signals;
}

export function generatePlaybook(
  outcomes: EnhancedMessageOutcome[],
): PlaybookEntry[] {
  console.log('[CommProfile] Generating playbook from', outcomes.length, 'outcomes');
  const entries: PlaybookEntry[] = [];

  if (outcomes.length < 5) return entries;

  const sentOutcomes = outcomes.filter(o => o.sentStatus === 'sent_now' || o.sentStatus === 'sent_later');
  const helpedOutcomes = sentOutcomes.filter(o => o.conflictResult === 'helped');

  const styleCounts: Record<string, { total: number; helped: number }> = {};
  helpedOutcomes.forEach(o => {
    const style = o.rewriteSubtype ?? o.pathTypeSelected ?? 'unknown';
    if (!styleCounts[style]) styleCounts[style] = { total: 0, helped: 0 };
    styleCounts[style].helped++;
  });
  sentOutcomes.forEach(o => {
    const style = o.rewriteSubtype ?? o.pathTypeSelected ?? 'unknown';
    if (!styleCounts[style]) styleCounts[style] = { total: 0, helped: 0 };
    styleCounts[style].total++;
  });

  const bestStyle = Object.entries(styleCounts)
    .filter(([, c]) => c.total >= 2)
    .sort((a, b) => (b[1].helped / b[1].total) - (a[1].helped / a[1].total))[0];

  if (bestStyle) {
    const styleLabel = bestStyle[0].replace('calm_', 'calm ').replace('_', ' ');
    entries.push({
      id: 'best_style',
      title: `Best style: ${styleLabel}`,
      description: `The "${styleLabel}" style has worked well for you ${bestStyle[1].helped} out of ${bestStyle[1].total} times.`,
      emoji: '\u2728',
      category: 'best_style',
      confidence: bestStyle[1].total >= 5 ? 'high' : 'medium',
      basedOnOutcomes: bestStyle[1].total,
    });
  }

  const pauseOutcomes = outcomes.filter(o => o.pauseUsed);
  const pauseHelped = pauseOutcomes.filter(o => o.conflictResult === 'helped' || o.regretReported === false);
  if (pauseHelped.length >= 2) {
    entries.push({
      id: 'before_texting',
      title: 'Pause before texting when activated',
      description: `Pausing has led to better outcomes ${pauseHelped.length} times. Even 2 minutes helps.`,
      emoji: '\u23f3',
      category: 'before_texting',
      confidence: pauseHelped.length >= 4 ? 'high' : 'medium',
      basedOnOutcomes: pauseHelped.length,
    });
  }

  const regretOutcomes = outcomes.filter(o => o.regretReported === true);
  const regretEmotions: Record<string, number> = {};
  regretOutcomes.forEach(o => {
    if (o.emotionalState) {
      regretEmotions[o.emotionalState] = (regretEmotions[o.emotionalState] || 0) + 1;
    }
  });
  const topRegretEmotion = Object.entries(regretEmotions).sort((a, b) => b[1] - a[1])[0];
  if (topRegretEmotion && topRegretEmotion[1] >= 2) {
    entries.push({
      id: 'regret_triggers',
      title: `Higher regret when ${topRegretEmotion[0]}`,
      description: `Messages sent while feeling ${topRegretEmotion[0]} have led to regret ${topRegretEmotion[1]} times. Extra care during these moments helps.`,
      emoji: '\u26a0\ufe0f',
      category: 'regret_triggers',
      confidence: topRegretEmotion[1] >= 4 ? 'high' : 'medium',
      basedOnOutcomes: topRegretEmotion[1],
    });
  }

  const lateNightOutcomes = outcomes.filter(o => o.timeOfDay === 'late_night');
  const lateNightRegrets = lateNightOutcomes.filter(o => o.regretReported === true);
  if (lateNightOutcomes.length >= 3 && lateNightRegrets.length / lateNightOutcomes.length > 0.4) {
    entries.push({
      id: 'late_night',
      title: 'Late-night drafts are riskier',
      description: `Messages written late at night have higher regret rates for you. Consider saving them for morning.`,
      emoji: '\ud83c\udf19',
      category: 'do_not_send',
      confidence: lateNightOutcomes.length >= 5 ? 'high' : 'medium',
      basedOnOutcomes: lateNightOutcomes.length,
    });
  }

  const notSentOutcomes = outcomes.filter(o => o.sentStatus === 'not_sent' || o.sentStatus === 'saved_unsent');
  if (notSentOutcomes.length >= 3) {
    entries.push({
      id: 'not_sending_works',
      title: 'Not sending often helps',
      description: `You've chosen not to send ${notSentOutcomes.length} times. This takes real self-awareness.`,
      emoji: '\ud83d\ude0c',
      category: 'do_not_send',
      confidence: notSentOutcomes.length >= 5 ? 'high' : 'medium',
      basedOnOutcomes: notSentOutcomes.length,
    });
  }

  return entries;
}

export function generateWhatHelpedReminder(
  outcomes: EnhancedMessageOutcome[],
  currentEmotionalState: string | null,
  currentUrge: string | null,
): WhatHelpedReminder | null {
  console.log('[CommProfile] Checking for relevant past outcomes');

  if (outcomes.length < 3) return null;

  const similarOutcomes = outcomes.filter(o => {
    const emotionMatch = currentEmotionalState && o.emotionalState === currentEmotionalState;
    const urgeMatch = currentUrge && o.urge === currentUrge;
    return emotionMatch || urgeMatch;
  });

  if (similarOutcomes.length < 2) return null;

  const pauseHelped = similarOutcomes.filter(o => o.pauseUsed && (o.conflictResult === 'helped' || o.regretReported === false));
  if (pauseHelped.length >= 2) {
    return {
      id: `reminder_pause_${currentEmotionalState}`,
      text: `Last time you felt ${currentEmotionalState ?? 'this way'}, waiting before sending reduced regret.`,
      emoji: '\u23f3',
      matchedContext: currentEmotionalState ?? 'similar situation',
      basedOnOutcomes: pauseHelped.length,
    };
  }

  const secureHelped = similarOutcomes.filter(o =>
    (o.pathTypeSelected === 'secure' || o.rewriteSubtype?.startsWith('calm_')) &&
    (o.conflictResult === 'helped' || o.regretReported === false)
  );
  if (secureHelped.length >= 2) {
    return {
      id: `reminder_secure_${currentEmotionalState}`,
      text: `Secure rewrites have helped in similar situations ${secureHelped.length} times.`,
      emoji: '\ud83c\udf3f',
      matchedContext: currentEmotionalState ?? 'similar situation',
      basedOnOutcomes: secureHelped.length,
    };
  }

  const boundaryHelped = similarOutcomes.filter(o =>
    (o.pathTypeSelected === 'boundary' || o.rewriteSubtype === 'calm_boundary') &&
    (o.conflictResult === 'helped' || o.regretReported === false)
  );
  if (boundaryHelped.length >= 2) {
    return {
      id: `reminder_boundary_${currentEmotionalState}`,
      text: `Boundary rewrites worked better than softer ones in similar situations.`,
      emoji: '\ud83d\udee1\ufe0f',
      matchedContext: currentEmotionalState ?? 'similar situation',
      basedOnOutcomes: boundaryHelped.length,
    };
  }

  const notSentRelieved = similarOutcomes.filter(o =>
    (o.sentStatus === 'not_sent' || o.sentStatus === 'saved_unsent')
  );
  if (notSentRelieved.length >= 2) {
    return {
      id: `reminder_not_send_${currentEmotionalState}`,
      text: `You often regret messages sent from this emotional state. Consider pausing.`,
      emoji: '\ud83d\ude0c',
      matchedContext: currentEmotionalState ?? 'similar situation',
      basedOnOutcomes: notSentRelieved.length,
    };
  }

  return null;
}
