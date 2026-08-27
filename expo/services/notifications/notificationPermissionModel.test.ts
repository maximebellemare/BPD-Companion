import {
  canScheduleNotification,
  isNotificationPermissionRequestable,
  shouldPersistDeniedNotificationPermission,
  shouldRequestNotificationPermission,
} from '@/services/notifications/notificationPermissionModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Notification permission regression failed: ${message}`);
}

export function assertNotificationPermissionRegressionScenarios(): true {
  assert(
    shouldRequestNotificationPermission({
      existingPermission: { status: 'undetermined', granted: false, canAskAgain: true },
      requestPermissionIfNeeded: false,
    }) === false,
    'app launch with undetermined permission does not request',
  );
  assert(
    shouldRequestNotificationPermission({
      existingPermission: { status: 'denied', granted: false, canAskAgain: true },
      requestPermissionIfNeeded: false,
    }) === false,
    'app launch with denied permission does not request',
  );
  assert(
    shouldRequestNotificationPermission({
      existingPermission: { status: 'undetermined', granted: false, canAskAgain: true },
      requestPermissionIfNeeded: true,
    }) === true,
    'successful trial with undetermined permission may request once',
  );
  assert(
    shouldRequestNotificationPermission({
      existingPermission: { status: 'denied', granted: false, canAskAgain: true },
      requestPermissionIfNeeded: true,
    }) === true,
    'Android clean-install denied status with canAskAgain may request after trial purchase',
  );
  assert(
    shouldRequestNotificationPermission({
      existingPermission: { status: 'granted', granted: true, canAskAgain: false },
      requestPermissionIfNeeded: true,
    }) === false,
    'successful trial with granted permission schedules without prompt',
  );
  assert(
    shouldRequestNotificationPermission({
      existingPermission: { status: 'denied', granted: false, canAskAgain: false },
      requestPermissionIfNeeded: true,
    }) === false,
    'successful trial with denied permission does not repeatedly prompt',
  );
  assert(
    isNotificationPermissionRequestable({ status: 'denied', granted: false, canAskAgain: true }) === true,
    'canAskAgain controls Android requestability even when status is denied',
  );
  assert(
    shouldPersistDeniedNotificationPermission({ status: 'denied', granted: false, canAskAgain: false }) === true,
    'non-requestable denied permission may be persisted',
  );
  assert(
    shouldPersistDeniedNotificationPermission({ status: 'undetermined', granted: false, canAskAgain: true }) === false,
    'undetermined permission is not persisted as denied',
  );
  assert(canScheduleNotification('granted') === true, 'granted permission can schedule');
  assert(canScheduleNotification('undetermined') === false, 'non-trial launch with undetermined permission does not schedule');
  assert(canScheduleNotification('denied') === false, 'denied permission does not schedule');

  return true;
}

export const notificationPermissionRegressionTestsPassed = assertNotificationPermissionRegressionScenarios();
