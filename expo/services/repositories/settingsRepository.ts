import { ISettingsRepository } from './types';
import { IStorageService } from '@/services/storage/storageService';

const SETTINGS_PREFIX = 'bpd_setting_';

export class LocalSettingsRepository implements ISettingsRepository {
  constructor(private storage: IStorageService) {}

  async get(key: string): Promise<string | null> {
    const data = await this.storage.get<string>(`${SETTINGS_PREFIX}${key}`);
    console.log('[SettingsRepository] Get:', key, '->', data ?? 'null');
    return data;
  }

  async set(key: string, value: string): Promise<void> {
    await this.storage.set(`${SETTINGS_PREFIX}${key}`, value);
    console.log('[SettingsRepository] Set:', key);
  }

  async remove(key: string): Promise<void> {
    await this.storage.remove(`${SETTINGS_PREFIX}${key}`);
    console.log('[SettingsRepository] Remove:', key);
  }
}
