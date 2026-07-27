import { storageService } from '@/services/storage/storageService';
import { localizedText } from '@/lib/i18n/staticText';

export type BPDAcademySection = 'dbt' | 'act' | 'cbt' | 'bpd_specific';

export interface BPDAcademyLesson {
  id: string;
  section: BPDAcademySection;
  topic: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  explain: string;
  example: string;
  application: string;
  miniExercise: string;
}

export interface BPDAcademyProgress {
  completedLessonIds: string[];
  completedAtByLesson: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

const STORAGE_KEY = 'bpd_companion_bpd_academy_progress';

export const BPD_ACADEMY_SECTION_LABELS: Record<BPDAcademySection, string> = {
  dbt: 'DBT',
  act: 'ACT',
  cbt: 'CBT',
  get bpd_specific() { return localizedText('BPD-specific', 'Específico de TLP'); },
};

export const BPD_ACADEMY_SECTION_DESCRIPTIONS: Record<BPDAcademySection, string> = {
  get dbt() { return localizedText('Skills for regulation, distress, and relationships.', 'Habilidades para regularte, atravesar malestar y cuidar tus relaciones.'); },
  get act() { return localizedText('Practice making room for feelings while choosing your values.', 'Practica hacer espacio para tus emociones mientras eliges tus valores.'); },
  get cbt() { return localizedText('Learn to spot thoughts that turn pain into panic.', 'Aprende a detectar pensamientos que convierten el dolor en pánico.'); },
  get bpd_specific() { return localizedText('Tiny lessons for common BPD patterns and moments.', 'Lecciones breves para patrones y momentos comunes del TLP.'); },
};

export const DEFAULT_BPD_ACADEMY_PROGRESS: BPDAcademyProgress = {
  completedLessonIds: [],
  completedAtByLesson: {},
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

type BPDAcademyLocalizedCopy = Pick<
  BPDAcademyLesson,
  'title' | 'subtitle' | 'explain' | 'example' | 'application' | 'miniExercise'
>;

function localizedAcademyLesson(
  lesson: BPDAcademyLesson,
  spanish: BPDAcademyLocalizedCopy,
): BPDAcademyLesson {
  const english: BPDAcademyLocalizedCopy = {
    title: lesson.title,
    subtitle: lesson.subtitle,
    explain: lesson.explain,
    example: lesson.example,
    application: lesson.application,
    miniExercise: lesson.miniExercise,
  };

  return Object.defineProperties(lesson, {
    title: { enumerable: true, configurable: true, get: () => localizedText(english.title, spanish.title) },
    subtitle: { enumerable: true, configurable: true, get: () => localizedText(english.subtitle, spanish.subtitle) },
    explain: { enumerable: true, configurable: true, get: () => localizedText(english.explain, spanish.explain) },
    example: { enumerable: true, configurable: true, get: () => localizedText(english.example, spanish.example) },
    application: { enumerable: true, configurable: true, get: () => localizedText(english.application, spanish.application) },
    miniExercise: { enumerable: true, configurable: true, get: () => localizedText(english.miniExercise, spanish.miniExercise) },
  });
}

export const BPD_ACADEMY_LESSONS: BPDAcademyLesson[] = [
  localizedAcademyLesson({
    id: 'dbt_mindfulness',
    section: 'dbt',
    topic: 'mindfulness',
    title: 'Notice before reacting',
    subtitle: 'A 2-minute pause that helps you see what is happening.',
    durationMinutes: 2,
    explain: 'Mindfulness is the practice of noticing your current experience without immediately obeying it. The goal is not to become calm on command. The goal is to create a small space between feeling and action.',
    example: 'You see a short reply and your body says, "Something is wrong." Mindfulness sounds like: "I am noticing fear. I am noticing the urge to text again."',
    application: 'Use this when a feeling arrives fast and asks you to act fast. Name the emotion, name the urge, then wait one breath before choosing.',
    miniExercise: 'For 60 seconds, name three things: what you feel in your body, what emotion is present, and what urge is asking for attention.',
  }, {
    title: 'Nota antes de reaccionar',
    subtitle: 'Una pausa de 2 minutos que te ayuda a ver qué está pasando.',
    explain: 'Mindfulness es la práctica de notar tu experiencia actual sin obedecerla de inmediato. La meta no es calmarte a la fuerza. La meta es crear un pequeño espacio entre sentir y actuar.',
    example: 'Ves una respuesta corta y tu cuerpo dice: "Algo está mal". Mindfulness suena así: "Estoy notando miedo. Estoy notando el impulso de escribir otra vez".',
    application: 'Úsalo cuando una emoción llega rápido y te pide actuar rápido. Nombra la emoción, nombra el impulso y espera una respiración antes de elegir.',
    miniExercise: 'Durante 60 segundos, nombra tres cosas: qué sientes en el cuerpo, qué emoción está presente y qué impulso pide atención.',
  }),
  localizedAcademyLesson({
    id: 'dbt_emotion_regulation',
    section: 'dbt',
    topic: 'emotion regulation',
    title: 'Lower the heat',
    subtitle: 'Work with an emotion instead of being dragged by it.',
    durationMinutes: 3,
    explain: 'Emotion regulation means understanding what your emotion is trying to signal and choosing a response that protects your future self.',
    example: 'Anger may be signaling hurt or fear. It may be valid that something mattered, while still not being safe to send the sharpest message.',
    application: 'Ask: What emotion is here? What does it want me to do? What action will I respect tomorrow?',
    miniExercise: 'Write one sentence: "This emotion wants me to ____. My steadier choice is ____."',
  }, {
    title: 'Baja la intensidad',
    subtitle: 'Trabaja con una emoción en vez de dejar que te arrastre.',
    explain: 'Regular emociones significa entender qué intenta señalar tu emoción y elegir una respuesta que proteja a tu yo del futuro.',
    example: 'El enojo puede estar señalando dolor o miedo. Puede ser válido que algo te importó, sin que sea seguro enviar el mensaje más filoso.',
    application: 'Pregunta: ¿Qué emoción está aquí? ¿Qué quiere que haga? ¿Qué acción voy a respetar mañana?',
    miniExercise: 'Escribe una frase: "Esta emoción quiere que ____. Mi opción más estable es ____."',
  }),
  localizedAcademyLesson({
    id: 'dbt_distress_tolerance',
    section: 'dbt',
    topic: 'distress tolerance',
    title: 'Survive the wave',
    subtitle: 'Get through the peak without making it worse.',
    durationMinutes: 2,
    explain: 'Distress tolerance is for moments when you cannot solve the problem right now, but you can reduce the chance of regret.',
    example: 'You feel abandoned and want certainty immediately. Distress tolerance helps you survive the next few minutes without escalating.',
    application: 'Use a short body-based action first: cold water, paced breathing, grounding, or stepping away from the phone.',
    miniExercise: 'Set a 2-minute timer. Breathe out longer than you breathe in. Do not decide anything important until the timer ends.',
  }, {
    title: 'Sobrevive la ola',
    subtitle: 'Atraviesa el pico sin empeorarlo.',
    explain: 'La tolerancia al malestar es para momentos en los que no puedes resolver el problema ahora, pero sí puedes reducir la posibilidad de arrepentirte.',
    example: 'Te sientes abandonado/a y quieres certeza de inmediato. La tolerancia al malestar te ayuda a sobrevivir los próximos minutos sin intensificar.',
    application: 'Usa primero una acción breve basada en el cuerpo: agua fría, respiración pausada, anclaje o alejarte del teléfono.',
    miniExercise: 'Pon un temporizador de 2 minutos. Exhala más largo de lo que inhalas. No decidas nada importante hasta que termine.',
  }),
  localizedAcademyLesson({
    id: 'dbt_interpersonal_effectiveness',
    section: 'dbt',
    topic: 'interpersonal effectiveness',
    title: 'Ask without attacking',
    subtitle: 'Say what matters while protecting the connection.',
    durationMinutes: 4,
    explain: 'Interpersonal effectiveness is the skill of asking for what you need clearly, while reducing blame, threats, or mind reading.',
    example: 'Instead of "You never care about me," a steadier version is "I felt anxious when I did not hear back. Can we talk tonight?"',
    application: 'Before sending, check whether the message has a clear ask, a feeling statement, and no accusation.',
    miniExercise: 'Rewrite one sentence using: "I felt __ when __. Could we __?"',
  }, {
    title: 'Pide sin atacar',
    subtitle: 'Di lo que importa mientras proteges el vínculo.',
    explain: 'La efectividad interpersonal es la habilidad de pedir lo que necesitas con claridad, reduciendo culpa, amenazas o lectura de mente.',
    example: 'En vez de "Nunca te importo", una versión más estable es: "Me sentí ansioso/a cuando no tuve respuesta. ¿Podemos hablar esta noche?".',
    application: 'Antes de enviar, revisa si el mensaje tiene una petición clara, una frase sobre tu emoción y ninguna acusación.',
    miniExercise: 'Reescribe una frase usando: "Me sentí __ cuando __. ¿Podríamos __?".',
  }),
  localizedAcademyLesson({
    id: 'act_acceptance',
    section: 'act',
    topic: 'acceptance',
    title: 'Make room for the feeling',
    subtitle: 'Acceptance is not approval. It is stopping the fight with reality.',
    durationMinutes: 3,
    explain: 'Acceptance means allowing a feeling to be present without spending all your energy trying to erase it immediately.',
    example: 'You can accept "I feel rejected right now" without accepting the story "I am unlovable."',
    application: 'When a feeling is here, soften the fight around it: "This is painful, and I can make room for it for one minute."',
    miniExercise: 'Place a hand where you feel tension and say: "This feeling is here. I do not have to like it to let it pass through."',
  }, {
    title: 'Haz espacio para la emoción',
    subtitle: 'Aceptar no es aprobar. Es dejar de pelear con la realidad.',
    explain: 'Aceptar significa permitir que una emoción esté presente sin gastar toda tu energía intentando borrarla de inmediato.',
    example: 'Puedes aceptar "me siento rechazado/a ahora" sin aceptar la historia "no soy querible".',
    application: 'Cuando una emoción esté aquí, suaviza la pelea: "Esto duele, y puedo hacerle espacio por un minuto".',
    miniExercise: 'Pon una mano donde sientas tensión y di: "Esta emoción está aquí. No tiene que gustarme para dejar que pase por mí".',
  }),
  localizedAcademyLesson({
    id: 'act_cognitive_defusion',
    section: 'act',
    topic: 'cognitive defusion',
    title: 'Step back from the thought',
    subtitle: 'See a thought as a thought, not a command.',
    durationMinutes: 2,
    explain: 'Defusion helps you unhook from thoughts that feel like facts. It does not argue with the thought. It changes your relationship to it.',
    example: 'Instead of "They hate me," try "I am having the thought that they hate me."',
    application: 'Use this when your mind is speaking in absolutes: always, never, everyone, nothing, ruined.',
    miniExercise: 'Pick one painful thought and add: "I am noticing the story that..." before it.',
  }, {
    title: 'Toma distancia del pensamiento',
    subtitle: 'Ve un pensamiento como pensamiento, no como una orden.',
    explain: 'La defusión te ayuda a desengancharte de pensamientos que se sienten como hechos. No discute con el pensamiento; cambia tu relación con él.',
    example: 'En vez de "me odian", prueba: "Estoy teniendo el pensamiento de que me odian".',
    application: 'Úsalo cuando tu mente habla en absolutos: siempre, nunca, todos, nada, arruinado.',
    miniExercise: 'Elige un pensamiento doloroso y agrega antes: "Estoy notando la historia de que...".',
  }),
  localizedAcademyLesson({
    id: 'act_values',
    section: 'act',
    topic: 'values',
    title: 'Choose from values, not panic',
    subtitle: 'Let the person you want to be help choose the next step.',
    durationMinutes: 4,
    explain: 'Values are directions, not perfect performances. They help you choose a response when emotion is loud.',
    example: 'If your value is honesty, you can be honest without sending a message designed to punish.',
    application: 'Ask: If I were acting from steadiness, care, or self-respect, what would I do next?',
    miniExercise: 'Choose one value for the next 10 minutes: steadiness, honesty, kindness, courage, or self-respect.',
  }, {
    title: 'Elige desde tus valores, no desde el pánico',
    subtitle: 'Deja que la persona que quieres ser ayude a elegir el siguiente paso.',
    explain: 'Los valores son direcciones, no desempeños perfectos. Te ayudan a elegir una respuesta cuando la emoción está muy fuerte.',
    example: 'Si tu valor es la honestidad, puedes ser honesto/a sin enviar un mensaje diseñado para castigar.',
    application: 'Pregunta: si actuara desde estabilidad, cuidado o autorrespeto, ¿qué haría ahora?',
    miniExercise: 'Elige un valor para los próximos 10 minutos: estabilidad, honestidad, amabilidad, valentía o autorrespeto.',
  }),
  localizedAcademyLesson({
    id: 'cbt_cognitive_distortions',
    section: 'cbt',
    topic: 'cognitive distortions',
    title: 'Catch the thought trap',
    subtitle: 'Notice when pain turns into certainty.',
    durationMinutes: 3,
    explain: 'Cognitive distortions are thinking patterns that can make distress feel more certain and urgent than the evidence supports.',
    example: '"She has not answered" can become mind reading: "She must be done with me."',
    application: 'Look for mind reading, catastrophizing, black-and-white thinking, and emotional reasoning.',
    miniExercise: 'Write the painful thought. Then label it with one possible trap: mind reading, catastrophe, all-or-nothing, or emotion-as-fact.',
  }, {
    title: 'Detecta la trampa mental',
    subtitle: 'Nota cuando el dolor se convierte en certeza.',
    explain: 'Las distorsiones cognitivas son patrones de pensamiento que pueden hacer que el malestar se sienta más seguro y urgente de lo que la evidencia sostiene.',
    example: '"No ha respondido" puede convertirse en lectura de mente: "Seguro ya terminó conmigo".',
    application: 'Busca lectura de mente, catastrofismo, pensamiento blanco/negro y razonamiento emocional.',
    miniExercise: 'Escribe el pensamiento doloroso. Luego ponle una etiqueta posible: lectura de mente, catástrofe, todo o nada, o emoción como hecho.',
  }),
  localizedAcademyLesson({
    id: 'cbt_reframing',
    section: 'cbt',
    topic: 'reframing',
    title: 'Find a steadier frame',
    subtitle: 'A calmer thought that does not deny the pain.',
    durationMinutes: 4,
    explain: 'Reframing means finding a more balanced way to understand a situation. It is not forced positivity.',
    example: 'Instead of "They ignored me because I am too much," try "I do not know why they are delayed. I can ask directly when we talk."',
    application: 'A good reframe feels possible, not fake. It leaves room for your feeling and room for other explanations.',
    miniExercise: 'Write: "One painful explanation is ____. One steadier explanation is ____."',
  }, {
    title: 'Encuentra un marco más estable',
    subtitle: 'Un pensamiento más calmado que no niega el dolor.',
    explain: 'Reencuadrar significa encontrar una forma más equilibrada de entender una situación. No es positividad forzada.',
    example: 'En vez de "me ignoraron porque soy demasiado", prueba: "No sé por qué hay demora. Puedo preguntar directamente cuando hablemos".',
    application: 'Un buen reencuadre se siente posible, no falso. Deja espacio para tu emoción y para otras explicaciones.',
    miniExercise: 'Escribe: "Una explicación dolorosa es ____. Una explicación más estable es ____."',
  }),
  localizedAcademyLesson({
    id: 'bpd_abandonment',
    section: 'bpd_specific',
    topic: 'abandonment',
    title: 'When distance feels like danger',
    subtitle: 'Understand the alarm without obeying every alarm signal.',
    durationMinutes: 3,
    explain: 'Fear of abandonment can make uncertainty feel urgent and threatening. The feeling is real, but the conclusion may need checking.',
    example: 'A delayed reply may feel like proof someone is leaving, even when there are many possible explanations.',
    application: 'When abandonment fear appears, focus first on calming the body, then ask for clarity from your steadier self.',
    miniExercise: 'Ask: "What do I know for sure? What am I afraid this means? What is one other possibility?"',
  }, {
    title: 'Cuando la distancia se siente como peligro',
    subtitle: 'Entiende la alarma sin obedecer cada señal de alarma.',
    explain: 'El miedo al abandono puede hacer que la incertidumbre se sienta urgente y amenazante. La emoción es real, pero la conclusión quizá necesita revisión.',
    example: 'Una respuesta demorada puede sentirse como prueba de que alguien se va, incluso cuando hay muchas explicaciones posibles.',
    application: 'Cuando aparece el miedo al abandono, enfócate primero en calmar el cuerpo y luego pide claridad desde tu parte más estable.',
    miniExercise: 'Pregunta: "¿Qué sé con certeza? ¿Qué temo que signifique esto? ¿Cuál es otra posibilidad?".',
  }),
  localizedAcademyLesson({
    id: 'bpd_rejection',
    section: 'bpd_specific',
    topic: 'rejection',
    title: 'When no feels personal',
    subtitle: 'Separate disappointment from the story of being unwanted.',
    durationMinutes: 3,
    explain: 'Rejection sensitivity can make neutral or disappointing moments feel like evidence that you are unwanted.',
    example: 'A friend being unavailable can hurt without meaning the friendship is unsafe.',
    application: 'Name the hurt directly before deciding what it means about you or the relationship.',
    miniExercise: 'Complete: "This hurts because ____. It does not automatically mean ____."',
  }, {
    title: 'Cuando un no se siente personal',
    subtitle: 'Separa la decepción de la historia de no ser querido/a.',
    explain: 'La sensibilidad al rechazo puede hacer que momentos neutros o decepcionantes se sientan como evidencia de que no te quieren.',
    example: 'Que un amigo no esté disponible puede doler sin significar que la amistad no sea segura.',
    application: 'Nombra el dolor directamente antes de decidir qué significa sobre ti o sobre la relación.',
    miniExercise: 'Completa: "Esto duele porque ____. No significa automáticamente ____."',
  }),
  localizedAcademyLesson({
    id: 'bpd_shame',
    section: 'bpd_specific',
    topic: 'shame',
    title: 'Shame is not identity',
    subtitle: 'A painful feeling is not the whole truth about you.',
    durationMinutes: 2,
    explain: 'Shame often says, "I am bad." A steadier view says, "Something painful happened, and I can respond with repair or care."',
    example: 'After an argument, shame may push you to disappear or over-apologize. Repair works better when it is specific and grounded.',
    application: 'Shift from identity language to behavior language: What happened? What can be repaired? What support is needed?',
    miniExercise: 'Write one repair sentence: "I want to acknowledge ____. Next time I will try ____."',
  }, {
    title: 'La vergüenza no es identidad',
    subtitle: 'Una emoción dolorosa no es toda la verdad sobre ti.',
    explain: 'La vergüenza suele decir: "Soy malo/a". Una mirada más estable dice: "Pasó algo doloroso, y puedo responder con reparación o cuidado".',
    example: 'Después de una discusión, la vergüenza puede empujarte a desaparecer o disculparte de más. La reparación funciona mejor cuando es específica y aterrizada.',
    application: 'Pasa del lenguaje de identidad al lenguaje de conducta: ¿qué pasó? ¿Qué puede repararse? ¿Qué apoyo hace falta?',
    miniExercise: 'Escribe una frase de reparación: "Quiero reconocer ____. La próxima vez intentaré ____."',
  }),
  localizedAcademyLesson({
    id: 'bpd_splitting',
    section: 'bpd_specific',
    topic: 'splitting',
    title: 'Holding two truths',
    subtitle: 'A person can disappoint you and still matter.',
    durationMinutes: 4,
    explain: 'Splitting can make someone feel all safe or all unsafe in a painful moment. Holding two truths helps reduce emotional whiplash.',
    example: 'Two truths can be: "I am hurt by what happened" and "This relationship has also had care and effort."',
    application: 'Use two-truth thinking before ending, accusing, or idealizing a relationship.',
    miniExercise: 'Write two truths: "One painful truth is ____. One balancing truth is ____."',
  }, {
    title: 'Sostener dos verdades',
    subtitle: 'Una persona puede decepcionarte y aun así importar.',
    explain: 'La escisión puede hacer que alguien se sienta completamente seguro o completamente inseguro en un momento doloroso. Sostener dos verdades reduce los cambios emocionales bruscos.',
    example: 'Dos verdades pueden ser: "Me dolió lo que pasó" y "Esta relación también ha tenido cuidado y esfuerzo".',
    application: 'Usa el pensamiento de dos verdades antes de terminar, acusar o idealizar una relación.',
    miniExercise: 'Escribe dos verdades: "Una verdad dolorosa es ____. Una verdad equilibrante es ____."',
  }),
  localizedAcademyLesson({
    id: 'bpd_identity_instability',
    section: 'bpd_specific',
    topic: 'identity instability',
    title: 'You are allowed to be unfinished',
    subtitle: 'Identity can be built through small repeated choices.',
    durationMinutes: 3,
    explain: 'Identity instability can feel like not knowing who you are from one mood or relationship moment to the next.',
    example: 'After conflict, you might feel like a completely different person. That does not mean you have no self. It means emotion is coloring the view.',
    application: 'Anchor to values and patterns instead of waiting to feel perfectly certain about who you are.',
    miniExercise: 'Choose one sentence for today: "I am someone who is practicing ____."',
  }, {
    title: 'Tienes permiso de estar en construcción',
    subtitle: 'La identidad puede construirse con pequeñas elecciones repetidas.',
    explain: 'La inestabilidad de identidad puede sentirse como no saber quién eres de un estado de ánimo o momento relacional al siguiente.',
    example: 'Después de un conflicto, quizá sientas que eres una persona completamente distinta. Eso no significa que no tengas un yo. Significa que la emoción está coloreando la mirada.',
    application: 'Ancla en valores y patrones en vez de esperar sentir certeza perfecta sobre quién eres.',
    miniExercise: 'Elige una frase para hoy: "Soy alguien que está practicando ____."',
  }),
  localizedAcademyLesson({
    id: 'bpd_emotional_dysregulation',
    section: 'bpd_specific',
    topic: 'emotional dysregulation',
    title: 'When emotion takes the wheel',
    subtitle: 'Big feelings need sequencing, not shame.',
    durationMinutes: 3,
    explain: 'Emotional dysregulation means emotions can rise quickly, feel intense, and make action feel urgent. The first job is often to reduce intensity before solving the problem.',
    example: 'At intensity 9, a conversation about the relationship may go poorly. Calming first can protect what you actually want.',
    application: 'Use this sequence: body first, words second, decisions last.',
    miniExercise: 'Rate your intensity from 1-10. If it is 7 or higher, choose one calming action before any major conversation.',
  }, {
    title: 'Cuando la emoción toma el volante',
    subtitle: 'Las emociones grandes necesitan secuencia, no vergüenza.',
    explain: 'La desregulación emocional significa que las emociones pueden subir rápido, sentirse intensas y volver urgente la acción. El primer trabajo suele ser bajar la intensidad antes de resolver el problema.',
    example: 'Con intensidad 9, una conversación sobre la relación puede salir mal. Calmarte primero puede proteger lo que realmente quieres.',
    application: 'Usa esta secuencia: cuerpo primero, palabras después, decisiones al final.',
    miniExercise: 'Califica tu intensidad del 1 al 10. Si es 7 o más, elige una acción calmante antes de cualquier conversación importante.',
  }),
];

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}

function normalizeProgress(value: Partial<BPDAcademyProgress> | null | undefined): BPDAcademyProgress {
  return {
    completedLessonIds: Array.isArray(value?.completedLessonIds) ? value.completedLessonIds : [],
    completedAtByLesson:
      value?.completedAtByLesson && typeof value.completedAtByLesson === 'object'
        ? value.completedAtByLesson
        : {},
    currentStreak: typeof value?.currentStreak === 'number' ? value.currentStreak : 0,
    longestStreak: typeof value?.longestStreak === 'number' ? value.longestStreak : 0,
    lastCompletedDate: typeof value?.lastCompletedDate === 'string' ? value.lastCompletedDate : null,
  };
}

export async function getBPDAcademyProgress(): Promise<BPDAcademyProgress> {
  const stored = await storageService.get<Partial<BPDAcademyProgress>>(STORAGE_KEY);
  return normalizeProgress(stored);
}

export async function saveBPDAcademyProgress(progress: BPDAcademyProgress): Promise<void> {
  await storageService.set(STORAGE_KEY, normalizeProgress(progress));
}

export async function markBPDAcademyLessonCompleted(lessonId: string): Promise<BPDAcademyProgress> {
  const progress = await getBPDAcademyProgress();
  const alreadyCompleted = progress.completedLessonIds.includes(lessonId);
  if (alreadyCompleted) return progress;

  const today = todayKey();
  const yesterday = yesterdayKey();
  const currentStreak = progress.lastCompletedDate === today
    ? progress.currentStreak
    : progress.lastCompletedDate === yesterday
      ? progress.currentStreak + 1
      : 1;

  const next: BPDAcademyProgress = {
    completedLessonIds: [...progress.completedLessonIds, lessonId],
    completedAtByLesson: {
      ...progress.completedAtByLesson,
      [lessonId]: Date.now(),
    },
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastCompletedDate: today,
  };

  await saveBPDAcademyProgress(next);
  return next;
}

export function getBPDAcademyLessonsBySection(section: BPDAcademySection): BPDAcademyLesson[] {
  return BPD_ACADEMY_LESSONS.filter(lesson => lesson.section === section);
}

export function getBPDAcademySectionProgress(
  section: BPDAcademySection,
  progress: BPDAcademyProgress,
): { completed: number; total: number } {
  const lessons = getBPDAcademyLessonsBySection(section);
  const completed = lessons.filter(lesson => progress.completedLessonIds.includes(lesson.id)).length;
  return { completed, total: lessons.length };
}
