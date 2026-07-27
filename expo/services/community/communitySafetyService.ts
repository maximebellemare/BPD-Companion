import { SafetyCheckResult, PostSuggestion } from '@/types/community';
import { localizedText } from '@/lib/i18n/staticText';

const HOSTILE_PATTERNS = [
  /\b(shut up|stupid|idiot|moron|loser|pathetic|kill yourself|die)\b/i,
  /\b(you deserve|you should be ashamed)\b/i,
  /\b(no one cares|nobody likes)\b/i,
];

const HARMFUL_ADVICE_PATTERNS = [
  /\b(stop taking|quit your meds|don't go to therapy)\b/i,
  /\b(just get over it|snap out of it)\b/i,
];

export function checkContentSafety(text: string): SafetyCheckResult {
  console.log('[CommunitySafety] Checking content safety');

  for (const pattern of HOSTILE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isSafe: false,
        reason: 'hostile_language',
        suggestion: localizedText(
          'This message may contain language that could hurt others. Would you like to rephrase it in a more supportive way?',
          'Este mensaje puede contener lenguaje que podría herir a otras personas. ¿Quieres reformularlo de una manera más solidaria?',
        ),
      };
    }
  }

  for (const pattern of HARMFUL_ADVICE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isSafe: false,
        reason: 'harmful_advice',
        suggestion: localizedText(
          'This message may contain advice that could be unsafe. Remember we are peers, not professionals. Consider encouraging them to talk to their care team.',
          'Este mensaje puede contener consejos que podrían ser inseguros. Recuerda que somos pares, no profesionales. Considera animar a la persona a hablar con su equipo de atención.',
        ),
      };
    }
  }

  return { isSafe: true };
}

export function getPostSuggestions(title: string, body: string): PostSuggestion[] {
  const suggestions: PostSuggestion[] = [];

  if (body.length < 50) {
    suggestions.push({
      type: 'context',
      message: localizedText(
        'Adding more context can help others understand your situation and offer better support.',
        'Agregar más contexto puede ayudar a que otras personas entiendan tu situación y ofrezcan mejor apoyo.',
      ),
    });
  }

  const hasQuestion = body.includes('?') || title.includes('?');
  const mentionsSupport = /\b(advice|help|support|suggestion|experience)\b/i.test(body);
  if (!hasQuestion && !mentionsSupport) {
    suggestions.push({
      type: 'support-type',
      message: localizedText(
        'Let others know what kind of support would help — just listening, advice, or shared experiences.',
        'Cuéntales qué tipo de apoyo ayudaría: solo escucha, consejos o experiencias compartidas.',
      ),
    });
  }

  return suggestions;
}

export function isContentAppropriate(text: string): boolean {
  return checkContentSafety(text).isSafe;
}
