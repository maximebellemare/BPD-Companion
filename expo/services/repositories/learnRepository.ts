import { LearnState } from '@/types/learn';
import { ILearnRepository } from './types';
import { IStorageService } from '@/services/storage/storageService';

const LEARN_STATE_KEY = 'bpd_learn_state';

const DEFAULT_STATE: LearnState = {
  progress: {},
  recentlyViewed: [],
  bookmarkedIds: [],
};

export class LocalLearnRepository implements ILearnRepository {
  constructor(private storage: IStorageService) {}

  async getState(): Promise<LearnState> {
    const data = await this.storage.get<LearnState>(LEARN_STATE_KEY);
    if (data) {
      console.log('[LearnRepository] Loaded learn state');
      return data;
    }
    console.log('[LearnRepository] No learn state found, using defaults');
    return DEFAULT_STATE;
  }

  async saveState(state: LearnState): Promise<void> {
    await this.storage.set(LEARN_STATE_KEY, state);
    console.log('[LearnRepository] Saved learn state');
  }
}
