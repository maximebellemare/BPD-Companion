import { storageService } from '@/services/storage/storageService';
import {
  AnchorStatement,
  ConflictAlignmentSession,
} from '@/types/identity';

const ANCHORS_KEY = 'steady_anchor_statements';
const CONFLICT_KEY = 'steady_conflict_sessions';

export async function getAnchorStatements(): Promise<AnchorStatement[]> {
  const data = await storageService.get<AnchorStatement[]>(ANCHORS_KEY);
  console.log('[SelfTrustService] Loaded', data?.length ?? 0, 'anchor statements');
  return data ?? [];
}

export async function saveAnchorStatement(text: string): Promise<AnchorStatement[]> {
  const existing = await getAnchorStatements();
  const newAnchor: AnchorStatement = {
    id: `anc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    isPinned: false,
    isFavorite: false,
    createdAt: Date.now(),
  };
  const updated = [newAnchor, ...existing];
  await storageService.set(ANCHORS_KEY, updated);
  console.log('[SelfTrustService] Saved anchor statement');
  return updated;
}

export async function toggleAnchorPin(id: string): Promise<AnchorStatement[]> {
  const existing = await getAnchorStatements();
  const updated = existing.map(a =>
    a.id === id ? { ...a, isPinned: !a.isPinned } : a
  );
  await storageService.set(ANCHORS_KEY, updated);
  console.log('[SelfTrustService] Toggled pin on anchor:', id);
  return updated;
}

export async function toggleAnchorFavorite(id: string): Promise<AnchorStatement[]> {
  const existing = await getAnchorStatements();
  const updated = existing.map(a =>
    a.id === id ? { ...a, isFavorite: !a.isFavorite } : a
  );
  await storageService.set(ANCHORS_KEY, updated);
  console.log('[SelfTrustService] Toggled favorite on anchor:', id);
  return updated;
}

export async function deleteAnchorStatement(id: string): Promise<AnchorStatement[]> {
  const existing = await getAnchorStatements();
  const updated = existing.filter(a => a.id !== id);
  await storageService.set(ANCHORS_KEY, updated);
  console.log('[SelfTrustService] Deleted anchor:', id);
  return updated;
}

export async function getConflictSessions(): Promise<ConflictAlignmentSession[]> {
  const data = await storageService.get<ConflictAlignmentSession[]>(CONFLICT_KEY);
  console.log('[SelfTrustService] Loaded', data?.length ?? 0, 'conflict sessions');
  return data ?? [];
}

export async function saveConflictSession(
  session: Omit<ConflictAlignmentSession, 'id' | 'createdAt'>,
): Promise<ConflictAlignmentSession[]> {
  const existing = await getConflictSessions();
  const newSession: ConflictAlignmentSession = {
    ...session,
    id: `cas_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const updated = [newSession, ...existing];
  await storageService.set(CONFLICT_KEY, updated);
  console.log('[SelfTrustService] Saved conflict alignment session');
  return updated;
}

export async function deleteConflictSession(id: string): Promise<ConflictAlignmentSession[]> {
  const existing = await getConflictSessions();
  const updated = existing.filter(s => s.id !== id);
  await storageService.set(CONFLICT_KEY, updated);
  console.log('[SelfTrustService] Deleted conflict session:', id);
  return updated;
}
