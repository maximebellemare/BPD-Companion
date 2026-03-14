import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BehaviorSignal,
  BehaviorNotificationDecision,
  BehaviorNotificationAnalyticsEvent,
  BehaviorSignalType,
} from '@/types/behaviorNotifications';
import { behaviorTrackingService } from './behaviorTrackingService';
import { notificationService } from './notificationService';
import { QuietHours, NotificationCategory } from '@/types/notifications';
import { analyticsEngine } from '@/services/analytics/analyticsEngine';

const ANALYTICS_KEY = 'bpd_behavior_notif_analytics';
const MAX_DAILY_BEHAVIOR_NOTIFS = 2;
const DAILY_COUNT_KEY = 'bpd_behavior_notif_daily_count';

interface DailyCount {
  date: string;
  count: number;
}

const SIGNAL_TO_CATEGORY: Record<BehaviorSignalType, NotificationCategory> = {
  inactivity: 'reengagement',
  distress_pattern: 'calm_followup',
  message_session_intense: 'relationship_support',
  streak_milestone: 'streak_support',
  growth_signal: 'streak_support',
  journal_prompt: 'gentle_nudge',
  regulation_success: 'calm_followup',
  companion_absence: 'gentle_nudge',
  evening_unprocessed: 'gentle_nudge',
};

const SIGNAL_COOLDOWN_HOURS: Record<BehaviorSignalType, number> = {
  inactivity: 48,
  distress_pattern: 24,
  message_session_intense: 12,
  streak_milestone: 48,
  growth_signal: 48,
  journal_prompt: 24,
  regulation_success: 24,
  companion_absence: 72,
  evening_unprocessed: 24,
};

const SIGNAL_COPY: Record<BehaviorSignalType, Array<{ title: string; body: string }>> = {
  inactivity: [
    { title: 'This space is here for you', body: 'No pressure — just a reminder that support is always available.' },
    { title: 'A quiet moment waiting', body: 'Whenever you need it, a calmer space is here.' },
    { title: 'Thinking of you', body: "It's been a few days. Even a brief check-in can feel grounding." },
  ],
  distress_pattern: [
    { title: 'Noticing something', body: "Things have been intense lately. You don't have to carry it alone." },
    { title: 'A pattern worth noticing', body: 'Emotional intensity has been high recently. Support tools are ready.' },
    { title: 'Gently checking in', body: "It's been a heavy stretch. Would a quick check-in help?" },
  ],
  message_session_intense: [
    { title: 'After that message session', body: 'Journaling after communication stress can help you process.' },
    { title: 'A moment to reflect', body: 'That was an intense session. Writing about it might bring clarity.' },
    { title: 'Processing what happened', body: 'A quick journal entry can help you understand what you felt.' },
  ],
  streak_milestone: [
    { title: 'Look at you showing up', body: 'Your consistency is building real self-awareness.' },
    { title: 'A milestone worth noticing', body: "You've been showing up consistently. That matters." },
    { title: 'Your rhythm is growing', body: 'Consistent check-ins build deeper emotional understanding.' },
  ],
  growth_signal: [
    { title: 'Growth worth celebrating', body: "You're making progress — pausing more, reacting less." },
    { title: 'Something positive', body: 'Your patterns are shifting in a healthy direction.' },
    { title: 'Quiet progress', body: "You may not feel it yet, but you're building better patterns." },
  ],
  journal_prompt: [
    { title: 'A thought to explore', body: 'Writing even a few lines can help organize your feelings.' },
    { title: 'End-of-day reflection', body: 'Before the day ends, a moment of writing can bring closure.' },
  ],
  regulation_success: [
    { title: 'That regulation worked', body: 'You used a coping tool and it helped. Worth remembering.' },
    { title: 'A win to notice', body: 'The way you handled that intensity shows real growth.' },
  ],
  companion_absence: [
    { title: 'Your companion is here', body: "It's been a while since you talked. No agenda needed." },
    { title: 'A conversation waiting', body: 'Sometimes just talking through feelings helps more than you expect.' },
  ],
  evening_unprocessed: [
    { title: 'Before the day ends', body: 'A quick emotional check-in can help you sleep better.' },
    { title: 'Evening reflection', body: 'Noticing how you feel right now can bring gentle closure to the day.' },
  ],
};

const SIGNAL_DEEP_LINKS: Record<BehaviorSignalType, string> = {
  inactivity: '/check-in',
  distress_pattern: '/guided-regulation',
  message_session_intense: '/journal-write',
  streak_milestone: '/my-growth',
  growth_signal: '/breakthrough-moments',
  journal_prompt: '/journal-write',
  regulation_success: '/my-growth',
  companion_absence: '/(tabs)/companion',
  evening_unprocessed: '/check-in',
};

export interface BehaviorNotificationPreferences {
  behaviorCheckIns: boolean;
  behaviorDistressSupport: boolean;
  behaviorJournalPrompts: boolean;
  behaviorProgressCelebrations: boolean;
}

const SIGNAL_PREFERENCE_MAP: Record<BehaviorSignalType, keyof BehaviorNotificationPreferences> = {
  inactivity: 'behaviorCheckIns',
  distress_pattern: 'behaviorDistressSupport',
  message_session_intense: 'behaviorJournalPrompts',
  streak_milestone: 'behaviorProgressCelebrations',
  growth_signal: 'behaviorProgressCelebrations',
  journal_prompt: 'behaviorJournalPrompts',
  regulation_success: 'behaviorProgressCelebrations',
  companion_absence: 'behaviorCheckIns',
  evening_unprocessed: 'behaviorCheckIns',
};

class BehaviorNotificationEngine {
  async evaluate(
    currentDistress: number,
    quietHours: QuietHours,
    frequency: 'minimal' | 'balanced' | 'supportive',
    preferences?: BehaviorNotificationPreferences,
  ): Promise<{ fired: BehaviorNotificationDecision[]; suppressed: BehaviorNotificationDecision[] }> {
    const signals = await behaviorTrackingService.detectSignals();
    const fired: BehaviorNotificationDecision[] = [];
    const suppressed: BehaviorNotificationDecision[] = [];

    if (signals.length === 0) {
      console.log('[BehaviorNotifEngine] No signals detected');
      return { fired, suppressed };
    }

    const dailyCount = await this.getDailyCount();
    const maxAllowed = frequency === 'minimal' ? 1 : frequency === 'balanced' ? 2 : 3;
    const effectiveMax = Math.min(MAX_DAILY_BEHAVIOR_NOTIFS, maxAllowed);

    if (dailyCount >= effectiveMax) {
      for (const signal of signals) {
        suppressed.push(this.buildDecision(signal, false, `Daily limit reached (${dailyCount}/${effectiveMax})`));
      }
      return { fired, suppressed };
    }

    if (notificationService.isWithinQuietHours(quietHours)) {
      for (const signal of signals) {
        suppressed.push(this.buildDecision(signal, false, 'Quiet hours active'));
      }
      return { fired, suppressed };
    }

    const sorted = signals.sort((a, b) => b.strength - a.strength);

    for (const signal of sorted) {
      if (preferences) {
        const prefKey = SIGNAL_PREFERENCE_MAP[signal.type];
        if (prefKey && !preferences[prefKey]) {
          suppressed.push(this.buildDecision(signal, false, `Preference disabled: ${prefKey}`));
          continue;
        }
      }

      if (fired.length >= (effectiveMax - dailyCount)) {
        suppressed.push(this.buildDecision(signal, false, 'Already queued enough for today'));
        continue;
      }

      if (currentDistress >= 8 && signal.type !== 'distress_pattern') {
        suppressed.push(this.buildDecision(signal, false, `High distress (${currentDistress}) — only support nudges allowed`));
        continue;
      }

      const cooldown = SIGNAL_COOLDOWN_HOURS[signal.type];
      if (behaviorTrackingService.isCooldownActive(signal.type, cooldown)) {
        suppressed.push(this.buildDecision(signal, false, `Cooldown active (${cooldown}h)`));
        continue;
      }

      if (currentDistress >= 6 && (signal.type === 'streak_milestone' || signal.type === 'growth_signal')) {
        suppressed.push(this.buildDecision(signal, false, 'Celebratory notifications suppressed during moderate distress'));
        continue;
      }

      const decision = this.buildDecision(signal, true, 'Signal conditions met');
      fired.push(decision);
    }

    console.log('[BehaviorNotifEngine] Evaluation:', fired.length, 'fired,', suppressed.length, 'suppressed');
    return { fired, suppressed };
  }

  async fireDecision(
    decision: BehaviorNotificationDecision,
    quietHours: QuietHours,
    currentDistress: number,
  ): Promise<string | null> {
    if (!decision.shouldFire) return null;

    const category = SIGNAL_TO_CATEGORY[decision.signalType];

    const notifId = await notificationService.scheduleReminder(
      category,
      decision.title,
      decision.body,
      Math.max(1, decision.delaySeconds),
      false,
      {
        target_screen: decision.deepLink,
        signal_type: decision.signalType,
        behavior_notification: 'true',
      },
      quietHours,
      currentDistress,
    );

    if (notifId) {
      await behaviorTrackingService.recordNotificationSent(decision.signalType);
      await this.incrementDailyCount();

      if (decision.signalType === 'streak_milestone' || decision.signalType === 'growth_signal') {
        const state = behaviorTrackingService.getState();
        const updatedState = { ...state, lastGrowthCelebration: Date.now() };
        await AsyncStorage.setItem('bpd_behavior_tracking_state', JSON.stringify(updatedState));
      }

      await this.trackAnalytics({
        eventType: 'triggered',
        signalType: decision.signalType,
        priority: decision.priority,
        reason: decision.reason,
        timestamp: Date.now(),
      });

      await analyticsEngine.trackEvent('behavior_notification_sent', {
        signal_type: decision.signalType,
        priority: decision.priority,
        deep_link: decision.deepLink,
      });

      console.log('[BehaviorNotifEngine] Fired:', decision.signalType, '→', notifId);
    }

    return notifId;
  }

  private buildDecision(
    signal: BehaviorSignal,
    shouldFire: boolean,
    reason: string,
  ): BehaviorNotificationDecision {
    const copies = SIGNAL_COPY[signal.type];
    const copy = copies[Math.floor(Math.random() * copies.length)];
    const deepLink = SIGNAL_DEEP_LINKS[signal.type];
    const cooldown = SIGNAL_COOLDOWN_HOURS[signal.type];

    let priority: BehaviorNotificationDecision['priority'] = 'gentle';
    if (signal.type === 'distress_pattern' || signal.type === 'message_session_intense') {
      priority = 'supportive';
    } else if (signal.type === 'streak_milestone' || signal.type === 'growth_signal' || signal.type === 'regulation_success') {
      priority = 'celebratory';
    }

    let delaySeconds = 60;
    if (signal.type === 'message_session_intense') {
      delaySeconds = 60 * 60;
    } else if (signal.type === 'evening_unprocessed') {
      delaySeconds = 5 * 60;
    } else if (signal.type === 'inactivity') {
      delaySeconds = 30 * 60;
    } else if (signal.type === 'distress_pattern') {
      delaySeconds = 2 * 60 * 60;
    }

    return {
      signalType: signal.type,
      shouldFire,
      priority,
      title: copy.title,
      body: copy.body,
      deepLink,
      reason,
      delaySeconds,
      cooldownHours: cooldown,
    };
  }

  private async getDailyCount(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(DAILY_COUNT_KEY);
      if (!stored) return 0;
      const data: DailyCount = JSON.parse(stored);
      const today = new Date().toISOString().split('T')[0];
      return data.date === today ? data.count : 0;
    } catch {
      return 0;
    }
  }

  private async incrementDailyCount(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const current = await this.getDailyCount();
      await AsyncStorage.setItem(DAILY_COUNT_KEY, JSON.stringify({
        date: today,
        count: current + 1,
      }));
    } catch (error) {
      console.error('[BehaviorNotifEngine] Daily count error:', error);
    }
  }

  private async trackAnalytics(event: BehaviorNotificationAnalyticsEvent): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
      const events: BehaviorNotificationAnalyticsEvent[] = stored ? JSON.parse(stored) : [];
      const updated = [event, ...events].slice(0, 200);
      await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[BehaviorNotifEngine] Analytics persist error:', error);
    }
  }

  async getAnalytics(limit: number = 50): Promise<BehaviorNotificationAnalyticsEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
      const events: BehaviorNotificationAnalyticsEvent[] = stored ? JSON.parse(stored) : [];
      return events.slice(0, limit);
    } catch {
      return [];
    }
  }
}

export const behaviorNotificationEngine = new BehaviorNotificationEngine();
