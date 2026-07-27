import {
  MessageTone,
  ToneAnalysis,
  ResponseStyleCard,
  MessageGuardSession,
  TONE_META,
} from '@/types/messageGuard';
import { analyzeTone } from '@/services/messages/messageToneAnalyzer';
import { generateQuickSecureVersion } from '@/services/messages/secureRewriteService';
import { localizedText } from '@/lib/i18n/staticText';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GUARD_SESSIONS_KEY = 'message_guard_sessions';

function generateAnxiousVersion(original: string): string {
  let text = original.trim();
  text = text.replace(/\./g, '?');
  if (!text.includes('?')) text += '?';
  const prefix = localizedText("I need to know where we stand. ", 'Necesito saber en qué estamos. ');
  return prefix + text + localizedText(" Are we okay? Please tell me we're okay.", ' ¿Estamos bien? Por favor dime que estamos bien.');
}

function generateAvoidantVersion(original: string): string {
  const shortened = original.trim().split(/[.!?]/).filter(Boolean)[0] || original.trim();
  return shortened.replace(/!/g, '.').trim() + localizedText(". Anyway, it's fine. Forget I said anything.", '. De todos modos, está bien. Olvida que dije algo.');
}

function generateAngryVersion(original: string): string {
  let text = original.trim();
  text = text.replace(/\./g, '!');
  if (!text.endsWith('!')) text += '!';
  return localizedText('You know what? ', '¿Sabes qué? ') + text;
}

function generateOverExplainingVersion(original: string): string {
  const text = original.trim();
  const prefix = localizedText(
    "What I'm trying to say is — and I know this might not come out right — but I really need you to understand that ",
    'Lo que intento decir — y sé que quizá no salga perfecto — es que de verdad necesito que entiendas que ',
  );
  const suffix = localizedText(
    ". And I don't mean it in a bad way, I just want you to see where I'm coming from. Does that make sense? I hope that makes sense.",
    '. Y no lo digo de mala manera; solo quiero que veas de dónde viene esto. ¿Tiene sentido? Espero que tenga sentido.',
  );
  return prefix + text.charAt(0).toLowerCase() + text.slice(1).replace(/[.!?]*$/, '') + suffix;
}

function getEmotionalImpact(tone: MessageTone): string {
  switch (tone) {
    case 'anxious':
      return localizedText(
        "May temporarily ease anxiety but could increase dependency on their response for your sense of safety.",
        'Puede aliviar la ansiedad por un momento, pero podría aumentar la dependencia de su respuesta para sentir seguridad.',
      );
    case 'avoidant':
      return localizedText(
        'May feel self-protective in the moment but could leave your real feelings unexpressed and create distance.',
        'Puede sentirse protector en el momento, pero podría dejar tus sentimientos reales sin expresar y crear distancia.',
      );
    case 'angry':
      return localizedText(
        'May release pressure but could escalate the situation and leave you feeling regretful afterward.',
        'Puede soltar presión, pero podría intensificar la situación y dejarte con arrepentimiento después.',
      );
    case 'over_explaining':
      return localizedText(
        "May feel like you're being thorough, but could overwhelm the other person and weaken your core point.",
        'Puede sentirse como si fueras claro/a y detallado/a, pero podría abrumar a la otra persona y debilitar tu punto central.',
      );
    case 'secure':
      return localizedText(
        'May feel vulnerable at first, but tends to invite genuine connection and mutual respect.',
        'Puede sentirse vulnerable al inicio, pero suele invitar a una conexión genuina y respeto mutuo.',
      );
  }
}

function getRelationshipImpact(tone: MessageTone): string {
  switch (tone) {
    case 'anxious':
      return localizedText(
        'Could put pressure on the other person to manage your emotions, which may create a push-pull dynamic.',
        'Podría poner presión en la otra persona para regular tus emociones, lo que puede crear una dinámica de acercamiento y alejamiento.',
      );
    case 'avoidant':
      return localizedText(
        "Could signal that you don't care even when you do, making the other person feel shut out.",
        'Podría comunicar que no te importa, incluso si sí te importa, y hacer que la otra persona se sienta excluida.',
      );
    case 'angry':
      return localizedText(
        'Could trigger defensiveness and make the conversation about blame rather than resolution.',
        'Podría activar defensividad y hacer que la conversación se centre en culpas en vez de resolución.',
      );
    case 'over_explaining':
      return localizedText(
        'Could exhaust the other person and make it harder for them to find the real message underneath.',
        'Podría agotar a la otra persona y hacer más difícil que encuentre el mensaje real debajo.',
      );
    case 'secure':
      return localizedText(
        'Tends to create space for honest dialogue and helps both people feel respected.',
        'Tiende a crear espacio para un diálogo honesto y ayuda a que ambas personas se sientan respetadas.',
      );
  }
}

export function generateResponseStyles(
  originalText: string,
  analysis: ToneAnalysis,
): ResponseStyleCard[] {
  console.log('[MessageGuard] Generating response styles');

  const secureVersion = generateQuickSecureVersion(originalText, analysis);

  const styles: ResponseStyleCard[] = [
    {
      tone: 'anxious',
      label: TONE_META.anxious.label,
      emoji: TONE_META.anxious.emoji,
      color: TONE_META.anxious.color,
      rewrittenMessage: generateAnxiousVersion(originalText),
      emotionalImpact: getEmotionalImpact('anxious'),
      relationshipImpact: getRelationshipImpact('anxious'),
      isRecommended: false,
    },
    {
      tone: 'avoidant',
      label: TONE_META.avoidant.label,
      emoji: TONE_META.avoidant.emoji,
      color: TONE_META.avoidant.color,
      rewrittenMessage: generateAvoidantVersion(originalText),
      emotionalImpact: getEmotionalImpact('avoidant'),
      relationshipImpact: getRelationshipImpact('avoidant'),
      isRecommended: false,
    },
    {
      tone: 'angry',
      label: TONE_META.angry.label,
      emoji: TONE_META.angry.emoji,
      color: TONE_META.angry.color,
      rewrittenMessage: generateAngryVersion(originalText),
      emotionalImpact: getEmotionalImpact('angry'),
      relationshipImpact: getRelationshipImpact('angry'),
      isRecommended: false,
    },
    {
      tone: 'over_explaining',
      label: TONE_META.over_explaining.label,
      emoji: TONE_META.over_explaining.emoji,
      color: TONE_META.over_explaining.color,
      rewrittenMessage: generateOverExplainingVersion(originalText),
      emotionalImpact: getEmotionalImpact('over_explaining'),
      relationshipImpact: getRelationshipImpact('over_explaining'),
      isRecommended: false,
    },
    {
      tone: 'secure',
      label: TONE_META.secure.label,
      emoji: TONE_META.secure.emoji,
      color: TONE_META.secure.color,
      rewrittenMessage: secureVersion,
      emotionalImpact: getEmotionalImpact('secure'),
      relationshipImpact: getRelationshipImpact('secure'),
      isRecommended: true,
    },
  ];

  const detectedIndex = styles.findIndex(s => s.tone === analysis.primaryTone);
  if (detectedIndex > 0) {
    const [detected] = styles.splice(detectedIndex, 1);
    styles.unshift(detected);
  }

  return styles;
}

export async function saveGuardSession(session: MessageGuardSession): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(GUARD_SESSIONS_KEY);
    const sessions: MessageGuardSession[] = stored ? JSON.parse(stored) : [];
    sessions.unshift(session);
    const trimmed = sessions.slice(0, 50);
    await AsyncStorage.setItem(GUARD_SESSIONS_KEY, JSON.stringify(trimmed));
    console.log('[MessageGuard] Session saved:', session.id);
  } catch (err) {
    console.error('[MessageGuard] Error saving session:', err);
  }
}

export async function getGuardSessions(): Promise<MessageGuardSession[]> {
  try {
    const stored = await AsyncStorage.getItem(GUARD_SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('[MessageGuard] Error loading sessions:', err);
    return [];
  }
}

export { analyzeTone };
