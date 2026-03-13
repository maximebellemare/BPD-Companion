import { storageService } from '@/services/storage/storageService';
import { IdentityJournalEntry } from '@/types/identity';

const JOURNAL_KEY = 'steady_identity_journal';

export async function getIdentityJournalEntries(): Promise<IdentityJournalEntry[]> {
  const data = await storageService.get<IdentityJournalEntry[]>(JOURNAL_KEY);
  console.log('[IdentityJournalService] Loaded', data?.length ?? 0, 'entries');
  return data ?? [];
}

export async function saveIdentityJournalEntry(
  promptId: string,
  promptText: string,
  content: string,
  tags: string[],
): Promise<IdentityJournalEntry[]> {
  const existing = await getIdentityJournalEntries();
  const now = Date.now();
  const newEntry: IdentityJournalEntry = {
    id: `ij_${now}_${Math.random().toString(36).slice(2, 8)}`,
    promptId,
    promptText,
    content,
    tags,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };
  const updated = [newEntry, ...existing];
  await storageService.set(JOURNAL_KEY, updated);
  console.log('[IdentityJournalService] Saved entry for prompt:', promptId);
  return updated;
}

export async function updateIdentityJournalEntry(
  id: string,
  updates: Partial<Pick<IdentityJournalEntry, 'content' | 'tags' | 'isFavorite'>>,
): Promise<IdentityJournalEntry[]> {
  const existing = await getIdentityJournalEntries();
  const updated = existing.map(e =>
    e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
  );
  await storageService.set(JOURNAL_KEY, updated);
  console.log('[IdentityJournalService] Updated entry:', id);
  return updated;
}

export async function deleteIdentityJournalEntry(id: string): Promise<IdentityJournalEntry[]> {
  const existing = await getIdentityJournalEntries();
  const updated = existing.filter(e => e.id !== id);
  await storageService.set(JOURNAL_KEY, updated);
  console.log('[IdentityJournalService] Deleted entry:', id);
  return updated;
}

export async function toggleIdentityJournalFavorite(id: string): Promise<IdentityJournalEntry[]> {
  const existing = await getIdentityJournalEntries();
  const updated = existing.map(e =>
    e.id === id ? { ...e, isFavorite: !e.isFavorite } : e
  );
  await storageService.set(JOURNAL_KEY, updated);
  console.log('[IdentityJournalService] Toggled favorite on entry:', id);
  return updated;
}
