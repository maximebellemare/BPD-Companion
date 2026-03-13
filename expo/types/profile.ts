export type ContactRelationshipType = 'friend' | 'partner' | 'therapist' | 'family' | 'other';
export type ContactMethod = 'call' | 'text' | 'email';

export interface TrustedContact {
  id: string;
  name: string;
  relationshipType: ContactRelationshipType;
  phone: string;
  email: string;
  preferredContactMethod: ContactMethod;
  notes: string;
  showInCrisisMode: boolean;
  createdAt: number;
}

export interface UserProfile {
  displayName: string;
  createdAt: number;
  commonTriggers: string[];
  commonUrges: string[];
  emotionalSpirals: string[];
  whatHelpsMe: string[];
  preferredGroundingTools: string[];
  relationshipTriggers: string[];
  trustedContacts: TrustedContact[];
  messageDelaySeconds: number;
  crisisSupport: CrisisSupportPreferences;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

export interface CrisisSupportPreferences {
  emergencyContact: string;
  preferredCrisisLine: string;
  autoSafetyModeThreshold: number;
  showSafetyModeReminder: boolean;
}

export interface NotificationPreferences {
  dailyCheckInReminder: boolean;
  checkInReminderTime: string;
  journalReminder: boolean;
  gentleNudges: boolean;
  weeklyInsights: boolean;
  weeklyReflectionReminder: boolean;
  relationshipSupportReminders: boolean;
  regulationFollowUps: boolean;
}

export interface PrivacySettings {
  anonymousCommunityPosts: boolean;
  shareInsightsWithCompanion: boolean;
  lockAppWithBiometrics: boolean;
}

export interface PatternSummary {
  topTriggerThisMonth: string | null;
  averageDistressIntensity: number;
  mostCommonUrge: string | null;
  mostUsedExercise: string | null;
  checkInCount: number;
  journalStreak: number;
  totalJournalEntries: number;
  weeklyCheckIns: number[];
}

export const DEFAULT_PROFILE: UserProfile = {
  displayName: '',
  createdAt: Date.now(),
  commonTriggers: [],
  commonUrges: [],
  emotionalSpirals: [],
  whatHelpsMe: [],
  preferredGroundingTools: [],
  relationshipTriggers: [],
  trustedContacts: [],
  messageDelaySeconds: 30,
  crisisSupport: {
    emergencyContact: '',
    preferredCrisisLine: '988',
    autoSafetyModeThreshold: 8,
    showSafetyModeReminder: true,
  },
  notifications: {
    dailyCheckInReminder: true,
    checkInReminderTime: '09:00',
    journalReminder: true,
    gentleNudges: true,
    weeklyInsights: true,
    weeklyReflectionReminder: true,
    relationshipSupportReminders: true,
    regulationFollowUps: true,
  },
  privacy: {
    anonymousCommunityPosts: true,
    shareInsightsWithCompanion: true,
    lockAppWithBiometrics: false,
  },
};
