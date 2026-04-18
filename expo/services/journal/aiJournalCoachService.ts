import { generateText } from '@rork-ai/toolkit-sdk';
import { AIJournalMode, AI_JOURNAL_MODE_CONFIG, AIJournalMessage, AIJournalSessionSummary } from '@/types/journalDaily';
import { SmartJournalEntry } from '@/types/journalEntry';
import {
  assessInputSafety,
  checkOutputSafety,
  augmentResponseWithSafety,
  buildSafetyPromptInjection,
} from '@/services/ai/aiSafetyService';

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

RESPONSE STRUCTURE:
1. REFLECT — Mirror back a specific word, phrase, or feeling from what the user wrote. Show you actually read it.
2. INSIGHT — Offer ONE observation that goes deeper than the surface. Name the emotion underneath the emotion, or the need underneath the behavior.
3. QUESTION — Ask ONE specific, focused question that moves the reflection forward. Not "how does that feel?" but something tied to their exact situation.

RESPONSE RULES:
- Reference their exact words or phrases when reflecting back.
- Keep responses to 2-4 sentences, then ONE focused follow-up question.
- Be specific, not generic. "That fear of not mattering to them" is better than "that difficult feeling."
- When you notice patterns from their recent entries, connect them naturally: "this sounds like it might connect to what you wrote about recently" or "I notice [emotion] keeps showing up alongside [trigger]."
- If distress is high (7+), simplify: validate in one sentence, offer one grounding suggestion, ask nothing complex.
- If you notice a cognitive distortion (black-and-white thinking, mind reading, catastrophizing), name it gently without clinical terms: "Your mind seems to be jumping to the worst version of this" instead of "that's catastrophizing."
- Sometimes suggest a practical tool: "This might be a good moment to try the message rewrite tool" or "Would it help to do a quick grounding exercise before continuing?"

ANTI-PATTERNS (never do these):
- Do NOT say "Tell me more", "I'm here for you", "Thank you for sharing", "How does that make you feel?"
- Do NOT start with "I hear you" or "That makes sense" — vary your openings
- Do NOT list multiple suggestions — pick ONE
- Do NOT end every response with a question — sometimes a reflection or validation is the right ending
- Do NOT use overly therapeutic language like "holding space" or "sitting with this"
- Do NOT offer premature positivity or silver linings when someone is in pain`;

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
  const safetyAssessment = assessInputSafety(lastUserMessage);
  if (safetyAssessment.level !== 'safe') {
    console.log('[AIJournalCoach] Safety concern detected:', safetyAssessment.level, safetyAssessment.signals.map(s => s.type).join(','));
  }

  const safetyInjection = buildSafetyPromptInjection(safetyAssessment);
  const fullSystemMessage = safetyInjection
    ? `${safetyInjection}\n\n${systemMessage}`
    : systemMessage;

  const chatMessages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: fullSystemMessage },
    { role: 'assistant', content: 'Understood. I will follow these guidelines.' },
  ];

  const recentMessages = messages.slice(-8);
  recentMessages.forEach(m => {
    chatMessages.push({ role: m.role, content: m.content });
  });

  try {
    let response = await generateText({ messages: chatMessages });

    const outputCheck = checkOutputSafety(response, safetyAssessment);
    if (outputCheck.sanitizedContent) {
      console.log('[AIJournalCoach] Output failed safety check, using sanitized fallback. Violations:', outputCheck.violations.map(v => v.type).join(','));
      response = outputCheck.sanitizedContent;
    } else if (!outputCheck.isAcceptable) {
      console.log('[AIJournalCoach] Non-critical safety concerns:', outputCheck.violations.map(v => v.type).join(','));
    }

    response = augmentResponseWithSafety(response, safetyAssessment);
    console.log('[AIJournalCoach] Response generated successfully');
    return response;
  } catch (error) {
    console.error('[AIJournalCoach] Generation failed:', error);
    if (safetyAssessment.level === 'crisis' && safetyAssessment.crisisResourceText) {
      return `I hear how much pain is in what you just wrote, and I do not want to rush past it. Let's take one slow breath together before anything else.\n\n${safetyAssessment.crisisResourceText}`;
    }
    return 'Something important brought you here. Whether it\'s a specific moment or a feeling that won\'t quiet down — what\'s the part that keeps pulling at you?';
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
