import { LessonCategory } from '@/types/learn';
import { localizedFields } from '@/lib/i18n/staticText';

const ENGLISH_LEARN_CATEGORIES: LessonCategory[] = [
  {
    id: 'understanding-bpd',
    title: 'Understanding BPD',
    description: 'Learn what BPD really is — beyond the stigma',
    icon: 'brain',
    color: '#14B8A6',
    lessonCount: 10,
  },
  {
    id: 'emotional-regulation',
    title: 'Emotional Regulation',
    description: 'Why feelings hit so hard and how to ride the wave',
    icon: 'heart',
    color: '#67E8F9',
    lessonCount: 10,
  },
  {
    id: 'relationships',
    title: 'Relationships',
    description: 'Building connection without losing yourself',
    icon: 'users',
    color: '#3B82F6',
    lessonCount: 10,
  },
  {
    id: 'triggers-abandonment',
    title: 'Triggers & Abandonment',
    description: 'Understanding the pull and finding safety within',
    icon: 'anchor',
    color: '#3B82F6',
    lessonCount: 6,
  },
  {
    id: 'identity-selfworth',
    title: 'Self Identity & Self Worth',
    description: 'Finding steady ground when you feel shapeless',
    icon: 'fingerprint',
    color: '#3B82F6',
    lessonCount: 6,
  },
  {
    id: 'communication',
    title: 'Communication Skills',
    description: 'Expressing yourself clearly without escalation',
    icon: 'message-circle',
    color: '#14B8A6',
    lessonCount: 5,
  },
  {
    id: 'crisis-storms',
    title: 'Crisis & Emotional Storms',
    description: 'Surviving the worst moments without making them worse',
    icon: 'cloud-lightning',
    color: '#67E8F9',
    lessonCount: 3,
  },
  {
    id: 'daily-stability',
    title: 'Daily Stability & Habits',
    description: 'Small routines that build a steadier life',
    icon: 'sunrise',
    color: '#67E8F9',
    lessonCount: 3,
  },
  {
    id: 'therapy-healing',
    title: 'Therapy & Healing',
    description: 'The path forward — treatment, recovery, and hope',
    icon: 'sprout',
    color: '#14B8A6',
    lessonCount: 7,
  },
];

const LEARN_CATEGORY_SPANISH: Record<string, Pick<LessonCategory, 'title' | 'description'>> = {
  'understanding-bpd': {
    title: 'Entender el TLP',
    description: 'Aprende qué es realmente el TLP, más allá del estigma',
  },
  'emotional-regulation': {
    title: 'Regulación emocional',
    description: 'Por qué las emociones golpean tan fuerte y cómo atravesar la ola',
  },
  relationships: {
    title: 'Relaciones',
    description: 'Construir conexión sin perderte a ti mismo/a',
  },
  'triggers-abandonment': {
    title: 'Disparadores y abandono',
    description: 'Entender el tirón y encontrar seguridad dentro de ti',
  },
  'identity-selfworth': {
    title: 'Identidad y autoestima',
    description: 'Encontrar suelo firme cuando te sientes sin forma',
  },
  communication: {
    title: 'Habilidades de comunicación',
    description: 'Expresarte con claridad sin escalar',
  },
  'crisis-storms': {
    title: 'Crisis y tormentas emocionales',
    description: 'Sobrevivir los peores momentos sin empeorarlos',
  },
  'daily-stability': {
    title: 'Estabilidad diaria y hábitos',
    description: 'Rutinas pequeñas que construyen una vida más estable',
  },
  'therapy-healing': {
    title: 'Terapia y sanación',
    description: 'El camino hacia adelante: tratamiento, recuperación y esperanza',
  },
};

function localizeLessonCategory(category: LessonCategory): LessonCategory {
  const spanish = LEARN_CATEGORY_SPANISH[category.id];
  if (!spanish) {
    return category;
  }

  return localizedFields(category, {
    title: { en: category.title, es: spanish.title },
    description: { en: category.description, es: spanish.description },
  }) as LessonCategory;
}

export const LEARN_CATEGORIES: LessonCategory[] = ENGLISH_LEARN_CATEGORIES.map(localizeLessonCategory);
