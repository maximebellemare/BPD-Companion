import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SecureRewriteSession,
  SecureRewriteSessionOutcome,
  SecureSubtype,
} from '@/types/secureRewrite';

const SESSIONS_KEY = 'secure_rewrite_sessions';

export async function saveSecureSession(session: SecureRewriteSession): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(SESSIONS_KEY);
    const sessions: SecureRewriteSession[] = stored ? JSON.parse(stored) : [];
    sessions.unshift(session);
    const trimmed = sessions.slice(0, 200);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
    console.log('[SecureOutcome] Saved session:', session.id);
  } catch (err) {
    console.error('[SecureOutcome] Error saving session:', err);
  }
}

export async function getSecureSessions(): Promise<SecureRewriteSession[]> {
  try {
    const stored = await AsyncStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('[SecureOutcome] Error loading sessions:', err);
    return [];
  }
}

export async function updateSessionOutcome(
  sessionId: string,
  outcome: SecureRewriteSessionOutcome,
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(SESSIONS_KEY);
    const sessions: SecureRewriteSession[] = stored ? JSON.parse(stored) : [];
    const updated = sessions.map(s =>
      s.id === sessionId ? { ...s, outcome } : s
    );
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    console.log('[SecureOutcome] Updated outcome for:', sessionId, outcome);
  } catch (err) {
    console.error('[SecureOutcome] Error updating outcome:', err);
  }
}

export interface SecureRewriteInsight {
  id: string;
  text: string;
  emoji: string;
  category: 'pattern' | 'strength' | 'suggestion';
}

export function generateSecureOutcomeInsights(
  sessions: SecureRewriteSession[],
): SecureRewriteInsight[] {
  console.log('[SecureOutcome] Generating insights from', sessions.length, 'sessions');
  const insights: SecureRewriteInsight[] = [];

  const recent = sessions.filter(s => Date.now() - s.timestamp < 30 * 24 * 60 * 60 * 1000);

  if (recent.length < 3) {
    return [{
      id: 'getting_started',
      text: 'Use the secure rewrite a few more times to unlock insights about your communication patterns.',
      emoji: '🌱',
      category: 'suggestion',
    }];
  }

  const subtypeCounts: Partial<Record<SecureSubtype, { total: number; helped: number }>> = {};
  recent.forEach(s => {
    if (s.selectedSubtype) {
      if (!subtypeCounts[s.selectedSubtype]) {
        subtypeCounts[s.selectedSubtype] = { total: 0, helped: 0 };
      }
      subtypeCounts[s.selectedSubtype]!.total++;
      if (s.outcome === 'sent_helped') {
        subtypeCounts[s.selectedSubtype]!.helped++;
      }
    }
  });

  const bestSubtype = Object.entries(subtypeCounts)
    .filter(([, counts]) => counts.total >= 2)
    .sort((a, b) => (b[1].helped / b[1].total) - (a[1].helped / a[1].total))[0];

  if (bestSubtype) {
    const [subtype, counts] = bestSubtype;
    insights.push({
      id: 'best_subtype',
      text: `The "${subtype.replace('calm_', 'calm ')}" style has worked well for you ${counts.helped} times. It seems to match your communication needs.`,
      emoji: '✨',
      category: 'pattern',
    });
  }

  const helpedCount = recent.filter(s => s.outcome === 'sent_helped').length;
  const sentCount = recent.filter(s => s.outcome?.startsWith('sent')).length;
  if (sentCount >= 3 && helpedCount / sentCount >= 0.6) {
    insights.push({
      id: 'secure_effective',
      text: 'Secure rewrites have led to positive outcomes most of the time. This approach seems to work well for you.',
      emoji: '💚',
      category: 'strength',
    });
  }

  const regretCount = recent.filter(s => s.outcome === 'sent_regretted').length;
  if (regretCount >= 2) {
    insights.push({
      id: 'still_regret',
      text: 'Some secure rewrites still led to regret. Consider pausing longer or choosing a shorter boundary version next time.',
      emoji: '⏳',
      category: 'suggestion',
    });
  }

  const pauseCount = recent.filter(s => s.outcome === 'switched_to_pause').length;
  if (pauseCount >= 2) {
    insights.push({
      id: 'pause_pattern',
      text: `You've chosen to pause instead of sending ${pauseCount} times. That shows real self-awareness.`,
      emoji: '🧘',
      category: 'strength',
    });
  }

  const comparisonViewed = recent.filter(s => s.comparisonViewed).length;
  const teachingViewed = recent.filter(s => s.teachingViewed).length;
  if (comparisonViewed >= 3 || teachingViewed >= 3) {
    insights.push({
      id: 'learning_engaged',
      text: 'You regularly review the comparison and teaching views. Learning why secure messaging works is just as important as using it.',
      emoji: '📚',
      category: 'strength',
    });
  }

  return insights.slice(0, 5);
}
