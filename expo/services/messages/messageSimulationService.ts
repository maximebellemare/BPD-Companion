import {
  ResponsePath,
  ResponsePathSimulation,
  RESPONSE_PATH_META,
} from '@/types/messageSimulation';
import { EnhancedMessageContext } from '@/types/messageHealth';

function generateUrgentVersion(draft: string): string {
  let text = draft.trim();
  text = text.replace(/\./g, '!');
  if (!text.endsWith('!')) text += '!';
  return "I need you to hear this right now. " + text + " Why aren't you responding?";
}

function generateAvoidantVersion(draft: string): string {
  const firstSentence = draft.trim().split(/[.!?]/).filter(Boolean)[0] || draft.trim();
  return firstSentence.replace(/!/g, '.').trim() + ". Actually, forget it. It's fine.";
}

function generateSoftVersion(draft: string, context: EnhancedMessageContext): string {
  let text = draft.trim();
  text = text.replace(/!/g, '.');
  text = text.replace(/you always/gi, 'sometimes I notice');
  text = text.replace(/you never/gi, 'I wish I could see more of');
  const opener = context.desiredOutcome === 'reconnect'
    ? "I care about us, and I want to share something gently."
    : "This is hard for me to say, and I hope you'll hear me.";
  return `${opener} ${text}`;
}

function generateBoundaryVersion(draft: string): string {
  let text = draft.trim();
  text = text.replace(/!/g, '.');
  text = text.replace(/you always/gi, 'When this happens,');
  text = text.replace(/you never/gi, 'I need');
  return `I need to be honest about something important. ${text} This boundary is about protecting my wellbeing.`;
}

function generateSecureVersion(draft: string, context: EnhancedMessageContext): string {
  let text = draft.trim();
  text = text.replace(/!/g, '.');
  text = text.replace(/you always/gi, 'I notice that sometimes');
  text = text.replace(/you never/gi, "I'd appreciate seeing more");
  text = text.replace(/don't leave me/gi, "I hope we can stay connected");

  const opener = context.emotionalState === 'rejected'
    ? "I'm feeling vulnerable right now, and I want to be open with you."
    : context.emotionalState === 'anxious'
      ? "I notice my anxiety is speaking, so I want to be intentional."
      : "I've taken a moment to think about what I actually want to say.";

  return `${opener} ${text} I trust we can handle this.`;
}

export function simulateResponsePaths(
  draft: string,
  context: EnhancedMessageContext,
): ResponsePathSimulation[] {
  console.log('[MessageSimulation] Generating response paths');

  const paths: ResponsePath[] = ['urgent', 'avoidant', 'soft', 'boundary', 'secure'];

  const generators: Record<ResponsePath, () => ResponsePathSimulation> = {
    urgent: () => ({
      path: 'urgent',
      ...RESPONSE_PATH_META.urgent,
      exampleMessage: generateUrgentVersion(draft),
      shortTermEffect: 'May give momentary relief from anxiety, but often increases tension and regret.',
      relationshipEffect: 'Likely to create pressure, trigger defensiveness, or push the other person away.',
      regretRisk: 'high',
      dignityProtection: 'low',
      clarityLevel: 'low',
      isRecommended: false,
    }),
    avoidant: () => ({
      path: 'avoidant',
      ...RESPONSE_PATH_META.avoidant,
      exampleMessage: generateAvoidantVersion(draft),
      shortTermEffect: 'Feels self-protective in the moment, but leaves real feelings unexpressed.',
      relationshipEffect: 'May signal indifference when you actually care deeply. Creates emotional distance.',
      regretRisk: 'moderate',
      dignityProtection: 'moderate',
      clarityLevel: 'low',
      isRecommended: false,
    }),
    soft: () => ({
      path: 'soft',
      ...RESPONSE_PATH_META.soft,
      exampleMessage: generateSoftVersion(draft, context),
      shortTermEffect: 'Feels vulnerable but caring. May ease the emotional charge of the conversation.',
      relationshipEffect: 'Invites understanding rather than defensiveness. Shows emotional maturity.',
      regretRisk: 'low',
      dignityProtection: 'moderate',
      clarityLevel: 'moderate',
      isRecommended: context.desiredOutcome === 'reconnect' || context.desiredOutcome === 'avoid_conflict',
    }),
    boundary: () => ({
      path: 'boundary',
      ...RESPONSE_PATH_META.boundary,
      exampleMessage: generateBoundaryVersion(draft),
      shortTermEffect: 'May feel uncomfortable but empowering. Protects your emotional space.',
      relationshipEffect: 'Healthy boundaries strengthen relationships long-term, even if they create short-term friction.',
      regretRisk: 'low',
      dignityProtection: 'high',
      clarityLevel: 'high',
      isRecommended: context.desiredOutcome === 'protect_dignity' || context.urge === 'set_boundary',
    }),
    secure: () => ({
      path: 'secure',
      ...RESPONSE_PATH_META.secure,
      exampleMessage: generateSecureVersion(draft, context),
      shortTermEffect: 'May feel slower, but creates more clarity and self-respect.',
      relationshipEffect: 'Invites genuine connection. Shows self-awareness without demanding the other person fix your feelings.',
      regretRisk: 'low',
      dignityProtection: 'high',
      clarityLevel: 'high',
      isRecommended: true,
    }),
  };

  return paths.map(path => generators[path]());
}
