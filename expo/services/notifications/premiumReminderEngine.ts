import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PremiumReminderType,
  PremiumReminderState,
  PremiumReminderDecision,
  PremiumReminderAnalyticsEvent,
  PREMIUM_REMINDER_CONFIG,
  PREMIUM_REMINDER_COPY,
} from '@/types/premiumReminder';
import { premiumIntentService } from '@/services/subscription/premiumIntentService';
import { notificationService } from './notificationService';
import { analyticsEngine } from '@/services/analytics/analyticsEngine';

const STATE_KEY = 'bpd_premium_reminder_state';
const ANALYTICS_KEY = 'bpd_premium_reminder_analytics';
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

interface PremiumReminderContext {
  isPremium: boolean;
  currentDistress: number;
  highDistressToday: boolean;
  highDistressTimestamp: number | null;
  recentCrisisMode: boolean;
  recentSpiralEvent: boolean;
  premiumRemindersEnabled: boolean;
  upgradeRemindersEnabled: boolean;
  quietHours: { enabled: boolean; startTime: string; endTime: string };
  frequency: 'minimal' | 'balanced' | 'supportive';
}

class PremiumReminderEngine {
  private state: PremiumReminderState = {
    lastFiredTime: null,
    lastFiredType: null,
    firedCountThisWeek: 0,
    weekStartTimestamp: 0,
    suppressedCount: 0,
    convertedCount: 0,
  };

  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STATE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
      }
      this.resetWeekIfNeeded();
      await premiumIntentService.initialize();
      console.log('[PremiumReminderEngine] Initialized, fired this week:', this.state.firedCountThisWeek);
    } catch (error) {
      console.error('[PremiumReminderEngine] Init error:', error);
    }
  }

  private resetWeekIfNeeded(): void {
    const now = Date.now();
    if (now - this.state.weekStartTimestamp > WEEK_MS) {
      this.state.firedCountThisWeek = 0;
      this.state.weekStartTimestamp = now;
    }
  }

  private async persistState(): Promise<void> {
    try {
      await AsyncStorage.setItem(STATE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('[PremiumReminderEngine] Persist error:', error);
    }
  }

  checkSafety(ctx: PremiumReminderContext): { safe: boolean; reason: string } {
    if (ctx.isPremium) {
      return { safe: false, reason: 'User is already premium' };
    }

    if (ctx.currentDistress >= 6) {
      return { safe: false, reason: `High distress (${ctx.currentDistress}) — not safe for premium reminder` };
    }

    if (ctx.highDistressToday && ctx.highDistressTimestamp) {
      const hoursSinceDistress = (Date.now() - ctx.highDistressTimestamp) / HOUR_MS;
      if (hoursSinceDistress < 4) {
        return { safe: false, reason: `Too soon after high distress (${Math.round(hoursSinceDistress)}h ago)` };
      }
    }

    if (ctx.recentCrisisMode) {
      return { safe: false, reason: 'Recent crisis mode — not appropriate for premium reminder' };
    }

    if (ctx.recentSpiralEvent) {
      return { safe: false, reason: 'Recent relationship spiral — not appropriate' };
    }

    if (!ctx.premiumRemindersEnabled) {
      return { safe: false, reason: 'Premium reminders disabled by user' };
    }

    if (!ctx.upgradeRemindersEnabled) {
      return { safe: false, reason: 'Upgrade reminders disabled by user' };
    }

    return { safe: true, reason: 'Safety checks passed' };
  }

  checkFrequency(reminderType: PremiumReminderType): { allowed: boolean; reason: string } {
    const config = PREMIUM_REMINDER_CONFIG[reminderType];
    this.resetWeekIfNeeded();

    const totalMaxPerWeek = 2;
    if (this.state.firedCountThisWeek >= totalMaxPerWeek) {
      return { allowed: false, reason: `Weekly notification cap reached (${totalMaxPerWeek})` };
    }

    if (this.state.lastFiredTime) {
      const hoursSinceLast = (Date.now() - this.state.lastFiredTime) / HOUR_MS;
      if (hoursSinceLast < config.cooldownHours) {
        return { allowed: false, reason: `Cooldown active (${Math.round(hoursSinceLast)}h / ${config.cooldownHours}h)` };
      }
    }

    return { allowed: true, reason: 'Frequency checks passed' };
  }

  evaluate(ctx: PremiumReminderContext): PremiumReminderDecision[] {
    const decisions: PremiumReminderDecision[] = [];
    const intentProfile = premiumIntentService.buildIntentProfile();

    if (intentProfile.totalSignalCount === 0) {
      console.log('[PremiumReminderEngine] No intent signals — skipping');
      return decisions;
    }

    const safetyCheck = this.checkSafety(ctx);
    if (!safetyCheck.safe) {
      console.log('[PremiumReminderEngine] Safety block:', safetyCheck.reason);
      return decisions;
    }

    const typesToEvaluate: PremiumReminderType[] = [
      'weekly_reflection_depth',
      'therapist_report_history',
      'unlimited_ai_companion',
      'relationship_intelligence',
      'emotional_pattern_insight',
    ];

    for (const reminderType of typesToEvaluate) {
      const config = PREMIUM_REMINDER_CONFIG[reminderType];
      const intentCount = intentProfile.intentByType[reminderType] || 0;

      if (intentCount < config.minIntentSignals) {
        continue;
      }

      const freqCheck = this.checkFrequency(reminderType);
      if (!freqCheck.allowed) {
        decisions.push({
          reminderType,
          shouldFire: false,
          category: config.notificationCategory,
          reason: freqCheck.reason,
          delaySeconds: 0,
          deepLink: `${config.deepLink}?anchor=${config.upgradeAnchor}`,
          upgradeAnchor: config.upgradeAnchor,
          copy: this.getCopy(reminderType),
          safetyPassed: true,
          intentStrength: intentCount,
        });
        continue;
      }

      const nextDayDelay = intentProfile.lastIntentTime
        ? Math.max(0, (intentProfile.lastIntentTime + DAY_MS - Date.now()) / 1000)
        : 6 * 3600;

      const delaySeconds = Math.max(3600, Math.round(nextDayDelay));

      decisions.push({
        reminderType,
        shouldFire: true,
        category: config.notificationCategory,
        reason: `Intent strength ${intentCount}, last intent: ${intentProfile.lastIntentTime ? new Date(intentProfile.lastIntentTime).toISOString() : 'unknown'}`,
        delaySeconds,
        deepLink: `${config.deepLink}?anchor=${config.upgradeAnchor}`,
        upgradeAnchor: config.upgradeAnchor,
        copy: this.getCopy(reminderType),
        safetyPassed: true,
        intentStrength: intentCount,
      });
    }

    decisions.sort((a, b) => b.intentStrength - a.intentStrength);

    const toFire = decisions.filter(d => d.shouldFire);
    if (toFire.length > 1) {
      for (let i = 1; i < toFire.length; i++) {
        toFire[i].shouldFire = false;
        toFire[i].reason = 'Lower priority — only one premium reminder per evaluation';
      }
    }

    return decisions;
  }

  async fireReminder(
    decision: PremiumReminderDecision,
    ctx: PremiumReminderContext,
  ): Promise<string | null> {
    if (!decision.shouldFire) return null;

    const notifId = await notificationService.scheduleReminder(
      decision.category,
      decision.copy.title,
      decision.copy.body,
      Math.max(1, decision.delaySeconds),
      false,
      {
        target_screen: decision.deepLink,
        premium_reminder_type: decision.reminderType,
        upgrade_anchor: decision.upgradeAnchor,
      },
      ctx.quietHours.enabled ? ctx.quietHours : undefined,
      ctx.currentDistress,
    );

    if (notifId) {
      this.state.lastFiredTime = Date.now();
      this.state.lastFiredType = decision.reminderType;
      this.state.firedCountThisWeek++;
      await this.persistState();

      await this.trackAnalytics({
        eventType: 'scheduled',
        reminderType: decision.reminderType,
        lastIntentEvent: premiumIntentService.getLastIntentEvent(),
        safetyState: ctx.currentDistress >= 6 ? 'elevated' : 'calm',
        daysSinceLastUpgradeView: premiumIntentService.buildIntentProfile().daysSinceLastUpgradeView,
        premiumStatus: ctx.isPremium,
        timestamp: Date.now(),
      });

      await analyticsEngine.trackEvent('premium_reminder_scheduled', {
        reminder_type: decision.reminderType,
        intent_strength: decision.intentStrength,
        delay_seconds: decision.delaySeconds,
        upgrade_anchor: decision.upgradeAnchor,
      });

      console.log('[PremiumReminderEngine] Fired:', decision.reminderType, '→', notifId);
    }

    return notifId;
  }

  async handlePremiumReminderOpened(reminderType: PremiumReminderType): Promise<void> {
    await this.trackAnalytics({
      eventType: 'opened',
      reminderType,
      lastIntentEvent: premiumIntentService.getLastIntentEvent(),
      safetyState: 'normal',
      daysSinceLastUpgradeView: premiumIntentService.buildIntentProfile().daysSinceLastUpgradeView,
      premiumStatus: false,
      timestamp: Date.now(),
    });

    await analyticsEngine.trackEvent('premium_reminder_opened', {
      reminder_type: reminderType,
    });
  }

  async handlePremiumReminderConverted(reminderType: PremiumReminderType): Promise<void> {
    this.state.convertedCount++;
    await this.persistState();

    await this.trackAnalytics({
      eventType: 'converted',
      reminderType,
      lastIntentEvent: premiumIntentService.getLastIntentEvent(),
      safetyState: 'normal',
      daysSinceLastUpgradeView: 0,
      premiumStatus: true,
      timestamp: Date.now(),
    });

    await analyticsEngine.trackEvent('premium_reminder_converted', {
      reminder_type: reminderType,
    });
  }

  async handlePremiumReminderDismissed(reminderType: PremiumReminderType): Promise<void> {
    await this.trackAnalytics({
      eventType: 'dismissed',
      reminderType,
      lastIntentEvent: premiumIntentService.getLastIntentEvent(),
      safetyState: 'normal',
      daysSinceLastUpgradeView: premiumIntentService.buildIntentProfile().daysSinceLastUpgradeView,
      premiumStatus: false,
      timestamp: Date.now(),
    });

    await analyticsEngine.trackEvent('premium_reminder_dismissed', {
      reminder_type: reminderType,
    });
  }

  async handleSafetySuppression(reason: string, reminderType?: PremiumReminderType): Promise<void> {
    this.state.suppressedCount++;
    await this.persistState();

    await this.trackAnalytics({
      eventType: 'suppressed_safety',
      reminderType: reminderType ?? 'weekly_reflection_depth',
      lastIntentEvent: premiumIntentService.getLastIntentEvent(),
      safetyState: reason,
      daysSinceLastUpgradeView: premiumIntentService.buildIntentProfile().daysSinceLastUpgradeView,
      premiumStatus: false,
      timestamp: Date.now(),
    });

    await analyticsEngine.trackEvent('premium_reminder_suppressed_due_to_safety', {
      reason,
      reminder_type: reminderType ?? 'none',
    });
  }

  private getCopy(reminderType: PremiumReminderType): { title: string; body: string } {
    const variants = PREMIUM_REMINDER_COPY[reminderType];
    if (!variants || variants.length === 0) {
      return { title: 'Membership insight', body: 'Deeper support is available when you\'re ready.' };
    }
    return variants[Math.floor(Math.random() * variants.length)];
  }

  private async trackAnalytics(event: PremiumReminderAnalyticsEvent): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
      const events: PremiumReminderAnalyticsEvent[] = stored ? JSON.parse(stored) : [];
      const updated = [event, ...events].slice(0, 200);
      await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[PremiumReminderEngine] Analytics persist error:', error);
    }
  }

  async getAnalytics(limit: number = 50): Promise<PremiumReminderAnalyticsEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
      const events: PremiumReminderAnalyticsEvent[] = stored ? JSON.parse(stored) : [];
      return events.slice(0, limit);
    } catch {
      return [];
    }
  }

  getState(): PremiumReminderState {
    return { ...this.state };
  }

  async resetState(): Promise<void> {
    this.state = {
      lastFiredTime: null,
      lastFiredType: null,
      firedCountThisWeek: 0,
      weekStartTimestamp: Date.now(),
      suppressedCount: 0,
      convertedCount: 0,
    };
    await AsyncStorage.removeItem(STATE_KEY);
    await AsyncStorage.removeItem(ANALYTICS_KEY);
    console.log('[PremiumReminderEngine] State reset');
  }
}

export const premiumReminderEngine = new PremiumReminderEngine();
