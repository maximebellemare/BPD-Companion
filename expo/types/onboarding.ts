export type PrimaryReason =
  | 'intense_emotions'
  | 'relationship_conflict'
  | 'fear_of_abandonment'
  | 'impulsive_urges'
  | 'identity_confusion'
  | 'mood_swings'
  | 'self_reflection_journaling'
  | 'relationship_spirals'
  | 'impulsive_messaging'
  | 'emotional_overwhelm'
  | 'therapy_support'
  | 'building_stability'
  | 'understanding_patterns'
  | 'medication_routine';

export type HardestMoment =
  | 'delayed_replies'
  | 'conflict'
  | 'feeling_rejected'
  | 'shame_after_conflict'
  | 'not_knowing_how_to_respond'
  | 'late_night_spirals'
  | 'intense_mood_shifts'
  | 'difficulty_staying_consistent'
  | 'fear_of_being_too_much'
  | 'splitting'
  | 'emotional_numbness'
  | 'self_destructive_urges'
  | 'feeling_empty'
  | 'trust_issues'
  | 'people_pleasing'
  | 'dissociation';

export type PreferredTool =
  | 'calm_emotional_spikes'
  | 'understand_patterns'
  | 'improve_relationships'
  | 'dbt_coping_skills'
  | 'track_moods_triggers'
  | 'feel_less_alone'
  | 'ai_companion'
  | 'journaling'
  | 'grounding'
  | 'pause_before_messaging'
  | 'relationship_support'
  | 'reflections_insights'
  | 'dbt_tools'
  | 'routines_reminders';

export type DailyCheckInTrack =
  | 'mood'
  | 'emotions'
  | 'triggers'
  | 'urges'
  | 'sleep'
  | 'relationships'
  | 'notes';

export type ReminderTone = 'minimal' | 'balanced' | 'supportive';

export type DesiredOutcome =
  | 'fewer_relationship_spirals'
  | 'better_emotional_control'
  | 'more_pause_before_reacting'
  | 'better_therapy_support'
  | 'more_consistency'
  | 'better_understanding_triggers';

export interface TreatmentContext {
  inTherapy: boolean;
  seesPsychiatrist: boolean;
  trackAppointments: boolean;
  trackMedications: boolean;
}

export interface ReminderPreferences {
  dailyReminders: boolean;
  weeklyReflectionReminders: boolean;
  tone: ReminderTone;
}

export interface OnboardingProfile {
  primaryReasons: PrimaryReason[];
  hardestMoments: HardestMoment[];
  treatmentContext: TreatmentContext;
  preferredTools: PreferredTool[];
  dailyCheckInTracks: DailyCheckInTrack[];
  reminderPreferences: ReminderPreferences;
  desiredOutcomes: DesiredOutcome[];
  safetyAcknowledged: boolean;
  completedAt: number | null;
  skippedAt: number | null;
}

export const DEFAULT_ONBOARDING_PROFILE: OnboardingProfile = {
  primaryReasons: [],
  hardestMoments: [],
  treatmentContext: {
    inTherapy: false,
    seesPsychiatrist: false,
    trackAppointments: false,
    trackMedications: false,
  },
  preferredTools: [],
  dailyCheckInTracks: [],
  reminderPreferences: {
    dailyReminders: true,
    weeklyReflectionReminders: true,
    tone: 'balanced',
  },
  desiredOutcomes: [],
  safetyAcknowledged: false,
  completedAt: null,
  skippedAt: null,
};

export interface OnboardingStepConfig {
  id: string;
  title: string;
  subtitle: string;
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 'welcome',
    title: 'Welcome to BPD Companion',
    subtitle: 'Understand emotional patterns, pause impulsive reactions, and build regulation skills.',
  },
  {
    id: 'reasons',
    title: 'What brings you here?',
    subtitle: 'Select the experiences you want support with.',
  },
  {
    id: 'support',
    title: 'What support do you want most?',
    subtitle: 'Choose the kind of help you want in hard moments.',
  },
  {
    id: 'daily_check_in',
    title: 'Daily check-in setup',
    subtitle: 'Choose what helps you understand your emotional chain.',
  },
  {
    id: 'safety',
    title: 'Safety and support',
    subtitle: 'A clear agreement about what this app can and cannot do.',
  },
  {
    id: 'finish',
    title: 'You are set up',
    subtitle: 'Your Companion is ready when emotions feel intense.',
  },
];

export const PRIMARY_REASON_OPTIONS: { value: PrimaryReason; label: string; icon: string }[] = [
  { value: 'intense_emotions', label: 'Intense emotions', icon: 'CloudLightning' },
  { value: 'relationship_conflict', label: 'Relationship conflict', icon: 'Heart' },
  { value: 'fear_of_abandonment', label: 'Fear of abandonment', icon: 'UserX' },
  { value: 'impulsive_urges', label: 'Impulsive urges', icon: 'Timer' },
  { value: 'identity_confusion', label: 'Identity confusion', icon: 'Compass' },
  { value: 'mood_swings', label: 'Mood swings', icon: 'Activity' },
  { value: 'self_reflection_journaling', label: 'Self-reflection / journaling', icon: 'BookOpen' },
];

export const SUPPORT_GOAL_OPTIONS: { value: PreferredTool; label: string; icon: string }[] = [
  { value: 'calm_emotional_spikes', label: 'Calm down during emotional spikes', icon: 'Wind' },
  { value: 'understand_patterns', label: 'Understand my patterns', icon: 'TrendingUp' },
  { value: 'improve_relationships', label: 'Improve relationships', icon: 'Users' },
  { value: 'dbt_coping_skills', label: 'Build DBT-style coping skills', icon: 'Wrench' },
  { value: 'track_moods_triggers', label: 'Track my moods and triggers', icon: 'BarChart3' },
  { value: 'feel_less_alone', label: 'Feel less alone', icon: 'Sparkles' },
];

export const DAILY_CHECK_IN_OPTIONS: { value: DailyCheckInTrack; label: string; icon: string }[] = [
  { value: 'mood', label: 'Mood', icon: 'Activity' },
  { value: 'emotions', label: 'Emotions', icon: 'Heart' },
  { value: 'triggers', label: 'Triggers', icon: 'CloudLightning' },
  { value: 'urges', label: 'Urges', icon: 'Timer' },
  { value: 'sleep', label: 'Sleep', icon: 'Moon' },
  { value: 'relationships', label: 'Relationships', icon: 'Users' },
  { value: 'notes', label: 'Notes', icon: 'BookOpen' },
];

export const HARDEST_MOMENT_OPTIONS: { value: HardestMoment; label: string }[] = [
  { value: 'conflict', label: 'Conflict' },
  { value: 'feeling_rejected', label: 'Feeling rejected' },
  { value: 'late_night_spirals', label: 'Late-night spirals' },
  { value: 'intense_mood_shifts', label: 'Intense mood shifts' },
];

export const PREFERRED_TOOL_OPTIONS = SUPPORT_GOAL_OPTIONS;

export const DESIRED_OUTCOME_OPTIONS: { value: DesiredOutcome; label: string }[] = [
  { value: 'fewer_relationship_spirals', label: 'Fewer relationship spirals' },
  { value: 'better_emotional_control', label: 'Better emotional control' },
  { value: 'more_pause_before_reacting', label: 'More pause before reacting' },
  { value: 'better_understanding_triggers', label: 'Better understanding of my triggers' },
];
