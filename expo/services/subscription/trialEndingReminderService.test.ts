import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';
import {
  clearTrialEndingReminderForOwnerChange,
  reconcileTrialEndingReminder,
  scheduleTrialEndingReminderAfterPurchase,
} from '@/services/subscription/trialEndingReminderService';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Trial ending reminder regression failed: ${message}`);
}

const NOW = new Date('2026-08-12T12:00:00.000Z').getTime();
const EXPIRATION = new Date('2026-08-15T12:00:00.000Z').getTime();
const PURCHASE = new Date('2026-08-12T12:01:00.000Z').getTime();
const DENIED_KEY = 'bpd_trial_reminder_permission_denied';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    async getItem(key: string) {
      return map.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      map.set(key, value);
    },
    async removeItem(key: string) {
      map.delete(key);
    },
  };
}

function trialInfo(params: {
  expirationDateMillis?: number | null;
  isActive?: boolean;
  periodType?: string | null;
  productIdentifier?: string;
} = {}) {
  return {
    entitlements: {
      active: {
        [REVENUECAT_ENTITLEMENT_ID]: {
          isActive: params.isActive ?? true,
          periodType: 'periodType' in params ? params.periodType : 'TRIAL',
          expirationDateMillis: 'expirationDateMillis' in params ? params.expirationDateMillis : EXPIRATION,
          latestPurchaseDateMillis: PURCHASE,
          productIdentifier: params.productIdentifier ?? 'bpd_monthly:monthly',
        },
      },
    },
  };
}

export async function assertTrialEndingReminderRegressionScenarios(): Promise<true> {
  const storage = createMemoryStorage();
  const scheduled: { category: string; title: string; body: string; seconds: number }[] = [];
  const cancelled: string[] = [];
  const events: string[] = [];
  const notifications = {
    getPermissionStatus: async () => 'granted',
    scheduleReminder: async (
      category: string,
      title: string,
      body: string,
      seconds: number,
    ) => {
      scheduled.push({ category, title, body, seconds });
      return `notification_${scheduled.length}`;
    },
    cancelReminder: async (id: string) => {
      cancelled.push(id);
    },
  };
  const deps = {
    now: () => NOW,
    notificationService: notifications,
    ownerId: 'user-a',
    platform: 'ios',
    storage,
    trackEvent: async (name: string) => {
      events.push(name);
    },
  };

  const scheduledResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo(), deps);
  assert(scheduledResult.status === 'scheduled', 'active trial schedules one reminder');
  assert(scheduled.length === 1, 'notification service called once');
  assert(scheduled[0]?.category === 'trial_reminder', 'trial reminder category is used');
  assert(scheduled[0]?.title === 'Your BPD Companion trial ends tomorrow', 'trial reminder title uses approved copy');
  assert(scheduled[0]?.body === 'Open BPD Companion to review your membership before your trial ends.', 'trial reminder body uses approved copy');
  assert(scheduled[0]?.seconds > 0, 'scheduled reminder uses future trigger delay');
  assert(events.includes('trial_reminder_scheduled'), 'scheduled analytics fires');

  const duplicateResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo(), deps);
  assert(duplicateResult.status === 'skipped_duplicate', 'duplicate trial purchase callback is skipped');
  assert(scheduled.length === 1, 'duplicate callback does not schedule another reminder');

  await reconcileTrialEndingReminder(trialInfo(), deps);
  assert(cancelled.length === 0, 'same user CustomerInfo refresh preserves reminder');

  const restartResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo(), {
    ...deps,
    notificationService: {
      ...notifications,
      scheduleReminder: async () => {
        throw new Error('same-owner restart should use persisted dedupe');
      },
    },
  });
  assert(restartResult.status === 'skipped_duplicate', 'same user app restart preserves persisted reminder dedupe');

  const normalResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo({ periodType: 'NORMAL' }), {
    ...deps,
    storage: createMemoryStorage(),
  });
  assert(normalResult.status === 'skipped_no_trial', 'normal paid subscription does not schedule reminder');

  const inactiveResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo({ isActive: false }), {
    ...deps,
    storage: createMemoryStorage(),
  });
  assert(inactiveResult.status === 'skipped_no_trial', 'inactive entitlement does not schedule reminder');

  const deniedStorage = createMemoryStorage();
  const deniedEvents: string[] = [];
  const deniedResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo(), {
    ...deps,
    storage: deniedStorage,
    notificationService: {
      ...notifications,
      getPermissionStatus: async () => 'denied',
    },
    trackEvent: async (name: string) => {
      deniedEvents.push(name);
    },
  });
  assert(deniedResult.status === 'skipped_permission_denied', 'permission denial skips scheduling');
  assert(deniedEvents.includes('trial_reminder_permission_denied'), 'permission denial analytics fires');

  const androidCleanInstallStorage = createMemoryStorage();
  let androidCleanInstallRequestFlag: boolean | null = null;
  let androidCleanInstallPermission = {
    androidSdkVersion: 36,
    canAskAgain: true,
    granted: false,
    status: 'denied',
  };
  const androidCleanInstallResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo(), {
    ...deps,
    platform: 'android',
    storage: androidCleanInstallStorage,
    notificationService: {
      ...notifications,
      getPermissionState: async () => androidCleanInstallPermission,
      scheduleReminder: async (
        category: string,
        title: string,
        body: string,
        seconds: number,
        _repeating?: boolean,
        _data?: Record<string, string>,
        _quietHours?: unknown,
        _currentDistress?: number,
        requestPermissionIfNeeded?: boolean,
      ) => {
        androidCleanInstallRequestFlag = requestPermissionIfNeeded === true;
        assert(
          androidCleanInstallStorage.map.get(DENIED_KEY) !== 'true',
          'Android clean-install requestable state is not persisted as denied before request',
        );
        androidCleanInstallPermission = {
          androidSdkVersion: 36,
          canAskAgain: false,
          granted: true,
          status: 'granted',
        };
        scheduled.push({ category, title, body, seconds });
        return 'android_clean_install_notification';
      },
    },
  });
  assert(androidCleanInstallResult.status === 'scheduled', 'Android clean-install denied/requestable state can request and schedule');
  assert(androidCleanInstallRequestFlag === true, 'Android clean-install trial reminder invokes permission-request path');
  assert(androidCleanInstallStorage.map.get(DENIED_KEY) !== 'true', 'Android clean-install granted request does not persist denied marker');

  const androidDeniedAfterRequestStorage = createMemoryStorage();
  let androidDeniedAfterRequestPermission = {
    androidSdkVersion: 36,
    canAskAgain: true,
    granted: false,
    status: 'denied',
  };
  const androidDeniedAfterRequestResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo(), {
    ...deps,
    platform: 'android',
    storage: androidDeniedAfterRequestStorage,
    notificationService: {
      ...notifications,
      getPermissionState: async () => androidDeniedAfterRequestPermission,
      scheduleReminder: async (
        _category: string,
        _title: string,
        _body: string,
        _seconds: number,
        _repeating?: boolean,
        _data?: Record<string, string>,
        _quietHours?: unknown,
        _currentDistress?: number,
        requestPermissionIfNeeded?: boolean,
      ) => {
        assert(requestPermissionIfNeeded === true, 'Android denied-after-request flow attempts permission request');
        assert(
          androidDeniedAfterRequestStorage.map.get(DENIED_KEY) !== 'true',
          'denied marker is not stored before the actual permission request result',
        );
        androidDeniedAfterRequestPermission = {
          androidSdkVersion: 36,
          canAskAgain: false,
          granted: false,
          status: 'denied',
        };
        return null;
      },
    },
  });
  assert(androidDeniedAfterRequestResult.status === 'skipped_permission_denied', 'Android denied request skips reminder safely');
  assert(androidDeniedAfterRequestStorage.map.get(DENIED_KEY) === 'true', 'Android denied request persists denied marker after request result');

  const androidNonRequestableStorage = createMemoryStorage();
  const androidNonRequestableResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo(), {
    ...deps,
    platform: 'android',
    storage: androidNonRequestableStorage,
    notificationService: {
      ...notifications,
      getPermissionState: async () => ({
        androidSdkVersion: 36,
        canAskAgain: false,
        granted: false,
        status: 'denied',
      }),
      scheduleReminder: async () => {
        throw new Error('non-requestable Android permission must not try to schedule/request');
      },
    },
  });
  assert(androidNonRequestableResult.status === 'skipped_permission_denied', 'Android non-requestable denial skips without requesting');
  assert(androidNonRequestableStorage.map.get(DENIED_KEY) === 'true', 'Android non-requestable denial persists denied marker');

  const grantedEvents: string[] = [];
  let permissionStatus = 'undetermined';
  let requestedPermissionFromSchedule: boolean | null = null;
  const grantedResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo(), {
    ...deps,
    storage: createMemoryStorage(),
    notificationService: {
      ...notifications,
      getPermissionStatus: async () => permissionStatus,
      scheduleReminder: async (
        category: string,
        title: string,
        body: string,
        seconds: number,
        _repeating?: boolean,
        _data?: Record<string, string>,
        _quietHours?: unknown,
        _currentDistress?: number,
        requestPermissionIfNeeded?: boolean,
      ) => {
        requestedPermissionFromSchedule = requestPermissionIfNeeded === true;
        permissionStatus = 'granted';
        scheduled.push({ category, title, body, seconds });
        return 'notification_after_permission';
      },
    },
    trackEvent: async (name: string) => {
      grantedEvents.push(name);
    },
  });
  assert(grantedResult.status === 'scheduled', 'permission prompt success still schedules trial reminder');
  assert(requestedPermissionFromSchedule === true, 'post-purchase trial reminder explicitly allows permission prompt');
  assert(grantedEvents.includes('trial_reminder_permission_granted'), 'permission granted analytics fires after this flow receives permission');

  const waitingPeriodResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo({ periodType: null }), {
    ...deps,
    storage: createMemoryStorage(),
  });
  assert(waitingPeriodResult.status === 'skipped_no_trial', 'missing periodType waits outside scheduler instead of prompting');

  const waitingExpirationResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo({ expirationDateMillis: null }), {
    ...deps,
    storage: createMemoryStorage(),
  });
  assert(waitingExpirationResult.status === 'skipped_no_trial', 'missing expiration waits outside scheduler instead of prompting');

  await reconcileTrialEndingReminder(trialInfo({ productIdentifier: 'bpd_yearly:annual' }), deps);
  assert(cancelled.length === 1, 'subscription state change cancels stale trial reminder');

  const logoutStorage = createMemoryStorage();
  const logoutCancelled: string[] = [];
  const logoutNotifications = {
    ...notifications,
    scheduleReminder: async () => 'logout_notification',
    cancelReminder: async (id: string) => {
      logoutCancelled.push(id);
    },
  };
  await scheduleTrialEndingReminderAfterPurchase(trialInfo(), {
    ...deps,
    notificationService: logoutNotifications,
    storage: logoutStorage,
  });
  await clearTrialEndingReminderForOwnerChange({
    ...deps,
    notificationService: logoutNotifications,
    storage: logoutStorage,
  });
  assert(logoutCancelled.includes('logout_notification'), 'logout cancels current user trial reminder');

  const switchStorage = createMemoryStorage();
  const switchCancelled: string[] = [];
  const switchScheduled: string[] = [];
  const switchNotifications = {
    ...notifications,
    scheduleReminder: async () => {
      const id = `switch_notification_${switchScheduled.length + 1}`;
      switchScheduled.push(id);
      return id;
    },
    cancelReminder: async (id: string) => {
      switchCancelled.push(id);
    },
  };
  await scheduleTrialEndingReminderAfterPurchase(trialInfo(), {
    ...deps,
    notificationService: switchNotifications,
    storage: switchStorage,
    ownerId: 'user-a',
  });
  await reconcileTrialEndingReminder(trialInfo(), {
    ...deps,
    notificationService: switchNotifications,
    storage: switchStorage,
    ownerId: 'user-b',
  });
  assert(switchCancelled.includes('switch_notification_1'), 'User A to User B switch cancels User A reminder');
  const userBResult = await scheduleTrialEndingReminderAfterPurchase(trialInfo({ productIdentifier: 'bpd_yearly:annual' }), {
    ...deps,
    notificationService: switchNotifications,
    storage: switchStorage,
    ownerId: 'user-b',
  });
  assert(userBResult.status === 'scheduled', 'new User B trial can schedule its own reminder');
  assert(switchScheduled.length === 2, 'User B schedule is independent after User A reminder is cleared');

  const staleStorage = createMemoryStorage();
  await staleStorage.setItem('bpd_trial_reminder_current', JSON.stringify({
    dedupeKey: 'legacy',
    expirationAt: EXPIRATION,
    notificationId: 'legacy_notification',
    productIdentifier: 'bpd_monthly:monthly',
  }));
  const staleCancelled: string[] = [];
  await reconcileTrialEndingReminder(trialInfo(), {
    ...deps,
    storage: staleStorage,
    notificationService: {
      ...notifications,
      cancelReminder: async (id: string) => {
        staleCancelled.push(id);
      },
    },
  });
  assert(staleCancelled.includes('legacy_notification'), 'stale persisted owner mismatch removes old reminder');

  return true;
}

export const trialEndingReminderRegressionTestsPassed = assertTrialEndingReminderRegressionScenarios();
