export type BreakthroughType =
  | 'distress_reduction'
  | 'pause_before_send'
  | 'loop_broken'
  | 'emotional_awareness'
  | 'coping_success'
  | 'relationship_regulation'
  | 'consistent_checkin'
  | 'journal_reflection';

export interface BreakthroughMoment {
  id: string;
  timestamp: number;
  type: BreakthroughType;
  title: string;
  description: string;
  supportiveNote: string;
  actionSuggestion?: string;
  actionRoute?: string;
  sourceData?: {
    distressBefore?: number;
    distressAfter?: number;
    toolUsed?: string;
    triggerLabel?: string;
    emotionLabel?: string;
  };
  saved: boolean;
  shared: boolean;
}

export interface BreakthroughSummary {
  totalBreakthroughs: number;
  thisWeekCount: number;
  topType: BreakthroughType | null;
  latestBreakthrough: BreakthroughMoment | null;
  streakDays: number;
}
