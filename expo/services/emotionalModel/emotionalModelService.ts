import { JournalEntry, MessageDraft } from '@/types';
import { PersonalEmotionalModel, EmotionalModelInsight, AIPersonalizationContext } from '@/types/emotionalModel';
import { buildPersonalEmotionalModel, generateModelInsights, buildAIPersonalizationContext } from '@/services/emotionalModel/emotionalMemoryBuilder';
import { storageService } from '@/services/storage/storageService';

const MODEL_STORAGE_KEY = 'bpd_personal_emotional_model';
const MODEL_UPDATED_KEY = 'bpd_personal_emotional_model_updated';
const MIN_REBUILD_INTERVAL_MS = 10 * 60 * 1000;

export interface EmotionalModelState {
  model: PersonalEmotionalModel;
  insights: EmotionalModelInsight[];
  aiContext: AIPersonalizationContext;
  lastUpdated: number;
}

function createEmptyModel(): PersonalEmotionalModel {
  return {
    id: 'personal_model',
    lastUpdated: 0,
    dataPointCount: 0,
    topTriggers: [],
    emotionSequences: [],
    frequentUrges: [],
    relationshipTriggers: [],
    effectiveCoping: [],
    escalationPatterns: [],
    overallDistressTrend: 'unknown',
    averageDistress: 0,
    modelNarrative: 'Your emotional profile will build as you use the app. Each check-in adds more understanding.',
    growthAreas: [],
    attentionAreas: [],
  };
}

function createEmptyContext(): AIPersonalizationContext {
  return {
    topTriggersSummary: '',
    emotionPatternsSummary: '',
    urgeTendenciesSummary: '',
    relationshipPatternsSummary: '',
    copingStrengthsSummary: '',
    escalationRiskSummary: '',
    growthNarrative: '',
    fullContextString: '',
  };
}

export function buildFullEmotionalModelState(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): EmotionalModelState {
  console.log('[EmotionalModelService] Building full model state');

  if (journalEntries.length === 0) {
    console.log('[EmotionalModelService] No data, returning empty state');
    return {
      model: createEmptyModel(),
      insights: [],
      aiContext: createEmptyContext(),
      lastUpdated: Date.now(),
    };
  }

  const model = buildPersonalEmotionalModel(journalEntries, messageDrafts);
  const insights = generateModelInsights(model);
  const aiContext = buildAIPersonalizationContext(model, messageDrafts);

  console.log('[EmotionalModelService] Built state:', insights.length, 'insights');

  return {
    model,
    insights,
    aiContext,
    lastUpdated: Date.now(),
  };
}

export async function persistEmotionalModel(model: PersonalEmotionalModel): Promise<void> {
  try {
    await storageService.set(MODEL_STORAGE_KEY, model);
    await storageService.set(MODEL_UPDATED_KEY, Date.now());
    console.log('[EmotionalModelService] Persisted model with', model.dataPointCount, 'data points');
  } catch (error) {
    console.log('[EmotionalModelService] Error persisting model:', error);
  }
}

export async function loadPersistedEmotionalModel(): Promise<PersonalEmotionalModel | null> {
  try {
    const model = await storageService.get<PersonalEmotionalModel>(MODEL_STORAGE_KEY);
    console.log('[EmotionalModelService] Loaded persisted model:', model ? `${model.dataPointCount} data points` : 'null');
    return model;
  } catch (error) {
    console.log('[EmotionalModelService] Error loading persisted model:', error);
    return null;
  }
}

export async function shouldRebuildModel(): Promise<boolean> {
  try {
    const lastUpdated = await storageService.get<number>(MODEL_UPDATED_KEY);
    if (!lastUpdated) return true;
    return Date.now() - lastUpdated > MIN_REBUILD_INTERVAL_MS;
  } catch {
    return true;
  }
}

export function getTopTriggerNarrative(model: PersonalEmotionalModel): string {
  if (model.topTriggers.length === 0) return '';
  const top = model.topTriggers[0];
  return `"${top.label}" often seems to trigger ${top.commonEmotions[0]?.toLowerCase() ?? 'distress'}.`;
}

export function getCopingStrengthNarrative(model: PersonalEmotionalModel): string {
  if (model.effectiveCoping.length === 0) return '';
  const best = model.effectiveCoping[0];
  return `${best.tool} appears to help in about ${best.helpfulRate}% of situations.`;
}

export function getRelationshipPatternNarrative(model: PersonalEmotionalModel): string {
  if (model.relationshipTriggers.length === 0) return '';
  return model.relationshipTriggers[0].narrative;
}

export function generateCompanionContext(state: EmotionalModelState): string {
  if (!state.aiContext.fullContextString) {
    return 'The user is still building their emotional profile.';
  }

  const prefix = 'PERSONAL EMOTIONAL MODEL: ';
  return prefix + state.aiContext.fullContextString;
}
