import { LearningPath } from '@/types/learningPath';
import { localizedFields } from '@/lib/i18n/staticText';

const ENGLISH_LEARNING_PATHS: LearningPath[] = [
  {
    id: 'path-emotional-dysregulation',
    title: 'Understanding Emotional Dysregulation',
    subtitle: 'Why emotions hit so hard',
    description: 'Learn why your emotional responses feel so intense, where they come from, and how to begin working with them instead of against them.',
    icon: 'heart',
    color: '#67E8F9',
    steps: [
      { id: 'ped-1', lessonId: 'ubpd-2', title: 'Why Emotions Feel So Intense', description: 'Understanding emotional amplification', estimatedMinutes: 5 },
      { id: 'ped-2', lessonId: 'ubpd-3', title: 'The Emotional Sensitivity Model', description: 'Biology meets environment', estimatedMinutes: 6 },
      { id: 'ped-3', lessonId: 'er-1', title: 'The 90-Second Emotion Rule', description: 'How emotions move through you', estimatedMinutes: 4 },
      { id: 'ped-4', lessonId: 'er-2', title: 'Why Avoidance Makes It Worse', description: 'The paradox of emotional suppression', estimatedMinutes: 5 },
      { id: 'ped-5', lessonId: 'er-3', title: 'Naming What You Feel', description: 'The power of emotional labeling', estimatedMinutes: 4 },
      { id: 'ped-6', lessonId: 'er-5', title: 'Riding the Emotional Wave', description: 'Letting feelings pass through', estimatedMinutes: 5 },
    ],
    suggestedToolIds: ['grounding', 'breathing', 'emotion-naming'],
    tags: ['emotional_regulation', 'distress', 'mindfulness'],
  },
  {
    id: 'path-relationship-triggers',
    title: 'Understanding Relationship Triggers',
    subtitle: 'Why closeness feels dangerous',
    description: 'Explore why relationships activate deep emotional responses, how attachment patterns form, and how to build more secure connections.',
    icon: 'users',
    color: '#3B82F6',
    steps: [
      { id: 'prt-1', lessonId: 'rel-1', title: 'The Push-Pull Pattern', description: 'Why you push away what you want most', estimatedMinutes: 6 },
      { id: 'prt-2', lessonId: 'rel-2', title: 'Attachment and BPD', description: 'How early bonds shape adult relationships', estimatedMinutes: 6 },
      { id: 'prt-3', lessonId: 'ta-1', title: 'Why Silence Feels Like Rejection', description: 'Understanding abandonment sensitivity', estimatedMinutes: 5 },
      { id: 'prt-4', lessonId: 'ta-2', title: 'When Triggers Come From the Past', description: 'Old wounds in new relationships', estimatedMinutes: 5 },
      { id: 'prt-5', lessonId: 'rel-4', title: 'Fact-Checking Relationship Stories', description: 'Separating interpretation from reality', estimatedMinutes: 5 },
      { id: 'prt-6', lessonId: 'comm-3', title: 'Asking for Reassurance', description: 'Expressing needs without pushing away', estimatedMinutes: 5 },
    ],
    suggestedToolIds: ['check-the-facts', 'dear-man', 'pause-before-texting'],
    tags: ['relationship_conflict', 'abandonment', 'attachment', 'communication'],
  },
  {
    id: 'path-regulation-skills',
    title: 'Building Emotional Regulation Skills',
    subtitle: 'Practical tools for steadier days',
    description: 'Build a practical toolkit of skills that help you manage intense emotions, reduce reactivity, and create more stability in daily life.',
    icon: 'anchor',
    color: '#14B8A6',
    steps: [
      { id: 'prs-1', lessonId: 'er-3', title: 'Naming What You Feel', description: 'The foundation of regulation', estimatedMinutes: 4 },
      { id: 'prs-2', lessonId: 'er-4', title: 'Grounding When Everything Spins', description: 'Coming back to the present', estimatedMinutes: 4 },
      { id: 'prs-3', lessonId: 'er-7', title: 'The STOP Skill', description: 'Interrupting reactive patterns', estimatedMinutes: 4 },
      { id: 'prs-4', lessonId: 'er-8', title: 'Opposite Action', description: 'Acting against the urge', estimatedMinutes: 5 },
      { id: 'prs-5', lessonId: 'ds-1', title: 'Building a Steady Morning', description: 'Starting the day with stability', estimatedMinutes: 4 },
      { id: 'prs-6', lessonId: 'th-3', title: 'DBT Skills Overview', description: 'Your regulation toolkit', estimatedMinutes: 6 },
    ],
    suggestedToolIds: ['stop-skill', 'opposite-action', 'grounding', 'tipp'],
    tags: ['coping_skills', 'dbt_skills', 'grounding', 'daily_stability'],
  },
  {
    id: 'path-communication-conflict',
    title: 'Communication & Conflict',
    subtitle: 'Expressing yourself without escalating',
    description: 'Learn to express your needs clearly, set boundaries, navigate conflict, and repair relationships after difficult moments.',
    icon: 'message-circle',
    color: '#14B8A6',
    steps: [
      { id: 'pcc-1', lessonId: 'comm-1', title: 'Why Texting Feels Dangerous', description: 'Communication anxiety and BPD', estimatedMinutes: 5 },
      { id: 'pcc-2', lessonId: 'comm-2', title: 'The DEAR MAN Skill', description: 'Asking for what you need', estimatedMinutes: 5 },
      { id: 'pcc-3', lessonId: 'comm-4', title: 'How to Express Vulnerability', description: 'Being open without drowning', estimatedMinutes: 5 },
      { id: 'pcc-4', lessonId: 'rel-5', title: 'Conflict Styles in BPD', description: 'Understanding your patterns', estimatedMinutes: 5 },
      { id: 'pcc-5', lessonId: 'comm-5', title: 'Repair After Conflict', description: 'Coming back after rupture', estimatedMinutes: 5 },
      { id: 'pcc-6', lessonId: 'rel-7', title: 'Setting Boundaries', description: 'Protecting yourself without shutting down', estimatedMinutes: 5 },
    ],
    suggestedToolIds: ['dear-man', 'give', 'fast', 'pause-before-texting'],
    tags: ['communication', 'relationship_conflict', 'impulse_control'],
  },
  {
    id: 'path-self-compassion',
    title: 'Self-Compassion & Shame Recovery',
    subtitle: 'Learning to be on your own side',
    description: 'Explore the roots of shame and self-criticism, learn to rebuild self-worth, and develop a kinder relationship with yourself.',
    icon: 'sprout',
    color: '#3B82F6',
    steps: [
      { id: 'psc-1', lessonId: 'is-1', title: 'When You Don\'t Know Who You Are', description: 'Identity and BPD', estimatedMinutes: 5 },
      { id: 'psc-2', lessonId: 'is-2', title: 'Shame vs Guilt', description: 'Understanding the difference', estimatedMinutes: 5 },
      { id: 'psc-3', lessonId: 'is-3', title: 'Self-Compassion Is Not Weakness', description: 'The science of being kind to yourself', estimatedMinutes: 5 },
      { id: 'psc-4', lessonId: 'is-4', title: 'Rebuilding Self-Worth', description: 'From the inside out', estimatedMinutes: 5 },
      { id: 'psc-5', lessonId: 'th-5', title: 'Recovery Is Real', description: 'Evidence that people heal', estimatedMinutes: 5 },
      { id: 'psc-6', lessonId: 'is-5', title: 'Self-Trust After BPD', description: 'Learning to believe in yourself again', estimatedMinutes: 5 },
    ],
    suggestedToolIds: ['self-soothe', 'wise-mind', 'opposite-action'],
    tags: ['self_compassion', 'self_worth', 'identity', 'recovery'],
  },
];

type LearningPathLocalizedCopy = Pick<LearningPath, 'title' | 'subtitle' | 'description'> & {
  steps: Record<string, Pick<LearningPath['steps'][number], 'title' | 'description'>>;
};

const LEARNING_PATH_SPANISH: Record<string, LearningPathLocalizedCopy> = {
  'path-emotional-dysregulation': {
    title: 'Entender la desregulación emocional',
    subtitle: 'Por qué las emociones golpean tan fuerte',
    description: 'Aprende por qué tus respuestas emocionales se sienten tan intensas, de dónde vienen y cómo empezar a trabajar con ellas en vez de pelear contra ellas.',
    steps: {
      'ped-1': { title: 'Por qué las emociones se sienten tan intensas', description: 'Entender la amplificación emocional' },
      'ped-2': { title: 'El modelo de sensibilidad emocional', description: 'Biología y ambiente se encuentran' },
      'ped-3': { title: 'La regla emocional de 90 segundos', description: 'Cómo las emociones se mueven a través de ti' },
      'ped-4': { title: 'Por qué evitarlo lo empeora', description: 'La paradoja de suprimir emociones' },
      'ped-5': { title: 'Nombrar lo que sientes', description: 'El poder de ponerle nombre a la emoción' },
      'ped-6': { title: 'Atravesar la ola emocional', description: 'Dejar que las emociones pasen por ti' },
    },
  },
  'path-relationship-triggers': {
    title: 'Entender los disparadores relacionales',
    subtitle: 'Por qué la cercanía puede sentirse peligrosa',
    description: 'Explora por qué las relaciones activan respuestas emocionales profundas, cómo se forman los patrones de apego y cómo construir vínculos más seguros.',
    steps: {
      'prt-1': { title: 'El patrón de acercar y alejar', description: 'Por qué alejas lo que más quieres' },
      'prt-2': { title: 'Apego y TLP', description: 'Cómo los vínculos tempranos moldean las relaciones adultas' },
      'prt-3': { title: 'Por qué el silencio se siente como rechazo', description: 'Entender la sensibilidad al abandono' },
      'prt-4': { title: 'Cuando los disparadores vienen del pasado', description: 'Heridas antiguas en relaciones nuevas' },
      'prt-5': { title: 'Revisar historias relacionales con hechos', description: 'Separar interpretación de realidad' },
      'prt-6': { title: 'Pedir seguridad', description: 'Expresar necesidades sin alejar a la otra persona' },
    },
  },
  'path-regulation-skills': {
    title: 'Construir habilidades de regulación emocional',
    subtitle: 'Herramientas prácticas para días más estables',
    description: 'Construye un conjunto práctico de habilidades que te ayudan a manejar emociones intensas, reducir la reactividad y crear más estabilidad en la vida diaria.',
    steps: {
      'prs-1': { title: 'Nombrar lo que sientes', description: 'La base de la regulación' },
      'prs-2': { title: 'Anclaje cuando todo gira', description: 'Volver al presente' },
      'prs-3': { title: 'La habilidad STOP', description: 'Interrumpir patrones reactivos' },
      'prs-4': { title: 'Acción opuesta', description: 'Actuar contra el impulso' },
      'prs-5': { title: 'Construir una mañana estable', description: 'Empezar el día con estabilidad' },
      'prs-6': { title: 'Resumen de habilidades DBT', description: 'Tu kit de regulación' },
    },
  },
  'path-communication-conflict': {
    title: 'Comunicación y conflicto',
    subtitle: 'Expresarte sin intensificar',
    description: 'Aprende a expresar tus necesidades con claridad, poner límites, navegar conflictos y reparar relaciones después de momentos difíciles.',
    steps: {
      'pcc-1': { title: 'Por qué escribir mensajes se siente peligroso', description: 'Ansiedad de comunicación y TLP' },
      'pcc-2': { title: 'La habilidad DEAR MAN', description: 'Pedir lo que necesitas' },
      'pcc-3': { title: 'Cómo expresar vulnerabilidad', description: 'Abrirte sin ahogarte' },
      'pcc-4': { title: 'Estilos de conflicto en el TLP', description: 'Entender tus patrones' },
      'pcc-5': { title: 'Reparar después del conflicto', description: 'Volver después de una ruptura' },
      'pcc-6': { title: 'Poner límites', description: 'Protegerte sin cerrarte' },
    },
  },
  'path-self-compassion': {
    title: 'Autocompasión y recuperación de la vergüenza',
    subtitle: 'Aprender a estar de tu lado',
    description: 'Explora las raíces de la vergüenza y la autocrítica, aprende a reconstruir la autoestima y desarrolla una relación más amable contigo.',
    steps: {
      'psc-1': { title: 'Cuando no sabes quién eres', description: 'Identidad y TLP' },
      'psc-2': { title: 'Vergüenza vs. culpa', description: 'Entender la diferencia' },
      'psc-3': { title: 'La autocompasión no es debilidad', description: 'La ciencia de tratarte con amabilidad' },
      'psc-4': { title: 'Reconstruir la autoestima', description: 'Desde adentro hacia afuera' },
      'psc-5': { title: 'La recuperación es real', description: 'Evidencia de que las personas sanan' },
      'psc-6': { title: 'Volver a confiar en ti después del TLP', description: 'Aprender a creer en ti otra vez' },
    },
  },
};

function localizeLearningPath(path: LearningPath): LearningPath {
  const spanish = LEARNING_PATH_SPANISH[path.id];
  if (!spanish) {
    return path;
  }

  localizedFields(path, {
    title: { en: path.title, es: spanish.title },
    subtitle: { en: path.subtitle, es: spanish.subtitle },
    description: { en: path.description, es: spanish.description },
  });

  path.steps = path.steps.map((step) => {
    const spanishStep = spanish.steps[step.id];
    if (!spanishStep) {
      return step;
    }

    return localizedFields(step, {
      title: { en: step.title, es: spanishStep.title },
      description: { en: step.description, es: spanishStep.description },
    }) as LearningPath['steps'][number];
  });

  return path;
}

export const LEARNING_PATHS: LearningPath[] = ENGLISH_LEARNING_PATHS.map(localizeLearningPath);
