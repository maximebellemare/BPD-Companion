import AsyncStorage from '@react-native-async-storage/async-storage';
import { localEventStore } from '@/services/analytics/localEventStore';
import {
  BehaviorTrackingState,
  BehaviorSignal,
  DEFAULT_BEHAVIOR_TRACKING_STATE,
} from '@/types/behaviorNotifications';

const STATE_KEY = 'bpd_behavior_tracking_state';
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

class BehaviorTrackingService {
  private state: BehaviorTrackingState = { ...DEFAULT_BEHAVIOR_TRACKING_STATE };
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      const stored = await AsyncStorage.getItem(STATE_KEY);
      if (stored) {
        this.state = { ...DEFAULT_BEHAVIOR_TRACKING_STATE, ...JSON.parse(stored) };
      }
      this.initialized = true;
      console.log('[BehaviorTracking] Initialized, streak:', this.state.currentStreakDays);
    } catch (error) {
      console.error('[BehaviorTracking] Init error:', error);
      this.initialized = true;
    }
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(STATE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('[BehaviorTracking] Persist error:', error);
    }
  }

  async recordAppOpen(): Promise<void> {
    this.state.lastAppOpenTimestamp = Date.now();
    await this.persist();
  }

  async recordCheckIn(distressLevel: number): Promise<void> {
    const now = Date.now();
    this.state.lastCheckInTimestamp = now;
    this.state.totalCheckIns++;

    this.state.recentDistressLevels = [
      distressLevel,
      ...this.state.recentDistressLevels,
    ].slice(0, 14);

    if (distressLevel >= 7) {
      this.state.consecutiveHighDistressDays++;
    } else {
      this.state.consecutiveHighDistressDays = 0;
    }

    await this.updateStreak();
    await this.persist();
    console.log('[BehaviorTracking] Check-in recorded, distress:', distressLevel);
  }

  async recordJournalEntry(): Promise<void> {
    this.state.lastJournalTimestamp = Date.now();
    await this.persist();
  }

  async recordCompanionSession(): Promise<void> {
    this.state.lastCompanionTimestamp = Date.now();
    await this.persist();
  }

  async recordMessageSession(wasIntense: boolean): Promise<void> {
    this.state.lastMessageSessionTimestamp = Date.now();
    if (wasIntense) {
      this.state.recentMessageSessionCount++;
    }
    await this.persist();
  }

  async recordGrowthSignal(signal: string): Promise<void> {
    if (!this.state.growthSignalsDetected.includes(signal)) {
      this.state.growthSignalsDetected = [
        signal,
        ...this.state.growthSignalsDetected,
      ].slice(0, 20);
      await this.persist();
    }
  }

  async recordNotificationSent(signalType: string): Promise<void> {
    this.state.lastNotificationByType[signalType] = Date.now();
    await this.persist();
  }

  private async updateStreak(): Promise<void> {
    const events = await localEventStore.getEventsByName('check_in_completed', 30);
    if (events.length === 0) {
      this.state.currentStreakDays = 0;
      return;
    }

    const uniqueDays = new Set<string>();
    for (const event of events) {
      const date = new Date(event.timestamp);
      uniqueDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    }

    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * DAY_MS);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (uniqueDays.has(key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    this.state.currentStreakDays = streak;
    if (streak > this.state.longestStreakDays) {
      this.state.longestStreakDays = streak;
    }
  }

  async detectSignals(): Promise<BehaviorSignal[]> {
    const signals: BehaviorSignal[] = [];
    const now = Date.now();

    const inactivitySignal = this.detectInactivity(now);
    if (inactivitySignal) signals.push(inactivitySignal);

    const distressSignal = this.detectDistressPattern(now);
    if (distressSignal) signals.push(distressSignal);

    const messageSignal = this.detectIntenseMessageSession(now);
    if (messageSignal) signals.push(messageSignal);

    const streakSignal = this.detectStreakMilestone(now);
    if (streakSignal) signals.push(streakSignal);

    const growthSignal = await this.detectGrowthSignals(now);
    if (growthSignal) signals.push(growthSignal);

    const companionSignal = this.detectCompanionAbsence(now);
    if (companionSignal) signals.push(companionSignal);

    const eveningSignal = this.detectEveningUnprocessed(now);
    if (eveningSignal) signals.push(eveningSignal);

    console.log('[BehaviorTracking] Detected', signals.length, 'signals');
    return signals;
  }

  private detectInactivity(now: number): BehaviorSignal | null {
    const lastOpen = this.state.lastAppOpenTimestamp;
    if (!lastOpen) return null;

    const daysSinceOpen = (now - lastOpen) / DAY_MS;

    if (daysSinceOpen >= 2 && this.state.totalCheckIns >= 3) {
      return {
        type: 'inactivity',
        strength: Math.min(1, daysSinceOpen / 7),
        detectedAt: now,
        context: {
          daysSinceOpen: Math.round(daysSinceOpen),
          totalCheckIns: this.state.totalCheckIns,
          hadStreak: this.state.currentStreakDays > 0,
        },
      };
    }

    return null;
  }

  private detectDistressPattern(now: number): BehaviorSignal | null {
    const recent = this.state.recentDistressLevels.slice(0, 5);
    if (recent.length < 2) return null;

    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const highCount = recent.filter(d => d >= 6).length;

    if (highCount >= 2 || avg >= 6) {
      return {
        type: 'distress_pattern',
        strength: Math.min(1, avg / 10),
        detectedAt: now,
        context: {
          averageDistress: Math.round(avg * 10) / 10,
          highDistressDays: highCount,
          consecutiveHighDays: this.state.consecutiveHighDistressDays,
        },
      };
    }

    return null;
  }

  private detectIntenseMessageSession(now: number): BehaviorSignal | null {
    const lastSession = this.state.lastMessageSessionTimestamp;
    if (!lastSession) return null;

    const hoursSince = (now - lastSession) / HOUR_MS;

    if (hoursSince >= 1 && hoursSince <= 4 && this.state.recentMessageSessionCount > 0) {
      return {
        type: 'message_session_intense',
        strength: 0.7,
        detectedAt: now,
        context: {
          hoursSinceSession: Math.round(hoursSince),
          recentSessionCount: this.state.recentMessageSessionCount,
        },
      };
    }

    return null;
  }

  private detectStreakMilestone(_now: number): BehaviorSignal | null {
    const streak = this.state.currentStreakDays;
    const milestones = [3, 7, 14, 21, 30, 60, 90, 180, 365];

    for (const m of milestones) {
      if (streak === m) {
        const lastCelebration = this.state.lastGrowthCelebration;
        if (lastCelebration && (Date.now() - lastCelebration) < DAY_MS) {
          return null;
        }

        return {
          type: 'streak_milestone',
          strength: Math.min(1, streak / 30),
          detectedAt: Date.now(),
          context: {
            streakDays: streak,
            milestone: m,
            longestStreak: this.state.longestStreakDays,
          },
        };
      }
    }

    return null;
  }

  private async detectGrowthSignals(now: number): Promise<BehaviorSignal | null> {
    const events = await localEventStore.getEvents(100);
    const weekAgo = now - 7 * DAY_MS;
    const recentEvents = events.filter(e => e.timestamp > weekAgo);

    const pauseCount = recentEvents.filter(e => e.name === 'message_pause_used').length;
    const secureRewriteCount = recentEvents.filter(e => e.name === 'secure_rewrite_selected').length;
    const regulationCount = recentEvents.filter(e => e.name === 'regulation_effectiveness').length;

    const signals: string[] = [];

    if (pauseCount >= 3) signals.push('frequent_pausing');
    if (secureRewriteCount >= 2) signals.push('secure_communication');
    if (regulationCount >= 3) signals.push('consistent_regulation');

    const recentDistress = this.state.recentDistressLevels.slice(0, 7);
    const olderDistress = this.state.recentDistressLevels.slice(7, 14);

    if (recentDistress.length >= 3 && olderDistress.length >= 3) {
      const recentAvg = recentDistress.reduce((a, b) => a + b, 0) / recentDistress.length;
      const olderAvg = olderDistress.reduce((a, b) => a + b, 0) / olderDistress.length;
      if (olderAvg - recentAvg >= 1.5) {
        signals.push('distress_decreasing');
      }
    }

    if (signals.length === 0) return null;

    for (const s of signals) {
      await this.recordGrowthSignal(s);
    }

    const lastCelebration = this.state.lastGrowthCelebration;
    if (lastCelebration && (now - lastCelebration) < 2 * DAY_MS) {
      return null;
    }

    return {
      type: 'growth_signal',
      strength: Math.min(1, signals.length / 3),
      detectedAt: now,
      context: {
        signalCount: signals.length,
        signals: signals.join(','),
      },
    };
  }

  private detectCompanionAbsence(now: number): BehaviorSignal | null {
    const lastCompanion = this.state.lastCompanionTimestamp;
    if (!lastCompanion) return null;

    const daysSince = (now - lastCompanion) / DAY_MS;

    if (daysSince >= 5 && this.state.totalCheckIns >= 5) {
      return {
        type: 'companion_absence',
        strength: Math.min(1, daysSince / 14),
        detectedAt: now,
        context: {
          daysSinceCompanion: Math.round(daysSince),
        },
      };
    }

    return null;
  }

  private detectEveningUnprocessed(now: number): BehaviorSignal | null {
    const hour = new Date(now).getHours();
    if (hour < 19 || hour > 22) return null;

    const lastCheckIn = this.state.lastCheckInTimestamp;
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const checkedInToday = lastCheckIn !== null && lastCheckIn >= todayStart.getTime();
    if (checkedInToday) return null;

    if (this.state.totalCheckIns < 3) return null;

    return {
      type: 'evening_unprocessed',
      strength: 0.5,
      detectedAt: now,
      context: {
        hour,
        daysSinceLastCheckIn: lastCheckIn
          ? Math.round((now - lastCheckIn) / DAY_MS)
          : 0,
      },
    };
  }

  isCooldownActive(signalType: string, cooldownHours: number): boolean {
    const lastFired = this.state.lastNotificationByType[signalType];
    if (!lastFired) return false;
    return (Date.now() - lastFired) < cooldownHours * HOUR_MS;
  }

  getState(): BehaviorTrackingState {
    return { ...this.state };
  }

  async resetState(): Promise<void> {
    this.state = { ...DEFAULT_BEHAVIOR_TRACKING_STATE };
    await AsyncStorage.removeItem(STATE_KEY);
    console.log('[BehaviorTracking] State reset');
  }
}

export const behaviorTrackingService = new BehaviorTrackingService();
