import { Medication, formatTime, getMedicationDaysOfWeek, MEDICATION_WEEKDAYS } from '@/types/medication';
import { notificationService } from '@/services/notifications/notificationService';

class MedicationReminderService {
  async syncReminders(medications: Medication[]): Promise<void> {
    const safeMedications = Array.isArray(medications) ? medications : [];
    console.log('[MedicationReminderService] Syncing reminders for', safeMedications.length, 'medications');

    await notificationService.cancelAllByCategory('medication_reminder');

    const activeMeds = safeMedications.filter(m => m.active && m.reminderEnabled && m.schedule !== 'as_needed');

    for (const med of activeMeds) {
      for (const time of Array.isArray(med.times) ? med.times : []) {
        try {
          const days = getMedicationDaysOfWeek(med);
          if (days.length === 7 && !['weekly', 'custom'].includes(med.schedule)) {
            await notificationService.scheduleDailyReminder(
              time.hour,
              time.minute,
              `Time for ${med.name}`,
              `${med.dosage} — ${time.label}`,
              'medication_reminder' as any,
            );
          } else {
            for (const day of days) {
              const weekday = MEDICATION_WEEKDAYS.find(option => option.value === day)?.expoWeekday;
              if (!weekday) continue;
              await notificationService.scheduleWeeklyReminder(
                weekday,
                time.hour,
                time.minute,
                `Time for ${med.name}`,
                `${med.dosage} — ${time.label}`,
                'medication_reminder' as any,
              );
            }
          }
          console.log('[MedicationReminderService] Scheduled reminder for', med.name, 'at', formatTime(time.hour, time.minute));
        } catch (error) {
          console.log('[MedicationReminderService] Failed to schedule reminder for', med.name, error);
        }
      }
    }

    console.log('[MedicationReminderService] Sync complete');
  }

  async cancelAllReminders(): Promise<void> {
    await notificationService.cancelAllByCategory('medication_reminder');
    console.log('[MedicationReminderService] All medication reminders cancelled');
  }
}

export const medicationReminderService = new MedicationReminderService();
