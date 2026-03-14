import {
  EnhancedMessageOutcome,
  CommunicationInsight,
} from '@/types/messageOutcome';

export function generateEnhancedInsights(
  outcomes: EnhancedMessageOutcome[],
): CommunicationInsight[] {
  console.log('[EnhancedLearning] Generating insights from', outcomes.length, 'outcomes');
  const insights: CommunicationInsight[] = [];
  const now = Date.now();

  const recent = outcomes.filter(o => now - o.createdAt < 30 * 24 * 60 * 60 * 1000);

  if (recent.length < 3) {
    insights.push({
      id: 'getting_started',
      text: 'Use the message tool a few more times to unlock personalized communication insights.',
      category: 'suggestion',
      emoji: '\ud83c\udf31',
      timestamp: now,
      priority: 0,
    });
    return insights;
  }

  const pauseOutcomes = recent.filter(o => o.pauseUsed);
  const pauseHelpedCount = pauseOutcomes.filter(o =>
    o.conflictResult === 'helped' || o.regretReported === false
  ).length;
  if (pauseHelpedCount >= 2) {
    insights.push({
      id: 'pause_reduces_regret',
      text: `Pausing before responding seems to reduce regret for you. It has helped ${pauseHelpedCount} times recently.`,
      category: 'learning',
      emoji: '\u23f3',
      timestamp: now,
      priority: 3,
    });
  }

  const secureUsed = recent.filter(o =>
    o.pathTypeSelected === 'secure' || o.rewriteSubtype?.startsWith('calm_')
  );
  const secureHelped = secureUsed.filter(o =>
    o.conflictResult === 'helped' || o.regretReported === false
  );
  const softUsed = recent.filter(o =>
    o.pathTypeSelected === 'soft' || o.rewriteSubtype === 'softer'
  );
  const softHelped = softUsed.filter(o =>
    o.conflictResult === 'helped' || o.regretReported === false
  );
  if (secureHelped.length > softHelped.length && secureHelped.length >= 2) {
    insights.push({
      id: 'secure_vs_soft',
      text: 'Secure rewrites seem more effective for you than very soft ones.',
      category: 'pattern',
      emoji: '\ud83c\udf3f',
      timestamp: now,
      priority: 4,
    });
  }

  const angryOutcomes = recent.filter(o => o.emotionalState === 'angry');
  const angryRegrets = angryOutcomes.filter(o => o.regretReported === true);
  if (angryRegrets.length >= 2) {
    insights.push({
      id: 'angry_regret_pattern',
      text: 'When you feel angry, messages sent quickly often lead to regret. Extra pause time helps.',
      category: 'pattern',
      emoji: '\ud83d\udd25',
      timestamp: now,
      priority: 5,
    });
  }

  const rejectedOutcomes = recent.filter(o => o.emotionalState === 'rejected');
  const rejectedOverexplain = rejectedOutcomes.filter(o => o.urge === 'explain_myself');
  if (rejectedOverexplain.length >= 3) {
    insights.push({
      id: 'rejection_overexplain',
      text: 'You often want to explain everything when you feel rejected. Shorter messages tend to land better.',
      category: 'pattern',
      emoji: '\ud83d\udc94',
      timestamp: now,
      priority: 4,
    });
  }

  const notSentRelieved = recent.filter(o =>
    (o.sentStatus === 'not_sent' || o.sentStatus === 'saved_unsent')
  );
  if (notSentRelieved.length >= 2) {
    insights.push({
      id: 'not_sending_relief',
      text: `Not sending has been a conscious choice ${notSentRelieved.length} times. Trust that wisdom.`,
      category: 'strength',
      emoji: '\ud83d\ude0c',
      timestamp: now,
      priority: 3,
    });
  }

  const lateNight = recent.filter(o => o.timeOfDay === 'late_night');
  const lateNightRegrets = lateNight.filter(o => o.regretReported === true);
  if (lateNight.length >= 3 && lateNightRegrets.length / lateNight.length > 0.4) {
    insights.push({
      id: 'late_night_risk',
      text: 'Late-night message drafts may be more emotionally risky for you. Consider saving them for morning.',
      category: 'pattern',
      emoji: '\ud83c\udf19',
      timestamp: now,
      priority: 5,
    });
  }

  const anxiousOutcomes = recent.filter(o => o.emotionalState === 'anxious');
  if (anxiousOutcomes.length >= 3) {
    insights.push({
      id: 'anxious_drafts',
      text: 'Communication uncertainty often leads to anxious drafts. The secure rewrite style may help.',
      category: 'suggestion',
      emoji: '\ud83d\ude30',
      timestamp: now,
      priority: 3,
    });
  }

  const boundaryOutcomes = recent.filter(o =>
    o.pathTypeSelected === 'boundary' || o.rewriteSubtype === 'calm_boundary'
  );
  const boundaryHelped = boundaryOutcomes.filter(o =>
    o.conflictResult === 'helped' || o.regretReported === false
  );
  if (boundaryHelped.length >= 2) {
    insights.push({
      id: 'boundary_effective',
      text: `Boundary rewrites may protect your dignity better in unclear situations. They've helped ${boundaryHelped.length} times.`,
      category: 'learning',
      emoji: '\ud83d\udee1\ufe0f',
      timestamp: now,
      priority: 4,
    });
  }

  const rewriteThenSent = recent.filter(o =>
    o.rewrittenDraftUsed && (o.sentStatus === 'sent_now' || o.sentStatus === 'sent_later')
  );
  const rewriteHelped = rewriteThenSent.filter(o =>
    o.conflictResult === 'helped' || o.regretReported === false
  );
  if (rewriteHelped.length >= 2) {
    insights.push({
      id: 'rewrite_works',
      text: 'Rewriting before sending tends to lead to better outcomes for you.',
      category: 'learning',
      emoji: '\u270f\ufe0f',
      timestamp: now,
      priority: 3,
    });
  }

  const allRegrets = recent.filter(o => o.regretReported === true);
  const olderOutcomes = outcomes.filter(o =>
    now - o.createdAt >= 30 * 24 * 60 * 60 * 1000 &&
    now - o.createdAt < 60 * 24 * 60 * 60 * 1000
  );
  const olderRegretRate = olderOutcomes.length > 0
    ? olderOutcomes.filter(o => o.regretReported === true).length / olderOutcomes.length
    : 0.5;
  const recentRegretRate = recent.length > 0 ? allRegrets.length / recent.length : 0;
  if (recentRegretRate < olderRegretRate - 0.15 && recent.length >= 5 && olderOutcomes.length >= 3) {
    insights.push({
      id: 'regret_decreasing',
      text: 'Your regret rate seems to be decreasing. You are making communication choices you feel better about.',
      category: 'growth',
      emoji: '\ud83d\udcaa',
      timestamp: now,
      priority: 5,
    });
  }

  const secureCount = recent.filter(o =>
    o.pathTypeSelected === 'secure' || o.rewriteSubtype?.startsWith('calm_')
  ).length;
  if (secureCount >= 4 && secureCount / recent.length > 0.3) {
    insights.push({
      id: 'secure_becoming_default',
      text: 'Secure communication seems to be becoming your natural style. This is a strong growth signal.',
      category: 'growth',
      emoji: '\ud83c\udf1f',
      timestamp: now,
      priority: 5,
    });
  }

  return insights.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export function getTopInsightsForHome(
  outcomes: EnhancedMessageOutcome[],
  limit: number = 2,
): CommunicationInsight[] {
  const allInsights = generateEnhancedInsights(outcomes);
  return allInsights.slice(0, limit);
}
