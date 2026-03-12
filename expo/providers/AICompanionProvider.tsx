import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { AIConversation, AIMessage, SuggestedPrompt, SupportiveInterpretation } from '@/types/ai';
import { MemoryProfile, InsightCard } from '@/types/memory';
import { useApp } from '@/providers/AppProvider';
import { generateMockResponse, generateConversationTitle } from '@/services/ai/mockAIService';
import { buildMemoryProfile, buildInsightCards, buildContextSummary } from '@/services/memory/memoryProfileService';
import { buildConversationTags } from '@/services/ai/aiPromptBuilder';
import { generateSupportiveInterpretations } from '@/services/insights/aiInsightsService';
import { conversationRepository } from '@/services/repositories';

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: 'sp1', label: 'I feel abandoned right now', icon: '💔', prompt: 'I feel abandoned right now' },
  { id: 'sp2', label: 'Help me calm down', icon: '🌊', prompt: 'Help me calm down, I\'m overwhelmed' },
  { id: 'sp3', label: 'What am I feeling?', icon: '🔍', prompt: 'Help me understand what I\'m feeling right now' },
  { id: 'sp4', label: 'Rewrite a message', icon: '✏️', prompt: 'Help me rewrite a message I want to send' },
  { id: 'sp5', label: 'Relationship trigger', icon: '⚡', prompt: 'Talk me through this relationship trigger' },
  { id: 'sp6', label: 'My patterns lately', icon: '🔄', prompt: 'What pattern do you notice in my check-ins lately?' },
];

export const [AICompanionProvider, useAICompanion] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { journalEntries, triggerPatterns } = useApp();

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

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
    );
  }, [journalEntries, triggerPatterns]);

  const insightCards = useMemo<InsightCard[]>(() => {
    return buildInsightCards(memoryProfile);
  }, [memoryProfile]);

  const contextSummary = useMemo(() => {
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

    try {
      const response = await generateMockResponse(content, contextSummary);

      const assistantMessage: AIMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: response.content,
        timestamp: response.timestamp,
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
    } catch (error) {
      console.log('Error generating AI response:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [activeConversationId, isGenerating, conversations, contextSummary, saveConversationsMutation]);

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
    setActiveConversationId,
    startNewConversation,
    continueLastConversation,
    sendMessage,
    toggleSaveConversation,
    deleteConversation,
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
    setActiveConversationId,
    startNewConversation,
    continueLastConversation,
    sendMessage,
    toggleSaveConversation,
    deleteConversation,
  ]);
});
