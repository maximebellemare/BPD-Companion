import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EnhancedMessageOutcome,
} from '@/types/messageOutcome';

const ENHANCED_OUTCOMES_KEY = 'enhanced_message_outcomes';

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'late_night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'late_night';
}

export function createOutcomeRecord(params: {
  originalDraft: string;
  rewrittenDraftUsed?: string | null;
  pathTypeSelected?: string | null;
  riskLevel?: string | null;
  emotionalState?: string | null;
  interpretation?: string | null;
  urge?: string | null;
  desiredOutcome?: string | null;
  relationshipContext?: string | null;
  distressBefore?: number | null;
  sourceFlow: EnhancedMessageOutcome['sourceFlow'];
  rewriteSubtype?: string | null;
}): EnhancedMessageOutcome {
  return {
    id: `emo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    originalDraft: params.originalDraft,
    rewrittenDraftUsed: params.rewrittenDraftUsed ?? null,
    pathTypeSelected: params.pathTypeSelected ?? null,
    riskLevel: params.riskLevel ?? null,
    emotionalState: params.emotionalState ?? null,
    interpretation: params.interpretation ?? null,
    urge: params.urge ?? null,
    desiredOutcome: params.desiredOutcome ?? null,
    relationshipContext: params.relationshipContext ?? null,
    distressBefore: params.distressBefore ?? null,
    distressAfter: null,
    pauseUsed: false,
    pauseDurationSeconds: null,
    groundingUsed: false,
    sentStatus: 'not_sent',
    regretReported: null,
    conflictResult: null,
    userHelpfulnessRating: null,
    notes: '',
    sourceFlow: params.sourceFlow,
    timeOfDay: getTimeOfDay(),
    rewriteSubtype: params.rewriteSubtype ?? null,
  };
}

export async function saveEnhancedOutcome(record: EnhancedMessageOutcome): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(ENHANCED_OUTCOMES_KEY);
    const outcomes: EnhancedMessageOutcome[] = stored ? JSON.parse(stored) : [];
    outcomes.unshift(record);
    const trimmed = outcomes.slice(0, 300);
    await AsyncStorage.setItem(ENHANCED_OUTCOMES_KEY, JSON.stringify(trimmed));
    console.log('[EnhancedOutcome] Saved:', record.id, 'Flow:', record.sourceFlow);
  } catch (err) {
    console.error('[EnhancedOutcome] Error saving:', err);
  }
}

export async function getEnhancedOutcomes(): Promise<EnhancedMessageOutcome[]> {
  try {
    const stored = await AsyncStorage.getItem(ENHANCED_OUTCOMES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('[EnhancedOutcome] Error loading:', err);
    return [];
  }
}

export async function updateEnhancedOutcome(
  id: string,
  updates: Partial<EnhancedMessageOutcome>,
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(ENHANCED_OUTCOMES_KEY);
    const outcomes: EnhancedMessageOutcome[] = stored ? JSON.parse(stored) : [];
    const updated = outcomes.map(o => o.id === id ? { ...o, ...updates } : o);
    await AsyncStorage.setItem(ENHANCED_OUTCOMES_KEY, JSON.stringify(updated));
    console.log('[EnhancedOutcome] Updated:', id);
  } catch (err) {
    console.error('[EnhancedOutcome] Error updating:', err);
  }
}

export async function getRecentOutcomes(days: number = 30): Promise<EnhancedMessageOutcome[]> {
  const all = await getEnhancedOutcomes();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return all.filter(o => o.createdAt > cutoff);
}

export async function getPendingOutcomeFollowups(): Promise<EnhancedMessageOutcome[]> {
  const all = await getEnhancedOutcomes();
  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
  return all.filter(o =>
    o.createdAt < sixHoursAgo &&
    o.createdAt > twoDaysAgo &&
    o.sentStatus === 'sent_now' &&
    o.conflictResult === null
  );
}
