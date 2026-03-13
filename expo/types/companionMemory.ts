export type CompanionMemoryType =
  | 'short_term'
  | 'episodic'
  | 'semantic';

export type EmotionalState =
  | 'high_distress'
  | 'relationship_trigger'
  | 'abandonment_fear'
  | 'emotional_overwhelm'
  | 'communication_anxiety'
  | 'identity_confusion'
  | 'recent_conflict'
  | 'post_conflict_reflection'
  | 'calm'
  | 'neutral';

export interface CompanionMemory {
  id: string;
  type: CompanionMemoryType;
  timestamp: number;
  trigger?: string;
  emotion?: string;
  context: string;
  outcome?: string;
  lesson?: string;
  intensity?: number;
  tags: string[];
  conversationId?: string;
  expiresAt?: number;
}

export interface EpisodicMemory extends CompanionMemory {
  type: 'episodic';
  trigger: string;
  emotion: string;
  urge?: string;
  action?: string;
  copingUsed?: string[];
  relationshipContext?: string;
}

export interface SemanticMemory extends CompanionMemory {
  type: 'semantic';
  trait: string;
  confidence: number;
  observationCount: number;
  lastReinforced: number;
}

export interface SessionSummary {
  id: string;
  conversationId: string;
  timestamp: number;
  trigger?: string;
  emotion?: string;
  urge?: string;
  action?: string;
  outcome?: string;
  insight?: string;
  skillsPracticed: string[];
  emotionalState: EmotionalState;
  distressLevel?: number;
}

export interface CompanionMemoryStore {
  shortTermMemories: CompanionMemory[];
  episodicMemories: EpisodicMemory[];
  semanticMemories: SemanticMemory[];
  sessionSummaries: SessionSummary[];
  lastUpdated: number;
  version: number;
}

export interface UserPsychProfile {
  commonTriggers: ProfileTrait[];
  relationshipStyle: string;
  communicationPatterns: string[];
  copingSuccessPatterns: ProfileTrait[];
  emotionalBaseline: number;
  peakDistressTimes: string[];
  growthAreas: string[];
  strengths: string[];
  lastUpdated: number;
}

export interface ProfileTrait {
  label: string;
  frequency: number;
  effectiveness?: number;
  lastSeen: number;
}

export interface WeeklyCompanionInsight {
  id: string;
  weekStart: number;
  weekEnd: number;
  emotionalPatterns: string[];
  relationshipPatterns: string[];
  helpfulStrategies: string[];
  growthSignals: string[];
  summary: string;
  generatedAt: number;
}

export interface SkillExercise {
  id: string;
  name: string;
  category: 'grounding' | 'breathing' | 'pause' | 'reframing' | 'urge_surfing' | 'self_compassion' | 'distress_tolerance' | 'emotional_wave';
  steps: SkillExerciseStep[];
  estimatedMinutes: number;
  forEmotionalStates: EmotionalState[];
}

export interface SkillExerciseStep {
  instruction: string;
  duration?: number;
  reflectionPrompt?: string;
}

export interface SkillExerciseResult {
  exerciseId: string;
  startedAt: number;
  completedAt: number;
  distressBefore?: number;
  distressAfter?: number;
  helpful: boolean;
  notes?: string;
}

export interface MemoryRetrievalContext {
  currentTrigger?: string;
  currentEmotion?: string;
  currentState?: EmotionalState;
  conversationTags?: string[];
  recentMessageContent?: string;
}

export interface RetrievedMemoryContext {
  relevantEpisodes: EpisodicMemory[];
  relevantTraits: SemanticMemory[];
  recentSessions: SessionSummary[];
  suggestedCoping: string[];
  patternWarning?: string;
  contextNarrative: string;
}
