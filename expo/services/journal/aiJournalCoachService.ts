import { generateText } from '@rork-ai/toolkit-sdk';
import { AIJournalMode, AI_JOURNAL_MODE_CONFIG, AIJournalMessage, AIJournalSessionSummary } from '@/types/journalDaily';
import { SmartJournalEntry } from '@/types/journalEntry';

export async function generateAIJournalResponse(
  mode: AIJournalMode,
  messages: AIJournalMessage[],
  recentEntries: SmartJournalEntry[] = [],
): Promise<string> {
  console.log('[AIJournalCoach] Generating response for mode:', mode, 'messages:', messages.length);

  const config = AI_JOURNAL_MODE_CONFIG[mode];

  const recentContext = recentEntries.slice(0, 3).map(e => {
    const emotions = e.emotions.map(em => em.label).join(', ');
    const triggers = e.triggers.map(t => t.label).join(', ');
    return `[${new Date(e.timestamp).toLocaleDateString()}] Distress: ${e.distressLevel}/10${emotions ? `, Emotions: ${emotions}` : ''}${triggers ? `, Triggers: ${triggers}` : ''}`;
  }).join('\n');

  const systemMessage = `You are a compassionate, intelligent journaling guide for someone managing BPD (Borderline Personality Disorder).

Mode: ${config.label}
Context: ${config.systemContext}

${recentContext ? `Recent journal context:\n${recentContext}\n` : ''}

RESPONSE RULES:
- Respond specifically to what the user wrote. Reference their exact words.
- Keep responses to 2-4 sentences, then ask ONE focused follow-up question.
- Offer a useful emotional or interpersonal insight when appropriate.
- Use soft, validating language but be specific, not generic.
- AVOID: "Tell me more", "I'm here for you", "Thank you for sharing", "How does that make you feel?" unless very specific.
- When you notice patterns, use language like: "this sounds similar to", "you've mentioned before", "this may connect to"
- If distress seems high, simplify and shorten your response.
- If you notice a cognitive distortion, name it gently.
- Always end with one specific, useful question.`;

  const chatMessages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: systemMessage },
    { role: 'assistant', content: 'Understood. I will follow these guidelines.' },
  ];

  const recentMessages = messages.slice(-8);
  recentMessages.forEach(m => {
    chatMessages.push({ role: m.role, content: m.content });
  });

  try {
    const response = await generateText({ messages: chatMessages });
    console.log('[AIJournalCoach] Response generated successfully');
    return response;
  } catch (error) {
    console.error('[AIJournalCoach] Generation failed:', error);
    return 'I want to understand what you\'re going through. Could you share a bit more about what happened?';
  }
}

export async function generateSessionSummary(
  messages: AIJournalMessage[]
): Promise<AIJournalSessionSummary> {
  console.log('[AIJournalCoach] Generating session summary from', messages.length, 'messages');

  const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n');

  try {
    const summaryText = await generateText({
      messages: [
        {
          role: 'user',
          content: `Summarize this journaling session concisely. Extract:
1. Main trigger (if any)
2. Core emotion
3. Key interpretation the person made
4. Most important insight
5. One suggested next step

Conversation:
${conversation.slice(0, 3000)}

Format your response as:
TRIGGER: [trigger or "none identified"]
EMOTION: [core emotion]
INTERPRETATION: [key interpretation]
INSIGHT: [main insight]
NEXT STEP: [suggested action]`,
        },
      ],
    });

    const lines = summaryText.split('\n');
    const extract = (prefix: string): string | undefined => {
      const line = lines.find(l => l.startsWith(prefix));
      const value = line?.replace(prefix, '').trim();
      return value && value !== 'none identified' ? value : undefined;
    };

    return {
      trigger: extract('TRIGGER:'),
      coreEmotion: extract('EMOTION:'),
      interpretation: extract('INTERPRETATION:'),
      insight: extract('INSIGHT:'),
      suggestedNextStep: extract('NEXT STEP:'),
      generatedAt: Date.now(),
    };
  } catch (error) {
    console.error('[AIJournalCoach] Summary generation failed:', error);
    return { generatedAt: Date.now() };
  }
}
