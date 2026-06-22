import { normalizeCareData, normalizeMedicationState, normalizeAppointmentState } from '@/services/care/careDataNormalizer';

export function runCareDataNormalizerSmokeTest(): boolean {
  const cases = [
    undefined,
    null,
    {},
    { care: {} },
    { medications: null, logs: null, appointments: null },
    { medications: 'bad', logs: { bad: true }, appointments: 123 },
    { care: { medications: [], medicationLogs: [], appointments: [] } },
  ];

  return cases.every((value) => {
    const careData = normalizeCareData(value, 'CareDataSmokeTest');
    const medicationState = normalizeMedicationState(value as never, 'CareDataSmokeTest');
    const appointmentState = normalizeAppointmentState(value as never, 'CareDataSmokeTest');
    return (
      Array.isArray(careData.care.medications) &&
      Array.isArray(careData.care.appointments) &&
      Array.isArray(medicationState.medications) &&
      Array.isArray(medicationState.logs) &&
      Array.isArray(appointmentState.appointments)
    );
  });
}

