import { ToneSuggestion, HelpfulnessRating, ResponseType, ThreadClosure } from '@/types/community';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HELPFULNESS_KEY = 'community_reply_helpfulness';
const CLOSURE_KEY = 'community_thread_closures';
const ANALYTICS_KEY = 'community_emotional_analytics';

const HARSH_PATTERNS: { pattern: RegExp; suggestion: string }[] = [
  {
    pattern: /\byou'?re overreacting\b/i,
    suggestion: 'It sounds like this situation might feel really overwhelming.',
  },
  {
    pattern: /\bjust (calm down|relax|chill)\b/i,
    suggestion: 'It makes sense that you feel this way right now.',
  },
  {
    pattern: /\bthat'?s not (a big deal|that bad)\b/i,
    suggestion: 'I can see how this feels really significant to you.',
  },
  {
    pattern: /\bstop being (so )?(dramatic|sensitive|emotional)\b/i,
    suggestion: 'Your feelings are valid, even when they feel intense.',
  },
  {
    pattern: /\byou (always|never)\b/i,
    suggestion: 'Consider softening absolute language — it may feel more supportive.',
  },
  {
    pattern: /\bget over it\b/i,
    suggestion: 'Moving through difficult emotions takes time. Would a gentler phrasing work here?',
  },
  {
    pattern: /\byou should(n'?t| not) feel\b/i,
    suggestion: 'All emotions are valid. Consider acknowledging their experience first.',
  },
  {
    pattern: /\bthat'?s (stupid|dumb|ridiculous)\b/i,
    suggestion: 'Try acknowledging their perspective before sharing yours.',
  },
];

export function checkTone(text: string): ToneSuggestion | null {
  console.log('[EmotionalContext] Checking tone for reply');

  for (const { pattern, suggestion } of HARSH_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      console.log('[EmotionalContext] Tone issue detected:', match[0]);
      return {
        original: match[0],
        suggested: suggestion,
        reason: 'This phrasing might feel dismissive. A softer approach could help the person feel heard.',
      };
    }
  }

  return null;
}

export function getDistressLabel(level: number): { label: string; color: string } {
  if (level <= 3) return { label: 'Low distress', color: '#6BA38E' };
  if (level <= 6) return { label: 'Moderate distress', color: '#C4956A' };
  return { label: 'High distress', color: '#C47878' };
}

export function getSupportRequestLabel(type: string): { emoji: string; label: string } {
  const map: Record<string, { emoji: string; label: string }> = {
    validation: { emoji: '💛', label: 'Looking for validation' },
    'shared-experience': { emoji: '🤝', label: 'Want shared experiences' },
    advice: { emoji: '💡', label: 'Open to advice' },
    'another-perspective': { emoji: '🔄', label: 'Want another perspective' },
  };
  return map[type] ?? { emoji: '💬', label: type };
}

export function getResponseTypeLabel(type: ResponseType): { emoji: string; label: string; color: string } {
  const map: Record<ResponseType, { emoji: string; label: string; color: string }> = {
    validation: { emoji: '💛', label: 'Validation', color: '#E8A87C' },
    'shared-experience': { emoji: '🤝', label: 'Shared experience', color: '#6BA38E' },
    advice: { emoji: '💡', label: 'Advice', color: '#9B8EC4' },
    'another-perspective': { emoji: '🔄', label: 'Another perspective', color: '#4A8B8D' },
  };
  return map[type];
}

export function getHelpfulnessLabel(rating: HelpfulnessRating): { emoji: string; label: string } {
  const map: Record<HelpfulnessRating, { emoji: string; label: string }> = {
    helped: { emoji: '✨', label: 'This helped' },
    'gave-perspective': { emoji: '🔄', label: 'Gave me perspective' },
    'not-helpful': { emoji: '🤷', label: 'Not helpful' },
  };
  return map[rating];
}

export function getClosureTypeLabel(type: ThreadClosure['type']): { emoji: string; label: string } {
  const map: Record<string, { emoji: string; label: string }> = {
    'what-i-realized': { emoji: '💡', label: 'What I realized' },
    'what-helped': { emoji: '🌱', label: 'What helped' },
    'what-i-will-try': { emoji: '🎯', label: 'What I will try next' },
  };
  return map[type] ?? { emoji: '💬', label: type };
}

export async function saveReplyHelpfulness(
  postId: string,
  replyId: string,
  rating: HelpfulnessRating
): Promise<void> {
  console.log('[EmotionalContext] Saving helpfulness:', rating, 'for reply:', replyId);
  try {
    const stored = await AsyncStorage.getItem(HELPFULNESS_KEY);
    const data: Record<string, Record<string, HelpfulnessRating>> = stored ? JSON.parse(stored) : {};
    if (!data[postId]) data[postId] = {};
    data[postId][replyId] = rating;
    await AsyncStorage.setItem(HELPFULNESS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[EmotionalContext] Failed to save helpfulness:', error);
  }
}

export async function getReplyHelpfulness(
  postId: string
): Promise<Record<string, HelpfulnessRating>> {
  try {
    const stored = await AsyncStorage.getItem(HELPFULNESS_KEY);
    if (!stored) return {};
    const data = JSON.parse(stored);
    return data[postId] ?? {};
  } catch {
    return {};
  }
}

export async function saveThreadClosure(
  postId: string,
  closure: ThreadClosure
): Promise<void> {
  console.log('[EmotionalContext] Saving thread closure for post:', postId);
  try {
    const stored = await AsyncStorage.getItem(CLOSURE_KEY);
    const data: Record<string, ThreadClosure> = stored ? JSON.parse(stored) : {};
    data[postId] = closure;
    await AsyncStorage.setItem(CLOSURE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[EmotionalContext] Failed to save closure:', error);
  }
}

export async function getThreadClosure(postId: string): Promise<ThreadClosure | null> {
  try {
    const stored = await AsyncStorage.getItem(CLOSURE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data[postId] ?? null;
  } catch {
    return null;
  }
}

export async function trackEmotionalContextEvent(event: string, data?: Record<string, unknown>): Promise<void> {
  console.log('[EmotionalContext] Analytics event:', event, data);
  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
    const events: Array<{ event: string; data?: Record<string, unknown>; timestamp: number }> = stored ? JSON.parse(stored) : [];
    events.push({ event, data, timestamp: Date.now() });
    if (events.length > 500) events.splice(0, events.length - 500);
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('[EmotionalContext] Failed to track event:', error);
  }
}
