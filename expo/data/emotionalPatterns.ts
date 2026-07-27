import { EmotionalPattern } from '@/types/learningPath';
import { localizedArrayProxy, localizedFields } from '@/lib/i18n/staticText';

const ENGLISH_EMOTIONAL_PATTERNS: EmotionalPattern[] = [
  {
    id: 'pattern-rejection-sensitivity',
    title: 'Rejection Sensitivity',
    subtitle: 'When small signals feel like total rejection',
    icon: 'shield-alert',
    color: '#3B82F6',
    description: 'Rejection sensitivity means your nervous system responds to possible rejection the way most people respond to actual danger. A delayed text, a shift in tone, or a cancelled plan can trigger feelings of abandonment that feel absolutely real — even when the other person had no intention of rejecting you.',
    howItWorks: 'Your brain has learned from early experiences that disconnection is dangerous. So it scans constantly for signs of rejection and sounds the alarm at the slightest hint. This alarm is so fast it bypasses your rational mind. You feel the rejection before you can evaluate whether it is real.',
    commonTriggers: [
      'Delayed or short text responses',
      'Changes in someone\'s tone of voice',
      'Cancelled or rescheduled plans',
      'Someone seeming distracted',
      'Not being included in a group',
      'Perceived favoritism toward others',
      'Ambiguous social cues',
    ],
    whatItFeelsLike: [
      'Sudden intense anxiety or panic',
      'A sinking feeling in your stomach',
      'Overwhelming urge to reach out or check in',
      'Anger that flares instantly',
      'Desire to withdraw completely',
      'Feeling worthless or unlovable',
      'Racing thoughts about what you did wrong',
    ],
    helpfulStrategies: [
      'Pause before reacting — the alarm is not always accurate',
      'Check the facts: What do I actually know vs. what am I assuming?',
      'Notice the body sensation and name it',
      'Ask yourself: "Will I feel this way in 24 hours?"',
      'Use grounding before making decisions',
      'Practice opposite action when the urge is to withdraw or lash out',
    ],
    relatedToolIds: ['check-the-facts', 'stop-skill', 'grounding'],
    relatedLessonIds: ['ta-1', 'ta-2', 'rel-1', 'rel-4'],
    reflectionQuestions: [
      'When was the last time you felt rejected? What actually happened vs. what you interpreted?',
      'What does rejection mean to you at a deeper level?',
      'Can you think of a time your rejection alarm was wrong?',
    ],
  },
  {
    id: 'pattern-emotional-escalation',
    title: 'Emotional Escalation',
    subtitle: 'When feelings spiral from 0 to 10',
    icon: 'trending-up',
    color: '#67E8F9',
    description: 'Emotional escalation is when a triggering event causes emotions to rapidly intensify beyond what the situation seems to call for. A small frustration becomes rage. A moment of sadness becomes despair. This happens because your emotional system reacts faster than your cognitive system can process.',
    howItWorks: 'Your amygdala fires before your prefrontal cortex has time to evaluate the situation. Each emotional wave builds on the previous one. One thought leads to another, each more intense, creating a snowball effect. Without intervention, the emotion takes over completely.',
    commonTriggers: [
      'Feeling misunderstood',
      'Being criticized or corrected',
      'Unexpected changes to plans',
      'Feeling ignored or dismissed',
      'Physical exhaustion or hunger',
      'Ruminating on past events',
      'Accumulation of small stressors',
    ],
    whatItFeelsLike: [
      'Emotions hitting like a wall',
      'Feeling out of control',
      'Body heat, shaking, or tightness',
      'Thoughts racing too fast to catch',
      'Saying or doing things you later regret',
      'Feeling like the intensity will never end',
    ],
    helpfulStrategies: [
      'Intervene early — the sooner you notice, the easier it is to manage',
      'Use TIPP skills to change your body chemistry quickly',
      'Remove yourself from the situation briefly if possible',
      'Practice the STOP skill: Stop, Take a breath, Observe, Proceed mindfully',
      'Use temperature change (cold water on face or wrists)',
      'Wait 10 minutes before acting on intense urges',
    ],
    relatedToolIds: ['stop-skill', 'tipp', 'grounding', 'urge-surfing'],
    relatedLessonIds: ['er-1', 'er-2', 'er-5', 'cs-1'],
    reflectionQuestions: [
      'What was the first small signal before your last escalation?',
      'What does your body feel like when emotions are starting to build?',
      'What has helped you de-escalate in the past?',
    ],
  },
  {
    id: 'pattern-shame-spiral',
    title: 'Shame Spirals',
    subtitle: 'When one mistake makes you feel fundamentally broken',
    icon: 'arrow-down-circle',
    color: '#3B82F6',
    description: 'A shame spiral is when a single event — a mistake, a conflict, an impulsive action — triggers a cascade of self-blame that goes from "I did something bad" to "I am bad." Unlike guilt, which says "I made a mistake," shame says "I am the mistake."',
    howItWorks: 'Shame often starts with a real event but quickly becomes about your identity. Your mind searches for evidence that confirms the worst version of yourself. Each memory it finds adds fuel. The spiral deepens until the original event is dwarfed by the weight of self-hatred.',
    commonTriggers: [
      'Making a mistake in public',
      'Overreacting and knowing it',
      'Being called out or criticized',
      'Losing control of emotions',
      'Saying something hurtful during conflict',
      'Comparing yourself to others',
      'Remembering past failures',
    ],
    whatItFeelsLike: [
      'Wanting to disappear',
      'Intense self-hatred',
      'Replaying the event over and over',
      'Feeling fundamentally flawed',
      'Withdrawing from everyone',
      'Physical heaviness or nausea',
      'Believing you deserve punishment',
    ],
    helpfulStrategies: [
      'Distinguish shame from guilt: "I did something" vs "I am something"',
      'Ask: "What would I say to a friend in this exact situation?"',
      'Practice radical acceptance of the event without accepting the shame narrative',
      'Reach out to someone safe instead of isolating',
      'Write down what actually happened vs. the story you are telling',
      'Remember: everyone makes mistakes. Mistakes are not identity.',
    ],
    relatedToolIds: ['self-soothe', 'opposite-action', 'wise-mind'],
    relatedLessonIds: ['is-2', 'is-3', 'is-4', 'th-5'],
    reflectionQuestions: [
      'What triggered your last shame spiral? What was the event vs. the story?',
      'What core belief about yourself does shame activate?',
      'What would self-respect look like right now?',
    ],
  },
  {
    id: 'pattern-rumination-loops',
    title: 'Rumination Loops',
    subtitle: 'When your mind won\'t stop replaying',
    icon: 'repeat',
    color: '#67E8F9',
    description: 'Rumination is when your mind gets stuck replaying a conversation, event, or worry on an endless loop. It feels like you are trying to solve something, but you are actually just re-experiencing the pain. Rumination intensifies emotions instead of resolving them.',
    howItWorks: 'Your brain believes that if you think about it enough, you will find an answer or feel better. But rumination is not problem-solving — it is re-living. Each replay reactivates the same emotional response, keeping the wound fresh and preventing natural emotional processing.',
    commonTriggers: [
      'Unresolved conflicts',
      'Ambiguous situations (not knowing where you stand)',
      'Perceived mistakes or embarrassments',
      'Waiting for a response from someone',
      'Being alone late at night',
      'Feeling powerless to change something',
    ],
    whatItFeelsLike: [
      'Playing the same conversation over and over',
      'Inability to focus on anything else',
      'Growing more upset with each replay',
      'Exhaustion without resolution',
      'Analyzing every word and gesture',
      'Feeling stuck and unable to move on',
    ],
    helpfulStrategies: [
      'Set a "worry window" — give yourself 10 minutes, then stop',
      'Ask: "Am I solving or re-living?"',
      'Use grounding to bring yourself to the present moment',
      'Move your body — physical activity interrupts mental loops',
      'Write it down once, then close the notebook',
      'Practice the "describe" mindfulness skill: observe without judging',
    ],
    relatedToolIds: ['grounding', 'mindfulness', 'urge-surfing'],
    relatedLessonIds: ['er-5', 'er-6', 'ta-3', 'cs-2'],
    reflectionQuestions: [
      'What is your mind trying to solve right now?',
      'If you had the answer, what would change?',
      'What would happen if you let this thought go for just one hour?',
    ],
  },
  {
    id: 'pattern-push-pull',
    title: 'Relationship Push-Pull',
    subtitle: 'Wanting closeness but fearing it',
    icon: 'git-pull-request',
    color: '#3B82F6',
    description: 'The push-pull pattern is when you desperately want closeness but feel terrified when you get it. You pull someone close, then push them away when vulnerability feels too dangerous. This creates a cycle of intensity and withdrawal that confuses both you and the other person.',
    howItWorks: 'When someone gets close, your attachment system activates fear of engulfment or loss of identity. When they pull back (often because you pushed), your abandonment system activates. You cycle between "I need you" and "stay away from me" — not because you are confused about what you want, but because both states feel genuinely threatening.',
    commonTriggers: [
      'Someone expressing strong feelings for you',
      'Feeling too dependent on someone',
      'Perceived changes in how someone treats you',
      'Intimacy milestones (commitment, moving in)',
      'After vulnerability, feeling exposed',
      'Fear of being "too much" for someone',
    ],
    whatItFeelsLike: [
      'Craving connection then feeling suffocated',
      'Idealizing then suddenly devaluing someone',
      'Intense love followed by intense doubt',
      'Guilt after pushing someone away',
      'Panic after letting someone in',
      'Feeling like you ruin every relationship',
    ],
    helpfulStrategies: [
      'Name the pattern when you notice it: "This is push-pull"',
      'Communicate what you are feeling instead of acting on it',
      'Use GIVE skills to stay in relationship even when it is hard',
      'Practice staying present with discomfort instead of reacting',
      'Ask: "Am I responding to this person, or to a fear?"',
      'Develop a "relationship anchor statement" for triggering moments',
    ],
    relatedToolIds: ['check-the-facts', 'dear-man', 'wise-mind'],
    relatedLessonIds: ['rel-1', 'rel-2', 'rel-3', 'ta-1'],
    reflectionQuestions: [
      'When do you most often push people away?',
      'What are you protecting yourself from?',
      'What would it feel like to stay close even when it feels scary?',
    ],
  },
];

type EmotionalPatternLocalizedCopy = Pick<
  EmotionalPattern,
  | 'title'
  | 'subtitle'
  | 'description'
  | 'howItWorks'
  | 'commonTriggers'
  | 'whatItFeelsLike'
  | 'helpfulStrategies'
  | 'reflectionQuestions'
>;

const EMOTIONAL_PATTERN_SPANISH: Record<string, EmotionalPatternLocalizedCopy> = {
  'pattern-rejection-sensitivity': {
    title: 'Sensibilidad al rechazo',
    subtitle: 'Cuando señales pequeñas se sienten como rechazo total',
    description: 'La sensibilidad al rechazo significa que tu sistema nervioso responde a un posible rechazo como si fuera peligro real. Un mensaje demorado, un cambio de tono o un plan cancelado pueden activar sensaciones de abandono que se sienten totalmente reales, incluso si la otra persona no tenía intención de rechazarte.',
    howItWorks: 'Tu cerebro aprendió de experiencias tempranas que la desconexión puede ser peligrosa. Por eso escanea constantemente señales de rechazo y enciende la alarma ante el indicio más pequeño. Esa alarma es tan rápida que pasa por alto la parte racional. Sientes el rechazo antes de poder evaluar si es real.',
    commonTriggers: [
      'Respuestas demoradas o cortas por mensaje',
      'Cambios en el tono de voz de alguien',
      'Planes cancelados o reprogramados',
      'Alguien que parece distraído',
      'No ser incluido/a en un grupo',
      'Favoritismo percibido hacia otras personas',
      'Señales sociales ambiguas',
    ],
    whatItFeelsLike: [
      'Ansiedad o pánico intenso y repentino',
      'Una sensación de vacío en el estómago',
      'Impulso abrumador de escribir o pedir confirmación',
      'Enojo que aparece de golpe',
      'Deseo de retirarte por completo',
      'Sentirte sin valor o no querible',
      'Pensamientos acelerados sobre qué hiciste mal',
    ],
    helpfulStrategies: [
      'Pausa antes de reaccionar: la alarma no siempre está en lo cierto',
      'Revisa los hechos: ¿qué sé realmente y qué estoy suponiendo?',
      'Nota la sensación corporal y ponle nombre',
      'Pregúntate: "¿Me sentiré así en 24 horas?"',
      'Usa anclaje antes de tomar decisiones',
      'Practica acción opuesta cuando el impulso sea retirarte o atacar',
    ],
    reflectionQuestions: [
      '¿Cuándo fue la última vez que te sentiste rechazado/a? ¿Qué pasó realmente y qué interpretaste?',
      '¿Qué significa el rechazo para ti en un nivel más profundo?',
      '¿Puedes recordar una vez en que tu alarma de rechazo se equivocó?',
    ],
  },
  'pattern-emotional-escalation': {
    title: 'Escalada emocional',
    subtitle: 'Cuando las emociones suben de 0 a 10',
    description: 'La escalada emocional ocurre cuando un disparador hace que las emociones se intensifiquen rápidamente más allá de lo que la situación parece requerir. Una frustración pequeña se vuelve ira. Un momento de tristeza se vuelve desesperanza. Esto pasa porque tu sistema emocional reacciona más rápido de lo que tu sistema cognitivo puede procesar.',
    howItWorks: 'La amígdala se activa antes de que la corteza prefrontal tenga tiempo de evaluar la situación. Cada ola emocional se suma a la anterior. Un pensamiento lleva a otro, cada vez más intenso, creando un efecto bola de nieve. Sin intervención, la emoción toma el control.',
    commonTriggers: [
      'Sentirte incomprendido/a',
      'Recibir crítica o corrección',
      'Cambios inesperados de planes',
      'Sentirte ignorado/a o descartado/a',
      'Cansancio físico o hambre',
      'Rumiar eventos pasados',
      'Acumulación de pequeños estresores',
    ],
    whatItFeelsLike: [
      'Emociones que golpean como una pared',
      'Sentirte fuera de control',
      'Calor corporal, temblores o tensión',
      'Pensamientos que corren demasiado rápido',
      'Decir o hacer cosas que luego lamentas',
      'Sentir que la intensidad nunca va a terminar',
    ],
    helpfulStrategies: [
      'Intervén temprano: mientras antes lo notes, más fácil será manejarlo',
      'Usa habilidades TIPP para cambiar rápido la química corporal',
      'Aléjate brevemente de la situación si es posible',
      'Practica STOP: Detente, respira, observa y procede con atención',
      'Usa cambio de temperatura, como agua fría en la cara o muñecas',
      'Espera 10 minutos antes de actuar sobre impulsos intensos',
    ],
    reflectionQuestions: [
      '¿Cuál fue la primera señal pequeña antes de tu última escalada?',
      '¿Qué siente tu cuerpo cuando las emociones empiezan a subir?',
      '¿Qué te ha ayudado a bajar la intensidad en el pasado?',
    ],
  },
  'pattern-shame-spiral': {
    title: 'Espirales de vergüenza',
    subtitle: 'Cuando un error te hace sentir fundamentalmente roto/a',
    description: 'Una espiral de vergüenza ocurre cuando un solo evento, como un error, un conflicto o una acción impulsiva, activa una cascada de autoculpa que pasa de "hice algo malo" a "soy malo/a". A diferencia de la culpa, que dice "cometí un error", la vergüenza dice "yo soy el error".',
    howItWorks: 'La vergüenza suele empezar con un evento real, pero rápidamente se vuelve una historia sobre tu identidad. Tu mente busca evidencia que confirme la peor versión de ti. Cada recuerdo que encuentra agrega combustible. La espiral se profundiza hasta que el evento original queda opacado por el peso del autodesprecio.',
    commonTriggers: [
      'Cometer un error en público',
      'Sobrerreaccionar y darte cuenta',
      'Que alguien te confronte o critique',
      'Perder el control de las emociones',
      'Decir algo hiriente durante un conflicto',
      'Compararte con otras personas',
      'Recordar fracasos pasados',
    ],
    whatItFeelsLike: [
      'Querer desaparecer',
      'Autoodio intenso',
      'Repetir el evento una y otra vez',
      'Sentirte fundamentalmente defectuoso/a',
      'Alejarte de todo el mundo',
      'Pesadez física o náusea',
      'Creer que mereces castigo',
    ],
    helpfulStrategies: [
      'Distingue vergüenza de culpa: "hice algo" no es "soy algo"',
      'Pregunta: "¿Qué le diría a un amigo en esta misma situación?"',
      'Practica aceptación radical del evento sin aceptar la narrativa de vergüenza',
      'Acércate a alguien seguro en vez de aislarte',
      'Escribe lo que pasó realmente y la historia que te estás contando',
      'Recuerda: todas las personas cometen errores. Los errores no son identidad.',
    ],
    reflectionQuestions: [
      '¿Qué activó tu última espiral de vergüenza? ¿Cuál fue el evento y cuál fue la historia?',
      '¿Qué creencia central sobre ti activa la vergüenza?',
      '¿Cómo se vería el autorrespeto en este momento?',
    ],
  },
  'pattern-rumination-loops': {
    title: 'Bucles de rumiación',
    subtitle: 'Cuando tu mente no deja de repetir',
    description: 'La rumiación ocurre cuando tu mente se queda atrapada repitiendo una conversación, evento o preocupación sin parar. Se siente como si intentaras resolver algo, pero en realidad estás reviviendo el dolor. La rumiación intensifica las emociones en vez de resolverlas.',
    howItWorks: 'Tu cerebro cree que si lo piensas lo suficiente encontrarás una respuesta o te sentirás mejor. Pero rumiar no es resolver problemas: es revivir. Cada repetición reactiva la misma respuesta emocional, mantiene la herida abierta e impide el procesamiento natural.',
    commonTriggers: [
      'Conflictos no resueltos',
      'Situaciones ambiguas, como no saber dónde estás parado/a',
      'Errores o vergüenzas percibidas',
      'Esperar una respuesta de alguien',
      'Estar solo/a tarde en la noche',
      'Sentirte sin poder para cambiar algo',
    ],
    whatItFeelsLike: [
      'Repetir la misma conversación una y otra vez',
      'No poder concentrarte en otra cosa',
      'Sentirte más alterado/a con cada repetición',
      'Agotamiento sin resolución',
      'Analizar cada palabra y gesto',
      'Sentirte atascado/a e incapaz de avanzar',
    ],
    helpfulStrategies: [
      'Pon una "ventana de preocupación": date 10 minutos y luego detente',
      'Pregunta: "¿Estoy resolviendo o reviviendo?"',
      'Usa anclaje para volver al momento presente',
      'Mueve el cuerpo: la actividad física interrumpe los bucles mentales',
      'Escríbelo una vez y luego cierra el cuaderno',
      'Practica la habilidad de describir: observa sin juzgar',
    ],
    reflectionQuestions: [
      '¿Qué intenta resolver tu mente ahora?',
      'Si tuvieras la respuesta, ¿qué cambiaría?',
      '¿Qué pasaría si soltaras este pensamiento solo por una hora?',
    ],
  },
  'pattern-push-pull': {
    title: 'Acercar y alejar en relaciones',
    subtitle: 'Querer cercanía y temerla al mismo tiempo',
    description: 'El patrón de acercar y alejar ocurre cuando deseas desesperadamente la cercanía, pero te asusta cuando la recibes. Acercas a alguien y luego lo alejas cuando la vulnerabilidad se siente demasiado peligrosa. Esto crea un ciclo de intensidad y retirada que confunde tanto a ti como a la otra persona.',
    howItWorks: 'Cuando alguien se acerca, tu sistema de apego puede activar miedo a perderte o sentirte absorbido/a. Cuando la persona se distancia, a menudo porque la alejaste, se activa tu sistema de abandono. Oscilas entre "te necesito" y "aléjate", no porque no sepas lo que quieres, sino porque ambos estados se sienten genuinamente amenazantes.',
    commonTriggers: [
      'Alguien expresa sentimientos fuertes por ti',
      'Sentirte demasiado dependiente de alguien',
      'Cambios percibidos en cómo alguien te trata',
      'Hitos de intimidad, como compromiso o vivir juntos',
      'Sentirte expuesto/a después de ser vulnerable',
      'Miedo a ser "demasiado" para alguien',
    ],
    whatItFeelsLike: [
      'Desear conexión y luego sentirte asfixiado/a',
      'Idealizar y luego devaluar de pronto a alguien',
      'Amor intenso seguido de duda intensa',
      'Culpa después de alejar a alguien',
      'Pánico después de dejar entrar a alguien',
      'Sentir que arruinas todas tus relaciones',
    ],
    helpfulStrategies: [
      'Nombra el patrón cuando lo notes: "esto es acercar y alejar"',
      'Comunica lo que sientes en vez de actuarlo',
      'Usa habilidades GIVE para permanecer en la relación aunque sea difícil',
      'Practica quedarte presente con la incomodidad en vez de reaccionar',
      'Pregunta: "¿Estoy respondiendo a esta persona o a un miedo?"',
      'Desarrolla una frase de anclaje relacional para momentos detonantes',
    ],
    reflectionQuestions: [
      '¿Cuándo sueles alejar más a las personas?',
      '¿De qué intentas protegerte?',
      '¿Cómo se sentiría permanecer cerca incluso cuando da miedo?',
    ],
  },
};

function localizeEmotionalPattern(pattern: EmotionalPattern): EmotionalPattern {
  const spanish = EMOTIONAL_PATTERN_SPANISH[pattern.id];
  if (!spanish) {
    return pattern;
  }

  const englishArrays = {
    commonTriggers: pattern.commonTriggers,
    whatItFeelsLike: pattern.whatItFeelsLike,
    helpfulStrategies: pattern.helpfulStrategies,
    reflectionQuestions: pattern.reflectionQuestions,
  };

  localizedFields(pattern, {
    title: { en: pattern.title, es: spanish.title },
    subtitle: { en: pattern.subtitle, es: spanish.subtitle },
    description: { en: pattern.description, es: spanish.description },
    howItWorks: { en: pattern.howItWorks, es: spanish.howItWorks },
  });

  return Object.defineProperties(pattern, {
    commonTriggers: {
      enumerable: true,
      configurable: true,
      get: () => localizedArrayProxy(englishArrays.commonTriggers, spanish.commonTriggers),
    },
    whatItFeelsLike: {
      enumerable: true,
      configurable: true,
      get: () => localizedArrayProxy(englishArrays.whatItFeelsLike, spanish.whatItFeelsLike),
    },
    helpfulStrategies: {
      enumerable: true,
      configurable: true,
      get: () => localizedArrayProxy(englishArrays.helpfulStrategies, spanish.helpfulStrategies),
    },
    reflectionQuestions: {
      enumerable: true,
      configurable: true,
      get: () => localizedArrayProxy(englishArrays.reflectionQuestions, spanish.reflectionQuestions),
    },
  });
}

export const EMOTIONAL_PATTERNS: EmotionalPattern[] = ENGLISH_EMOTIONAL_PATTERNS.map(localizeEmotionalPattern);
