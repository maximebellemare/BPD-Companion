import AsyncStorage from '@react-native-async-storage/async-storage';
import { DBTPracticeLog, DBTSkillInsight } from '@/types/dbt';
import { DBT_SKILLS } from '@/data/dbtSkills';

const PRACTICE_LOG_KEY = 'dbt_practice_logs';

export async function savePracticeLog(log: DBTPracticeLog): Promise<void> {
  try {
    const existing = await getPracticeLogs();
    const updated = [log, ...existing].slice(0, 500);
    await AsyncStorage.setItem(PRACTICE_LOG_KEY, JSON.stringify(updated));
    console.log('[DBTPractice] Saved practice log for skill:', log.skillId);
  } catch (error) {
    console.log('[DBTPractice] Error saving practice log:', error);
  }
}

export async function getPracticeLogs(): Promise<DBTPracticeLog[]> {
  try {
    const data = await AsyncStorage.getItem(PRACTICE_LOG_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log('[DBTPractice] Error loading practice logs:', error);
    return [];
  }
}

export async function getSkillInsight(skillId: string): Promise<DBTSkillInsight | null> {
  try {
    const logs = await getPracticeLogs();
    const skillLogs = logs.filter(l => l.skillId === skillId);

    if (skillLogs.length === 0) return null;

    const helpfulCount = skillLogs.filter(l => l.helpful === true).length;
    const withDistress = skillLogs.filter(l => l.distressBefore > 0 && l.distressAfter >= 0);
    const avgDistressReduction = withDistress.length > 0
      ? withDistress.reduce((sum, l) => sum + (l.distressBefore - l.distressAfter), 0) / withDistress.length
      : 0;

    const lowDistressUses = withDistress.filter(l => l.distressBefore <= 4).length;
    const midDistressUses = withDistress.filter(l => l.distressBefore > 4 && l.distressBefore <= 7).length;
    const highDistressUses = withDistress.filter(l => l.distressBefore > 7).length;

    let bestDistressRange = 'any';
    if (highDistressUses > midDistressUses && highDistressUses > lowDistressUses) {
      bestDistressRange = 'high (7-10)';
    } else if (midDistressUses > lowDistressUses) {
      bestDistressRange = 'moderate (4-7)';
    } else if (lowDistressUses > 0) {
      bestDistressRange = 'low (1-4)';
    }

    const lastUsed = Math.max(...skillLogs.map(l => l.timestamp));

    return {
      skillId,
      totalUses: skillLogs.length,
      helpfulCount,
      avgDistressReduction: Math.round(avgDistressReduction * 10) / 10,
      bestDistressRange,
      lastUsed,
    };
  } catch (error) {
    console.log('[DBTPractice] Error getting skill insight:', error);
    return null;
  }
}

export async function getBestSkillsForUser(): Promise<Array<{ skillId: string; score: number; reason: string }>> {
  try {
    const logs = await getPracticeLogs();
    if (logs.length === 0) return [];

    const skillScores = new Map<string, { helpful: number; total: number; avgReduction: number }>();

    for (const log of logs) {
      const current = skillScores.get(log.skillId) ?? { helpful: 0, total: 0, avgReduction: 0 };
      current.total += 1;
      if (log.helpful === true) current.helpful += 1;
      if (log.distressBefore > 0 && log.distressAfter >= 0) {
        const reduction = log.distressBefore - log.distressAfter;
        current.avgReduction = (current.avgReduction * (current.total - 1) + reduction) / current.total;
      }
      skillScores.set(log.skillId, current);
    }

    const results: Array<{ skillId: string; score: number; reason: string }> = [];

    for (const [skillId, data] of skillScores) {
      if (data.total < 1) continue;
      const helpRate = data.total > 0 ? data.helpful / data.total : 0;
      const score = helpRate * 50 + data.avgReduction * 5 + Math.min(data.total, 10);

      const skill = DBT_SKILLS.find(s => s.id === skillId);
      if (!skill) continue;

      let reason = '';
      if (data.avgReduction >= 2) {
        reason = `Reduces distress by ~${Math.round(data.avgReduction)} points on average`;
      } else if (helpRate >= 0.7) {
        reason = `Helpful ${Math.round(helpRate * 100)}% of the time`;
      } else {
        reason = `Practiced ${data.total} time${data.total > 1 ? 's' : ''}`;
      }

      results.push({ skillId, score, reason });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  } catch (error) {
    console.log('[DBTPractice] Error getting best skills:', error);
    return [];
  }
}

export async function getWeeklyStats(): Promise<{
  practicesThisWeek: number;
  skillsTried: number;
  avgDistressReduction: number;
  mostUsedSkill: string | null;
}> {
  try {
    const logs = await getPracticeLogs();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekLogs = logs.filter(l => l.timestamp >= weekAgo);

    const uniqueSkills = new Set(weekLogs.map(l => l.skillId));
    const withDistress = weekLogs.filter(l => l.distressBefore > 0 && l.distressAfter >= 0);
    const avgReduction = withDistress.length > 0
      ? withDistress.reduce((sum, l) => sum + (l.distressBefore - l.distressAfter), 0) / withDistress.length
      : 0;

    const skillCounts = new Map<string, number>();
    weekLogs.forEach(l => {
      skillCounts.set(l.skillId, (skillCounts.get(l.skillId) ?? 0) + 1);
    });

    let mostUsedSkill: string | null = null;
    let maxCount = 0;
    for (const [skillId, count] of skillCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostUsedSkill = skillId;
      }
    }

    return {
      practicesThisWeek: weekLogs.length,
      skillsTried: uniqueSkills.size,
      avgDistressReduction: Math.round(avgReduction * 10) / 10,
      mostUsedSkill,
    };
  } catch (error) {
    console.log('[DBTPractice] Error getting weekly stats:', error);
    return { practicesThisWeek: 0, skillsTried: 0, avgDistressReduction: 0, mostUsedSkill: null };
  }
}
