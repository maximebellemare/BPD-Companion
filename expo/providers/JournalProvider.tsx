import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  SmartJournalEntry,
  JournalEntryFormat,
  JournalAIInsight,
  JournalPatternResult,
  JournalWeeklyReport,
  JournalStats,
} from '@/types/journalEntry';
import { DailyReflection, DailyReflectionStreak, JournalPrediction } from '@/types/journalDaily';
import { Emotion, Trigger } from '@/types';
import { SafetyAssessment } from '@/types/aiSafety';
import { journalEntryRepository } from '@/services/journal/journalEntryRepository';
import {
  analyzeJournalEntry,
  detectJournalPatterns,
  generateWeeklyJournalReport,
  computeJournalStats,
} from '@/services/journal/journalAnalysisService';
import { dailyReflectionRepository, computeReflectionStreak } from '@/services/journal/dailyReflectionRepository';
import { generateJournalPredictions } from '@/services/journal/journalPredictionService';

function generateId(): string {
  return `sj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export const [JournalProvider, useJournal] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [smartEntries, setSmartEntries] = useState<SmartJournalEntry[]>([]);
  const [dailyReflections, setDailyReflections] = useState<DailyReflection[]>([]);
  const [latestJournalSafetyAssessment, setLatestJournalSafetyAssessment] = useState<SafetyAssessment | null>(null);

  const entriesQuery = useQuery({
    queryKey: ['smart_journal'],
    queryFn: () => journalEntryRepository.getAll(),
  });

  const reflectionsQuery = useQuery({
    queryKey: ['daily_reflections'],
    queryFn: () => dailyReflectionRepository.getAll(),
  });

  useEffect(() => {
    if (entriesQuery.data) {
      setSmartEntries(entriesQuery.data);
    }
  }, [entriesQuery.data]);

  useEffect(() => {
    if (reflectionsQuery.data) {
      setDailyReflections(reflectionsQuery.data);
    }
  }, [reflectionsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (entries: SmartJournalEntry[]) => journalEntryRepository.save(entries),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['smart_journal'] });
    },
  });

  const saveReflectionsMutation = useMutation({
    mutationFn: (items: DailyReflection[]) => dailyReflectionRepository.save(items),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['daily_reflections'] });
    },
  });

  const addEntry = useCallback((params: {
    format: JournalEntryFormat;
    title?: string;
    content: string;
    emotions: Emotion[];
    triggers: Trigger[];
    distressLevel: number;
    notes?: string;
    guidedFlowId?: string;
    guidedResponses?: Record<string, string>;
    voiceRecordingUri?: string;
    transcript?: string;
  }): SmartJournalEntry => {
    const now = Date.now();
    const entry: SmartJournalEntry = {
      id: generateId(),
      timestamp: now,
      format: params.format,
      title: params.title,
      content: params.content,
      emotions: params.emotions,
      triggers: params.triggers,
      tags: [],
      distressLevel: params.distressLevel,
      notes: params.notes,
      guidedFlowId: params.guidedFlowId,
      guidedResponses: params.guidedResponses,
      isImportant: false,
      isTherapyNote: false,
      voiceRecordingUri: params.voiceRecordingUri,
      transcript: params.transcript,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [entry, ...smartEntries];
    setSmartEntries(updated);
    saveMutation.mutate(updated);
    console.log('[JournalProvider] Added entry:', entry.id, entry.format);
    return entry;
  }, [smartEntries, saveMutation]);

  const updateEntry = useCallback((id: string, updates: Partial<SmartJournalEntry>) => {
    const updated = smartEntries.map(e =>
      e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
    );
    setSmartEntries(updated);
    saveMutation.mutate(updated);
  }, [smartEntries, saveMutation]);

  const deleteEntry = useCallback((id: string) => {
    const updated = smartEntries.filter(e => e.id !== id);
    setSmartEntries(updated);
    saveMutation.mutate(updated);
  }, [smartEntries, saveMutation]);

  const toggleImportant = useCallback((id: string) => {
    const entry = smartEntries.find(e => e.id === id);
    if (entry) {
      updateEntry(id, { isImportant: !entry.isImportant });
    }
  }, [smartEntries, updateEntry]);

  const toggleTherapyNote = useCallback((id: string) => {
    const entry = smartEntries.find(e => e.id === id);
    if (entry) {
      updateEntry(id, { isTherapyNote: !entry.isTherapyNote });
    }
  }, [smartEntries, updateEntry]);

  const setAIInsight = useCallback((id: string, insight: JournalAIInsight) => {
    updateEntry(id, { aiInsight: insight });
  }, [updateEntry]);

  const analyzeEntryMutation = useMutation({
    mutationFn: async (entry: SmartJournalEntry) => {
      const result = await analyzeJournalEntry(entry);
      setAIInsight(entry.id, result.insight);
      if (result.safetyAssessment) {
        setLatestJournalSafetyAssessment(result.safetyAssessment);
        console.log('[JournalProvider] Safety assessment from journal analysis:', result.safetyAssessment.level);
      } else {
        setLatestJournalSafetyAssessment(null);
      }
      return result.insight;
    },
  });

  const addDailyReflection = useCallback((reflection: Omit<DailyReflection, 'id' | 'timestamp' | 'date'>) => {
    const now = Date.now();
    const newReflection: DailyReflection = {
      ...reflection,
      id: `dr_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      date: getTodayStr(),
    };
    const updated = [newReflection, ...dailyReflections];
    setDailyReflections(updated);
    saveReflectionsMutation.mutate(updated);
    console.log('[JournalProvider] Added daily reflection:', newReflection.type);
    return newReflection;
  }, [dailyReflections, saveReflectionsMutation]);

  const todayReflections = useMemo(() => {
    const today = getTodayStr();
    return {
      morning: dailyReflections.find(r => r.date === today && r.type === 'morning'),
      evening: dailyReflections.find(r => r.date === today && r.type === 'evening'),
    };
  }, [dailyReflections]);

  const reflectionStreak = useMemo<DailyReflectionStreak>(
    () => computeReflectionStreak(dailyReflections),
    [dailyReflections]
  );

  const predictions = useMemo<JournalPrediction[]>(
    () => generateJournalPredictions(smartEntries),
    [smartEntries]
  );

  const stats = useMemo<JournalStats>(
    () => computeJournalStats(smartEntries),
    [smartEntries]
  );

  const patterns = useMemo<JournalPatternResult>(
    () => detectJournalPatterns(smartEntries, 30),
    [smartEntries]
  );

  const weeklyReport = useMemo<JournalWeeklyReport | null>(
    () => generateWeeklyJournalReport(smartEntries),
    [smartEntries]
  );

  return useMemo(() => ({
    smartEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleImportant,
    toggleTherapyNote,
    analyzeEntry: analyzeEntryMutation.mutateAsync,
    isAnalyzing: analyzeEntryMutation.isPending,
    latestJournalSafetyAssessment,
    dailyReflections,
    addDailyReflection,
    todayReflections,
    reflectionStreak,
    predictions,
    stats,
    patterns,
    weeklyReport,
    isLoading: entriesQuery.isLoading,
  }), [
    smartEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleImportant,
    toggleTherapyNote,
    analyzeEntryMutation.mutateAsync,
    analyzeEntryMutation.isPending,
    latestJournalSafetyAssessment,
    dailyReflections,
    addDailyReflection,
    todayReflections,
    reflectionStreak,
    predictions,
    stats,
    patterns,
    weeklyReport,
    entriesQuery.isLoading,
  ]);
});
