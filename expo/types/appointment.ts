export type AppointmentType = 'therapist' | 'psychiatrist' | 'doctor' | 'group' | 'support_group' | 'coach' | 'other';
export type AppointmentLocation = 'in_person' | 'telehealth' | 'phone';

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
  therapist: 'Therapy',
  psychiatrist: 'Psychiatrist',
  doctor: 'Doctor',
  group: 'Group',
  support_group: 'Group',
  coach: 'Other',
  other: 'Other',
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
  in_person: 'In Person',
  telehealth: 'Telehealth',
  phone: 'Phone',
};

export const PRE_SESSION_PROMPTS = [
  { key: 'hardestLately' as const, label: 'What has been hardest lately?', placeholder: 'Describe what has felt most difficult recently...' },
  { key: 'relationshipPatterns' as const, label: 'Relationship patterns this week?', placeholder: 'Any recurring dynamics or triggers...' },
  { key: 'questionsToAsk' as const, label: 'What do I want to ask about?', placeholder: 'Questions or topics for your provider...' },
  { key: 'medicationNotes' as const, label: 'Medication or side effect notes?', placeholder: 'Any changes, side effects, or concerns...' },
  { key: 'progressOrSetbacks' as const, label: 'Progress or setbacks to discuss?', placeholder: 'Things that went well or felt hard...' },
];

export function formatAppointmentDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatAppointmentTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
