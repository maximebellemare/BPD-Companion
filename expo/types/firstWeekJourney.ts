export type FirstWeekJourneyStepId =
  | 'day1_checkin'
  | 'day1_ai'
  | 'day2_4_habit'
  | 'day5_patterns'
  | 'day7_report';

export interface FirstWeekJourneyStep {
  id: FirstWeekJourneyStepId;
  dayLabel: string;
  title: string;
  description: string;
  status: 'complete' | 'active' | 'locked';
  ctaLabel: string;
  route: string;
}

export interface PremiumInsightItem {
  id: string;
  title: string;
  value: string;
  description: string;
  confidence: 'building' | 'emerging' | 'personalized';
}

export interface FirstWeekJourneySummary {
  currentDay: number;
  completedSteps: number;
  totalSteps: number;
  checkInCount: number;
  aiConversationCount: number;
  insightDepth: number;
  nextStep: FirstWeekJourneyStep;
  steps: FirstWeekJourneyStep[];
  premiumInsights: PremiumInsightItem[];
  emotionalReportReady: boolean;
  paywallLossHeadline: string;
  paywallLossBullets: string[];
}
