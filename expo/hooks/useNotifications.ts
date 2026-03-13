import { useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationScheduler, FullNotificationSettings } from '@/services/notifications/notificationScheduler';
import { notificationActionHandler } from '@/services/notifications/notificationActionHandler';
import { useProfile } from '@/providers/ProfileProvider';
import { useEmotionalContext } from '@/providers/EmotionalContextProvider';
import { useNotificationEntry } from '@/providers/NotificationEntryProvider';
import { useApp } from '@/providers/AppProvider';
import { QuietHours } from '@/types/notifications';

export function useNotifications() {
  const router = useRouter();
  const { profile } = useProfile();
  const { activeContext } = useEmotionalContext();
  const { journalEntries } = useApp();
  const { setNotificationEntry } = useNotificationEntry();
  const lastSyncRef = useRef<string>('');
  const contextCheckRef = useRef<number>(0);

  const quietHours = useMemo<QuietHours>(() => ({
    enabled: profile.notifications.quietHoursEnabled,
    startTime: profile.notifications.quietHoursStart,
    endTime: profile.notifications.quietHoursEnd,
  }), [
    profile.notifications.quietHoursEnabled,
    profile.notifications.quietHoursStart,
    profile.notifications.quietHoursEnd,
  ]);

  const fullSettings = useMemo<FullNotificationSettings>(() => ({
    dailyCheckInReminder: profile.notifications.dailyCheckInReminder,
    checkInReminderTime: profile.notifications.checkInReminderTime,
    weeklyReflectionReminder: profile.notifications.weeklyReflectionReminder ?? profile.notifications.weeklyInsights,
    weeklyReflectionDay: profile.notifications.weeklyReflectionDay ?? 1,
    weeklyReflectionTime: profile.notifications.weeklyReflectionTime ?? '10:00',
    relationshipSupportReminders: profile.notifications.relationshipSupportReminders ?? profile.notifications.gentleNudges,
    regulationFollowUps: profile.notifications.regulationFollowUps ?? profile.notifications.gentleNudges,
    gentleNudges: profile.notifications.gentleNudges,
    ritualReminders: profile.notifications.ritualReminders ?? true,
    morningRitualTime: profile.notifications.morningRitualTime ?? '08:00',
    eveningRitualTime: profile.notifications.eveningRitualTime ?? '20:00',
    calmFollowups: profile.notifications.calmFollowups ?? true,
    premiumReflections: profile.notifications.premiumReflections ?? true,
    therapistReportReminder: profile.notifications.therapistReportReminder ?? true,
    reengagementReminders: profile.notifications.reengagementReminders ?? true,
    streakSupport: profile.notifications.streakSupport ?? true,
    premiumInsightReminders: profile.notifications.premiumInsightReminders ?? true,
    upgradeReminders: profile.notifications.upgradeReminders ?? true,
    quietHours,
    weekendReminders: profile.notifications.weekendReminders ?? true,
    frequency: profile.notifications.frequency ?? 'balanced',
  }), [profile.notifications, quietHours]);

  useEffect(() => {
    void notificationService.initialize();
  }, []);

  useEffect(() => {
    const settingsKey = JSON.stringify(fullSettings);
    if (settingsKey === lastSyncRef.current) return;
    lastSyncRef.current = settingsKey;

    void notificationScheduler.syncReminders(fullSettings);
    console.log('[useNotifications] Reminders synced with profile settings');
  }, [fullSettings]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data as Record<string, string> | undefined;
        const category = data?.category as string | undefined;
        const actionId = response.actionIdentifier;

        console.log('[useNotifications] Notification tapped:', category, 'action:', actionId);

        if (!category) {
          router.push('/check-in' as never);
          return;
        }

        const notifData: Record<string, string> = { ...(data ?? {}) };
        if (actionId && actionId !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
          notifData.action_id = actionId;
        }

        try {
          const { route, entryState } = await notificationActionHandler.handleNotificationTap(
            category,
            notifData,
          );

          notificationActionHandler.setDistressBefore(activeContext.latestIntensity);
          setNotificationEntry(entryState);

          console.log('[useNotifications] Routing to:', route);
          router.push(route as never);
        } catch (error) {
          console.error('[useNotifications] Routing failed:', error);
          router.push('/check-in' as never);
        }
      },
    );

    return () => {
      responseSubscription.remove();
    };
  }, [router, activeContext.latestIntensity, setNotificationEntry]);

  useEffect(() => {
    const now = Date.now();
    if (now - contextCheckRef.current < 5 * 60 * 1000) return;
    contextCheckRef.current = now;

    if (activeContext.highDistressRecent && activeContext.latestIntensity >= 6) {
      void notificationScheduler.scheduleRegulationFollowUp(
        activeContext.latestIntensity,
        fullSettings.regulationFollowUps,
        quietHours,
      );
    }

    if (activeContext.activeRelationshipContext || activeContext.recentRewriteCount >= 2) {
      void notificationScheduler.scheduleRelationshipSupport(
        fullSettings.relationshipSupportReminders,
        activeContext.activeRelationshipContext,
        activeContext.recentRewriteCount,
        quietHours,
      );
    }
  }, [activeContext, fullSettings.regulationFollowUps, fullSettings.relationshipSupportReminders, quietHours]);

  useEffect(() => {
    void notificationScheduler.scheduleEveningCheckInNudge(
      journalEntries,
      fullSettings.dailyCheckInReminder,
      quietHours,
    );
  }, [journalEntries, fullSettings.dailyCheckInReminder, quietHours]);

  const triggerRegulationFollowUp = useCallback((distressLevel: number) => {
    void notificationScheduler.scheduleRegulationFollowUp(
      distressLevel,
      fullSettings.regulationFollowUps,
      quietHours,
    );
  }, [fullSettings.regulationFollowUps, quietHours]);

  const triggerRelationshipSupport = useCallback(() => {
    void notificationScheduler.scheduleRelationshipSupport(
      fullSettings.relationshipSupportReminders,
      true,
      0,
      quietHours,
    );
  }, [fullSettings.relationshipSupportReminders, quietHours]);

  const triggerCalmFollowUp = useCallback(() => {
    void notificationScheduler.scheduleCalmFollowUp(
      fullSettings.calmFollowups,
      quietHours,
    );
  }, [fullSettings.calmFollowups, quietHours]);

  return {
    triggerRegulationFollowUp,
    triggerRelationshipSupport,
    triggerCalmFollowUp,
    settings: fullSettings,
    quietHours,
  };
}
