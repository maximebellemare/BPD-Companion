import {
  RiskLevel,
  ProtectiveStrategy,
  MessageSafetyClassification,
  SafetyDimension,
  FlaggedContent,
  SafeRewriteType,
} from '@/types/messageRisk';
import { assessInputSafety } from '@/services/ai/aiSafetyService';
import { SafetyAssessment } from '@/types/aiSafety';

const PROFANITY_AT_PERSON = [
  /\bgo\s+fuck\s+(yourself|urself|off)\b/i,
  /\bfuck\s+you\b/i,
  /\bf+\s*u+\s*c+\s*k+\s+y+\s*o+\s*u+\b/i,
  /\byou('re|\s+are)\s+(a\s+)?(piece\s+of\s+shit|pos|bitch|asshole|cunt|dick|prick)\b/i,
  /\bscrew\s+you\b/i,
  /\bdie\b/i,
  /\bkill\s+(yourself|urself)\b/i,
  /\bi\s+hope\s+you\s+(die|suffer|rot)\b/i,
];

const INSULT_PATTERNS = [
  /\byou('re|\s+are)\s+(so\s+)?(pathetic|disgusting|worthless|useless|stupid|dumb|trash|garbage|awful|terrible|a\s+joke)\b/i,
  /\byou\s+disgust\s+me\b/i,
  /\byou('re|\s+are)\s+nothing\b/i,
  /\bnobody\s+(loves|likes|cares\s+about|wants)\s+you\b/i,
  /\byou\s+deserve\s+(nothing|to\s+be\s+alone|the\s+worst)\b/i,
  /\byou('re|\s+are)\s+dead\s+to\s+me\b/i,
];

const CONTEMPT_PATTERNS = [
  /\bi\s+hate\s+you\b/i,
  /\byou\s+make\s+me\s+sick\b/i,
  /\bi\s+can('t|not)\s+stand\s+you\b/i,
  /\byou('re|\s+are)\s+the\s+worst\b/i,
  /\bi\s+wish\s+i\s+never\s+(met|knew)\s+you\b/i,
  /\byou\s+mean\s+nothing\b/i,
  /\bi\s+regret\s+(ever|meeting|knowing)\b/i,
];

const REVENGE_PATTERNS = [
  /\bi('ll|will)\s+(make|ruin|destroy)\b/i,
  /\byou('ll|will)\s+(pay|regret|be\s+sorry)\b/i,
  /\bwait\s+(till|until|and)\s+see\b/i,
  /\bi('ll|will)\s+show\s+(you|everyone)\b/i,
  /\beveryone\s+will\s+know\b/i,
];

const HUMILIATION_PATTERNS = [
  /\beveryone\s+knows\s+(you('re|\s+are)|how)\b/i,
  /\bno\s+one\s+will\s+ever\b/i,
  /\bi('ll|will)\s+tell\s+everyone\b/i,
  /\byou\s+should\s+be\s+ashamed\b/i,
  /\bwhat\s+kind\s+of\s+person\b/i,
];

const GENERAL_PROFANITY = [
  /\bf+u+c+k+\b/i,
  /\bshit\b/i,
  /\bbitch\b/i,
  /\basshole\b/i,
  /\bdamn\s+you\b/i,
  /\bgo\s+to\s+hell\b/i,
  /\bstfu\b/i,
];

const BLAME_PATTERNS = [
  /\byou\s+always\b/i,
  /\byou\s+never\b/i,
  /\bit('s|\s+is)\s+(all\s+)?your\s+fault\b/i,
  /\byou\s+don('t|t)\s+(even\s+)?(care|try)\b/i,
  /\bhow\s+(could|dare)\s+you\b/i,
  /\bwhat('s|\s+is)\s+wrong\s+with\s+you\b/i,
];

const DESPERATION_PATTERNS = [
  /\bplease\s+(don't|dont)\s+(leave|go|abandon)\b/i,
  /\bi\s+can('t|not)\s+live\s+without\b/i,
  /\bi('ll|will)\s+(die|kill\s+myself)\s+(if|without)\b/i,
  /\bdon('t|t)\s+leave\s+me\b/i,
  /\bi\s+need\s+you\s+(so\s+)?(much|bad|badly)\b/i,
];

const REASSURANCE_PATTERNS = [
  /\bdo\s+you\s+(still\s+)?(love|care|want)\s+me\b/i,
  /\bare\s+we\s+(okay|ok|good|fine)\b/i,
  /\bpromise\s+(me\s+)?(you\s+won't|you'll)\b/i,
  /\btell\s+me\s+(it('s|\s+is)\s+)?(okay|ok|fine)\b/i,
];

const OVEREXPLAINING_PATTERNS = [
  /\bwhat\s+i\s+(meant|mean)\b/i,
  /\blet\s+me\s+explain\b/i,
  /\byou\s+have\s+to\s+understand\b/i,
  /\ball\s+i('m|\s+am)\s+saying\b/i,
];

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    return count + (matches ? matches.length : 0);
  }, 0);
}

function findMatches(text: string, patterns: RegExp[]): string[] {
  const found: string[] = [];
  for (const pattern of patterns) {
    const match = text.match(new RegExp(pattern.source, 'gi'));
    if (match) {
      found.push(...match);
    }
  }
  return found;
}

function makeDimension(score: number, label: string): SafetyDimension {
  return { score: Math.min(score, 10), label, detected: score > 0 };
}

export function classifyMessageSafety(draft: string): MessageSafetyClassification & { userSafetyAssessment?: SafetyAssessment } {
  console.log('[SafetyClassifier] Classifying draft, length:', draft.length);

  const userSafetyAssessment = assessInputSafety(draft);
  if (userSafetyAssessment.level !== 'safe') {
    console.log('[SafetyClassifier] User safety concern detected in draft:', userSafetyAssessment.level, userSafetyAssessment.signals.map(s => s.type).join(', '));
  }

  const text = draft.trim();
  const wordCount = text.split(/\s+/).length;

  const profanityAtPersonCount = countMatches(text, PROFANITY_AT_PERSON);
  const insultCount = countMatches(text, INSULT_PATTERNS);
  const contemptCount = countMatches(text, CONTEMPT_PATTERNS);
  const revengeCount = countMatches(text, REVENGE_PATTERNS);
  const humiliationCount = countMatches(text, HUMILIATION_PATTERNS);
  const generalProfanityCount = countMatches(text, GENERAL_PROFANITY);
  const blameCount = countMatches(text, BLAME_PATTERNS);
  const desperationCount = countMatches(text, DESPERATION_PATTERNS);
  const reassuranceCount = countMatches(text, REASSURANCE_PATTERNS);
  const overexplainingCount = countMatches(text, OVEREXPLAINING_PATTERNS) + (wordCount > 80 ? 1 : 0);

  const capsRatio = text.replace(/[^A-Z]/g, '').length / Math.max(text.replace(/[^a-zA-Z]/g, '').length, 1);
  const exclamationCount = (text.match(/!/g) || []).length;

  const hostilityScore = Math.min(
    (profanityAtPersonCount * 4) + (insultCount * 3) + (generalProfanityCount * 1.5) + (capsRatio > 0.5 ? 2 : 0),
    10
  );
  const contemptScore = Math.min((contemptCount * 3) + (insultCount * 1.5), 10);
  const blameScore = Math.min(blameCount * 2.5, 10);
  const desperationScore = Math.min(desperationCount * 3, 10);
  const reassuranceScore = Math.min(reassuranceCount * 2.5, 10);
  const overexplainingScore = Math.min(overexplainingCount * 2, 10);

  const escalationScore = Math.min(
    (hostilityScore * 0.35) + (contemptScore * 0.25) + (blameScore * 0.2) + (revengeCount * 3) + (humiliationCount * 2) + (exclamationCount > 3 ? 2 : 0),
    10
  );

  const regretScore = Math.min(
    (hostilityScore * 0.3) + (contemptScore * 0.3) + (escalationScore * 0.2) + (profanityAtPersonCount * 2),
    10
  );

  const hasBoundaryLanguage = /\bi\s+need\b/i.test(text) || /\bmy\s+boundary\b/i.test(text) || /\bi\s+deserve\b/i.test(text);
  const hasIStatements = /\bi\s+feel\b/i.test(text) || /\bi\s+need\b/i.test(text);
  const clarityScore = Math.min(
    (hasIStatements ? 3 : 0) + (wordCount < 60 ? 2 : 0) + (blameCount === 0 ? 2 : 0) + (hostilityScore === 0 ? 3 : 0),
    10
  );
  const boundaryScore = hasBoundaryLanguage ? Math.min(3 + (hostilityScore === 0 ? 3 : 0), 10) : 0;

  const dimensions = {
    hostility: makeDimension(hostilityScore, 'Hostility'),
    contempt: makeDimension(contemptScore, 'Contempt'),
    blame: makeDimension(blameScore, 'Blame'),
    desperation: makeDimension(desperationScore, 'Desperation'),
    reassuranceSeeking: makeDimension(reassuranceScore, 'Reassurance-seeking'),
    overexplaining: makeDimension(overexplainingScore, 'Over-explaining'),
    escalationRisk: makeDimension(escalationScore, 'Escalation risk'),
    regretRisk: makeDimension(regretScore, 'Regret risk'),
    clarity: makeDimension(clarityScore, 'Clarity'),
    boundaryStrength: makeDimension(boundaryScore, 'Boundary strength'),
  };

  const flaggedContent: FlaggedContent[] = [];

  const profanityMatches = findMatches(text, PROFANITY_AT_PERSON);
  profanityMatches.forEach(m => {
    flaggedContent.push({ text: m, reason: 'Profanity directed at person', severity: 'block' });
  });

  const insultMatches = findMatches(text, INSULT_PATTERNS);
  insultMatches.forEach(m => {
    flaggedContent.push({ text: m, reason: 'Insult', severity: 'block' });
  });

  const contemptMatches = findMatches(text, CONTEMPT_PATTERNS);
  contemptMatches.forEach(m => {
    flaggedContent.push({ text: m, reason: 'Contemptuous language', severity: 'block' });
  });

  const revengeMatches = findMatches(text, REVENGE_PATTERNS);
  revengeMatches.forEach(m => {
    flaggedContent.push({ text: m, reason: 'Revenge language', severity: 'block' });
  });

  const humiliationMatches = findMatches(text, HUMILIATION_PATTERNS);
  humiliationMatches.forEach(m => {
    flaggedContent.push({ text: m, reason: 'Humiliation', severity: 'block' });
  });

  const generalProfanityMatches = findMatches(text, GENERAL_PROFANITY);
  generalProfanityMatches.forEach(m => {
    flaggedContent.push({ text: m, reason: 'Strong language', severity: 'warning' });
  });

  const hasBlockContent = flaggedContent.some(f => f.severity === 'block');
  const hasSevereProfanity = profanityAtPersonCount > 0;
  const hasSevereInsults = insultCount > 0;
  const hasSevereContempt = contemptCount >= 2 || (contemptCount >= 1 && hostilityScore >= 4);
  const hasRevenge = revengeCount > 0;
  const hasHumiliation = humiliationCount > 0;

  let riskLevel: RiskLevel;
  let preserveWordingAllowed: boolean;
  let recommendedStrategy: ProtectiveStrategy;
  let explanation: string;

  if (hasSevereProfanity || hasSevereInsults || hasRevenge || hasHumiliation) {
    riskLevel = 'severe';
    preserveWordingAllowed = false;
    recommendedStrategy = 'save_not_send';
    explanation = 'This draft contains language that is very likely to escalate the situation and may not get you the outcome you want. The emotion behind it is valid — but this version of the message is unlikely to help.';
  } else if (hasSevereContempt || hostilityScore >= 6 || escalationScore >= 7) {
    riskLevel = 'high';
    preserveWordingAllowed = false;
    recommendedStrategy = 'full_replacement';
    explanation = 'This draft has a high chance of creating conflict or regret. A completely different approach would protect both you and the relationship better.';
  } else if (hasBlockContent || hostilityScore >= 3 || escalationScore >= 4 || regretScore >= 5) {
    riskLevel = 'medium';
    preserveWordingAllowed = true;
    recommendedStrategy = 'boundary_rewrite';
    explanation = 'This draft carries some risk. Rewriting it with clearer boundaries and less reactive language could help it land better.';
  } else {
    riskLevel = 'low';
    preserveWordingAllowed = true;
    recommendedStrategy = 'soften_preserve';
    explanation = 'This draft looks relatively safe. Minor softening may still help it communicate your intent more clearly.';
  }

  let safeRewriteTypes: SafeRewriteType[];

  if (riskLevel === 'severe') {
    safeRewriteTypes = ['no_send', 'calm_boundary', 'save_for_later', 'journal_instead'];
  } else if (riskLevel === 'high') {
    safeRewriteTypes = ['calm_boundary', 'secure', 'short_boundary', 'no_send', 'save_for_later'];
  } else if (riskLevel === 'medium') {
    safeRewriteTypes = ['secure', 'calm_boundary', 'short_boundary', 'save_for_later'];
  } else {
    safeRewriteTypes = ['secure', 'calm_boundary', 'short_boundary'];
  }

  console.log('[SafetyClassifier] Risk:', riskLevel, 'Preserve:', preserveWordingAllowed, 'Strategy:', recommendedStrategy);

  return {
    riskLevel,
    preserveWordingAllowed,
    recommendedStrategy,
    explanation,
    dimensions,
    flaggedContent,
    safeRewriteTypes,
    userSafetyAssessment: userSafetyAssessment.level !== 'safe' ? userSafetyAssessment : undefined,
  };
}

export function extractCoreEmotion(draft: string): string {
  if (/\bnot\s+(replying|responding|answering|texting)\b/i.test(draft) || /\bhaven('t|t)\s+(replied|responded|texted|answered)\b/i.test(draft)) {
    return 'hurt by being ignored';
  }
  if (/\b(left|leaving|abandon|gone)\b/i.test(draft)) {
    return 'fear of being left';
  }
  if (/\b(lied|lying|cheat|betray)\b/i.test(draft)) {
    return 'betrayed';
  }
  if (/\b(reject|dismissed|unwanted)\b/i.test(draft)) {
    return 'rejected';
  }
  if (/\b(angry|furious|pissed|mad)\b/i.test(draft)) {
    return 'angry';
  }
  if (/\b(hurt|pain|wounded)\b/i.test(draft)) {
    return 'hurt';
  }
  return 'frustrated and upset';
}

export function extractCoreSituation(draft: string): string {
  if (/\bnot\s+(replying|responding|answering)\b/i.test(draft) || /\bhaven('t|t)\s+(replied|responded)\b/i.test(draft)) {
    return 'lack of response';
  }
  if (/\b\d+\s*(day|hour|minute)s?\b/i.test(draft)) {
    const match = draft.match(/\b(\d+)\s*(day|hour|minute)s?\b/i);
    if (match) return `${match[1]} ${match[2]}${parseInt(match[1]) > 1 ? 's' : ''} of silence`;
  }
  if (/\b(ignored|ignoring)\b/i.test(draft)) {
    return 'feeling ignored';
  }
  return 'a difficult situation';
}
