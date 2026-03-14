import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToolOutcome, PlaybookEntry } from '@/types/tools';

const OUTCOMES_KEY = 'tool_outcomes';
const PLAYBOOK_KEY = 'tool_playbook';

export async function saveToolOutcome(outcome: ToolOutcome): Promise<void> {
  try {
    const existing = await getToolOutcomes();
    const updated = [outcome, ...existing].slice(0, 200);
    await AsyncStorage.setItem(OUTCOMES_KEY, JSON.stringify(updated));
    console.log('[ToolOutcome] Saved outcome for tool:', outcome.toolId);

    if (outcome.helpful) {
      await updatePlaybookFromOutcome(outcome);
    }
  } catch (error) {
    console.log('[ToolOutcome] Error saving outcome:', error);
  }
}

export async function getToolOutcomes(): Promise<ToolOutcome[]> {
  try {
    const data = await AsyncStorage.getItem(OUTCOMES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log('[ToolOutcome] Error loading outcomes:', error);
    return [];
  }
}

export async function getToolEffectiveness(toolId: string): Promise<{
  totalUses: number;
  helpfulCount: number;
  avgDistressReduction: number;
}> {
  const outcomes = await getToolOutcomes();
  const toolOutcomes = outcomes.filter(o => o.toolId === toolId);

  if (toolOutcomes.length === 0) {
    return { totalUses: 0, helpfulCount: 0, avgDistressReduction: 0 };
  }

  const helpfulCount = toolOutcomes.filter(o => o.helpful === true).length;
  const withDistress = toolOutcomes.filter(o => o.distressBefore > 0 && o.distressAfter >= 0);
  const avgDistressReduction = withDistress.length > 0
    ? withDistress.reduce((sum, o) => sum + (o.distressBefore - o.distressAfter), 0) / withDistress.length
    : 0;

  return {
    totalUses: toolOutcomes.length,
    helpfulCount,
    avgDistressReduction: Math.round(avgDistressReduction * 10) / 10,
  };
}

export async function getRecentlyUsedTools(limit: number = 5): Promise<ToolOutcome[]> {
  const outcomes = await getToolOutcomes();
  const seen = new Set<string>();
  const recent: ToolOutcome[] = [];

  for (const outcome of outcomes) {
    if (!seen.has(outcome.toolId)) {
      seen.add(outcome.toolId);
      recent.push(outcome);
      if (recent.length >= limit) break;
    }
  }

  return recent;
}

export async function getMostHelpfulTools(limit: number = 5): Promise<Array<{ toolId: string; toolType: string; helpRate: number; uses: number }>> {
  const outcomes = await getToolOutcomes();
  const toolStats: Record<string, { helpful: number; total: number; type: string }> = {};

  outcomes.forEach(o => {
    if (!toolStats[o.toolId]) {
      toolStats[o.toolId] = { helpful: 0, total: 0, type: o.toolType };
    }
    toolStats[o.toolId].total++;
    if (o.helpful) toolStats[o.toolId].helpful++;
  });

  return Object.entries(toolStats)
    .filter(([, stats]) => stats.total >= 2)
    .map(([toolId, stats]) => ({
      toolId,
      toolType: stats.type,
      helpRate: Math.round((stats.helpful / stats.total) * 100),
      uses: stats.total,
    }))
    .sort((a, b) => b.helpRate - a.helpRate)
    .slice(0, limit);
}

async function updatePlaybookFromOutcome(outcome: ToolOutcome): Promise<void> {
  try {
    const playbook = await getPlaybook();
    const existingIdx = playbook.findIndex(p => p.toolId === outcome.toolId);

    if (existingIdx >= 0) {
      const entry = playbook[existingIdx];
      entry.useCount++;
      const totalHelpful = entry.avgHelpfulness * (entry.useCount - 1) + (outcome.helpful ? 1 : 0);
      entry.avgHelpfulness = totalHelpful / entry.useCount;
    }

    await AsyncStorage.setItem(PLAYBOOK_KEY, JSON.stringify(playbook));
  } catch (error) {
    console.log('[ToolOutcome] Error updating playbook:', error);
  }
}

export async function getPlaybook(): Promise<PlaybookEntry[]> {
  try {
    const data = await AsyncStorage.getItem(PLAYBOOK_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log('[Playbook] Error loading:', error);
    return [];
  }
}

export async function addToPlaybook(entry: PlaybookEntry): Promise<void> {
  try {
    const playbook = await getPlaybook();
    const exists = playbook.findIndex(p => p.toolId === entry.toolId);
    if (exists >= 0) {
      playbook[exists] = { ...playbook[exists], ...entry };
    } else {
      playbook.push(entry);
    }
    await AsyncStorage.setItem(PLAYBOOK_KEY, JSON.stringify(playbook));
    console.log('[Playbook] Added tool:', entry.toolId);
  } catch (error) {
    console.log('[Playbook] Error adding:', error);
  }
}

export async function removeFromPlaybook(toolId: string): Promise<void> {
  try {
    const playbook = await getPlaybook();
    const updated = playbook.filter(p => p.toolId !== toolId);
    await AsyncStorage.setItem(PLAYBOOK_KEY, JSON.stringify(updated));
  } catch (error) {
    console.log('[Playbook] Error removing:', error);
  }
}

export async function togglePlaybookPin(toolId: string): Promise<void> {
  try {
    const playbook = await getPlaybook();
    const entry = playbook.find(p => p.toolId === toolId);
    if (entry) {
      entry.pinned = !entry.pinned;
      await AsyncStorage.setItem(PLAYBOOK_KEY, JSON.stringify(playbook));
    }
  } catch (error) {
    console.log('[Playbook] Error toggling pin:', error);
  }
}
