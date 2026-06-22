import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  Medication,
  MedicationLog,
  MedicationTime,
  LogStatus,
  MoodAfter,
} from '@/types/medication';
import { medicationRepository } from '@/services/repositories';
import { medicationService } from '@/services/medications/medicationService';
import { medicationReminderService } from '@/services/medications/medicationReminderService';
import { normalizeMedicationState } from '@/services/care/careDataNormalizer';

export const [MedicationProvider, useMedications] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);

  const stateQuery = useQuery({
    queryKey: ['medications'],
    queryFn: () => medicationRepository.getState(),
  });

  useEffect(() => {
    const normalized = normalizeMedicationState(stateQuery.data, 'MedicationProvider.stateQuery');
    setMedications(normalized.medications);
    setLogs(normalized.logs);
  }, [stateQuery.data]);

  const addMedicationMutation = useMutation({
    mutationFn: (med: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) =>
      medicationService.addMedication(med),
    onSuccess: (newMed) => {
      const current = normalizeMedicationState({ medications, logs }, 'MedicationProvider.addMutation');
      const updated = [newMed, ...current.medications];
      setMedications(updated);
      void medicationReminderService.syncReminders(updated);
      void queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });

  const updateMedicationMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Medication> }) =>
      medicationService.updateMedication(id, updates),
    onSuccess: (result) => {
      if (result) {
        const current = normalizeMedicationState({ medications, logs }, 'MedicationProvider.updateMutation');
        const updated = current.medications.map(m => m.id === result.id ? result : m);
        setMedications(updated);
        void medicationReminderService.syncReminders(updated);
        void queryClient.invalidateQueries({ queryKey: ['medications'] });
      }
    },
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: (id: string) => medicationService.deleteMedication(id),
    onSuccess: (_, id) => {
      const current = normalizeMedicationState({ medications, logs }, 'MedicationProvider.deleteMutation');
      const updated = current.medications.filter(m => m.id !== id);
      setMedications(updated);
      setLogs(prev => prev.filter(l => l.medicationId !== id));
      void medicationReminderService.syncReminders(updated);
      void queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });

  const logMedicationMutation = useMutation({
    mutationFn: (params: {
      medicationId: string;
      status: LogStatus;
      scheduledTime: MedicationTime | null;
      moodAfter?: MoodAfter | null;
      anxietyAfter?: number | null;
      sleepiness?: number | null;
      sideEffects?: string;
      didItHelp?: boolean | null;
      notes?: string;
    }) => medicationService.logMedication(params),
    onSuccess: (newLog) => {
      setLogs(prev => [newLog, ...prev]);
      void queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => medicationService.toggleMedicationActive(id),
    onSuccess: (result) => {
      if (result) {
        const current = normalizeMedicationState({ medications, logs }, 'MedicationProvider.toggleMutation');
        const updated = current.medications.map(m => m.id === result.id ? result : m);
        setMedications(updated);
        void medicationReminderService.syncReminders(updated);
        void queryClient.invalidateQueries({ queryKey: ['medications'] });
      }
    },
  });

  const updateMedication = useCallback(
    (id: string, updates: Partial<Medication>) =>
      updateMedicationMutation.mutateAsync({ id, updates }),
    [updateMedicationMutation],
  );

  const normalizedState = useMemo(
    () => normalizeMedicationState({ medications, logs }, 'MedicationProvider.render'),
    [medications, logs],
  );
  const safeMedications = normalizedState.medications;
  const safeLogs = normalizedState.logs;

  const activeMedications = useMemo(() => safeMedications.filter(m => m.active), [safeMedications]);
  const inactiveMedications = useMemo(() => safeMedications.filter(m => !m.active), [safeMedications]);

  const dueMedications = useMemo(
    () => medicationService.getDueMedications(safeMedications, safeLogs),
    [safeMedications, safeLogs],
  );

  const todayLogs = useMemo(() => medicationService.getTodayLogs(safeLogs), [safeLogs]);

  const overallAdherence = useMemo(
    () => medicationService.getAdherenceRate(safeLogs),
    [safeLogs],
  );

  const getMedicationById = useCallback(
    (id: string) => safeMedications.find(m => m.id === id) ?? null,
    [safeMedications],
  );

  const getLogsForMedication = useCallback(
    (medicationId: string) => safeLogs.filter(l => l.medicationId === medicationId),
    [safeLogs],
  );

  const getAdherenceRate = useCallback(
    (medicationId?: string, days?: number) =>
      medicationService.getAdherenceRate(safeLogs, medicationId, days),
    [safeLogs],
  );

  const getStreak = useCallback(
    (medicationId: string) => medicationService.getStreakDays(safeLogs, medicationId),
    [safeLogs],
  );

  return useMemo(() => ({
    medications: safeMedications,
    logs: safeLogs,
    activeMedications,
    inactiveMedications,
    dueMedications,
    todayLogs,
    overallAdherence,
    isLoading: stateQuery.isLoading,
    addMedication: addMedicationMutation.mutateAsync,
    updateMedication,
    deleteMedication: deleteMedicationMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    logMedication: logMedicationMutation.mutateAsync,
    isAddingMedication: addMedicationMutation.isPending,
    isLogging: logMedicationMutation.isPending,
    getMedicationById,
    getLogsForMedication,
    getAdherenceRate,
    getStreak,
  }), [
    safeMedications, safeLogs, activeMedications, inactiveMedications,
    dueMedications, todayLogs, overallAdherence, stateQuery.isLoading,
    addMedicationMutation.mutateAsync, addMedicationMutation.isPending,
    updateMedication, deleteMedicationMutation.mutateAsync,
    toggleActiveMutation.mutateAsync, logMedicationMutation.mutateAsync,
    logMedicationMutation.isPending, getMedicationById, getLogsForMedication,
    getAdherenceRate, getStreak,
  ]);
});
