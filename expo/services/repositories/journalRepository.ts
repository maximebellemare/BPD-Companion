import { JournalEntry } from '@/types';
import { IJournalRepository } from './types';
import { IStorageService } from '@/services/storage/storageService';

const JOURNAL_KEY = 'steady_journal';

export class LocalJournalRepository implements IJournalRepository {
  constructor(private storage: IStorageService) {}

  async getAll(): Promise<JournalEntry[]> {
    const data = await this.storage.get<JournalEntry[]>(JOURNAL_KEY);
    console.log('[JournalRepository] Loaded', data?.length ?? 0, 'entries');
    return data ?? [];
  }

  async save(entries: JournalEntry[]): Promise<void> {
    await this.storage.set(JOURNAL_KEY, entries);
    console.log('[JournalRepository] Saved', entries.length, 'entries');
  }

  async add(entry: JournalEntry): Promise<JournalEntry[]> {
    const entries = await this.getAll();
    const updated = [entry, ...entries];
    await this.save(updated);
    return updated;
  }

  async update(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry[]> {
    const entries = await this.getAll();
    const updated = entries.map(e => e.id === id ? { ...e, ...updates } : e);
    await this.save(updated);
    return updated;
  }

  async remove(id: string): Promise<JournalEntry[]> {
    const entries = await this.getAll();
    const updated = entries.filter(e => e.id !== id);
    await this.save(updated);
    return updated;
  }
}
