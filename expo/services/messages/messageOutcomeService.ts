import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MessageOutcomeRecord,
  DraftVaultEntry,
} from '@/types/messageOutcome';

const OUTCOMES_KEY = 'message_outcomes';
const VAULT_KEY = 'draft_vault';

export async function saveOutcome(record: MessageOutcomeRecord): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(OUTCOMES_KEY);
    const outcomes: MessageOutcomeRecord[] = stored ? JSON.parse(stored) : [];
    outcomes.unshift(record);
    const trimmed = outcomes.slice(0, 200);
    await AsyncStorage.setItem(OUTCOMES_KEY, JSON.stringify(trimmed));
    console.log('[MessageOutcome] Saved outcome:', record.id);
  } catch (err) {
    console.error('[MessageOutcome] Error saving outcome:', err);
  }
}

export async function getOutcomes(): Promise<MessageOutcomeRecord[]> {
  try {
    const stored = await AsyncStorage.getItem(OUTCOMES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('[MessageOutcome] Error loading outcomes:', err);
    return [];
  }
}

export async function saveToDraftVault(entry: DraftVaultEntry): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(VAULT_KEY);
    const vault: DraftVaultEntry[] = stored ? JSON.parse(stored) : [];
    vault.unshift(entry);
    const trimmed = vault.slice(0, 100);
    await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(trimmed));
    console.log('[DraftVault] Saved entry:', entry.id);
  } catch (err) {
    console.error('[DraftVault] Error saving to vault:', err);
  }
}

export async function getDraftVault(): Promise<DraftVaultEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(VAULT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('[DraftVault] Error loading vault:', err);
    return [];
  }
}

export async function updateVaultEntry(id: string, updates: Partial<DraftVaultEntry>): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(VAULT_KEY);
    const vault: DraftVaultEntry[] = stored ? JSON.parse(stored) : [];
    const updated = vault.map(e => e.id === id ? { ...e, ...updates } : e);
    await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(updated));
    console.log('[DraftVault] Updated entry:', id);
  } catch (err) {
    console.error('[DraftVault] Error updating vault entry:', err);
  }
}

export async function deleteVaultEntry(id: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(VAULT_KEY);
    const vault: DraftVaultEntry[] = stored ? JSON.parse(stored) : [];
    const filtered = vault.filter(e => e.id !== id);
    await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(filtered));
    console.log('[DraftVault] Deleted entry:', id);
  } catch (err) {
    console.error('[DraftVault] Error deleting vault entry:', err);
  }
}
