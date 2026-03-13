import {
  SessionSummary,
  CompanionMemoryStore,
} from '@/types/companionMemory';
import {
  extractConversationSignals,
  detectEmotionalState,
  addEpisodicMemory,
  upsertSemanticMemory,
  addSessionSummary,
} from './memoryService';

export function generateSessionSummary(
  conversationId: string,
  messages: Array<{ role: string; content: string }>,
): SessionSummary | null {
  if (messages.length < 4) return null;

  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length < 2) return null;

  const signals = extractConversationSignals(messages);
  const lastUserMessage = userMessages[userMessages.length - 1].content;
  const emotionalState = detectEmotionalState(lastUserMessage);

  const trigger = signals.triggers[0];
  const emotion = signals.emotions[0];
  const isHighDistress = signals.isHighDistress;

  let outcome: string | undefined;
  if (signals.hasInsight) {
    outcome = 'gained insight';
  } else if (signals.hasCopingMention) {
    outcome = 'used coping';
  } else if (isHighDistress) {
    outcome = 'high distress - supported';
  }

  let insight: string | undefined;
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const lastAssistant = assistantMessages[assistantMessages.length - 1];
  if (lastAssistant && signals.hasInsight) {
    const sentences = lastAssistant.content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      insight = sentences[sentences.length - 1].trim();
      if (insight.length > 120) {
        insight = insight.substring(0, 117) + '...';
      }
    }
  }

  const skillsPracticed: string[] = [];
  const allContent = messages.map(m => m.content.toLowerCase()).join(' ');
  if (allContent.includes('ground') || allContent.includes('5 things')) skillsPracticed.push('grounding');
  if (allContent.includes('breath') || allContent.includes('inhale') || allContent.includes('exhale')) skillsPracticed.push('breathing');
  if (allContent.includes('pause') || allContent.includes('wait before')) skillsPracticed.push('pause before acting');
  if (allContent.includes('reframe') || allContent.includes('different perspective')) skillsPracticed.push('reframing');
  if (allContent.includes('urge surf') || allContent.includes('ride the wave')) skillsPracticed.push('urge surfing');
  if (allContent.includes('self-compassion') || allContent.includes('kind to yourself')) skillsPracticed.push('self-compassion');

  const summary: SessionSummary = {
    id: '',
    conversationId,
    timestamp: Date.now(),
    trigger,
    emotion,
    outcome,
    insight,
    skillsPracticed,
    emotionalState,
  };

  console.log('[SessionSummary] Generated summary:', {
    trigger,
    emotion,
    outcome,
    skills: skillsPracticed.length,
    hasInsight: !!insight,
  });

  return summary;
}

export function processSessionIntoMemories(
  store: CompanionMemoryStore,
  summary: SessionSummary,
): CompanionMemoryStore {
  if (summary.trigger && summary.emotion) {
    store = addEpisodicMemory(store, {
      trigger: summary.trigger,
      emotion: summary.emotion,
      context: `Conversation session: ${summary.outcome ?? 'explored feelings'}`,
      outcome: summary.outcome,
      lesson: summary.insight,
      copingUsed: summary.skillsPracticed.length > 0 ? summary.skillsPracticed : undefined,
      relationshipContext: summary.emotionalState === 'relationship_trigger' || summary.emotionalState === 'abandonment_fear' || summary.emotionalState === 'recent_conflict'
        ? 'relationship-related conversation'
        : undefined,
      conversationId: summary.conversationId,
      tags: [
        summary.trigger.toLowerCase(),
        summary.emotion.toLowerCase(),
        summary.emotionalState,
      ],
    });
  }

  if (summary.trigger) {
    store = upsertSemanticMemory(
      store,
      `Trigger: ${summary.trigger}`,
      `Experienced "${summary.trigger}" during conversation`,
      [summary.trigger.toLowerCase(), 'trigger'],
    );
  }

  if (summary.skillsPracticed.length > 0) {
    for (const skill of summary.skillsPracticed) {
      store = upsertSemanticMemory(
        store,
        `Practices ${skill}`,
        `Used ${skill} during support conversation`,
        [skill.toLowerCase(), 'skill', 'coping'],
      );
    }
  }

  if (summary.insight) {
    store = upsertSemanticMemory(
      store,
      'Has self-awareness capacity',
      `Generated insight: "${summary.insight}"`,
      ['insight', 'growth', 'self-awareness'],
    );
  }

  store = addSessionSummary(store, summary);

  console.log('[SessionSummary] Processed session into memories');
  return store;
}
