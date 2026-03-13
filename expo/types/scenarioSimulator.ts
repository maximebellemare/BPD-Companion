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
    label: 'Urgent',
    emoji: '⚡',
    color: '#E17055',
    description: 'Driven by anxiety and need for immediate resolution',
  },
  avoidant: {
    label: 'Avoidant',
    emoji: '🧊',
    color: '#7FB3D3',
    description: 'Shutting down or pulling away to self-protect',
  },
  defensive: {
    label: 'Defensive',
    emoji: '🛡️',
    color: '#E8A87C',
    description: 'Protecting yourself through blame or justification',
  },
  secure: {
    label: 'Secure',
    emoji: '🌿',
    color: '#6B9080',
    description: 'Grounded, clear, and respectful of both sides',
  },
};

export const REFINE_TOOLS: RefineAction[] = [
  {
    id: 'remove_blame',
    label: 'Remove Blame',
    emoji: '🕊️',
    description: 'Replace accusatory language with observations',
    active: true,
  },
  {
    id: 'reduce_urgency',
    label: 'Reduce Urgency',
    emoji: '🧘',
    description: 'Soften time pressure and demands',
    active: true,
  },
  {
    id: 'add_clarity',
    label: 'Add Emotional Clarity',
    emoji: '💎',
    description: 'Express feelings clearly without blame',
    active: false,
  },
  {
    id: 'add_boundaries',
    label: 'Add Boundaries',
    emoji: '🏔️',
    description: 'Include self-respecting limits',
    active: false,
  },
];

export const SCENARIO_CONTEXTS = [
  { id: 'no_reply', label: 'They stopped replying', emoji: '📱' },
  { id: 'tone_shift', label: 'Their tone changed', emoji: '❄️' },
  { id: 'after_conflict', label: 'After an argument', emoji: '⚡' },
  { id: 'feeling_rejected', label: 'Feeling rejected', emoji: '💔' },
  { id: 'boundary_crossed', label: 'A boundary was crossed', emoji: '🚧' },
  { id: 'misunderstanding', label: 'A misunderstanding', emoji: '😵‍💫' },
  { id: 'need_to_talk', label: 'Need to bring something up', emoji: '💬' },
  { id: 'other', label: 'Something else', emoji: '💭' },
];
