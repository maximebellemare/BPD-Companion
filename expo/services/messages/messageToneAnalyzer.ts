import {
  MessageTone,
  EmotionalSignal,
  ToneAnalysis,
} from '@/types/messageGuard';

const ANXIOUS_PATTERNS = [
  /please (don't|dont) leave/i,
  /are you (still |)(there|mad|upset|angry|okay)/i,
  /did i do something/i,
  /i('m| am) sorry/gi,
  /please (just |)(respond|reply|answer|text|call)/i,
  /i need (to know|you|reassurance)/i,
  /are we (okay|ok|good|fine)/i,
  /i('m| am) (scared|afraid|terrified|worried)/i,
  /don('t|t) leave/i,
  /what did i do/i,
  /i can('t|t) lose you/i,
  /please talk to me/i,
  /why (aren't|arent|won't|wont) you/i,
  /i('m| am) panicking/i,
  /\?\?+/,
];

const ANGRY_PATTERNS = [
  /you always/i,
  /you never/i,
  /i('m| am) (so |)(sick|tired|done|fed up)/i,
  /how (could|dare) you/i,
  /you don('t|t) (even |)(care|give)/i,
  /f(u|\*)ck/i,
  /screw (you|this)/i,
  /i hate/i,
  /what('s|s| is) wrong with you/i,
  /you('re| are) (so |)(selfish|toxic|pathetic)/i,
  /!{2,}/,
];

const AVOIDANT_PATTERNS = [
  /whatever/i,
  /i('m| am) fine/i,
  /it('s|s| is) fine/i,
  /forget (it|about it)/i,
  /doesn('t|t) matter/i,
  /i don('t|t) care/i,
  /leave me alone/i,
  /i('m| am) done/i,
  /i('m| am) shutting down/i,
  /never mind/i,
  /don('t|t) bother/i,
];

const OVER_EXPLAINING_PATTERNS = [
  /what i (meant|mean) (was|is)/i,
  /i just want(ed|) (you |)(to understand|to explain|to clarify)/i,
  /let me explain/i,
  /the reason (i|why)/i,
  /i('m| am) not trying to/i,
  /you have to understand/i,
  /all i('m| am) saying is/i,
  /if you (just |)(think|look) about it/i,
];

const SIGNAL_PATTERNS: Record<EmotionalSignal, RegExp[]> = {
  abandonment_fear: [
    /don('t|t) leave/i,
    /please (stay|don't go|dont go)/i,
    /i can('t|t) lose/i,
    /are you leaving/i,
    /(everyone|people) (always |)(leaves|abandons)/i,
  ],
  rejection_sensitivity: [
    /you don('t|t) (want|like|love) me/i,
    /i('m| am) (too much|not enough)/i,
    /you('re| are) (pulling|pushing) away/i,
    /i knew (you|this) would/i,
  ],
  urgency: [
    /right now/i,
    /i need (you |)(to |)(now|immediately|asap)/i,
    /\?\?+/,
    /!{2,}/,
    /please (just |)(answer|respond|reply)/i,
  ],
  shame: [
    /i('m| am) (so |)(sorry|ashamed|embarrassed)/i,
    /i('m| am) (the |)(worst|terrible|awful|horrible)/i,
    /i ruined/i,
    /it('s|s| is) all my fault/i,
  ],
  anger: [
    /you always/i,
    /you never/i,
    /how (could|dare) you/i,
    /i('m| am) (so |)(angry|furious|pissed)/i,
  ],
  people_pleasing: [
    /i('ll|will) do (anything|whatever)/i,
    /what do you (want|need) me to/i,
    /i('m| am) sorry for (being|feeling|existing)/i,
    /i('ll|will) change/i,
    /i('ll|will) be better/i,
  ],
  self_blame: [
    /it('s|s| is) (all |)(my |)fault/i,
    /i (always |)(mess|screw|ruin) (things |everything |)(up|)/i,
    /i('m| am) (the |)(problem|reason)/i,
    /i deserve this/i,
  ],
  catastrophizing: [
    /(this is |it('s|s| is) )(over|the end|finished|ruined)/i,
    /nothing (will |)(ever |)(work|change|get better)/i,
    /(always|never) going to/i,
    /i('ll|will) (always |)(be alone|never find)/i,
  ],
  reassurance_seeking: [
    /do you (still |)(love|care|want)/i,
    /are we (okay|ok|good|fine)/i,
    /promise (me |)(you won't|you'll)/i,
    /you('re| are) not (going to |gonna )(leave|go)/i,
    /tell me (it('s|s| is) |everything('s|s| is) )(okay|ok|fine|going to be)/i,
  ],
};

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => {
    const matches = text.match(new RegExp(pattern.source, pattern.flags + (pattern.flags.includes('g') ? '' : 'g')));
    return count + (matches ? matches.length : 0);
  }, 0);
}

function detectPrimaryTone(text: string): { tone: MessageTone; scores: Record<MessageTone, number> } {
  const scores: Record<MessageTone, number> = {
    anxious: countMatches(text, ANXIOUS_PATTERNS),
    angry: countMatches(text, ANGRY_PATTERNS),
    avoidant: countMatches(text, AVOIDANT_PATTERNS),
    over_explaining: countMatches(text, OVER_EXPLAINING_PATTERNS),
    secure: 0,
  };

  const wordCount = text.split(/\s+/).length;
  if (wordCount > 80) {
    scores.over_explaining += 2;
  } else if (wordCount > 50) {
    scores.over_explaining += 1;
  }

  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks >= 3) {
    scores.anxious += 2;
  }

  const exclamationMarks = (text.match(/!/g) || []).length;
  if (exclamationMarks >= 3) {
    scores.angry += 2;
  }

  if (text.length < 20 && /^(fine|whatever|ok|okay|k|bye|done|forget it|nvm)\.?$/i.test(text.trim())) {
    scores.avoidant += 3;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    return { tone: 'secure', scores };
  }

  const tones = Object.entries(scores) as [MessageTone, number][];
  tones.sort((a, b) => b[1] - a[1]);
  return { tone: tones[0][0], scores };
}

function detectSignals(text: string): EmotionalSignal[] {
  const detected: EmotionalSignal[] = [];

  for (const [signal, patterns] of Object.entries(SIGNAL_PATTERNS) as [EmotionalSignal, RegExp[]][]) {
    const matchCount = countMatches(text, patterns);
    if (matchCount > 0) {
      detected.push(signal);
    }
  }

  return detected;
}

function calculateUrgency(text: string, signals: EmotionalSignal[]): number {
  let score = 0;

  if (signals.includes('urgency')) score += 3;
  if (signals.includes('abandonment_fear')) score += 2;
  if (signals.includes('reassurance_seeking')) score += 2;
  if (signals.includes('catastrophizing')) score += 2;

  const questionMarks = (text.match(/\?/g) || []).length;
  score += Math.min(questionMarks, 3);

  const exclamationMarks = (text.match(/!/g) || []).length;
  score += Math.min(exclamationMarks, 3);

  const caps = text.replace(/[^A-Z]/g, '').length;
  const total = text.replace(/[^a-zA-Z]/g, '').length;
  if (total > 10 && caps / total > 0.5) {
    score += 2;
  }

  return Math.min(Math.round(score), 10);
}

function calculateEmotionalIntensity(text: string, signals: EmotionalSignal[], toneScores: Record<MessageTone, number>): number {
  let intensity = 0;

  intensity += signals.length * 1.5;
  intensity += Math.max(...Object.values(toneScores)) * 0.8;

  const wordCount = text.split(/\s+/).length;
  if (wordCount > 60) intensity += 2;
  if (wordCount > 100) intensity += 1;

  return Math.min(Math.round(intensity), 10);
}

export function analyzeTone(text: string): ToneAnalysis {
  console.log('[MessageGuard] Analyzing tone for message:', text.substring(0, 50) + '...');

  const { tone, scores } = detectPrimaryTone(text);
  const signals = detectSignals(text);
  const urgencyLevel = calculateUrgency(text, signals);
  const emotionalIntensity = calculateEmotionalIntensity(text, signals, scores);

  console.log('[MessageGuard] Primary tone:', tone, 'Signals:', signals, 'Urgency:', urgencyLevel);

  return {
    primaryTone: tone,
    signals,
    urgencyLevel,
    emotionalIntensity,
  };
}
