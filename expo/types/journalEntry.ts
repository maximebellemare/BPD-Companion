import { Emotion, Trigger } from '@/types';

export type JournalEntryFormat =
  | 'free_writing'
  | 'guided_reflection'
  | 'emotional_event'
  | 'relationship_conflict'
  | 'letter_not_sent'
  | 'letter_to_future_self'
  | 'gratitude'
  | 'breakthrough_insight';

export interface JournalTag {
  id: string;
  label: string;
  color: string;
}

export interface JournalAIInsight {
  primaryEmotion: string;
  secondaryEmotion?: string;
  likelyTrigger?: string;
  interpretationPattern?: string;
  cognitiveDistortion?: string;
  mainUrge?: string;
  copingSuggestion?: string;
  summary: string;
  timestamp: number;
}

export interface SmartJournalEntry {
  id: string;
  timestamp: number;
  format: JournalEntryFormat;
  title?: string;
  content: string;
  emotions: Emotion[];
  triggers: Trigger[];
  tags: JournalTag[];
  distressLevel: number;
  notes?: string;
  guidedFlowId?: string;
  guidedResponses?: Record<string, string>;
  aiInsight?: JournalAIInsight;
  isImportant: boolean;
  isTherapyNote: boolean;
  voiceRecordingUri?: string;
  transcript?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GuidedFlowStep {
  id: string;
  prompt: string;
  placeholder: string;
  optional?: boolean;
}

export interface GuidedReflectionFlow {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: 'emotional' | 'relationship' | 'coping' | 'growth' | 'therapy';
  steps: GuidedFlowStep[];
  estimatedMinutes: number;
  isPremium: boolean;
}

export interface JournalWeeklyReport {
  id: string;
  weekStart: number;
  weekEnd: number;
  entryCount: number;
  mainTriggers: string[];
  mostFrequentEmotions: string[];
  avgDistress: number;
  distressTrend: 'improving' | 'stable' | 'worsening';
  skillsThatHelped: string[];
  keyInsights: string[];
  reflectionLetter: string;
  generatedAt: number;
}

export interface JournalPatternResult {
  commonTriggers: { label: string; count: number }[];
  recurringEmotions: { label: string; count: number }[];
  emotionalCycles: string[];
  copingStrategies: { label: string; effectiveness: number }[];
  insights: string[];
}

export interface JournalStats {
  totalEntries: number;
  streakDays: number;
  thisWeekEntries: number;
  avgDistress: number;
  topEmotions: { label: string; count: number }[];
  topTriggers: { label: string; count: number }[];
  importantCount: number;
  therapyNoteCount: number;
}

export const JOURNAL_EMOTIONS: Emotion[] = [
  { id: 'je1', label: 'Anger', emoji: '😤' },
  { id: 'je2', label: 'Shame', emoji: '😞' },
  { id: 'je3', label: 'Fear', emoji: '😰' },
  { id: 'je4', label: 'Sadness', emoji: '😢' },
  { id: 'je5', label: 'Loneliness', emoji: '💔' },
  { id: 'je6', label: 'Abandonment anxiety', emoji: '🫠' },
  { id: 'je7', label: 'Jealousy', emoji: '😒' },
  { id: 'je8', label: 'Confusion', emoji: '😵‍💫' },
  { id: 'je9', label: 'Hope', emoji: '🌱' },
  { id: 'je10', label: 'Relief', emoji: '😮‍💨' },
  { id: 'je11', label: 'Emptiness', emoji: '🫥' },
  { id: 'je12', label: 'Overwhelm', emoji: '😵' },
  { id: 'je13', label: 'Guilt', emoji: '😔' },
  { id: 'je14', label: 'Gratitude', emoji: '🙏' },
  { id: 'je15', label: 'Calm', emoji: '😌' },
  { id: 'je16', label: 'Pride', emoji: '😊' },
];

export const JOURNAL_TAGS: JournalTag[] = [
  { id: 'jt1', label: 'Therapy', color: '#14B8A6' },
  { id: 'jt2', label: 'Relationship', color: '#67E8F9' },
  { id: 'jt3', label: 'Growth', color: '#14B8A6' },
  { id: 'jt4', label: 'Trigger', color: '#3B82F6' },
  { id: 'jt5', label: 'Coping', color: '#3B82F6' },
  { id: 'jt6', label: 'Self-care', color: '#2E2A72' },
  { id: 'jt7', label: 'Breakthrough', color: '#14B8A6' },
  { id: 'jt8', label: 'Identity', color: '#67E8F9' },
];

export const FORMAT_CONFIG: Record<JournalEntryFormat, {
  label: string;
  emoji: string;
  description: string;
  placeholder: string;
}> = {
  free_writing: {
    label: 'Free Writing',
    emoji: '✍️',
    description: 'Write whatever comes to mind',
    placeholder: 'Let it flow. No structure needed...',
  },
  guided_reflection: {
    label: 'Guided Reflection',
    emoji: '🧭',
    description: 'Step-by-step emotional reflection',
    placeholder: 'Follow the prompts to reflect...',
  },
  emotional_event: {
    label: 'Emotional Event',
    emoji: '🌊',
    description: 'Process something that happened',
    placeholder: 'What happened and how did it affect you...',
  },
  relationship_conflict: {
    label: 'Relationship Conflict',
    emoji: '💬',
    description: 'Work through a conflict',
    placeholder: 'Describe what happened in the interaction...',
  },
  letter_not_sent: {
    label: 'Letter Not Sent',
    emoji: '📨',
    description: 'Write what you need to say — safely',
    placeholder: 'Dear...',
  },
  letter_to_future_self: {
    label: 'Letter to Future Self',
    emoji: '🕊️',
    description: 'Send encouragement forward',
    placeholder: 'Dear future me...',
  },
  gratitude: {
    label: 'Gratitude',
    emoji: '🙏',
    description: 'Notice what you appreciate',
    placeholder: 'Today I am grateful for...',
  },
  breakthrough_insight: {
    label: 'Breakthrough Insight',
    emoji: '💡',
    description: 'Capture a moment of clarity',
    placeholder: 'I just realized...',
  },
};
