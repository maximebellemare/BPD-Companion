export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'unknown'
  | 'web_unsupported'
  | string;

export type NotificationPermissionState = {
  androidSdkVersion?: number | string | null;
  canAskAgain: boolean;
  granted: boolean;
  status: NotificationPermissionStatus;
};

export function normalizeNotificationPermissionState(
  permission: NotificationPermissionStatus | Partial<NotificationPermissionState> | null | undefined,
): NotificationPermissionState {
  if (typeof permission === 'string') {
    return {
      canAskAgain: permission !== 'denied' && permission !== 'web_unsupported',
      granted: permission === 'granted',
      status: permission,
    };
  }

  const status = permission?.status ?? 'unknown';
  const granted = permission?.granted ?? status === 'granted';
  return {
    androidSdkVersion: permission?.androidSdkVersion ?? null,
    canAskAgain: permission?.canAskAgain ?? (status !== 'denied' && status !== 'web_unsupported'),
    granted,
    status,
  };
}

export function shouldRequestNotificationPermission(params: {
  existingPermission?: NotificationPermissionStatus | Partial<NotificationPermissionState> | null;
  existingStatus?: NotificationPermissionStatus;
  requestPermissionIfNeeded: boolean;
}): boolean {
  if (!params.requestPermissionIfNeeded) return false;
  const permission = normalizeNotificationPermissionState(
    params.existingPermission ?? params.existingStatus ?? 'unknown',
  );
  return !permission.granted && permission.canAskAgain;
}

export function canScheduleNotification(
  permission: NotificationPermissionStatus | Partial<NotificationPermissionState> | null | undefined,
): boolean {
  return normalizeNotificationPermissionState(permission).granted;
}

export function shouldPersistDeniedNotificationPermission(
  permission: NotificationPermissionStatus | Partial<NotificationPermissionState> | null | undefined,
): boolean {
  const normalized = normalizeNotificationPermissionState(permission);
  return !normalized.granted && normalized.status === 'denied';
}

export function isNotificationPermissionRequestable(
  permission: NotificationPermissionStatus | Partial<NotificationPermissionState> | null | undefined,
): boolean {
  const normalized = normalizeNotificationPermissionState(permission);
  return !normalized.granted && normalized.canAskAgain;
}
