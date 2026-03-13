import { RitualCompletion, DailyRitualsState, RitualStreakData } from '@/types/ritual';
import { IStorageService } from '@/services/storage/storageService';
import { computeRitualStreak } from '@/services/rituals/ritualService';

const DAILY_RITUALS_KEY = 'steady_daily_rituals';

export interface IDailyRitualsRepository {
  getState(): Promise<DailyRitualsState>;
  saveState(state: DailyRitualsState): Promise<void>;
  addCompletion(completion: RitualCompletion): Promise<DailyRitualsState>;
}

const DEFAULT_STREAK: RitualStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastRitualDate: '',
  totalCompletions: 0,
  weeklyCompletionRate: 0,
};

export class LocalDailyRitualsRepository implements IDailyRitualsRepository {
  constructor(private storage: IStorageService) {}

  async getState(): Promise<DailyRitualsState> {
    const data = await this.storage.get<DailyRitualsState>(DAILY_RITUALS_KEY);
    console.log('[DailyRitualsRepo] Loaded state with', data?.completions?.length ?? 0, 'completions');
    return data ?? { completions: [], streak: { ...DEFAULT_STREAK } };
  }

  async saveState(state: DailyRitualsState): Promise<void> {
    await this.storage.set(DAILY_RITUALS_KEY, state);
    console.log('[DailyRitualsRepo] Saved state with', state.completions.length, 'completions');
  }

  async addCompletion(completion: RitualCompletion): Promise<DailyRitualsState> {
    const state = await this.getState();
    const updatedCompletions = [completion, ...state.completions];
    const updated: DailyRitualsState = {
      completions: updatedCompletions,
      streak: computeRitualStreak(updatedCompletions),
    };
    await this.saveState(updated);
    console.log('[DailyRitualsRepo] Added completion:', completion.type, 'for', completion.date);
    return updated;
  }
}
