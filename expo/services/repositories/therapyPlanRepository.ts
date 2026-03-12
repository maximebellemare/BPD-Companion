import { TherapyPlanState } from '@/types/therapy';
import { ITherapyPlanRepository } from './types';
import { IStorageService } from '@/services/storage/storageService';

const THERAPY_PLAN_KEY = 'adaptive_therapy_plan';

export class LocalTherapyPlanRepository implements ITherapyPlanRepository {
  constructor(private storage: IStorageService) {}

  async loadState(): Promise<TherapyPlanState> {
    const data = await this.storage.get<TherapyPlanState>(THERAPY_PLAN_KEY);
    console.log('[TherapyPlanRepository] Loaded state, has plan:', !!data?.currentPlan);
    return data ?? { currentPlan: null, previousPlans: [], lastGeneratedAt: 0 };
  }

  async saveState(state: TherapyPlanState): Promise<void> {
    await this.storage.set(THERAPY_PLAN_KEY, state);
    console.log('[TherapyPlanRepository] Saved state');
  }
}
