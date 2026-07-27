import { storageService } from '@/services/storage/storageService';
import { localizedText } from '@/lib/i18n/staticText';
import {
  CopilotSessionIntake,
  CopilotSessionResult,
  CopilotInterpretation,
  CopilotNextStep,
  CopilotSession,
  CopilotSituation,
  CopilotEmotion,
  CopilotUrge,
  CopilotNeed,
} from '@/types/relationshipCopilot';

const SESSIONS_KEY = 'steady_copilot_sessions';

const SITUATION_INTERPRETATIONS: Record<CopilotSituation, string> = {
  no_reply: 'This looks like a moment where silence may be activating abandonment fear. The absence of a reply can feel louder than words — and your nervous system may be reading danger where there may be none.',
  cold_tone: 'A shift in tone can feel like the ground dropping away. Your mind may be scanning for signs of rejection, and that scanning can amplify uncertainty into something that feels very real.',
  conflict: 'After conflict, everything can feel raw and urgent. The part of you that wants to fix things may be fighting with the part that feels hurt — and both are valid.',
  rejected: 'Feeling rejected touches something very deep. Right now your emotional system may be in protection mode, which can make everything feel more intense and more personal than it may actually be.',
  need_reassurance: 'The need for reassurance is not weakness — it is your attachment system reaching out for safety. The challenge is finding a way to meet that need without creating a pattern that increases anxiety over time.',
  want_to_message: 'The urge to reach out is strong right now. This may be a moment where what you send could either bring you closer to what you want or push you further from it.',
  spiraling: 'When the mind starts creating stories about what something means, it can spiral fast. Right now, you may be confusing a feeling with a fact.',
  shame_after_conflict: 'Shame after conflict is one of the hardest experiences. It can make you want to disappear or over-compensate. Neither impulse usually leads where you want to go.',
  other: 'Something is happening that feels significant right now. Even if it is hard to name exactly, acknowledging it is a form of self-awareness.',
};

const SITUATION_INTERPRETATIONS_ES: Record<CopilotSituation, string> = {
  no_reply: 'Este parece un momento en el que el silencio puede activar miedo al abandono. La falta de respuesta puede sentirse más fuerte que las palabras, y tu sistema nervioso puede leer peligro donde quizá no lo hay.',
  cold_tone: 'Un cambio de tono puede sentirse como si el piso se moviera. Tu mente puede estar buscando señales de rechazo, y esa búsqueda puede amplificar la incertidumbre hasta sentirse muy real.',
  conflict: 'Después de un conflicto, todo puede sentirse sensible y urgente. La parte de ti que quiere arreglarlo puede estar peleando con la parte que se siente herida; ambas tienen sentido.',
  rejected: 'Sentirte rechazado/a toca algo muy profundo. Ahora tu sistema emocional puede estar en modo protección, lo que hace que todo se sienta más intenso y más personal de lo que quizá es.',
  need_reassurance: 'Necesitar seguridad no es debilidad; es tu sistema de apego buscando cuidado. El reto es atender esa necesidad sin crear un patrón que aumente la ansiedad con el tiempo.',
  want_to_message: 'La urgencia de escribir es fuerte ahora. Este puede ser un momento en el que lo que envíes te acerque a lo que quieres o te aleje de ello.',
  spiraling: 'Cuando la mente empieza a crear historias sobre lo que algo significa, puede entrar en espiral rápido. Ahora podrías estar confundiendo una emoción con un hecho.',
  shame_after_conflict: 'La vergüenza después de un conflicto es una de las experiencias más difíciles. Puede hacerte querer desaparecer o compensar de más. Ningún impulso suele llevarte a donde quieres ir.',
  other: 'Algo está pasando y se siente importante ahora. Aunque cueste nombrarlo con exactitud, reconocerlo ya es una forma de autoconciencia.',
};

const EMOTION_FOLLOW_PATTERNS: Record<CopilotEmotion, string> = {
  abandoned: 'When abandonment fear rises, the urge to cling or push away often follows. Both can feel like survival instincts.',
  anxious: 'Anxiety in relationships often leads to urgency — wanting answers, wanting to fix, wanting to know right now.',
  hurt: 'When hurt takes over, it can be hard to see the other person clearly. Everything filters through the pain.',
  angry: 'Anger often masks something softer underneath — hurt, fear, or feeling unseen. It may protect you, but it can also escalate things.',
  ashamed: 'Shame tends to make you want to hide or over-explain. Both reactions usually come from the same place — wanting to be okay in someone else\'s eyes.',
  confused: 'Confusion in relationships can be its own form of distress. Not knowing where you stand may feel unbearable right now.',
  numb: 'Numbness can be your system\'s way of protecting you from overwhelm. It is not indifference — it is often a sign of too much feeling.',
  desperate: 'Desperation makes everything feel urgent and non-negotiable. That urgency is real, but acting from it rarely leads to the outcome you want.',
  panicked: 'Panic can make your world shrink to this one moment, this one relationship. A pause right now may help your window of tolerance expand again.',
  lonely: 'Loneliness in a relationship can feel worse than loneliness alone. It touches something very tender.',
};

const EMOTION_FOLLOW_PATTERNS_ES: Record<CopilotEmotion, string> = {
  abandoned: 'Cuando sube el miedo al abandono, suele aparecer la urgencia de aferrarte o alejarte. Ambas respuestas pueden sentirse como instintos de supervivencia.',
  anxious: 'La ansiedad en las relaciones suele traer urgencia: querer respuestas, querer arreglarlo, querer saber ahora mismo.',
  hurt: 'Cuando el dolor toma el control, puede ser difícil ver a la otra persona con claridad. Todo pasa por el filtro de la herida.',
  angry: 'El enojo a menudo cubre algo más vulnerable debajo: dolor, miedo o sentirte invisible. Puede protegerte, pero también puede escalar las cosas.',
  ashamed: 'La vergüenza suele hacer que quieras esconderte o explicar demasiado. Ambas reacciones suelen venir del mismo lugar: querer estar bien ante los ojos de otra persona.',
  confused: 'La confusión en las relaciones puede ser una forma de malestar. No saber dónde estás parado/a puede sentirse insoportable ahora.',
  numb: 'El entumecimiento puede ser la forma en que tu sistema te protege del exceso. No es indiferencia; a menudo es una señal de demasiada emoción.',
  desperate: 'La desesperación hace que todo se sienta urgente y no negociable. Esa urgencia es real, pero actuar desde ella rara vez lleva al resultado que quieres.',
  panicked: 'El pánico puede reducir tu mundo a este momento y esta relación. Una pausa ahora puede ayudar a ampliar tu ventana de tolerancia otra vez.',
  lonely: 'La soledad dentro de una relación puede doler más que la soledad estando solo/a. Toca algo muy sensible.',
};

const URGE_CONSEQUENCES: Record<CopilotUrge, string> = {
  text_again: 'Sending another message when the first one hasn\'t been answered can increase your anxiety rather than relieve it.',
  call: 'Calling when emotions are high can sometimes create moments you both regret. A brief pause may protect what matters.',
  explain_myself: 'The urge to explain often comes from fear of being misunderstood. But explaining from distress can sometimes add confusion.',
  apologize_too_much: 'Over-apologizing can erode your sense of self. You deserve to take up space, even when things are hard.',
  withdraw: 'Withdrawal may feel safe, but it can also block the repair that relationships need. A pause is different from disappearing.',
  lash_out: 'Lashing out usually creates the exact opposite of what you need. It pushes people away when you want them closer.',
  seek_reassurance: 'Seeking reassurance can temporarily soothe anxiety, but it may create a cycle that makes the next wave stronger.',
  check_their_activity: 'Checking their activity feeds the anxiety loop. Each check creates a new interpretation, a new story, a new wave of distress.',
  send_long_message: 'A long emotional message can overwhelm the person receiving it. Shorter, calmer words often land with more impact.',
};

const URGE_CONSEQUENCES_ES: Record<CopilotUrge, string> = {
  text_again: 'Enviar otro mensaje cuando el primero no ha sido respondido puede aumentar tu ansiedad en vez de aliviarla.',
  call: 'Llamar cuando las emociones están altas puede crear momentos que ambos lamenten. Una pausa breve puede proteger lo que importa.',
  explain_myself: 'La urgencia de explicar suele venir del miedo a ser malinterpretado/a. Pero explicar desde el malestar a veces agrega confusión.',
  apologize_too_much: 'Disculparte de más puede erosionar tu sentido de ti. Mereces ocupar espacio, incluso cuando las cosas son difíciles.',
  withdraw: 'Retirarte puede sentirse seguro, pero también puede bloquear la reparación que las relaciones necesitan. Pausar no es lo mismo que desaparecer.',
  lash_out: 'Atacar suele crear lo contrario de lo que necesitas. Aleja a las personas cuando lo que quieres es sentirte cerca.',
  seek_reassurance: 'Buscar seguridad puede calmar la ansiedad por un momento, pero puede crear un ciclo que hace que la siguiente ola sea más fuerte.',
  check_their_activity: 'Revisar su actividad alimenta el ciclo de ansiedad. Cada revisión crea una nueva interpretación, una nueva historia y una nueva ola de malestar.',
  send_long_message: 'Un mensaje largo y emocional puede abrumar a quien lo recibe. Palabras más breves y calmadas suelen llegar con más claridad.',
};

function buildInterpretation(intake: CopilotSessionIntake): CopilotInterpretation {
  const situationText = localizedText(
    SITUATION_INTERPRETATIONS[intake.situation],
    SITUATION_INTERPRETATIONS_ES[intake.situation],
  );
  const primaryEmotion = intake.emotions[0];
  const emotionFollow = primaryEmotion
    ? localizedText(EMOTION_FOLLOW_PATTERNS[primaryEmotion], EMOTION_FOLLOW_PATTERNS_ES[primaryEmotion])
    : '';
  const urgeConsequence = localizedText(
    URGE_CONSEQUENCES[intake.strongestUrge],
    URGE_CONSEQUENCES_ES[intake.strongestUrge],
  );

  const whatMayBeHappening = situationText;
  const whatUsuallyFollows = [emotionFollow, urgeConsequence].filter(Boolean).join(' ');

  console.log('[CopilotService] Built interpretation for situation:', intake.situation);
  return { whatMayBeHappening, whatUsuallyFollows };
}

function buildNextSteps(intake: CopilotSessionIntake): CopilotNextStep[] {
  const steps: CopilotNextStep[] = [];

  if (intake.intensity >= 7) {
    steps.push({
      id: 'step_breathe',
      label: localizedText('Breathe first', 'Respira primero'),
      description: localizedText(
        'A 60-second breathing exercise to bring your body back to baseline.',
        'Un ejercicio de respiración de 60 segundos para ayudar a tu cuerpo a volver a una base más estable.',
      ),
      icon: 'Wind',
      route: '/exercise?id=c1',
      type: 'breathing',
    });
  }

  steps.push({
    id: 'step_pause',
    label: localizedText('2-minute pause', 'Pausa de 2 minutos'),
    description: localizedText(
      'Set a gentle timer. Often the urge shifts after even a short pause.',
      'Pon un temporizador suave. A menudo el impulso cambia después de una pausa breve.',
    ),
    icon: 'Timer',
    type: 'pause',
  });

  if (intake.intensity >= 5) {
    steps.push({
      id: 'step_ground',
      label: localizedText('Ground yourself', 'Conéctate al presente'),
      description: localizedText(
        'A quick grounding exercise to bring you back to the present moment.',
        'Un ejercicio rápido de conexión para volver al momento presente.',
      ),
      icon: 'Anchor',
      route: '/exercise?id=c2',
      type: 'grounding',
    });
  }

  steps.push({
    id: 'step_companion',
    label: localizedText('Talk it through', 'Hablarlo con calma'),
    description: localizedText(
      'Reflect with AI Companion before acting on the urge.',
      'Reflexiona con AI Companion antes de actuar desde el impulso.',
    ),
    icon: 'Sparkles',
    route: '/(tabs)/companion',
    type: 'companion',
  });

  if (['text_again', 'send_long_message', 'explain_myself', 'call'].includes(intake.strongestUrge)) {
    steps.push({
      id: 'step_rewrite',
      label: localizedText('Rewrite your message', 'Reescribe tu mensaje'),
      description: localizedText(
        'Craft a calmer version of what you want to say.',
        'Crea una versión más calmada de lo que quieres decir.',
      ),
      icon: 'MessageSquare',
      route: '/(tabs)/messages',
      type: 'rewrite',
    });
  }

  steps.push({
    id: 'step_journal',
    label: localizedText('Journal first', 'Escribe primero'),
    description: localizedText(
      'Write it out. Release some pressure before you act.',
      'Escríbelo. Libera algo de presión antes de actuar.',
    ),
    icon: 'BookOpen',
    route: '/check-in',
    type: 'journal',
  });

  console.log('[CopilotService] Generated', steps.length, 'next steps');
  return steps.slice(0, 5);
}

function buildSecureMessagePrompt(intake: CopilotSessionIntake): string {
  const needMap: Record<CopilotNeed, string> = {
    clarity: 'You could try: "I want to understand where we are. Can we talk about this when we both feel ready?"',
    reassurance: 'You could try: "I\'m feeling uncertain right now. A small reassurance would mean a lot to me."',
    connection: 'You could try: "I miss feeling close to you. Can we find a moment to reconnect?"',
    stop_spiraling: 'You could try: "I notice I\'m getting in my head. I want to be honest about that instead of acting on it."',
    protect_relationship: 'You could try: "This relationship matters to me. I want to respond in a way that honors that."',
    protect_dignity: 'You could try: "I care about this, but I also want to show up with self-respect."',
    avoid_making_worse: 'You could try: "I need a moment before I respond. I want to make sure I say what I actually mean."',
    feel_safe: 'You could try: "I need to feel safe right now. Can we slow this down?"',
  };

  const needMapEs: Record<CopilotNeed, string> = {
    clarity: 'Podrías intentar: "Quiero entender dónde estamos. ¿Podemos hablar de esto cuando ambos nos sintamos listos?"',
    reassurance: 'Podrías intentar: "Me siento inseguro/a ahora. Una pequeña confirmación significaría mucho para mí."',
    connection: 'Podrías intentar: "Extraño sentirme cerca de ti. ¿Podemos encontrar un momento para reconectar?"',
    stop_spiraling: 'Podrías intentar: "Noto que me estoy metiendo mucho en mi cabeza. Quiero ser honesto/a sobre eso en vez de actuar desde ahí."',
    protect_relationship: 'Podrías intentar: "Esta relación me importa. Quiero responder de una forma que honre eso."',
    protect_dignity: 'Podrías intentar: "Esto me importa, pero también quiero presentarme con respeto por mí."',
    avoid_making_worse: 'Podrías intentar: "Necesito un momento antes de responder. Quiero asegurarme de decir lo que realmente quiero decir."',
    feel_safe: 'Podrías intentar: "Necesito sentirme seguro/a ahora. ¿Podemos ir más despacio?"',
  };

  return localizedText(
    needMap[intake.deepestNeed] ?? 'Take a moment to think about one clear, calm sentence that expresses what you really need.',
    needMapEs[intake.deepestNeed] ?? 'Tómate un momento para pensar en una frase clara y calmada que exprese lo que realmente necesitas.',
  );
}

function buildAffirmation(intake: CopilotSessionIntake): string {
  const affirmations: string[] = [
    'You do not need to solve the whole relationship in one message.',
    'A calmer next step may help more than an urgent one.',
    'This moment will pass. How you move through it matters.',
    'You are allowed to take up space and still be gentle.',
    'Pausing is not avoiding — it is choosing yourself.',
    'Your feelings are real. Your first reaction does not have to be your response.',
    'You deserve relationships where you feel safe enough to slow down.',
  ];
  const affirmationsEs: string[] = [
    'No necesitas resolver toda la relación en un solo mensaje.',
    'Un próximo paso más calmado puede ayudar más que uno urgente.',
    'Este momento va a pasar. La forma en que lo atraviesas importa.',
    'Tienes permiso de ocupar espacio y aun así ser amable.',
    'Pausar no es evitar; es elegirte.',
    'Tus sentimientos son reales. Tu primera reacción no tiene que ser tu respuesta.',
    'Mereces relaciones donde te sientas lo bastante seguro/a como para ir más despacio.',
  ];

  if (intake.intensity >= 8) {
    return localizedText(
      'Right now, the most powerful thing you can do is pause. This intensity will shift. Let it move through you before you act.',
      'Ahora mismo, lo más poderoso que puedes hacer es pausar. Esta intensidad va a cambiar. Déjala moverse a través de ti antes de actuar.',
    );
  }

  const idx = Math.abs(intake.situation.charCodeAt(0) + intake.emotions.length) % affirmations.length;
  return localizedText(affirmations[idx], affirmationsEs[idx]);
}

export function generateCopilotResult(intake: CopilotSessionIntake): CopilotSessionResult {
  console.log('[CopilotService] Generating result for intake:', intake.situation, 'intensity:', intake.intensity);

  const interpretation = buildInterpretation(intake);
  const nextSteps = buildNextSteps(intake);
  const secureMessagePrompt = buildSecureMessagePrompt(intake);
  const affirmation = buildAffirmation(intake);

  return {
    interpretation,
    nextSteps,
    secureMessagePrompt,
    affirmation,
  };
}

export async function saveCopilotSession(session: CopilotSession): Promise<void> {
  const sessions = await getCopilotSessions();
  const updated = [session, ...sessions].slice(0, 50);
  await storageService.set(SESSIONS_KEY, updated);
  console.log('[CopilotService] Saved session:', session.id);
}

export async function getCopilotSessions(): Promise<CopilotSession[]> {
  const data = await storageService.get<CopilotSession[]>(SESSIONS_KEY);
  console.log('[CopilotService] Loaded', data?.length ?? 0, 'sessions');
  return data ?? [];
}

export function getCopilotInsightSummary(sessions: CopilotSession[]): {
  topSituation: string | null;
  topEmotion: string | null;
  topUrge: string | null;
  topNeed: string | null;
  avgIntensity: number;
  sessionCount: number;
} {
  if (sessions.length === 0) {
    return { topSituation: null, topEmotion: null, topUrge: null, topNeed: null, avgIntensity: 0, sessionCount: 0 };
  }

  const sitCounts: Record<string, number> = {};
  const emoCounts: Record<string, number> = {};
  const urgeCounts: Record<string, number> = {};
  const needCounts: Record<string, number> = {};
  let totalIntensity = 0;

  sessions.forEach(s => {
    sitCounts[s.intake.situation] = (sitCounts[s.intake.situation] ?? 0) + 1;
    s.intake.emotions.forEach(e => {
      emoCounts[e] = (emoCounts[e] ?? 0) + 1;
    });
    urgeCounts[s.intake.strongestUrge] = (urgeCounts[s.intake.strongestUrge] ?? 0) + 1;
    needCounts[s.intake.deepestNeed] = (needCounts[s.intake.deepestNeed] ?? 0) + 1;
    totalIntensity += s.intake.intensity;
  });

  const top = (counts: Record<string, number>) => {
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };

  return {
    topSituation: top(sitCounts),
    topEmotion: top(emoCounts),
    topUrge: top(urgeCounts),
    topNeed: top(needCounts),
    avgIntensity: totalIntensity / sessions.length,
    sessionCount: sessions.length,
  };
}
