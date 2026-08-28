import type { PlatformOSType } from 'react-native';
import type { CustomerInfo } from '@/services/subscription/purchasesService';

export const PURCHASE_SYNC_PENDING_MESSAGE =
  'Your purchase was received. We’re syncing your membership with Google Play.';

export const POST_PURCHASE_RECOVERY_TIMEOUT_MS = 10_000;

export type PostPurchaseRecoveryStatus =
  | 'active_from_purchase_result'
  | 'active_from_fresh_customer_info'
  | 'active_from_android_sync'
  | 'missing_entitlement'
  | 'timed_out'
  | 'failed';

export type PostPurchaseRecoveryStep =
  | 'returned_customer_info'
  | 'fresh_customer_info'
  | 'android_sync'
  | 'post_sync_customer_info';

export type PostPurchaseRecoveryResult = {
  status: PostPurchaseRecoveryStatus;
  customerInfo: CustomerInfo | null;
  active: boolean;
  timedOutStep: PostPurchaseRecoveryStep | null;
  failedStep: PostPurchaseRecoveryStep | null;
};

export type PostPurchaseRecoveryClient = {
  getCustomerInfo: () => Promise<CustomerInfo | null>;
  syncPurchases?: () => Promise<void>;
  syncPurchasesForResult?: () => Promise<{ customerInfo?: CustomerInfo | null } | null>;
};

export function shouldApplyCustomerInfoListenerUpdate(params: {
  listenerActive: boolean;
  listenerUserId: string | null | undefined;
  currentUserId: string | null | undefined;
}): boolean {
  return params.listenerActive &&
    !!params.listenerUserId &&
    params.listenerUserId === params.currentUserId;
}

type TimedResult<T> =
  | { status: 'resolved'; value: T }
  | { status: 'timeout' }
  | { status: 'rejected'; error: unknown };

export async function runWithTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<TimedResult<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeout = new Promise<TimedResult<T>>((resolve) => {
      timeoutId = setTimeout(() => resolve({ status: 'timeout' }), timeoutMs);
    });
    const result = await Promise.race([
      operation.then<TimedResult<T>>((value) => ({ status: 'resolved', value }))
        .catch<TimedResult<T>>((error) => ({ status: 'rejected', error })),
      timeout,
    ]);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function attemptCustomerInfoStep(params: {
  step: PostPurchaseRecoveryStep;
  client: PostPurchaseRecoveryClient;
  hasActiveEntitlement: (info: CustomerInfo | null) => boolean;
  timeoutMs: number;
}): Promise<PostPurchaseRecoveryResult | null> {
  const result = await runWithTimeout(params.client.getCustomerInfo(), params.timeoutMs);
  if (result.status === 'timeout') {
    return {
      status: 'timed_out',
      customerInfo: null,
      active: false,
      timedOutStep: params.step,
      failedStep: null,
    };
  }
  if (result.status === 'rejected') {
    return {
      status: 'failed',
      customerInfo: null,
      active: false,
      timedOutStep: null,
      failedStep: params.step,
    };
  }
  if (params.hasActiveEntitlement(result.value)) {
    return {
      status: params.step === 'post_sync_customer_info'
        ? 'active_from_android_sync'
        : 'active_from_fresh_customer_info',
      customerInfo: result.value,
      active: true,
      timedOutStep: null,
      failedStep: null,
    };
  }
  return {
    status: 'missing_entitlement',
    customerInfo: result.value,
    active: false,
    timedOutStep: null,
    failedStep: null,
  };
}

async function attemptAndroidSync(params: {
  client: PostPurchaseRecoveryClient;
  hasActiveEntitlement: (info: CustomerInfo | null) => boolean;
  timeoutMs: number;
}): Promise<PostPurchaseRecoveryResult | null> {
  const sync = typeof params.client.syncPurchasesForResult === 'function'
    ? params.client.syncPurchasesForResult()
    : typeof params.client.syncPurchases === 'function'
      ? params.client.syncPurchases().then(() => null)
      : null;

  if (!sync) return null;

  const result = await runWithTimeout(sync, params.timeoutMs);
  if (result.status === 'timeout') {
    return {
      status: 'timed_out',
      customerInfo: null,
      active: false,
      timedOutStep: 'android_sync',
      failedStep: null,
    };
  }
  if (result.status === 'rejected') {
    return {
      status: 'failed',
      customerInfo: null,
      active: false,
      timedOutStep: null,
      failedStep: 'android_sync',
    };
  }

  const customerInfo = result.value?.customerInfo ?? null;
  if (params.hasActiveEntitlement(customerInfo)) {
    return {
      status: 'active_from_android_sync',
      customerInfo,
      active: true,
      timedOutStep: null,
      failedStep: null,
    };
  }

  return null;
}

export async function recoverPostPurchaseCustomerInfo(params: {
  platform: PlatformOSType | string;
  purchaseResultCustomerInfo: CustomerInfo | null;
  client: PostPurchaseRecoveryClient;
  hasActiveEntitlement: (info: CustomerInfo | null) => boolean;
  timeoutMs?: number;
}): Promise<PostPurchaseRecoveryResult> {
  const timeoutMs = params.timeoutMs ?? POST_PURCHASE_RECOVERY_TIMEOUT_MS;
  if (params.hasActiveEntitlement(params.purchaseResultCustomerInfo)) {
    return {
      status: 'active_from_purchase_result',
      customerInfo: params.purchaseResultCustomerInfo,
      active: true,
      timedOutStep: null,
      failedStep: null,
    };
  }

  const fresh = await attemptCustomerInfoStep({
    step: 'fresh_customer_info',
    client: params.client,
    hasActiveEntitlement: params.hasActiveEntitlement,
    timeoutMs,
  });
  if (fresh?.active || fresh?.status === 'timed_out') return fresh;

  let latestCustomerInfo = fresh?.customerInfo ?? params.purchaseResultCustomerInfo ?? null;

  if (params.platform === 'android') {
    const synced = await attemptAndroidSync({
      client: params.client,
      hasActiveEntitlement: params.hasActiveEntitlement,
      timeoutMs,
    });
    if (synced?.active || synced?.status === 'timed_out') return synced;

    const afterSync = await attemptCustomerInfoStep({
      step: 'post_sync_customer_info',
      client: params.client,
      hasActiveEntitlement: params.hasActiveEntitlement,
      timeoutMs,
    });
    if (afterSync?.active || afterSync?.status === 'timed_out') return afterSync;
    latestCustomerInfo = afterSync?.customerInfo ?? synced?.customerInfo ?? latestCustomerInfo;
  }

  return {
    status: fresh?.status === 'failed' ? 'failed' : 'missing_entitlement',
    customerInfo: latestCustomerInfo,
    active: false,
    timedOutStep: null,
    failedStep: fresh?.failedStep ?? null,
  };
}
