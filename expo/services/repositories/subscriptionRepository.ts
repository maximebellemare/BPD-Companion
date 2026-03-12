import { SubscriptionState } from '@/types/subscription';
import { ISubscriptionRepository } from './types';
import { IStorageService } from '@/services/storage/storageService';

const SUBSCRIPTION_KEY = 'bpd_subscription_state';
const AI_USAGE_KEY = 'bpd_ai_daily_usage';

export class LocalSubscriptionRepository implements ISubscriptionRepository {
  constructor(private storage: IStorageService) {}

  async loadState(): Promise<SubscriptionState> {
    const data = await this.storage.get<SubscriptionState>(SUBSCRIPTION_KEY);
    console.log('[SubscriptionRepository] Loaded state:', data?.tier ?? 'none');
    return data ?? {
      tier: 'free',
      plan: null,
      expiresAt: null,
      startedAt: null,
      trialEndsAt: null,
      isTrialActive: false,
    };
  }

  async saveState(state: SubscriptionState): Promise<void> {
    await this.storage.set(SUBSCRIPTION_KEY, state);
    console.log('[SubscriptionRepository] Saved state:', state.tier);
  }

  async getDailyAIUsage(dateKey: string): Promise<number> {
    const data = await this.storage.get<{ date: string; count: number }>(AI_USAGE_KEY);
    if (data && data.date === dateKey) {
      return data.count;
    }
    return 0;
  }

  async saveDailyAIUsage(dateKey: string, count: number): Promise<void> {
    await this.storage.set(AI_USAGE_KEY, { date: dateKey, count });
    console.log('[SubscriptionRepository] Saved AI usage:', count, 'for', dateKey);
  }
}
