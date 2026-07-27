import { Emotion, Trigger, BodySensation, Urge, CopingExercise } from '@/types';
import { localizedArray, localizedArrayProxy, localizedField, localizedFields } from '@/lib/i18n/staticText';

export const EMOTIONS: Emotion[] = [
  localizedField({ id: 'e1', label: 'Anxious', emoji: '😟' }, 'label', 'Anxious', 'Ansiedad'),
  localizedField({ id: 'e2', label: 'Angry', emoji: '😤' }, 'label', 'Angry', 'Enojo'),
  localizedField({ id: 'e3', label: 'Sad', emoji: '😢' }, 'label', 'Sad', 'Tristeza'),
  localizedField({ id: 'e4', label: 'Empty', emoji: '🫥' }, 'label', 'Empty', 'Vacío'),
  localizedField({ id: 'e5', label: 'Ashamed', emoji: '😞' }, 'label', 'Ashamed', 'Vergüenza'),
  localizedField({ id: 'e6', label: 'Lonely', emoji: '🌧️' }, 'label', 'Lonely', 'Soledad'),
  localizedField({ id: 'e7', label: 'Rejected', emoji: '💔' }, 'label', 'Rejected', 'Rechazo'),
  localizedField({ id: 'e8', label: 'Abandoned', emoji: '🫀' }, 'label', 'Abandoned', 'Abandono'),
  localizedField({ id: 'e9', label: 'Jealous', emoji: '😒' }, 'label', 'Jealous', 'Celos'),
  localizedField({ id: 'e10', label: 'Numb', emoji: '😶' }, 'label', 'Numb', 'Entumecido/a'),
  localizedField({ id: 'e11', label: 'Overwhelmed', emoji: '😵' }, 'label', 'Overwhelmed', 'Abrumado/a'),
  localizedField({ id: 'e12', label: 'Calm', emoji: '🌿' }, 'label', 'Calm', 'Calma'),
  localizedField({ id: 'e13', label: 'Something else', emoji: '✍️' }, 'label', 'Something else', 'Algo más'),
];

export const TRIGGERS: Trigger[] = [
  localizedField({ id: 't1', label: 'Delayed reply', category: 'relationship' }, 'label', 'Delayed reply', 'Respuesta demorada'),
  localizedField({ id: 't2', label: 'Tone change', category: 'relationship' }, 'label', 'Tone change', 'Cambio de tono'),
  localizedField({ id: 't3', label: 'Feeling ignored', category: 'relationship' }, 'label', 'Feeling ignored', 'Sentirme ignorado/a'),
  localizedField({ id: 't4', label: 'Criticism', category: 'relationship' }, 'label', 'Criticism', 'Crítica'),
  localizedField({ id: 't5', label: 'Conflict', category: 'relationship' }, 'label', 'Conflict', 'Conflicto'),
  localizedField({ id: 't6', label: 'Shame', category: 'self' }, 'label', 'Shame', 'Vergüenza'),
  localizedField({ id: 't7', label: 'Loneliness', category: 'situation' }, 'label', 'Loneliness', 'Soledad'),
  localizedField({ id: 't8', label: 'Sleep', category: 'situation' }, 'label', 'Sleep', 'Sueño'),
  localizedField({ id: 't9', label: 'Work/school', category: 'situation' }, 'label', 'Work/school', 'Trabajo/escuela'),
  localizedField({ id: 't10', label: 'Family', category: 'relationship' }, 'label', 'Family', 'Familia'),
  localizedField({ id: 't11', label: 'Money', category: 'situation' }, 'label', 'Money', 'Dinero'),
  localizedField({ id: 't12', label: 'Something else', category: 'other' }, 'label', 'Something else', 'Algo más'),
];

export const BODY_SENSATIONS: BodySensation[] = [
  localizedField({ id: 'b1', label: 'Chest', area: 'chest' }, 'label', 'Chest', 'Pecho'),
  localizedField({ id: 'b2', label: 'Stomach', area: 'stomach' }, 'label', 'Stomach', 'Estómago'),
  localizedField({ id: 'b3', label: 'Throat', area: 'throat' }, 'label', 'Throat', 'Garganta'),
  localizedField({ id: 'b4', label: 'Head', area: 'head' }, 'label', 'Head', 'Cabeza'),
  localizedField({ id: 'b5', label: 'Jaw', area: 'jaw' }, 'label', 'Jaw', 'Mandíbula'),
  localizedField({ id: 'b6', label: 'Shoulders', area: 'shoulders' }, 'label', 'Shoulders', 'Hombros'),
  localizedField({ id: 'b7', label: 'Hands', area: 'hands' }, 'label', 'Hands', 'Manos'),
  localizedField({ id: 'b8', label: 'Whole body / everywhere', area: 'body' }, 'label', 'Whole body / everywhere', 'Todo el cuerpo / en todas partes'),
  localizedField({ id: 'b9', label: 'I don’t know', area: 'unknown' }, 'label', 'I don’t know', 'No lo sé'),
  localizedField({ id: 'b10', label: 'Somewhere else', area: 'other' }, 'label', 'Somewhere else', 'En otro lugar'),
];

export const URGES: Urge[] = [
  localizedField({ id: 'u1', label: 'Text again', risk: 'medium' }, 'label', 'Text again', 'Escribir de nuevo'),
  localizedField({ id: 'u2', label: 'Call repeatedly', risk: 'medium' }, 'label', 'Call repeatedly', 'Llamar repetidamente'),
  localizedField({ id: 'u3', label: 'Argue', risk: 'medium' }, 'label', 'Argue', 'Discutir'),
  localizedField({ id: 'u4', label: 'Withdraw', risk: 'medium' }, 'label', 'Withdraw', 'Aislarme'),
  localizedField({ id: 'u5', label: 'Apologize too much', risk: 'low' }, 'label', 'Apologize too much', 'Disculparme de más'),
  localizedField({ id: 'u6', label: 'Check social media', risk: 'low' }, 'label', 'Check social media', 'Revisar redes sociales'),
  localizedField({ id: 'u7', label: 'Ask for reassurance', risk: 'low' }, 'label', 'Ask for reassurance', 'Pedir seguridad'),
  localizedField({ id: 'u8', label: 'Spend money', risk: 'medium' }, 'label', 'Spend money', 'Gastar dinero'),
  localizedField({ id: 'u9', label: 'Drink/use substances', risk: 'high' }, 'label', 'Drink/use substances', 'Beber/usar sustancias'),
  localizedField({ id: 'u10', label: 'End the relationship', risk: 'high' }, 'label', 'End the relationship', 'Terminar la relación'),
  localizedField({ id: 'u11', label: 'Say something hurtful', risk: 'high' }, 'label', 'Say something hurtful', 'Decir algo hiriente'),
  localizedField({ id: 'u12', label: 'I don’t know', risk: 'low' }, 'label', 'I don’t know', 'No lo sé'),
  localizedField({ id: 'u13', label: 'Something else', risk: 'low' }, 'label', 'Something else', 'Algo más'),
];

export const COPING_EXERCISES: CopingExercise[] = [
  localizedFields({
    id: 'c1',
    title: '5-4-3-2-1 Grounding',
    description: 'Use your senses to anchor yourself in the present moment.',
    category: 'grounding',
    duration: '3 min',
    get steps() {
      return localizedArray([
        'Name 5 things you can SEE right now',
        'Name 4 things you can TOUCH right now',
        'Name 3 things you can HEAR right now',
        'Name 2 things you can SMELL right now',
        'Name 1 thing you can TASTE right now',
        'Take a deep breath. You are here. You are safe.',
      ], [
        'Nombra 5 cosas que puedas VER ahora mismo',
        'Nombra 4 cosas que puedas TOCAR ahora mismo',
        'Nombra 3 cosas que puedas ESCUCHAR ahora mismo',
        'Nombra 2 cosas que puedas OLER ahora mismo',
        'Nombra 1 cosa que puedas SABOREAR ahora mismo',
        'Respira profundo. Estás aquí. Estás a salvo.',
      ]);
    },
  }, {
    title: { en: '5-4-3-2-1 Grounding', es: 'Anclaje 5-4-3-2-1' },
    description: { en: 'Use your senses to anchor yourself in the present moment.', es: 'Usa tus sentidos para anclarte en el momento presente.' },
  }),
  localizedFields({
    id: 'c2',
    title: 'Ice Dive',
    description: 'Activate your dive reflex to quickly reduce emotional intensity.',
    category: 'grounding',
    duration: '1 min',
    get steps() {
      return localizedArray([
        'Fill a bowl with cold water and ice',
        'Hold your breath',
        'Submerge your face for 30 seconds',
        'If no bowl: hold ice cubes in your hands',
        'Focus on the physical sensation',
        'Notice how your heart rate slows down',
      ], [
        'Llena un recipiente con agua fría y hielo',
        'Contén la respiración',
        'Sumerge la cara durante 30 segundos',
        'Si no tienes recipiente: sostén cubos de hielo en las manos',
        'Concéntrate en la sensación física',
        'Nota cómo baja tu ritmo cardíaco',
      ]);
    },
  }, {
    title: { en: 'Ice Dive', es: 'Inmersión fría' },
    description: { en: 'Activate your dive reflex to quickly reduce emotional intensity.', es: 'Activa el reflejo de inmersión para bajar rápido la intensidad emocional.' },
  }),
  localizedFields({
    id: 'c3',
    title: 'Self-Soothe Kit',
    description: 'Comfort yourself through your senses, like caring for a friend.',
    category: 'self-soothing',
    duration: '5 min',
    get steps() {
      return localizedArray([
        'Wrap yourself in something soft and warm',
        'Put on calming music or nature sounds',
        'Make a warm drink — tea, cocoa, anything comforting',
        'Light a candle or use a scent you love',
        'Place one hand on your heart, one on your belly',
        'Say: "This is hard, and I\'m allowed to take care of myself."',
      ], [
        'Envuélvete en algo suave y cálido',
        'Pon música tranquila o sonidos de la naturaleza',
        'Prepara una bebida caliente: té, cacao o algo reconfortante',
        'Enciende una vela o usa un aroma que te guste',
        'Coloca una mano en el corazón y otra en el abdomen',
        'Di: "Esto es difícil, y tengo permiso para cuidarme."',
      ]);
    },
  }, {
    title: { en: 'Self-Soothe Kit', es: 'Kit de autoconsuelo' },
    description: { en: 'Comfort yourself through your senses, like caring for a friend.', es: 'Consuélate a través de los sentidos, como cuidarías a una amistad.' },
  }),
  localizedFields({
    id: 'c4',
    title: 'Compassionate Letter',
    description: 'Write to yourself the way a loving friend would.',
    category: 'self-soothing',
    duration: '5 min',
    get steps() {
      return localizedArray([
        'Imagine someone who deeply loves you',
        'What would they say to you right now?',
        'Write it down, starting with "Dear one..."',
        'Include: what they see in you, why this is hard, what they wish for you',
        'Read it back to yourself slowly',
        'Let the words land. You deserve this kindness.',
      ], [
        'Imagina a alguien que te quiere profundamente',
        '¿Qué te diría ahora mismo?',
        'Escríbelo, empezando con "Querido/a..."',
        'Incluye qué ve en ti, por qué esto es difícil y qué desea para ti',
        'Léelo lentamente para ti',
        'Deja que las palabras lleguen. Mereces esta bondad.',
      ]);
    },
  }, {
    title: { en: 'Compassionate Letter', es: 'Carta compasiva' },
    description: { en: 'Write to yourself the way a loving friend would.', es: 'Escríbete como lo haría una amistad amorosa.' },
  }),
  localizedFields({
    id: 'c5',
    title: 'Check the Facts',
    description: 'Separate what happened from the story your mind is telling.',
    category: 'reality-check',
    duration: '3 min',
    get steps() {
      return localizedArray([
        'What actually happened? Just the facts, like a camera would see.',
        'What is my interpretation or story about it?',
        'What emotions is this story creating?',
        'Is there another way to interpret what happened?',
        'What would I tell a friend in this situation?',
        'What is the most balanced view I can hold right now?',
      ], [
        '¿Qué pasó realmente? Solo los hechos, como lo vería una cámara.',
        '¿Cuál es mi interpretación o historia sobre esto?',
        '¿Qué emociones está creando esta historia?',
        '¿Hay otra forma de interpretar lo que pasó?',
        '¿Qué le diría a una amistad en esta situación?',
        '¿Cuál es la visión más equilibrada que puedo sostener ahora?',
      ]);
    },
  }, {
    title: { en: 'Check the Facts', es: 'Revisar los hechos' },
    description: { en: 'Separate what happened from the story your mind is telling.', es: 'Separa lo que pasó de la historia que tu mente está contando.' },
  }),
  localizedFields({
    id: 'c6',
    title: 'Mind Reading Check',
    description: 'Challenge the belief that you know what someone else is thinking.',
    category: 'reality-check',
    duration: '2 min',
    get steps() {
      return localizedArray([
        'What do I believe this person is thinking or feeling?',
        'What evidence do I actually have for this?',
        'Have I been wrong about reading minds before?',
        'What are 3 other possible explanations?',
        'Could they be dealing with something that has nothing to do with me?',
        'What would happen if I asked them directly?',
      ], [
        '¿Qué creo que esta persona está pensando o sintiendo?',
        '¿Qué evidencia real tengo de eso?',
        '¿Me he equivocado antes al leer la mente?',
        '¿Cuáles son 3 explicaciones posibles?',
        '¿Podría estar lidiando con algo que no tiene que ver conmigo?',
        '¿Qué pasaría si le preguntara directamente?',
      ]);
    },
  }, {
    title: { en: 'Mind Reading Check', es: 'Revisar lectura mental' },
    description: { en: 'Challenge the belief that you know what someone else is thinking.', es: 'Cuestiona la creencia de que sabes lo que otra persona piensa.' },
  }),
  localizedFields({
    id: 'c7',
    title: 'Opposite Action',
    description: 'Do the opposite of what your emotion urges you to do.',
    category: 'opposite-action',
    duration: '5 min',
    get steps() {
      return localizedArray([
        'Name the emotion you\'re feeling right now',
        'What is it urging you to do?',
        'Is acting on this urge effective for your goals?',
        'What is the OPPOSITE action?',
        'Do the opposite action ALL THE WAY',
        'For anger → be gentle. For shame → share. For fear → approach.',
      ], [
        'Nombra la emoción que sientes ahora',
        '¿Qué te está impulsando a hacer?',
        '¿Actuar según este impulso ayuda a tus metas?',
        '¿Cuál es la acción OPUESTA?',
        'Haz la acción opuesta COMPLETAMENTE',
        'Para enojo → suavidad. Para vergüenza → compartir. Para miedo → acercarte.',
      ]);
    },
  }, {
    title: { en: 'Opposite Action', es: 'Acción opuesta' },
    description: { en: 'Do the opposite of what your emotion urges you to do.', es: 'Haz lo opuesto a lo que la emoción te impulsa a hacer.' },
  }),
  localizedFields({
    id: 'c8',
    title: 'Ride the Wave',
    description: 'Let the emotion pass through you without acting on it.',
    category: 'opposite-action',
    duration: '5 min',
    get steps() {
      return localizedArray([
        'Notice the emotion. Name it without judgment.',
        'Imagine it as a wave building in the ocean',
        'The wave rises... this is the hard part',
        'Stay still. Breathe. You don\'t have to do anything.',
        'The wave crests... and begins to fall',
        'Every wave passes. Every single one. Including this one.',
      ], [
        'Observa la emoción. Nómbrala sin juzgar.',
        'Imagínala como una ola que crece en el océano',
        'La ola sube... esta es la parte difícil',
        'Quédate quieto/a. Respira. No tienes que hacer nada.',
        'La ola llega a su punto más alto... y empieza a bajar',
        'Toda ola pasa. Todas. También esta.',
      ]);
    },
  }, {
    title: { en: 'Ride the Wave', es: 'Surfear la ola' },
    description: { en: 'Let the emotion pass through you without acting on it.', es: 'Deja que la emoción pase por ti sin actuar desde ella.' },
  }),
];

export const VALIDATION_MESSAGES = localizedArrayProxy([
    "What you're feeling is real and valid.",
    "This is incredibly hard, and you're still here.",
    "Your emotions make sense given what you've been through.",
    "You don't have to figure everything out right now.",
    "It's okay to not be okay.",
    "You are not too much. Your feelings are not too much.",
    "This moment will pass. You've survived every hard moment before this.",
    "You deserve the same compassion you'd give someone you love.",
    "Your pain doesn't define you. Neither does this moment.",
    "Reaching for support is strength, not weakness.",
  ], [
    'Lo que sientes es real y válido.',
    'Esto es muy difícil, y sigues aquí.',
    'Tus emociones tienen sentido considerando lo que has vivido.',
    'No tienes que resolverlo todo ahora mismo.',
    'Está bien no estar bien.',
    'No eres demasiado. Tus sentimientos no son demasiado.',
    'Este momento pasará. Has sobrevivido a cada momento difícil antes de este.',
    'Mereces la misma compasión que le darías a alguien que quieres.',
    'Tu dolor no te define. Este momento tampoco.',
    'Buscar apoyo es fortaleza, no debilidad.',
  ]);

export const BREATHING_PATTERNS = {
  calm: { inhale: 4, hold: 4, exhale: 6 },
  grounding: { inhale: 4, hold: 7, exhale: 8 },
  quick: { inhale: 3, hold: 0, exhale: 5 },
};
