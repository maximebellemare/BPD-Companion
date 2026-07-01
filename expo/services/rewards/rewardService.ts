import {
  ConsistencyMetrics,
  MilestoneDefinition,
  MILESTONE_DEFINITIONS,
  UnlockedMilestone,
  RewardState,
} from '@/types/reward';
import { trackEvent } from '@/services/analytics/analyticsService';

function getMetricValueForCategory(
  metrics: ConsistencyMetrics,
  milestone: MilestoneDefinition,
): number {
  switch (milestone.category) {
    case 'check_in':
      return metrics.checkInDays;
    case 'journaling':
      return metrics.journalDays;
    case 'insight':
      if (milestone.id === 'first_saved_insight') return metrics.savedInsightCount;
      return metrics.firstInsightCount;
    case 'calm':
      return metrics.calmMeDownSessions;
    case 'community':
      return metrics.communityPosts;
    case 'pause_win':
      return metrics.pauseWins;
    case 'reflection':
      if (milestone.id === 'five_day_reflection') return metrics.journalDays;
      return metrics.weeklyReflections;
    case 'skill_practice':
      return metrics.skillPracticeSessions;
    case 'therapy_prep':
      return metrics.therapyPreps;
    case 'medication':
      return metrics.medicationAdherenceDays;
    case 'companion':
      return metrics.companionSessions;
    case 'support_before_reaction':
      return metrics.supportBeforeReaction;
    case 'appointment':
      return metrics.appointmentsAttended;
    case 'consistency':
      if (milestone.id === 'first_week_complete') {
        return metrics.checkInDays;
      }
      if (milestone.id.startsWith('checkin_streak')) {
        return metrics.currentCheckInStreak;
      }
      return metrics.currentCheckInStreak;
    default:
      return 0;
  }
}

export function evaluateMilestones(
  metrics: ConsistencyMetrics,
  existingUnlocked: UnlockedMilestone[],
): UnlockedMilestone[] {
  const unlockedIds = new Set(existingUnlocked.map(u => u.milestoneId));
  const newlyUnlocked: UnlockedMilestone[] = [];

  for (const milestone of MILESTONE_DEFINITIONS) {
    if (unlockedIds.has(milestone.id)) continue;
    const value = getMetricValueForCategory(metrics, milestone);
    if (value >= milestone.threshold) {
      const unlocked: UnlockedMilestone = {
        milestoneId: milestone.id,
        unlockedAt: Date.now(),
        seen: false,
      };
      newlyUnlocked.push(unlocked);
      console.log(`[RewardService] Milestone unlocked: ${milestone.id} (${milestone.title})`);

      void trackEvent('reward_unlocked', {
        milestone_id: milestone.id,
        milestone_title: milestone.title,
        category: milestone.category,
        level: milestone.level,
      });

      void trackEvent('milestone_completed', {
        milestone_id: milestone.id,
        category: milestone.category,
      });
    }
  }

  return [...existingUnlocked, ...newlyUnlocked];
}

export function getUnseenMilestones(state: RewardState): MilestoneDefinition[] {
  const unseenIds = state.unlockedMilestones
    .filter(u => !u.seen)
    .map(u => u.milestoneId);
  return MILESTONE_DEFINITIONS.filter(m => unseenIds.includes(m.id));
}

export function getRecentMilestone(state: RewardState): MilestoneDefinition | null {
  const recent = state.unlockedMilestones
    .filter(u => !u.seen)
    .sort((a, b) => b.unlockedAt - a.unlockedAt);
  if (recent.length === 0) return null;
  return MILESTONE_DEFINITIONS.find(m => m.id === recent[0].milestoneId) ?? null;
}

export function getUnlockedDefinitions(state: RewardState): MilestoneDefinition[] {
  const unlockedIds = new Set(state.unlockedMilestones.map(u => u.milestoneId));
  return MILESTONE_DEFINITIONS.filter(m => unlockedIds.has(m.id));
}

export function getNextMilestones(
  metrics: ConsistencyMetrics,
  state: RewardState,
): Array<MilestoneDefinition & { progress: number }> {
  const unlockedIds = new Set(state.unlockedMilestones.map(u => u.milestoneId));
  const seenCategories = new Set<string>();
  const next: Array<MilestoneDefinition & { progress: number }> = [];

  for (const milestone of MILESTONE_DEFINITIONS) {
    if (unlockedIds.has(milestone.id)) continue;
    if (seenCategories.has(milestone.category)) continue;

    const value = getMetricValueForCategory(metrics, milestone);
    const progress = Math.min(1, value / milestone.threshold);
    if (progress < 1) {
      next.push({ ...milestone, progress });
      seenCategories.add(milestone.category);
    }
  }

  return next.sort((a, b) => b.progress - a.progress).slice(0, 5);
}

export function getMilestoneDefinition(id: string): MilestoneDefinition | undefined {
  return MILESTONE_DEFINITIONS.find(m => m.id === id);
}
