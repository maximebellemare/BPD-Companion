import { MedicationState, DEFAULT_MEDICATION_STATE, Medication, MedicationLog } from '@/types/medication';
import { IStorageService } from '@/services/storage/storageService';
import { normalizeMedicationState } from '@/services/care/careDataNormalizer';

const MEDICATION_KEY = 'bpd_medications';

export interface IMedicationRepository {
  getState(): Promise<MedicationState>;
  saveState(state: MedicationState): Promise<void>;
  getMedications(): Promise<Medication[]>;
  saveMedications(medications: Medication[]): Promise<void>;
  getLogs(): Promise<MedicationLog[]>;
  saveLogs(logs: MedicationLog[]): Promise<void>;
}

export class LocalMedicationRepository implements IMedicationRepository {
  constructor(private storage: IStorageService) {}

  async getState(): Promise<MedicationState> {
    const data = await this.storage.get<MedicationState>(MEDICATION_KEY);
    const normalized = normalizeMedicationState(data ?? DEFAULT_MEDICATION_STATE, 'MedicationRepository.getState');
    console.log('[MedicationRepository] Loaded state:', normalized.medications.length, 'medications,', normalized.logs.length, 'logs');
    return normalized;
  }

  async saveState(state: MedicationState): Promise<void> {
    const normalized = normalizeMedicationState(state, 'MedicationRepository.saveState');
    await this.storage.set(MEDICATION_KEY, normalized);
    console.log('[MedicationRepository] Saved state:', normalized.medications.length, 'medications,', normalized.logs.length, 'logs');
  }

  async getMedications(): Promise<Medication[]> {
    const state = await this.getState();
    return normalizeMedicationState(state, 'MedicationRepository.getMedications').medications;
  }

  async saveMedications(medications: Medication[]): Promise<void> {
    const state = await this.getState();
    await this.saveState({ ...state, medications: Array.isArray(medications) ? medications : [] });
  }

  async getLogs(): Promise<MedicationLog[]> {
    const state = await this.getState();
    return normalizeMedicationState(state, 'MedicationRepository.getLogs').logs;
  }

  async saveLogs(logs: MedicationLog[]): Promise<void> {
    const state = await this.getState();
    await this.saveState({ ...state, logs: Array.isArray(logs) ? logs : [] });
  }
}
