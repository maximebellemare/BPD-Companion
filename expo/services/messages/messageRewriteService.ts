import {
  MessageContext,
  RewriteStyle,
  RewriteResult,
  TriggerSuggestion,
} from '@/types/messages';
import { MemoryProfile } from '@/types/memory';
import { classifyMessageSafety } from '@/services/messages/messageSafetyClassifier';

const BLOCKED_PHRASES = [
  /\bgo\s+fuck\s+(yourself|urself|off)\b/gi,
  /\bfuck\s+you\b/gi,
  /\bf\s*u\s*c\s*k/gi,
  /\bshit\b/gi,
  /\bbitch\b/gi,
  /\basshole\b/gi,
  /\bcunt\b/gi,
  /\bstfu\b/gi,
  /\bgo\s+to\s+hell\b/gi,
  /\bdamn\s+you\b/gi,
  /\bscrew\s+you\b/gi,
  /\byou('re|\s+are)\s+(a\s+)?(piece\s+of\s+shit|pos|pathetic|disgusting|worthless|useless|trash|garbage)\b/gi,
  /\bi\s+hate\s+you\b/gi,
  /\byou\s+disgust\s+me\b/gi,
  /\byou('re|\s+are)\s+dead\s+to\s+me\b/gi,
  /\bnobody\s+(loves|likes|cares\s+about|wants)\s+you\b/gi,
  /\byou\s+deserve\s+(nothing|to\s+be\s+alone|the\s+worst)\b/gi,
  /\bi\s+wish\s+i\s+never\s+(met|knew)\s+you\b/gi,
  /\byou\s+make\s+me\s+sick\b/gi,
  /\bi('ll|\s+will)\s+(make|ruin|destroy)\b/gi,
  /\byou('ll|\s+will)\s+(pay|regret|be\s+sorry)\b/gi,
  /\bi('ll|\s+will)\s+tell\s+everyone\b/gi,
  /\bkill\s+(yourself|urself)\b/gi,
  /\bi\s+hope\s+you\s+(die|suffer|rot)\b/gi,
];

function sanitizeRewrite(text: string): string {
  let result = text;
  for (const pattern of BLOCKED_PHRASES) {
    result = result.replace(pattern, '');
  }
  result = result.replace(/\s{2,}/g, ' ').trim();
  result = result.replace(/^[.,;:\s]+/, '').trim();
  return result;
}

const REWRITE_TEMPLATES: Record<RewriteStyle, {
  transform: (original: string, context: MessageContext) => string;
  whyThisHelps: (context: MessageContext) => string;
}> = {
  softer: {
    transform: (original, context) => {
      let text = original.trim();
      text = text.replace(/!/g, '.');
      text = text.replace(/you always/gi, 'sometimes I feel like');
      text = text.replace(/you never/gi, 'I wish I could see more of');
      text = text.replace(/I hate/gi, "I'm really struggling with");
      text = text.replace(/you don't care/gi, 'I need to feel cared about');

      const relationship = context.relationship;
      const opener = relationship === 'romantic_partner'
        ? "I care about us, and I want to share something with you."
        : relationship === 'family'
          ? "This is hard for me to say, and I hope you'll hear me out."
          : relationship === 'ex'
            ? "I want to be honest about how I'm feeling."
            : "I want to talk about something important to me.";

      return `${opener} ${text}`;
    },
    whyThisHelps: (context) => {
      if (context.emotionalState === 'angry') {
        return "When anger is driving, softer words help the other person hear your pain instead of your fury. Your feelings are valid — this just helps them land.";
      }
      if (context.emotionalState === 'abandoned') {
        return "When we feel abandoned, our words can push people further away. A softer tone invites them closer, which is what you actually need.";
      }
      return "Softening your words doesn't mean weakening them. It means giving the other person room to hear you without getting defensive.";
    },
  },
  clearer: {
    transform: (original, context) => {
      let text = original.trim();
      text = text.replace(/!/g, '.');
      text = text.replace(/you always/gi, 'I notice a pattern where');
      text = text.replace(/you never/gi, "I'd appreciate it if");
      text = text.replace(/I can't believe/gi, "I'm surprised that");

      const intentPhrase = context.intent === 'set_boundary'
        ? "I need to be clear about what I need:"
        : context.intent === 'express_hurt'
          ? "I want to be direct about how this affected me:"
          : context.intent === 'reconnect'
            ? "I want to reconnect, and I think being honest will help:"
            : "Here's what I need to say:";

      return `${intentPhrase} ${text} Can we talk about this?`;
    },
    whyThisHelps: () => {
      return "Clarity cuts through emotional noise. When your message is direct without blame, the other person can actually respond to what you need instead of reacting to how you said it.";
    },
  },
  warmer: {
    transform: (original, context) => {
      let text = original.trim();
      text = text.replace(/!/g, '.');
      text = text.replace(/you always/gi, 'I know you try, and sometimes');
      text = text.replace(/you never/gi, 'I really appreciate when you do, and I wish');
      text = text.replace(/I hate/gi, "it's hard for me when");

      const relationship = context.relationship;
      const closer = relationship === 'romantic_partner'
        ? "I love you, and I want us to figure this out together."
        : relationship === 'family'
          ? "You mean a lot to me, and I want things to be okay between us."
          : relationship === 'friend'
            ? "Our friendship matters to me, and I hope we can talk about this."
            : "I value our connection, and I want to work through this.";

      return `${text} ${closer}`;
    },
    whyThisHelps: (context) => {
      if (context.emotionalState === 'hurt') {
        return "When you're hurting, warmth in your words reminds both of you that connection is the goal — not winning.";
      }
      return "Warmth doesn't mean ignoring your pain. It means wrapping your truth in care so the relationship can hold it.";
    },
  },
  boundaried: {
    transform: (original, context) => {
      let text = original.trim();
      text = text.replace(/!/g, '.');
      text = text.replace(/you always/gi, 'When this happens,');
      text = text.replace(/you never/gi, 'I need');

      const boundaryPhrase = context.desiredOutcome === 'protect_dignity'
        ? "I need to set a boundary here, and I hope you can respect it."
        : context.desiredOutcome === 'avoid_conflict'
          ? "I'm setting a limit because I care about us, not because I'm against you."
          : "This is important to me, and I need you to hear it.";

      return `${boundaryPhrase} ${text} This boundary is about my wellbeing, and I hope you can understand.`;
    },
    whyThisHelps: () => {
      return "Boundaries aren't walls — they're bridges with guardrails. Setting them clearly and kindly protects your dignity and actually strengthens healthy relationships.";
    },
  },
  secure: {
    transform: (original, context) => {
      let text = original.trim();
      text = text.replace(/!/g, '.');
      text = text.replace(/you always/gi, 'I notice that sometimes');
      text = text.replace(/you never/gi, "I'd love to see more");
      text = text.replace(/I can't live without/gi, "I deeply value");
      text = text.replace(/don't leave me/gi, "I hope we can stay connected");

      const secureOpener = context.emotionalState === 'abandoned'
        ? "I'm feeling vulnerable right now, and I want to be open with you about that."
        : context.emotionalState === 'anxious'
          ? "I notice my anxiety is speaking, so I want to be intentional about what I say."
          : "I've taken a moment to think about what I actually want to communicate.";

      return `${secureOpener} ${text} I trust that we can handle this conversation.`;
    },
    whyThisHelps: (context) => {
      if (context.emotionalState === 'abandoned') {
        return "Secure communication names your vulnerability without demanding the other person fix it. It shows self-awareness and invites genuine connection.";
      }
      return "Speaking from a secure place means acknowledging your feelings while trusting the relationship can hold them. It's the opposite of emotional reactivity.";
    },
  },
  delay: {
    transform: (original) => {
      return `[Saved for later]\n\n${original.trim()}\n\n---\nYou chose to wait before sending this. That's emotional regulation in action.`;
    },
    whyThisHelps: () => {
      return "Research shows that waiting even 10 minutes before sending an emotional message dramatically reduces regret. Your future self will thank you for this pause.";
    },
  },
  nosend: {
    transform: (original) => {
      return `[Written, not sent]\n\n${original.trim()}\n\n---\nYou expressed this for yourself. That took courage. Processing your feelings in writing is powerful even without sending.`;
    },
    whyThisHelps: () => {
      return "Writing out your feelings without sending activates the same emotional processing as saying them out loud. You get the release without the risk.";
    },
  },
};

export function generateRewrites(
  originalText: string,
  context: MessageContext,
): RewriteResult[] {
  const classification = classifyMessageSafety(originalText);
  console.log('[Rewrite] Safety classification:', classification.riskLevel, 'Preserve allowed:', classification.preserveWordingAllowed);

  if (!classification.preserveWordingAllowed) {
    console.log('[Rewrite] High-risk draft detected — returning safe alternatives only');
    return [
      { style: 'nosend', text: REWRITE_TEMPLATES.nosend.transform(originalText, context), whyThisHelps: 'This draft contains language that is very likely to escalate conflict. Writing it out without sending is a powerful way to process the emotion.' },
      { style: 'boundaried', text: sanitizeRewrite(REWRITE_TEMPLATES.boundaried.transform(originalText, context)), whyThisHelps: 'A calm boundary communicates your limit without the language that could cause lasting damage.' },
      { style: 'secure', text: sanitizeRewrite(REWRITE_TEMPLATES.secure.transform(originalText, context)), whyThisHelps: 'This version names your feelings clearly and calmly. It protects your dignity and invites real conversation.' },
      { style: 'delay', text: REWRITE_TEMPLATES.delay.transform(originalText, context), whyThisHelps: 'Waiting even 10 minutes before sending dramatically reduces regret. Save this and revisit when the intensity passes.' },
    ];
  }

  const styles: RewriteStyle[] = ['softer', 'clearer', 'warmer', 'boundaried', 'secure', 'delay', 'nosend'];

  return styles.map(style => {
    const template = REWRITE_TEMPLATES[style];
    const rawText = template.transform(originalText, context);
    const text = (style === 'delay' || style === 'nosend') ? rawText : sanitizeRewrite(rawText);
    return {
      style,
      text,
      whyThisHelps: template.whyThisHelps(context),
    };
  });
}

export function generateTriggerSuggestions(
  memoryProfile: MemoryProfile | null,
): TriggerSuggestion[] {
  if (!memoryProfile || memoryProfile.recentCheckInCount === 0) {
    return [{
      label: 'Start tracking your patterns',
      description: 'Complete a few check-ins to unlock personalized messaging insights.',
      relevance: 'general',
    }];
  }

  const suggestions: TriggerSuggestion[] = [];

  if (memoryProfile.topTriggers.length > 0) {
    const topTrigger = memoryProfile.topTriggers[0];
    suggestions.push({
      label: `"${topTrigger.label}" is your top trigger`,
      description: `This comes up in ${topTrigger.percentage}% of your check-ins. When texting during this trigger, try the "secure" or "delay" rewrite.`,
      relevance: 'trigger',
    });
  }

  if (memoryProfile.topEmotions.length > 0) {
    const topEmotion = memoryProfile.topEmotions[0];
    suggestions.push({
      label: `You often feel "${topEmotion.label}" when triggered`,
      description: 'Consider selecting this emotional state before rewriting — it helps generate more relevant alternatives.',
      relevance: 'emotion',
    });
  }

  if (memoryProfile.intensityTrend === 'rising') {
    suggestions.push({
      label: 'Your intensity has been higher lately',
      description: 'During high-intensity periods, the "pause first" flow can be especially helpful before composing messages.',
      relevance: 'intensity',
    });
  }

  if (memoryProfile.topUrges.length > 0) {
    suggestions.push({
      label: 'Impulsive texting is a common urge',
      description: "You're already in the right place. Using this tool instead of sending raw feelings is a powerful coping strategy.",
      relevance: 'urge',
    });
  }

  return suggestions;
}

export const REWRITE_STYLE_META: Record<RewriteStyle, { label: string; emoji: string; color: string; description: string }> = {
  softer: { label: 'Softer', emoji: '🪶', color: '#14B8A6', description: 'Gentler delivery, same truth' },
  clearer: { label: 'Clearer', emoji: '🎯', color: '#67E8F9', description: 'Direct without blame' },
  warmer: { label: 'Warmer', emoji: '☀️', color: '#67E8F9', description: 'Wrapped in care' },
  boundaried: { label: 'Boundaried', emoji: '🛡️', color: '#3B82F6', description: 'Firm, kind limit' },
  secure: { label: 'Secure', emoji: '🌿', color: '#14B8A6', description: 'From a grounded place' },
  delay: { label: 'Delay', emoji: '⏳', color: '#3B82F6', description: 'Save it, send later' },
  nosend: { label: "Don't send", emoji: '🚫', color: '#3B82F6', description: 'Express it, release it' },
};
