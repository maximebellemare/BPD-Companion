export type MembershipPricingRefreshReason =
  | 'manage_screen_open'
  | 'app_foreground';

export function shouldRefreshMembershipPricingOnManageOpen(params: {
  isSubscriptionManagement: boolean;
  hasAlreadyRefreshed: boolean;
}): boolean {
  return params.isSubscriptionManagement && !params.hasAlreadyRefreshed;
}

export function shouldRefreshMembershipPricingOnAppStateChange(params: {
  previousState: string;
  nextState: string;
}): boolean {
  return /inactive|background/.test(params.previousState) && params.nextState === 'active';
}
