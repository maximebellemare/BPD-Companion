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
  { value: 'walk', get label() { return localizedText('Walk', 'Caminar'); }, icon: '🚶' },
  { value: 'stretch', get label() { return localizedText('Stretch', 'Estiramiento'); }, icon: '🧘' },
  { value: 'yoga', get label() { return localizedText('Yoga', 'Yoga'); }, icon: '🪷' },
  { value: 'workout', get label() { return localizedText('Workout', 'Entrenamiento'); }, icon: '💪' },
  { value: 'movement_break', get label() { return localizedText('Movement Break', 'Pausa de movimiento'); }, icon: '🌀' },
  { value: 'calming_movement', get label() { return localizedText('Calming Movement', 'Movimiento calmante'); }, icon: '🌊' },
  { value: 'other', get label() { return localizedText('Other', 'Otro'); }, icon: '✨' },
];

export const INTENSITY_OPTIONS: { value: MovementIntensity; label: string; description: string }[] = [
  { value: 'gentle', get label() { return localizedText('Gentle', 'Suave'); }, get description() { return localizedText('Easy, calming pace', 'Ritmo fácil y calmante'); } },
  { value: 'moderate', get label() { return localizedText('Moderate', 'Moderado'); }, get description() { return localizedText('Steady effort', 'Esfuerzo constante'); } },
  { value: 'vigorous', get label() { return localizedText('Vigorous', 'Vigoroso'); }, get description() { return localizedText('High energy', 'Alta energía'); } },
];

export const MOOD_LEVELS: { value: MoodLevel; label: string; emoji: string }[] = [
  { value: 1, get label() { return localizedText('Very low', 'Muy bajo'); }, emoji: '😞' },
  { value: 2, get label() { return localizedText('Low', 'Bajo'); }, emoji: '😕' },
  { value: 3, get label() { return localizedText('Neutral', 'Neutral'); }, emoji: '😐' },
  { value: 4, get label() { return localizedText('Good', 'Bien'); }, emoji: '🙂' },
  { value: 5, get label() { return localizedText('Great', 'Muy bien'); }, emoji: '😊' },
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
import { localizedText } from '@/lib/i18n/staticText';
