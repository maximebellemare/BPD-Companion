import { AppointmentState, DEFAULT_APPOINTMENT_STATE, Appointment } from '@/types/appointment';
import { IStorageService } from '@/services/storage/storageService';
import { normalizeAppointmentState } from '@/services/care/careDataNormalizer';

const APPOINTMENT_KEY = 'bpd_appointments';

export interface IAppointmentRepository {
  getState(): Promise<AppointmentState>;
  saveState(state: AppointmentState): Promise<void>;
  getAppointments(): Promise<Appointment[]>;
}

export class LocalAppointmentRepository implements IAppointmentRepository {
  constructor(private storage: IStorageService) {}

  async getState(): Promise<AppointmentState> {
    const data = await this.storage.get<AppointmentState>(APPOINTMENT_KEY);
    const normalized = normalizeAppointmentState(data ?? DEFAULT_APPOINTMENT_STATE, 'AppointmentRepository.getState');
    console.log('[AppointmentRepository] Loaded state:', normalized.appointments.length, 'appointments');
    return normalized;
  }

  async saveState(state: AppointmentState): Promise<void> {
    const normalized = normalizeAppointmentState(state, 'AppointmentRepository.saveState');
    await this.storage.set(APPOINTMENT_KEY, normalized);
    console.log('[AppointmentRepository] Saved state:', normalized.appointments.length, 'appointments');
  }

  async getAppointments(): Promise<Appointment[]> {
    const state = await this.getState();
    return normalizeAppointmentState(state, 'AppointmentRepository.getAppointments').appointments;
  }
}
