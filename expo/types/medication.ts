export type MedicationCategory =
  | 'antidepressant'
  | 'mood_stabilizer'
  | 'antipsychotic'
  | 'anxiolytic'
  | 'sleep_aid'
  | 'stimulant'
  | 'supplement'
  | 'other';

export type MedicationSchedule =
  | 'daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'weekly'
  | 'as_needed'
  | 'custom';

export type MoodAfter = 'much_better' | 'better' | 'same' | 'worse' | 'much_worse';
export type SideEffectSeverity = 'none' | 'mild' | 'moderate' | 'severe';
export type LogStatus = 'taken' | 'missed' | 'skipped';
export type MedicationDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MedicationTime {
  hour: number;
  minute: number;
  label: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  category: MedicationCategory;
  schedule: MedicationSchedule;
  times: MedicationTime[];
  daysOfWeek?: MedicationDayOfWeek[];
  purpose: string;
  startDate: number;
  active: boolean;
  reminderEnabled: boolean;
  sideEffectNotes: string;
  generalNotes: string;
  createdAt: number;
  updatedAt: number;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  status: LogStatus;
  timestamp: number;
  scheduledTime: MedicationTime | null;
  moodAfter: MoodAfter | null;
  anxietyAfter: number | null;
  sleepiness: number | null;
  sideEffects: string;
  didItHelp: boolean | null;
  notes: string;
}

export interface MedicationState {
  medications: Medication[];
  logs: MedicationLog[];
}

export const DEFAULT_MEDICATION_STATE: MedicationState = {
  medications: [],
  logs: [],
};

export const MEDICATION_CATEGORIES: { value: MedicationCategory; label: string }[] = [
  { value: 'antidepressant', label: 'Antidepressant' },
  { value: 'mood_stabilizer', label: 'Mood Stabilizer' },
  { value: 'antipsychotic', label: 'Antipsychotic' },
  { value: 'anxiolytic', label: 'Anti-anxiety' },
  { value: 'sleep_aid', label: 'Sleep Aid' },
  { value: 'stimulant', label: 'Stimulant' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'other', label: 'Other' },
];

export const MEDICATION_SCHEDULES: { value: MedicationSchedule; label: string; description: string }[] = [
  { value: 'daily', label: 'Once daily', description: '1 time per day' },
  { value: 'twice_daily', label: 'Twice daily', description: '2 times per day' },
  { value: 'three_times_daily', label: 'Three times daily', description: '3 times per day' },
  { value: 'weekly', label: 'Weekly', description: 'Choose one or more days' },
  { value: 'custom', label: 'Custom', description: 'Choose any days and times' },
];

export const MEDICATION_WEEKDAYS: { value: MedicationDayOfWeek; label: string; shortLabel: string; expoWeekday: number }[] = [
  { value: 1, label: 'Monday', shortLabel: 'Mon', expoWeekday: 2 },
  { value: 2, label: 'Tuesday', shortLabel: 'Tue', expoWeekday: 3 },
  { value: 3, label: 'Wednesday', shortLabel: 'Wed', expoWeekday: 4 },
  { value: 4, label: 'Thursday', shortLabel: 'Thu', expoWeekday: 5 },
  { value: 5, label: 'Friday', shortLabel: 'Fri', expoWeekday: 6 },
  { value: 6, label: 'Saturday', shortLabel: 'Sat', expoWeekday: 7 },
  { value: 0, label: 'Sunday', shortLabel: 'Sun', expoWeekday: 1 },
];

export const EVERY_DAY_OF_WEEK: MedicationDayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export const MOOD_AFTER_OPTIONS: { value: MoodAfter; label: string; emoji: string }[] = [
  { value: 'much_better', label: 'Much better', emoji: '😊' },
  { value: 'better', label: 'A bit better', emoji: '🙂' },
  { value: 'same', label: 'About the same', emoji: '😐' },
  { value: 'worse', label: 'A bit worse', emoji: '😕' },
  { value: 'much_worse', label: 'Much worse', emoji: '😞' },
];

export function getDefaultTimesForSchedule(schedule: MedicationSchedule): MedicationTime[] {
  switch (schedule) {
    case 'daily':
      return [{ hour: 9, minute: 0, label: 'Morning' }];
    case 'twice_daily':
      return [
        { hour: 9, minute: 0, label: 'Morning' },
        { hour: 21, minute: 0, label: 'Evening' },
      ];
    case 'three_times_daily':
      return [
        { hour: 8, minute: 0, label: 'Morning' },
        { hour: 14, minute: 0, label: 'Afternoon' },
        { hour: 20, minute: 0, label: 'Evening' },
      ];
    case 'four_times_daily':
      return [
        { hour: 8, minute: 0, label: 'Morning' },
        { hour: 12, minute: 0, label: 'Midday' },
        { hour: 16, minute: 0, label: 'Afternoon' },
        { hour: 20, minute: 0, label: 'Evening' },
      ];
    case 'weekly':
      return [{ hour: 9, minute: 0, label: 'Weekly' }];
    case 'as_needed':
      return [];
    case 'custom':
      return [{ hour: 9, minute: 0, label: 'Dose 1' }];
  }
}

export function getDefaultDaysForSchedule(schedule: MedicationSchedule): MedicationDayOfWeek[] {
  switch (schedule) {
    case 'weekly':
      return [new Date().getDay() as MedicationDayOfWeek];
    case 'custom':
      return EVERY_DAY_OF_WEEK;
    case 'as_needed':
      return [];
    default:
      return EVERY_DAY_OF_WEEK;
  }
}

export function getMedicationDaysOfWeek(medication: Pick<Medication, 'schedule' | 'daysOfWeek' | 'startDate'>): MedicationDayOfWeek[] {
  if (medication.schedule === 'as_needed') return [];
  if (Array.isArray(medication.daysOfWeek) && medication.daysOfWeek.length > 0) {
    return medication.daysOfWeek.filter((day): day is MedicationDayOfWeek =>
      Number.isInteger(day) && day >= 0 && day <= 6,
    );
  }
  if (medication.schedule === 'weekly') {
    return [new Date(medication.startDate || Date.now()).getDay() as MedicationDayOfWeek];
  }
  return getDefaultDaysForSchedule(medication.schedule);
}

export function shouldMedicationOccurOnDay(
  medication: Pick<Medication, 'schedule' | 'daysOfWeek' | 'startDate'>,
  date: Date = new Date(),
): boolean {
  if (medication.schedule === 'as_needed') return false;
  return getMedicationDaysOfWeek(medication).includes(date.getDay() as MedicationDayOfWeek);
}

export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

export function formatMedicationSchedule(medication: Pick<Medication, 'schedule' | 'times' | 'daysOfWeek' | 'startDate'>): string {
  if (medication.schedule === 'as_needed') return 'As needed';
  const times = Array.isArray(medication.times) && medication.times.length > 0
    ? medication.times.map(t => formatTime(t.hour, t.minute)).join(', ')
    : 'No times set';
  const days = getMedicationDaysOfWeek(medication);
  const isEveryDay = days.length === 7;
  if (isEveryDay) return times;
  const dayLabels = MEDICATION_WEEKDAYS
    .filter(day => days.includes(day.value))
    .map(day => day.shortLabel)
    .join(', ');
  return `${dayLabels || 'No days set'} · ${times}`;
}

export function getCategoryColor(category: MedicationCategory): string {
  switch (category) {
    case 'antidepressant': return '#14B8A6';
    case 'mood_stabilizer': return '#2E2A72';
    case 'antipsychotic': return '#2E2A72';
    case 'anxiolytic': return '#67E8F9';
    case 'sleep_aid': return '#2E2A72';
    case 'stimulant': return '#67E8F9';
    case 'supplement': return '#14B8A6';
    case 'other': return '#3B82F6';
  }
}
