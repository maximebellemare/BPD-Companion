import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SubscriptionState,
  SubscriptionPlan,
  SubscriptionTier,
  PremiumFeature,
  FREE_DAILY_AI_LIMIT,
} from '@/types/subscription';

const STORAGE_KEY = 'bpd_subscription_state';
const AI_USAGE_KEY = 'bpd_ai_daily_usage';

const DEFAULT_STATE: SubscriptionState = {
  tier: 'free',
  plan: null,
  expiresAt: null,
  startedAt: null,
  trialEndsAt: null,
  isTrialActive: false,
};

export async function loadSubscriptionState(): Promise<SubscriptionState> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored) as SubscriptionState;
      if (state.expiresAt && state.expiresAt < Date.now()) {
        console.log('[SubscriptionService] Subscription expired, reverting to free');
        const expired: SubscriptionState = { ...DEFAULT_STATE };
        await saveSubscriptionState(expired);
        return expired;
      }
      if (state.isTrialActive && state.trialEndsAt && state.trialEndsAt < Date.now()) {
        console.log('[SubscriptionService] Trial expired');
        const trialExpired: SubscriptionState = { ...DEFAULT_STATE };
        await saveSubscriptionState(trialExpired);
        return trialExpired;
      }
      return state;
    }
    return DEFAULT_STATE;
  } catch (error) {
    console.log('[SubscriptionService] Error loading state:', error);
    return DEFAULT_STATE;
  }
}

export async function saveSubscriptionState(state: SubscriptionState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('[SubscriptionService] State saved:', state.tier);
  } catch (error) {
    console.log('[SubscriptionService] Error saving state:', error);
  }
}

export async function subscribeToPlan(plan: SubscriptionPlan): Promise<SubscriptionState> {
  const now = Date.now();
  const durationMs = plan.period === 'monthly'
    ? 30 * 24 * 60 * 60 * 1000
    : 365 * 24 * 60 * 60 * 1000;

  const state: SubscriptionState = {
    tier: 'premium',
    plan,
    startedAt: now,
    expiresAt: now + durationMs,
    trialEndsAt: null,
    isTrialActive: false,
  };

  await saveSubscriptionState(state);
  console.log('[SubscriptionService] Subscribed to plan:', plan.id);
  return state;
}

export async function startFreeTrial(): Promise<SubscriptionState> {
  const now = Date.now();
  const trialDuration = 7 * 24 * 60 * 60 * 1000;

  const state: SubscriptionState = {
    tier: 'premium',
    plan: null,
    startedAt: now,
    expiresAt: now + trialDuration,
    trialEndsAt: now + trialDuration,
    isTrialActive: true,
  };

  await saveSubscriptionState(state);
  console.log('[SubscriptionService] Free trial started');
  return state;
}

export async function cancelSubscription(): Promise<SubscriptionState> {
  const state: SubscriptionState = { ...DEFAULT_STATE };
  await saveSubscriptionState(state);
  console.log('[SubscriptionService] Subscription cancelled');
  return state;
}

export async function restorePurchase(): Promise<SubscriptionState> {
  console.log('[SubscriptionService] Restore purchase - mock: no purchase found');
  return loadSubscriptionState();
}

export function isPremiumFeature(feature: PremiumFeature, tier: SubscriptionTier): boolean {
  if (tier === 'premium') return true;
  return false;
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export async function getDailyAIUsage(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(AI_USAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as { date: string; count: number };
      if (data.date === getTodayKey()) {
        return data.count;
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function incrementDailyAIUsage(): Promise<number> {
  const current = await getDailyAIUsage();
  const newCount = current + 1;
  try {
    await AsyncStorage.setItem(AI_USAGE_KEY, JSON.stringify({
      date: getTodayKey(),
      count: newCount,
    }));
  } catch {
    console.log('[SubscriptionService] Error incrementing AI usage');
  }
  return newCount;
}

export function hasReachedAILimit(usage: number, tier: SubscriptionTier): boolean {
  if (tier === 'premium') return false;
  return usage >= FREE_DAILY_AI_LIMIT;
}

export function getRemainingAIMessages(usage: number, tier: SubscriptionTier): number | null {
  if (tier === 'premium') return null;
  return Math.max(0, FREE_DAILY_AI_LIMIT - usage);
}

export function formatExpirationDate(timestamp: number | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function getDaysRemaining(expiresAt: number | null): number {
  if (!expiresAt) return 0;
  const remaining = expiresAt - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}
