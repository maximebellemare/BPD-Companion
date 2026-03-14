import { AnalyticsEvent, AnalyticsMetricSnapshot, AnalyticsAggregation } from '@/types/analytics';
import { localEventStore } from './localEventStore';

const CORE_EVENTS = [
  'journal_entry_created',
  'journal_entry_saved',
  'journal_entry_analyzed',
  'message_draft_analyzed',
  'message_draft_risk_detected',
  'message_sent',
  'message_regret_logged',
  'message_do_not_send_shown',
  'message_saved_to_vault',
  'secure_rewrite_generated',
  'secure_rewrite_selected',
  'secure_rewrite_sent',
  'secure_rewrite_saved',
  'secure_rewrite_helpful',
  'secure_rewrite_teaching_viewed',
  'secure_rewrite_comparison_viewed',
  'message_simulation_started',
  'message_simulation_path_selected',
  'message_simulation_outcome_logged',
  'companion_chat_started',
  'companion_request_sent',
  'ai_companion_opened',
  'ai_conversation_started',
  'companion_chat_completed',
  'companion_insight_shown',
  'insight_generated',
  'insight_viewed',
  'insight_acted_on',
  'tool_used',
  'tool_completed',
  'crisis_mode_triggered',
  'crisis_mode_activated',
  'crisis_mode_completed',
  'crisis_regulation_started',
  'crisis_regulation_completed',
  'check_in_completed',
  'exercise_started',
  'exercise_completed',
  'grounding_started',
  'grounding_completed',
  'subscription_started',
  'subscription_cancelled',
  'upgrade_screen_viewed',
  'upgrade_clicked',
  'premium_gate_shown',
  'premium_gate_accepted',
  'notification_scheduled',
  'notification_opened',
  'daily_ritual_completed',
  'medication_logged',
  'appointment_created',
  'movement_logged',
  'message_pause_used',
  'message_guard_opened',
  'weekly_reflection_viewed',
  'therapy_report_viewed',
  'onboarding_completed',
] as const;

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekKey(timestamp: number): string {
  const d = new Date(timestamp);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return getDateKey(start.getTime());
}

function getMonthKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

class AnalyticsDashboardService {
  async getDailySnapshot(date?: string): Promise<AnalyticsMetricSnapshot> {
    const targetDate = date ?? getDateKey(Date.now());
    const dayStart = new Date(targetDate).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const events = await localEventStore.getEvents();
    const dayEvents = events.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd);

    return this.buildSnapshot('daily', targetDate, dayEvents);
  }

  async getWeeklySnapshot(weekStart?: string): Promise<AnalyticsMetricSnapshot> {
    const targetWeek = weekStart ?? getWeekKey(Date.now());
    const start = new Date(targetWeek).getTime();
    const end = start + 7 * 24 * 60 * 60 * 1000;

    const events = await localEventStore.getEvents();
    const weekEvents = events.filter(e => e.timestamp >= start && e.timestamp < end);

    return this.buildSnapshot('weekly', targetWeek, weekEvents);
  }

  async getMonthlySnapshot(month?: string): Promise<AnalyticsMetricSnapshot> {
    const targetMonth = month ?? getMonthKey(Date.now());
    const [year, mon] = targetMonth.split('-').map(Number);
    const start = new Date(year, mon - 1, 1).getTime();
    const end = new Date(year, mon, 1).getTime();

    const events = await localEventStore.getEvents();
    const monthEvents = events.filter(e => e.timestamp >= start && e.timestamp < end);

    return this.buildSnapshot('monthly', targetMonth, monthEvents);
  }

  private buildSnapshot(
    period: 'daily' | 'weekly' | 'monthly',
    date: string,
    events: AnalyticsEvent[],
  ): AnalyticsMetricSnapshot {
    const countEvents = (names: string[]): number =>
      events.filter(e => names.includes(e.name)).length;

    const distressValues = events
      .filter(e => e.properties?.distress_level !== undefined)
      .map(e => Number(e.properties!.distress_level));

    const avgDistress = distressValues.length > 0
      ? Math.round((distressValues.reduce((a, b) => a + b, 0) / distressValues.length) * 10) / 10
      : null;

    return {
      period,
      date,
      journalEntries: countEvents(['journal_entry_created', 'journal_entry_saved']),
      checkIns: countEvents(['check_in_completed']),
      messageDraftsAnalyzed: countEvents(['message_draft_analyzed']),
      secureRewritesUsed: countEvents(['secure_rewrite_selected', 'secure_rewrite_sent']),
      companionChats: countEvents(['companion_chat_started', 'ai_conversation_started', 'ai_companion_opened']),
      toolsUsed: countEvents(['tool_used', 'exercise_started', 'grounding_started', 'dbt_skill_used']),
      crisisActivations: countEvents(['crisis_mode_triggered', 'crisis_mode_activated']),
      insightsGenerated: countEvents(['insight_generated']),
      avgDistressLevel: avgDistress,
      pauseBeforeSendCount: countEvents(['message_pause_used']),
      regretCount: countEvents(['message_regret_logged']),
    };
  }

  async getEventAggregations(since?: number): Promise<AnalyticsAggregation[]> {
    const cutoff = since ?? Date.now() - 30 * 24 * 60 * 60 * 1000;
    const events = await localEventStore.getEvents();
    const filtered = events.filter(e => e.timestamp >= cutoff);

    const aggregations = new Map<string, AnalyticsAggregation>();

    for (const event of filtered) {
      const existing = aggregations.get(event.name);
      if (existing) {
        existing.count++;
        if (event.timestamp < existing.firstSeen) existing.firstSeen = event.timestamp;
        if (event.timestamp > existing.lastSeen) existing.lastSeen = event.timestamp;
      } else {
        aggregations.set(event.name, {
          eventName: event.name,
          count: 1,
          firstSeen: event.timestamp,
          lastSeen: event.timestamp,
        });
      }
    }

    return Array.from(aggregations.values()).sort((a, b) => b.count - a.count);
  }

  async getCoreEventCounts(dayCount: number = 7): Promise<Record<string, number>> {
    const cutoff = Date.now() - dayCount * 24 * 60 * 60 * 1000;
    const events = await localEventStore.getEvents();
    const filtered = events.filter(e => e.timestamp >= cutoff);

    const counts: Record<string, number> = {};
    for (const name of CORE_EVENTS) {
      counts[name] = filtered.filter(e => e.name === name).length;
    }
    return counts;
  }

  async getEventTimeline(
    eventName: string,
    dayCount: number = 30,
  ): Promise<Array<{ date: string; count: number }>> {
    const cutoff = Date.now() - dayCount * 24 * 60 * 60 * 1000;
    const events = await localEventStore.getEventsByName(eventName);
    const filtered = events.filter(e => e.timestamp >= cutoff);

    const buckets = new Map<string, number>();
    for (const event of filtered) {
      const key = getDateKey(event.timestamp);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const result: Array<{ date: string; count: number }> = [];
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = getDateKey(d.getTime());
      result.push({ date: key, count: buckets.get(key) ?? 0 });
    }
    return result;
  }

  async getTopScreens(limit: number = 10): Promise<Array<{ screen: string; views: number }>> {
    const events = await localEventStore.getEventsByName('screen_view');
    const screenCounts = new Map<string, number>();

    for (const event of events) {
      const screen = event.properties?.screen;
      if (typeof screen === 'string') {
        screenCounts.set(screen, (screenCounts.get(screen) ?? 0) + 1);
      }
    }

    return Array.from(screenCounts.entries())
      .map(([screen, views]) => ({ screen, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  async getFeatureAdoption(): Promise<Record<string, { used: boolean; count: number; lastUsed: number | null }>> {
    const features: Record<string, string[]> = {
      journal: ['journal_entry_created', 'journal_entry_saved'],
      messages: ['message_draft_analyzed', 'message_guard_opened'],
      secure_rewrite: ['secure_rewrite_generated', 'secure_rewrite_selected'],
      simulation: ['message_simulation_started', 'message_simulation_path_selected'],
      companion: ['companion_chat_started', 'ai_conversation_started'],
      crisis: ['crisis_mode_triggered', 'crisis_mode_activated'],
      tools: ['tool_used', 'exercise_started'],
      grounding: ['grounding_started', 'grounding_completed'],
      check_in: ['check_in_completed'],
      insights: ['insight_generated', 'insight_viewed'],
      weekly_reflection: ['weekly_reflection_viewed'],
      therapy_report: ['therapy_report_viewed'],
      daily_ritual: ['daily_ritual_completed'],
      medication: ['medication_logged'],
    };

    const events = await localEventStore.getEvents();
    const result: Record<string, { used: boolean; count: number; lastUsed: number | null }> = {};

    for (const [feature, eventNames] of Object.entries(features)) {
      const matching = events.filter(e => eventNames.includes(e.name));
      const latest = matching.length > 0
        ? Math.max(...matching.map(e => e.timestamp))
        : null;

      result[feature] = {
        used: matching.length > 0,
        count: matching.length,
        lastUsed: latest,
      };
    }

    return result;
  }

  async getRetentionSignals(): Promise<{
    totalSessions: number;
    avgEventsPerSession: number;
    mostActiveHour: number | null;
    featureDepth: number;
    engagementScore: number;
  }> {
    const events = await localEventStore.getEvents();
    if (events.length === 0) {
      return {
        totalSessions: 0,
        avgEventsPerSession: 0,
        mostActiveHour: null,
        featureDepth: 0,
        engagementScore: 0,
      };
    }

    const sessions = new Set(events.map(e => e.sessionId).filter(Boolean));
    const totalSessions = sessions.size || 1;
    const avgEventsPerSession = Math.round(events.length / totalSessions);

    const hourCounts = new Array<number>(24).fill(0);
    for (const event of events) {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour]++;
    }
    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));

    const adoption = await this.getFeatureAdoption();
    const adoptedFeatures = Object.values(adoption).filter(f => f.used).length;
    const totalFeatures = Object.keys(adoption).length;
    const featureDepth = totalFeatures > 0 ? Math.round((adoptedFeatures / totalFeatures) * 100) : 0;

    const coreActions = events.filter(e =>
      ['journal_entry_created', 'message_draft_analyzed', 'companion_chat_started',
       'check_in_completed', 'tool_used', 'exercise_started'].includes(e.name)
    ).length;
    const engagementScore = Math.min(100, Math.round((coreActions / Math.max(totalSessions, 1)) * 10));

    return {
      totalSessions,
      avgEventsPerSession,
      mostActiveHour,
      featureDepth,
      engagementScore,
    };
  }
}

export const analyticsDashboardService = new AnalyticsDashboardService();
