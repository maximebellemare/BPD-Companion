export type AppointmentType = 'therapist' | 'psychiatrist' | 'doctor' | 'group' | 'support_group' | 'coach' | 'other';
export type AppointmentLocation = 'in_person' | 'telehealth' | 'phone';
import { i18n } from '@/lib/i18n';
import { localizedFields, localizedText } from '@/lib/i18n/staticText';

export interface Appointment {
  id: string;
  providerName: string;
  appointmentType: AppointmentType;
  dateTime: number;
  duration: number;
  locationType: AppointmentLocation;
  locationDetail: string;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  notes: string;
  topicsToDiscuss: string[];
  preSessionNotes: PreSessionNotes | null;
  postSessionNotes: PostSessionNotes | null;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PreSessionNotes {
  hardestLately: string;
  relationshipPatterns: string;
  questionsToAsk: string;
  medicationNotes: string;
  progressOrSetbacks: string;
  importedInsights: string[];
  savedAt: number;
}

export interface PostSessionNotes {
  whatStoodOut?: string;
  remember?: string;
  actionItems?: string;
  followUpQuestions?: string;
  mainTakeaways: string;
  newCopingTools: string;
  thingsToPractice: string;
  nextAppointmentNotes: string;
  medicationChanges: string;
  savedAt: number;
}

export interface AppointmentState {
  appointments: Appointment[];
}

export const DEFAULT_APPOINTMENT_STATE: AppointmentState = {
  appointments: [],
};

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  get therapist() { return localizedText('Therapy', 'Terapia'); },
  get psychiatrist() { return localizedText('Psychiatrist', 'Psiquiatría'); },
  get doctor() { return localizedText('Doctor', 'Médico/a'); },
  get group() { return localizedText('Group', 'Grupo'); },
  get support_group() { return localizedText('Group', 'Grupo'); },
  get coach() { return localizedText('Other', 'Otro'); },
  get other() { return localizedText('Other', 'Otro'); },
};

export const APPOINTMENT_TYPE_COLORS: Record<AppointmentType, string> = {
  therapist: '#14B8A6',
  psychiatrist: '#3B82F6',
  doctor: '#2E2A72',
  group: '#67E8F9',
  support_group: '#67E8F9',
  coach: '#3B82F6',
  other: '#3B82F6',
};

export const LOCATION_TYPE_LABELS: Record<AppointmentLocation, string> = {
  get in_person() { return localizedText('In Person', 'Presencial'); },
  get telehealth() { return localizedText('Telehealth', 'Teleconsulta'); },
  get phone() { return localizedText('Phone', 'Teléfono'); },
};

export const PRE_SESSION_PROMPTS = [
  localizedFields({ key: 'hardestLately' as const, label: 'What has been hardest lately?', placeholder: 'Describe what has felt most difficult recently...' }, {
    label: { en: 'What has been hardest lately?', es: '¿Qué ha sido más difícil últimamente?' },
    placeholder: { en: 'Describe what has felt most difficult recently...', es: 'Describe qué se ha sentido más difícil recientemente...' },
  }),
  localizedFields({ key: 'relationshipPatterns' as const, label: 'Relationship patterns this week?', placeholder: 'Any recurring dynamics or triggers...' }, {
    label: { en: 'Relationship patterns this week?', es: '¿Patrones en relaciones esta semana?' },
    placeholder: { en: 'Any recurring dynamics or triggers...', es: 'Dinámicas o desencadenantes que se repiten...' },
  }),
  localizedFields({ key: 'questionsToAsk' as const, label: 'What do I want to ask about?', placeholder: 'Questions or topics for your provider...' }, {
    label: { en: 'What do I want to ask about?', es: '¿Qué quiero preguntar?' },
    placeholder: { en: 'Questions or topics for your provider...', es: 'Preguntas o temas para tu profesional...' },
  }),
  localizedFields({ key: 'medicationNotes' as const, label: 'Medication or side effect notes?', placeholder: 'Any changes, side effects, or concerns...' }, {
    label: { en: 'Medication or side effect notes?', es: '¿Notas sobre medicamentos o efectos secundarios?' },
    placeholder: { en: 'Any changes, side effects, or concerns...', es: 'Cambios, efectos secundarios o inquietudes...' },
  }),
  localizedFields({ key: 'progressOrSetbacks' as const, label: 'Progress or setbacks to discuss?', placeholder: 'Things that went well or felt hard...' }, {
    label: { en: 'Progress or setbacks to discuss?', es: '¿Progresos o retrocesos para hablar?' },
    placeholder: { en: 'Things that went well or felt hard...', es: 'Cosas que salieron bien o se sintieron difíciles...' },
  }),
];

export function formatAppointmentDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return localizedText('Today', 'Hoy');
  if (isTomorrow) return localizedText('Tomorrow', 'Mañana');

  return date.toLocaleDateString(i18n.language === 'es' ? 'es' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatAppointmentTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(i18n.language === 'es' ? 'es' : 'en-US', { hour: 'numeric', minute: '2-digit' });
}

export function isAppointmentPast(appointment: Appointment): boolean {
  return appointment.dateTime + (appointment.duration * 60 * 1000) < Date.now();
}

export function isAppointmentToday(appointment: Appointment): boolean {
  const date = new Date(appointment.dateTime);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

export function isAppointmentUpcoming(appointment: Appointment): boolean {
  return appointment.dateTime > Date.now();
}
