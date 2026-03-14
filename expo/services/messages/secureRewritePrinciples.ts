export const SECURE_PRINCIPLES = {
  optimize: [
    'dignity',
    'clarity',
    'emotional_honesty',
    'low_escalation',
    'low_regret',
    'boundary_awareness',
    'non_reactivity',
    'brevity',
  ],
  avoid: [
    'direct_insults',
    'profanity_at_person',
    'contempt',
    'blame_heavy_phrasing',
    'emotional_flooding',
    'overexplaining',
    'desperate_reassurance_seeking',
    'repeated_reply_forcing',
    'passive_aggressive_phrasing',
    'fake_coldness_as_punishment',
  ],
} as const;

export const SECURE_LANGUAGE_PATTERNS = {
  strong: [
    "I'm frustrated by {situation}, so I'm stepping back.",
    "This doesn't work for me, so I'm leaving it here.",
    "I felt hurt by that, and I'm not going to keep pushing this conversation.",
    "I'd rather talk when there's more clarity.",
    "I need to protect my peace right now.",
    "I'm choosing to step back rather than react.",
    "When this happens, I feel {emotion}. I want to address it clearly.",
    "I care about this, and I also need to take care of myself.",
    "I'm not going to chase this — but I want you to know it matters.",
    "I deserve a response, and I'm going to take care of myself until that happens.",
  ],
  insecure: [
    "Why are you doing this to me?",
    "Answer me right now.",
    "You clearly never cared.",
    "I guess I mean nothing to you.",
    "Forget it, whatever.",
    "Fine, I'll just stop trying.",
    "You're the worst.",
    "I can't believe you would do this.",
    "Everyone always leaves.",
    "Please just tell me we're okay.",
  ],
} as const;

export const SECURE_QUALITY_THRESHOLDS = {
  minClarity: 5,
  minDignity: 5,
  maxEscalationRisk: 3,
  maxReassuranceSeeking: 3,
  maxOverexplaining: 3,
  minBoundaryStrength: 4,
  maxRegretRisk: 3,
  minOverallScore: 6,
} as const;

export const BLOCKED_IN_SECURE = [
  /\bgo\s+fuck\s+(yourself|urself|off)\b/gi,
  /\bfuck\s+you\b/gi,
  /\bf+u+c+k+\b/gi,
  /\bshit\b/gi,
  /\bbitch\b/gi,
  /\basshole\b/gi,
  /\bcunt\b/gi,
  /\bstfu\b/gi,
  /\bgo\s+to\s+hell\b/gi,
  /\bdamn\s+you\b/gi,
  /\bscrew\s+you\b/gi,
  /\bi\s+hate\s+you\b/gi,
  /\byou\s+disgust\s+me\b/gi,
  /\byou('re|\s+are)\s+(a\s+)?(pathetic|disgusting|worthless|useless|trash|garbage)\b/gi,
  /\byou('re|\s+are)\s+dead\s+to\s+me\b/gi,
  /\bnobody\s+(loves|likes|cares\s+about|wants)\s+you\b/gi,
  /\byou\s+deserve\s+(nothing|to\s+be\s+alone|the\s+worst)\b/gi,
  /\bi\s+wish\s+i\s+never\s+(met|knew)\s+you\b/gi,
  /\byou\s+make\s+me\s+sick\b/gi,
  /\bi('ll|\s+will)\s+(make|ruin|destroy)\b/gi,
  /\byou('ll|\s+will)\s+(pay|regret|be\s+sorry)\b/gi,
  /\bkill\s+(yourself|urself)\b/gi,
  /\bi\s+hope\s+you\s+(die|suffer|rot)\b/gi,
  /\bwhy\s+are\s+you\s+doing\s+this\s+to\s+me\b/gi,
  /\banswer\s+me\s+right\s+now\b/gi,
  /\byou\s+clearly\s+never\s+cared\b/gi,
  /\bi\s+guess\s+i\s+mean\s+nothing\b/gi,
  /\beveryone\s+always\s+leaves\b/gi,
  /\bplease\s+just\s+tell\s+me\s+we're\s+okay\b/gi,
];

export const PRESSURE_PATTERNS = [
  /\bplease\s+(just\s+)?(respond|reply|answer|text|call)\b/gi,
  /\bi\s+need\s+(you\s+)?(to\s+)?(respond|reply|answer|text)\s*(now|immediately|asap)?\b/gi,
  /\bwhy\s+(aren't|arent|won't|wont)\s+you\b/gi,
  /\bare\s+you\s+(there|ignoring|even)\b/gi,
  /\?\?+/g,
  /!{3,}/g,
];

export const OVEREXPLAINING_SIGNALS = [
  /\bwhat\s+i\s+(meant|mean)\b/gi,
  /\blet\s+me\s+explain\b/gi,
  /\byou\s+have\s+to\s+understand\b/gi,
  /\ball\s+i('m|\s+am)\s+saying\b/gi,
  /\bi\s+just\s+want(ed)?\s+(you\s+)?(to\s+)?understand\b/gi,
  /\bthe\s+reason\s+(i|why)\b/gi,
];

export function sanitizeSecureText(text: string): string {
  let result = text;
  for (const pattern of BLOCKED_IN_SECURE) {
    result = result.replace(new RegExp(pattern.source, 'gi'), '');
  }
  result = result.replace(/\s{2,}/g, ' ').trim();
  result = result.replace(/^[.,;:\s]+/, '').trim();
  if (result.length < 10) {
    return '';
  }
  return result;
}

export function hasBlockedContent(text: string): boolean {
  return BLOCKED_IN_SECURE.some(p => new RegExp(p.source, 'i').test(text));
}

export function countPressureSignals(text: string): number {
  return PRESSURE_PATTERNS.reduce((count, pattern) => {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    return count + (matches ? matches.length : 0);
  }, 0);
}

export function countOverexplainingSignals(text: string): number {
  return OVEREXPLAINING_SIGNALS.reduce((count, pattern) => {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    return count + (matches ? matches.length : 0);
  }, 0);
}
