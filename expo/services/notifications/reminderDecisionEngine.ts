import {
  ReminderRuleContext,
  ReminderDecision,
  SmartReminderState,
  FeatureUsageProfile,
} from '@/types/reminderRules';
import { NotificationCategory } from '@/types/notifications';
import { FullNotificationSettings } from './notificationScheduler';
import { REMINDER_RULES } from './reminderRules';

const MAX_DAILY_REMINDERS_BY_FREQ: Record<string, number> = {
  minimal: 2,
  balanced: 4,
  supportive: 6,
};

const MIN_GAP_BETWEEN_REMINDERS_MS = 2 * 60 * 60 * 1000;

const CATEGORY_SETTING_MAP: Record<string, keyof FullNotificationSettings> = {
  daily_checkin: 'dailyCheckInReminder',
  calm_followup: 'calmFollowups',
  weekly_reflection: 'weeklyReflectionReminder',
  relationship_support: 'relationshipSupportReminders',
  ritual_reminder: 'ritualReminders',
  reengagement: 'reengagementReminders',
};

function isCategoryEnabled(
  category: NotificationCategory,
  settings: FullNotificationSettings,
): boolean {
  const settingKey = CATEGORY_SETTING_MAP[category];
  if (!settingKey) return true;
  return Boolean(settings[settingKey]);
}

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

export class ReminderDecisionEngine {
  evaluateAll(
    ctx: ReminderRuleContext,
    settings: FullNotificationSettings,
    currentState: SmartReminderState,
  ): { active: ReminderDecision[]; suppressed: ReminderDecision[] } {
    const active: ReminderDecision[] = [];
    const suppressed: ReminderDecision[] = [];

    const maxDaily = MAX_DAILY_REMINDERS_BY_FREQ[settings.frequency] ?? 4;

    for (const rule of REMINDER_RULES) {
      const decision = rule.evaluate(ctx);

      if (!decision.shouldFire) {
        suppressed.push({ ...decision, reason: `Rule not met: ${decision.reason}` });
        continue;
      }

      if (!isCategoryEnabled(decision.category, settings)) {
        suppressed.push({ ...decision, shouldFire: false, reason: `Category disabled: ${decision.category}` });
        continue;
      }

      if (isWeekend() && !settings.weekendReminders) {
        suppressed.push({ ...decision, shouldFire: false, reason: 'Weekend reminders disabled' });
        continue;
      }

      if (ctx.hasReengagedToday && decision.ruleId !== 'calm_followup') {
        const alreadyFiredThisCategory = currentState.todayFiredCategories.includes(decision.category);
        if (alreadyFiredThisCategory) {
          suppressed.push({ ...decision, shouldFire: false, reason: 'Already fired this category today after re-engagement' });
          continue;
        }
      }

      if (currentState.todayFiredCount >= maxDaily) {
        suppressed.push({ ...decision, shouldFire: false, reason: `Daily notification cap reached (${maxDaily})` });
        continue;
      }

      if (currentState.lastFiredTimestamp &&
        (Date.now() - currentState.lastFiredTimestamp) < MIN_GAP_BETWEEN_REMINDERS_MS &&
        decision.priority !== 'critical_support') {
        suppressed.push({ ...decision, shouldFire: false, reason: 'Too soon after last reminder' });
        continue;
      }

      active.push(decision);
    }

    active.sort((a, b) => a.priorityScore - b.priorityScore);

    const finalActive: ReminderDecision[] = [];
    const seenPriorities = new Set<string>();

    for (const d of active) {
      if (seenPriorities.has(d.priority) && d.priority !== 'critical_support') {
        suppressed.push({ ...d, shouldFire: false, reason: `Lower priority duplicate in tier: ${d.priority}` });
        continue;
      }
      seenPriorities.add(d.priority);
      finalActive.push(d);
    }

    console.log(`[ReminderDecisionEngine] Evaluated: ${finalActive.length} active, ${suppressed.length} suppressed`);
    return { active: finalActive, suppressed };
  }
}

export function buildRuleContext(params: {
  lastCheckInTime: number | null;
  lastJournalTime: number | null;
  lastAppOpenTime: number | null;
  lastWeeklyReflectionViewTime: number | null;
  lastRitualCompleteTime: number | null;
  recentDistressLevels: number[];
  highDistressToday: boolean;
  highDistressTimestamp: number | null;
  hasFollowUpAfterDistress: boolean;
  recentRelationshipFlowCount: number;
  recentSpiralDetected: boolean;
  recentMessageGuardUsage: number;
  recentRewriteCount: number;
  ritualCompletionsThisWeek: number;
  averageRitualCompletionsPerWeek: number;
  weeklyReflectionAvailable: boolean;
  weeklyReflectionViewed: boolean;
  daysSinceLastOpen: number;
  featureUsage: FeatureUsageProfile;
  isPremium: boolean;
  currentDistress: number;
  todayReminderCount: number;
  lastReminderTimestamp: number | null;
  hasReengagedToday: boolean;
}): ReminderRuleContext {
  return {
    lastCheckInTime: params.lastCheckInTime,
    lastJournalTime: params.lastJournalTime,
    lastAppOpenTime: params.lastAppOpenTime,
    lastWeeklyReflectionViewTime: params.lastWeeklyReflectionViewTime,
    lastRitualCompleteTime: params.lastRitualCompleteTime,
    recentDistressLevels: params.recentDistressLevels,
    highDistressToday: params.highDistressToday,
    highDistressTimestamp: params.highDistressTimestamp,
    hasFollowUpAfterDistress: params.hasFollowUpAfterDistress,
    recentRelationshipFlowCount: params.recentRelationshipFlowCount,
    recentSpiralDetected: params.recentSpiralDetected,
    recentMessageGuardUsage: params.recentMessageGuardUsage,
    recentRewriteCount: params.recentRewriteCount,
    ritualCompletionsThisWeek: params.ritualCompletionsThisWeek,
    averageRitualCompletionsPerWeek: params.averageRitualCompletionsPerWeek,
    weeklyReflectionAvailable: params.weeklyReflectionAvailable,
    weeklyReflectionViewed: params.weeklyReflectionViewed,
    daysSinceLastOpen: params.daysSinceLastOpen,
    totalCoreFeatureUsageCount: Object.values(params.featureUsage.featureCounts).reduce((a, b) => a + b, 0),
    mostUsedFeature: params.featureUsage.mostUsedFeature,
    mostUsedFeatureCount: params.featureUsage.mostUsedFeatureCount,
    secondMostUsedFeature: params.featureUsage.secondMostUsedFeature,
    isPremium: params.isPremium,
    currentDistress: params.currentDistress,
    todayReminderCount: params.todayReminderCount,
    lastReminderTimestamp: params.lastReminderTimestamp,
    hasReengagedToday: params.hasReengagedToday,
  };
}

export const reminderDecisionEngine = new ReminderDecisionEngine();
