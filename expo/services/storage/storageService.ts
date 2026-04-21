import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, USER_KV_TABLE } from '@/services/supabase/supabaseClient';

export interface IStorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  multiGet<T>(keys: string[]): Promise<Record<string, T | null>>;
  multiSet(entries: [string, unknown][]): Promise<void>;
}

type Listener = (userId: string | null) => void;

class HybridStorageService implements IStorageService {
  private userId: string | null = null;
  private listeners: Set<Listener> = new Set();

  setUser(userId: string | null): void {
    if (this.userId === userId) return;
    console.log('[StorageService] setUser:', userId ?? 'guest');
    this.userId = userId;
    this.listeners.forEach((l) => l(userId));
  }

  getUserId(): string | null {
    return this.userId;
  }

  onUserChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private scopedKey(key: string): string {
    if (this.userId) return `u_${this.userId}__${key}`;
    return `guest__${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const scoped = this.scopedKey(key);
    try {
      const stored = await AsyncStorage.getItem(scoped);
      if (stored) {
        try {
          return JSON.parse(stored) as T;
        } catch (parseError) {
          console.log(`[StorageService] Parse error for "${key}":`, parseError);
        }
      }
    } catch (error) {
      console.log(`[StorageService] Local read error "${key}":`, error);
    }

    if (this.userId) {
      try {
        const { data, error } = await supabase
          .from(USER_KV_TABLE)
          .select('value')
          .eq('user_id', this.userId)
          .eq('key', key)
          .maybeSingle();
        if (error) {
          console.log(`[StorageService] Supabase read error "${key}":`, error.message);
          return null;
        }
        if (data?.value !== undefined && data?.value !== null) {
          try {
            await AsyncStorage.setItem(scoped, JSON.stringify(data.value));
          } catch {}
          return data.value as T;
        }
      } catch (e) {
        console.log(`[StorageService] Supabase fetch failed "${key}":`, e);
      }
    }
    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const scoped = this.scopedKey(key);
    try {
      await AsyncStorage.setItem(scoped, JSON.stringify(value));
    } catch (error) {
      console.log(`[StorageService] Local write error "${key}":`, error);
    }

    if (this.userId) {
      try {
        const { error } = await supabase
          .from(USER_KV_TABLE)
          .upsert(
            {
              user_id: this.userId,
              key,
              value: value as unknown,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,key' },
          );
        if (error) {
          console.log(`[StorageService] Supabase write error "${key}":`, error.message);
        }
      } catch (e) {
        console.log(`[StorageService] Supabase upsert failed "${key}":`, e);
      }
    }
  }

  async remove(key: string): Promise<void> {
    const scoped = this.scopedKey(key);
    try {
      await AsyncStorage.removeItem(scoped);
    } catch (error) {
      console.log(`[StorageService] Local remove error "${key}":`, error);
    }

    if (this.userId) {
      try {
        const { error } = await supabase
          .from(USER_KV_TABLE)
          .delete()
          .eq('user_id', this.userId)
          .eq('key', key);
        if (error) {
          console.log(`[StorageService] Supabase delete error "${key}":`, error.message);
        }
      } catch (e) {
        console.log(`[StorageService] Supabase delete failed "${key}":`, e);
      }
    }
  }

  async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    await Promise.all(
      keys.map(async (k) => {
        result[k] = await this.get<T>(k);
      }),
    );
    return result;
  }

  async multiSet(entries: [string, unknown][]): Promise<void> {
    await Promise.all(entries.map(([k, v]) => this.set(k, v)));
  }

  async hydrateFromCloud(): Promise<void> {
    if (!this.userId) return;
    try {
      console.log('[StorageService] Hydrating from cloud for', this.userId);
      const { data, error } = await supabase
        .from(USER_KV_TABLE)
        .select('key, value')
        .eq('user_id', this.userId);
      if (error) {
        console.log('[StorageService] Hydrate error:', error.message);
        return;
      }
      if (!data) return;
      for (const row of data) {
        try {
          await AsyncStorage.setItem(this.scopedKey(row.key), JSON.stringify(row.value));
        } catch {}
      }
      console.log('[StorageService] Hydrated', data.length, 'keys');
    } catch (e) {
      console.log('[StorageService] Hydrate failed:', e);
    }
  }

  async pushLocalToCloud(prevUserId: string | null): Promise<void> {
    if (!this.userId) return;
    try {
      const prefix = prevUserId ? `u_${prevUserId}__` : 'guest__';
      const allKeys = await AsyncStorage.getAllKeys();
      const matching = allKeys.filter((k) => k.startsWith(prefix));
      if (matching.length === 0) return;
      const pairs = await AsyncStorage.multiGet(matching);
      const rows = pairs
        .map(([fullKey, value]) => {
          if (!value) return null;
          const key = fullKey.slice(prefix.length);
          try {
            return { user_id: this.userId as string, key, value: JSON.parse(value) as unknown, updated_at: new Date().toISOString() };
          } catch {
            return null;
          }
        })
        .filter((r): r is { user_id: string; key: string; value: unknown; updated_at: string } => r !== null);
      if (rows.length === 0) return;
      const { error } = await supabase.from(USER_KV_TABLE).upsert(rows, { onConflict: 'user_id,key' });
      if (error) {
        console.log('[StorageService] Push local->cloud error:', error.message);
      } else {
        console.log('[StorageService] Pushed', rows.length, 'keys to cloud');
        for (const [fullKey, value] of pairs) {
          if (!value) continue;
          const key = fullKey.slice(prefix.length);
          try {
            await AsyncStorage.setItem(this.scopedKey(key), value);
          } catch {}
        }
      }
    } catch (e) {
      console.log('[StorageService] Push failed:', e);
    }
  }
}

export const storageService: HybridStorageService = new HybridStorageService();
