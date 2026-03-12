export type TimelineEventType =
  | 'check_in'
  | 'journal'
  | 'trigger'
  | 'coping'
  | 'message_draft';

export type TimelineMarker =
  | 'high_distress'
  | 'coping_success'
  | 'relationship_conflict'
  | 'low_distress'
  | 'none';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: number;
  title: string;
  description: string;
  intensity?: number;
  emotions: string[];
  triggers: string[];
  triggerCategories: string[];
  copingUsed: string[];
  marker: TimelineMarker;
  outcome?: string;
}

export interface TimelineFilters {
  emotionType: string | null;
  triggerType: string | null;
  dateRange: 'week' | 'month' | 'all';
  markerFilter: TimelineMarker | null;
}

export interface TimelineStats {
  totalEvents: number;
  avgIntensity: number;
  highDistressCount: number;
  copingSuccessCount: number;
  conflictCount: number;
  topEmotion: string | null;
  topTrigger: string | null;
}
