export interface DontSendItAnalysis {
  emotionalIntensity: number;
  likelyEmotionalState: string;
  appearsReactive: boolean;
  impulsivityRisk: DontSendItImpulsivityRisk;
  impulsivityReason: string;
  riskSignals: string[];
  whatImHearing: string;
  whatImNoticing: string[];
  possibleConsequences: string[];
  potentialImpact: string[];
  patternCheck: string[];
  calmerVersion: string;
  rewriteOptions: DontSendItRewriteOption[];
  suggestedWaitingPeriod: '5 min' | '20 min' | '1 hour' | 'Tomorrow';
  waitingSuggestion: string;
}

export type DontSendItRecipient = 'partner' | 'parent' | 'friend' | 'ex' | 'coworker' | 'other';
export type DontSendItDesiredOutcome =
  | 'express_hurt'
  | 'set_boundary'
  | 'start_conversation'
  | 'get_response'
  | 'end_relationship'
  | 'vent_only';
export type DontSendItImpulsivityRisk = 'low' | 'medium' | 'high' | 'very_high';
export type DontSendItRewriteInstruction =
  | 'more_direct'
  | 'less_direct'
  | 'more_compassionate'
  | 'more_assertive'
  | 'shorter'
  | 'longer';

export interface DontSendItRewriteOption {
  id: 'calm' | 'direct' | 'boundary' | 'repair' | 'short';
  label: string;
  description: string;
  text: string;
}

export const DONT_SEND_IT_RECIPIENT_LABELS: Record<DontSendItRecipient, string> = {
  partner: 'Partner',
  parent: 'Parent',
  friend: 'Friend',
  ex: 'Ex',
  coworker: 'Coworker',
  other: 'Other',
};

export const DONT_SEND_IT_OUTCOME_LABELS: Record<DontSendItDesiredOutcome, string> = {
  express_hurt: 'Express hurt',
  set_boundary: 'Set a boundary',
  start_conversation: 'Start a conversation',
  get_response: 'Get a response',
  end_relationship: 'End the relationship',
  vent_only: 'Vent only',
};

export const DONT_SEND_IT_RISK_LABELS: Record<DontSendItImpulsivityRisk, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very High',
};

export const DONT_SEND_IT_INSTRUCTION_LABELS: Record<DontSendItRewriteInstruction, string> = {
  more_direct: 'More direct',
  less_direct: 'Less direct',
  more_compassionate: 'More compassionate',
  more_assertive: 'More assertive',
  shorter: 'Shorter',
  longer: 'Longer',
};

export interface DontSendItContext {
  recipient?: DontSendItRecipient;
  desiredOutcome?: DontSendItDesiredOutcome;
  rewriteInstruction?: DontSendItRewriteInstruction | null;
  previousConversationTexts?: string[];
  emotionalTimelineSummaries?: string[];
  abandonmentFears?: string[];
  rejectionPatterns?: string[];
  relationshipPatterns?: string[];
  recentTriggers?: string[];
  recentEmotions?: string[];
}

const REACTIVE_TERMS = [
  'always',
  'never',
  'whatever',
  'done with you',
  'you do not care',
  "you don't care",
  'leave me alone',
  'i hate',
  'screw you',
  'fuck',
  'stupid',
  'pathetic',
  'regret',
  'blocked',
  'ignore me',
];

const HOSTILE_TERMS = [
  'fuck',
  'fuck you',
  'go fuck',
  'fuck off',
  'screw you',
  'go to hell',
  'shut up',
  'asshole',
  'bitch',
  'idiot',
  'stupid',
  'pathetic',
  'worthless',
  'hate you',
];

const THREAT_PATTERNS = [
  /\bi('| wi)ll (hurt|ruin|destroy|expose|humiliate)\b/i,
  /\byou'?ll regret\b/i,
  /\bwatch what happens\b/i,
  /\bi'?m going to (show up|come over|make you|tell everyone)\b/i,
  /\bi hope you (suffer|hurt|pay)\b/i,
];

const EMOTION_RULES: Array<{ label: string; terms: string[] }> = [
  { label: 'anger or hurt', terms: ['angry', 'mad', 'furious', 'hate', 'disrespect', 'unfair', 'hurt'] },
  { label: 'abandonment fear', terms: ['leave', 'leaving', 'abandon', 'ignored', 'no reply', 'reply', 'text back', 'forgot'] },
  { label: 'shame or self-blame', terms: ['my fault', 'i ruin', 'i messed up', 'sorry for existing', 'too much'] },
  { label: 'anxiety or urgency', terms: ['right now', 'answer me', 'need to know', 'can not wait', "can't wait", 'please respond'] },
  { label: 'sadness or rejection', terms: ['rejected', 'unwanted', 'not important', 'alone', 'lonely'] },
];

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function countMatches(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  return terms.reduce((count, term) => count + (lower.includes(term) ? 1 : 0), 0);
}

function estimateIntensity(message: string): number {
  const trimmed = message.trim();
  if (!trimmed) return 1;

  let score = 2;
  score += Math.min(3, countMatches(trimmed, REACTIVE_TERMS));
  score += Math.min(2, (trimmed.match(/!/g) ?? []).length);
  score += /[A-Z]{5,}/.test(trimmed) ? 1 : 0;
  score += trimmed.length > 500 ? 1 : 0;
  score += /\b(now|immediately|answer me|text me back)\b/i.test(trimmed) ? 1 : 0;
  score += /\b(always|never|everyone|nothing|everything)\b/i.test(trimmed) ? 1 : 0;

  return Math.max(1, Math.min(10, score));
}

function extractRiskSignals(message: string): string[] {
  const lower = message.toLowerCase();
  const signals: string[] = [];
  const hostileHits = countMatches(lower, HOSTILE_TERMS);
  const threatHit = THREAT_PATTERNS.some(pattern => pattern.test(message));
  const hasSecondPerson = /\byou\b/i.test(message);
  const hasPersonalAttack = hasSecondPerson && (
    hostileHits > 0 ||
    /\b(you are|you're|ur)\s+(a\s+)?(idiot|stupid|pathetic|worthless|awful|terrible|crazy|selfish)\b/i.test(message) ||
    /\bgo fuck yourself\b/i.test(message)
  );
  const repeatedAccusations = [
    /\byou always\b/i,
    /\byou never\b/i,
    /\byou don'?t care\b/i,
    /\byou ignored\b/i,
    /\byou lied\b/i,
    /\byou made me\b/i,
    /\byour fault\b/i,
  ].filter(pattern => pattern.test(message)).length;
  const emotionalPressure = /\b(answer me|text me back|right now|immediately|i need you to|if you cared)\b/i.test(message);
  const contempt = /\b(whatever|done with you|blocked|i hate|disgusting)\b/i.test(message);
  const allCaps = /[A-Z]{5,}/.test(message);
  const exclamations = (message.match(/!/g) ?? []).length;

  if (threatHit) signals.push('threatening language');
  if (hasPersonalAttack) signals.push('personal attack');
  if (hostileHits > 0) signals.push('hostility');
  if (repeatedAccusations >= 2) signals.push('repeated accusations');
  if (emotionalPressure) signals.push('urgency or pressure');
  if (contempt) signals.push('contempt or cutoff language');
  if (allCaps || exclamations >= 2) signals.push('high activation in tone');
  if (message.length > 220 && (hostileHits > 0 || repeatedAccusations > 0 || emotionalPressure)) {
    signals.push('emotional venting');
  }

  return [...new Set(signals)];
}

function boostIntensityForSignals(base: number, signals: string[]): number {
  let score = base;
  if (signals.includes('threatening language')) score = Math.max(score, 10);
  if (signals.includes('personal attack')) score = Math.max(score, 8);
  if (signals.includes('hostility')) score = Math.max(score, 8);
  if (signals.includes('repeated accusations')) score = Math.max(score, 7);
  if (signals.includes('emotional venting')) score = Math.max(score, 6);
  if (signals.includes('urgency or pressure')) score = Math.max(score, 6);
  return Math.max(1, Math.min(10, score));
}

function detectEmotion(message: string): string {
  const lower = message.toLowerCase();
  const matches = EMOTION_RULES
    .map(rule => ({ label: rule.label, count: rule.terms.filter(term => lower.includes(term)).length }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);
  return matches[0]?.label ?? 'heightened emotion';
}

function emotionDrivers(likelyEmotion: string, hasUrgency: boolean, hasBlame: boolean): string[] {
  const lower = likelyEmotion.toLowerCase();
  const drivers: string[] = [];
  if (lower.includes('anger') || lower.includes('hurt')) drivers.push('anger');
  if (lower.includes('rejection')) drivers.push('rejection');
  if (lower.includes('abandonment')) drivers.push('abandonment fear');
  if (lower.includes('shame')) drivers.push('shame');
  if (lower.includes('anxiety')) drivers.push('anxiety');
  if (hasUrgency) drivers.push('urgency');
  if (hasBlame) drivers.push('blame');
  return [...new Set(drivers)].slice(0, 3);
}

function summarizeEmotionalMessage(message: string, likelyEmotion: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('reply') || lower.includes('text back') || lower.includes('ignored')) {
    return `This sounds like a message asking for reassurance, contact, or proof that you still matter. Underneath it, I hear ${likelyEmotion}.`;
  }
  if (lower.includes('sorry') || lower.includes('my fault') || lower.includes('too much')) {
    return `This sounds like a message trying to repair quickly or reduce the fear of being too much. Underneath it, I hear ${likelyEmotion}.`;
  }
  if (lower.includes('disrespect') || lower.includes('unfair') || lower.includes('angry') || lower.includes('hate')) {
    return `This sounds like a message trying to protect your dignity after feeling hurt or dismissed. Underneath it, I hear ${likelyEmotion}.`;
  }
  return `This sounds emotionally loaded and important. Underneath the words, I hear ${likelyEmotion} and a need to be understood.`;
}

function getImpulsivityRisk(
  emotionalIntensity: number,
  reactiveHits: number,
  hasUrgency: boolean,
  riskSignals: string[],
): DontSendItImpulsivityRisk {
  if (riskSignals.includes('threatening language')) return 'very_high';
  if (
    emotionalIntensity >= 9 ||
    (riskSignals.includes('personal attack') && riskSignals.includes('hostility')) ||
    (riskSignals.includes('repeated accusations') && riskSignals.includes('urgency or pressure'))
  ) {
    return 'very_high';
  }
  if (
    emotionalIntensity >= 7 ||
    riskSignals.includes('personal attack') ||
    riskSignals.includes('hostility') ||
    riskSignals.includes('repeated accusations') ||
    reactiveHits >= 2 ||
    (emotionalIntensity >= 6 && hasUrgency)
  ) {
    return 'high';
  }
  if (emotionalIntensity >= 5 || reactiveHits > 0 || hasUrgency || riskSignals.includes('emotional venting')) return 'medium';
  return 'low';
}

function buildImpulsivityReason(
  likelyEmotion: string,
  emotionalIntensity: number,
  reactiveHits: number,
  hasUrgency: boolean,
  hasBlame: boolean,
  desiredOutcome?: DontSendItDesiredOutcome,
  riskSignals: string[] = [],
): string {
  const drivers = emotionDrivers(likelyEmotion, hasUrgency, hasBlame);
  const driverText = drivers.length > 0 ? drivers.join(' and ') : 'heightened emotion';
  const signals: string[] = [...riskSignals];
  if (reactiveHits > 0 && signals.length === 0) signals.push('reactive wording');
  if (hasUrgency && !signals.includes('urgency or pressure')) signals.push('urgency');
  if (hasBlame && !signals.includes('repeated accusations')) signals.push('blame language');
  if (emotionalIntensity >= 8) signals.push('very high emotional intensity');
  else if (emotionalIntensity >= 7) signals.push('high emotional intensity');
  if (desiredOutcome === 'vent_only') signals.push('a venting goal rather than a relationship goal');

  return signals.length > 0
    ? `This message appears driven by ${driverText}. I rated it this way because I noticed ${signals.slice(0, 5).join(', ')}. Messages written in this state are often regretted later.`
    : `This message appears relatively steady, with some ${driverText}. A short pause may still help it match your actual goal.`;
}

function baseRewriteOptions(
  recipient: DontSendItRecipient,
  desiredOutcome: DontSendItDesiredOutcome,
  emotionalIntensity: number,
): DontSendItRewriteOption[] {
  const isWork = recipient === 'coworker';
  const relationshipPhrase = recipient === 'coworker'
    ? 'work dynamic'
    : recipient === 'other'
      ? 'relationship dynamic'
      : 'relationship';

  const pauseLead = emotionalIntensity >= 7 ? 'I’m too activated to say this well right now. ' : '';
  const defaults: Record<DontSendItDesiredOutcome, DontSendItRewriteOption[]> = {
    vent_only: [
      { id: 'calm', label: 'Option A — Calm', description: 'Keeps the message private for now.', text: 'I’m really activated, and I need to get this out without sending it yet. I’m going to pause before turning this into a message.' },
      { id: 'direct', label: 'Option B — Direct', description: 'Names the pause clearly.', text: 'I’m upset and I’m not ready to respond productively. I’m taking time before I send anything.' },
      { id: 'boundary', label: 'Option C — Boundary Setting', description: 'Protects space without escalating.', text: 'I need space right now. I’ll come back to this when I can speak from a steadier place.' },
      { id: 'repair', label: 'Option D — Relationship Repair', description: 'Prevents damage while staying honest.', text: 'I’m upset, and I don’t want to say something damaging. I’m going to pause and talk later.' },
      { id: 'short', label: 'Option E — Short Version', description: 'Minimal and clear.', text: 'I’m upset. I need to pause before I respond.' },
    ],
    express_hurt: [
      { id: 'calm', label: 'Option A — Calm', description: 'Softens the opening.', text: isWork ? 'I wanted to name that this affected me more than I expected. I’d like to talk about it calmly when there’s space.' : 'I felt hurt by what happened, and I want to say it clearly instead of reacting. Can we talk when we both have a bit of space?' },
      { id: 'direct', label: 'Option B — Direct', description: 'Clear without attacking.', text: 'I felt hurt by what happened. I want to talk about it directly, but I don’t want this to turn into a fight.' },
      { id: 'boundary', label: 'Option C — Boundary Setting', description: 'Names the need.', text: 'I’m willing to talk this through, but I need the conversation to stay respectful and calm.' },
      { id: 'repair', label: 'Option D — Relationship Repair', description: 'Keeps connection open.', text: 'I care about us handling this well. I’m hurt, and I’d like us to understand what happened without escalating.' },
      { id: 'short', label: 'Option E — Short Version', description: 'Brief and steady.', text: 'That hurt me. Can we talk about it calmly later?' },
    ],
    set_boundary: [
      { id: 'calm', label: 'Option A — Calm', description: 'Firm but grounded.', text: isWork ? 'I want to be clear about what I need going forward. I’m open to discussing this, but I need the conversation to stay respectful and focused.' : 'I care about handling this well, and I also need to set a boundary. I’m willing to talk, but I need us to keep it respectful.' },
      { id: 'direct', label: 'Option B — Direct', description: 'Straightforward boundary.', text: 'I’m not okay continuing this conversation if it becomes hurtful. I’ll come back when we can speak respectfully.' },
      { id: 'boundary', label: 'Option C — Boundary Setting', description: 'Strongest boundary option.', text: 'I need this to stop here for now. I’m taking space, and we can revisit it when the conversation can stay respectful.' },
      { id: 'repair', label: 'Option D — Relationship Repair', description: 'Boundary plus care.', text: 'I want to repair this, but I can’t do that while we’re both activated. I’m taking space so I don’t make it worse.' },
      { id: 'short', label: 'Option E — Short Version', description: 'Short and clear.', text: 'I need this conversation to stay respectful, or I’m going to pause it.' },
    ],
    start_conversation: [
      { id: 'calm', label: 'Option A — Calm', description: 'Invites a steady conversation.', text: isWork ? 'Something from this situation has been on my mind. Is there a good time to talk through it so we can clear it up?' : 'Something has been sitting with me, and I’d rather talk about it calmly than make assumptions. Is there a good time for us to talk?' },
      { id: 'direct', label: 'Option B — Direct', description: 'Simple and clear.', text: 'I’d like to talk about what happened. I’m not trying to fight; I want to understand it better.' },
      { id: 'boundary', label: 'Option C — Boundary Setting', description: 'Sets a tone before talking.', text: 'I’m open to talking this through, but I want us to do it calmly and respectfully.' },
      { id: 'repair', label: 'Option D — Relationship Repair', description: 'Connection-first.', text: 'I don’t want to let this build into resentment. Can we talk about it when we both have space?' },
      { id: 'short', label: 'Option E — Short Version', description: 'Quick opening.', text: 'Can we talk about what happened later?' },
    ],
    get_response: [
      { id: 'calm', label: 'Option A — Calm', description: 'Asks without pressure.', text: isWork ? 'When you have a chance, could you let me know where this stands? I’d appreciate a quick update so I can plan accordingly.' : 'I’m feeling uneasy not hearing back, and I’m trying not to react from that. When you can, could you let me know where things stand?' },
      { id: 'direct', label: 'Option B — Direct', description: 'Clear ask.', text: 'Could you let me know when you have a chance? I’d rather not assume what the silence means.' },
      { id: 'boundary', label: 'Option C — Boundary Setting', description: 'Protects your nervous system.', text: 'I’m going to step away from checking my phone for a bit. Please reply when you’re able.' },
      { id: 'repair', label: 'Option D — Relationship Repair', description: 'Names care and uncertainty.', text: 'I care about this conversation, and the silence is bringing up a lot for me. Can you reply when you have space?' },
      { id: 'short', label: 'Option E — Short Version', description: 'Tiny nudge.', text: 'Can you let me know when you get a chance?' },
    ],
    end_relationship: [
      { id: 'calm', label: 'Option A — Calm', description: 'Best after a pause.', text: `${pauseLead}I have thought about this, and I don’t think continuing this ${relationshipPhrase} is right for me. I want to end this respectfully.` },
      { id: 'direct', label: 'Option B — Direct', description: 'Clear ending.', text: 'I don’t want to continue this relationship. I’m saying that clearly and respectfully.' },
      { id: 'boundary', label: 'Option C — Boundary Setting', description: 'Ends with a boundary.', text: 'I’m ending this relationship and I need space after this message. I won’t be discussing it while emotions are high.' },
      { id: 'repair', label: 'Option D — Relationship Repair', description: 'Less final, if unsure.', text: 'I’m very upset and need space. I don’t want to make a final decision while I’m this activated.' },
      { id: 'short', label: 'Option E — Short Version', description: 'Brief and firm.', text: 'I don’t think continuing this is right for me. I need to end it respectfully.' },
    ],
  };

  return defaults[desiredOutcome];
}

function applyRewriteInstruction(
  option: DontSendItRewriteOption,
  instruction?: DontSendItRewriteInstruction | null,
): DontSendItRewriteOption {
  if (!instruction) return option;
  const transformations: Record<DontSendItRewriteInstruction, string> = {
    more_direct: 'I want to be direct: ',
    less_direct: 'I may not be saying this perfectly, but ',
    more_compassionate: 'I care about how this lands, and ',
    more_assertive: 'I need to be clear: ',
    shorter: '',
    longer: '',
  };
  if (instruction === 'shorter') {
    const sentence = option.text.split(/[.!?]/).map(part => part.trim()).filter(Boolean)[0] ?? option.text;
    return { ...option, text: sentence.endsWith('.') ? sentence : `${sentence}.` };
  }
  if (instruction === 'longer') {
    return {
      ...option,
      text: `${option.text} I’m trying to respond in a way that is honest, respectful, and less likely to create regret later.`,
    };
  }
  return { ...option, text: `${transformations[instruction]}${option.text}` };
}

function buildPatternCheck(message: string, context?: DontSendItContext): string[] {
  const lower = message.toLowerCase();
  const checks: string[] = [];
  const joinedConversations = (context?.previousConversationTexts ?? []).join(' ').toLowerCase();
  const joinedPatterns = [
    ...(context?.emotionalTimelineSummaries ?? []),
    ...(context?.abandonmentFears ?? []),
    ...(context?.rejectionPatterns ?? []),
    ...(context?.relationshipPatterns ?? []),
    ...(context?.recentTriggers ?? []),
    ...(context?.recentEmotions ?? []),
  ].join(' ').toLowerCase();

  const abandonmentSignal = /\b(no reply|reply|text back|ignored|leave|leaving|abandon|forgot)\b/i.test(message);
  const rejectionSignal = /\b(rejected|unwanted|not important|don't care|do not care|ignored)\b/i.test(message);
  const regretSignal = joinedConversations.includes('regret') || joinedPatterns.includes('regret') || joinedPatterns.includes('spiral');
  const relationshipSignal = joinedPatterns.includes('relationship') || joinedPatterns.includes('partner') || joinedPatterns.includes('conflict');

  if (abandonmentSignal || joinedPatterns.includes('abandon')) {
    checks.push('This resembles moments where abandonment fear or uncertainty may be driving the urge to reach for reassurance.');
  }
  if (rejectionSignal || joinedPatterns.includes('rejection') || joinedPatterns.includes('rejected')) {
    checks.push('This may connect to rejection sensitivity: the message is trying to reduce the sting of feeling unwanted or dismissed.');
  }
  if (relationshipSignal || lower.includes('you')) {
    checks.push('This appears relationship-linked, so tone may matter as much as the content.');
  }
  if (regretSignal || /\b(always|never|done|blocked|hate)\b/i.test(message)) {
    checks.push('This resembles situations where you later felt regret or wanted a chance to say it differently.');
  }
  if ((context?.recentTriggers ?? []).length > 0 || (context?.recentEmotions ?? []).length > 0) {
    checks.push(`Based on recent entries, ${[...(context?.recentTriggers ?? []), ...(context?.recentEmotions ?? [])].slice(0, 2).join(' and ')} may be part of the current emotional pattern.`);
  }

  return checks.length > 0
    ? checks.slice(0, 4)
    : ['There is not enough saved pattern data yet, so this check is based mainly on the words in this draft.'];
}

function chooseWaitingPeriod(
  intensity: number,
  risk: DontSendItImpulsivityRisk,
  desiredOutcome?: DontSendItDesiredOutcome,
): DontSendItAnalysis['suggestedWaitingPeriod'] {
  if (desiredOutcome === 'end_relationship' && (intensity >= 7 || risk === 'high' || risk === 'very_high')) return 'Tomorrow';
  if (intensity >= 9 || risk === 'very_high') return 'Tomorrow';
  if (intensity >= 8 || risk === 'high') return '1 hour';
  if (intensity >= 7) return '20 min';
  if (intensity >= 5 || risk === 'medium') return '20 min';
  return '5 min';
}

function waitingCopy(period: DontSendItAnalysis['suggestedWaitingPeriod'], intensity: number): string {
  if (period === '1 hour') return 'Wait 1 hour if you can. Do something physical or grounding, then reread the calmer version before deciding.';
  if (period === '20 min') return 'Wait 20 minutes. Let the first emotional wave pass, then check whether this still says what you mean.';
  if (period === 'Tomorrow') return 'Sleep on it and decide tomorrow. This is for messages that could change the relationship.';
  return intensity >= 4
    ? 'Wait 5 minutes and reread it once. A small pause can still change the tone.'
    : 'Wait 5 minutes, then send only if it still feels clear and respectful.';
}

export function analyzeDontSendItMessage(
  message: string,
  context?: DontSendItContext,
): DontSendItAnalysis {
  const trimmed = normalize(message);
  const riskSignals = extractRiskSignals(trimmed);
  const emotionalIntensity = boostIntensityForSignals(estimateIntensity(trimmed), riskSignals);
  const likelyEmotionalState = detectEmotion(trimmed);
  const reactiveHits = countMatches(trimmed, REACTIVE_TERMS);
  const appearsReactive = emotionalIntensity >= 6 || reactiveHits > 0 || riskSignals.length > 0 || /!{2,}|[A-Z]{5,}/.test(trimmed);
  const hasBlame = /\byou\b/i.test(trimmed) && /\b(always|never|made me|your fault|you don't|you do not)\b/i.test(trimmed);
  const hasUrgency = /\b(now|right now|immediately|answer me|text me back|reply)\b/i.test(trimmed);
  const recipient = context?.recipient ?? 'other';
  const desiredOutcome = context?.desiredOutcome;
  const impulsivityRisk = getImpulsivityRisk(emotionalIntensity, reactiveHits, hasUrgency, riskSignals);
  const suggestedWaitingPeriod = chooseWaitingPeriod(emotionalIntensity, impulsivityRisk, desiredOutcome);
  const rewriteOptions = baseRewriteOptions(recipient, desiredOutcome ?? 'start_conversation', emotionalIntensity)
    .map(option => applyRewriteInstruction(option, context?.rewriteInstruction));

  const whatImNoticing = [
    appearsReactive
      ? 'The message appears reactive, which means it may be coming from urgency rather than your clearest self.'
      : 'The message does not look highly reactive, but a short pause may still help it land better.',
  ];

  if (hasBlame) {
    whatImNoticing.push('There is some blame language that could make the other person defend themselves instead of hearing you.');
  }
  if (hasUrgency) {
    whatImNoticing.push('There is urgency in the message, which can make the conversation feel pressured.');
  }
  if (desiredOutcome) {
    whatImNoticing.push(`Your goal is to ${DONT_SEND_IT_OUTCOME_LABELS[desiredOutcome].toLowerCase()}, so the rewrite focuses on effectiveness instead of emotional release.`);
  }

  const possibleConsequences = [
    appearsReactive
      ? 'It may escalate the conversation or make repair harder later.'
      : 'It may still land more strongly than you intend if the other person is defensive.',
    hasBlame
      ? 'The other person may focus on defending themselves instead of understanding the hurt underneath.'
      : 'The other person may hear the feeling, but the message could be clearer with one calm need.',
    emotionalIntensity >= 7
      ? 'You may feel relief for a moment, then regret if the message does not match what you truly wanted.'
      : 'Waiting may help you decide whether this says what you actually want to communicate.',
  ];
  if (desiredOutcome === 'vent_only') {
    possibleConsequences.unshift('If the real goal is to vent, sending it may create a conversation you do not actually want right now.');
  }

  return {
    emotionalIntensity,
    likelyEmotionalState,
    appearsReactive,
    impulsivityRisk,
    impulsivityReason: buildImpulsivityReason(
      likelyEmotionalState,
      emotionalIntensity,
      reactiveHits,
      hasUrgency,
      hasBlame,
      desiredOutcome,
      riskSignals,
    ),
    riskSignals,
    whatImHearing: summarizeEmotionalMessage(trimmed, likelyEmotionalState),
    whatImNoticing,
    possibleConsequences,
    potentialImpact: possibleConsequences,
    patternCheck: buildPatternCheck(trimmed, context),
    calmerVersion: rewriteOptions[0]?.text ?? '',
    rewriteOptions,
    suggestedWaitingPeriod,
    waitingSuggestion: waitingCopy(suggestedWaitingPeriod, emotionalIntensity),
  };
}
