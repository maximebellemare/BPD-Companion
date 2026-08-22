import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { trackEvent } from '@/services/analytics/analyticsService';
import { notificationService } from '@/services/notifications/notificationService';

export type TrialActivationChoiceId =
  | 'overwhelmed'
  | 'message'
  | 'trigger'
  | 'relationship';

export type TrialActivationState = {
  version: 1;
  ownerKey: string;
  choiceId: TrialActivationChoiceId;
  choiceRoute: string;
  startedAt: number;
  day1StartedAt: number;
  day1CompletedAt: number | null;
  firstWinSource: string | null;
  remindersAttemptedAt: number | null;
  day2NotificationId: string | null;
  day3NotificationId: string | null;
};

const STORAGE_PREFIX = 'bpd_trial_activation_v1:';
const CURRENT_KEY = 'bpd_trial_activation_current_v1';

const DAY_2_DELAY_SECONDS = 24 * 60 * 60;
const DAY_3_DELAY_SECONDS = 48 * 60 * 60;
const MAX_ACTIVATION_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function createOwnerKey(ownerId?: string | null): string {
  if (!ownerId) return 'device';

  let hash = 0x811c9dc5;

  for (let i = 0; i < ownerId.length; i += 1) {
    hash ^= ownerId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return `owner:${(hash >>> 0).toString(36)}`;
}

function getStorageKeyFromOwnerKey(ownerKey: string): string {
  return `${STORAGE_PREFIX}${ownerKey}`;
}

function getStorageKey(ownerId?: string | null): string {
  return getStorageKeyFromOwnerKey(createOwnerKey(ownerId));
}

async function saveStateByOwnerKey(
  ownerKey: string,
  state: TrialActivationState,
): Promise<void> {
  await AsyncStorage.setItem(
    getStorageKeyFromOwnerKey(ownerKey),
    JSON.stringify(state),
  );
}

async function saveState(
  ownerId: string | null | undefined,
  state: TrialActivationState,
): Promise<void> {
  await AsyncStorage.setItem(
    getStorageKey(ownerId),
    JSON.stringify(state),
  );
}

export async function getTrialActivationState(
  ownerId?: string | null,
): Promise<TrialActivationState | null> {
  try {
    const stored = await AsyncStorage.getItem(getStorageKey(ownerId));
    if (!stored) return null;

    return JSON.parse(stored) as TrialActivationState;
  } catch {
    return null;
  }
}

export async function getCurrentTrialActivationState():
Promise<TrialActivationState | null> {
  try {
    const ownerKey = await AsyncStorage.getItem(CURRENT_KEY);
    if (!ownerKey) return null;

    const stored = await AsyncStorage.getItem(
      getStorageKeyFromOwnerKey(ownerKey),
    );

    if (!stored) {
      await AsyncStorage.removeItem(CURRENT_KEY);
      return null;
    }

    const state = JSON.parse(stored) as TrialActivationState;

    if (Date.now() - state.startedAt > MAX_ACTIVATION_AGE_MS) {
      await AsyncStorage.removeItem(CURRENT_KEY);
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

export async function startTrialActivation(params: {
  ownerId?: string | null;
  choiceId: TrialActivationChoiceId;
  choiceRoute: string;
}): Promise<{
  status:
    | 'saved'
    | 'already_started';
}> {
  const existing = await getTrialActivationState(params.ownerId);

  if (existing && Date.now() - existing.startedAt <= MAX_ACTIVATION_AGE_MS) {
    await AsyncStorage.setItem(CURRENT_KEY, existing.ownerKey);
    return { status: 'already_started' };
  }

  const now = Date.now();
  const ownerKey = createOwnerKey(params.ownerId);

  const state: TrialActivationState = {
    version: 1,
    ownerKey,
    choiceId: params.choiceId,
    choiceRoute: params.choiceRoute,
    startedAt: now,
    day1StartedAt: now,
    day1CompletedAt: null,
    firstWinSource: null,
    remindersAttemptedAt: null,
    day2NotificationId: null,
    day3NotificationId: null,
  };

  await saveState(params.ownerId, state);
  await AsyncStorage.setItem(CURRENT_KEY, ownerKey);

  void trackEvent('trial_activation_day1_started', {
    choice_id: params.choiceId,
    destination: params.choiceRoute,
  });

  return { status: 'saved' };
}

export async function claimTrialFirstWin(
  source: string,
): Promise<boolean> {
  const state = await getCurrentTrialActivationState();

  if (!state) return false;
  if (state.day1CompletedAt) return false;

  state.day1CompletedAt = Date.now();
  state.firstWinSource = source;

  await saveStateByOwnerKey(state.ownerKey, state);

  void trackEvent('trial_activation_day1_completed', {
    choice_id: state.choiceId,
    source,
    seconds_to_first_win: Math.max(
      0,
      Math.round((state.day1CompletedAt - state.day1StartedAt) / 1000),
    ),
  });

  return true;
}

export async function scheduleTrialActivationRemindersAfterFirstWin():
Promise<
  | 'scheduled'
  | 'already_scheduled'
  | 'no_activation'
  | 'not_completed'
  | 'permission_denied'
  | 'failed'
  | 'web'
> {
  const state = await getCurrentTrialActivationState();

  if (!state) return 'no_activation';
  if (!state.day1CompletedAt) return 'not_completed';
  if (Platform.OS === 'web') return 'web';

  if (state.day2NotificationId && state.day3NotificationId) {
    return 'already_scheduled';
  }

  state.remindersAttemptedAt = Date.now();
  await saveStateByOwnerKey(state.ownerKey, state);

  /*
   * This is deliberately the value-based permission moment.
   * The user has completed a tool and explicitly tapped
   * "Keep this going tomorrow", so permission may be requested here.
   */

  let permissionStatus = await notificationService
    .getPermissionStatus()
    .catch(() => 'unknown');

  if (permissionStatus !== 'granted') {
    try {
      const permission = await Notifications.requestPermissionsAsync();
      permissionStatus = permission.status;
    } catch {
      permissionStatus = 'unknown';
    }
  }

  if (permissionStatus !== 'granted') {
    await saveStateByOwnerKey(state.ownerKey, state);

    void trackEvent('trial_activation_reminders_not_scheduled', {
      choice_id: state.choiceId,
      reason: 'permission_denied',
    });

    return 'permission_denied';
  }

  if (!state.day2NotificationId) {
    state.day2NotificationId = await notificationService.scheduleReminder(
      'reengagement',
      'Day 2: understand one trigger',
      'Take a few minutes to understand what set off an emotional reaction and what it meant to you.',
      DAY_2_DELAY_SECONDS,
      false,
      {
        rule_id: 'trial_activation_day_2',
        reminder_type: 'trial_activation_day_2',
        target_screen: '/understand-trigger',
      },
      undefined,
      undefined,
    );
  }

  if (!state.day2NotificationId) {
    await saveStateByOwnerKey(state.ownerKey, state);

    void trackEvent('trial_activation_reminders_not_scheduled', {
      choice_id: state.choiceId,
      reason: 'schedule_failed',
    });

    return 'failed';
  }

  if (!state.day3NotificationId) {
    state.day3NotificationId = await notificationService.scheduleReminder(
      'reengagement',
      'Day 3: build your personal toolkit',
      'Choose the BPD Companion tools you want ready for the next difficult moment.',
      DAY_3_DELAY_SECONDS,
      false,
      {
        rule_id: 'trial_activation_day_3',
        reminder_type: 'trial_activation_day_3',
        target_screen: '/tools',
      },
      undefined,
      undefined,
    );
  }

  await saveStateByOwnerKey(state.ownerKey, state);

  const bothScheduled =
    !!state.day2NotificationId &&
    !!state.day3NotificationId;

  void trackEvent(
    bothScheduled
      ? 'trial_activation_reminders_scheduled'
      : 'trial_activation_reminders_not_scheduled',
    {
      choice_id: state.choiceId,
      day2_scheduled: !!state.day2NotificationId,
      day3_scheduled: !!state.day3NotificationId,
    },
  );

  return bothScheduled ? 'scheduled' : 'failed';
}

export async function dismissTrialFirstWin(): Promise<void> {
  const state = await getCurrentTrialActivationState();

  if (state) {
    void trackEvent('trial_activation_reminders_declined', {
      choice_id: state.choiceId,
    });
  }
}
