import { RewardState, DEFAULT_REWARD_STATE, DEFAULT_CONSISTENCY_METRICS } from '@/types/reward';
import { IStorageService } from '@/services/storage/storageService';

const REWARD_KEY = 'bpd_rewards';

export interface IRewardRepository {
  getState(): Promise<RewardState>;
  saveState(state: RewardState): Promise<void>;
}

export class LocalRewardRepository implements IRewardRepository {
  constructor(private storage: IStorageService) {}

  async getState(): Promise<RewardState> {
    const data = await this.storage.get<RewardState>(REWARD_KEY);
    console.log('[RewardRepository] Loaded state:', data?.unlockedMilestones?.length ?? 0, 'milestones');
    return {
      ...DEFAULT_REWARD_STATE,
      ...(data ?? {}),
      metrics: {
        ...DEFAULT_CONSISTENCY_METRICS,
        ...(data?.metrics ?? {}),
      },
      unlockedMilestones: data?.unlockedMilestones ?? [],
    };
  }

  async saveState(state: RewardState): Promise<void> {
    await this.storage.set(REWARD_KEY, state);
    console.log('[RewardRepository] Saved state:', state.unlockedMilestones.length, 'milestones');
  }
}
