import { MessageDraft } from '@/types';
import { IMessageRepository } from './types';
import { IStorageService } from '@/services/storage/storageService';

const MESSAGES_KEY = 'steady_messages';

export class LocalMessageRepository implements IMessageRepository {
  constructor(private storage: IStorageService) {}

  async getAll(): Promise<MessageDraft[]> {
    const data = await this.storage.get<MessageDraft[]>(MESSAGES_KEY);
    console.log('[MessageRepository] Loaded', data?.length ?? 0, 'drafts');
    return data ?? [];
  }

  async save(drafts: MessageDraft[]): Promise<void> {
    await this.storage.set(MESSAGES_KEY, drafts);
    console.log('[MessageRepository] Saved', drafts.length, 'drafts');
  }

  async add(draft: MessageDraft): Promise<MessageDraft[]> {
    const drafts = await this.getAll();
    const updated = [draft, ...drafts];
    await this.save(updated);
    return updated;
  }

  async update(id: string, updates: Partial<MessageDraft>): Promise<MessageDraft[]> {
    const drafts = await this.getAll();
    const updated = drafts.map(m => m.id === id ? { ...m, ...updates } : m);
    await this.save(updated);
    return updated;
  }

  async remove(id: string): Promise<MessageDraft[]> {
    const drafts = await this.getAll();
    const updated = drafts.filter(m => m.id !== id);
    await this.save(updated);
    return updated;
  }
}
