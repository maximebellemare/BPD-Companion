import {
  getBillingIssueAnalyticsMetadata,
  type BillingIssueRecoveryState,
} from '@/services/subscription/billingIssueRecoveryModel';

export type BillingIssueBannerSurface = 'today' | 'upgrade_recovery';

type TrackEvent = (
  eventName: string,
  properties?: Record<string, string | number | boolean>,
) => void;

type TrackBillingIssueBannerViewedParams = {
  state: BillingIssueRecoveryState;
  surface: BillingIssueBannerSurface;
  trackEvent: TrackEvent;
};

const viewedBillingIssueBannerEpisodes = new Set<string>();

export function getBillingIssueBannerViewEpisodeKey(
  state: BillingIssueRecoveryState,
  surface: BillingIssueBannerSurface,
): string {
  return [
    surface,
    state.kind,
    state.store ?? 'unknown_store',
    state.productIdentifier ?? 'unknown_product',
    String(state.detectedAt),
  ].join('|');
}

export function createBillingIssueBannerViewTracker(
  seenEpisodes: Set<string> = new Set<string>(),
) {
  return function trackBillingIssueBannerViewedOnce({
    state,
    surface,
    trackEvent,
  }: TrackBillingIssueBannerViewedParams): boolean {
    const episodeKey = getBillingIssueBannerViewEpisodeKey(state, surface);
    if (seenEpisodes.has(episodeKey)) return false;

    seenEpisodes.add(episodeKey);
    trackEvent('billing_issue_banner_viewed', {
      ...getBillingIssueAnalyticsMetadata(state),
      surface,
    });
    return true;
  };
}

export const trackBillingIssueBannerViewedOnce = createBillingIssueBannerViewTracker(
  viewedBillingIssueBannerEpisodes,
);
