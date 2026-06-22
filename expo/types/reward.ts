export type RewardCategory =
  | 'check_in'
  | 'journaling'
  | 'insight'
  | 'calm'
  | 'community'
  | 'pause_win'
  | 'reflection'
  | 'skill_practice'
  | 'therapy_prep'
  | 'medication'
  | 'companion'
  | 'support_before_reaction'
  | 'appointment'
  | 'movement'
  | 'consistency';

export type MilestoneLevel = 'bronze' | 'silver' | 'gold';

export interface MilestoneDefinition {
  id: string;
  title: string;
  description: string;
  category: RewardCategory;
  threshold: number;
  level: MilestoneLevel;
  icon: string;
  celebrationMessage: string;
}

export interface UnlockedMilestone {
  milestoneId: string;
  unlockedAt: number;
  seen: boolean;
}

export interface ConsistencyMetrics {
  checkInDays: number;
  journalDays: number;
  pauseWins: number;
  weeklyReflections: number;
  therapyPreps: number;
  medicationAdherenceDays: number;
  companionSessions: number;
  supportBeforeReaction: number;
  appointmentsAttended: number;
  currentCheckInStreak: number;
  currentJournalStreak: number;
  emotionalAwarenessStreak: number;
  companionReflectionStreak: number;
  skillPracticeStreak: number;
  firstInsightCount: number;
  savedInsightCount: number;
  calmMeDownSessions: number;
  communityPosts: number;
  skillPracticeSessions: number;
}

export interface RewardState {
  unlockedMilestones: UnlockedMilestone[];
  metrics: ConsistencyMetrics;
  lastComputedAt: number;
}

export const DEFAULT_CONSISTENCY_METRICS: ConsistencyMetrics = {
  checkInDays: 0,
  journalDays: 0,
  pauseWins: 0,
  weeklyReflections: 0,
  therapyPreps: 0,
  medicationAdherenceDays: 0,
  companionSessions: 0,
  supportBeforeReaction: 0,
  appointmentsAttended: 0,
  currentCheckInStreak: 0,
  currentJournalStreak: 0,
  emotionalAwarenessStreak: 0,
  companionReflectionStreak: 0,
  skillPracticeStreak: 0,
  firstInsightCount: 0,
  savedInsightCount: 0,
  calmMeDownSessions: 0,
  communityPosts: 0,
  skillPracticeSessions: 0,
};

export const DEFAULT_REWARD_STATE: RewardState = {
  unlockedMilestones: [],
  metrics: { ...DEFAULT_CONSISTENCY_METRICS },
  lastComputedAt: 0,
};

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: 'first_checkin',
    title: 'First Check-In',
    description: 'You completed your first emotional check-in.',
    category: 'check_in',
    threshold: 1,
    level: 'bronze',
    icon: 'Heart',
    celebrationMessage: 'You created the first signal in your emotional map.',
  },
  {
    id: 'first_insight',
    title: 'First Insight',
    description: 'Your first pattern insight is available.',
    category: 'insight',
    threshold: 1,
    level: 'bronze',
    icon: 'BarChart3',
    celebrationMessage: 'A pattern is starting to become visible.',
  },
  {
    id: 'first_calm_me_down',
    title: 'First Calm Me Down',
    description: 'You completed your first Calm Me Down session.',
    category: 'calm',
    threshold: 1,
    level: 'bronze',
    icon: 'Wind',
    celebrationMessage: 'You practiced settling your body before moving forward.',
  },
  {
    id: 'first_saved_insight',
    title: 'First Saved Insight',
    description: 'You saved an insight for later reflection.',
    category: 'insight',
    threshold: 1,
    level: 'bronze',
    icon: 'Bookmark',
    celebrationMessage: 'You kept something meaningful to return to.',
  },
  {
    id: 'five_day_reflection',
    title: '5 Day Reflection',
    description: 'You reflected on five different days.',
    category: 'reflection',
    threshold: 5,
    level: 'silver',
    icon: 'Compass',
    celebrationMessage: 'Reflection is becoming part of how you care for yourself.',
  },
  {
    id: 'seven_day_checkin',
    title: '7 Day Check-In',
    description: 'You checked in on seven different days.',
    category: 'check_in',
    threshold: 7,
    level: 'silver',
    icon: 'Heart',
    celebrationMessage: 'Seven days of emotional awareness gives your patterns more shape.',
  },
  {
    id: 'first_week_complete',
    title: 'First Week Complete',
    description: 'Your first week has enough signal to review.',
    category: 'consistency',
    threshold: 7,
    level: 'silver',
    icon: 'Sparkles',
    celebrationMessage: 'Your first week of signals is ready to become insight.',
  },
  {
    id: 'first_community_post',
    title: 'First Community Post',
    description: 'You shared in Community for the first time.',
    category: 'community',
    threshold: 1,
    level: 'bronze',
    icon: 'Users',
    celebrationMessage: 'You reached for peer support without having to carry it alone.',
  },
  {
    id: 'first_dont_send_it',
    title: "First Don't Send It",
    description: 'You used Pause Before I Send for the first time.',
    category: 'pause_win',
    threshold: 1,
    level: 'bronze',
    icon: 'Shield',
    celebrationMessage: 'You made space between emotion and action.',
  },
];
