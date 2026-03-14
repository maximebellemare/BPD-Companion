export type BehaviorSignalType =
  | 'inactivity'
  | 'distress_pattern'
  | 'message_session_intense'
  | 'streak_milestone'
  | 'growth_signal'
  | 'journal_prompt'
  | 'regulation_success'
  | 'companion_absence'
  | 'evening_unprocessed';

export type BehaviorNotificationPriority = 'gentle' | 'supportive' | 'celebratory';

export interface BehaviorSignal {
  type: BehaviorSignalType;
  strength: number;
  detectedAt: number;
  context: Record<string, string | number | boolean>;
}

export interface BehaviorNotificationDecision {
  signalType: BehaviorSignalType;
  shouldFire: boolean;
  priority: BehaviorNotificationPriority;
  title: string;
  body: string;
  deepLink: string;
  reason: string;
  delaySeconds: number;
  cooldownHours: number;
}

export interface BehaviorTrackingState {
  lastAppOpenTimestamp: number | null;
  lastCheckInTimestamp: number | null;
  lastJournalTimestamp: number | null;
  lastCompanionTimestamp: number | null;
  lastMessageSessionTimestamp: number | null;
  consecutiveHighDistressDays: number;
  currentStreakDays: number;
  longestStreakDays: number;
  totalCheckIns: number;
  recentDistressLevels: number[];
  recentMessageSessionCount: number;
  lastNotificationByType: Record<string, number>;
  growthSignalsDetected: string[];
  lastGrowthCelebration: number | null;
}

export interface BehaviorNotificationAnalyticsEvent {
  eventType: 'triggered' | 'suppressed' | 'tapped' | 'dismissed';
  signalType: BehaviorSignalType;
  priority: BehaviorNotificationPriority;
  reason: string;
  timestamp: number;
}

export const DEFAULT_BEHAVIOR_TRACKING_STATE: BehaviorTrackingState = {
  lastAppOpenTimestamp: null,
  lastCheckInTimestamp: null,
  lastJournalTimestamp: null,
  lastCompanionTimestamp: null,
  lastMessageSessionTimestamp: null,
  consecutiveHighDistressDays: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  totalCheckIns: 0,
  recentDistressLevels: [],
  recentMessageSessionCount: 0,
  lastNotificationByType: {},
  growthSignalsDetected: [],
  lastGrowthCelebration: null,
};
