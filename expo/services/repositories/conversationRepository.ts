import { AIConversation } from '@/types/ai';
import { IConversationRepository } from './types';
import { IStorageService } from '@/services/storage/storageService';

const CONVERSATIONS_KEY = 'bpd_ai_conversations';

export class LocalConversationRepository implements IConversationRepository {
  constructor(private storage: IStorageService) {}

  async getAll(): Promise<AIConversation[]> {
    const data = await this.storage.get<AIConversation[]>(CONVERSATIONS_KEY);
    console.log('[ConversationRepository] Loaded', data?.length ?? 0, 'conversations');
    return data ?? [];
  }

  async save(conversations: AIConversation[]): Promise<void> {
    await this.storage.set(CONVERSATIONS_KEY, conversations);
    console.log('[ConversationRepository] Saved', conversations.length, 'conversations');
  }

  async getById(id: string): Promise<AIConversation | null> {
    const conversations = await this.getAll();
    return conversations.find(c => c.id === id) ?? null;
  }

  async add(conversation: AIConversation): Promise<AIConversation[]> {
    const conversations = await this.getAll();
    const updated = [conversation, ...conversations];
    await this.save(updated);
    return updated;
  }

  async update(id: string, updates: Partial<AIConversation>): Promise<AIConversation[]> {
    const conversations = await this.getAll();
    const updated = conversations.map(c => c.id === id ? { ...c, ...updates } : c);
    await this.save(updated);
    return updated;
  }

  async remove(id: string): Promise<AIConversation[]> {
    const conversations = await this.getAll();
    const updated = conversations.filter(c => c.id !== id);
    await this.save(updated);
    return updated;
  }
}
