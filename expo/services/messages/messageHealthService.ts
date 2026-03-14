import {
  MessageHealthScore,
  MessageHealthAnalysis,
  SendRecommendation,
  MessageConcern,
  EnhancedMessageContext,
} from '@/types/messageHealth';

const URGENCY_PATTERNS = [
  /right now/i, /immediately/i, /asap/i, /\?\?+/, /!{2,}/,
  /please (just |)(respond|reply|answer)/i, /i need (you |)(to |)(now|right now)/i,
  /why (aren't|arent|won't|wont) you/i, /are you (there|ignoring)/i,
];

const BLAME_PATTERNS = [
  /you always/i, /you never/i, /you don('t|t) (even |)(care|try)/i,
  /how (could|dare) you/i, /it('s|s| is) (all |)your fault/i,
  /what('s|s| is) wrong with you/i, /you('re| are) (so |)(selfish|toxic)/i,
];

const REASSURANCE_PATTERNS = [
  /do you (still |)(love|care|want) me/i, /are we (okay|ok|good|fine)/i,
  /promise (me |)(you won't|you'll)/i, /tell me (it('s|s| is) |)(okay|ok|fine)/i,
  /you('re| are) not (going to |gonna )(leave|go)/i,
];

const OVEREXPLAINING_PATTERNS = [
  /what i (meant|mean) (was|is)/i, /let me explain/i,
  /the reason (i|why)/i, /you have to understand/i,
  /all i('m| am) saying is/i, /i just want(ed|) (you |)(to understand|to explain)/i,
];

const HOSTILITY_PATTERNS = [
  /f(u|\*)ck/i, /screw (you|this)/i, /i hate/i,
  /go to hell/i, /shut up/i, /you('re| are) (so |)(pathetic|disgusting)/i,
];

const BOUNDARY_PATTERNS = [
  /i need/i, /i('m| am) setting a/i, /this is important to me/i,
  /i('m| am) not (okay|ok) with/i, /my boundary/i, /i deserve/i,
];

function countPatternMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    return count + (matches ? matches.length : 0);
  }, 0);
}

function scoreToTen(raw: number, max: number): number {
  return Math.min(Math.round((raw / max) * 10), 10);
}

export function analyzeMessageHealth(
  draft: string,
  context: EnhancedMessageContext,
): MessageHealthAnalysis {
  console.log('[MessageHealth] Analyzing draft health, length:', draft.length);

  const wordCount = draft.split(/\s+/).length;
  const urgencyRaw = countPatternMatches(draft, URGENCY_PATTERNS);
  const blameRaw = countPatternMatches(draft, BLAME_PATTERNS);
  const reassuranceRaw = countPatternMatches(draft, REASSURANCE_PATTERNS);
  const overexplainingRaw = countPatternMatches(draft, OVEREXPLAINING_PATTERNS) + (wordCount > 80 ? 2 : wordCount > 50 ? 1 : 0);
  const hostilityRaw = countPatternMatches(draft, HOSTILITY_PATTERNS);
  const boundaryRaw = countPatternMatches(draft, BOUNDARY_PATTERNS);

  const capsRatio = draft.replace(/[^A-Z]/g, '').length / Math.max(draft.replace(/[^a-zA-Z]/g, '').length, 1);
  const questionMarks = (draft.match(/\?/g) || []).length;
  const exclamationMarks = (draft.match(/!/g) || []).length;

  const emotionalFloodingRaw = urgencyRaw + (capsRatio > 0.4 ? 3 : 0) + (exclamationMarks > 3 ? 2 : 0) + (wordCount > 100 ? 2 : 0);

  const clarityIndicators = [
    draft.includes('I feel') || draft.includes('I need') ? 2 : 0,
    wordCount < 60 ? 1 : 0,
    blameRaw === 0 ? 2 : 0,
    urgencyRaw === 0 ? 1 : 0,
    questionMarks <= 2 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const selfRespectIndicators = [
    boundaryRaw > 0 ? 2 : 0,
    hostilityRaw === 0 ? 2 : 0,
    reassuranceRaw === 0 ? 2 : 0,
    !draft.match(/i('m| am) (so |)(sorry|the worst|terrible)/i) ? 1 : 0,
    wordCount < 80 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const escalationRaw = blameRaw + hostilityRaw + urgencyRaw + (capsRatio > 0.4 ? 2 : 0);

  const score: MessageHealthScore = {
    urgency: scoreToTen(urgencyRaw, 4),
    blame: scoreToTen(blameRaw, 3),
    reassuranceSeeking: scoreToTen(reassuranceRaw, 3),
    overexplaining: scoreToTen(overexplainingRaw, 4),
    hostility: scoreToTen(hostilityRaw, 2),
    clarity: Math.min(10, scoreToTen(clarityIndicators, 7)),
    emotionalFlooding: scoreToTen(emotionalFloodingRaw, 6),
    boundaryStrength: scoreToTen(boundaryRaw, 3),
    selfRespect: Math.min(10, scoreToTen(selfRespectIndicators, 8)),
    escalationRisk: scoreToTen(escalationRaw, 5),
  };

  const overallRisk = Math.round(
    (score.urgency * 0.15 +
      score.blame * 0.15 +
      score.reassuranceSeeking * 0.1 +
      score.overexplaining * 0.05 +
      score.hostility * 0.2 +
      (10 - score.clarity) * 0.1 +
      score.emotionalFlooding * 0.1 +
      score.escalationRisk * 0.15)
  );

  const isHighActivation = context.emotionalState === 'angry' || context.emotionalState === 'rejected' || context.emotionalState === 'overwhelmed';

  let recommendation: SendRecommendation;
  let recommendationMessage: string;
  let recommendationDetail: string;

  if (overallRisk <= 2 && !isHighActivation) {
    recommendation = 'safe_to_send';
    recommendationMessage = 'This looks safe to send';
    recommendationDetail = 'Your message is clear and measured. It communicates what you need without unnecessary risk.';
  } else if (overallRisk <= 4) {
    recommendation = 'better_after_pause';
    recommendationMessage = 'This might be better after a short pause';
    recommendationDetail = 'The emotion makes sense, but a brief pause could help you send from a calmer place.';
  } else if (overallRisk <= 6) {
    recommendation = 'better_rewritten';
    recommendationMessage = 'A calmer version may serve you better';
    recommendationDetail = 'The emotion is understandable, but this draft may create more pressure than clarity. A rewrite could protect both you and the relationship.';
  } else {
    recommendation = 'better_not_sent';
    recommendationMessage = 'This may not be the best message to send right now';
    recommendationDetail = 'Strong feelings are driving this message. Sending it now may lead to regret. Consider writing it for yourself and revisiting later.';
  }

  if (isHighActivation && recommendation === 'safe_to_send') {
    recommendation = 'better_after_pause';
    recommendationMessage = 'Your emotions are high — a pause could help';
    recommendationDetail = 'Even though the words look measured, your emotional state is intense. A short pause can help ensure this is what you truly want to say.';
  }

  const topConcerns = buildConcerns(score);
  const strengths = buildStrengths(score);

  console.log('[MessageHealth] Overall risk:', overallRisk, 'Recommendation:', recommendation);

  return {
    score,
    overallRisk,
    recommendation,
    recommendationMessage,
    recommendationDetail,
    topConcerns,
    strengths,
  };
}

function buildConcerns(score: MessageHealthScore): MessageConcern[] {
  const concerns: MessageConcern[] = [];

  if (score.urgency >= 5) {
    concerns.push({
      dimension: 'urgency',
      level: score.urgency >= 7 ? 'high' : 'moderate',
      label: 'High urgency',
      description: 'This draft may create pressure for an immediate response, which can feel overwhelming.',
    });
  }

  if (score.blame >= 4) {
    concerns.push({
      dimension: 'blame',
      level: score.blame >= 7 ? 'high' : 'moderate',
      label: 'Blame language detected',
      description: 'Blame can trigger defensiveness. Shifting to "I feel" statements may help the message land better.',
    });
  }

  if (score.hostility >= 3) {
    concerns.push({
      dimension: 'hostility',
      level: score.hostility >= 6 ? 'high' : 'moderate',
      label: 'Hostile tone',
      description: 'Harsh language can escalate conflict and often leads to regret.',
    });
  }

  if (score.reassuranceSeeking >= 5) {
    concerns.push({
      dimension: 'reassuranceSeeking',
      level: score.reassuranceSeeking >= 7 ? 'high' : 'moderate',
      label: 'Reassurance-seeking',
      description: 'Seeking reassurance is natural, but it can put pressure on the other person to manage your feelings.',
    });
  }

  if (score.emotionalFlooding >= 5) {
    concerns.push({
      dimension: 'emotionalFlooding',
      level: score.emotionalFlooding >= 7 ? 'high' : 'moderate',
      label: 'Emotional flooding',
      description: 'This message shows signs of intense emotional activation. A pause may help you communicate more clearly.',
    });
  }

  if (score.overexplaining >= 5) {
    concerns.push({
      dimension: 'overexplaining',
      level: score.overexplaining >= 7 ? 'high' : 'moderate',
      label: 'Over-explaining',
      description: 'Long messages can dilute your core point. A shorter, clearer version may be more effective.',
    });
  }

  if (score.escalationRisk >= 5) {
    concerns.push({
      dimension: 'escalationRisk',
      level: score.escalationRisk >= 7 ? 'high' : 'moderate',
      label: 'Escalation risk',
      description: 'This message may trigger a defensive or escalatory response.',
    });
  }

  return concerns.sort((a, b) => {
    const levelOrder = { high: 0, moderate: 1, low: 2 };
    return levelOrder[a.level] - levelOrder[b.level];
  }).slice(0, 3);
}

function buildStrengths(score: MessageHealthScore): string[] {
  const strengths: string[] = [];

  if (score.clarity >= 6) strengths.push('Clear and direct');
  if (score.selfRespect >= 6) strengths.push('Self-respecting');
  if (score.boundaryStrength >= 4) strengths.push('Sets healthy boundaries');
  if (score.urgency <= 2) strengths.push('Not pressuring');
  if (score.blame <= 2) strengths.push('Avoids blame');
  if (score.hostility <= 1) strengths.push('Respectful tone');

  return strengths.slice(0, 3);
}
