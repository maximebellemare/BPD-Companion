import { storageService } from '@/services/storage/storageService';

const SAVED_INSIGHTS_KEY = 'bpd_companion_saved_insights';
const RESPONSE_FEEDBACK_KEY = 'bpd_companion_response_feedback';

export type CompanionResponseFeedback = 'useful' | 'not_useful';

export interface SavedCompanionInsight {
  id: string;
  conversationId: string;
  messageId: string;
  content: string;
  userMessage?: string;
  createdAt: number;
  source: 'companion';
  tags: string[];
}

export interface CompanionResponseFeedbackRecord {
  messageId: string;
  conversationId: string;
  rating: CompanionResponseFeedback;
  createdAt: number;
}

export async function loadSavedCompanionInsights(): Promise<SavedCompanionInsight[]> {
  return (await storageService.get<SavedCompanionInsight[]>(SAVED_INSIGHTS_KEY)) ?? [];
}

export async function saveCompanionInsight(params: {
  conversationId: string;
  messageId: string;
  content: string;
  userMessage?: string;
  tags?: string[];
}): Promise<SavedCompanionInsight[]> {
  const existing = await loadSavedCompanionInsights();
  const alreadySaved = existing.some(item => item.messageId === params.messageId);
  if (alreadySaved) return existing;

  const insight: SavedCompanionInsight = {
    id: `companion_insight_${Date.now()}`,
    conversationId: params.conversationId,
    messageId: params.messageId,
    content: params.content,
    userMessage: params.userMessage,
    createdAt: Date.now(),
    source: 'companion',
    tags: params.tags ?? [],
  };

  const updated = [insight, ...existing].slice(0, 100);
  await storageService.set(SAVED_INSIGHTS_KEY, updated);
  return updated;
}

export async function deleteCompanionInsight(insightId: string): Promise<SavedCompanionInsight[]> {
  const existing = await loadSavedCompanionInsights();
  const updated = existing.filter(item => item.id !== insightId);
  await storageService.set(SAVED_INSIGHTS_KEY, updated);
  return updated;
}

export async function loadCompanionResponseFeedback(): Promise<Record<string, CompanionResponseFeedbackRecord>> {
  return (await storageService.get<Record<string, CompanionResponseFeedbackRecord>>(RESPONSE_FEEDBACK_KEY)) ?? {};
}

export async function rateCompanionResponse(params: {
  conversationId: string;
  messageId: string;
  rating: CompanionResponseFeedback;
}): Promise<Record<string, CompanionResponseFeedbackRecord>> {
  const existing = await loadCompanionResponseFeedback();
  const updated: Record<string, CompanionResponseFeedbackRecord> = {
    ...existing,
    [params.messageId]: {
      conversationId: params.conversationId,
      messageId: params.messageId,
      rating: params.rating,
      createdAt: Date.now(),
    },
  };
  await storageService.set(RESPONSE_FEEDBACK_KEY, updated);
  return updated;
}
