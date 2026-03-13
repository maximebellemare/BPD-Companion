import { NotificationCategoryConfig } from '@/types/notifications';

export const NOTIFICATION_CATEGORIES: NotificationCategoryConfig[] = [
  {
    id: 'daily_checkin',
    label: 'Daily Check-in',
    description: 'A gentle reminder to check in with yourself',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 9, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'weekly_reflection',
    label: 'Weekly Reflection',
    description: 'Notification when your weekly reflection is ready',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 10, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'ritual_reminder',
    label: 'Daily Rituals',
    description: 'Morning, midday, and evening ritual prompts',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 8, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'relationship_support',
    label: 'Relationship Support',
    description: 'Gentle pause reminders during relationship triggers',
    defaultEnabled: true,
    defaultTimeWindow: null,
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'calm_followup',
    label: 'Calm Follow-up',
    description: 'A check-in after intense moments settle',
    defaultEnabled: true,
    defaultTimeWindow: null,
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'regulation_followup',
    label: 'Regulation Follow-up',
    description: 'Check-in after high distress episodes',
    defaultEnabled: true,
    defaultTimeWindow: null,
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'premium_reflection',
    label: 'Premium Insights',
    description: 'Deeper emotional pattern insights',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 18, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: true,
    safetyExempt: false,
  },
  {
    id: 'therapist_report',
    label: 'Therapist Report',
    description: 'When a new therapist report is ready',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 10, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'reengagement',
    label: 'Gentle Re-engagement',
    description: 'Supportive nudge if you haven\'t visited in a while',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 11, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'streak_support',
    label: 'Streak Support',
    description: 'Encouragement to keep your check-in rhythm',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 20, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'gentle_nudge',
    label: 'Gentle Nudge',
    description: 'End-of-day check-in encouragement',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 20, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
];

export function getCategoryConfig(id: string): NotificationCategoryConfig | undefined {
  return NOTIFICATION_CATEGORIES.find(c => c.id === id);
}

export function getDeepLinkForCategory(category: string): string {
  switch (category) {
    case 'daily_checkin':
    case 'gentle_nudge':
    case 'reengagement':
      return '/check-in';
    case 'weekly_reflection':
      return '/weekly-reflection';
    case 'ritual_reminder':
      return '/daily-ritual';
    case 'relationship_support':
      return '/relationship-copilot';
    case 'calm_followup':
    case 'regulation_followup':
      return '/check-in';
    case 'premium_reflection':
      return '/emotional-insights';
    case 'therapist_report':
      return '/therapy-report';
    case 'streak_support':
      return '/check-in';
    default:
      return '/check-in';
  }
}
