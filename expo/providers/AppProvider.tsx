import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { JournalEntry, MessageDraft, DistressLevel } from '@/types';
import { journalRepository, messageRepository } from '@/services/repositories';
import { storageService } from '@/services/storage/storageService';

export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [distressLevel, setDistressLevel] = useState<DistressLevel>('low');
  const [safetyModeActive, setSafetyModeActive] = useState<boolean>(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [messageDrafts, setMessageDrafts] = useState<MessageDraft[]>([]);
  const [storageUserId, setStorageUserId] = useState<string | null>(() => storageService.getUserId());
  const journalEntriesRef = useRef<JournalEntry[]>([]);

  useEffect(() => {
    return storageService.onUserChange((nextUserId) => {
      journalEntriesRef.current = [];
      setJournalEntries([]);
      setMessageDrafts([]);
      setDistressLevel('low');
      setSafetyModeActive(false);
      setStorageUserId(nextUserId);
      void queryClient.removeQueries({ queryKey: ['journal'] });
      void queryClient.removeQueries({ queryKey: ['messages'] });
    });
  }, [queryClient]);

  const journalQuery = useQuery({
    queryKey: ['journal', storageUserId ?? 'guest'],
    queryFn: () => journalRepository.getAll(),
  });

  const messagesQuery = useQuery({
    queryKey: ['messages', storageUserId ?? 'guest'],
    queryFn: () => messageRepository.getAll(),
  });

  useEffect(() => {
    if (journalQuery.data) {
      const incoming = journalQuery.data;
      const local = journalEntriesRef.current;
      const incomingLatest = Math.max(0, ...incoming.map(entry => entry.timestamp));
      const localLatest = Math.max(0, ...local.map(entry => entry.timestamp));

      if (local.length > 0 && localLatest > incomingLatest) {
        return;
      }

      journalEntriesRef.current = incoming;
      setJournalEntries(incoming);
    }
  }, [journalQuery.data]);

  useEffect(() => {
    if (messagesQuery.data) {
      setMessageDrafts(messagesQuery.data);
    }
  }, [messagesQuery.data]);

  const saveJournalMutation = useMutation({
    mutationFn: (entries: JournalEntry[]) => journalRepository.save(entries),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journal', storageUserId ?? 'guest'] });
    },
  });

  const saveMessagesMutation = useMutation({
    mutationFn: (drafts: MessageDraft[]) => messageRepository.save(drafts),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', storageUserId ?? 'guest'] });
    },
  });

  const addJournalEntry = useCallback((entry: JournalEntry) => {
    const updated = [entry, ...journalEntriesRef.current];
    journalEntriesRef.current = updated;
    setJournalEntries(updated);
    saveJournalMutation.mutate(updated);
  }, [saveJournalMutation]);

  const updateJournalEntry = useCallback((id: string, updates: Partial<JournalEntry>) => {
    const updated = journalEntriesRef.current.map(e => e.id === id ? { ...e, ...updates } : e);
    journalEntriesRef.current = updated;
    setJournalEntries(updated);
    saveJournalMutation.mutate(updated);
  }, [saveJournalMutation]);

  const addMessageDraft = useCallback((draft: MessageDraft) => {
    const updated = [draft, ...messageDrafts];
    setMessageDrafts(updated);
    saveMessagesMutation.mutate(updated);
  }, [messageDrafts, saveMessagesMutation]);

  const updateMessageDraft = useCallback((id: string, updates: Partial<MessageDraft>) => {
    const updated = messageDrafts.map(m => m.id === id ? { ...m, ...updates } : m);
    setMessageDrafts(updated);
    saveMessagesMutation.mutate(updated);
  }, [messageDrafts, saveMessagesMutation]);

  const activateSafetyMode = useCallback(() => {
    setSafetyModeActive(true);
    setDistressLevel('crisis');
  }, []);

  const deactivateSafetyMode = useCallback(() => {
    setSafetyModeActive(false);
    setDistressLevel('moderate');
  }, []);

  const triggerPatterns = useMemo<{ triggerCounts: Record<string, number>; emotionCounts: Record<string, number>; urgeCounts: Record<string, number> }>(() => {
    const triggerCounts: Record<string, number> = {};
    const emotionCounts: Record<string, number> = {};
    const urgeCounts: Record<string, number> = {};

    journalEntries.forEach(entry => {
      entry.checkIn.triggers.forEach(t => {
        triggerCounts[t.label] = (triggerCounts[t.label] || 0) + 1;
      });
      entry.checkIn.emotions.forEach(e => {
        emotionCounts[e.label] = (emotionCounts[e.label] || 0) + 1;
      });
      entry.checkIn.urges.forEach(u => {
        urgeCounts[u.label] = (urgeCounts[u.label] || 0) + 1;
      });
    });

    return { triggerCounts, emotionCounts, urgeCounts };
  }, [journalEntries]);

  return useMemo(() => ({
    distressLevel,
    setDistressLevel,
    safetyModeActive,
    activateSafetyMode,
    deactivateSafetyMode,
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    messageDrafts,
    addMessageDraft,
    updateMessageDraft,
    triggerPatterns,
    isLoading: journalQuery.isLoading || messagesQuery.isLoading,
  }), [
    distressLevel,
    setDistressLevel,
    safetyModeActive,
    activateSafetyMode,
    deactivateSafetyMode,
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    messageDrafts,
    addMessageDraft,
    updateMessageDraft,
    triggerPatterns,
    journalQuery.isLoading,
    messagesQuery.isLoading,
  ]);
});
