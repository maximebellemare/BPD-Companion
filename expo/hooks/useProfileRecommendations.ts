import { useMemo } from 'react';
import { useProfile } from '@/providers/ProfileProvider';
import { useInsights } from '@/hooks/useInsights';

export interface ProfileRecommendations {
  suggestedTools: string[];
  suggestedLessons: string[];
  messageDelayDefault: number;
  aiCompanionContext: {
    triggers: string[];
    urges: string[];
    spirals: string[];
    copingTools: string[];
    recentTopTrigger: string | null;
    recentTopUrge: string | null;
    averageDistress: number;
  };
  homeHighlights: {
    showStreakReminder: boolean;
    streakCount: number;
    suggestedCheckIn: boolean;
    topTriggerWarning: string | null;
  };
}

const TOOL_LESSON_MAP: Record<string, string[]> = {
  'Fear of abandonment': ['Understanding BPD', 'Fear of Abandonment', 'Relationships'],
  'Feeling rejected': ['Emotions', 'Relationships', 'Fear of Abandonment'],
  'Someone ignored me': ['Relationships', 'Fear of Abandonment'],
  'Conflict with someone': ['Relationships', 'DBT Skills'],
  'Identity confusion': ['Identity and Self-Image', 'Understanding BPD'],
  'Sudden mood shift': ['Emotions', 'DBT Skills'],
  'Perceived criticism': ['Emotions', 'Relationships'],
  'Feeling not good enough': ['Identity and Self-Image', 'Recovery and Hope'],
  'Being alone': ['Fear of Abandonment', 'Emotions'],
  'A painful memory': ['Emotions', 'DBT Skills'],
};

const TOOL_EXERCISE_MAP: Record<string, string[]> = {
  'Send an angry text': ['Check the Facts', 'Opposite Action', 'Ride the Wave'],
  'Push someone away': ['Mind Reading Check', 'Compassionate Letter'],
  'Beg for reassurance': ['Check the Facts', 'Self-Soothe Kit'],
  'Isolate completely': ['5-4-3-2-1 Grounding', 'Walking', 'Talking to someone'],
  'Quit / end things': ['Ride the Wave', 'Check the Facts', 'Deep Breathing'],
  'Lash out at someone': ['Ice Dive', 'Opposite Action', 'Deep Breathing'],
  'Cry uncontrollably': ['Self-Soothe Kit', 'Deep Breathing', 'Ride the Wave'],
  'Scroll obsessively': ['5-4-3-2-1 Grounding', 'Walking', 'Journaling'],
};

export function useProfileRecommendations(): ProfileRecommendations {
  const { profile, patternSummary } = useProfile();
  const { insights } = useInsights();

  return useMemo(() => {
    const lessonSet = new Set<string>();
    profile.commonTriggers.forEach(trigger => {
      const lessons = TOOL_LESSON_MAP[trigger];
      if (lessons) lessons.forEach(l => lessonSet.add(l));
    });

    const toolSet = new Set<string>();
    if (profile.whatHelpsMe.length > 0) {
      profile.whatHelpsMe.forEach(t => toolSet.add(t));
    }
    profile.commonUrges.forEach(urge => {
      const tools = TOOL_EXERCISE_MAP[urge];
      if (tools) tools.forEach(t => toolSet.add(t));
    });

    const streakCount = patternSummary.journalStreak;
    const checkInCount = patternSummary.checkInCount;

    return {
      suggestedTools: Array.from(toolSet).slice(0, 5),
      suggestedLessons: Array.from(lessonSet).slice(0, 4),
      messageDelayDefault: profile.messageDelaySeconds,
      aiCompanionContext: {
        triggers: profile.commonTriggers,
        urges: profile.commonUrges,
        spirals: profile.emotionalSpirals || [],
        copingTools: profile.whatHelpsMe,
        recentTopTrigger: patternSummary.topTriggerThisMonth,
        recentTopUrge: patternSummary.mostCommonUrge,
        averageDistress: patternSummary.averageDistressIntensity,
      },
      homeHighlights: {
        showStreakReminder: streakCount > 0 && streakCount < 3,
        streakCount,
        suggestedCheckIn: checkInCount === 0 || insights.weeklyIntensity.length === 0,
        topTriggerWarning: patternSummary.topTriggerThisMonth,
      },
    };
  }, [profile, patternSummary, insights]);
}
