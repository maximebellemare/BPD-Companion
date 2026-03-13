import { JournalEntry, MessageDraft } from '@/types';
import { ReflectionMirrorData } from '@/types/reflectionMirror';
import {
  generateEmotionalThemes,
  generateRelationshipPatterns,
  generateCopingInsights,
  generateGrowthSignals,
  generateOpeningReflection,
} from '@/services/reflection/reflectionGenerator';

let cachedMirror: ReflectionMirrorData | null = null;
let cachedKey = '';

function getCacheKey(entriesCount: number, draftsCount: number): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${day}_${entriesCount}_${draftsCount}`;
}

export function generateReflectionMirror(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): ReflectionMirrorData {
  const key = getCacheKey(journalEntries.length, messageDrafts.length);

  if (cachedMirror && cachedKey === key) {
    console.log('[ReflectionMirrorService] Returning cached mirror');
    return cachedMirror;
  }

  console.log('[ReflectionMirrorService] Generating reflection mirror...');

  const emotionalThemes = generateEmotionalThemes(journalEntries);
  const relationshipPatterns = generateRelationshipPatterns(journalEntries, messageDrafts);
  const copingInsights = generateCopingInsights(journalEntries, messageDrafts);
  const growthSignals = generateGrowthSignals(journalEntries, messageDrafts);
  const openingReflection = generateOpeningReflection(journalEntries, messageDrafts);

  const hasEnoughData = journalEntries.filter(
    e => Date.now() - e.timestamp < 14 * 24 * 60 * 60 * 1000
  ).length >= 2;

  const mirror: ReflectionMirrorData = {
    id: `mirror_${Date.now()}`,
    generatedAt: Date.now(),
    emotionalThemes,
    relationshipPatterns,
    copingInsights,
    growthSignals,
    openingReflection,
    hasEnoughData,
  };

  cachedMirror = mirror;
  cachedKey = key;

  console.log('[ReflectionMirrorService] Mirror generated:', {
    themes: emotionalThemes.length,
    patterns: relationshipPatterns.length,
    coping: copingInsights.length,
    growth: growthSignals.length,
    hasEnoughData,
  });

  return mirror;
}

export function invalidateReflectionMirrorCache(): void {
  cachedMirror = null;
  cachedKey = '';
  console.log('[ReflectionMirrorService] Cache invalidated');
}
