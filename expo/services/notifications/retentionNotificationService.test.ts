import {
  getRetentionNotificationDelaySeconds,
  scheduleRetentionNotificationOnce,
} from '@/services/notifications/retentionNotificationService';
import { DEFAULT_ONBOARDING_PROFILE, type OnboardingProfile } from '@/types/onboarding';
import type { NotificationCategory, QuietHours } from '@/types/notifications';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Retention notification regression failed: ${message}`);
}

function createStorage() {
  const store = new Map<string, unknown>();
  return {
    async get<T>(key: string): Promise<T | null> {
      return (store.get(key) as T | undefined) ?? null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      store.set(key, value);
    },
    size(): number {
      return store.size;
    },
  };
}

function createNotifications(ids: string[]) {
  const calls: {
    category: NotificationCategory;
    title: string;
    body: string;
    requestPermissionIfNeeded: boolean;
    data?: Record<string, string>;
    quietHours?: QuietHours;
  }[] = [];
  return {
    calls,
    async scheduleReminder(
      category: NotificationCategory,
      title: string,
      body: string,
      _triggerSeconds: number,
      _repeating?: boolean,
      data?: Record<string, string>,
      quietHours?: QuietHours,
      _currentDistress?: number,
      requestPermissionIfNeeded?: boolean,
    ): Promise<string | null> {
      calls.push({
        category,
        title,
        body,
        data,
        quietHours,
        requestPermissionIfNeeded: requestPermissionIfNeeded === true,
      });
      return ids.shift() ?? null;
    },
  };
}

export async function assertRetentionNotificationScenarios(): Promise<true> {
  const storage = createStorage();
  const notifications = createNotifications(['day2_notification', 'upgrade_notification', 'new_episode_notification']);
  const events: string[] = [];
  const profile: OnboardingProfile = {
    ...DEFAULT_ONBOARDING_PROFILE,
    hardestMoments: ['late_night_spirals'],
    reminderPreferences: {
      dailyReminders: true,
      weeklyReflectionReminders: true,
      tone: 'supportive',
    },
  };

  const first = await scheduleRetentionNotificationOnce({
    ownerId: 'user_a',
    kind: 'day2_aha',
    episodeKey: 'trial_1',
    eligibleAt: Date.parse('2026-08-27T12:00:00.000Z'),
    onboardingProfile: profile,
    storage,
    notifications,
    trackEvent: eventName => events.push(eventName),
    platform: 'ios',
  });
  assert(first.status === 'scheduled', 'first day-2 insight schedules');
  assert(notifications.calls.length === 1, 'first schedule calls notification service once');
  assert(notifications.calls[0].title === 'A new insight is ready', 'day-2 notification uses safe title');
  assert(!notifications.calls[0].body.includes('late-night'), 'notification copy does not leak onboarding answer');
  assert(!notifications.calls[0].requestPermissionIfNeeded, 'retention notifications do not request permission on their own');

  const duplicate = await scheduleRetentionNotificationOnce({
    ownerId: 'user_a',
    kind: 'day2_aha',
    episodeKey: 'trial_1',
    eligibleAt: Date.parse('2026-08-27T12:00:00.000Z'),
    onboardingProfile: profile,
    storage,
    notifications,
    platform: 'ios',
  });
  assert(duplicate.status === 'skipped_duplicate', 'rerender/remount duplicate is skipped');
  assert(notifications.calls.length === 1, 'duplicate does not schedule another notification');

  const sameEpisodeDifferentSurface = await scheduleRetentionNotificationOnce({
    ownerId: 'user_a',
    kind: 'weekly_insight',
    episodeKey: 'weekly_discovery_2026-08-24',
    eligibleAt: Date.parse('2026-08-31T00:00:00.000Z'),
    onboardingProfile: profile,
    storage,
    notifications,
    platform: 'android',
  });
  assert(sameEpisodeDifferentSurface.status === 'scheduled', 'weekly insight has its own persisted dedupe key');

  const newEpisode = await scheduleRetentionNotificationOnce({
    ownerId: 'user_a',
    kind: 'day2_aha',
    episodeKey: 'trial_2',
    eligibleAt: Date.parse('2026-09-03T12:00:00.000Z'),
    onboardingProfile: profile,
    storage,
    notifications,
    platform: 'ios',
  });
  assert(newEpisode.status === 'scheduled', 'new trial episode can schedule its own notification');
  assert(storage.size() === 3, 'scheduled notification dedupe is persisted per owner and episode');
  assert(events.includes('retention_notification_scheduled'), 'existing analytics receives safe schedule event');

  const disabledWeekly = await scheduleRetentionNotificationOnce({
    ownerId: 'user_b',
    kind: 'weekly_insight',
    episodeKey: 'weekly_discovery_2026-08-24',
    eligibleAt: Date.now(),
    onboardingProfile: {
      ...DEFAULT_ONBOARDING_PROFILE,
      reminderPreferences: {
        dailyReminders: true,
        weeklyReflectionReminders: false,
        tone: 'balanced',
      },
    },
    storage,
    notifications,
    platform: 'ios',
  });
  assert(disabledWeekly.status === 'skipped_disabled', 'weekly preference disables weekly retention notification');

  const lateNightDelay = getRetentionNotificationDelaySeconds({
    kind: 'day2_aha',
    eligibleAt: new Date(2026, 7, 27, 22, 0, 0, 0).getTime(),
    now: new Date(2026, 7, 27, 12, 0, 0, 0).getTime(),
    onboardingProfile: profile,
  });
  assert(lateNightDelay > 10 * 60 * 60, 'late-night onboarding preference moves timing to a safer morning window');

  return true;
}

export const retentionNotificationTestsPassedPromise =
  assertRetentionNotificationScenarios();
