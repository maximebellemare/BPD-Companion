import { DBTProgress, DEFAULT_DBT_PROGRESS } from '@/types/dbt';
import { IDBTRepository } from './types';
import { IStorageService } from '@/services/storage/storageService';

const DBT_PROGRESS_KEY = 'dbt_progress';

export class LocalDBTRepository implements IDBTRepository {
  constructor(private storage: IStorageService) {}

  async getProgress(): Promise<DBTProgress> {
    const data = await this.storage.get<DBTProgress>(DBT_PROGRESS_KEY);
    console.log('[DBTRepository] Loaded progress, total practices:', data?.totalPractices ?? 0);
    return data ?? DEFAULT_DBT_PROGRESS;
  }

  async saveProgress(progress: DBTProgress): Promise<void> {
    await this.storage.set(DBT_PROGRESS_KEY, progress);
    console.log('[DBTRepository] Saved progress, total practices:', progress.totalPractices);
  }
}
