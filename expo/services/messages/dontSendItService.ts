import { i18n } from '@/lib/i18n';
import { normalizeLanguageTag } from '@/lib/i18n/languageStorage';

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
  'siempre',
  'nunca',
  'no te importa',
  'déjame',
  'dejame',
  'te odio',
  'bloqueado',
  'me ignoras',
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
  'idiota',
  'estúpido',
  'estupido',
  'patético',
  'patetico',
  'no vales',
  'te odio',
  'cállate',
  'callate',
];

const THREAT_PATTERNS = [
  /\bi('| wi)ll (hurt|ruin|destroy|expose|humiliate)\b/i,
  /\byou'?ll regret\b/i,
  /\bwatch what happens\b/i,
  /\bi'?m going to (show up|come over|make you|tell everyone)\b/i,
  /\bi hope you (suffer|hurt|pay)\b/i,
  /\bte vas a arrepentir\b/i,
  /\bvas a ver\b/i,
  /\bvoy a (arruinar|humillar|exponer)\b/i,
];

const EMOTION_RULES: { label: string; esLabel: string; terms: string[] }[] = [
  { label: 'anger or hurt', esLabel: 'enojo o dolor', terms: ['angry', 'mad', 'furious', 'hate', 'disrespect', 'unfair', 'hurt', 'enojado', 'enojada', 'furioso', 'furiosa', 'odio', 'dolió', 'dolio', 'injusto'] },
  { label: 'abandonment fear', esLabel: 'miedo al abandono', terms: ['leave', 'leaving', 'abandon', 'ignored', 'no reply', 'reply', 'text back', 'forgot', 'abandone', 'abandonar', 'ignora', 'ignorado', 'ignorada', 'responde', 'mensaje', 'se fue'] },
  { label: 'shame or self-blame', esLabel: 'vergüenza o culpa hacia ti', terms: ['my fault', 'i ruin', 'i messed up', 'sorry for existing', 'too much', 'mi culpa', 'arruino', 'la regué', 'la regue', 'perdón por existir', 'perdon por existir', 'demasiado'] },
  { label: 'anxiety or urgency', esLabel: 'ansiedad o urgencia', terms: ['right now', 'answer me', 'need to know', 'can not wait', "can't wait", 'please respond', 'ahora mismo', 'respóndeme', 'respondeme', 'necesito saber', 'no puedo esperar'] },
  { label: 'sadness or rejection', esLabel: 'tristeza o rechazo', terms: ['rejected', 'unwanted', 'not important', 'alone', 'lonely', 'rechazado', 'rechazada', 'no importo', 'solo', 'sola', 'soledad'] },
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

function isSpanishOutput(): boolean {
  return normalizeLanguageTag(i18n.language) === 'es';
}

function detectEmotion(message: string, spanish: boolean): string {
  const lower = message.toLowerCase();
  const matches = EMOTION_RULES
    .map(rule => ({ label: rule.label, count: rule.terms.filter(term => lower.includes(term)).length }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);
  const match = matches[0];
  if (!match) return spanish ? 'emoción intensa' : 'heightened emotion';
  const rule = EMOTION_RULES.find(item => item.label === match.label);
  return spanish ? rule?.esLabel ?? match.label : match.label;
}

function emotionDrivers(likelyEmotion: string, hasUrgency: boolean, hasBlame: boolean, spanish = false): string[] {
  const lower = likelyEmotion.toLowerCase();
  const drivers: string[] = [];
  if (lower.includes('anger') || lower.includes('hurt')) drivers.push('anger');
  if (lower.includes('rejection')) drivers.push('rejection');
  if (lower.includes('abandonment')) drivers.push('abandonment fear');
  if (lower.includes('shame')) drivers.push('shame');
  if (lower.includes('anxiety')) drivers.push('anxiety');
  if (lower.includes('enojo') || lower.includes('dolor')) drivers.push('enojo');
  if (lower.includes('rechazo')) drivers.push('rechazo');
  if (lower.includes('abandono')) drivers.push('miedo al abandono');
  if (lower.includes('vergüenza')) drivers.push('vergüenza');
  if (lower.includes('ansiedad')) drivers.push('ansiedad');
  if (hasUrgency) drivers.push(spanish ? 'urgencia' : 'urgency');
  if (hasBlame) drivers.push(spanish ? 'culpa' : 'blame');
  return [...new Set(drivers)].slice(0, 3);
}

function summarizeEmotionalMessage(message: string, likelyEmotion: string, spanish: boolean): string {
  const lower = message.toLowerCase();
  if (lower.includes('reply') || lower.includes('text back') || lower.includes('ignored') || lower.includes('respond') || lower.includes('ignora')) {
    if (spanish) return `Esto suena como un mensaje que busca seguridad, contacto o prueba de que todavía importas. Debajo de eso, escucho ${likelyEmotion}.`;
    return `This sounds like a message asking for reassurance, contact, or proof that you still matter. Underneath it, I hear ${likelyEmotion}.`;
  }
  if (lower.includes('sorry') || lower.includes('my fault') || lower.includes('too much') || lower.includes('perdón') || lower.includes('perdon') || lower.includes('mi culpa')) {
    if (spanish) return `Esto suena como un mensaje que intenta reparar rápido o bajar el miedo de ser demasiado. Debajo de eso, escucho ${likelyEmotion}.`;
    return `This sounds like a message trying to repair quickly or reduce the fear of being too much. Underneath it, I hear ${likelyEmotion}.`;
  }
  if (lower.includes('disrespect') || lower.includes('unfair') || lower.includes('angry') || lower.includes('hate') || lower.includes('injust') || lower.includes('enojo') || lower.includes('odio')) {
    if (spanish) return `Esto suena como un mensaje que intenta proteger tu dignidad después de sentirte herido/a o no tomado/a en cuenta. Debajo de eso, escucho ${likelyEmotion}.`;
    return `This sounds like a message trying to protect your dignity after feeling hurt or dismissed. Underneath it, I hear ${likelyEmotion}.`;
  }
  if (spanish) return `Esto se siente emocionalmente cargado e importante. Debajo de las palabras, escucho ${likelyEmotion} y una necesidad de ser entendido/a.`;
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
  spanish = false,
): string {
  const drivers = emotionDrivers(likelyEmotion, hasUrgency, hasBlame, spanish);
  const driverText = drivers.length > 0 ? drivers.join(spanish ? ' y ' : ' and ') : (spanish ? 'emoción intensa' : 'heightened emotion');
  const signals: string[] = [...riskSignals];
  if (reactiveHits > 0 && signals.length === 0) signals.push('reactive wording');
  if (hasUrgency && !signals.includes('urgency or pressure')) signals.push('urgency');
  if (hasBlame && !signals.includes('repeated accusations')) signals.push('blame language');
  if (emotionalIntensity >= 8) signals.push('very high emotional intensity');
  else if (emotionalIntensity >= 7) signals.push('high emotional intensity');
  if (desiredOutcome === 'vent_only') signals.push('a venting goal rather than a relationship goal');

  if (spanish) {
    return signals.length > 0
      ? `Este mensaje parece venir de ${driverText}. Lo marqué así porque noté ${signals.slice(0, 5).join(', ')}. Los mensajes escritos en este estado suelen traer arrepentimiento después.`
      : `Este mensaje parece relativamente estable, con algo de ${driverText}. Una pausa breve puede ayudar a que coincida con tu objetivo real.`;
  }

  return signals.length > 0
    ? `This message appears driven by ${driverText}. I rated it this way because I noticed ${signals.slice(0, 5).join(', ')}. Messages written in this state are often regretted later.`
    : `This message appears relatively steady, with some ${driverText}. A short pause may still help it match your actual goal.`;
}

function spanishRewriteOptions(
  recipient: DontSendItRecipient,
  desiredOutcome: DontSendItDesiredOutcome,
  emotionalIntensity: number,
): DontSendItRewriteOption[] {
  const isWork = recipient === 'coworker';
  const relationshipPhrase = isWork ? 'dinámica laboral' : recipient === 'other' ? 'dinámica' : 'relación';
  const pauseLead = emotionalIntensity >= 7 ? 'Estoy demasiado activado/a para decir esto bien ahora. ' : '';
  const defaults: Record<DontSendItDesiredOutcome, DontSendItRewriteOption[]> = {
    vent_only: [
      { id: 'calm', label: 'Opción A — Calmada', description: 'Mantiene el mensaje privado por ahora.', text: 'Estoy muy activado/a y necesito sacar esto sin enviarlo todavía. Voy a pausar antes de convertirlo en un mensaje.' },
      { id: 'direct', label: 'Opción B — Directa', description: 'Nombra la pausa con claridad.', text: 'Estoy molesto/a y no estoy listo/a para responder de forma productiva. Me voy a tomar tiempo antes de enviar algo.' },
      { id: 'boundary', label: 'Opción C — Con límite', description: 'Protege espacio sin escalar.', text: 'Necesito espacio ahora mismo. Voy a volver a esto cuando pueda hablar desde un lugar más estable.' },
      { id: 'repair', label: 'Opción D — Cuidando la relación', description: 'Evita daño sin dejar de ser honesto/a.', text: 'Estoy molesto/a y no quiero decir algo dañino. Voy a pausar y hablar más tarde.' },
      { id: 'short', label: 'Opción E — Versión breve', description: 'Mínima y clara.', text: 'Estoy molesto/a. Necesito pausar antes de responder.' },
    ],
    express_hurt: [
      { id: 'calm', label: 'Opción A — Calmada', description: 'Suaviza el inicio.', text: isWork ? 'Quería decir que esto me afectó más de lo que esperaba. Me gustaría hablarlo con calma cuando haya espacio.' : 'Me dolió lo que pasó y quiero decirlo con claridad en vez de reaccionar. ¿Podemos hablar cuando ambos tengamos un poco de espacio?' },
      { id: 'direct', label: 'Opción B — Directa', description: 'Clara sin atacar.', text: 'Me dolió lo que pasó. Quiero hablarlo directamente, pero no quiero que se convierta en una pelea.' },
      { id: 'boundary', label: 'Opción C — Con límite', description: 'Nombra la necesidad.', text: 'Estoy dispuesto/a a hablarlo, pero necesito que la conversación se mantenga respetuosa y calmada.' },
      { id: 'repair', label: 'Opción D — Reparadora', description: 'Mantiene abierta la conexión.', text: 'Me importa que manejemos esto bien. Estoy herido/a y me gustaría que entendamos qué pasó sin escalar.' },
      { id: 'short', label: 'Opción E — Breve', description: 'Breve y estable.', text: 'Eso me dolió. ¿Podemos hablarlo con calma más tarde?' },
    ],
    set_boundary: [
      { id: 'calm', label: 'Opción A — Calmada', description: 'Firme y con base.', text: isWork ? 'Quiero ser claro/a sobre lo que necesito de ahora en adelante. Estoy abierto/a a hablarlo, pero necesito que la conversación sea respetuosa y enfocada.' : 'Me importa manejar esto bien y también necesito poner un límite. Estoy dispuesto/a a hablar, pero necesito que lo mantengamos respetuoso.' },
      { id: 'direct', label: 'Opción B — Directa', description: 'Límite claro.', text: 'No estoy bien continuando esta conversación si se vuelve hiriente. Voy a volver cuando podamos hablar con respeto.' },
      { id: 'boundary', label: 'Opción C — Límite fuerte', description: 'Protege espacio con claridad.', text: 'Necesito detener esto por ahora. Me voy a tomar espacio y podemos retomarlo cuando la conversación pueda mantenerse respetuosa.' },
      { id: 'repair', label: 'Opción D — Límite con cuidado', description: 'Límite más conexión.', text: 'Quiero reparar esto, pero no puedo hacerlo mientras ambos estamos activados. Me voy a tomar espacio para no empeorarlo.' },
      { id: 'short', label: 'Opción E — Breve', description: 'Corta y clara.', text: 'Necesito que esta conversación sea respetuosa, o voy a pausarla.' },
    ],
    start_conversation: [
      { id: 'calm', label: 'Opción A — Calmada', description: 'Invita una conversación estable.', text: isWork ? 'Algo de esta situación se me quedó dando vueltas. ¿Hay un buen momento para hablarlo y aclararlo?' : 'Hay algo que me quedó dando vueltas y prefiero hablarlo con calma en vez de asumir. ¿Hay un buen momento para hablar?' },
      { id: 'direct', label: 'Opción B — Directa', description: 'Simple y clara.', text: 'Me gustaría hablar de lo que pasó. No quiero pelear; quiero entenderlo mejor.' },
      { id: 'boundary', label: 'Opción C — Con límite', description: 'Marca el tono antes de hablar.', text: 'Estoy abierto/a a hablarlo, pero quiero que lo hagamos con calma y respeto.' },
      { id: 'repair', label: 'Opción D — Reparadora', description: 'Primero la conexión.', text: 'No quiero que esto se convierta en resentimiento. ¿Podemos hablarlo cuando ambos tengamos espacio?' },
      { id: 'short', label: 'Opción E — Breve', description: 'Apertura rápida.', text: '¿Podemos hablar de lo que pasó más tarde?' },
    ],
    get_response: [
      { id: 'calm', label: 'Opción A — Calmada', description: 'Pide sin presionar.', text: isWork ? 'Cuando tengas oportunidad, ¿podrías decirme en qué está esto? Me ayudaría tener una actualización breve para organizarme.' : 'Me siento inquieto/a al no recibir respuesta y estoy intentando no reaccionar desde eso. Cuando puedas, ¿me dices dónde estamos?' },
      { id: 'direct', label: 'Opción B — Directa', description: 'Petición clara.', text: '¿Podrías responderme cuando tengas oportunidad? Prefiero no asumir qué significa el silencio.' },
      { id: 'boundary', label: 'Opción C — Con límite', description: 'Protege tu sistema nervioso.', text: 'Voy a dejar de revisar el teléfono por un rato. Respóndeme cuando puedas.' },
      { id: 'repair', label: 'Opción D — Reparadora', description: 'Nombra cuidado e incertidumbre.', text: 'Me importa esta conversación y el silencio me está activando mucho. ¿Puedes responder cuando tengas espacio?' },
      { id: 'short', label: 'Opción E — Breve', description: 'Empujón pequeño.', text: '¿Me puedes avisar cuando tengas oportunidad?' },
    ],
    end_relationship: [
      { id: 'calm', label: 'Opción A — Calmada', description: 'Mejor después de pausar.', text: `${pauseLead}He pensado en esto y no creo que continuar esta ${relationshipPhrase} sea lo correcto para mí. Quiero terminarlo con respeto.` },
      { id: 'direct', label: 'Opción B — Directa', description: 'Final claro.', text: 'No quiero continuar esta relación. Lo digo con claridad y respeto.' },
      { id: 'boundary', label: 'Opción C — Con límite', description: 'Termina con un límite.', text: 'Estoy terminando esta relación y necesito espacio después de este mensaje. No voy a discutirlo mientras las emociones estén altas.' },
      { id: 'repair', label: 'Opción D — Menos final', description: 'Si no estás seguro/a.', text: 'Estoy muy molesto/a y necesito espacio. No quiero tomar una decisión final mientras estoy tan activado/a.' },
      { id: 'short', label: 'Opción E — Breve', description: 'Breve y firme.', text: 'No creo que continuar esto sea lo correcto para mí. Necesito terminarlo con respeto.' },
    ],
  };
  return defaults[desiredOutcome];
}

function baseRewriteOptions(
  recipient: DontSendItRecipient,
  desiredOutcome: DontSendItDesiredOutcome,
  emotionalIntensity: number,
  spanish = false,
): DontSendItRewriteOption[] {
  if (spanish) return spanishRewriteOptions(recipient, desiredOutcome, emotionalIntensity);
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

function contentAwareRewriteOptions(
  message: string,
  recipient: DontSendItRecipient,
  desiredOutcome: DontSendItDesiredOutcome,
  emotionalIntensity: number,
  riskSignals: string[],
  spanish = false,
): DontSendItRewriteOption[] {
  const isWork = recipient === 'coworker';
  const isAngry = riskSignals.includes('hostility') || riskSignals.includes('personal attack') || /\b(fuck|hate|angry|mad|furious|shut up|odio|enojad[oa]|furios[oa]|c[aá]llate)\b/i.test(message);
  const isAccusatory = riskSignals.includes('repeated accusations') || /\b(you (always|never|don'?t care|ignored|lied|made me)|t[úu] (siempre|nunca)|no te importa|me ignoras|mentiste|me hiciste)\b/i.test(message);
  const isAnxious = /\b(reply|text back|answer me|ignored|no reply|where are you|please respond|need to know|resp[oó]ndeme|cont[eé]stame|me ignoras|sin respuesta|d[oó]nde est[aá]s|necesito saber)\b/i.test(message);
  const isNeedyOrReassuranceSeeking = /\b(do you still|are we okay|please don'?t leave|tell me you|need you|if you cared|todav[ií]a me|estamos bien|no me dejes|dime que|te necesito|si te importara)\b/i.test(message);
  const isEnding = desiredOutcome === 'end_relationship';

  if (!isAngry && !isAccusatory && !isAnxious && !isNeedyOrReassuranceSeeking && !isEnding) {
    return baseRewriteOptions(recipient, desiredOutcome, emotionalIntensity, spanish);
  }

  if (spanish) {
    const relationNoun = isWork ? 'esto' : 'nosotros';
    const calmDirect = isAngry
      ? 'Estoy muy molesto/a y no quiero convertir eso en un ataque. Necesito un poco de tiempo antes de hablar de esto con claridad.'
      : isAnxious
        ? 'Me siento inquieto/a al no recibir respuesta. Cuando puedas, dime dónde estamos.'
        : 'Quiero hablar de esto con claridad, sin culpar ni escalar.';
    const warmRepair = isAngry
      ? `Me importa cómo esto afecta a ${relationNoun}, así que voy a pausar en vez de enviar esto mientras estoy enojado/a. Me gustaría hablar cuando esté más estable.`
      : isNeedyOrReassuranceSeeking
        ? 'Me siento inseguro/a y estoy intentando no ponerte presión. Cuando tengas espacio, agradecería un poco de seguridad.'
        : 'Me importa manejar esto bien. ¿Podemos hablar de lo que pasó cuando ambos tengamos espacio?';
    const boundary = isEnding
      ? 'No quiero tomar una decisión final mientras estoy tan activado/a. Me voy a tomar espacio y volveré a esto cuando tenga claridad.'
      : isAccusatory
        ? 'No estoy bien con lo que pasó, pero quiero hablarlo sin acusaciones. Necesito que la conversación se mantenga respetuosa.'
        : 'Necesito pausar esta conversación por ahora. Volveré cuando pueda responder con más calma.';
    const short = isAnxious
      ? '¿Me puedes avisar cuando tengas oportunidad? Estoy intentando no asumir.'
      : isAngry
        ? 'Estoy demasiado molesto/a para responder bien. Voy a pausar y volver más tarde.'
        : 'Quiero hablar de esto con calma cuando haya espacio.';

    return [
      { id: 'calm', label: 'Opción A — Calmada / directa', description: 'Nombra el problema sin atacar.', text: calmDirect },
      { id: 'repair', label: 'Opción B — Cálida / cuidadosa', description: 'Protege la conexión sin dejar de ser honesto/a.', text: warmRepair },
      { id: 'boundary', label: 'Opción C — Enfocada en límites', description: 'Crea espacio sin escalar.', text: boundary },
      { id: 'short', label: 'Opción D — Texto breve', description: 'Lo bastante breve para enviar como mensaje.', text: short },
      { id: 'direct', label: 'Opción E — Petición clara', description: 'Convierte la emoción en una petición concreta.', text: isWork ? '¿Podemos aclarar qué pasó y qué tiene que pasar después?' : '¿Podemos hablar de lo que pasó sin convertirlo en una pelea?' },
    ];
  }

  const relationNoun = isWork ? 'this' : 'us';
  const calmDirect = isAngry
    ? 'I’m really upset, and I don’t want to turn that into an attack. I need some time before we talk about this clearly.'
    : isAnxious
      ? 'I’m feeling unsettled not hearing back. When you can, please let me know where things stand.'
      : 'I want to talk about this clearly without blaming or escalating.';
  const warmRepair = isAngry
    ? `I care about how this affects ${relationNoun}, so I’m going to pause instead of sending this while I’m angry. I’d like to talk when I can be more steady.`
    : isNeedyOrReassuranceSeeking
      ? 'I’m feeling insecure and I’m trying not to put pressure on you. When you have space, I’d appreciate a little reassurance.'
      : 'I care about handling this well. Can we talk about what happened when we both have space?';
  const boundary = isEnding
    ? 'I don’t want to make a final decision while I’m this activated. I’m taking space and will come back to this when I’m clear.'
    : isAccusatory
      ? 'I’m not okay with what happened, but I want to discuss it without accusations. I need the conversation to stay respectful.'
      : 'I need to pause this conversation for now. I’ll come back when I can respond more calmly.';
  const short = isAnxious
    ? 'Can you let me know when you have a chance? I’m trying not to assume.'
    : isAngry
      ? 'I’m too upset to respond well. I’m going to pause and come back later.'
      : 'I want to talk about this calmly when there’s space.';

  return [
    { id: 'calm', label: 'Option A — Calm / Direct', description: 'Names the issue without attacking.', text: calmDirect },
    { id: 'repair', label: 'Option B — Warm / Relationship-Preserving', description: 'Protects connection while staying honest.', text: warmRepair },
    { id: 'boundary', label: 'Option C — Boundary-Focused', description: 'Creates space without escalating.', text: boundary },
    { id: 'short', label: 'Option D — Short Text Version', description: 'Brief enough to send as a text.', text: short },
    { id: 'direct', label: 'Option E — Clear Ask', description: 'Turns emotion into one clear request.', text: isWork ? 'Can we clarify what happened and what needs to happen next?' : 'Can we talk about what happened without turning it into a fight?' },
  ];
}

function applyRewriteInstruction(
  option: DontSendItRewriteOption,
  instruction?: DontSendItRewriteInstruction | null,
  spanish = false,
): DontSendItRewriteOption {
  if (!instruction) return option;
  const transformations: Record<DontSendItRewriteInstruction, string> = {
    more_direct: spanish ? 'Quiero ser directo/a: ' : 'I want to be direct: ',
    less_direct: spanish ? 'Estoy intentando decir esto con cuidado: ' : 'I’m trying to say this carefully: ',
    more_compassionate: spanish ? 'Me importa cómo llega esto, y ' : 'I care about how this lands, and ',
    more_assertive: spanish ? 'Necesito ser claro/a: ' : 'I need to be clear: ',
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
      text: spanish
        ? `${option.text} Estoy intentando responder de una forma honesta, respetuosa y con menos probabilidad de traer arrepentimiento después.`
        : `${option.text} I’m trying to respond in a way that is honest, respectful, and less likely to create regret later.`,
    };
  }
  return { ...option, text: `${transformations[instruction]}${option.text}` };
}

function buildPatternCheck(message: string, context?: DontSendItContext, spanish = false): string[] {
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
    checks.push(spanish ? 'Esto se parece a momentos donde el miedo al abandono o la incertidumbre pueden estar impulsando la necesidad de buscar seguridad.' : 'This resembles moments where abandonment fear or uncertainty may be driving the urge to reach for reassurance.');
  }
  if (rejectionSignal || joinedPatterns.includes('rejection') || joinedPatterns.includes('rejected')) {
    checks.push(spanish ? 'Esto puede conectarse con sensibilidad al rechazo: el mensaje intenta bajar el dolor de sentirse no querido/a o no tomado/a en cuenta.' : 'This may connect to rejection sensitivity: the message is trying to reduce the sting of feeling unwanted or dismissed.');
  }
  if (relationshipSignal || lower.includes('you')) {
    checks.push(spanish ? 'Esto parece vinculado a una relación, así que el tono puede importar tanto como el contenido.' : 'This appears relationship-linked, so tone may matter as much as the content.');
  }
  if (regretSignal || /\b(always|never|done|blocked|hate)\b/i.test(message)) {
    checks.push(spanish ? 'Esto se parece a situaciones donde después sentiste arrepentimiento o quisiste decirlo de otra manera.' : 'This resembles situations where you later felt regret or wanted a chance to say it differently.');
  }
  if ((context?.recentTriggers ?? []).length > 0 || (context?.recentEmotions ?? []).length > 0) {
    checks.push(spanish
      ? `Según registros recientes, ${[...(context?.recentTriggers ?? []), ...(context?.recentEmotions ?? [])].slice(0, 2).join(' y ')} puede ser parte del patrón emocional actual.`
      : `Based on recent entries, ${[...(context?.recentTriggers ?? []), ...(context?.recentEmotions ?? [])].slice(0, 2).join(' and ')} may be part of the current emotional pattern.`);
  }

  return checks.length > 0
    ? checks.slice(0, 4)
    : [spanish ? 'Todavía no hay suficientes datos de patrones guardados, así que esta revisión se basa principalmente en las palabras de este borrador.' : 'There is not enough saved pattern data yet, so this check is based mainly on the words in this draft.'];
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

function waitingCopy(period: DontSendItAnalysis['suggestedWaitingPeriod'], intensity: number, spanish = false): string {
  if (spanish) {
    if (period === '1 hour') return 'Espera 1 hora si puedes. Haz algo físico o de anclaje, luego vuelve a leer la versión más calmada antes de decidir.';
    if (period === '20 min') return 'Espera 20 minutos. Deja pasar la primera ola emocional y luego revisa si esto todavía dice lo que quieres decir.';
    if (period === 'Tomorrow') return 'Consúltalo mañana. Esto es para mensajes que podrían cambiar la relación.';
    return intensity >= 4
      ? 'Espera 5 minutos y léelo una vez más. Una pausa pequeña todavía puede cambiar el tono.'
      : 'Espera 5 minutos y envíalo solo si todavía se siente claro y respetuoso.';
  }
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
  const spanish = isSpanishOutput();
  const trimmed = normalize(message);
  const riskSignals = extractRiskSignals(trimmed);
  const emotionalIntensity = boostIntensityForSignals(estimateIntensity(trimmed), riskSignals);
  const likelyEmotionalState = detectEmotion(trimmed, spanish);
  const reactiveHits = countMatches(trimmed, REACTIVE_TERMS);
  const appearsReactive = emotionalIntensity >= 6 || reactiveHits > 0 || riskSignals.length > 0 || /!{2,}|[A-Z]{5,}/.test(trimmed);
  const hasBlame = /\b(you|t[úu]|te)\b/i.test(trimmed) && /\b(always|never|made me|your fault|you don't|you do not|siempre|nunca|me hiciste|tu culpa|no te importa)\b/i.test(trimmed);
  const hasUrgency = /\b(now|right now|immediately|answer me|text me back|reply|ahora|ahora mismo|inmediatamente|resp[oó]ndeme|cont[eé]stame|responde)\b/i.test(trimmed);
  const recipient = context?.recipient ?? 'other';
  const desiredOutcome = context?.desiredOutcome;
  const impulsivityRisk = getImpulsivityRisk(emotionalIntensity, reactiveHits, hasUrgency, riskSignals);
  const suggestedWaitingPeriod = chooseWaitingPeriod(emotionalIntensity, impulsivityRisk, desiredOutcome);
  const rewriteOptions = contentAwareRewriteOptions(
    trimmed,
    recipient,
    desiredOutcome ?? 'start_conversation',
    emotionalIntensity,
    riskSignals,
    spanish,
  )
    .map(option => applyRewriteInstruction(option, context?.rewriteInstruction, spanish));

  const whatImNoticing = [
    appearsReactive
      ? (spanish ? 'El mensaje parece reactivo, lo que significa que puede venir de la urgencia y no de tu parte más clara.' : 'The message appears reactive, which means it may be coming from urgency rather than your clearest self.')
      : (spanish ? 'El mensaje no se ve muy reactivo, pero una pausa breve todavía puede ayudar a que llegue mejor.' : 'The message does not look highly reactive, but a short pause may still help it land better.'),
  ];

  if (hasBlame) {
    whatImNoticing.push(spanish ? 'Hay algo de lenguaje de culpa que podría hacer que la otra persona se defienda en vez de escucharte.' : 'There is some blame language that could make the other person defend themselves instead of hearing you.');
  }
  if (hasUrgency) {
    whatImNoticing.push(spanish ? 'Hay urgencia en el mensaje, y eso puede hacer que la conversación se sienta presionada.' : 'There is urgency in the message, which can make the conversation feel pressured.');
  }
  if (desiredOutcome) {
    const outcomeLabel = spanish ? i18n.t(`tools:dontSend.outcomes.${desiredOutcome}`).toLowerCase() : DONT_SEND_IT_OUTCOME_LABELS[desiredOutcome].toLowerCase();
    whatImNoticing.push(spanish
      ? `Tu objetivo es ${outcomeLabel}, así que la reescritura se enfoca en efectividad en vez de descarga emocional.`
      : `Your goal is to ${outcomeLabel}, so the rewrite focuses on effectiveness instead of emotional release.`);
  }

  const possibleConsequences = [
    appearsReactive
      ? (spanish ? 'Puede escalar la conversación o hacer más difícil reparar después.' : 'It may escalate the conversation or make repair harder later.')
      : (spanish ? 'Aún podría llegar más fuerte de lo que intentas si la otra persona está a la defensiva.' : 'It may still land more strongly than you intend if the other person is defensive.'),
    hasBlame
      ? (spanish ? 'La otra persona puede enfocarse en defenderse en vez de entender el dolor debajo.' : 'The other person may focus on defending themselves instead of understanding the hurt underneath.')
      : (spanish ? 'La otra persona puede escuchar el sentimiento, pero el mensaje podría ser más claro con una necesidad tranquila.' : 'The other person may hear the feeling, but the message could be clearer with one calm need.'),
    emotionalIntensity >= 7
      ? (spanish ? 'Podrías sentir alivio por un momento y luego arrepentirte si el mensaje no coincide con lo que realmente querías.' : 'You may feel relief for a moment, then regret if the message does not match what you truly wanted.')
      : (spanish ? 'Esperar puede ayudarte a decidir si esto dice lo que de verdad quieres comunicar.' : 'Waiting may help you decide whether this says what you actually want to communicate.'),
  ];
  if (desiredOutcome === 'vent_only') {
    possibleConsequences.unshift(spanish ? 'Si el objetivo real es desahogarte, enviarlo puede crear una conversación que en realidad no quieres ahora.' : 'If the real goal is to vent, sending it may create a conversation you do not actually want right now.');
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
      spanish,
    ),
    riskSignals,
    whatImHearing: summarizeEmotionalMessage(trimmed, likelyEmotionalState, spanish),
    whatImNoticing,
    possibleConsequences,
    potentialImpact: possibleConsequences,
    patternCheck: buildPatternCheck(trimmed, context, spanish),
    calmerVersion: rewriteOptions[0]?.text ?? '',
    rewriteOptions,
    suggestedWaitingPeriod,
    waitingSuggestion: waitingCopy(suggestedWaitingPeriod, emotionalIntensity, spanish),
  };
}
