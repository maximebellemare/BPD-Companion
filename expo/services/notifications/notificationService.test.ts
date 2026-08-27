import { notificationService } from '@/services/notifications/notificationService';

type NotificationServiceTestHooks = {
  events: string[];
  reset: () => void;
};

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Notification service regression failed: ${message}`);
}

function getHooks(): NotificationServiceTestHooks {
  const hooks = (globalThis as typeof globalThis & {
    __notificationServiceTestHooks?: NotificationServiceTestHooks;
  }).__notificationServiceTestHooks;
  if (!hooks) {
    throw new Error('Notification service test hooks are required');
  }
  return hooks;
}

export async function assertNotificationServiceRegressionScenarios(): Promise<true> {
  const hooks = getHooks();
  hooks.reset();

  await notificationService.initializePassive();
  assert(
    hooks.events.includes('set_channel:default') && hooks.events.includes('set_channel:reminders'),
    'passive initialization creates Android channels',
  );
  assert(!hooks.events.includes('request_permissions'), 'passive initialization does not request permission');

  const notificationId = await notificationService.scheduleReminder(
    'trial_reminder',
    'Trial ending',
    'Open BPD Companion.',
    60,
    false,
    { rule_id: 'trial_ending_reminder' },
    undefined,
    undefined,
    true,
  );

  assert(notificationId === 'test_notification', 'requestable clean-install state schedules after permission grant');
  assert(
    hooks.events.indexOf('set_channel:reminders') < hooks.events.indexOf('request_permissions'),
    'Android notification channel exists before requesting permission',
  );
  assert(
    hooks.events.indexOf('request_permissions') < hooks.events.indexOf('schedule_notification'),
    'notification schedules only after permission request resolves',
  );

  return true;
}

export const notificationServiceRegressionTestsPassed = assertNotificationServiceRegressionScenarios();
