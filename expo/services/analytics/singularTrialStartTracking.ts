import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackSingularEvent } from '@/lib/singular';
import type { CustomerInfo } from '@/services/subscription/purchasesService';
import { createSingularTrialStartTracker } from '@/services/analytics/singularTrialStartTrackingCore';

const trackSingularTrialStartedOnceInternal = createSingularTrialStartTracker({
  storage: AsyncStorage,
  trackEvent: trackSingularEvent,
  isDevelopment: __DEV__,
  log: (message, details) => console.log(message, details ?? {}),
  warn: (message, error) => console.warn(message, error),
});

export async function trackSingularTrialStartedOnce(customerInfo: CustomerInfo | null): Promise<void> {
  await trackSingularTrialStartedOnceInternal(customerInfo);
}
