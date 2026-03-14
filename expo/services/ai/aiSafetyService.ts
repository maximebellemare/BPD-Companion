import {
  SafetyLevel,
  SafetySignal,
  SafetySignalType,
  SafetyAssessment,
  SafetyAction,
  SafetyInterventionConfig,
  AIOutputSafetyCheck,
  AIOutputViolation,
  AIOutputViolationType,
  CRISIS_RESOURCES,
} from '@/types/aiSafety';

const SUICIDAL_IDEATION_PHRASES = [
  'want to die',
  'kill myself',
  'ending it all',
  'ending it',
  'better off dead',
  'wish i was dead',
  'wish i were dead',
  'don\'t want to be alive',
  'no reason to live',
  'not worth living',
  'want to end my life',
  'plan to kill',
  'going to kill myself',
  'take my own life',
  'suicide',
  'rather be dead',
  'wanna die',
  'want to be dead',
];

const SELF_HARM_PHRASES = [
  'hurt myself',
  'cut myself',
  'cutting myself',
  'self harm',
  'self-harm',
  'burn myself',
  'hitting myself',
  'punish myself physically',
  'scratch myself',
  'hurting myself',
  'want to bleed',
  'harm myself',
];

const HOPELESSNESS_PHRASES = [
  'no point',
  'nothing matters',
  'no hope',
  'hopeless',
  'nothing will ever get better',
  'it will never change',
  'there\'s no way out',
  'no way out',
  'can\'t go on',
  'can\'t keep going',
  'what\'s the point',
  'nothing left',
  'no future',
  'give up on everything',
  'given up',
  'no one would care if i',
  'no one would notice if i',
  'world would be better without me',
  'everyone would be better off',
  'burden to everyone',
  'just a burden',
];

const EXTREME_DISTRESS_PHRASES = [
  'can\'t take it anymore',
  'can\'t do this anymore',
  'can\'t handle this',
  'falling apart',
  'losing my mind',
  'going crazy',
  'completely broken',
  'shattered',
  'destroyed',
  'can\'t breathe',
  'spiraling out of control',
  'about to lose it',
  'at my breaking point',
  'breaking point',
];

const DISSOCIATION_PHRASES = [
  'don\'t feel real',
  'nothing feels real',
  'feel like i\'m watching myself',
  'disconnected from my body',
  'can\'t feel anything',
  'completely numb',
  'floating away',
  'losing time',
  'blacking out',
  'not real',
  'depersonalization',
  'derealization',
];

const SEVERE_SELF_HATRED_PHRASES = [
  'hate myself',
  'i am worthless',
  'i\'m worthless',
  'i am nothing',
  'i\'m nothing',
  'i am garbage',
  'i\'m garbage',
  'i don\'t deserve',
  'i am disgusting',
  'i\'m disgusting',
  'i am a monster',
  'i\'m a monster',
  'i am unlovable',
  'i\'m unlovable',
  'no one could ever love me',
  'fundamentally broken',
  'i am toxic',
  'i\'m toxic',
  'everyone hates me',
  'pathetic excuse',
];

const NEGATION_PREFIXES = [
  'i don\'t ',
  'i do not ',
  'never ',
  'not going to ',
  'won\'t ',
  'wouldn\'t ',
  'i\'m not going to ',
  'i am not going to ',
  'my friend ',
  'someone i know ',
  'a character ',
  'in the movie ',
  'in the show ',
  'in the book ',
];

function isNegated(text: string, phraseIndex: number): boolean {
  const preceding = text.substring(Math.max(0, phraseIndex - 30), phraseIndex).toLowerCase();
  return NEGATION_PREFIXES.some(prefix => preceding.endsWith(prefix));
}

function detectSignals(text: string): SafetySignal[] {
  const lower = text.toLowerCase();
  const signals: SafetySignal[] = [];

  const phraseGroups: Array<{
    type: SafetySignalType;
    phrases: string[];
    requiresCrisisResource: boolean;
    baseConfidence: number;
  }> = [
    { type: 'suicidal_ideation', phrases: SUICIDAL_IDEATION_PHRASES, requiresCrisisResource: true, baseConfidence: 0.9 },
    { type: 'self_harm', phrases: SELF_HARM_PHRASES, requiresCrisisResource: true, baseConfidence: 0.85 },
    { type: 'hopelessness', phrases: HOPELESSNESS_PHRASES, requiresCrisisResource: false, baseConfidence: 0.7 },
    { type: 'extreme_distress', phrases: EXTREME_DISTRESS_PHRASES, requiresCrisisResource: false, baseConfidence: 0.65 },
    { type: 'dissociation', phrases: DISSOCIATION_PHRASES, requiresCrisisResource: false, baseConfidence: 0.6 },
    { type: 'severe_self_hatred', phrases: SEVERE_SELF_HATRED_PHRASES, requiresCrisisResource: false, baseConfidence: 0.6 },
  ];

  for (const group of phraseGroups) {
    for (const phrase of group.phrases) {
      const index = lower.indexOf(phrase);
      if (index !== -1) {
        if (isNegated(lower, index)) {
          console.log(`[AISafety] Phrase "${phrase}" detected but appears negated, skipping`);
          continue;
        }

        const alreadyDetected = signals.some(s => s.type === group.type);
        if (!alreadyDetected) {
          signals.push({
            type: group.type,
            matchedPhrase: phrase,
            confidence: group.baseConfidence,
            requiresCrisisResource: group.requiresCrisisResource,
          });
        } else {
          const existing = signals.find(s => s.type === group.type);
          if (existing) {
            existing.confidence = Math.min(1.0, existing.confidence + 0.05);
          }
        }
      }
    }
  }

  return signals;
}

function determineSafetyLevel(signals: SafetySignal[]): SafetyLevel {
  if (signals.length === 0) return 'safe';

  const hasSuicidal = signals.some(s => s.type === 'suicidal_ideation');
  const hasSelfHarm = signals.some(s => s.type === 'self_harm');
  const hasHopelessness = signals.some(s => s.type === 'hopelessness');
  const hasExtremeDistress = signals.some(s => s.type === 'extreme_distress');
  const hasSevereHatred = signals.some(s => s.type === 'severe_self_hatred');

  if (hasSuicidal || hasSelfHarm) return 'crisis';

  if (hasHopelessness && (hasExtremeDistress || hasSevereHatred)) return 'crisis';
  if (hasHopelessness && signals.length >= 2) return 'high_risk';

  if (hasExtremeDistress || hasSevereHatred) return 'high_risk';
  if (hasHopelessness) return 'high_risk';

  return 'elevated';
}

function determineActions(level: SafetyLevel, signals: SafetySignal[]): SafetyAction[] {
  const actions: SafetyAction[] = [];

  if (level === 'crisis') {
    actions.push('show_crisis_resources');
    actions.push('shift_to_supportive_tone');
    actions.push('suggest_grounding');
    actions.push('encourage_trusted_contact');
    actions.push('activate_crisis_mode');
    if (signals.some(s => s.type === 'suicidal_ideation')) {
      actions.push('offer_safety_plan');
    }
  } else if (level === 'high_risk') {
    actions.push('shift_to_supportive_tone');
    actions.push('suggest_grounding');
    actions.push('suggest_breathing');
    actions.push('encourage_trusted_contact');
    if (signals.some(s => s.requiresCrisisResource)) {
      actions.push('show_crisis_resources');
    }
  } else if (level === 'elevated') {
    actions.push('shift_to_supportive_tone');
    actions.push('suggest_grounding');
  }

  return actions;
}

function buildCrisisResourceText(level: SafetyLevel, signals: SafetySignal[]): string | null {
  if (level !== 'crisis' && !signals.some(s => s.requiresCrisisResource)) return null;

  const parts: string[] = [];

  if (signals.some(s => s.type === 'suicidal_ideation')) {
    parts.push(`If you're having thoughts of ending your life, please reach out to the ${CRISIS_RESOURCES.hotline988.name} — ${CRISIS_RESOURCES.hotline988.action}. ${CRISIS_RESOURCES.hotline988.description}.`);
    parts.push(`You can also ${CRISIS_RESOURCES.crisisText.action} to reach the ${CRISIS_RESOURCES.crisisText.name}.`);
  } else if (signals.some(s => s.type === 'self_harm')) {
    parts.push(`If you're thinking about hurting yourself, the ${CRISIS_RESOURCES.hotline988.name} is available 24/7 — ${CRISIS_RESOURCES.hotline988.action}.`);
    parts.push(`Or ${CRISIS_RESOURCES.crisisText.action} for the ${CRISIS_RESOURCES.crisisText.name}.`);
  } else {
    parts.push(`Support is available 24/7 through the ${CRISIS_RESOURCES.hotline988.name} — ${CRISIS_RESOURCES.hotline988.action}.`);
  }

  return parts.join(' ');
}

export function assessInputSafety(text: string): SafetyAssessment {
  console.log('[AISafety] Assessing input safety for text length:', text.length);

  const signals = detectSignals(text);
  const level = determineSafetyLevel(signals);
  const actions = determineActions(level, signals);
  const crisisResourceText = buildCrisisResourceText(level, signals);

  const assessment: SafetyAssessment = {
    level,
    signals,
    requiresCrisisResources: signals.some(s => s.requiresCrisisResource) || level === 'crisis',
    requiresGrounding: level !== 'safe',
    shouldBlockHarmfulContent: false,
    recommendedActions: actions,
    crisisResourceText,
    timestamp: Date.now(),
  };

  if (level !== 'safe') {
    console.log('[AISafety] Safety concern detected:', level, 'signals:', signals.map(s => s.type).join(', '));
  }

  return assessment;
}

export function getInterventionConfig(assessment: SafetyAssessment): SafetyInterventionConfig {
  return {
    showCrisisHotline: assessment.requiresCrisisResources,
    showGroundingTools: assessment.level !== 'safe',
    showBreathingExercise: assessment.level === 'high_risk' || assessment.level === 'crisis',
    showTrustedContactPrompt: assessment.level === 'crisis' || assessment.level === 'high_risk',
    showSafetyPlanLink: assessment.recommendedActions.includes('offer_safety_plan'),
    toneOverride: assessment.level === 'crisis' ? 'crisis' : assessment.level === 'high_risk' ? 'grounding' : assessment.level === 'elevated' ? 'supportive' : null,
    blockGenerativeResponse: false,
  };
}

const OUTPUT_DISMISSIVE_PHRASES = [
  'just think positive',
  'it\'s not that bad',
  'you\'re overreacting',
  'calm down',
  'get over it',
  'it could be worse',
  'others have it worse',
  'just be happy',
  'stop being dramatic',
  'you\'re being dramatic',
  'there\'s nothing wrong',
  'snap out of it',
  'just stop',
  'you\'re fine',
  'it\'s all in your head',
  'toughen up',
  'man up',
  'suck it up',
  'just relax',
  'don\'t worry about it',
];

const OUTPUT_HARMFUL_ADVICE_PHRASES = [
  'you should confront them aggressively',
  'give them a taste of their own medicine',
  'they deserve to suffer',
  'revenge',
  'make them pay',
  'hurt them back',
  'ghost them',
  'you don\'t need anyone',
  'isolation is healthy',
  'stop taking your medication',
  'you don\'t need therapy',
  'therapists are useless',
];

const OUTPUT_CLINICAL_DIAGNOSIS_PHRASES = [
  'you have bpd',
  'you are borderline',
  'you have narcissistic',
  'you are bipolar',
  'you have depression',
  'your diagnosis is',
  'you\'re clearly suffering from',
  'you exhibit signs of',
  'you need to be diagnosed',
];

const OUTPUT_INAPPROPRIATE_POSITIVITY_PHRASES = [
  'everything happens for a reason',
  'look on the bright side',
  'at least you',
  'it\'ll all work out',
  'just be grateful',
  'count your blessings',
  'every cloud has a silver lining',
  'what doesn\'t kill you',
  'good vibes only',
];

const OUTPUT_UPSELL_PHRASES = [
  'upgrade to premium',
  'premium feature',
  'subscribe',
  'paid plan',
  'unlock',
  'purchase',
];

export function checkOutputSafety(
  aiResponse: string,
  inputAssessment: SafetyAssessment,
): AIOutputSafetyCheck {
  const lower = aiResponse.toLowerCase();
  const violations: AIOutputViolation[] = [];

  const checkPhrases = (
    phrases: string[],
    type: AIOutputViolationType,
    description: string,
  ) => {
    for (const phrase of phrases) {
      if (lower.includes(phrase)) {
        violations.push({
          type,
          description,
          matchedContent: phrase,
        });
        break;
      }
    }
  };

  checkPhrases(OUTPUT_DISMISSIVE_PHRASES, 'dismissive_of_pain', 'Response contains dismissive language that minimizes the user\'s experience');
  checkPhrases(OUTPUT_HARMFUL_ADVICE_PHRASES, 'harmful_advice', 'Response contains potentially harmful advice');
  checkPhrases(OUTPUT_CLINICAL_DIAGNOSIS_PHRASES, 'clinical_diagnosis', 'Response contains clinical diagnostic language');

  if (inputAssessment.level === 'crisis' || inputAssessment.level === 'high_risk') {
    checkPhrases(OUTPUT_INAPPROPRIATE_POSITIVITY_PHRASES, 'inappropriate_positivity', 'Response uses toxic positivity during a crisis moment');
    checkPhrases(OUTPUT_UPSELL_PHRASES, 'upsell_during_crisis', 'Response mentions premium features during emotional crisis');
  }

  const selfHarmEncouragingPhrases = ['you should hurt', 'go ahead and', 'nothing stopping you', 'you could always end'];
  for (const phrase of selfHarmEncouragingPhrases) {
    if (lower.includes(phrase)) {
      violations.push({
        type: 'encourages_self_harm',
        description: 'Response may encourage self-harm',
        matchedContent: phrase,
      });
    }
  }

  if (inputAssessment.level === 'crisis') {
    const mentionsCrisisResource = lower.includes('988') || lower.includes('crisis line') || lower.includes('crisis lifeline') || lower.includes('crisis text');
    const mentionsSupport = lower.includes('someone you trust') || lower.includes('reach out') || lower.includes('not alone') || lower.includes('support');

    if (!mentionsCrisisResource && !mentionsSupport) {
      violations.push({
        type: 'breaks_crisis_protocol',
        description: 'Response does not mention crisis resources or support during a crisis-level interaction',
        matchedContent: '',
      });
    }
  }

  const hasCriticalViolation = violations.some(v =>
    v.type === 'encourages_self_harm' || v.type === 'harmful_advice'
  );

  let sanitizedContent: string | null = null;
  if (hasCriticalViolation) {
    sanitizedContent = buildSafetyFallbackResponse(inputAssessment);
  }

  console.log('[AISafety] Output check:', violations.length, 'violations found', hasCriticalViolation ? '(CRITICAL)' : '');

  return {
    isAcceptable: violations.length === 0,
    violations,
    sanitizedContent,
  };
}

function buildSafetyFallbackResponse(assessment: SafetyAssessment): string {
  const parts: string[] = [];

  if (assessment.level === 'crisis') {
    parts.push("I hear you, and what you're going through sounds incredibly painful right now. You don't have to face this alone.");
    parts.push("\nLet's take one breath together. In through your nose... and slowly out through your mouth.");
    if (assessment.crisisResourceText) {
      parts.push(`\n${assessment.crisisResourceText}`);
    }
    parts.push("\nI'm here with you. We can take this one moment at a time.");
  } else if (assessment.level === 'high_risk') {
    parts.push("I can feel how much pain you're carrying right now. That's real, and it matters.");
    parts.push("\nLet's slow everything down. Place your feet on the ground and take one steady breath.");
    parts.push("\nYou reached out, and that takes courage. What feels like the most urgent thing right now?");
  } else {
    parts.push("I hear what you're going through, and I want you to know it's valid.");
    parts.push("\nLet's take a moment before we go further. How intense is this feeling right now?");
  }

  return parts.join('');
}

export function augmentResponseWithSafety(
  aiResponse: string,
  assessment: SafetyAssessment,
): string {
  if (assessment.level === 'safe') return aiResponse;

  const lower = aiResponse.toLowerCase();

  if (assessment.level === 'crisis' && assessment.crisisResourceText) {
    const hasCrisisInfo = lower.includes('988') || lower.includes('crisis line') || lower.includes('crisis lifeline');
    if (!hasCrisisInfo) {
      return `${aiResponse}\n\n${assessment.crisisResourceText}`;
    }
  }

  return aiResponse;
}

export function buildSafetyPromptInjection(assessment: SafetyAssessment): string {
  if (assessment.level === 'safe') return '';

  const parts: string[] = ['[SAFETY OVERRIDE — FOLLOW THESE RULES STRICTLY]'];

  if (assessment.level === 'crisis') {
    parts.push('The user is in CRISIS. Follow this protocol exactly:');
    parts.push('1. Acknowledge their pain directly and specifically. Use their words.');
    parts.push('2. Do NOT minimize, redirect, or offer generic advice.');
    parts.push('3. Offer ONE grounding step (breathing or sensory).');
    parts.push('4. Mention the 988 Suicide & Crisis Lifeline (call or text 988) naturally and compassionately.');
    parts.push('5. Stay present. Say "I\'m here" or equivalent.');
    parts.push('6. Do NOT ask complex questions.');
    parts.push('7. Do NOT mention premium features, upgrades, or redirects.');
    parts.push('8. Keep response SHORT — 3-5 sentences max.');
    parts.push('9. Do NOT use toxic positivity ("it will get better", "look on the bright side").');
    parts.push('10. If the user mentions suicidal thoughts, ALWAYS mention 988.');
  } else if (assessment.level === 'high_risk') {
    parts.push('The user is in HIGH DISTRESS. Follow this protocol:');
    parts.push('1. Validate their pain first. Be specific, not generic.');
    parts.push('2. Offer grounding before anything else.');
    parts.push('3. Keep response short and warm.');
    parts.push('4. Do NOT diagnose, lecture, or list multiple strategies.');
    parts.push('5. Gently encourage reaching out to someone they trust if appropriate.');
    parts.push('6. Do NOT mention premium features.');
    parts.push('7. Do NOT use toxic positivity.');
    parts.push('8. If hopelessness is present, acknowledge it without trying to immediately fix it.');
  } else if (assessment.level === 'elevated') {
    parts.push('The user shows elevated emotional distress:');
    parts.push('1. Lead with validation and empathy.');
    parts.push('2. Be warm and present.');
    parts.push('3. Offer one grounding option if it feels natural.');
    parts.push('4. Avoid dismissive language or toxic positivity.');
  }

  if (assessment.signals.some(s => s.type === 'dissociation')) {
    parts.push('DISSOCIATION DETECTED: Use sensory-focused language. Help the user feel their body. "Can you feel your feet on the ground?" "What can you see right now?"');
  }

  if (assessment.signals.some(s => s.type === 'severe_self_hatred')) {
    parts.push('SEVERE SELF-HATRED DETECTED: Do NOT challenge their self-perception directly. Instead, sit with the pain. "That\'s such a heavy thing to carry." Then gently offer an alternative perspective only if it feels natural.');
  }

  parts.push('[END SAFETY OVERRIDE]');

  return parts.join('\n');
}

export function shouldShowInterventionBanner(assessment: SafetyAssessment): boolean {
  return assessment.level === 'crisis' || assessment.level === 'high_risk';
}

export function getInterventionPriority(assessment: SafetyAssessment): number {
  switch (assessment.level) {
    case 'crisis': return 1;
    case 'high_risk': return 2;
    case 'elevated': return 3;
    default: return 4;
  }
}
