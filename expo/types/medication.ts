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
  | 'weekly'
  | 'as_needed'
  | 'custom';

export type MoodAfter = 'much_better' | 'better' | 'same' | 'worse' | 'much_worse';
export type SideEffectSeverity = 'none' | 'mild' | 'moderate' | 'severe';
export type LogStatus = 'taken' | 'missed' | 'skipped';

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
  { value: 'weekly', label: 'Weekly', description: 'Once per week' },
  { value: 'as_needed', label: 'As needed', description: 'When you need it' },
  { value: 'custom', label: 'Custom', description: 'Set your own times' },
];

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
    case 'weekly':
      return [{ hour: 9, minute: 0, label: 'Weekly' }];
    case 'as_needed':
      return [];
    case 'custom':
      return [{ hour: 9, minute: 0, label: 'Dose 1' }];
  }
}

export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
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
