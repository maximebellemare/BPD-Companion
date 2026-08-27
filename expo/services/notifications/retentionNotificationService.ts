import { Platform } from 'react-native';
import { storageService } from '@/services/storage/storageService';
import { notificationService } from '@/services/notifications/notificationService';
import type { OnboardingProfile } from '@/types/onboarding';
import type { NotificationCategory, QuietHours } from '@/types/notifications';

export type RetentionNotificationKind = 'day2_aha' | 'day3_recap' | 'weekly_insight';

type Storage = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
};

type Notifications = {
  scheduleReminder: typeof notificationService.scheduleReminder;
};

type Analytics = (eventName: string, properties?: Record<string, string | number | boolean>) => void;

export type RetentionNotificationScheduleResult =
  | { status: 'scheduled'; notificationId: string }
  | { status: 'skipped_duplicate' }
  | { status: 'skipped_disabled' }
  | { status: 'skipped_missing_owner' }
  | { status: 'skipped_unsupported_platform' }
  | { status: 'failed' };

const RETENTION_NOTIFICATION_KEY_PREFIX = 'retention_notification_scheduled';
const MIN_DELAY_SECONDS = 60;
const inFlight = new Set<string>();

function hashOwner(ownerId: string): string {
  let hash = 5381;
  for (let index = 0; index < ownerId.length; index += 1) {
    hash = ((hash << 5) + hash) + ownerId.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getStorageKey(ownerId: string, kind: RetentionNotificationKind, episodeKey: string): string {
  return `${RETENTION_NOTIFICATION_KEY_PREFIX}:${hashOwner(ownerId)}:${kind}:${episodeKey}`;
}

function getCopy(kind: RetentionNotificationKind): {
  category: NotificationCategory;
  title: string;
  body: string;
  targetScreen: string;
} {
  switch (kind) {
    case 'day2_aha':
      return {
        category: 'premium_reflection',
        title: 'A new insight is ready',
        body: 'Open BPD Companion when you have a quiet moment.',
        targetScreen: '/(tabs)/(home)',
      };
    case 'day3_recap':
      return {
        category: 'premium_reflection',
        title: 'Your progress recap is ready',
        body: 'A short reflection is waiting inside BPD Companion.',
        targetScreen: '/(tabs)/(home)',
      };
    case 'weekly_insight':
      return {
        category: 'weekly_reflection',
        title: 'Your weekly insight is ready',
        body: 'Open BPD Companion to review what changed this week.',
        targetScreen: '/weekly-reflection',
      };
  }
}

function isEnabledByPreferences(kind: RetentionNotificationKind, onboardingProfile?: OnboardingProfile | null): boolean {
  const preferences = onboardingProfile?.reminderPreferences;
  if (!preferences) return true;
  if (kind === 'weekly_insight') return preferences.weeklyReflectionReminders !== false;
  return preferences.dailyReminders !== false;
}

function moveLateNightToMorning(timestamp: number, onboardingProfile?: OnboardingProfile | null): number {
  if (!onboardingProfile?.hardestMoments.includes('late_night_spirals')) return timestamp;
  const date = new Date(timestamp);
  const hour = date.getHours();
  if (hour >= 7 && hour < 21) return timestamp;
  if (hour >= 21) date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date.getTime();
}

export function getRetentionNotificationDelaySeconds(params: {
  kind: RetentionNotificationKind;
  eligibleAt: number;
  now?: number;
  onboardingProfile?: OnboardingProfile | null;
}): number {
  const now = params.now ?? Date.now();
  const tone = params.onboardingProfile?.reminderPreferences.tone ?? 'balanced';
  const toneOffsetMs = tone === 'supportive'
    ? 15 * 60 * 1000
    : tone === 'minimal'
      ? 2 * 60 * 60 * 1000
      : 60 * 60 * 1000;
  const kindOffsetMs = params.kind === 'weekly_insight' ? 60 * 60 * 1000 : params.kind === 'day3_recap' ? 30 * 60 * 1000 : 10 * 60 * 1000;
  const targetAt = moveLateNightToMorning(params.eligibleAt + toneOffsetMs + kindOffsetMs, params.onboardingProfile);
  return Math.max(MIN_DELAY_SECONDS, Math.ceil((targetAt - now) / 1000));
}

export async function scheduleRetentionNotificationOnce(params: {
  ownerId: string | null | undefined;
  kind: RetentionNotificationKind;
  episodeKey: string | null | undefined;
  eligibleAt: number;
  onboardingProfile?: OnboardingProfile | null;
  quietHours?: QuietHours;
  currentDistress?: number;
  now?: number;
  storage?: Storage;
  notifications?: Notifications;
  trackEvent?: Analytics;
  platform?: typeof Platform.OS;
}): Promise<RetentionNotificationScheduleResult> {
  const platform = params.platform ?? Platform.OS;
  if (platform === 'web') return { status: 'skipped_unsupported_platform' };
  if (!params.ownerId || !params.episodeKey) return { status: 'skipped_missing_owner' };
  if (!isEnabledByPreferences(params.kind, params.onboardingProfile)) return { status: 'skipped_disabled' };

  const storage = params.storage ?? storageService;
  const notifications = params.notifications ?? notificationService;
  const storageKey = getStorageKey(params.ownerId, params.kind, params.episodeKey);
  if (inFlight.has(storageKey)) return { status: 'skipped_duplicate' };

  const existing = await storage.get<{ notificationId: string }>(storageKey).catch(() => null);
  if (existing?.notificationId) return { status: 'skipped_duplicate' };

  inFlight.add(storageKey);
  try {
    const copy = getCopy(params.kind);
    const notificationId = await notifications.scheduleReminder(
      copy.category,
      copy.title,
      copy.body,
      getRetentionNotificationDelaySeconds({
        kind: params.kind,
        eligibleAt: params.eligibleAt,
        now: params.now,
        onboardingProfile: params.onboardingProfile,
      }),
      false,
      {
        rule_id: params.kind,
        reminder_type: 'retention',
        target_screen: copy.targetScreen,
      },
      params.quietHours,
      params.currentDistress,
      false,
    ).catch(() => null);

    if (!notificationId) return { status: 'failed' };
    await storage.set(storageKey, {
      notificationId,
      kind: params.kind,
      episodeKey: params.episodeKey,
      scheduledAt: params.now ?? Date.now(),
    });
    params.trackEvent?.('retention_notification_scheduled', {
      kind: params.kind,
      category: copy.category,
    });
    return { status: 'scheduled', notificationId };
  } finally {
    inFlight.delete(storageKey);
  }
}
