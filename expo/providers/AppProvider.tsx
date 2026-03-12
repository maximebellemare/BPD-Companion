import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { JournalEntry, MessageDraft, DistressLevel } from '@/types';

const JOURNAL_KEY = 'steady_journal';
const MESSAGES_KEY = 'steady_messages';

export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [distressLevel, setDistressLevel] = useState<DistressLevel>('low');
  const [safetyModeActive, setSafetyModeActive] = useState<boolean>(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [messageDrafts, setMessageDrafts] = useState<MessageDraft[]>([]);

  const journalQuery = useQuery({
    queryKey: ['journal'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(JOURNAL_KEY);
      return stored ? JSON.parse(stored) as JournalEntry[] : [];
    },
  });

  const messagesQuery = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(MESSAGES_KEY);
      return stored ? JSON.parse(stored) as MessageDraft[] : [];
    },
  });

  useEffect(() => {
    if (journalQuery.data) {
      setJournalEntries(journalQuery.data);
    }
  }, [journalQuery.data]);

  useEffect(() => {
    if (messagesQuery.data) {
      setMessageDrafts(messagesQuery.data);
    }
  }, [messagesQuery.data]);

  const saveJournalMutation = useMutation({
    mutationFn: async (entries: JournalEntry[]) => {
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
      return entries;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });

  const saveMessagesMutation = useMutation({
    mutationFn: async (drafts: MessageDraft[]) => {
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(drafts));
      return drafts;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const addJournalEntry = useCallback((entry: JournalEntry) => {
    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    saveJournalMutation.mutate(updated);
  }, [journalEntries, saveJournalMutation]);

  const updateJournalEntry = useCallback((id: string, updates: Partial<JournalEntry>) => {
    const updated = journalEntries.map(e => e.id === id ? { ...e, ...updates } : e);
    setJournalEntries(updated);
    saveJournalMutation.mutate(updated);
  }, [journalEntries, saveJournalMutation]);

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
