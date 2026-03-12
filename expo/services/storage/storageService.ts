import AsyncStorage from '@react-native-async-storage/async-storage';

export interface IStorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  multiGet<T>(keys: string[]): Promise<Record<string, T | null>>;
  multiSet(entries: [string, unknown][]): Promise<void>;
}

class AsyncStorageService implements IStorageService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
      return null;
    } catch (error) {
      console.log(`[StorageService] Error reading key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      console.log(`[StorageService] Saved key "${key}"`);
    } catch (error) {
      console.log(`[StorageService] Error writing key "${key}":`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`[StorageService] Removed key "${key}"`);
    } catch (error) {
      console.log(`[StorageService] Error removing key "${key}":`, error);
      throw error;
    }
  }

  async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, T | null> = {};
      pairs.forEach(([key, value]) => {
        result[key] = value ? (JSON.parse(value) as T) : null;
      });
      return result;
    } catch (error) {
      console.log('[StorageService] Error in multiGet:', error);
      return {};
    }
  }

  async multiSet(entries: [string, unknown][]): Promise<void> {
    try {
      const serialized: [string, string][] = entries.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(serialized);
      console.log(`[StorageService] Saved ${entries.length} keys`);
    } catch (error) {
      console.log('[StorageService] Error in multiSet:', error);
      throw error;
    }
  }
}

export const storageService: IStorageService = new AsyncStorageService();
