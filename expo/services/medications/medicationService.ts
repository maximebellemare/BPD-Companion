import {
  Medication,
  MedicationLog,
  MedicationTime,
  LogStatus,
  MoodAfter,
  shouldMedicationOccurOnDay,
} from '@/types/medication';
import { medicationRepository } from '@/services/repositories';
import { normalizeMedicationState } from '@/services/care/careDataNormalizer';

function generateId(): string {
  return `med_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

class MedicationService {
  async addMedication(medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medication> {
    const now = Date.now();
    const newMed: Medication = {
      ...medication,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const medicationState = normalizeMedicationState(await medicationRepository.getState(), 'MedicationService.addMedication');
    medicationState.medications.unshift(newMed);
    await medicationRepository.saveState(medicationState);

    console.log('[MedicationService] Added medication:', newMed.name);
    return newMed;
  }

  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication | null> {
    const medicationState = normalizeMedicationState(await medicationRepository.getState(), 'MedicationService.updateMedication');
    const idx = medicationState.medications.findIndex(m => m.id === id);
    if (idx === -1) return null;

    medicationState.medications[idx] = {
      ...medicationState.medications[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    await medicationRepository.saveState(medicationState);

    console.log('[MedicationService] Updated medication:', medicationState.medications[idx].name);
    return medicationState.medications[idx];
  }

  async deleteMedication(id: string): Promise<void> {
    const medicationState = normalizeMedicationState(await medicationRepository.getState(), 'MedicationService.deleteMedication');
    medicationState.medications = medicationState.medications.filter(m => m.id !== id);
    medicationState.logs = medicationState.logs.filter(l => l.medicationId !== id);
    await medicationRepository.saveState(medicationState);
    console.log('[MedicationService] Deleted medication:', id);
  }

  async toggleMedicationActive(id: string): Promise<Medication | null> {
    const medicationState = normalizeMedicationState(await medicationRepository.getState(), 'MedicationService.toggleMedicationActive');
    const med = medicationState.medications.find(m => m.id === id);
    if (!med) return null;

    med.active = !med.active;
    med.updatedAt = Date.now();
    await medicationRepository.saveState(medicationState);

    console.log('[MedicationService] Toggled medication active:', med.name, med.active);
    return med;
  }

  async logMedication(params: {
    medicationId: string;
    status: LogStatus;
    scheduledTime: MedicationTime | null;
    moodAfter?: MoodAfter | null;
    anxietyAfter?: number | null;
    sleepiness?: number | null;
    sideEffects?: string;
    didItHelp?: boolean | null;
    notes?: string;
  }): Promise<MedicationLog> {
    const log: MedicationLog = {
      id: generateLogId(),
      medicationId: params.medicationId,
      status: params.status,
      timestamp: Date.now(),
      scheduledTime: params.scheduledTime,
      moodAfter: params.moodAfter ?? null,
      anxietyAfter: params.anxietyAfter ?? null,
      sleepiness: params.sleepiness ?? null,
      sideEffects: params.sideEffects ?? '',
      didItHelp: params.didItHelp ?? null,
      notes: params.notes ?? '',
    };

    const medicationState = normalizeMedicationState(await medicationRepository.getState(), 'MedicationService.logMedication');
    medicationState.logs.unshift(log);
    await medicationRepository.saveState(medicationState);

    console.log('[MedicationService] Logged medication:', params.medicationId, params.status);
    return log;
  }

  async updateLog(logId: string, updates: Partial<MedicationLog>): Promise<MedicationLog | null> {
    const medicationState = normalizeMedicationState(await medicationRepository.getState(), 'MedicationService.updateLog');
    const idx = medicationState.logs.findIndex(l => l.id === logId);
    if (idx === -1) return null;

    medicationState.logs[idx] = { ...medicationState.logs[idx], ...updates };
    await medicationRepository.saveState(medicationState);
    return medicationState.logs[idx];
  }

  async deleteLog(logId: string): Promise<void> {
    const medicationState = normalizeMedicationState(await medicationRepository.getState(), 'MedicationService.deleteLog');
    medicationState.logs = medicationState.logs.filter(l => l.id !== logId);
    await medicationRepository.saveState(medicationState);
  }

  getLogsForMedication(logs: MedicationLog[], medicationId: string): MedicationLog[] {
    return logs.filter(l => l.medicationId === medicationId);
  }

  getTodayLogs(logs: MedicationLog[]): MedicationLog[] {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return logs.filter(l => l.timestamp >= todayStart.getTime());
  }

  getDueMedications(medications: Medication[], logs: MedicationLog[]): Array<{ medication: Medication; time: MedicationTime; logged: boolean }> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const todayLogs = this.getTodayLogs(logs);
    const due: Array<{ medication: Medication; time: MedicationTime; logged: boolean }> = [];

    for (const med of Array.isArray(medications) ? medications : []) {
      if (!med.active) continue;
      if (med.schedule === 'as_needed') continue;
      if (!shouldMedicationOccurOnDay(med, now)) continue;

      for (const time of Array.isArray(med.times) ? med.times : []) {
        const isLoggedForTime = todayLogs.some(
          l => l.medicationId === med.id &&
            l.scheduledTime?.hour === time.hour &&
            l.scheduledTime?.minute === time.minute
        );

        const isPastDue = currentHour > time.hour || (currentHour === time.hour && currentMinute >= time.minute);
        const isUpcoming = !isPastDue && (time.hour - currentHour <= 2);

        if (isPastDue || isUpcoming) {
          due.push({ medication: med, time, logged: isLoggedForTime });
        }
      }
    }

    due.sort((a, b) => {
      if (a.logged !== b.logged) return a.logged ? 1 : -1;
      return (a.time.hour * 60 + a.time.minute) - (b.time.hour * 60 + b.time.minute);
    });

    return due;
  }

  getAdherenceRate(logs: MedicationLog[], medicationId?: string, days: number = 7): number {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const filtered = logs.filter(l => {
      if (l.timestamp < cutoff) return false;
      if (medicationId && l.medicationId !== medicationId) return false;
      return true;
    });

    if (filtered.length === 0) return 0;
    const taken = filtered.filter(l => l.status === 'taken').length;
    return Math.round((taken / filtered.length) * 100);
  }

  getStreakDays(logs: MedicationLog[], medicationId: string): number {
    const medLogs = logs
      .filter(l => l.medicationId === medicationId && l.status === 'taken')
      .sort((a, b) => b.timestamp - a.timestamp);

    if (medLogs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const hasLog = medLogs.some(
        l => l.timestamp >= dayStart.getTime() && l.timestamp < dayEnd.getTime()
      );

      if (hasLog) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }

  getMoodTrend(logs: MedicationLog[], medicationId: string, days: number = 14): Array<{ date: string; mood: number }> {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const moodMap: Record<string, number> = {
      'much_better': 5,
      'better': 4,
      'same': 3,
      'worse': 2,
      'much_worse': 1,
    };

    return logs
      .filter(l => l.medicationId === medicationId && l.timestamp >= cutoff && l.moodAfter)
      .map(l => ({
        date: new Date(l.timestamp).toLocaleDateString(),
        mood: moodMap[l.moodAfter!] ?? 3,
      }));
  }
}

export const medicationService = new MedicationService();
