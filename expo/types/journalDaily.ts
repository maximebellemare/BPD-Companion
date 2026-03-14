import { Emotion } from '@/types';

export type DailyReflectionType = 'morning' | 'evening';

export interface DailyReflection {
  id: string;
  type: DailyReflectionType;
  timestamp: number;
  date: string;
  emotions: Emotion[];
  activationLevel: number;
  text: string;
  intention?: string;
  proudMoment?: string;
  savedAsImportant: boolean;
  addToWeeklyReflection: boolean;
}

export interface DailyReflectionStreak {
  currentStreak: number;
  longestStreak: number;
  totalMornings: number;
  totalEvenings: number;
  lastMorningDate: string | null;
  lastEveningDate: string | null;
  thisWeekDays: number;
}

export interface JournalPrediction {
  id: string;
  timestamp: number;
  type: 'trigger_pattern' | 'emotional_buildup' | 'time_pattern' | 'relationship_cycle' | 'urgency_cycle';
  title: string;
  description: string;
  confidence: 'low' | 'medium' | 'high';
  suggestedAction: {
    label: string;
    route: string;
    params?: Record<string, string>;
  };
  basedOn: string;
  acknowledged: boolean;
}

export interface AIJournalSession {
  id: string;
  mode: AIJournalMode;
  startedAt: number;
  messages: AIJournalMessage[];
  entryId?: string;
  summary?: AIJournalSessionSummary;
  isActive: boolean;
}

export type AIJournalMode =
  | 'free_reflection'
  | 'emotional_event'
  | 'relationship_conflict'
  | 'shame_recovery'
  | 'trigger_analysis'
  | 'letter_not_sent'
  | 'future_self'
  | 'therapy_prep'
  | 'breakthrough';

export interface AIJournalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AIJournalSessionSummary {
  trigger?: string;
  coreEmotion?: string;
  interpretation?: string;
  insight?: string;
  suggestedNextStep?: string;
  generatedAt: number;
}

export const AI_JOURNAL_MODE_CONFIG: Record<AIJournalMode, {
  label: string;
  emoji: string;
  description: string;
  systemContext: string;
  openingPrompt: string;
}> = {
  free_reflection: {
    label: 'Free Reflection',
    emoji: '🪞',
    description: 'Write and reflect with AI guidance',
    systemContext: 'Help the user explore their thoughts and emotions through reflective journaling. Ask clarifying questions, identify emotions, and offer gentle insights.',
    openingPrompt: 'What\'s on your mind right now? Start wherever feels right — I\'ll help you explore it.',
  },
  emotional_event: {
    label: 'Process an Event',
    emoji: '🌊',
    description: 'Work through something that happened',
    systemContext: 'Help the user process a specific emotional event. Guide them through what happened, their interpretation, the emotions involved, and alternative perspectives.',
    openingPrompt: 'Tell me what happened. Start with the facts — what actually occurred?',
  },
  relationship_conflict: {
    label: 'Relationship Conflict',
    emoji: '💬',
    description: 'Process a difficult interaction',
    systemContext: 'Help the user process a relationship conflict. Focus on what happened, their interpretation, unmet needs, and what a secure response might look like.',
    openingPrompt: 'What happened in the interaction? Who was involved and what was said or done?',
  },
  shame_recovery: {
    label: 'Shame Recovery',
    emoji: '🫂',
    description: 'Gently process shame',
    systemContext: 'Help the user process shame with compassion. Identify what triggered the shame, challenge the inner critic, and guide toward self-compassion.',
    openingPrompt: 'Something brought up shame. You don\'t have to share everything — just start with what feels safe.',
  },
  trigger_analysis: {
    label: 'Understand a Trigger',
    emoji: '🔍',
    description: 'Dig into what set you off',
    systemContext: 'Help the user understand their trigger in depth. Explore the surface event, the deeper meaning, past connections, and the activated belief system.',
    openingPrompt: 'Something triggered a strong reaction. What happened on the surface?',
  },
  letter_not_sent: {
    label: 'Letter Not Sent',
    emoji: '📨',
    description: 'Write what you need to say — safely',
    systemContext: 'Support the user in writing an unsent letter. Help them express what they need to say without filtering. After writing, help them process the emotions.',
    openingPrompt: 'Who do you want to write to, and what do you need them to know?',
  },
  future_self: {
    label: 'Future Self Letter',
    emoji: '🕊️',
    description: 'Send encouragement forward',
    systemContext: 'Guide the user in writing a letter to their future self. Help them reflect on current challenges, acknowledge growth, and offer compassion forward.',
    openingPrompt: 'If you could send a message to yourself in the future — what would future-you need to hear?',
  },
  therapy_prep: {
    label: 'Therapy Prep',
    emoji: '📋',
    description: 'Prepare for your next session',
    systemContext: 'Help the user organize their thoughts for an upcoming therapy session. Identify key themes, questions, moments they want to discuss, and what they want from the session.',
    openingPrompt: 'Let\'s prepare for your next therapy session. What feels most important to bring up?',
  },
  breakthrough: {
    label: 'Capture Insight',
    emoji: '💡',
    description: 'Record a moment of clarity',
    systemContext: 'Help the user articulate and deepen a breakthrough insight. Ask what they realized, how it connects to their patterns, and what it means for them going forward.',
    openingPrompt: 'You had a moment of clarity. What did you realize?',
  },
};

export const MORNING_PROMPTS = [
  'How do you feel starting today?',
  'What feels most emotionally important today?',
  'What do you want to protect today?',
  'What would help you stay steady today?',
  'What support might you need today?',
];

export const EVENING_PROMPTS = [
  'What stood out emotionally today?',
  'What triggered you today?',
  'What helped today?',
  'Was there a moment you\'re proud of?',
  'Is there anything you want to understand better?',
];

export const MORNING_INTENTIONS = [
  { id: 'mi1', label: 'Stay grounded', emoji: '🌿' },
  { id: 'mi2', label: 'Pause before reacting', emoji: '⏸️' },
  { id: 'mi3', label: 'Be gentle with myself', emoji: '💛' },
  { id: 'mi4', label: 'Communicate clearly', emoji: '🗣️' },
  { id: 'mi5', label: 'Notice my patterns', emoji: '🔍' },
  { id: 'mi6', label: 'Practice self-compassion', emoji: '🫂' },
  { id: 'mi7', label: 'Accept uncertainty', emoji: '🌊' },
  { id: 'mi8', label: 'Ask for help if needed', emoji: '🤝' },
];
