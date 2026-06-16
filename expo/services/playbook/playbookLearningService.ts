import {
  PersonalToolRecord,
  ToolUsageLog,
  EmotionalSituation,
  SituationRecommendation,
  SituationCategory,
  PlaybookInsight,
} from '@/types/personalPlaybook';

export const SITUATION_CATEGORIES: SituationCategory[] = [
  {
    id: 'rejected',
    label: 'I feel rejected',
    description: 'Abandonment fear, feeling unwanted',
    iconName: 'ShieldOff',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.18)',
    keywords: ['rejected', 'abandoned', 'unwanted', 'ignored', 'left out'],
  },
  {
    id: 'overwhelmed',
    label: "I'm overwhelmed",
    description: 'Too much, flooding, shutdown',
    iconName: 'Zap',
    color: '#3B82F6',
    bgColor: '#FFFFFF',
    keywords: ['overwhelmed', 'flooded', 'too much', 'cant cope'],
  },
  {
    id: 'ashamed',
    label: 'I feel ashamed',
    description: 'Guilt, self-blame, worthlessness',
    iconName: 'Eye',
    color: '#67E8F9',
    bgColor: 'rgba(103, 232, 249, 0.18)',
    keywords: ['ashamed', 'guilty', 'worthless', 'bad person'],
  },
  {
    id: 'angry',
    label: 'I feel angry',
    description: 'Rage, frustration, disrespect',
    iconName: 'Flame',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.18)',
    keywords: ['angry', 'furious', 'rage', 'frustrated'],
  },
  {
    id: 'anxious',
    label: 'I feel anxious',
    description: 'Worry, uncertainty, dread',
    iconName: 'AlertCircle',
    color: '#3B82F6',
    bgColor: '#FFFFFF',
    keywords: ['anxious', 'worried', 'scared', 'uncertain'],
  },
  {
    id: 'lonely',
    label: 'I feel lonely',
    description: 'Disconnected, unseen, isolated',
    iconName: 'UserX',
    color: '#2E2A72',
    bgColor: '#FFFFFF',
    keywords: ['lonely', 'alone', 'isolated', 'disconnected'],
  },
  {
    id: 'before-messaging',
    label: 'Before I text',
    description: 'Pause, check, plan a response',
    iconName: 'MessageCircle',
    color: '#3B82F6',
    bgColor: '#FFFFFF',
    keywords: ['text', 'message', 'reply', 'respond'],
  },
  {
    id: 'after-conflict',
    label: 'After conflict',
    description: 'Recovery, repair, processing',
    iconName: 'HeartCrack',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.18)',
    keywords: ['conflict', 'fight', 'argument', 'blowup'],
  },
  {
    id: 'distress-spike',
    label: 'Distress spiking',
    description: 'Rapid escalation, crisis edge',
    iconName: 'TrendingUp',
    color: '#3B82F6',
    bgColor: '#FFFFFF',
    keywords: ['spike', 'crisis', 'intense', 'escalating'],
  },
  {
    id: 'numb',
    label: 'I feel numb',
    description: 'Empty, disconnected, shut down',
    iconName: 'CloudOff',
    color: '#2E2A72',
    bgColor: '#15145A',
    keywords: ['numb', 'empty', 'nothing', 'disconnected'],
  },
];

export function getRecommendationsForSituation(
  situation: EmotionalSituation,
  records: PersonalToolRecord[],
  _logs: ToolUsageLog[],
): SituationRecommendation {
  const matchingRecords = records.filter(r => r.situations.includes(situation));

  const sorted = [...matchingRecords].sort((a, b) => {
    const scoreA = a.effectivenessScore + (a.helpfulCount / Math.max(a.totalUses, 1)) * 30;
    const scoreB = b.effectivenessScore + (b.helpfulCount / Math.max(b.totalUses, 1)) * 30;
    return scoreB - scoreA;
  });

  const topTools = sorted.slice(0, 3);

  let insight: string | undefined;
  if (topTools.length > 0) {
    const best = topTools[0];
    if (best.avgDistressReduction >= 2) {
      insight = `${best.toolTitle} tends to reduce your distress by about ${best.avgDistressReduction} points in these moments.`;
    } else if (best.helpfulCount >= 3) {
      insight = `${best.toolTitle} has been helpful ${best.helpfulCount} times in similar situations.`;
    }
  }

  return {
    situation,
    tools: topTools,
    insight,
  };
}

export function getAllSituationRecommendations(
  records: PersonalToolRecord[],
  logs: ToolUsageLog[],
): SituationRecommendation[] {
  return SITUATION_CATEGORIES.map(cat =>
    getRecommendationsForSituation(cat.id, records, logs as ToolUsageLog[]),
  );
}

export function getWhatHelpedLastTime(
  currentEmotion: string,
  logs: ToolUsageLog[],
  records: PersonalToolRecord[],
): { tools: PersonalToolRecord[]; situation: EmotionalSituation | null } | null {
  const lower = currentEmotion.toLowerCase();
  const matchCategory = SITUATION_CATEGORIES.find(cat =>
    cat.keywords.some(kw => lower.includes(kw)),
  );

  if (!matchCategory) return null;

  const relevantLogs = logs.filter(l => {
    const logLower = `${l.emotion} ${l.situation}`.toLowerCase();
    return matchCategory.keywords.some(kw => logLower.includes(kw));
  });

  if (relevantLogs.length === 0) return null;

  const helpfulToolIds = new Set(
    relevantLogs.filter(l => l.helpful === true).map(l => l.toolId),
  );

  const tools = records
    .filter(r => helpfulToolIds.has(r.toolId))
    .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
    .slice(0, 3);

  if (tools.length === 0) return null;

  return { tools, situation: matchCategory.id };
}

export function generatePlaybookInsights(
  records: PersonalToolRecord[],
  logs: ToolUsageLog[],
): PlaybookInsight[] {
  const insights: PlaybookInsight[] = [];
  const now = Date.now();

  const effectiveRecords = [...records]
    .filter(r => r.totalUses >= 2)
    .sort((a, b) => b.effectivenessScore - a.effectivenessScore);

  if (effectiveRecords.length > 0) {
    const best = effectiveRecords[0];
    insights.push({
      id: `eff-${best.toolId}`,
      text: `${best.toolTitle} is your most effective tool, reducing distress by ${best.avgDistressReduction} points on average.`,
      type: 'effectiveness',
      createdAt: now,
      toolId: best.toolId,
    });
  }

  const situationMap = new Map<string, string[]>();
  for (const record of records) {
    for (const sit of record.situations) {
      if (!situationMap.has(sit)) situationMap.set(sit, []);
      situationMap.get(sit)!.push(record.toolTitle);
    }
  }

  for (const [sit, tools] of situationMap.entries()) {
    if (tools.length >= 2) {
      const cat = SITUATION_CATEGORIES.find(c => c.id === sit);
      if (cat) {
        insights.push({
          id: `pat-${sit}`,
          text: `When you feel ${cat.label.toLowerCase().replace('i feel ', '').replace("i'm ", '')}, you tend to reach for ${tools.slice(0, 2).join(' and ')}.`,
          type: 'pattern',
          createdAt: now,
          situation: sit as EmotionalSituation,
        });
      }
    }
  }

  const emotionCounts = new Map<string, number>();
  for (const log of logs) {
    if (log.emotion) {
      emotionCounts.set(log.emotion, (emotionCounts.get(log.emotion) ?? 0) + 1);
    }
  }
  const topEmotions = [...emotionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  if (topEmotions.length > 0) {
    insights.push({
      id: `emo-pattern`,
      text: `Your most common emotion when using tools is ${topEmotions[0][0].toLowerCase()}${topEmotions.length > 1 ? `, followed by ${topEmotions[1][0].toLowerCase()}` : ''}.`,
      type: 'pattern',
      createdAt: now,
    });
  }

  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = logs.filter(l => l.timestamp > weekAgo);
  if (thisWeek.length >= 5) {
    insights.push({
      id: 'milestone-weekly-5',
      text: `You've used ${thisWeek.length} tools this week. You're building strong emotional regulation habits.`,
      type: 'milestone',
      createdAt: now,
    });
  }

  const helpfulWithReduction = logs.filter(l => l.helpful === true && l.distressBefore - l.distressAfter >= 2);
  if (helpfulWithReduction.length >= 3) {
    insights.push({
      id: 'milestone-effective',
      text: `${helpfulWithReduction.length} times, a tool meaningfully reduced your distress. You're learning what works.`,
      type: 'milestone',
      createdAt: now,
    });
  }

  return insights.slice(0, 8);
}

export function getBestToolsForEmotion(
  emotion: string,
  records: PersonalToolRecord[],
): PersonalToolRecord[] {
  return records
    .filter(r => r.emotions.some(e => e.toLowerCase() === emotion.toLowerCase()))
    .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
    .slice(0, 3);
}

export interface EmotionToolProfile {
  emotion: string;
  bestTools: PersonalToolRecord[];
  avgReduction: number;
  totalUses: number;
}

export function getEmotionToolProfiles(
  records: PersonalToolRecord[],
  logs: ToolUsageLog[],
): EmotionToolProfile[] {
  const emotionMap = new Map<string, { toolIds: Set<string>; totalReduction: number; count: number }>();

  for (const log of logs) {
    if (!log.emotion) continue;
    const emotion = log.emotion.toLowerCase();
    const existing = emotionMap.get(emotion);
    const reduction = Math.max(0, log.distressBefore - log.distressAfter);

    if (existing) {
      existing.toolIds.add(log.toolId);
      existing.totalReduction += reduction;
      existing.count++;
    } else {
      emotionMap.set(emotion, {
        toolIds: new Set([log.toolId]),
        totalReduction: reduction,
        count: 1,
      });
    }
  }

  const profiles: EmotionToolProfile[] = [];

  for (const [emotion, data] of emotionMap.entries()) {
    const bestTools = records
      .filter(r => data.toolIds.has(r.toolId))
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, 3);

    if (bestTools.length > 0) {
      profiles.push({
        emotion,
        bestTools,
        avgReduction: data.count > 0 ? Math.round((data.totalReduction / data.count) * 10) / 10 : 0,
        totalUses: data.count,
      });
    }
  }

  return profiles
    .sort((a, b) => b.totalUses - a.totalUses)
    .slice(0, 8);
}

export function getToolTrends(
  logs: ToolUsageLog[],
): { improving: boolean; weeklyUsage: number; weeklyReduction: number; prevWeeklyUsage: number } {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  const thisWeekLogs = logs.filter(l => l.timestamp > weekAgo);
  const prevWeekLogs = logs.filter(l => l.timestamp > twoWeeksAgo && l.timestamp <= weekAgo);

  const weeklyUsage = thisWeekLogs.length;
  const prevWeeklyUsage = prevWeekLogs.length;

  const thisWeekReductions = thisWeekLogs
    .filter(l => l.distressBefore > 0)
    .map(l => Math.max(0, l.distressBefore - l.distressAfter));
  const weeklyReduction = thisWeekReductions.length > 0
    ? Math.round((thisWeekReductions.reduce((s, r) => s + r, 0) / thisWeekReductions.length) * 10) / 10
    : 0;

  const improving = weeklyUsage >= prevWeeklyUsage && weeklyReduction > 0;

  return { improving, weeklyUsage, weeklyReduction, prevWeeklyUsage };
}

export function getSmartRecommendation(
  currentEmotion: string | null,
  currentIntensity: number,
  records: PersonalToolRecord[],
  _logs: ToolUsageLog[],
): { tool: PersonalToolRecord | null; reason: string } {
  if (records.length === 0) return { tool: null, reason: '' };

  if (currentIntensity >= 7) {
    const crisisTools = records
      .filter(r =>
        r.situations.includes('distress-spike') ||
        r.situations.includes('overwhelmed') ||
        r.avgDistressReduction >= 2
      )
      .sort((a, b) => b.avgDistressReduction - a.avgDistressReduction);

    if (crisisTools.length > 0) {
      return {
        tool: crisisTools[0],
        reason: `This tool has reduced your distress by ${crisisTools[0].avgDistressReduction} points before.`,
      };
    }
  }

  if (currentEmotion) {
    const emotionTools = getBestToolsForEmotion(currentEmotion, records);
    if (emotionTools.length > 0) {
      return {
        tool: emotionTools[0],
        reason: `This tends to help when you feel ${currentEmotion.toLowerCase()}.`,
      };
    }
  }

  const topTool = [...records].sort((a, b) => b.effectivenessScore - a.effectivenessScore)[0];
  return {
    tool: topTool ?? null,
    reason: topTool ? 'Your most effective tool overall.' : '',
  };
}
