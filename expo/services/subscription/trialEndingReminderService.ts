import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { trackEvent as defaultTrackEvent } from '@/services/analytics/analyticsService';
import { notificationService } from '@/services/notifications/notificationService';
import {
  normalizeNotificationPermissionState,
  shouldPersistDeniedNotificationPermission,
  shouldRequestNotificationPermission,
  type NotificationPermissionState,
} from '@/services/notifications/notificationPermissionModel';
import { getBpdSubscriptionPeriodFromProductIdentifier } from '@/services/subscription/billingIssueRecoveryModel';
import {
  TRIAL_REMINDER_CATEGORY,
  getTrialEndingReminderDelaySeconds,
  getTrialEndingReminderReadiness,
  type TrialReminderCustomerInfo,
} from '@/services/subscription/trialReminderModel';

const TRIAL_REMINDER_DENIED_KEY = 'bpd_trial_reminder_permission_denied';
const TRIAL_REMINDER_CURRENT_KEY = 'bpd_trial_reminder_current';
const TRIAL_REMINDER_SCHEDULED_KEY_PREFIX = 'bpd_trial_reminder_scheduled:';

type TrialReminderStorage = Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>;

type TrialReminderNotificationService = {
  getPermissionState?: () => Promise<NotificationPermissionState>;
  getPermissionStatus: () => Promise<string>;
  scheduleReminder: typeof notificationService.scheduleReminder;
  cancelReminder: typeof notificationService.cancelReminder;
};

type TrialReminderTrackEvent = (
  name: string,
  properties?: Record<string, string | number | boolean>,
) => Promise<void> | void;

type TrialReminderDeps = {
  now?: () => number;
  notificationService?: TrialReminderNotificationService;
  ownerId?: string | null;
  platform?: typeof Platform.OS | string;
  storage?: TrialReminderStorage;
  trackEvent?: TrialReminderTrackEvent;
};

type CurrentTrialReminderRecord = {
  dedupeKey: string;
  expirationAt: number;
  notificationId: string;
  ownerKey?: string;
  productIdentifier: string;
};

export type TrialReminderScheduleResult =
  | { status: 'scheduled'; notificationId: string }
  | { status: 'skipped_duplicate' }
  | { status: 'skipped_missing_owner' }
  | { status: 'skipped_no_trial' }
  | { status: 'skipped_permission_denied' }
  | { status: 'skipped_unsupported_platform' }
  | { status: 'failed' };

export function createTrialReminderOwnerKey(ownerId: string | null | undefined): string | null {
  if (!ownerId) return null;
  let hash = 0x811c9dc5;
  for (let i = 0; i < ownerId.length; i += 1) {
    hash ^= ownerId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `owner:${(hash >>> 0).toString(36)}`;
}

function getScheduledKey(ownerKey: string, dedupeKey: string): string {
  return `${TRIAL_REMINDER_SCHEDULED_KEY_PREFIX}${ownerKey}:${dedupeKey}`;
}

function getDeps(deps: TrialReminderDeps = {}) {
  return {
    now: deps.now ?? Date.now,
    notificationService: deps.notificationService ?? notificationService,
    platform: deps.platform ?? Platform.OS,
    storage: deps.storage ?? AsyncStorage,
    trackEvent: deps.trackEvent ?? defaultTrackEvent,
  };
}

async function trackSafely(
  trackEvent: TrialReminderTrackEvent,
  name: string,
  properties?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    await trackEvent(name, properties);
  } catch {
    // Analytics failures must never affect notification scheduling or subscription access.
  }
}

async function getNotificationPermissionState(
  notifications: TrialReminderNotificationService,
): Promise<NotificationPermissionState> {
  if (notifications.getPermissionState) {
    return notifications.getPermissionState();
  }
  return normalizeNotificationPermissionState(await notifications.getPermissionStatus());
}

async function getCurrentRecord(storage: TrialReminderStorage): Promise<CurrentTrialReminderRecord | null> {
  try {
    const stored = await storage.getItem(TRIAL_REMINDER_CURRENT_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as CurrentTrialReminderRecord;
    if (!parsed.notificationId || !parsed.dedupeKey) return null;
    return parsed;
  } catch {
    await storage.removeItem(TRIAL_REMINDER_CURRENT_KEY).catch(() => {});
    return null;
  }
}

async function cancelCurrentRecord(
  storage: TrialReminderStorage,
  notifications: TrialReminderNotificationService,
): Promise<void> {
  const current = await getCurrentRecord(storage);
  if (current?.notificationId) {
    await notifications.cancelReminder(current.notificationId).catch(() => {});
  }
  await storage.removeItem(TRIAL_REMINDER_CURRENT_KEY).catch(() => {});
}

async function getCurrentRecordForOwner(
  storage: TrialReminderStorage,
  notifications: TrialReminderNotificationService,
  ownerKey: string,
): Promise<CurrentTrialReminderRecord | null> {
  const current = await getCurrentRecord(storage);
  if (!current) return null;
  if (current.ownerKey !== ownerKey) {
    await cancelCurrentRecord(storage, notifications);
    return null;
  }
  return current;
}

export async function clearTrialEndingReminderForOwnerChange(
  deps: TrialReminderDeps = {},
): Promise<void> {
  const { notificationService: notifications, platform, storage } = getDeps(deps);
  if (platform === 'web') return;
  await cancelCurrentRecord(storage, notifications);
}

export async function scheduleTrialEndingReminderAfterPurchase(
  info: TrialReminderCustomerInfo | null,
  deps: TrialReminderDeps = {},
): Promise<TrialReminderScheduleResult> {
  const { now, notificationService: notifications, platform, storage, trackEvent } = getDeps(deps);
  if (platform === 'web') return { status: 'skipped_unsupported_platform' };
  const ownerKey = createTrialReminderOwnerKey(deps.ownerId);
  if (!ownerKey) return { status: 'skipped_missing_owner' };

  const readiness = getTrialEndingReminderReadiness(info, now());
  if (readiness.status !== 'ready') {
    return { status: 'skipped_no_trial' };
  }
  const candidate = readiness.candidate;

  const safeMetadata = {
    platform: String(platform),
    product_period: getBpdSubscriptionPeriodFromProductIdentifier(candidate.productIdentifier) ?? 'unknown',
  };

  const current = await getCurrentRecordForOwner(storage, notifications, ownerKey);
  const alreadyScheduled = await storage.getItem(getScheduledKey(ownerKey, candidate.dedupeKey)).catch(() => null);
  if (alreadyScheduled) {
    return { status: 'skipped_duplicate' };
  }

  const denied = await storage.getItem(TRIAL_REMINDER_DENIED_KEY).catch(() => null);
  if (denied === 'true') {
    await trackSafely(trackEvent, 'trial_reminder_permission_denied', safeMetadata);
    return { status: 'skipped_permission_denied' };
  }

  const permissionBefore = await getNotificationPermissionState(notifications).catch(() => (
    normalizeNotificationPermissionState('unknown')
  ));
  const requestWasAllowedBeforeScheduling = shouldRequestNotificationPermission({
    existingPermission: permissionBefore,
    requestPermissionIfNeeded: true,
  });
  let shouldTrackPermissionGranted = !permissionBefore.granted;
  if (!permissionBefore.granted && !permissionBefore.canAskAgain) {
    await storage.setItem(TRIAL_REMINDER_DENIED_KEY, 'true').catch(() => {});
    await trackSafely(trackEvent, 'trial_reminder_permission_denied', safeMetadata);
    return { status: 'skipped_permission_denied' };
  }

  if (current && current.dedupeKey !== candidate.dedupeKey) {
    await cancelCurrentRecord(storage, notifications);
  }

  const notificationId = await notifications.scheduleReminder(
    TRIAL_REMINDER_CATEGORY,
    'Your BPD Companion trial ends tomorrow',
    'Open BPD Companion to review your membership before your trial ends.',
    getTrialEndingReminderDelaySeconds(candidate, now()),
    false,
    {
      rule_id: 'trial_ending_reminder',
      reminder_type: 'trial_ending',
      target_screen: '/upgrade',
    },
    undefined,
    undefined,
    true,
  ).catch(() => null);

  if (!notificationId) {
    const permissionAfter = await getNotificationPermissionState(notifications).catch(() => (
      normalizeNotificationPermissionState('unknown')
    ));
    shouldTrackPermissionGranted = shouldTrackPermissionGranted && permissionAfter.granted;
    if (requestWasAllowedBeforeScheduling && shouldPersistDeniedNotificationPermission(permissionAfter)) {
      await storage.setItem(TRIAL_REMINDER_DENIED_KEY, 'true').catch(() => {});
      await trackSafely(trackEvent, 'trial_reminder_permission_denied', safeMetadata);
      return { status: 'skipped_permission_denied' };
    }
    if (shouldTrackPermissionGranted) {
      await trackSafely(trackEvent, 'trial_reminder_permission_granted', safeMetadata);
    }
    return { status: 'failed' };
  }

  await storage.setItem(getScheduledKey(ownerKey, candidate.dedupeKey), notificationId);
  await storage.setItem(TRIAL_REMINDER_CURRENT_KEY, JSON.stringify({
    dedupeKey: candidate.dedupeKey,
    expirationAt: candidate.expirationAt,
    notificationId,
    ownerKey,
    productIdentifier: candidate.productIdentifier,
  } satisfies CurrentTrialReminderRecord));
  const permissionAfter = await getNotificationPermissionState(notifications).catch(() => (
    normalizeNotificationPermissionState('unknown')
  ));
  if (shouldTrackPermissionGranted && permissionAfter.granted) {
    await trackSafely(trackEvent, 'trial_reminder_permission_granted', safeMetadata);
  }
  await trackSafely(trackEvent, 'trial_reminder_scheduled', safeMetadata);
  return { status: 'scheduled', notificationId };
}

export async function reconcileTrialEndingReminder(
  info: TrialReminderCustomerInfo | null,
  deps: TrialReminderDeps = {},
): Promise<void> {
  const { now, notificationService: notifications, platform, storage } = getDeps(deps);
  if (platform === 'web') return;
  const current = await getCurrentRecord(storage);
  if (!current) return;
  const ownerKey = createTrialReminderOwnerKey(deps.ownerId);
  if (!ownerKey || current.ownerKey !== ownerKey) {
    await cancelCurrentRecord(storage, notifications);
    return;
  }

  const readiness = getTrialEndingReminderReadiness(info, now());
  const candidate = readiness.status === 'ready' ? readiness.candidate : null;
  if (candidate?.dedupeKey === current.dedupeKey) return;

  await cancelCurrentRecord(storage, notifications);
}
