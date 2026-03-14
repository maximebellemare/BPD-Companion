import {
  SecureSubtype,
  SecureRewriteInput,
  SecureRewriteResult,
  SecureComparisonPoint,
  SecureTeachingPoint,
  SECURE_SUBTYPE_META,
} from '@/types/secureRewrite';
import {
  extractCoreEmotion,
  extractCoreSituation,
} from '@/services/messages/messageSafetyClassifier';
import {
  sanitizeSecureText,
  hasBlockedContent,
} from '@/services/messages/secureRewritePrinciples';
import { scoreSecureRewrite } from '@/services/messages/secureRewriteScoringService';

function pickVariant(variants: string[], seed: string): string {
  const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return variants[hash % variants.length];
}

function inferBestSubtype(input: SecureRewriteInput): SecureSubtype {
  const { desiredOutcome, urge, emotionalState, distressLevel } = input;

  if (distressLevel >= 8 || urge === 'attack') {
    return 'calm_exit';
  }

  if (desiredOutcome === 'protect_dignity' || urge === 'withdraw') {
    return 'calm_boundary';
  }

  if (desiredOutcome === 'reconnect' || urge === 'apologize') {
    return 'calm_repair';
  }

  if (desiredOutcome === 'get_clarity' || urge === 'demand_clarity') {
    return 'calm_ask';
  }

  if (desiredOutcome === 'feel_heard' || desiredOutcome === 'not_make_worse') {
    return 'calm_clarity';
  }

  if (emotionalState === 'angry' || emotionalState === 'rejected') {
    return 'calm_boundary';
  }

  if (emotionalState === 'anxious' || emotionalState === 'confused') {
    return 'calm_ask';
  }

  if (emotionalState === 'hurt' || emotionalState === 'ashamed') {
    return 'calm_clarity';
  }

  return 'calm_clarity';
}

function generateCalmBoundary(input: SecureRewriteInput): string {
  const emotion = extractCoreEmotion(input.originalDraft);
  const situation = extractCoreSituation(input.originalDraft);

  if (situation.includes('silence') || situation.includes('response') || situation.includes('ignored')) {
    return pickVariant([
      `I'm frustrated that I haven't heard from you. This lack of response doesn't work for me. I'm stepping back.`,
      `The silence is affecting me, and I'm choosing to protect my peace. I deserve communication, and I'm not going to keep reaching out.`,
      `I feel ${emotion} about ${situation}. I'm not going to chase this — but I want you to know it matters to me.`,
      `I need a response to feel okay about where we stand. Until then, I'm going to take care of myself.`,
    ], input.originalDraft);
  }

  if (input.desiredOutcome === 'protect_dignity') {
    return pickVariant([
      `I feel ${emotion}, and I need to set a limit here. This isn't okay with me, and I'm choosing to step back rather than react.`,
      `What happened affected me. I'm not going to pretend otherwise, and I need space to process this.`,
      `I'm ${emotion} about what happened. I'm setting a boundary because my wellbeing matters.`,
    ], input.originalDraft);
  }

  return pickVariant([
    `I feel ${emotion} about what happened, and I need to be honest about that. This doesn't work for me, and I'm choosing to address it calmly.`,
    `What happened affected me, and I need space. I'm stepping back to protect my own peace.`,
    `I'm ${emotion} right now, and I want to be clear about my limit here. I'm choosing calm over reaction.`,
  ], input.originalDraft);
}

function generateCalmClarity(input: SecureRewriteInput): string {
  const emotion = extractCoreEmotion(input.originalDraft);
  const situation = extractCoreSituation(input.originalDraft);

  if (situation.includes('silence') || situation.includes('response') || situation.includes('ignored')) {
    return pickVariant([
      `I'm feeling ${emotion} about not hearing from you. I want to address this directly rather than let it build.`,
      `The lack of response has been hard for me. I'm sharing this because I'd rather be honest than make assumptions.`,
      `I've been sitting with some difficult feelings about ${situation}. I want to be clear about how I feel without escalating.`,
    ], input.originalDraft);
  }

  if (input.interpretation === 'rejecting_me' || input.interpretation === 'dont_care') {
    return pickVariant([
      `When this happens, I notice my mind goes to a painful place. I'd rather tell you directly how I feel than act on that interpretation.`,
      `I'm feeling ${emotion}, and I want to be honest about that. I'd rather share this clearly than let it come out sideways.`,
      `I felt ${emotion} when this happened. I'm trying to express this without blaming you, because I want us to understand each other.`,
    ], input.originalDraft);
  }

  return pickVariant([
    `I want to be direct about something. I feel ${emotion} about what happened, and I want to address it clearly.`,
    `I'm feeling ${emotion}, and I'd rather share this honestly than let it build. I want to be clear without making things worse.`,
    `Something has been bothering me, and I want to address it. I feel ${emotion} about ${situation}. I'm sharing this because it matters to me.`,
  ], input.originalDraft);
}

function generateCalmRepair(input: SecureRewriteInput): string {
  const emotion = extractCoreEmotion(input.originalDraft);
  const situation = extractCoreSituation(input.originalDraft);

  return pickVariant([
    `I've been thinking about what happened, and I want to reconnect. I felt ${emotion}, and I know things got intense. I care about this, and I want to move forward together.`,
    `I want to address what happened between us. I feel ${emotion}, and I don't want that to become a wall. Can we talk about this when we're both ready?`,
    `I care about where we stand. I felt ${emotion} about ${situation}, and I want to repair this without pretending it didn't happen. I'm open to hearing your side too.`,
    `What happened has been on my mind. I felt ${emotion}, and I want to own my part. I'd like to reconnect without losing what matters to me.`,
  ], input.originalDraft);
}

function generateCalmExit(input: SecureRewriteInput): string {
  const situation = extractCoreSituation(input.originalDraft);

  if (situation.includes('silence') || situation.includes('response') || situation.includes('ignored')) {
    return pickVariant([
      `I'm stepping back from this conversation. The silence tells me what I need to know for now.`,
      `I've said what I needed to say. I'm going to leave this here and take care of myself.`,
      `This lack of response doesn't work for me. I'm choosing to step back rather than keep reaching out.`,
      `I'm done chasing this conversation. When you're ready to talk, I'm open to it. Until then, I'm protecting my peace.`,
    ], input.originalDraft);
  }

  return pickVariant([
    `I'm stepping back from this. I've shared how I feel, and I don't want to keep pushing.`,
    `I need to step away from this conversation. I've said what I needed to say.`,
    `I'm choosing to stop here. I don't want to make this worse, and I need space.`,
    `This isn't going anywhere productive right now. I'm stepping back, and we can revisit this when things are calmer.`,
  ], input.originalDraft);
}

function generateCalmAsk(input: SecureRewriteInput): string {
  const emotion = extractCoreEmotion(input.originalDraft);
  const situation = extractCoreSituation(input.originalDraft);

  if (situation.includes('silence') || situation.includes('response') || situation.includes('ignored')) {
    return pickVariant([
      `I'd like to understand what's happening. The silence has been hard for me, and I'd rather ask directly than assume.`,
      `Can we talk about where things stand? I'm feeling ${emotion}, and I'd rather have clarity than guess.`,
      `I'm reaching out because I'd like to understand. I don't want to pressure you, but I do need some clarity.`,
    ], input.originalDraft);
  }

  return pickVariant([
    `I want to understand what happened. I'm feeling ${emotion}, and I'd rather ask than make assumptions. Can we talk about this?`,
    `I'd like some clarity about ${situation}. I'm not trying to start a fight — I just want to understand.`,
    `Can we have an honest conversation about what happened? I feel ${emotion}, and I'd rather talk it through than let it build.`,
    `I have some questions about what happened, and I'd rather ask directly. I want to understand, not argue.`,
  ], input.originalDraft);
}

const SUBTYPE_GENERATORS: Record<SecureSubtype, (input: SecureRewriteInput) => string> = {
  calm_boundary: generateCalmBoundary,
  calm_clarity: generateCalmClarity,
  calm_repair: generateCalmRepair,
  calm_exit: generateCalmExit,
  calm_ask: generateCalmAsk,
};

function getWhySecure(subtype: SecureSubtype, input: SecureRewriteInput): string {
  const emotion = extractCoreEmotion(input.originalDraft);

  switch (subtype) {
    case 'calm_boundary':
      return `This version sets a clear limit without attacking. It says "this doesn't work for me" instead of "you did this to me." It protects your dignity while leaving the door open.`;
    case 'calm_clarity':
      return `This version expresses your ${emotion} directly without blame or pressure. It gives the other person room to hear you instead of getting defensive.`;
    case 'calm_repair':
      return `This version reaches for connection without collapsing into panic or over-apologizing. It shows you care while still honoring your own feelings.`;
    case 'calm_exit':
      return `This version says "I'm done chasing" instead of reacting. It's the opposite of desperation — it communicates self-respect and gives you back your power.`;
    case 'calm_ask':
      return `This version asks for what you need without demanding it. It shows curiosity instead of accusation, which makes the other person more likely to actually respond.`;
  }
}

function getWhenBestUsed(subtype: SecureSubtype): string {
  switch (subtype) {
    case 'calm_boundary':
      return 'When you need distance, dignity, or closure. When the situation crossed a line.';
    case 'calm_clarity':
      return 'When you want to be understood. When the core issue needs to be named clearly.';
    case 'calm_repair':
      return 'After conflict, when you want to reconnect without losing yourself.';
    case 'calm_exit':
      return 'When chasing will only push them away. When stepping back is the strongest move.';
    case 'calm_ask':
      return 'When you need answers. When uncertainty is worse than the truth.';
  }
}

export function generateSecureRewrites(input: SecureRewriteInput): SecureRewriteResult[] {
  console.log('[SecureEngine] Generating secure rewrites, distress:', input.distressLevel);

  const recommended = inferBestSubtype(input);
  const subtypes: SecureSubtype[] = ['calm_boundary', 'calm_clarity', 'calm_repair', 'calm_exit', 'calm_ask'];

  const contextSubtypes = subtypes.filter(s => {
    if (input.distressLevel >= 8 && (s === 'calm_repair' || s === 'calm_ask')) return false;
    if (input.desiredOutcome === 'protect_dignity' && s === 'calm_repair') return false;
    if (input.desiredOutcome === 'reconnect' && s === 'calm_exit') return false;
    return true;
  });

  const orderedSubtypes = [
    recommended,
    ...contextSubtypes.filter(s => s !== recommended),
  ].slice(0, 4);

  const results: SecureRewriteResult[] = [];
  const isBlocked = hasBlockedContent(input.originalDraft);

  for (const subtype of orderedSubtypes) {
    const generator = SUBTYPE_GENERATORS[subtype];
    let text = generator(input);

    if (isBlocked) {
      text = sanitizeSecureText(text);
    }

    if (!text || text.length < 10) {
      continue;
    }

    const qualityScore = scoreSecureRewrite(text);
    console.log('[SecureEngine] Subtype:', subtype, 'Quality:', qualityScore.overall, 'Passed:', qualityScore.passed);

    if (!qualityScore.passed && subtype !== recommended) {
      continue;
    }

    const meta = SECURE_SUBTYPE_META[subtype];
    results.push({
      subtype,
      label: meta.label,
      emoji: meta.emoji,
      color: meta.color,
      text,
      whySecure: getWhySecure(subtype, input),
      whenBestUsed: getWhenBestUsed(subtype),
      isRecommended: subtype === recommended,
    });
  }

  if (results.length === 0) {
    const fallback = generateCalmBoundary(input);
    const meta = SECURE_SUBTYPE_META.calm_boundary;
    results.push({
      subtype: 'calm_boundary',
      label: meta.label,
      emoji: meta.emoji,
      color: meta.color,
      text: sanitizeSecureText(fallback) || fallback,
      whySecure: getWhySecure('calm_boundary', input),
      whenBestUsed: getWhenBestUsed('calm_boundary'),
      isRecommended: true,
    });
  }

  return results;
}

export function generateSecureComparison(
  originalDraft: string,
  secureText: string,
): SecureComparisonPoint[] {
  console.log('[SecureEngine] Generating comparison');
  const points: SecureComparisonPoint[] = [];

  const origHasInsults = hasBlockedContent(originalDraft);
  if (origHasInsults) {
    points.push({
      dimension: 'Harmful language',
      emoji: '🛑',
      originalLevel: 'high',
      secureLevel: 'low',
      improvement: 'Removed insults and profanity that would escalate conflict',
    });
  }

  const origBlame = /you always|you never|your fault|how could you|what's wrong with you/i.test(originalDraft);
  const secureBlame = /you always|you never|your fault|how could you|what's wrong with you/i.test(secureText);
  if (origBlame && !secureBlame) {
    points.push({
      dimension: 'Blame',
      emoji: '👆',
      originalLevel: 'high',
      secureLevel: 'low',
      improvement: 'Shifted from blaming to expressing feelings directly',
    });
  }

  const origPressure = /right now|answer me|respond|reply|why aren't you|why won't you/i.test(originalDraft);
  const securePressure = /right now|answer me|respond immediately|why aren't you/i.test(secureText);
  if (origPressure && !securePressure) {
    points.push({
      dimension: 'Pressure',
      emoji: '⚡',
      originalLevel: origPressure ? 'high' : 'low',
      secureLevel: securePressure ? 'moderate' : 'low',
      improvement: 'Reduced urgency and pressure for immediate response',
    });
  }

  const origWordCount = originalDraft.split(/\s+/).length;
  const secureWordCount = secureText.split(/\s+/).length;
  if (origWordCount > secureWordCount * 1.3) {
    points.push({
      dimension: 'Brevity',
      emoji: '✂️',
      originalLevel: origWordCount > 60 ? 'high' : 'moderate',
      secureLevel: 'low',
      improvement: 'Shortened to keep only what matters',
    });
  }

  const secureHasIFeel = /i feel|i'm feeling|i felt/i.test(secureText);
  const origHasIFeel = /i feel|i'm feeling|i felt/i.test(originalDraft);
  if (secureHasIFeel && !origHasIFeel) {
    points.push({
      dimension: 'Emotional honesty',
      emoji: '💚',
      originalLevel: 'low',
      secureLevel: 'high',
      improvement: 'Added clear emotional expression without blame',
    });
  }

  const secureHasBoundary = /stepping back|protect my|doesn't work for me|my limit|need space/i.test(secureText);
  const origHasBoundary = /stepping back|protect my|doesn't work for me|my limit|need space/i.test(originalDraft);
  if (secureHasBoundary && !origHasBoundary) {
    points.push({
      dimension: 'Boundary',
      emoji: '🛡️',
      originalLevel: 'low',
      secureLevel: 'high',
      improvement: 'Added a clear, self-respecting boundary',
    });
  }

  const origExclamations = (originalDraft.match(/!/g) || []).length;
  const secureExclamations = (secureText.match(/!/g) || []).length;
  if (origExclamations > 2 && secureExclamations <= 1) {
    points.push({
      dimension: 'Escalation',
      emoji: '📉',
      originalLevel: 'high',
      secureLevel: 'low',
      improvement: 'Reduced emotional intensity that could trigger defensiveness',
    });
  }

  if (points.length === 0) {
    points.push({
      dimension: 'Tone',
      emoji: '🌿',
      originalLevel: 'moderate',
      secureLevel: 'low',
      improvement: 'Overall calmer, more grounded tone',
    });
  }

  return points.slice(0, 5);
}

export function generateSecureTeachingPoints(
  originalDraft: string,
  subtype: SecureSubtype,
): SecureTeachingPoint[] {
  console.log('[SecureEngine] Generating teaching points for subtype:', subtype);
  const points: SecureTeachingPoint[] = [];

  if (hasBlockedContent(originalDraft)) {
    points.push({
      id: 'insults_escalate',
      title: 'Why insults backfire',
      explanation: 'Insults and profanity directed at someone almost always trigger a defensive or retaliatory response. Even when the underlying feeling is valid, the delivery ensures the message won\'t be heard. The other person reacts to the attack, not the pain underneath it.',
      emoji: '🔥',
    });
  }

  if (/you always|you never/i.test(originalDraft)) {
    points.push({
      id: 'absolutes_close_doors',
      title: '"Always" and "never" close doors',
      explanation: 'Absolute language makes the other person feel defined and cornered. It shifts the conversation from "let\'s solve this" to "let me defend myself." Replacing absolutes with specific observations keeps the conversation open.',
      emoji: '🚪',
    });
  }

  if (/why (aren't|won't|don't) you|answer me|respond/i.test(originalDraft)) {
    points.push({
      id: 'pressure_pushes_away',
      title: 'Pressure often pushes people away',
      explanation: 'Demanding an immediate response can feel controlling to the other person, even when you\'re actually feeling scared. Stating your need without demanding fulfillment is more likely to get a genuine response.',
      emoji: '⚡',
    });
  }

  if (/i guess i mean nothing|you clearly never cared|everyone always leaves/i.test(originalDraft)) {
    points.push({
      id: 'catastrophizing_in_messages',
      title: 'Emotional conclusions vs. observations',
      explanation: 'Statements like "you never cared" or "I mean nothing" are emotional conclusions, not facts. They feel true in the moment but often push people away. Secure communication shares the feeling ("I feel dismissed") without presenting the interpretation as fact.',
      emoji: '🌀',
    });
  }

  points.push({
    id: `secure_${subtype}`,
    title: `What makes "${SECURE_SUBTYPE_META[subtype].label}" secure`,
    explanation: getSubtypeTeaching(subtype),
    emoji: SECURE_SUBTYPE_META[subtype].emoji,
  });

  points.push({
    id: 'secure_vs_reactive',
    title: 'Secure vs. reactive messaging',
    explanation: 'Reactive messages are driven by the emotion of the moment — they try to force a feeling (relief, control, reassurance). Secure messages are driven by what you actually want long-term. They protect your dignity, reduce regret, and make real conversation possible.',
    emoji: '🌿',
  });

  return points.slice(0, 4);
}

function getSubtypeTeaching(subtype: SecureSubtype): string {
  switch (subtype) {
    case 'calm_boundary':
      return 'A calm boundary communicates your limit without aggression. It says "this doesn\'t work for me" instead of "you\'re terrible." It protects your space while leaving the relationship intact. The key is firmness without hostility.';
    case 'calm_clarity':
      return 'Calm clarity means saying what you mean without hiding behind anger or softness. It names the feeling, describes the situation, and lets the other person respond without feeling attacked. Clarity is one of the most powerful tools in relationship communication.';
    case 'calm_repair':
      return 'Calm repair reaches for connection without collapsing. It doesn\'t over-apologize or beg. It says "I care about this and I want to move forward" without abandoning your own feelings. It\'s vulnerable without being desperate.';
    case 'calm_exit':
      return 'A calm exit is the opposite of chasing. When you stop reaching and start stepping back, you communicate self-respect. It says "I deserve better than this dynamic" without needing to say it out loud. It\'s often the most powerful message you can send.';
    case 'calm_ask':
      return 'A calm ask seeks clarity without desperation. It says "I want to understand" instead of "explain yourself." It invites conversation without pressuring it. Asking from a grounded place is far more likely to get an honest answer.';
  }
}
