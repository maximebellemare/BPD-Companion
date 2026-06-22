import { AppointmentState } from '@/types/appointment';
import { getMedicationDaysOfWeek, Medication, MedicationDayOfWeek, MedicationState } from '@/types/medication';

export type CareData = {
  care: {
    medications: MedicationState['medications'];
    medicationLogs: MedicationState['logs'];
    appointments: AppointmentState['appointments'];
  };
};

export const DEFAULT_CARE_DATA: CareData = {
  care: {
    medications: [],
    medicationLogs: [],
    appointments: [],
  },
};

function traceMissingArray(component: string, field: string, parent: unknown): void {
  if (!__DEV__) return;
  console.log(`[CareDataNormalizer] ${component}: expected ${field} array, received`, parent);
}

export function normalizeMedicationState(
  state: Partial<MedicationState> | null | undefined,
  component = 'unknown',
): MedicationState {
  if (!Array.isArray(state?.medications)) {
    traceMissingArray(component, 'medications', state);
  }
  if (!Array.isArray(state?.logs)) {
    traceMissingArray(component, 'logs', state);
  }

  return {
    medications: Array.isArray(state?.medications)
      ? state.medications.map((medication) => normalizeMedication(medication))
      : [],
    logs: Array.isArray(state?.logs) ? state.logs : [],
  };
}

function normalizeMedication(medication: Medication): Medication {
  const validDays = Array.isArray(medication.daysOfWeek)
    ? medication.daysOfWeek.filter((day): day is MedicationDayOfWeek =>
      Number.isInteger(day) && day >= 0 && day <= 6,
    )
    : [];
  return {
    ...medication,
    times: Array.isArray(medication.times) ? medication.times : [],
    daysOfWeek: validDays.length > 0 ? validDays : getMedicationDaysOfWeek(medication),
  };
}

export function normalizeAppointmentState(
  state: Partial<AppointmentState> | null | undefined,
  component = 'unknown',
): AppointmentState {
  if (!Array.isArray(state?.appointments)) {
    traceMissingArray(component, 'appointments', state);
  }

  return {
    appointments: Array.isArray(state?.appointments) ? state.appointments : [],
  };
}

export function normalizeCareData(
  value: unknown,
  component = 'unknown',
): CareData {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const careSource = source.care && typeof source.care === 'object'
    ? source.care as Record<string, unknown>
    : source;
  const medications = Array.isArray(careSource.medications) ? careSource.medications : [];
  const medicationLogs = Array.isArray(careSource.medicationLogs)
    ? careSource.medicationLogs
    : Array.isArray(careSource.logs)
      ? careSource.logs
      : [];
  const appointments = Array.isArray(careSource.appointments) ? careSource.appointments : [];

  if (!Array.isArray(careSource.medications)) {
    traceMissingArray(component, 'care.medications', value);
  }
  if (!Array.isArray(careSource.appointments)) {
    traceMissingArray(component, 'care.appointments', value);
  }

  return {
    care: {
      medications,
      medicationLogs,
      appointments,
    },
  };
}
