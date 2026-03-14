import {
  SecureRewriteQualityScore,
} from '@/types/secureRewrite';
import {
  SECURE_QUALITY_THRESHOLDS,
  hasBlockedContent,
  countPressureSignals,
  countOverexplainingSignals,
} from '@/services/messages/secureRewritePrinciples';

const BLAME_PATTERNS = [
  /\byou\s+always\b/i,
  /\byou\s+never\b/i,
  /\bit('s|\s+is)\s+(all\s+)?your\s+fault\b/i,
  /\bhow\s+(could|dare)\s+you\b/i,
  /\bwhat('s|\s+is)\s+wrong\s+with\s+you\b/i,
  /\byou\s+don('t|t)\s+(even\s+)?(care|try)\b/i,
];

const REASSURANCE_PATTERNS = [
  /\bdo\s+you\s+(still\s+)?(love|care|want)\s+me\b/i,
  /\bare\s+we\s+(okay|ok|good|fine)\b/i,
  /\bpromise\s+(me\s+)?(you\s+won't|you'll)\b/i,
  /\btell\s+me\s+(it('s|\s+is)\s+)?(okay|ok|fine)\b/i,
  /\bplease\s+don('t|t)\s+(leave|go|abandon)\b/i,
];

const DIGNITY_INDICATORS = [
  /\bi\s+feel\b/i,
  /\bi\s+need\b/i,
  /\bi('m|\s+am)\s+(choosing|stepping|setting)\b/i,
  /\bmy\s+(peace|wellbeing|boundary)\b/i,
  /\bthis\s+doesn('t|t)\s+work\s+for\s+me\b/i,
  /\bi\s+deserve\b/i,
  /\bprotect(ing)?\s+my\b/i,
];

const CLARITY_INDICATORS = [
  /\bi\s+feel\b/i,
  /\bi\s+need\b/i,
  /\bi\s+want\s+to\b/i,
  /\bi('m|\s+am)\s+(feeling|sharing|asking)\b/i,
];

const BOUNDARY_INDICATORS = [
  /\bstepping\s+back\b/i,
  /\bprotect(ing)?\s+my\b/i,
  /\bdoesn('t|t)\s+work\s+for\s+me\b/i,
  /\bmy\s+(limit|boundary)\b/i,
  /\bneed\s+space\b/i,
  /\bi('m|\s+am)\s+choosing\b/i,
  /\bi('m|\s+am)\s+not\s+going\s+to\b/i,
];

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    return count + (matches ? matches.length : 0);
  }, 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function scoreSecureRewrite(text: string): SecureRewriteQualityScore {
  console.log('[SecureScoring] Scoring rewrite, length:', text.length);

  const wordCount = text.split(/\s+/).length;
  const issues: string[] = [];

  const hasBlocked = hasBlockedContent(text);
  if (hasBlocked) {
    issues.push('Contains blocked language');
  }

  const blameCount = countMatches(text, BLAME_PATTERNS);
  const reassuranceCount = countMatches(text, REASSURANCE_PATTERNS);
  const pressureCount = countPressureSignals(text);
  const overexplainingCount = countOverexplainingSignals(text) + (wordCount > 80 ? 1 : 0);
  const dignityCount = countMatches(text, DIGNITY_INDICATORS);
  const clarityCount = countMatches(text, CLARITY_INDICATORS);
  const boundaryCount = countMatches(text, BOUNDARY_INDICATORS);

  const capsRatio = text.replace(/[^A-Z]/g, '').length / Math.max(text.replace(/[^a-zA-Z]/g, '').length, 1);
  const exclamationCount = (text.match(/!/g) || []).length;

  const clarity = clamp(
    (clarityCount * 2) + (wordCount < 60 ? 2 : 0) + (blameCount === 0 ? 2 : 0) + (pressureCount === 0 ? 1 : 0),
    0, 10
  );

  const dignity = clamp(
    (dignityCount * 1.5) + (hasBlocked ? 0 : 3) + (blameCount === 0 ? 2 : 0) + (reassuranceCount === 0 ? 1 : 0),
    0, 10
  );

  const emotionalHonesty = clamp(
    (/i\s+feel|i('m|\s+am)\s+feeling|i\s+felt/i.test(text) ? 4 : 0) +
    (/frustrat|hurt|upset|vulnerable|difficult|hard/i.test(text) ? 3 : 0) +
    (blameCount === 0 ? 2 : 0),
    0, 10
  );

  const escalationRisk = clamp(
    (hasBlocked ? 8 : 0) +
    (blameCount * 2) +
    (pressureCount * 2) +
    (capsRatio > 0.4 ? 3 : 0) +
    (exclamationCount > 2 ? 2 : 0),
    0, 10
  );

  const reassuranceSeeking = clamp(reassuranceCount * 3, 0, 10);

  const overexplaining = clamp(
    (overexplainingCount * 2) + (wordCount > 100 ? 2 : wordCount > 80 ? 1 : 0),
    0, 10
  );

  const boundaryStrength = clamp(
    (boundaryCount * 2) + (hasBlocked ? 0 : 2) + (dignityCount > 0 ? 1 : 0),
    0, 10
  );

  const regretRisk = clamp(
    (hasBlocked ? 8 : 0) +
    (blameCount * 1.5) +
    (pressureCount * 1.5) +
    (escalationRisk * 0.3),
    0, 10
  );

  const overall = Math.round(
    (clarity * 0.15) +
    (dignity * 0.2) +
    (emotionalHonesty * 0.1) +
    ((10 - escalationRisk) * 0.2) +
    ((10 - reassuranceSeeking) * 0.1) +
    ((10 - overexplaining) * 0.05) +
    (boundaryStrength * 0.1) +
    ((10 - regretRisk) * 0.1)
  );

  if (clarity < SECURE_QUALITY_THRESHOLDS.minClarity) {
    issues.push('Low clarity');
  }
  if (dignity < SECURE_QUALITY_THRESHOLDS.minDignity) {
    issues.push('Low dignity');
  }
  if (escalationRisk > SECURE_QUALITY_THRESHOLDS.maxEscalationRisk) {
    issues.push('Escalation risk too high');
  }
  if (reassuranceSeeking > SECURE_QUALITY_THRESHOLDS.maxReassuranceSeeking) {
    issues.push('Too much reassurance-seeking');
  }
  if (overexplaining > SECURE_QUALITY_THRESHOLDS.maxOverexplaining) {
    issues.push('Over-explaining');
  }
  if (regretRisk > SECURE_QUALITY_THRESHOLDS.maxRegretRisk) {
    issues.push('High regret risk');
  }

  const passed = issues.length === 0 && overall >= SECURE_QUALITY_THRESHOLDS.minOverallScore;

  console.log('[SecureScoring] Score:', overall, 'Passed:', passed, 'Issues:', issues);

  return {
    clarity,
    dignity,
    emotionalHonesty,
    escalationRisk,
    reassuranceSeeking,
    overexplaining,
    boundaryStrength,
    regretRisk,
    overall,
    passed,
    issues,
  };
}

export function scoreOriginalDraft(text: string): SecureRewriteQualityScore {
  return scoreSecureRewrite(text);
}
