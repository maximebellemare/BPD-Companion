import { JournalEntry, MessageDraft } from '@/types';
import {
  EmotionalLoop,
  EmotionalLoopReport,
  LoopNode,
  LoopEdge,
  LoopCategory,
} from '@/types/emotionalLoop';
import { interpretLoops } from '@/services/patterns/loopInterpreter';

let cachedReport: EmotionalLoopReport | null = null;
let lastHash = '';

function computeHash(entries: JournalEntry[], drafts: MessageDraft[]): string {
  return `${entries.length}-${drafts.length}-${entries[0]?.timestamp ?? 0}-${drafts[0]?.timestamp ?? 0}`;
}

function makeNodeId(type: string, label: string): string {
  return `${type}::${label.toLowerCase().replace(/\s+/g, '_')}`;
}

interface SequenceItem {
  type: 'trigger' | 'emotion' | 'urge' | 'behavior' | 'outcome' | 'coping';
  label: string;
  intensity: number;
  timestamp: number;
}

function extractSequences(entries: JournalEntry[], drafts: MessageDraft[]): SequenceItem[][] {
  const sequences: SequenceItem[][] = [];

  for (const entry of entries) {
    const seq: SequenceItem[] = [];
    const ts = entry.timestamp;

    for (const t of entry.checkIn.triggers) {
      seq.push({ type: 'trigger', label: t.label, intensity: entry.checkIn.intensityLevel, timestamp: ts });
    }
    for (const e of entry.checkIn.emotions) {
      seq.push({ type: 'emotion', label: e.label, intensity: e.intensity ?? entry.checkIn.intensityLevel, timestamp: ts });
    }
    for (const u of entry.checkIn.urges) {
      seq.push({ type: 'urge', label: u.label, intensity: entry.checkIn.intensityLevel, timestamp: ts });
    }

    const nearbyDrafts = drafts.filter(
      d => Math.abs(d.timestamp - ts) < 2 * 60 * 60 * 1000,
    );
    if (nearbyDrafts.length > 0) {
      seq.push({ type: 'behavior', label: 'Message rewrite', intensity: entry.checkIn.intensityLevel, timestamp: ts });
      if (nearbyDrafts.some(d => d.paused)) {
        seq.push({ type: 'coping', label: 'Pause before sending', intensity: entry.checkIn.intensityLevel, timestamp: ts });
      }
    }

    if (entry.checkIn.copingUsed) {
      for (const c of entry.checkIn.copingUsed) {
        seq.push({ type: 'coping', label: c, intensity: entry.checkIn.intensityLevel, timestamp: ts });
      }
    }

    if (entry.outcome) {
      seq.push({ type: 'outcome', label: entry.outcome, intensity: entry.checkIn.intensityLevel, timestamp: ts });
    }

    if (seq.length >= 2) {
      sequences.push(seq);
    }
  }

  return sequences;
}

interface PairKey {
  sourceType: string;
  sourceLabel: string;
  targetType: string;
  targetLabel: string;
}

function detectPairs(sequences: SequenceItem[][]): Map<string, { pair: PairKey; count: number; totalIntensity: number; lastSeen: number }> {
  const pairMap = new Map<string, { pair: PairKey; count: number; totalIntensity: number; lastSeen: number }>();

  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 1; i++) {
      const a = seq[i];
      const b = seq[i + 1];
      const key = `${a.type}:${a.label}->${b.type}:${b.label}`;
      const existing = pairMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalIntensity += (a.intensity + b.intensity) / 2;
        existing.lastSeen = Math.max(existing.lastSeen, a.timestamp);
      } else {
        pairMap.set(key, {
          pair: { sourceType: a.type, sourceLabel: a.label, targetType: b.type, targetLabel: b.label },
          count: 1,
          totalIntensity: (a.intensity + b.intensity) / 2,
          lastSeen: a.timestamp,
        });
      }
    }
  }

  return pairMap;
}

function buildChains(
  pairMap: Map<string, { pair: PairKey; count: number; totalIntensity: number; lastSeen: number }>,
  startType: string,
  category: LoopCategory,
): EmotionalLoop[] {
  const MIN_OCCURRENCES = 2;
  const significantPairs = Array.from(pairMap.values()).filter(p => p.count >= MIN_OCCURRENCES);

  const startPairs = significantPairs.filter(p => p.pair.sourceType === startType);
  const loops: EmotionalLoop[] = [];

  for (const start of startPairs) {
    const nodes: LoopNode[] = [];
    const edges: LoopEdge[] = [];
    const visited = new Set<string>();

    let current = start;
    let chainLength = 0;
    const maxChainLength = 5;

    while (current && chainLength < maxChainLength) {
      const sourceId = makeNodeId(current.pair.sourceType, current.pair.sourceLabel);
      const targetId = makeNodeId(current.pair.targetType, current.pair.targetLabel);

      if (!visited.has(sourceId)) {
        nodes.push({
          id: sourceId,
          type: current.pair.sourceType as LoopNode['type'],
          label: current.pair.sourceLabel,
          frequency: current.count,
          averageIntensity: current.totalIntensity / current.count,
        });
        visited.add(sourceId);
      }

      if (!visited.has(targetId)) {
        nodes.push({
          id: targetId,
          type: current.pair.targetType as LoopNode['type'],
          label: current.pair.targetLabel,
          frequency: current.count,
          averageIntensity: current.totalIntensity / current.count,
        });
        visited.add(targetId);
      }

      edges.push({
        sourceId,
        targetId,
        occurrences: current.count,
        probability: Math.min(current.count / 10, 1),
      });

      const nextKey = Array.from(pairMap.entries()).find(([_, v]) =>
        v.pair.sourceType === current.pair.targetType &&
        v.pair.sourceLabel === current.pair.targetLabel &&
        v.count >= MIN_OCCURRENCES &&
        !visited.has(makeNodeId(v.pair.targetType, v.pair.targetLabel))
      );

      if (nextKey) {
        current = nextKey[1];
      } else {
        break;
      }
      chainLength++;
    }

    if (nodes.length >= 2) {
      const totalOccurrences = edges.reduce((sum, e) => sum + e.occurrences, 0);
      const avgDistress = nodes.reduce((sum, n) => sum + n.averageIntensity, 0) / nodes.length;

      loops.push({
        id: `loop_${category}_${loops.length}`,
        nodes,
        edges,
        occurrences: Math.round(totalOccurrences / edges.length),
        lastSeen: start.lastSeen,
        averageDistress: Math.round(avgDistress * 10) / 10,
        narrative: '',
        category,
      });
    }
  }

  return loops
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 5);
}

export function detectEmotionalLoops(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): EmotionalLoopReport {
  const hash = computeHash(journalEntries, messageDrafts);

  if (cachedReport && lastHash === hash) {
    console.log('[EmotionalLoopService] Returning cached report');
    return cachedReport;
  }

  console.log('[EmotionalLoopService] Detecting emotional loops...');

  const sequences = extractSequences(journalEntries, messageDrafts);
  const pairMap = detectPairs(sequences);

  const triggerChains = buildChains(pairMap, 'trigger', 'trigger_chain');
  const emotionChains = buildChains(pairMap, 'emotion', 'emotion_chain');
  const behaviorChains = buildChains(pairMap, 'behavior', 'behavior_chain');

  const allLoops = [...triggerChains, ...emotionChains, ...behaviorChains];
  const interpreted = interpretLoops(allLoops);

  const report: EmotionalLoopReport = {
    triggerChains: interpreted.triggerChains,
    emotionChains: interpreted.emotionChains,
    behaviorChains: interpreted.behaviorChains,
    interruptPoints: interpreted.interruptPoints,
    topInsight: interpreted.topInsight,
    lastUpdated: Date.now(),
    totalPatternsDetected: allLoops.length,
  };

  cachedReport = report;
  lastHash = hash;

  console.log('[EmotionalLoopService] Detected', allLoops.length, 'loops');
  return report;
}

export function invalidateLoopCache(): void {
  cachedReport = null;
  lastHash = '';
  console.log('[EmotionalLoopService] Cache invalidated');
}
