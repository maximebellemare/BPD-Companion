import { GuidedReflectionFlow } from '@/types/journalEntry';
import { localizedFields } from '@/lib/i18n/staticText';

const ENGLISH_GUIDED_REFLECTION_FLOWS: GuidedReflectionFlow[] = [
  {
    id: 'gf_emotional_spiral',
    title: 'Emotional Spiral Reflection',
    description: 'Slow down and trace what happened from trigger to reaction',
    emoji: '🌀',
    category: 'emotional',
    estimatedMinutes: 4,
    isPremium: false,
    steps: [
      {
        id: 'es1',
        prompt: 'What happened? Describe the event or moment that started this.',
        placeholder: 'Something happened that set things off...',
      },
      {
        id: 'es2',
        prompt: 'What was the first emotion you noticed?',
        placeholder: 'I first felt...',
      },
      {
        id: 'es3',
        prompt: 'What interpretation did your mind make?',
        placeholder: 'My mind told me that...',
      },
      {
        id: 'es4',
        prompt: 'What did you feel the urge to do?',
        placeholder: 'I wanted to...',
      },
      {
        id: 'es5',
        prompt: 'What did you actually do?',
        placeholder: 'I ended up...',
      },
      {
        id: 'es6',
        prompt: 'Looking back, is there another way to see what happened?',
        placeholder: 'Maybe it could also mean...',
        optional: true,
      },
    ],
  },
  {
    id: 'gf_relationship_conflict',
    title: 'Relationship Conflict Reflection',
    description: 'Process a difficult interaction with someone',
    emoji: '💬',
    category: 'relationship',
    estimatedMinutes: 5,
    isPremium: false,
    steps: [
      {
        id: 'rc1',
        prompt: 'Who was the conflict with, and what happened?',
        placeholder: 'The conflict was with... and what happened was...',
      },
      {
        id: 'rc2',
        prompt: 'What did their behavior mean to you? What story did your mind create?',
        placeholder: 'I interpreted it as...',
      },
      {
        id: 'rc3',
        prompt: 'What emotion came up most strongly?',
        placeholder: 'The strongest feeling was...',
      },
      {
        id: 'rc4',
        prompt: 'What need of yours felt unmet?',
        placeholder: 'I needed...',
      },
      {
        id: 'rc5',
        prompt: 'If you could respond from your wisest self, what would you say or do?',
        placeholder: 'My wisest self would...',
      },
    ],
  },
  {
    id: 'gf_urge_surfing',
    title: 'Urge Surfing Reflection',
    description: 'Ride the wave of an urge without acting on it',
    emoji: '🏄',
    category: 'coping',
    estimatedMinutes: 3,
    isPremium: false,
    steps: [
      {
        id: 'us1',
        prompt: 'What urge are you experiencing right now?',
        placeholder: 'Right now I feel the urge to...',
      },
      {
        id: 'us2',
        prompt: 'Where do you feel it in your body?',
        placeholder: 'I notice it in my...',
      },
      {
        id: 'us3',
        prompt: 'On a scale of 1-10, how intense is it?',
        placeholder: 'The intensity is about...',
      },
      {
        id: 'us4',
        prompt: 'What would happen if you rode this wave without acting? What would 10 minutes from now look like?',
        placeholder: 'If I wait, I think...',
      },
    ],
  },
  {
    id: 'gf_shame_recovery',
    title: 'Shame Recovery',
    description: 'Gently process and reduce shame after a difficult moment',
    emoji: '🫂',
    category: 'emotional',
    estimatedMinutes: 4,
    isPremium: true,
    steps: [
      {
        id: 'sr1',
        prompt: 'What happened that brought up shame?',
        placeholder: 'I feel shame about...',
      },
      {
        id: 'sr2',
        prompt: 'What does shame tell you about yourself?',
        placeholder: 'Shame says I am...',
      },
      {
        id: 'sr3',
        prompt: 'Is that the full truth? What would a compassionate friend say?',
        placeholder: 'A friend might say...',
      },
      {
        id: 'sr4',
        prompt: 'What is one kind thing you can say to yourself right now?',
        placeholder: 'I want to tell myself...',
      },
    ],
  },
  {
    id: 'gf_trigger_analysis',
    title: 'Trigger Analysis',
    description: 'Understand what triggered you and why',
    emoji: '🔍',
    category: 'emotional',
    estimatedMinutes: 4,
    isPremium: true,
    steps: [
      {
        id: 'ta1',
        prompt: 'What exactly triggered you?',
        placeholder: 'The trigger was...',
      },
      {
        id: 'ta2',
        prompt: 'What did this remind you of? Is there an older experience connected to this?',
        placeholder: 'This reminds me of...',
      },
      {
        id: 'ta3',
        prompt: 'What belief about yourself or others got activated?',
        placeholder: 'The belief that got triggered was...',
      },
      {
        id: 'ta4',
        prompt: 'Knowing this, what would help you respond differently next time?',
        placeholder: 'Next time I could try...',
      },
    ],
  },
  {
    id: 'gf_secure_communication',
    title: 'Secure Communication Planning',
    description: 'Prepare to communicate a need or boundary',
    emoji: '🛡️',
    category: 'relationship',
    estimatedMinutes: 5,
    isPremium: true,
    steps: [
      {
        id: 'sc1',
        prompt: 'What do you need to communicate?',
        placeholder: 'I need to express...',
      },
      {
        id: 'sc2',
        prompt: 'What feeling is driving this need?',
        placeholder: 'I feel... because...',
      },
      {
        id: 'sc3',
        prompt: 'What are you afraid might happen if you say it?',
        placeholder: 'I worry that...',
      },
      {
        id: 'sc4',
        prompt: 'What is the most honest and calm way to say this?',
        placeholder: 'I could say something like...',
      },
      {
        id: 'sc5',
        prompt: 'What boundary or outcome would feel okay?',
        placeholder: 'I would feel okay if...',
        optional: true,
      },
    ],
  },
  {
    id: 'gf_self_compassion',
    title: 'Self-Compassion After Conflict',
    description: 'Be gentle with yourself after a hard moment',
    emoji: '💛',
    category: 'growth',
    estimatedMinutes: 3,
    isPremium: false,
    steps: [
      {
        id: 'sca1',
        prompt: 'What happened that was difficult?',
        placeholder: 'The difficult thing was...',
      },
      {
        id: 'sca2',
        prompt: 'How are you feeling about yourself right now?',
        placeholder: 'Right now I feel...',
      },
      {
        id: 'sca3',
        prompt: 'What would you say to someone you love if they were going through this?',
        placeholder: "I'd tell them...",
      },
      {
        id: 'sca4',
        prompt: 'Can you offer yourself that same kindness?',
        placeholder: 'I want to remember that...',
      },
    ],
  },
  {
    id: 'gf_therapy_prep',
    title: 'Therapy Prep',
    description: 'Organize your thoughts before your next session',
    emoji: '📋',
    category: 'therapy',
    estimatedMinutes: 5,
    isPremium: true,
    steps: [
      {
        id: 'tp1',
        prompt: 'What has been hardest lately?',
        placeholder: 'The hardest thing has been...',
      },
      {
        id: 'tp2',
        prompt: 'What pattern do you want to understand better?',
        placeholder: 'I keep noticing...',
      },
      {
        id: 'tp3',
        prompt: 'What specific moments or events do you want to discuss?',
        placeholder: 'I want to talk about...',
      },
      {
        id: 'tp4',
        prompt: 'What are you unsure about right now?',
        placeholder: 'I\'m uncertain about...',
      },
      {
        id: 'tp5',
        prompt: 'What do you want to get from this session?',
        placeholder: 'I hope to...',
        optional: true,
      },
    ],
  },
  {
    id: 'gf_reframe_uncertainty',
    title: 'Reframe Uncertainty',
    description: 'Challenge the need for certainty in relationships',
    emoji: '🌫️',
    category: 'relationship',
    estimatedMinutes: 4,
    isPremium: true,
    steps: [
      {
        id: 'ru1',
        prompt: 'What are you uncertain about right now?',
        placeholder: 'I don\'t know if...',
      },
      {
        id: 'ru2',
        prompt: 'What does your mind tell you this uncertainty means?',
        placeholder: 'My mind says it means...',
      },
      {
        id: 'ru3',
        prompt: 'What would you tell a friend who felt this same uncertainty?',
        placeholder: 'I\'d remind them that...',
      },
      {
        id: 'ru4',
        prompt: 'What can you do right now that does not require certainty?',
        placeholder: 'I can still...',
      },
    ],
  },
  {
    id: 'gf_gratitude_stability',
    title: 'Gratitude & Stability',
    description: 'Notice moments of calm and what you appreciate',
    emoji: '🌿',
    category: 'growth',
    estimatedMinutes: 3,
    isPremium: false,
    steps: [
      {
        id: 'gs1',
        prompt: 'Name three small things you are grateful for today.',
        placeholder: 'I appreciate...',
      },
      {
        id: 'gs2',
        prompt: 'Was there a moment today where you felt safe or calm?',
        placeholder: 'I felt calm when...',
      },
      {
        id: 'gs3',
        prompt: 'What is one thing about yourself you can acknowledge today?',
        placeholder: 'I want to recognize that I...',
      },
    ],
  },
  {
    id: 'gf_values_aligned',
    title: 'Values-Aligned Response',
    description: 'Choose a response that matches who you want to be',
    emoji: '🧭',
    category: 'growth',
    estimatedMinutes: 4,
    isPremium: true,
    steps: [
      {
        id: 'va1',
        prompt: 'What situation are you navigating?',
        placeholder: 'The situation is...',
      },
      {
        id: 'va2',
        prompt: 'What do your emotions want you to do?',
        placeholder: 'My emotions are pushing me to...',
      },
      {
        id: 'va3',
        prompt: 'What values matter most to you in this situation?',
        placeholder: 'The values I care about here are...',
      },
      {
        id: 'va4',
        prompt: 'What would a response look like that honors those values?',
        placeholder: 'A values-aligned response would be...',
      },
    ],
  },
];

type GuidedFlowLocalizedCopy = Pick<GuidedReflectionFlow, 'title' | 'description'> & {
  steps: Record<string, Pick<GuidedReflectionFlow['steps'][number], 'prompt' | 'placeholder'>>;
};

const GUIDED_REFLECTION_FLOW_SPANISH: Record<string, GuidedFlowLocalizedCopy> = {
  gf_emotional_spiral: {
    title: 'Reflexión sobre espiral emocional',
    description: 'Baja la velocidad y sigue lo que pasó desde el disparador hasta la reacción',
    steps: {
      es1: { prompt: '¿Qué pasó? Describe el evento o momento que empezó esto.', placeholder: 'Pasó algo que activó todo...' },
      es2: { prompt: '¿Cuál fue la primera emoción que notaste?', placeholder: 'Primero sentí...' },
      es3: { prompt: '¿Qué interpretación hizo tu mente?', placeholder: 'Mi mente me dijo que...' },
      es4: { prompt: '¿Qué sentiste el impulso de hacer?', placeholder: 'Quería...' },
      es5: { prompt: '¿Qué hiciste en realidad?', placeholder: 'Terminé...' },
      es6: { prompt: 'Mirando hacia atrás, ¿hay otra forma de ver lo que pasó?', placeholder: 'Quizá también podría significar...', },
    },
  },
  gf_relationship_conflict: {
    title: 'Reflexión sobre conflicto relacional',
    description: 'Procesa una interacción difícil con alguien',
    steps: {
      rc1: { prompt: '¿Con quién fue el conflicto y qué pasó?', placeholder: 'El conflicto fue con... y lo que pasó fue...' },
      rc2: { prompt: '¿Qué significó su conducta para ti? ¿Qué historia creó tu mente?', placeholder: 'Lo interpreté como...' },
      rc3: { prompt: '¿Qué emoción apareció con más fuerza?', placeholder: 'La emoción más fuerte fue...' },
      rc4: { prompt: '¿Qué necesidad tuya se sintió no atendida?', placeholder: 'Necesitaba...' },
      rc5: { prompt: 'Si pudieras responder desde tu yo más sabio, ¿qué dirías o harías?', placeholder: 'Mi yo más sabio...' },
    },
  },
  gf_urge_surfing: {
    title: 'Reflexión para surfear impulsos',
    description: 'Atraviesa la ola de un impulso sin actuarlo',
    steps: {
      us1: { prompt: '¿Qué impulso estás experimentando ahora?', placeholder: 'Ahora siento el impulso de...' },
      us2: { prompt: '¿Dónde lo sientes en el cuerpo?', placeholder: 'Lo noto en mi...' },
      us3: { prompt: 'En una escala del 1 al 10, ¿qué tan intenso es?', placeholder: 'La intensidad está alrededor de...' },
      us4: { prompt: '¿Qué pasaría si atravesaras esta ola sin actuar? ¿Cómo se verían los próximos 10 minutos?', placeholder: 'Si espero, creo que...' },
    },
  },
  gf_shame_recovery: {
    title: 'Recuperación de la vergüenza',
    description: 'Procesa y reduce la vergüenza con suavidad después de un momento difícil',
    steps: {
      sr1: { prompt: '¿Qué pasó que activó vergüenza?', placeholder: 'Siento vergüenza por...' },
      sr2: { prompt: '¿Qué te dice la vergüenza sobre ti?', placeholder: 'La vergüenza dice que soy...' },
      sr3: { prompt: '¿Esa es toda la verdad? ¿Qué diría un amigo compasivo?', placeholder: 'Un amigo podría decir...' },
      sr4: { prompt: '¿Qué cosa amable puedes decirte ahora?', placeholder: 'Quiero decirme...' },
    },
  },
  gf_trigger_analysis: {
    title: 'Análisis del disparador',
    description: 'Entiende qué te activó y por qué',
    steps: {
      ta1: { prompt: '¿Qué te disparó exactamente?', placeholder: 'El disparador fue...' },
      ta2: { prompt: '¿A qué te recordó esto? ¿Hay una experiencia anterior conectada?', placeholder: 'Esto me recuerda a...' },
      ta3: { prompt: '¿Qué creencia sobre ti o sobre otras personas se activó?', placeholder: 'La creencia que se activó fue...' },
      ta4: { prompt: 'Sabiendo esto, ¿qué te ayudaría a responder diferente la próxima vez?', placeholder: 'La próxima vez podría intentar...' },
    },
  },
  gf_secure_communication: {
    title: 'Plan de comunicación segura',
    description: 'Prepárate para comunicar una necesidad o un límite',
    steps: {
      sc1: { prompt: '¿Qué necesitas comunicar?', placeholder: 'Necesito expresar...' },
      sc2: { prompt: '¿Qué emoción impulsa esta necesidad?', placeholder: 'Siento... porque...' },
      sc3: { prompt: '¿Qué temes que pueda pasar si lo dices?', placeholder: 'Me preocupa que...' },
      sc4: { prompt: '¿Cuál es la forma más honesta y calmada de decirlo?', placeholder: 'Podría decir algo como...' },
      sc5: { prompt: '¿Qué límite o resultado se sentiría bien?', placeholder: 'Me sentiría bien si...' },
    },
  },
  gf_self_compassion: {
    title: 'Autocompasión después del conflicto',
    description: 'Trátate con suavidad después de un momento difícil',
    steps: {
      sca1: { prompt: '¿Qué pasó que fue difícil?', placeholder: 'Lo difícil fue...' },
      sca2: { prompt: '¿Cómo te sientes contigo ahora?', placeholder: 'Ahora me siento...' },
      sca3: { prompt: '¿Qué le dirías a alguien que amas si estuviera pasando por esto?', placeholder: 'Le diría...' },
      sca4: { prompt: '¿Puedes ofrecerte esa misma amabilidad?', placeholder: 'Quiero recordar que...' },
    },
  },
  gf_therapy_prep: {
    title: 'Preparación para terapia',
    description: 'Ordena tus pensamientos antes de tu próxima sesión',
    steps: {
      tp1: { prompt: '¿Qué ha sido lo más difícil últimamente?', placeholder: 'Lo más difícil ha sido...' },
      tp2: { prompt: '¿Qué patrón quieres entender mejor?', placeholder: 'Sigo notando...' },
      tp3: { prompt: '¿Qué momentos o eventos específicos quieres hablar?', placeholder: 'Quiero hablar de...' },
      tp4: { prompt: '¿Sobre qué te sientes inseguro/a ahora?', placeholder: 'No tengo claridad sobre...' },
      tp5: { prompt: '¿Qué quieres obtener de esta sesión?', placeholder: 'Espero...' },
    },
  },
  gf_reframe_uncertainty: {
    title: 'Reencuadrar la incertidumbre',
    description: 'Cuestiona la necesidad de certeza en las relaciones',
    steps: {
      ru1: { prompt: '¿Sobre qué sientes incertidumbre ahora?', placeholder: 'No sé si...' },
      ru2: { prompt: '¿Qué te dice tu mente que significa esta incertidumbre?', placeholder: 'Mi mente dice que significa...' },
      ru3: { prompt: '¿Qué le dirías a un amigo que sintiera esta misma incertidumbre?', placeholder: 'Le recordaría que...' },
      ru4: { prompt: '¿Qué puedes hacer ahora que no requiera certeza?', placeholder: 'Todavía puedo...' },
    },
  },
  gf_gratitude_stability: {
    title: 'Gratitud y estabilidad',
    description: 'Nota momentos de calma y lo que aprecias',
    steps: {
      gs1: { prompt: 'Nombra tres cosas pequeñas por las que sientes gratitud hoy.', placeholder: 'Aprecio...' },
      gs2: { prompt: '¿Hubo un momento hoy en que te sentiste seguro/a o en calma?', placeholder: 'Me sentí en calma cuando...' },
      gs3: { prompt: '¿Qué cosa de ti puedes reconocer hoy?', placeholder: 'Quiero reconocer que yo...' },
    },
  },
  gf_values_aligned: {
    title: 'Respuesta alineada con valores',
    description: 'Elige una respuesta que coincida con quien quieres ser',
    steps: {
      va1: { prompt: '¿Qué situación estás atravesando?', placeholder: 'La situación es...' },
      va2: { prompt: '¿Qué quieren que hagas tus emociones?', placeholder: 'Mis emociones me empujan a...' },
      va3: { prompt: '¿Qué valores te importan más en esta situación?', placeholder: 'Los valores que me importan aquí son...' },
      va4: { prompt: '¿Cómo sería una respuesta que honre esos valores?', placeholder: 'Una respuesta alineada con mis valores sería...' },
    },
  },
};

function localizeGuidedReflectionFlow(flow: GuidedReflectionFlow): GuidedReflectionFlow {
  const spanish = GUIDED_REFLECTION_FLOW_SPANISH[flow.id];
  if (!spanish) {
    return flow;
  }

  localizedFields(flow, {
    title: { en: flow.title, es: spanish.title },
    description: { en: flow.description, es: spanish.description },
  });

  flow.steps = flow.steps.map((step) => {
    const spanishStep = spanish.steps[step.id];
    if (!spanishStep) {
      return step;
    }

    return localizedFields(step, {
      prompt: { en: step.prompt, es: spanishStep.prompt },
      placeholder: { en: step.placeholder, es: spanishStep.placeholder },
    }) as GuidedReflectionFlow['steps'][number];
  });

  return flow;
}

export const GUIDED_REFLECTION_FLOWS: GuidedReflectionFlow[] =
  ENGLISH_GUIDED_REFLECTION_FLOWS.map(localizeGuidedReflectionFlow);
