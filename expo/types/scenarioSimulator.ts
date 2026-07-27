export type ResponseStyle = 'urgent' | 'avoidant' | 'defensive' | 'secure';

export type RefineTool = 'remove_blame' | 'reduce_urgency' | 'add_clarity' | 'add_boundaries';

export interface ScenarioInput {
  messageReceived: string;
  situationDescription: string;
  conversationContext: string;
}

export interface ResponseSimulation {
  style: ResponseStyle;
  label: string;
  emoji: string;
  color: string;
  description: string;
  responseText: string;
  emotionalImpact: string;
  relationshipImpact: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RefineAction {
  id: RefineTool;
  label: string;
  emoji: string;
  description: string;
  active: boolean;
}

export interface PracticeRound {
  id: string;
  chosenStyle: ResponseStyle;
  refinedResponse: string;
  feedback: string;
  improvementTip: string;
  timestamp: number;
}

export interface SimulatorSession {
  id: string;
  input: ScenarioInput;
  simulations: ResponseSimulation[];
  practiceRounds: PracticeRound[];
  finalResponse: string | null;
  timestamp: number;
}

export type SimulatorStep =
  | 'input'
  | 'simulations'
  | 'refine'
  | 'practice'
  | 'complete';

export const RESPONSE_STYLE_META: Record<ResponseStyle, { label: string; emoji: string; color: string; description: string }> = {
  urgent: {
    get label() { return localizedText('Urgent', 'Urgente'); },
    emoji: '⚡',
    color: '#3B82F6',
    get description() { return localizedText('Driven by anxiety and need for immediate resolution', 'Impulsado por ansiedad y necesidad de resolver de inmediato'); },
  },
  avoidant: {
    get label() { return localizedText('Avoidant', 'Evitativo'); },
    emoji: '🧊',
    color: '#3B82F6',
    get description() { return localizedText('Shutting down or pulling away to self-protect', 'Cerrarse o alejarse para protegerse'); },
  },
  defensive: {
    get label() { return localizedText('Defensive', 'Defensivo'); },
    emoji: '🛡️',
    color: '#67E8F9',
    get description() { return localizedText('Protecting yourself through blame or justification', 'Protegerse mediante culpa o justificación'); },
  },
  secure: {
    get label() { return localizedText('Secure', 'Seguro'); },
    emoji: '🌿',
    color: '#14B8A6',
    get description() { return localizedText('Grounded, clear, and respectful of both sides', 'Centrado, claro y respetuoso con ambas partes'); },
  },
};

export const REFINE_TOOLS: RefineAction[] = [
  {
    id: 'remove_blame',
    get label() { return localizedText('Remove Blame', 'Quitar culpa'); },
    emoji: '🕊️',
    get description() { return localizedText('Replace accusatory language with observations', 'Reemplazar lenguaje acusatorio por observaciones'); },
    active: true,
  },
  {
    id: 'reduce_urgency',
    get label() { return localizedText('Reduce Urgency', 'Bajar urgencia'); },
    emoji: '🧘',
    get description() { return localizedText('Soften time pressure and demands', 'Suavizar presión de tiempo y exigencias'); },
    active: true,
  },
  {
    id: 'add_clarity',
    get label() { return localizedText('Add Emotional Clarity', 'Agregar claridad emocional'); },
    emoji: '💎',
    get description() { return localizedText('Express feelings clearly without blame', 'Expresar sentimientos con claridad y sin culpa'); },
    active: false,
  },
  {
    id: 'add_boundaries',
    get label() { return localizedText('Add Boundaries', 'Agregar límites'); },
    emoji: '🏔️',
    get description() { return localizedText('Include self-respecting limits', 'Incluir límites que respeten tu dignidad'); },
    active: false,
  },
];

export const SCENARIO_CONTEXTS = [
  { id: 'no_reply', get label() { return localizedText('They stopped replying', 'Dejó de responder'); }, emoji: '📱' },
  { id: 'tone_shift', get label() { return localizedText('Their tone changed', 'Cambió su tono'); }, emoji: '❄️' },
  { id: 'after_conflict', get label() { return localizedText('After an argument', 'Después de una discusión'); }, emoji: '⚡' },
  { id: 'feeling_rejected', get label() { return localizedText('Feeling rejected', 'Sentirme rechazado/a'); }, emoji: '💔' },
  { id: 'boundary_crossed', get label() { return localizedText('A boundary was crossed', 'Se cruzó un límite'); }, emoji: '🚧' },
  { id: 'misunderstanding', get label() { return localizedText('A misunderstanding', 'Un malentendido'); }, emoji: '😵‍💫' },
  { id: 'need_to_talk', get label() { return localizedText('Need to bring something up', 'Necesito hablar de algo'); }, emoji: '💬' },
  { id: 'other', get label() { return localizedText('Something else', 'Otra cosa'); }, emoji: '💭' },
];
import { localizedText } from '@/lib/i18n/staticText';
