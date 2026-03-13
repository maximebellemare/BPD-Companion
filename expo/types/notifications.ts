export type NotificationCategory =
  | 'daily_checkin'
  | 'weekly_reflection'
  | 'ritual_reminder'
  | 'relationship_support'
  | 'calm_followup'
  | 'premium_reflection'
  | 'therapist_report'
  | 'reengagement'
  | 'streak_support'
  | 'regulation_followup'
  | 'gentle_nudge';

export type ReminderFrequency = 'minimal' | 'balanced' | 'supportive';

export interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface NotificationCategoryConfig {
  id: NotificationCategory;
  label: string;
  description: string;
  defaultEnabled: boolean;
  defaultTimeWindow: { hour: number; minute: number } | null;
  respectsQuietHours: boolean;
  premiumOnly: boolean;
  safetyExempt: boolean;
}

export interface ScheduledReminder {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  scheduledAt: number;
  repeating: boolean;
  data?: Record<string, string>;
}

export interface NotificationEvent {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  sentAt: number;
  tapped: boolean;
  data?: Record<string, string>;
}

export interface NotificationTemplate {
  category: NotificationCategory;
  variants: Array<{
    title: string;
    body: string;
  }>;
  deepLink: string;
}

export interface NotificationDebugEntry {
  type: 'scheduled' | 'triggered' | 'cancelled' | 'blocked_quiet' | 'blocked_safety';
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: number;
  reason?: string;
}
