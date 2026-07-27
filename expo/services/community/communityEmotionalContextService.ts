import { ToneSuggestion, HelpfulnessRating, ResponseType, ThreadClosure } from '@/types/community';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localizedText } from '@/lib/i18n/staticText';

const HELPFULNESS_KEY = 'community_reply_helpfulness';
const CLOSURE_KEY = 'community_thread_closures';
const ANALYTICS_KEY = 'community_emotional_analytics';

const HARSH_PATTERNS: { pattern: RegExp; suggestion: { en: string; es: string } }[] = [
  {
    pattern: /\byou'?re overreacting\b/i,
    suggestion: {
      en: 'It sounds like this situation might feel really overwhelming.',
      es: 'Parece que esta situación podría sentirse muy abrumadora.',
    },
  },
  {
    pattern: /\bjust (calm down|relax|chill)\b/i,
    suggestion: {
      en: 'It makes sense that you feel this way right now.',
      es: 'Tiene sentido que te sientas así en este momento.',
    },
  },
  {
    pattern: /\bthat'?s not (a big deal|that bad)\b/i,
    suggestion: {
      en: 'I can see how this feels really significant to you.',
      es: 'Puedo ver que esto se siente muy importante para ti.',
    },
  },
  {
    pattern: /\bstop being (so )?(dramatic|sensitive|emotional)\b/i,
    suggestion: {
      en: 'Your feelings are valid, even when they feel intense.',
      es: 'Tus sentimientos son válidos, incluso cuando se sienten intensos.',
    },
  },
  {
    pattern: /\byou (always|never)\b/i,
    suggestion: {
      en: 'Consider softening absolute language — it may feel more supportive.',
      es: 'Considera suavizar el lenguaje absoluto; puede sentirse más comprensivo.',
    },
  },
  {
    pattern: /\bget over it\b/i,
    suggestion: {
      en: 'Moving through difficult emotions takes time. Would a gentler phrasing work here?',
      es: 'Atravesar emociones difíciles toma tiempo. ¿Funcionaría una forma más amable de decirlo?',
    },
  },
  {
    pattern: /\byou should(n'?t| not) feel\b/i,
    suggestion: {
      en: 'All emotions are valid. Consider acknowledging their experience first.',
      es: 'Todas las emociones son válidas. Considera reconocer primero su experiencia.',
    },
  },
  {
    pattern: /\bthat'?s (stupid|dumb|ridiculous)\b/i,
    suggestion: {
      en: 'Try acknowledging their perspective before sharing yours.',
      es: 'Intenta reconocer su perspectiva antes de compartir la tuya.',
    },
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
        suggested: localizedText(suggestion.en, suggestion.es),
        reason: localizedText(
          'This phrasing might feel dismissive. A softer approach could help the person feel heard.',
          'Esta frase podría sentirse invalidante. Un enfoque más suave puede ayudar a que la persona se sienta escuchada.',
        ),
      };
    }
  }

  return null;
}

export function getDistressLabel(level: number): { label: string; color: string } {
  if (level <= 3) return { label: localizedText('Low distress', 'Malestar bajo'), color: '#14B8A6' };
  if (level <= 6) return { label: localizedText('Moderate distress', 'Malestar moderado'), color: '#67E8F9' };
  return { label: localizedText('High distress', 'Malestar alto'), color: '#3B82F6' };
}

export function getSupportRequestLabel(type: string): { emoji: string; label: string } {
  const map: Record<string, { emoji: string; label: string }> = {
    validation: { emoji: '💛', label: localizedText('Looking for validation', 'Busca validación') },
    'shared-experience': { emoji: '🤝', label: localizedText('Want shared experiences', 'Quiere experiencias compartidas') },
    advice: { emoji: '💡', label: localizedText('Open to advice', 'Abierto/a a consejos') },
    'another-perspective': { emoji: '🔄', label: localizedText('Want another perspective', 'Quiere otra perspectiva') },
  };
  return map[type] ?? { emoji: '💬', label: type };
}

export function getResponseTypeLabel(type: ResponseType): { emoji: string; label: string; color: string } {
  const map: Record<ResponseType, { emoji: string; label: string; color: string }> = {
    validation: { emoji: '💛', label: localizedText('Validation', 'Validación'), color: '#67E8F9' },
    'shared-experience': { emoji: '🤝', label: localizedText('Shared experience', 'Experiencia compartida'), color: '#14B8A6' },
    advice: { emoji: '💡', label: localizedText('Advice', 'Consejos'), color: '#3B82F6' },
    'another-perspective': { emoji: '🔄', label: localizedText('Another perspective', 'Otra perspectiva'), color: '#14B8A6' },
  };
  return map[type];
}

export function getHelpfulnessLabel(rating: HelpfulnessRating): { emoji: string; label: string } {
  const map: Record<HelpfulnessRating, { emoji: string; label: string }> = {
    helped: { emoji: '✨', label: localizedText('This helped', 'Esto ayudó') },
    'gave-perspective': { emoji: '🔄', label: localizedText('Gave me perspective', 'Me dio perspectiva') },
    'not-helpful': { emoji: '🤷', label: localizedText('Not helpful', 'No ayudó') },
  };
  return map[rating];
}

export function getClosureTypeLabel(type: ThreadClosure['type']): { emoji: string; label: string } {
  const map: Record<string, { emoji: string; label: string }> = {
    'what-i-realized': { emoji: '💡', label: localizedText('What I realized', 'Lo que me di cuenta') },
    'what-helped': { emoji: '🌱', label: localizedText('What helped', 'Lo que ayudó') },
    'what-i-will-try': { emoji: '🎯', label: localizedText('What I will try next', 'Lo que intentaré después') },
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
