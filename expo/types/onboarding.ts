export type PrimaryReason =
  | 'relationship_spirals'
  | 'fear_of_abandonment'
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
  | 'difficulty_staying_consistent';

export type PreferredTool =
  | 'ai_companion'
  | 'journaling'
  | 'grounding'
  | 'pause_before_messaging'
  | 'relationship_support'
  | 'reflections_insights'
  | 'dbt_tools'
  | 'routines_reminders';

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
  reminderPreferences: ReminderPreferences;
  desiredOutcomes: DesiredOutcome[];
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
  reminderPreferences: {
    dailyReminders: true,
    weeklyReflectionReminders: true,
    tone: 'balanced',
  },
  desiredOutcomes: [],
  completedAt: null,
  skippedAt: null,
};

export interface OnboardingStepConfig {
  id: string;
  title: string;
  subtitle: string;
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  { id: 'welcome', title: 'Welcome', subtitle: 'Your companion for emotional support' },
  { id: 'primary_reason', title: 'What brings you here?', subtitle: 'This helps us personalize your experience' },
  { id: 'hardest_moments', title: 'Hardest moments', subtitle: 'Select what feels most difficult' },
  { id: 'treatment', title: 'Your support context', subtitle: 'Help us understand your care' },
  { id: 'tools', title: 'What helps you most?', subtitle: 'We\'ll prioritize these for you' },
  { id: 'reminders', title: 'Stay supported', subtitle: 'Set your reminder preferences' },
  { id: 'outcomes', title: 'What does progress look like?', subtitle: 'Your personal goals' },
];

export const PRIMARY_REASON_OPTIONS: { value: PrimaryReason; label: string; icon: string }[] = [
  { value: 'relationship_spirals', label: 'Relationship spirals', icon: 'Heart' },
  { value: 'fear_of_abandonment', label: 'Fear of abandonment', icon: 'UserX' },
  { value: 'impulsive_messaging', label: 'Impulsive texting / messaging', icon: 'MessageCircle' },
  { value: 'emotional_overwhelm', label: 'Emotional overwhelm', icon: 'CloudLightning' },
  { value: 'therapy_support', label: 'Therapy support', icon: 'Stethoscope' },
  { value: 'building_stability', label: 'Building stability', icon: 'Anchor' },
  { value: 'understanding_patterns', label: 'Understanding my patterns', icon: 'TrendingUp' },
  { value: 'medication_routine', label: 'Medication & routine support', icon: 'Pill' },
];

export const HARDEST_MOMENT_OPTIONS: { value: HardestMoment; label: string }[] = [
  { value: 'delayed_replies', label: 'Delayed replies' },
  { value: 'conflict', label: 'Conflict' },
  { value: 'feeling_rejected', label: 'Feeling rejected' },
  { value: 'shame_after_conflict', label: 'Shame after conflict' },
  { value: 'not_knowing_how_to_respond', label: 'Not knowing how to respond' },
  { value: 'late_night_spirals', label: 'Late-night spirals' },
  { value: 'intense_mood_shifts', label: 'Intense mood shifts' },
  { value: 'difficulty_staying_consistent', label: 'Difficulty staying consistent' },
];

export const PREFERRED_TOOL_OPTIONS: { value: PreferredTool; label: string; icon: string }[] = [
  { value: 'ai_companion', label: 'AI Companion', icon: 'Sparkles' },
  { value: 'journaling', label: 'Journaling', icon: 'BookOpen' },
  { value: 'grounding', label: 'Grounding exercises', icon: 'Wind' },
  { value: 'pause_before_messaging', label: 'Pause before messaging', icon: 'Timer' },
  { value: 'relationship_support', label: 'Relationship support', icon: 'Users' },
  { value: 'reflections_insights', label: 'Reflections & insights', icon: 'BarChart3' },
  { value: 'dbt_tools', label: 'DBT-style tools', icon: 'Wrench' },
  { value: 'routines_reminders', label: 'Routines & reminders', icon: 'Clock' },
];

export const DESIRED_OUTCOME_OPTIONS: { value: DesiredOutcome; label: string }[] = [
  { value: 'fewer_relationship_spirals', label: 'Fewer relationship spirals' },
  { value: 'better_emotional_control', label: 'Better emotional control' },
  { value: 'more_pause_before_reacting', label: 'More pause before reacting' },
  { value: 'better_therapy_support', label: 'Better therapy support' },
  { value: 'more_consistency', label: 'More consistency' },
  { value: 'better_understanding_triggers', label: 'Better understanding of my triggers' },
];
