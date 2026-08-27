import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationCategory } from '@/types/notifications';
import {
  NotificationQuickAction,
  NotificationConversionEvent,
  NotificationEntryState,
  NOTIFICATION_ENTRY_INITIAL,
} from '@/types/notificationRouting';
import { notificationRoutingService } from './notificationRoutingService';
import { trackEvent } from '@/services/analytics/analyticsService';
import { notificationVariantResolver } from './notificationVariantResolver';

const CONVERSION_KEY = 'bpd_notification_conversions';
const ENTRY_STATE_KEY = 'bpd_notification_entry_state';

class NotificationActionHandler {
  private currentSession: NotificationConversionEvent | null = null;

  createSessionId(): string {
    return `ns_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  async handleNotificationTap(
    category: string,
    data?: Record<string, string>,
  ): Promise<{ route: string; entryState: NotificationEntryState }> {
    const cat = category as NotificationCategory;
    const sessionId = this.createSessionId();

    const quickAction = data?.action_id as NotificationQuickAction | undefined;
    let route: string;

    if (quickAction && quickAction !== 'dismiss') {
      route = notificationRoutingService.resolveQuickAction(quickAction);
      console.log('[NotificationActionHandler] Quick action route:', quickAction, '→', route);
    } else {
      route = notificationRoutingService.resolveRoute(cat, data);
      console.log('[NotificationActionHandler] Category route:', cat, '→', route);
    }

    const entryInfo = notificationRoutingService.getEntryState(cat);

    const entryState: NotificationEntryState = {
      active: true,
      category: cat,
      route,
      entryTitle: entryInfo.title,
      entrySubtitle: entryInfo.subtitle,
      timestamp: Date.now(),
      notificationData: data ?? null,
      quickAction: quickAction ?? null,
      sessionId,
    };

    await this.persistEntryState(entryState);

    this.currentSession = {
      sessionId,
      category: cat,
      ruleId: data?.rule_id ?? null,
      targetRoute: route,
      quickAction: quickAction ?? null,
      openedAt: Date.now(),
      flowStartedAt: null,
      flowCompletedAt: null,
      bouncedAt: null,
      distressBefore: null,
      distressAfter: null,
      outcome: 'pending',
    };

    void trackEvent('notification_tap', {
      category,
      target_route: route,
      quick_action: quickAction ?? 'none',
      session_id: sessionId,
      rule_id: data?.rule_id ?? 'unknown',
    });

    if (cat === 'trial_reminder') {
      void trackEvent('trial_reminder_opened', {
        category: cat,
      });
    }

    void notificationVariantResolver.trackOpened(cat);

    console.log('[NotificationActionHandler] Session started:', sessionId);
    return { route, entryState };
  }

  async markFlowStarted(): Promise<void> {
    if (!this.currentSession) return;
    this.currentSession.flowStartedAt = Date.now();

    void trackEvent('notification_flow_started', {
      session_id: this.currentSession.sessionId,
      category: this.currentSession.category,
      target_route: this.currentSession.targetRoute,
    });

    void notificationVariantResolver.trackFlowStarted(this.currentSession.category);

    console.log('[NotificationActionHandler] Flow started:', this.currentSession.sessionId);
  }

  async markFlowCompleted(distressAfter?: number): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.flowCompletedAt = Date.now();
    this.currentSession.outcome = 'completed';
    if (distressAfter !== undefined) {
      this.currentSession.distressAfter = distressAfter;
    }

    void trackEvent('notification_flow_completed', {
      session_id: this.currentSession.sessionId,
      category: this.currentSession.category,
      target_route: this.currentSession.targetRoute,
      duration_seconds: Math.round(
        (Date.now() - this.currentSession.openedAt) / 1000,
      ),
      distress_improvement: this.currentSession.distressBefore !== null && distressAfter !== undefined
        ? String(this.currentSession.distressBefore - distressAfter)
        : 'unknown',
    });

    void notificationVariantResolver.trackFlowCompleted(this.currentSession.category);

    await this.persistConversion(this.currentSession);
    console.log('[NotificationActionHandler] Flow completed:', this.currentSession.sessionId);
    this.currentSession = null;
  }

  async markBounced(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.bouncedAt = Date.now();
    this.currentSession.outcome = 'bounced';

    const dwellTime = Date.now() - this.currentSession.openedAt;

    void trackEvent('notification_bounced', {
      session_id: this.currentSession.sessionId,
      category: this.currentSession.category,
      target_route: this.currentSession.targetRoute,
      dwell_time_ms: dwellTime,
    });

    void notificationVariantResolver.trackBounced(this.currentSession.category);

    await this.persistConversion(this.currentSession);
    console.log('[NotificationActionHandler] Bounced:', this.currentSession.sessionId, 'dwell:', dwellTime, 'ms');
    this.currentSession = null;
  }

  setDistressBefore(distress: number): void {
    if (this.currentSession) {
      this.currentSession.distressBefore = distress;
    }
  }

  getCurrentSession(): NotificationConversionEvent | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  hasActiveSession(): boolean {
    return this.currentSession !== null;
  }

  async clearEntryState(): Promise<void> {
    await AsyncStorage.removeItem(ENTRY_STATE_KEY);
  }

  async getPersistedEntryState(): Promise<NotificationEntryState> {
    try {
      const stored = await AsyncStorage.getItem(ENTRY_STATE_KEY);
      if (!stored) return { ...NOTIFICATION_ENTRY_INITIAL };

      const state = JSON.parse(stored) as NotificationEntryState;
      const age = Date.now() - (state.timestamp ?? 0);
      if (age > 5 * 60 * 1000) {
        await this.clearEntryState();
        return { ...NOTIFICATION_ENTRY_INITIAL };
      }

      return state;
    } catch {
      return { ...NOTIFICATION_ENTRY_INITIAL };
    }
  }

  private async persistEntryState(state: NotificationEntryState): Promise<void> {
    try {
      await AsyncStorage.setItem(ENTRY_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[NotificationActionHandler] Persist entry state failed:', error);
    }
  }

  private async persistConversion(event: NotificationConversionEvent): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(CONVERSION_KEY);
      const events: NotificationConversionEvent[] = stored ? JSON.parse(stored) : [];
      const updated = [event, ...events].slice(0, 200);
      await AsyncStorage.setItem(CONVERSION_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[NotificationActionHandler] Persist conversion failed:', error);
    }
  }

  async getConversionHistory(limit: number = 50): Promise<NotificationConversionEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(CONVERSION_KEY);
      const events: NotificationConversionEvent[] = stored ? JSON.parse(stored) : [];
      return events.slice(0, limit);
    } catch {
      return [];
    }
  }

  async getConversionStats(): Promise<{
    totalOpened: number;
    totalCompleted: number;
    totalBounced: number;
    completionRate: number;
    avgDwellTimeMs: number;
    byCategory: Record<string, { opened: number; completed: number; bounced: number }>;
  }> {
    const events = await this.getConversionHistory(200);

    let totalCompleted = 0;
    let totalBounced = 0;
    let totalDwell = 0;
    let dwellCount = 0;
    const byCategory: Record<string, { opened: number; completed: number; bounced: number }> = {};

    for (const event of events) {
      const cat = event.category;
      if (!byCategory[cat]) {
        byCategory[cat] = { opened: 0, completed: 0, bounced: 0 };
      }
      byCategory[cat].opened++;

      if (event.outcome === 'completed') {
        totalCompleted++;
        byCategory[cat].completed++;
      } else if (event.outcome === 'bounced') {
        totalBounced++;
        byCategory[cat].bounced++;
      }

      const endTime = event.flowCompletedAt ?? event.bouncedAt;
      if (endTime) {
        totalDwell += endTime - event.openedAt;
        dwellCount++;
      }
    }

    return {
      totalOpened: events.length,
      totalCompleted,
      totalBounced,
      completionRate: events.length > 0 ? totalCompleted / events.length : 0,
      avgDwellTimeMs: dwellCount > 0 ? totalDwell / dwellCount : 0,
      byCategory,
    };
  }
}

export const notificationActionHandler = new NotificationActionHandler();
