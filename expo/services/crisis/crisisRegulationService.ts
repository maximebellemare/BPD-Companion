import {
  RegulationUrge,
  RegulationEntryChoice,
  BreathingDuration,
  RegulationSession,
} from '@/types/crisis';

export const REGULATION_URGES: RegulationUrge[] = [
  { id: 'ru1', label: 'Text them', emoji: '💬' },
  { id: 'ru2', label: 'Call them', emoji: '📞' },
  { id: 'ru3', label: 'Explain everything', emoji: '📝' },
  { id: 'ru4', label: 'Disappear', emoji: '🫥' },
  { id: 'ru5', label: 'Lash out', emoji: '😤' },
  { id: 'ru6', label: 'Ask for reassurance', emoji: '🥺' },
  { id: 'ru7', label: 'Self-isolate', emoji: '🚪' },
  { id: 'ru8', label: 'Over-apologize', emoji: '😔' },
];

export const ENTRY_CHOICES: RegulationEntryChoice[] = [
  { id: 'ec1', label: 'Breathe with me', targetStep: 'breathing', icon: 'Wind' },
  { id: 'ec2', label: 'Ground me', targetStep: 'grounding', icon: 'Eye' },
  { id: 'ec3', label: 'Help me not text yet', targetStep: 'help_not_text', icon: 'MessageCircle' },
  { id: 'ec4', label: 'I have a strong urge', targetStep: 'urge_surfing', icon: 'Flame' },
];

export const BREATHING_DURATIONS: { value: BreathingDuration; label: string }[] = [
  { value: 30, label: '30 sec' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
];

export const ENTRY_MESSAGES: string[] = [
  "It seems like things may feel intense right now. Let's make this simple.",
  "You don't need to solve everything right now. One small step first.",
  "Let's slow this down together. You're safe here.",
];

export const GROUNDING_STEPS = [
  { id: 'gs1', count: 5, sense: 'see', instruction: 'Name 5 things you can see right now', color: '#6B9080' },
  { id: 'gs2', count: 4, sense: 'feel', instruction: 'Name 4 things you can physically feel', color: '#7BA7A0' },
  { id: 'gs3', count: 3, sense: 'hear', instruction: 'Name 3 things you can hear', color: '#D4956A' },
  { id: 'gs4', count: 2, sense: 'orient', instruction: 'Orient to the room — look left, then right, slowly', color: '#8B7E74' },
  { id: 'gs5', count: 1, sense: 'anchor', instruction: 'Feel your feet on the floor. Press down gently.', color: '#6B7B8D' },
];

export const URGE_COMPASSION_MESSAGES: string[] = [
  "This urge makes sense. It comes from a real need inside you.",
  "You can feel this urge without obeying it. It will pass.",
  "The urge can pass without you obeying it.",
  "Urges peak and fade. You only need to wait, not act.",
  "This is your nervous system talking. You can hear it without following it.",
];

export const CALM_NEXT_ACTIONS = [
  { id: 'cna1', label: 'Write in journal', desc: 'Put thoughts into words safely', route: '/(tabs)/journal', icon: 'BookOpen', color: '#D4956A', bg: '#F5E6D8' },
  { id: 'cna2', label: 'Talk to AI Companion', desc: 'Process with calm support', route: '/(tabs)/companion', icon: 'Bot', color: '#5B8FB9', bg: '#E3EFF7' },
  { id: 'cna3', label: 'Simulate responses', desc: 'Try different communication options', route: '/(tabs)/messages', icon: 'MessageCircle', color: '#7BA7A0', bg: '#E3EDE8' },
  { id: 'cna4', label: 'Use secure rewrite', desc: 'Craft a calmer message', route: '/(tabs)/messages', icon: 'Edit3', color: '#6B9080', bg: '#E3EDE8' },
  { id: 'cna5', label: 'Do another grounding round', desc: 'Keep building calm', route: null, icon: 'Eye', color: '#8B7E74', bg: '#EDE8E3' },
  { id: 'cna6', label: 'Return in 10 minutes', desc: 'Give yourself space', route: null, icon: 'Clock', color: '#6B7B8D', bg: '#E3E8ED' },
];

export const DELAY_OPTIONS = [
  { id: 'do1', minutes: 2, label: '2 min' },
  { id: 'do2', minutes: 5, label: '5 min' },
  { id: 'do3', minutes: 10, label: '10 min' },
];

export function getEntryMessage(): string {
  return ENTRY_MESSAGES[Math.floor(Math.random() * ENTRY_MESSAGES.length)];
}

export function getUrgeCompassion(): string {
  return URGE_COMPASSION_MESSAGES[Math.floor(Math.random() * URGE_COMPASSION_MESSAGES.length)];
}

export function createRegulationSession(): RegulationSession {
  return {
    id: `reg_${Date.now()}`,
    startedAt: Date.now(),
    completedAt: null,
    stepsVisited: ['entry'],
    selectedUrges: [],
    urgeIntensity: null,
    breathingDuration: null,
    delayMinutes: null,
    draftSaved: false,
  };
}

export function getIntensityLabel(intensity: number): string {
  if (intensity <= 2) return 'mild';
  if (intensity <= 4) return 'moderate';
  if (intensity <= 6) return 'strong';
  if (intensity <= 8) return 'very strong';
  return 'overwhelming';
}

export function getDelayEncouragement(minutes: number): string {
  if (minutes <= 2) return "Two minutes can change everything. Just breathe.";
  if (minutes <= 5) return "Five minutes of space is a gift to yourself.";
  return "Ten minutes is enough for most urges to soften.";
}
