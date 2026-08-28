export type CustomerInfoRefreshClient<TCustomerInfo> = {
  getCustomerInfo: () => Promise<TCustomerInfo>;
  invalidateCustomerInfoCache?: () => Promise<void>;
};

export type CustomerInfoRefreshOptions = {
  forceFresh?: boolean;
};

export const BILLING_ISSUE_MANAGEMENT_RETURN_REASON = 'billing_issue_management_return';

export async function fetchCustomerInfoWithOptionalInvalidation<TCustomerInfo>(
  client: CustomerInfoRefreshClient<TCustomerInfo>,
  options: CustomerInfoRefreshOptions = {},
): Promise<TCustomerInfo> {
  if (options.forceFresh && typeof client.invalidateCustomerInfoCache === 'function') {
    await client.invalidateCustomerInfoCache();
  }
  return await client.getCustomerInfo();
}

export function createAndroidCustomerInfoFreshBootstrapGate() {
  const refreshedUserIds = new Set<string>();
  return {
    shouldRun(platform: string, userId: string | null | undefined): boolean {
      if (platform !== 'android' || !userId) return false;
      if (refreshedUserIds.has(userId)) return false;
      refreshedUserIds.add(userId);
      return true;
    },
  };
}

export function createNativeCustomerInfoFreshBootstrapGate() {
  const refreshedUserIds = new Set<string>();
  return {
    shouldRun(platform: string, userId: string | null | undefined): boolean {
      if ((platform !== 'android' && platform !== 'ios') || !userId) return false;
      if (refreshedUserIds.has(userId)) return false;
      refreshedUserIds.add(userId);
      return true;
    },
  };
}

export function shouldForceFreshCustomerInfoForRefreshReason(reason: string): boolean {
  return reason === BILLING_ISSUE_MANAGEMENT_RETURN_REASON;
}
