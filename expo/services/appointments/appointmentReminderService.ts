import { Platform } from 'react-native';
import { Appointment, APPOINTMENT_TYPE_LABELS, formatAppointmentTime } from '@/types/appointment';

class AppointmentReminderService {
  async syncReminders(appointments: Appointment[]): Promise<void> {
    const safeAppointments = Array.isArray(appointments) ? appointments : [];
    if (Platform.OS === 'web') {
      console.log('[AppointmentReminderService] Skipping reminders on web');
      return;
    }

    try {
      const Notifications = await import('expo-notifications');

      const existing = await Notifications.getAllScheduledNotificationsAsync();
      const apptNotifications = existing.filter(
        n => (n.content.data as Record<string, unknown>)?.type === 'appointment_reminder'
      );
      for (const n of apptNotifications) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }

      const activeAppointments = safeAppointments.filter(
        a => a.reminderEnabled && !a.completed && a.dateTime > Date.now()
      );

      for (const appt of activeAppointments) {
        const triggerTime = appt.dateTime - appt.reminderMinutesBefore * 60 * 1000;
        if (triggerTime <= Date.now()) continue;

        const typeLabel = APPOINTMENT_TYPE_LABELS[appt.appointmentType];
        const timeLabel = formatAppointmentTime(appt.dateTime);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${typeLabel} Appointment`,
            body: `${appt.providerName} at ${timeLabel}${appt.reminderMinutesBefore > 0 ? ` in ${appt.reminderMinutesBefore} min` : ''}`,
            data: { type: 'appointment_reminder', appointmentId: appt.id },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(triggerTime),
          },
        });

        console.log('[AppointmentReminderService] Scheduled reminder for:', appt.providerName);
      }

      console.log('[AppointmentReminderService] Synced', activeAppointments.length, 'reminders');
    } catch (error) {
      console.log('[AppointmentReminderService] Error syncing reminders:', error);
    }
  }
}

export const appointmentReminderService = new AppointmentReminderService();
