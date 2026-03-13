import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationCategory,
  ScheduledReminder,
  NotificationEvent,
  NotificationDebugEntry,
  QuietHours,
} from '@/types/notifications';
import { getCategoryConfig } from './notificationCategories';

const NOTIFICATION_EVENTS_KEY = 'bpd_notification_events';
const SCHEDULED_REMINDERS_KEY = 'bpd_scheduled_reminders';
const DEBUG_LOG_KEY = 'bpd_notification_debug_log';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private initialized = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    if (Platform.OS === 'web') {
      console.log('[NotificationService] Web platform — notifications limited');
      this.initialized = true;
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService] Permission not granted');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'BPD Companion',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 100, 50, 100],
          lightColor: '#6B9080',
        });

        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 100],
          lightColor: '#6B9080',
        });
      }

      this.initialized = true;
      console.log('[NotificationService] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
      return false;
    }
  }

  async getPermissionStatus(): Promise<string> {
    if (Platform.OS === 'web') return 'web_unsupported';
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch {
      return 'unknown';
    }
  }

  isWithinQuietHours(quietHours: QuietHours): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = quietHours.startTime.split(':').map(Number);
    const [endH, endM] = quietHours.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  shouldBlockForSafety(
    category: NotificationCategory,
    currentDistress: number,
  ): boolean {
    const safetyBlockCategories: NotificationCategory[] = [
      'premium_reflection',
      'reengagement',
      'streak_support',
    ];

    if (safetyBlockCategories.includes(category) && currentDistress >= 7) {
      console.log('[NotificationService] Blocked for safety:', category, 'distress:', currentDistress);
      return true;
    }

    return false;
  }

  async scheduleReminder(
    category: NotificationCategory,
    title: string,
    body: string,
    triggerSeconds: number,
    repeating: boolean = false,
    data?: Record<string, string>,
    quietHours?: QuietHours,
    currentDistress?: number,
  ): Promise<string | null> {
    const config = getCategoryConfig(category);

    if (quietHours && config?.respectsQuietHours && this.isWithinQuietHours(quietHours)) {
      console.log('[NotificationService] Blocked by quiet hours:', category);
      await this.logDebug({
        type: 'blocked_quiet',
        category,
        title,
        body,
        timestamp: Date.now(),
        reason: `Quiet hours active (${quietHours.startTime}–${quietHours.endTime})`,
      });
      return null;
    }

    if (currentDistress !== undefined && this.shouldBlockForSafety(category, currentDistress)) {
      await this.logDebug({
        type: 'blocked_safety',
        category,
        title,
        body,
        timestamp: Date.now(),
        reason: `High distress (${currentDistress}) — category blocked for emotional safety`,
      });
      return null;
    }

    if (Platform.OS === 'web') {
      console.log('[NotificationService] [Web] Would schedule:', { category, title, body });
      await this.logDebug({
        type: 'scheduled',
        category,
        title,
        body,
        timestamp: Date.now(),
        reason: 'Web platform (simulated)',
      });
      return `web_${Date.now()}`;
    }

    try {
      await this.initialize();

      const trigger: Notifications.NotificationTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, triggerSeconds),
        repeats: repeating,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { category, ...data },
          sound: undefined,
        },
        trigger,
      });

      const reminder: ScheduledReminder = {
        id: notificationId,
        category,
        title,
        body,
        scheduledAt: Date.now() + triggerSeconds * 1000,
        repeating,
        data,
      };

      await this.saveScheduledReminder(reminder);
      await this.logDebug({
        type: 'scheduled',
        category,
        title,
        body,
        timestamp: Date.now(),
        reason: `In ${triggerSeconds}s, repeating: ${repeating}`,
      });
      console.log('[NotificationService] Scheduled:', category, '→', notificationId);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Schedule failed:', error);
      return null;
    }
  }

  async scheduleDailyReminder(
    hour: number,
    minute: number,
    title: string,
    body: string,
    category: NotificationCategory,
  ): Promise<string | null> {
    if (Platform.OS === 'web') {
      console.log('[NotificationService] [Web] Would schedule daily:', { hour, minute, title });
      await this.logDebug({
        type: 'scheduled',
        category,
        title,
        body,
        timestamp: Date.now(),
        reason: `Daily at ${hour}:${String(minute).padStart(2, '0')} (web simulated)`,
      });
      return `web_daily_${Date.now()}`;
    }

    try {
      await this.initialize();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { category },
          sound: undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });

      const reminder: ScheduledReminder = {
        id: notificationId,
        category,
        title,
        body,
        scheduledAt: Date.now(),
        repeating: true,
        data: { hour: String(hour), minute: String(minute) },
      };

      await this.saveScheduledReminder(reminder);
      await this.logDebug({
        type: 'scheduled',
        category,
        title,
        body,
        timestamp: Date.now(),
        reason: `Daily at ${hour}:${String(minute).padStart(2, '0')}`,
      });
      console.log('[NotificationService] Scheduled daily:', category, 'at', `${hour}:${minute}`);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Daily schedule failed:', error);
      return null;
    }
  }

  async scheduleWeeklyReminder(
    weekday: number,
    hour: number,
    minute: number,
    title: string,
    body: string,
    category: NotificationCategory,
  ): Promise<string | null> {
    if (Platform.OS === 'web') {
      console.log('[NotificationService] [Web] Would schedule weekly:', { weekday, hour, minute, title });
      await this.logDebug({
        type: 'scheduled',
        category,
        title,
        body,
        timestamp: Date.now(),
        reason: `Weekly day ${weekday} at ${hour}:${String(minute).padStart(2, '0')} (web simulated)`,
      });
      return `web_weekly_${Date.now()}`;
    }

    try {
      await this.initialize();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { category },
          sound: undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        },
      });

      const reminder: ScheduledReminder = {
        id: notificationId,
        category,
        title,
        body,
        scheduledAt: Date.now(),
        repeating: true,
        data: { weekday: String(weekday), hour: String(hour), minute: String(minute) },
      };

      await this.saveScheduledReminder(reminder);
      await this.logDebug({
        type: 'scheduled',
        category,
        title,
        body,
        timestamp: Date.now(),
        reason: `Weekly day ${weekday} at ${hour}:${String(minute).padStart(2, '0')}`,
      });
      console.log('[NotificationService] Scheduled weekly:', category, 'on day', weekday);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Weekly schedule failed:', error);
      return null;
    }
  }

  async cancelReminder(notificationId: string): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('[NotificationService] [Web] Would cancel:', notificationId);
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeScheduledReminder(notificationId);
      console.log('[NotificationService] Cancelled:', notificationId);
    } catch (error) {
      console.error('[NotificationService] Cancel failed:', error);
    }
  }

  async cancelAllByCategory(category: NotificationCategory): Promise<void> {
    const reminders = await this.getScheduledReminders();
    const matching = reminders.filter(r => r.category === category);

    for (const r of matching) {
      await this.cancelReminder(r.id);
    }

    if (matching.length > 0) {
      await this.logDebug({
        type: 'cancelled',
        category,
        title: `Cancelled ${matching.length} reminders`,
        body: '',
        timestamp: Date.now(),
        reason: `Category: ${category}`,
      });
    }

    console.log('[NotificationService] Cancelled all for category:', category, `(${matching.length})`);
  }

  async cancelAll(): Promise<void> {
    if (Platform.OS !== 'web') {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    await AsyncStorage.removeItem(SCHEDULED_REMINDERS_KEY);
    console.log('[NotificationService] Cancelled all notifications');
  }

  async triggerContextualReminder(
    category: NotificationCategory,
    title: string,
    body: string,
    data?: Record<string, string>,
    quietHours?: QuietHours,
    currentDistress?: number,
  ): Promise<string | null> {
    return this.scheduleReminder(category, title, body, 1, false, data, quietHours, currentDistress);
  }

  async recordEvent(event: Omit<NotificationEvent, 'id' | 'sentAt' | 'tapped'>): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_EVENTS_KEY);
      const events: NotificationEvent[] = stored ? JSON.parse(stored) : [];

      const newEvent: NotificationEvent = {
        ...event,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sentAt: Date.now(),
        tapped: false,
      };

      const updated = [newEvent, ...events].slice(0, 200);
      await AsyncStorage.setItem(NOTIFICATION_EVENTS_KEY, JSON.stringify(updated));
      console.log('[NotificationService] Event recorded:', event.category);
    } catch (error) {
      console.error('[NotificationService] Record event failed:', error);
    }
  }

  async getNotificationHistory(limit: number = 50): Promise<NotificationEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_EVENTS_KEY);
      const events: NotificationEvent[] = stored ? JSON.parse(stored) : [];
      return events.slice(0, limit);
    } catch {
      return [];
    }
  }

  async getScheduledReminders(): Promise<ScheduledReminder[]> {
    try {
      const stored = await AsyncStorage.getItem(SCHEDULED_REMINDERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async getDebugLog(limit: number = 100): Promise<NotificationDebugEntry[]> {
    try {
      const stored = await AsyncStorage.getItem(DEBUG_LOG_KEY);
      const entries: NotificationDebugEntry[] = stored ? JSON.parse(stored) : [];
      return entries.slice(0, limit);
    } catch {
      return [];
    }
  }

  async clearDebugLog(): Promise<void> {
    await AsyncStorage.removeItem(DEBUG_LOG_KEY);
  }

  private async logDebug(entry: NotificationDebugEntry): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(DEBUG_LOG_KEY);
      const entries: NotificationDebugEntry[] = stored ? JSON.parse(stored) : [];
      const updated = [entry, ...entries].slice(0, 500);
      await AsyncStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[NotificationService] Debug log failed:', error);
    }
  }

  private async saveScheduledReminder(reminder: ScheduledReminder): Promise<void> {
    try {
      const reminders = await this.getScheduledReminders();
      const updated = [...reminders.filter(r => r.id !== reminder.id), reminder];
      await AsyncStorage.setItem(SCHEDULED_REMINDERS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[NotificationService] Save reminder failed:', error);
    }
  }

  private async removeScheduledReminder(id: string): Promise<void> {
    try {
      const reminders = await this.getScheduledReminders();
      const updated = reminders.filter(r => r.id !== id);
      await AsyncStorage.setItem(SCHEDULED_REMINDERS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[NotificationService] Remove reminder failed:', error);
    }
  }
}

export const notificationService = new NotificationService();
