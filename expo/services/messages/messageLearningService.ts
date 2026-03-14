import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MessageOutcomeRecord,
  CommunicationPattern,
  CommunicationInsight,
} from '@/types/messageOutcome';
import { MessageDraft } from '@/types';

const INSIGHTS_KEY = 'communication_insights';

export function analyzeCommunicationPatterns(
  outcomes: MessageOutcomeRecord[],
  drafts: MessageDraft[],
): CommunicationPattern[] {
  console.log('[MessageLearning] Analyzing patterns from', outcomes.length, 'outcomes');
  const patterns: CommunicationPattern[] = [];

  const sentCount = outcomes.filter(o => o.didSend).length;
  const notSentCount = outcomes.filter(o => !o.didSend).length;
  const regretCount = outcomes.filter(o => o.didRegret).length;
  const _helpedCount = outcomes.filter(o => o.didHelp).length;
  const waitHelpedCount = outcomes.filter(o => o.didWaitHelp).length;
  const rewriteHelpedCount = outcomes.filter(o => o.didRewriteHelp).length;

  if (outcomes.length >= 3) {
    const regretRate = regretCount / Math.max(sentCount, 1);
    patterns.push({
      id: 'regret_rate',
      label: 'Message regret',
      description: regretRate > 0.3
        ? 'You tend to regret messages when sent quickly. Pausing helps.'
        : 'You have a good track record of sending messages you feel okay about.',
      frequency: regretCount,
      trend: regretRate > 0.3 ? 'worsening' : 'stable',
      relatedEmotion: 'anxious',
    });
  }

  if (waitHelpedCount >= 2) {
    patterns.push({
      id: 'pause_effectiveness',
      label: 'Pause effectiveness',
      description: 'Pausing before responding has helped you ' + waitHelpedCount + ' times.',
      frequency: waitHelpedCount,
      trend: 'improving',
      relatedEmotion: 'calm_unsure',
    });
  }

  if (rewriteHelpedCount >= 2) {
    patterns.push({
      id: 'rewrite_effectiveness',
      label: 'Rewrite effectiveness',
      description: 'Rewriting messages has been helpful for you ' + rewriteHelpedCount + ' times.',
      frequency: rewriteHelpedCount,
      trend: 'improving',
      relatedEmotion: 'angry',
    });
  }

  if (notSentCount >= 2) {
    const relievedCount = outcomes.filter(o => o.outcome === 'not_sent_relieved').length;
    patterns.push({
      id: 'not_sending',
      label: 'Choosing not to send',
      description: relievedCount > notSentCount / 2
        ? 'Not sending has often brought you relief. Trust that instinct.'
        : 'You sometimes choose not to send — that takes awareness.',
      frequency: notSentCount,
      trend: 'stable',
      relatedEmotion: 'overwhelmed',
    });
  }

  const emotionCounts: Record<string, { total: number; regretted: number }> = {};
  outcomes.forEach(o => {
    if (o.emotionalState) {
      if (!emotionCounts[o.emotionalState]) {
        emotionCounts[o.emotionalState] = { total: 0, regretted: 0 };
      }
      emotionCounts[o.emotionalState].total++;
      if (o.didRegret) emotionCounts[o.emotionalState].regretted++;
    }
  });

  Object.entries(emotionCounts).forEach(([emotion, counts]) => {
    if (counts.total >= 3 && counts.regretted / counts.total > 0.4) {
      patterns.push({
        id: `emotion_${emotion}`,
        label: `Messages when ${emotion}`,
        description: `When feeling ${emotion}, you tend to send messages you later regret. Extra care during these moments helps.`,
        frequency: counts.total,
        trend: 'worsening',
        relatedEmotion: emotion,
      });
    }
  });

  const rewriteStyles: Record<string, number> = {};
  drafts.forEach(d => {
    if (d.rewriteType && d.outcome === 'helped') {
      rewriteStyles[d.rewriteType] = (rewriteStyles[d.rewriteType] || 0) + 1;
    }
  });

  const bestStyle = Object.entries(rewriteStyles).sort((a, b) => b[1] - a[1])[0];
  if (bestStyle && bestStyle[1] >= 2) {
    patterns.push({
      id: 'best_rewrite_style',
      label: `Best rewrite style: ${bestStyle[0]}`,
      description: `The "${bestStyle[0]}" style has worked well for you ${bestStyle[1]} times.`,
      frequency: bestStyle[1],
      trend: 'improving',
      relatedEmotion: 'calm_unsure',
    });
  }

  return patterns;
}

export function generateCommunicationInsights(
  outcomes: MessageOutcomeRecord[],
  drafts: MessageDraft[],
): CommunicationInsight[] {
  console.log('[MessageLearning] Generating insights');
  const insights: CommunicationInsight[] = [];
  const now = Date.now();

  const recentOutcomes = outcomes.filter(o => now - o.timestamp < 30 * 24 * 60 * 60 * 1000);

  if (recentOutcomes.length === 0) {
    insights.push({
      id: 'getting_started',
      text: 'Use the message tool a few times to unlock personalized communication insights.',
      category: 'suggestion',
      emoji: '🌱',
      timestamp: now,
    });
    return insights;
  }

  const pauseHelped = recentOutcomes.filter(o => o.didWaitHelp).length;
  if (pauseHelped >= 2) {
    insights.push({
      id: 'pause_insight',
      text: 'Pausing before responding seems to reduce regret for you.',
      category: 'learning',
      emoji: '⏳',
      timestamp: now,
    });
  }

  const secureHelpedCount = drafts.filter(d => d.rewriteType === 'secure' && d.outcome === 'helped').length;
  const softHelpedCount = drafts.filter(d => d.rewriteType === 'softer' && d.outcome === 'helped').length;
  if (secureHelpedCount > softHelpedCount && secureHelpedCount >= 2) {
    insights.push({
      id: 'secure_vs_soft',
      text: 'Secure rewrites seem more effective for you than very soft ones.',
      category: 'pattern',
      emoji: '🌿',
      timestamp: now,
    });
  }

  const angryRegrets = recentOutcomes.filter(o => o.emotionalState === 'angry' && o.didRegret).length;
  if (angryRegrets >= 2) {
    insights.push({
      id: 'angry_pattern',
      text: 'When you feel angry, messages sent quickly often lead to regret. Extra pause time helps.',
      category: 'pattern',
      emoji: '🔥',
      timestamp: now,
    });
  }

  const rejectedMessages = recentOutcomes.filter(o => o.emotionalState === 'rejected').length;
  if (rejectedMessages >= 3) {
    insights.push({
      id: 'rejection_explain',
      text: 'You often want to explain everything when you feel rejected. Shorter messages tend to land better.',
      category: 'pattern',
      emoji: '💔',
      timestamp: now,
    });
  }

  const notSentRelieved = recentOutcomes.filter(o => o.outcome === 'not_sent_relieved').length;
  if (notSentRelieved >= 2) {
    insights.push({
      id: 'not_sending_relief',
      text: 'Not sending has brought you relief multiple times. Trust that wisdom.',
      category: 'strength',
      emoji: '😌',
      timestamp: now,
    });
  }

  const rewriteThenSent = recentOutcomes.filter(o => o.outcome === 'rewrote_then_sent' && o.didHelp).length;
  if (rewriteThenSent >= 2) {
    insights.push({
      id: 'rewrite_works',
      text: 'Rewriting before sending tends to lead to better outcomes for you.',
      category: 'learning',
      emoji: '✏️',
      timestamp: now,
    });
  }

  const anxiousMessages = recentOutcomes.filter(o => o.emotionalState === 'anxious').length;
  if (anxiousMessages >= 3) {
    insights.push({
      id: 'anxious_drafts',
      text: 'Communication uncertainty often leads to anxious drafts. The secure rewrite style may help.',
      category: 'suggestion',
      emoji: '😰',
      timestamp: now,
    });
  }

  return insights;
}

export async function saveInsights(insights: CommunicationInsight[]): Promise<void> {
  try {
    await AsyncStorage.setItem(INSIGHTS_KEY, JSON.stringify(insights));
  } catch (err) {
    console.error('[MessageLearning] Error saving insights:', err);
  }
}

export async function getStoredInsights(): Promise<CommunicationInsight[]> {
  try {
    const stored = await AsyncStorage.getItem(INSIGHTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('[MessageLearning] Error loading insights:', err);
    return [];
  }
}
