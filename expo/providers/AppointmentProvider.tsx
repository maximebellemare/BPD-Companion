import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  Appointment,
  PreSessionNotes,
  PostSessionNotes,
} from '@/types/appointment';
import { appointmentRepository } from '@/services/repositories';
import { appointmentService } from '@/services/appointments/appointmentService';
import { appointmentReminderService } from '@/services/appointments/appointmentReminderService';
import { normalizeAppointmentState } from '@/services/care/careDataNormalizer';

export const [AppointmentProvider, useAppointments] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const stateQuery = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentRepository.getState(),
  });

  useEffect(() => {
    const normalized = normalizeAppointmentState(stateQuery.data, 'AppointmentProvider.stateQuery');
    setAppointments(normalized.appointments);
  }, [stateQuery.data]);

  const addAppointmentMutation = useMutation({
    mutationFn: (appt: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'completed' | 'preSessionNotes' | 'postSessionNotes'>) =>
      appointmentService.addAppointment(appt),
    onSuccess: (newAppt) => {
      const current = normalizeAppointmentState({ appointments }, 'AppointmentProvider.addMutation');
      const updated = [newAppt, ...current.appointments];
      setAppointments(updated);
      void appointmentReminderService.syncReminders(updated);
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Appointment> }) =>
      appointmentService.updateAppointment(id, updates),
    onSuccess: (result) => {
      if (result) {
        const current = normalizeAppointmentState({ appointments }, 'AppointmentProvider.updateMutation');
        const updated = current.appointments.map(a => a.id === result.id ? result : a);
        setAppointments(updated);
        void appointmentReminderService.syncReminders(updated);
        void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: string) => appointmentService.deleteAppointment(id),
    onSuccess: (_, id) => {
      const current = normalizeAppointmentState({ appointments }, 'AppointmentProvider.deleteMutation');
      const updated = current.appointments.filter(a => a.id !== id);
      setAppointments(updated);
      void appointmentReminderService.syncReminders(updated);
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const savePreSessionMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: PreSessionNotes }) =>
      appointmentService.savePreSessionNotes(id, notes),
    onSuccess: (result) => {
      if (result) {
        const current = normalizeAppointmentState({ appointments }, 'AppointmentProvider.savePreMutation');
        const updated = current.appointments.map(a => a.id === result.id ? result : a);
        setAppointments(updated);
        void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }
    },
  });

  const savePostSessionMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: PostSessionNotes }) =>
      appointmentService.savePostSessionNotes(id, notes),
    onSuccess: (result) => {
      if (result) {
        const current = normalizeAppointmentState({ appointments }, 'AppointmentProvider.savePostMutation');
        const updated = current.appointments.map(a => a.id === result.id ? result : a);
        setAppointments(updated);
        void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }
    },
  });

  const markCompletedMutation = useMutation({
    mutationFn: (id: string) => appointmentService.markCompleted(id),
    onSuccess: (result) => {
      if (result) {
        const current = normalizeAppointmentState({ appointments }, 'AppointmentProvider.markCompletedMutation');
        const updated = current.appointments.map(a => a.id === result.id ? result : a);
        setAppointments(updated);
        void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }
    },
  });

  const updateAppointment = useCallback(
    (id: string, updates: Partial<Appointment>) =>
      updateAppointmentMutation.mutateAsync({ id, updates }),
    [updateAppointmentMutation],
  );

  const normalizedState = useMemo(
    () => normalizeAppointmentState({ appointments }, 'AppointmentProvider.render'),
    [appointments],
  );
  const safeAppointments = normalizedState.appointments;

  const upcomingAppointments = useMemo(
    () => appointmentService.getUpcomingAppointments(safeAppointments),
    [safeAppointments],
  );

  const todayAppointments = useMemo(
    () => appointmentService.getTodayAppointments(safeAppointments),
    [safeAppointments],
  );

  const pastAppointments = useMemo(
    () => appointmentService.getPastAppointments(safeAppointments),
    [safeAppointments],
  );

  const nextAppointment = useMemo(
    () => appointmentService.getNextAppointment(safeAppointments),
    [safeAppointments],
  );

  const needsPostSession = useMemo(
    () => appointmentService.getNeedsPostSession(safeAppointments),
    [safeAppointments],
  );

  const needsPreSession = useMemo(
    () => appointmentService.getNeedsPreSession(safeAppointments),
    [safeAppointments],
  );

  const getAppointmentById = useCallback(
    (id: string) => safeAppointments.find(a => a.id === id) ?? null,
    [safeAppointments],
  );

  const savePreSession = useCallback(
    (id: string, notes: PreSessionNotes) =>
      savePreSessionMutation.mutateAsync({ id, notes }),
    [savePreSessionMutation],
  );

  const savePostSession = useCallback(
    (id: string, notes: PostSessionNotes) =>
      savePostSessionMutation.mutateAsync({ id, notes }),
    [savePostSessionMutation],
  );

  return useMemo(() => ({
    appointments: safeAppointments,
    upcomingAppointments,
    todayAppointments,
    pastAppointments,
    nextAppointment,
    needsPostSession,
    needsPreSession,
    isLoading: stateQuery.isLoading,
    addAppointment: addAppointmentMutation.mutateAsync,
    updateAppointment,
    deleteAppointment: deleteAppointmentMutation.mutateAsync,
    savePreSessionNotes: savePreSession,
    savePostSessionNotes: savePostSession,
    markCompleted: markCompletedMutation.mutateAsync,
    isAdding: addAppointmentMutation.isPending,
    isSavingPreSession: savePreSessionMutation.isPending,
    isSavingPostSession: savePostSessionMutation.isPending,
    getAppointmentById,
  }), [
    safeAppointments, upcomingAppointments, todayAppointments, pastAppointments,
    nextAppointment, needsPostSession, needsPreSession, stateQuery.isLoading,
    addAppointmentMutation.mutateAsync, addAppointmentMutation.isPending,
    updateAppointment, deleteAppointmentMutation.mutateAsync,
    savePreSession, savePostSession,
    savePreSessionMutation.isPending, savePostSessionMutation.isPending,
    markCompletedMutation.mutateAsync, getAppointmentById,
  ]);
});
