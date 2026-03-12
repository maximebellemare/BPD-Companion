import { UserProfile, DEFAULT_PROFILE } from '@/types/profile';
import { IProfileRepository } from './types';
import { IStorageService } from '@/services/storage/storageService';

const PROFILE_KEY = 'bpd_companion_profile';

export class LocalProfileRepository implements IProfileRepository {
  constructor(private storage: IStorageService) {}

  async load(): Promise<UserProfile> {
    const data = await this.storage.get<Partial<UserProfile>>(PROFILE_KEY);
    if (data) {
      console.log('[ProfileRepository] Loaded profile');
      return { ...DEFAULT_PROFILE, ...data };
    }
    console.log('[ProfileRepository] No profile found, using defaults');
    return { ...DEFAULT_PROFILE, createdAt: Date.now() };
  }

  async save(profile: UserProfile): Promise<UserProfile> {
    await this.storage.set(PROFILE_KEY, profile);
    console.log('[ProfileRepository] Saved profile');
    return profile;
  }
}
