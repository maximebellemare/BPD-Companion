export type ToolCategory =
  | 'dbt-distress'
  | 'dbt-emotion'
  | 'dbt-interpersonal'
  | 'dbt-mindfulness'
  | 'mentalization'
  | 'relationship-recovery'
  | 'body-regulation';

export interface QuickAccessTool {
  id: string;
  label: string;
  sublabel: string;
  iconName: string;
  color: string;
  bgColor: string;
  route: string;
  tags: string[];
}

export interface MentalizationTool {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  prompts: MentalizationPrompt[];
  whenToUse: string[];
  tags: string[];
}

export interface MentalizationPrompt {
  title: string;
  instruction: string;
  tip?: string;
}

export interface RelationshipRecoveryTool {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  steps: RecoveryStep[];
  whenToUse: string[];
  tags: string[];
}

export interface RecoveryStep {
  title: string;
  instruction: string;
  tip?: string;
}

export interface BodyRegulationTool {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  steps: RegulationStep[];
  whenToUse: string[];
  tags: string[];
}

export interface RegulationStep {
  title: string;
  instruction: string;
  tip?: string;
}

export interface ToolOutcome {
  id: string;
  toolId: string;
  toolType: ToolCategory | 'dbt' | 'coping';
  timestamp: number;
  distressBefore: number;
  distressAfter: number;
  helpful: boolean | null;
  urgeReduced: boolean | null;
  notes?: string;
}

export interface PlaybookEntry {
  toolId: string;
  toolType: ToolCategory | 'dbt' | 'coping';
  toolTitle: string;
  pinned: boolean;
  addedAt: number;
  useCount: number;
  avgHelpfulness: number;
  bestForSituations: string[];
}

export interface ToolMatchResult {
  toolId: string;
  toolType: string;
  toolTitle: string;
  reason: string;
  confidence: number;
  route: string;
}
