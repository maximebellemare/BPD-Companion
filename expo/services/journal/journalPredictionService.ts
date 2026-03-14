import { SmartJournalEntry } from '@/types/journalEntry';
import { JournalPrediction } from '@/types/journalDaily';

function generateId(): string {
  return `jp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateJournalPredictions(
  entries: SmartJournalEntry[],
  days: number = 14
): JournalPrediction[] {
  console.log('[JournalPrediction] Generating predictions from', entries.length, 'entries');

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = entries.filter(e => e.timestamp >= cutoff);
  if (recent.length < 3) return [];

  const predictions: JournalPrediction[] = [];

  const triggerCounts: Record<string, number> = {};
  recent.forEach(entry => {
    entry.triggers.forEach(t => {
      triggerCounts[t.label] = (triggerCounts[t.label] ?? 0) + 1;
    });
  });

  const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0];
  if (topTrigger && topTrigger[1] >= 3) {
    predictions.push({
      id: generateId(),
      timestamp: Date.now(),
      type: 'trigger_pattern',
      title: 'Recurring trigger detected',
      description: `"${topTrigger[0]}" has appeared ${topTrigger[1]} times in recent entries. This pattern may be building stress.`,
      confidence: topTrigger[1] >= 5 ? 'high' : 'medium',
      suggestedAction: {
        label: 'Reflect on this trigger',
        route: '/journal-guided',
        params: { flowId: 'gf_trigger_analysis' },
      },
      basedOn: `${topTrigger[1]} entries with this trigger`,
      acknowledged: false,
    });
  }

  const recentDistress = recent.slice(0, 5).map(e => e.distressLevel);
  const avgRecent = recentDistress.reduce((s, v) => s + v, 0) / recentDistress.length;
  const olderDistress = recent.slice(5, 10).map(e => e.distressLevel);
  if (olderDistress.length >= 3) {
    const avgOlder = olderDistress.reduce((s, v) => s + v, 0) / olderDistress.length;
    if (avgRecent > avgOlder + 1.5) {
      predictions.push({
        id: generateId(),
        timestamp: Date.now(),
        type: 'emotional_buildup',
        title: 'Distress may be building',
        description: 'Recent entries show rising emotional intensity compared to earlier this period. A grounding check-in may help.',
        confidence: avgRecent > avgOlder + 2.5 ? 'high' : 'medium',
        suggestedAction: {
          label: 'Grounding check-in',
          route: '/check-in',
        },
        basedOn: `Average distress rose from ${avgOlder.toFixed(1)} to ${avgRecent.toFixed(1)}`,
        acknowledged: false,
      });
    }
  }

  const hourCounts: Record<number, { count: number; totalDistress: number }> = {};
  recent.forEach(entry => {
    const hour = new Date(entry.timestamp).getHours();
    const bucket = hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3;
    if (!hourCounts[bucket]) hourCounts[bucket] = { count: 0, totalDistress: 0 };
    hourCounts[bucket].count++;
    hourCounts[bucket].totalDistress += entry.distressLevel;
  });

  const bucketLabels = ['Late night', 'Morning', 'Afternoon', 'Evening'];
  const highDistressBucket = Object.entries(hourCounts)
    .filter(([, data]) => data.count >= 2)
    .sort((a, b) => (b[1].totalDistress / b[1].count) - (a[1].totalDistress / a[1].count))[0];

  if (highDistressBucket) {
    const avg = highDistressBucket[1].totalDistress / highDistressBucket[1].count;
    if (avg >= 6) {
      const label = bucketLabels[parseInt(highDistressBucket[0])] ?? 'Unknown';
      predictions.push({
        id: generateId(),
        timestamp: Date.now(),
        type: 'time_pattern',
        title: `${label} entries tend to be more intense`,
        description: `Your ${label.toLowerCase()} entries average ${avg.toFixed(1)}/10 distress. Planning support for this time may help.`,
        confidence: 'medium',
        suggestedAction: {
          label: 'Set a daily ritual',
          route: '/daily-rituals',
        },
        basedOn: `${highDistressBucket[1].count} entries in this time window`,
        acknowledged: false,
      });
    }
  }

  const relationshipEntries = recent.filter(e =>
    e.triggers.some(t => t.category === 'relationship') ||
    e.format === 'relationship_conflict'
  );
  if (relationshipEntries.length >= 3) {
    const relDistress = relationshipEntries.reduce((s, e) => s + e.distressLevel, 0) / relationshipEntries.length;
    if (relDistress >= 5) {
      predictions.push({
        id: generateId(),
        timestamp: Date.now(),
        type: 'relationship_cycle',
        title: 'Relationship patterns may be active',
        description: 'Several recent entries involve relationship triggers. This pattern has appeared before and may benefit from focused reflection.',
        confidence: relationshipEntries.length >= 5 ? 'high' : 'medium',
        suggestedAction: {
          label: 'Relationship reflection',
          route: '/journal-guided',
          params: { flowId: 'gf_relationship_conflict' },
        },
        basedOn: `${relationshipEntries.length} relationship-related entries`,
        acknowledged: false,
      });
    }
  }

  console.log('[JournalPrediction] Generated', predictions.length, 'predictions');
  return predictions.slice(0, 3);
}
