import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { AIConversation, AIMessage, SuggestedPrompt, SupportiveInterpretation } from '@/types/ai';
import { SafetyAssessment } from '@/types/aiSafety';
import { AIMode } from '@/types/aiModes';
import { MemoryProfile, InsightCard } from '@/types/memory';
import { MemorySnapshot } from '@/types/userMemory';
import { CompanionMemoryStore, UserPsychProfile, WeeklyCompanionInsight, EnhancedCompanionMemoryStore } from '@/types/companionMemory';
import { useApp } from '@/providers/AppProvider';
import { generateConversationTitle } from '@/services/ai/mockAIService';
import { generateCompanionResponse } from '@/services/companion/companionAIService';
import { buildMemoryProfile, buildInsightCards, buildContextSummary } from '@/services/memory/memoryProfileService';
import { buildConversationTags } from '@/services/ai/aiPromptBuilder';
import { generateSupportiveInterpretations } from '@/services/insights/aiInsightsService';
import { conversationRepository } from '@/services/repositories';
import { getModeConfig } from '@/services/ai/aiModeService';
import { loadMemorySnapshot } from '@/services/memory/userMemoryService';
import {
  loadMemoryStore,
  saveMemoryStore,
  addShortTermMemory,
  shouldCreateMemory,
  detectEmotionalState,
  deleteMemoryById,
  editEpisodicMemoryLesson,
  loadEnhancedMemoryStore,
  saveEnhancedMemoryStore,
  logMemoryReference,
  mergeBaseIntoEnhanced,
} from '@/services/companion/memoryService';
import {
  processConversationIntoEnhancedMemory,
} from '@/services/companion/companionMemoryExtractor';
import {
  loadPsychProfile,
  savePsychProfile,
  rebuildPsychProfile,
} from '@/services/companion/userPsychProfile';
import {
  generateSessionSummary,
  processSessionIntoMemories,
} from '@/services/companion/sessionSummaryService';
import {
  generateCompanionPatternInsights,
  CompanionPatternInsight,
} from '@/services/companion/patternInsightService';
import {
  loadWeeklyInsights,
  saveWeeklyInsights,
  shouldGenerateWeeklyInsight,
  generateWeeklyInsight,
} from '@/services/companion/weeklyInsightService';

import { trackEvent } from '@/services/analytics/analyticsService';
import { assembleCompanionContext } from '@/services/companion/contextAssembler';
import { buildLiveEmotionalContext } from '@/services/companion/emotionalContextService';
import { getEnhancedOutcomes } from '@/services/messages/enhancedOutcomeService';
import { EnhancedMessageOutcome } from '@/types/messageOutcome';
import { SmartJournalEntry } from '@/types/journalEntry';
import { journalEntryRepository } from '@/services/journal/journalEntryRepository';
import { selectCompanionMode } from '@/services/companion/companionPromptBuilder';
import { CompanionMode, FollowUpPrompt } from '@/types/companionModes';
import {
  loadFollowUps,
  dismissFollowUp as dismissFollowUpService,
  createFollowUp,
  shouldCreateFollowUp,
} from '@/services/companion/followUpService';
import {
  createOutcomeRecord,
  saveOutcome,
} from '@/services/companion/outcomeLearningService';
import {
  runMemoryLifecycle,
  shouldRunLifecycle,
} from '@/services/companion/memoryLifecycleService';
import { contextCache } from '@/services/companion/contextCacheService';

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: 'sp1', label: 'I feel abandoned right now', icon: '💔', prompt: 'I feel abandoned right now and I need support' },
  { id: 'sp2', label: 'Help me calm down', icon: '🌊', prompt: 'Help me slow down, everything feels overwhelming right now' },
  { id: 'sp3', label: 'Am I overreacting?', icon: '🤔', prompt: 'I can\'t tell if I\'m overreacting to something. Help me figure out what\'s real.' },
  { id: 'sp4', label: 'Help me before I text', icon: '📱', prompt: 'I want to send a message and I\'m not calm right now. Help me pause and think clearly.' },
  { id: 'sp5', label: 'After a conflict', icon: '🩹', prompt: 'I just had a conflict and I feel terrible about how I handled it. Help me process what happened.' },
  { id: 'sp6', label: 'My patterns lately', icon: '🔄', prompt: 'Based on what you know about me, what patterns do you notice in my emotions and triggers lately?' },
  { id: 'sp7', label: 'What do I actually need?', icon: '🔍', prompt: 'Help me figure out what I actually need right now — I\'m not sure if it\'s reassurance, space, or something else.' },
  { id: 'sp8', label: 'Late night spiral', icon: '🌙', prompt: 'It\'s late and my thoughts are spiraling. Help me get through tonight.' },
];

export const [AICompanionProvider, useAICompanion] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { journalEntries, triggerPatterns, messageDrafts } = useApp();

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [manualMode, setManualMode] = useState<AIMode | null>(null);
  const [currentActiveMode, setCurrentActiveMode] = useState<AIMode | null>(null);
  const [memorySnapshot, setMemorySnapshot] = useState<MemorySnapshot | null>(null);
  const [companionMemoryStore, setCompanionMemoryStore] = useState<CompanionMemoryStore | null>(null);
  const [psychProfile, setPsychProfile] = useState<UserPsychProfile | null>(null);
  const [companionPatternInsights, setCompanionPatternInsights] = useState<CompanionPatternInsight[]>([]);
  const [weeklyInsights, setWeeklyInsights] = useState<WeeklyCompanionInsight[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpPrompt[]>([]);
  const [companionMode, setCompanionMode] = useState<CompanionMode | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [latestSafetyAssessment, setLatestSafetyAssessment] = useState<SafetyAssessment | null>(null);
  const processedConversationsRef = useRef<Set<string>>(new Set());
  const [smartJournalEntries, setSmartJournalEntries] = useState<SmartJournalEntry[]>([]);
  const [messageOutcomes, setMessageOutcomes] = useState<EnhancedMessageOutcome[]>([]);
  const [enhancedMemoryStore, setEnhancedMemoryStore] = useState<EnhancedCompanionMemoryStore | null>(null);

  const smartJournalQuery = useQuery({
    queryKey: ['companion-smart-journal'],
    queryFn: () => journalEntryRepository.getAll(),
    staleTime: 60000,
  });

  useEffect(() => {
    if (smartJournalQuery.data) {
      setSmartJournalEntries(smartJournalQuery.data);
    }
  }, [smartJournalQuery.data]);

  const messageOutcomesQuery = useQuery({
    queryKey: ['companion-message-outcomes'],
    queryFn: getEnhancedOutcomes,
    staleTime: 60000,
  });

  useEffect(() => {
    if (messageOutcomesQuery.data) {
      setMessageOutcomes(messageOutcomesQuery.data);
    }
  }, [messageOutcomesQuery.data]);

  const memorySnapshotQuery = useQuery({
    queryKey: ['user-memory-snapshot'],
    queryFn: loadMemorySnapshot,
  });

  useEffect(() => {
    if (memorySnapshotQuery.data) {
      setMemorySnapshot(memorySnapshotQuery.data);
    }
  }, [memorySnapshotQuery.data]);

  const companionMemoryQuery = useQuery({
    queryKey: ['companion-memory-store'],
    queryFn: loadMemoryStore,
  });

  const enhancedMemoryQuery = useQuery({
    queryKey: ['companion-enhanced-memory'],
    queryFn: loadEnhancedMemoryStore,
  });

  useEffect(() => {
    if (enhancedMemoryQuery.data) {
      setEnhancedMemoryStore(enhancedMemoryQuery.data);
      console.log('[AICompanion] Loaded enhanced memory:', enhancedMemoryQuery.data.relationships.length, 'relationships,', enhancedMemoryQuery.data.copingPreferences.length, 'coping prefs,', enhancedMemoryQuery.data.strugglesAndWins.length, 'struggles/wins');
    }
  }, [enhancedMemoryQuery.data]);

  useEffect(() => {
    if (companionMemoryQuery.data) {
      let store = companionMemoryQuery.data;
      if (shouldRunLifecycle(store)) {
        const { store: cleanedStore, report } = runMemoryLifecycle(store);
        store = cleanedStore;
        if (report.totalRemoved > 0) {
          void saveMemoryStore(store);
          void trackEvent('memory_lifecycle_run', {
            short_term_removed: report.shortTermRemoved,
            episodic_removed: report.episodicRemoved,
            semantic_removed: report.semanticRemoved,
            semantic_decayed: report.semanticDecayed,
            total_removed: report.totalRemoved,
          });
          console.log('[AICompanion] Memory lifecycle cleaned up', report.totalRemoved, 'memories');
        }
      }
      setCompanionMemoryStore(store);
      const insights = generateCompanionPatternInsights(store);
      setCompanionPatternInsights(insights);
      console.log('[AICompanion] Loaded companion memory store,', insights.length, 'pattern insights');
    }
  }, [companionMemoryQuery.data]);

  const psychProfileQuery = useQuery({
    queryKey: ['companion-psych-profile'],
    queryFn: loadPsychProfile,
  });

  useEffect(() => {
    if (psychProfileQuery.data) {
      setPsychProfile(psychProfileQuery.data);
    }
  }, [psychProfileQuery.data]);

  const weeklyInsightsQuery = useQuery({
    queryKey: ['companion-weekly-insights'],
    queryFn: loadWeeklyInsights,
  });

  useEffect(() => {
    if (weeklyInsightsQuery.data) {
      setWeeklyInsights(weeklyInsightsQuery.data);
      if (companionMemoryStore && shouldGenerateWeeklyInsight(weeklyInsightsQuery.data)) {
        const newInsight = generateWeeklyInsight(companionMemoryStore);
        if (newInsight) {
          const updated = [newInsight, ...weeklyInsightsQuery.data].slice(0, 12);
          setWeeklyInsights(updated);
          void saveWeeklyInsights(updated);
          void trackEvent('weekly_insight_generated');
          console.log('[AICompanion] Generated new weekly insight');
        }
      }
    }
  }, [weeklyInsightsQuery.data, companionMemoryStore]);

  const followUpsQuery = useQuery({
    queryKey: ['companion-follow-ups'],
    queryFn: loadFollowUps,
  });

  useEffect(() => {
    if (followUpsQuery.data) {
      setFollowUps(followUpsQuery.data);
    }
  }, [followUpsQuery.data]);

  const conversationsQuery = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => conversationRepository.getAll(),
  });

  useEffect(() => {
    if (conversationsQuery.data) {
      setConversations(conversationsQuery.data);
    }
  }, [conversationsQuery.data]);

  const saveConversationsMutation = useMutation({
    mutationFn: (convos: AIConversation[]) => conversationRepository.save(convos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
  });

  const memoryProfile = useMemo<MemoryProfile>(() => {
    return buildMemoryProfile(
      journalEntries,
      triggerPatterns.triggerCounts,
      triggerPatterns.emotionCounts,
      triggerPatterns.urgeCounts,
      messageDrafts,
    );
  }, [journalEntries, triggerPatterns, messageDrafts]);

  const insightCards = useMemo<InsightCard[]>(() => {
    return buildInsightCards(memoryProfile);
  }, [memoryProfile]);

  const _contextSummary = useMemo(() => {
    return buildContextSummary(memoryProfile);
  }, [memoryProfile]);

  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConversationId) ?? null;
  }, [conversations, activeConversationId]);

  const savedConversations = useMemo(() => {
    return conversations.filter(c => c.saved);
  }, [conversations]);

  const recentConversations = useMemo(() => {
    return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  }, [conversations]);

  const startNewConversation = useCallback(() => {
    const newConvo: AIConversation = {
      id: `conv_${Date.now()}`,
      title: 'New conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      saved: false,
      preview: '',
      tags: [],
    };
    const updated = [newConvo, ...conversations];
    setConversations(updated);
    setActiveConversationId(newConvo.id);
    saveConversationsMutation.mutate(updated);
    return newConvo.id;
  }, [conversations, saveConversationsMutation]);

  const continueLastConversation = useCallback(() => {
    if (conversations.length > 0) {
      const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
      setActiveConversationId(sorted[0].id);
      return sorted[0].id;
    }
    return startNewConversation();
  }, [conversations, startNewConversation]);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversationId || isGenerating) return;

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const currentConvo = conversations.find(c => c.id === activeConversationId);
    const conversationHistory = (currentConvo?.messages ?? []).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const updatedConvos = conversations.map(c => {
      if (c.id === activeConversationId) {
        const isFirst = c.messages.length === 0;
        const newTags = buildConversationTags(content);
        const existingTags = c.tags ?? [];
        const mergedTags = [...new Set([...existingTags, ...newTags])].slice(0, 6);
        return {
          ...c,
          messages: [...c.messages, userMessage],
          title: isFirst ? generateConversationTitle(content) : c.title,
          preview: content.substring(0, 80),
          updatedAt: Date.now(),
          tags: mergedTags,
        };
      }
      return c;
    });

    setConversations(updatedConvos);
    setIsGenerating(true);

    if (companionMemoryStore) {
      const storeWithShortTerm = addShortTermMemory(
        companionMemoryStore,
        content.substring(0, 200),
        buildConversationTags(content),
        activeConversationId,
      );
      setCompanionMemoryStore(storeWithShortTerm);
      void trackEvent('companion_session_started', { conversation_id: activeConversationId });
    }

    const assembled = assembleCompanionContext({
      userMessage: content,
      memoryStore: companionMemoryStore,
      enhancedMemoryStore,
      psychProfile,
      memoryProfile,
      patternInsights: companionPatternInsights,
      weeklyInsights,
      conversationHistory,
      conversationId: activeConversationId,
    });

    const liveContext = buildLiveEmotionalContext({
      journalEntries,
      messageDrafts,
      memoryProfile,
      memoryStore: companionMemoryStore,
      weeklyInsights,
      patternInsights: companionPatternInsights,
      smartJournalEntries,
      messageOutcomes,
    });
    assembled.liveContextNarrative = liveContext.contextNarrative;

    const detectedMode = selectCompanionMode(
      content,
      assembled.emotionalState,
      manualMode as CompanionMode | null,
      conversationHistory.length,
    );
    setCompanionMode(detectedMode);

    if (assembled.retrievedMemories && assembled.retrievedMemories.relevantEpisodes.length > 0) {
      void trackEvent('memory_recalled', {
        episodes: assembled.retrievedMemories.relevantEpisodes.length,
        traits: assembled.retrievedMemories.relevantTraits.length,
        relationships: assembled.retrievedMemories.relevantRelationships?.length ?? 0,
        struggles_wins: assembled.retrievedMemories.recentStrugglesAndWins?.length ?? 0,
        mode: detectedMode,
      });

      if (enhancedMemoryStore) {
        let updatedEnhanced = enhancedMemoryStore;
        for (const ep of assembled.retrievedMemories.relevantEpisodes) {
          updatedEnhanced = logMemoryReference(updatedEnhanced, ep.id, 'episodic', activeConversationId);
        }
        for (const rel of (assembled.retrievedMemories.relevantRelationships ?? [])) {
          updatedEnhanced = logMemoryReference(updatedEnhanced, rel.id, 'relationship', activeConversationId);
        }
        setEnhancedMemoryStore(updatedEnhanced);
      }
    }

    try {
      const response = await generateCompanionResponse({
        userMessage: content,
        conversationHistory,
        assembledContext: assembled,
        detectedMode,
        manualMode,
        memoryProfile,
        memorySnapshot,
      });

      setCurrentActiveMode(response.activeMode);
      setSessionCount(prev => prev + 1);

      if (response.safetyAssessment) {
        setLatestSafetyAssessment(response.safetyAssessment);
        console.log('[AICompanion] Safety assessment surfaced:', response.safetyAssessment.level);
      } else {
        setLatestSafetyAssessment(null);
      }

      if (response.costMetrics) {
        console.log('[AICompanion] Cost metrics:', response.costMetrics);
      }

      contextCache.invalidate(activeConversationId);

      console.log('[AICompanion] Response mode:', response.activeMode, 'companion mode:', detectedMode, 'manual:', !!manualMode);

      const assistantMessage: AIMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: response.content,
        timestamp: response.timestamp,
        quickActions: response.quickActions,
        intent: response.intent,
      };

      const finalConvos = updatedConvos.map(c => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            messages: [...c.messages, assistantMessage],
            updatedAt: Date.now(),
          };
        }
        return c;
      });

      setConversations(finalConvos);
      saveConversationsMutation.mutate(finalConvos);

      const updatedConvo = finalConvos.find(c => c.id === activeConversationId);
      if (updatedConvo && companionMemoryStore && !processedConversationsRef.current.has(activeConversationId)) {
        const allMessages = updatedConvo.messages.map(m => ({ role: m.role, content: m.content }));
        if (shouldCreateMemory(allMessages)) {
          const summary = generateSessionSummary(activeConversationId, allMessages);
          if (summary) {
            const updatedStore = processSessionIntoMemories(companionMemoryStore, summary);
            setCompanionMemoryStore(updatedStore);
            void saveMemoryStore(updatedStore);
            processedConversationsRef.current.add(activeConversationId);
            void trackEvent('memory_created', {
              conversation_id: activeConversationId,
              has_trigger: !!summary.trigger,
              has_insight: !!summary.insight,
              skills_practiced: summary.skillsPracticed.length,
            });
            console.log('[AICompanion] Created memory from conversation');

            const updatedProfile = rebuildPsychProfile(updatedStore);
            setPsychProfile(updatedProfile);
            void savePsychProfile(updatedProfile);

            const newInsights = generateCompanionPatternInsights(updatedStore);
            setCompanionPatternInsights(newInsights);
            if (newInsights.length > 0) {
              void trackEvent('pattern_insight_generated', { count: newInsights.length });
            }
          }
        }

        if (enhancedMemoryStore) {
          const baseEnhanced = mergeBaseIntoEnhanced(companionMemoryStore, enhancedMemoryStore);
          const updatedEnhanced = processConversationIntoEnhancedMemory(baseEnhanced, allMessages);
          setEnhancedMemoryStore(updatedEnhanced);
          void saveEnhancedMemoryStore(updatedEnhanced);

          const newRels = updatedEnhanced.relationships.length - (enhancedMemoryStore.relationships?.length ?? 0);
          const newCoping = updatedEnhanced.copingPreferences.length - (enhancedMemoryStore.copingPreferences?.length ?? 0);
          const newSW = updatedEnhanced.strugglesAndWins.length - (enhancedMemoryStore.strugglesAndWins?.length ?? 0);
          if (newRels > 0 || newCoping > 0 || newSW > 0) {
            void trackEvent('enhanced_memory_updated', {
              new_relationships: newRels,
              new_coping_prefs: newCoping,
              new_struggles_wins: newSW,
              total_relationships: updatedEnhanced.relationships.length,
              total_coping_prefs: updatedEnhanced.copingPreferences.length,
              total_struggles_wins: updatedEnhanced.strugglesAndWins.length,
            });
            console.log('[AICompanion] Enhanced memory updated:', newRels, 'new relationships,', newCoping, 'new coping,', newSW, 'new struggles/wins');
          }
        }
      }

      const signals = companionMemoryStore
        ? { isHighDistress: assembled.emotionalState === 'high_distress', isRelationship: assembled.emotionalState === 'relationship_trigger' || assembled.emotionalState === 'abandonment_fear' }
        : { isHighDistress: false, isRelationship: false };

      const followUpType = shouldCreateFollowUp(
        detectEmotionalState(content),
        conversationHistory.length + 2,
        signals.isHighDistress,
        signals.isRelationship,
        false,
      );

      if (followUpType) {
        void createFollowUp(followUpType, content.substring(0, 100)).then(fu => {
          if (fu) {
            setFollowUps(prev => [fu, ...prev].slice(0, 5));
            void trackEvent('companion_followup_created', { type: followUpType });
          }
        });
      }
    } catch (error) {
      console.log('Error generating AI response:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [activeConversationId, isGenerating, conversations, saveConversationsMutation, memoryProfile, manualMode, memorySnapshot, companionMemoryStore, enhancedMemoryStore, psychProfile, companionPatternInsights, weeklyInsights, journalEntries, messageDrafts, smartJournalEntries, messageOutcomes]);

  const toggleSaveConversation = useCallback((conversationId: string) => {
    const updated = conversations.map(c =>
      c.id === conversationId ? { ...c, saved: !c.saved } : c
    );
    setConversations(updated);
    saveConversationsMutation.mutate(updated);
  }, [conversations, saveConversationsMutation]);

  const deleteConversation = useCallback((conversationId: string) => {
    const updated = conversations.filter(c => c.id !== conversationId);
    setConversations(updated);
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
    saveConversationsMutation.mutate(updated);
  }, [conversations, activeConversationId, saveConversationsMutation]);

  const supportiveInterpretations = useMemo<SupportiveInterpretation[]>(() => {
    return generateSupportiveInterpretations(memoryProfile);
  }, [memoryProfile]);

  const setMode = useCallback((mode: AIMode | null) => {
    console.log('[AICompanion] Manual mode set to:', mode);
    setManualMode(mode);
    if (mode) {
      setCurrentActiveMode(mode);
    }
  }, []);

  const dismissFollowUp = useCallback(async (followUpId: string) => {
    await dismissFollowUpService(followUpId);
    setFollowUps(prev => prev.filter(f => f.id !== followUpId));
    void trackEvent('companion_followup_dismissed', { follow_up_id: followUpId });
  }, []);

  const openFollowUp = useCallback((followUp: FollowUpPrompt) => {
    const id = startNewConversation();
    setActiveConversationId(id);
    void dismissFollowUpService(followUp.id);
    setFollowUps(prev => prev.filter(f => f.id !== followUp.id));
    setTimeout(() => {
      void sendMessage(followUp.suggestedPrompt);
    }, 300);
    void trackEvent('companion_followup_opened', {
      type: followUp.type,
      trigger_context: followUp.triggerContext.substring(0, 50),
    });
  }, [startNewConversation, setActiveConversationId, sendMessage]);

  const recordOutcome = useCallback(async (params: {
    sourceFlow: string;
    toolSuggested: string;
    distressBefore?: number;
    distressAfter?: number;
    markedHelpful?: boolean;
    emotionalContext: string;
    tags?: string[];
  }) => {
    const outcome = createOutcomeRecord(params);
    await saveOutcome(outcome);
    console.log('[AICompanion] Outcome recorded:', params.sourceFlow, params.toolSuggested);
  }, []);

  const deleteMemory = useCallback(async (memoryId: string) => {
    if (!companionMemoryStore) return;
    const updated = deleteMemoryById(companionMemoryStore, memoryId);
    setCompanionMemoryStore(updated);
    await saveMemoryStore(updated);
    void trackEvent('memory_deleted', { memory_id: memoryId });
    console.log('[AICompanion] Memory deleted:', memoryId);
  }, [companionMemoryStore]);

  const editMemoryLesson = useCallback(async (memoryId: string, newLesson: string) => {
    if (!companionMemoryStore) return;
    const updated = editEpisodicMemoryLesson(companionMemoryStore, memoryId, newLesson);
    setCompanionMemoryStore(updated);
    await saveMemoryStore(updated);
    console.log('[AICompanion] Memory lesson edited:', memoryId);
  }, [companionMemoryStore]);

  const currentModeConfig = useMemo(() => {
    if (currentActiveMode) {
      return getModeConfig(currentActiveMode);
    }
    return null;
  }, [currentActiveMode]);

  return useMemo(() => ({
    conversations,
    activeConversation,
    activeConversationId,
    savedConversations,
    recentConversations,
    isGenerating,
    memoryProfile,
    insightCards,
    supportiveInterpretations,
    isLoading: conversationsQuery.isLoading,
    manualMode,
    currentActiveMode,
    currentModeConfig,
    companionPatternInsights,
    weeklyInsights,
    psychProfile,
    companionMemoryStore,
    followUps,
    companionMode,
    sessionCount,
    latestSafetyAssessment,
    deleteMemory,
    editMemoryLesson,
    setActiveConversationId,
    startNewConversation,
    continueLastConversation,
    sendMessage,
    toggleSaveConversation,
    deleteConversation,
    setMode,
    dismissFollowUp,
    openFollowUp,
    recordOutcome,
  }), [
    conversations,
    activeConversation,
    activeConversationId,
    savedConversations,
    recentConversations,
    isGenerating,
    memoryProfile,
    insightCards,
    supportiveInterpretations,
    conversationsQuery.isLoading,
    manualMode,
    currentActiveMode,
    currentModeConfig,
    companionPatternInsights,
    weeklyInsights,
    psychProfile,
    companionMemoryStore,
    followUps,
    companionMode,
    sessionCount,
    latestSafetyAssessment,
    deleteMemory,
    editMemoryLesson,
    setActiveConversationId,
    startNewConversation,
    continueLastConversation,
    sendMessage,
    toggleSaveConversation,
    deleteConversation,
    setMode,
    dismissFollowUp,
    openFollowUp,
    recordOutcome,
  ]);
});
