import { notificationService } from './notificationService';
import { getRandomTemplate } from './notificationTemplates';
import { QuietHours, ReminderFrequency, NotificationCategory } from '@/types/notifications';
import { JournalEntry } from '@/types';

export interface FullNotificationSettings {
  dailyCheckInReminder: boolean;
  checkInReminderTime: string;
  weeklyReflectionReminder: boolean;
  weeklyReflectionDay: number;
  weeklyReflectionTime: string;
  relationshipSupportReminders: boolean;
  regulationFollowUps: boolean;
  gentleNudges: boolean;
  ritualReminders: boolean;
  morningRitualTime: string;
  eveningRitualTime: string;
  calmFollowups: boolean;
  premiumReflections: boolean;
  therapistReportReminder: boolean;
  reengagementReminders: boolean;
  streakSupport: boolean;
  quietHours: QuietHours;
  weekendReminders: boolean;
  frequency: ReminderFrequency;
}

export const DEFAULT_FULL_SETTINGS: FullNotificationSettings = {
  dailyCheckInReminder: true,
  checkInReminderTime: '09:00',
  weeklyReflectionReminder: true,
  weeklyReflectionDay: 1,
  weeklyReflectionTime: '10:00',
  relationshipSupportReminders: true,
  regulationFollowUps: true,
  gentleNudges: true,
  ritualReminders: true,
  morningRitualTime: '08:00',
  eveningRitualTime: '20:00',
  calmFollowups: true,
  premiumReflections: true,
  therapistReportReminder: true,
  reengagementReminders: true,
  streakSupport: true,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
  },
  weekendReminders: true,
  frequency: 'balanced',
};

class NotificationScheduler {
  async syncReminders(settings: FullNotificationSettings): Promise<void> {
    console.log('[NotificationScheduler] Syncing reminders with settings');

    await this.syncDailyCheckIn(settings);
    await this.syncWeeklyReflection(settings);
    await this.syncRitualReminders(settings);
    await this.syncStreakSupport(settings);
    await this.syncTherapistReport(settings);

    console.log('[NotificationScheduler] Sync complete');
  }

  private async syncDailyCheckIn(settings: FullNotificationSettings): Promise<void> {
    await notificationService.cancelAllByCategory('daily_checkin');

    if (!settings.dailyCheckInReminder) {
      console.log('[NotificationScheduler] Daily check-in reminder disabled');
      return;
    }

    const [hourStr, minuteStr] = settings.checkInReminderTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const template = getRandomTemplate('daily_checkin');

    await notificationService.scheduleDailyReminder(
      hour,
      minute,
      template.title,
      template.body,
      'daily_checkin',
    );

    await notificationService.recordEvent({
      category: 'daily_checkin',
      title: template.title,
      body: template.body,
    });
  }

  private async syncWeeklyReflection(settings: FullNotificationSettings): Promise<void> {
    await notificationService.cancelAllByCategory('weekly_reflection');

    if (!settings.weeklyReflectionReminder) {
      console.log('[NotificationScheduler] Weekly reflection reminder disabled');
      return;
    }

    const [hourStr, minuteStr] = settings.weeklyReflectionTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const template = getRandomTemplate('weekly_reflection');

    await notificationService.scheduleWeeklyReminder(
      settings.weeklyReflectionDay,
      hour,
      minute,
      template.title,
      template.body,
      'weekly_reflection',
    );

    await notificationService.recordEvent({
      category: 'weekly_reflection',
      title: template.title,
      body: template.body,
    });
  }

  private async syncRitualReminders(settings: FullNotificationSettings): Promise<void> {
    await notificationService.cancelAllByCategory('ritual_reminder');

    if (!settings.ritualReminders) {
      console.log('[NotificationScheduler] Ritual reminders disabled');
      return;
    }

    const [morH, morM] = settings.morningRitualTime.split(':').map(Number);
    await notificationService.scheduleDailyReminder(
      morH,
      morM,
      'Morning ritual',
      'Start your day by noticing how you feel.',
      'ritual_reminder',
    );

    const [eveH, eveM] = settings.eveningRitualTime.split(':').map(Number);
    await notificationService.scheduleDailyReminder(
      eveH,
      eveM,
      'Evening reflection',
      'What stood out emotionally today?',
      'ritual_reminder',
    );
  }

  private async syncStreakSupport(settings: FullNotificationSettings): Promise<void> {
    await notificationService.cancelAllByCategory('streak_support');

    if (!settings.streakSupport) return;
    if (settings.frequency === 'minimal') return;

    const template = getRandomTemplate('streak_support');
    await notificationService.scheduleDailyReminder(
      20,
      0,
      template.title,
      template.body,
      'streak_support',
    );
  }

  private async syncTherapistReport(settings: FullNotificationSettings): Promise<void> {
    await notificationService.cancelAllByCategory('therapist_report');

    if (!settings.therapistReportReminder) return;

    const template = getRandomTemplate('therapist_report');
    await notificationService.scheduleWeeklyReminder(
      5,
      10,
      0,
      template.title,
      template.body,
      'therapist_report',
    );
  }

  async scheduleRegulationFollowUp(
    distressLevel: number,
    enabled: boolean,
    quietHours?: QuietHours,
  ): Promise<void> {
    if (!enabled) return;
    if (distressLevel < 6) return;

    const delayHours = distressLevel >= 8 ? 2 : 3;
    const delaySec = delayHours * 60 * 60;

    const template = getRandomTemplate('regulation_followup');

    await notificationService.scheduleReminder(
      'regulation_followup',
      template.title,
      template.body,
      delaySec,
      false,
      { originalDistress: String(distressLevel) },
      quietHours,
    );

    await notificationService.recordEvent({
      category: 'regulation_followup',
      title: template.title,
      body: template.body,
    });

    console.log('[NotificationScheduler] Regulation follow-up scheduled in', delayHours, 'hours');
  }

  async scheduleCalmFollowUp(
    enabled: boolean,
    quietHours?: QuietHours,
  ): Promise<void> {
    if (!enabled) return;

    const delaySec = 4 * 60 * 60;
    const template = getRandomTemplate('calm_followup');

    await notificationService.scheduleReminder(
      'calm_followup',
      template.title,
      template.body,
      delaySec,
      false,
      undefined,
      quietHours,
    );

    await notificationService.recordEvent({
      category: 'calm_followup',
      title: template.title,
      body: template.body,
    });

    console.log('[NotificationScheduler] Calm follow-up scheduled in 4 hours');
  }

  async scheduleRelationshipSupport(
    enabled: boolean,
    recentRelTrigger: boolean,
    recentRewriteCount: number,
    quietHours?: QuietHours,
  ): Promise<void> {
    if (!enabled) return;

    const shouldNudge = recentRelTrigger || recentRewriteCount >= 2;
    if (!shouldNudge) return;

    const template = getRandomTemplate('relationship_support');
    const delaySec = 30 * 60;

    await notificationService.scheduleReminder(
      'relationship_support',
      template.title,
      template.body,
      delaySec,
      false,
      { trigger: recentRelTrigger ? 'relationship_trigger' : 'rewrite_activity' },
      quietHours,
    );

    await notificationService.recordEvent({
      category: 'relationship_support',
      title: template.title,
      body: template.body,
    });

    console.log('[NotificationScheduler] Relationship support reminder scheduled');
  }

  async scheduleEveningCheckInNudge(
    entries: JournalEntry[],
    enabled: boolean,
    quietHours?: QuietHours,
  ): Promise<void> {
    if (!enabled) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const hasCheckedInToday = entries.some(
      e => e.timestamp >= todayStart.getTime(),
    );

    if (hasCheckedInToday) {
      console.log('[NotificationScheduler] User already checked in today');
      return;
    }

    const now = new Date();
    const eveningHour = 20;

    if (now.getHours() >= eveningHour) {
      const template = getRandomTemplate('gentle_nudge');

      await notificationService.scheduleReminder(
        'gentle_nudge',
        template.title,
        template.body,
        60 * 5,
        false,
        undefined,
        quietHours,
      );

      await notificationService.recordEvent({
        category: 'gentle_nudge',
        title: template.title,
        body: template.body,
      });

      console.log('[NotificationScheduler] Evening nudge scheduled');
    }
  }

  async scheduleReengagement(
    enabled: boolean,
    quietHours?: QuietHours,
    currentDistress?: number,
  ): Promise<void> {
    if (!enabled) return;

    const template = getRandomTemplate('reengagement');
    const delaySec = 48 * 60 * 60;

    await notificationService.scheduleReminder(
      'reengagement',
      template.title,
      template.body,
      delaySec,
      false,
      undefined,
      quietHours,
      currentDistress,
    );
  }

  async schedulePremiumReflection(
    enabled: boolean,
    isPremium: boolean,
    quietHours?: QuietHours,
    currentDistress?: number,
  ): Promise<void> {
    if (!enabled || !isPremium) return;

    const template = getRandomTemplate('premium_reflection');
    const delaySec = 6 * 60 * 60;

    await notificationService.scheduleReminder(
      'premium_reflection',
      template.title,
      template.body,
      delaySec,
      false,
      undefined,
      quietHours,
      currentDistress,
    );
  }

  async triggerTestNotification(category: NotificationCategory): Promise<void> {
    const template = getRandomTemplate(category);
    await notificationService.scheduleReminder(
      category,
      `[TEST] ${template.title}`,
      template.body,
      2,
      false,
      { test: 'true' },
    );
    console.log('[NotificationScheduler] Test notification triggered for:', category);
  }

  async cancelAllReminders(): Promise<void> {
    await notificationService.cancelAll();
    console.log('[NotificationScheduler] All reminders cancelled');
  }
}

export const notificationScheduler = new NotificationScheduler();
