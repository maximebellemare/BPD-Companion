export type MovementType =
  | 'walk'
  | 'stretch'
  | 'yoga'
  | 'workout'
  | 'movement_break'
  | 'calming_movement'
  | 'other';

export type MovementIntensity = 'gentle' | 'moderate' | 'vigorous';

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MovementEntry {
  id: string;
  type: MovementType;
  customType?: string;
  duration: number;
  intensity: MovementIntensity;
  moodBefore: MoodLevel;
  moodAfter: MoodLevel;
  notes: string;
  timestamp: number;
  createdAt: number;
}

export interface MovementState {
  entries: MovementEntry[];
}

export const DEFAULT_MOVEMENT_STATE: MovementState = {
  entries: [],
};

export const MOVEMENT_TYPES: { value: MovementType; label: string; icon: string }[] = [
  { value: 'walk', label: 'Walk', icon: '🚶' },
  { value: 'stretch', label: 'Stretch', icon: '🧘' },
  { value: 'yoga', label: 'Yoga', icon: '🪷' },
  { value: 'workout', label: 'Workout', icon: '💪' },
  { value: 'movement_break', label: 'Movement Break', icon: '🌀' },
  { value: 'calming_movement', label: 'Calming Movement', icon: '🌊' },
  { value: 'other', label: 'Other', icon: '✨' },
];

export const INTENSITY_OPTIONS: { value: MovementIntensity; label: string; description: string }[] = [
  { value: 'gentle', label: 'Gentle', description: 'Easy, calming pace' },
  { value: 'moderate', label: 'Moderate', description: 'Steady effort' },
  { value: 'vigorous', label: 'Vigorous', description: 'High energy' },
];

export const MOOD_LEVELS: { value: MoodLevel; label: string; emoji: string }[] = [
  { value: 1, label: 'Very low', emoji: '😞' },
  { value: 2, label: 'Low', emoji: '😕' },
  { value: 3, label: 'Neutral', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😊' },
];

export const DURATION_PRESETS: { value: number; label: string }[] = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];

export function getMovementTypeLabel(type: MovementType): string {
  return MOVEMENT_TYPES.find(t => t.value === type)?.label ?? type;
}

export function getMovementTypeIcon(type: MovementType): string {
  return MOVEMENT_TYPES.find(t => t.value === type)?.icon ?? '✨';
}

export function getIntensityColor(intensity: MovementIntensity): string {
  switch (intensity) {
    case 'gentle': return '#14B8A6';
    case 'moderate': return '#67E8F9';
    case 'vigorous': return '#3B82F6';
  }
}

export function getMoodEmoji(level: MoodLevel): string {
  return MOOD_LEVELS.find(m => m.value === level)?.emoji ?? '😐';
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}
