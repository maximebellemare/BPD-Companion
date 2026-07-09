import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  Edit3,
  Heart,
  MessageCircle,
  MessageSquareText,
  Pill,
  Target,
  Wind,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useSpiralPrevention } from '@/providers/SpiralPreventionProvider';
import SpiralPausePrompt from '@/components/SpiralPausePrompt';
import { Emotion, JournalEntry, Trigger } from '@/types';
import { RelationshipType, RELATIONSHIP_TAG_OPTIONS } from '@/types/relationship';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useMedications } from '@/providers/MedicationProvider';
import { formatTime, MedicationTime } from '@/types/medication';
import { useAppointments } from '@/providers/AppointmentProvider';
import { APPOINTMENT_TYPE_LABELS, formatAppointmentDate, formatAppointmentTime } from '@/types/appointment';
import { useReviewPrompt } from '@/providers/ReviewPromptProvider';
import { loadSavedCompanionInsights } from '@/services/companion/companionInsightService';
import {
  getNextHabitAchievement,
  HabitAchievement,
  hasSeenTodayTutorial,
  markTodayTutorialSeen,
} from '@/services/habits/tutorialAndRewardsService';

type EmotionOption = {
  id: string;
  label: string;
  tone: 'positive' | 'difficult';
};

type TriggerOption = {
  id: string;
  label: string;
  category: Trigger['category'];
  tone: 'positive' | 'difficult';
};

type ContextOption = {
  id: string;
  label: string;
  relationshipTag?: RelationshipType;
};

const EMOTION_OPTIONS: EmotionOption[] = [
  { id: 'calm', label: 'Calm', tone: 'positive' },
  { id: 'hopeful', label: 'Hopeful', tone: 'positive' },
  { id: 'proud', label: 'Proud', tone: 'positive' },
  { id: 'grateful', label: 'Grateful', tone: 'positive' },
  { id: 'happy', label: 'Happy', tone: 'positive' },
  { id: 'connected', label: 'Connected', tone: 'positive' },
  { id: 'motivated', label: 'Motivated', tone: 'positive' },
  { id: 'okay', label: 'Okay', tone: 'positive' },
  { id: 'anxious', label: 'Anxious', tone: 'difficult' },
  { id: 'angry', label: 'Angry', tone: 'difficult' },
  { id: 'sad', label: 'Sad', tone: 'difficult' },
  { id: 'empty', label: 'Empty', tone: 'difficult' },
  { id: 'ashamed', label: 'Ashamed', tone: 'difficult' },
  { id: 'rejected', label: 'Rejected', tone: 'difficult' },
  { id: 'abandoned', label: 'Abandoned', tone: 'difficult' },
  { id: 'overwhelmed', label: 'Overwhelmed', tone: 'difficult' },
  { id: 'numb', label: 'Numb', tone: 'difficult' },
  { id: 'lonely', label: 'Lonely', tone: 'difficult' },
  { id: 'triggered', label: 'Triggered', tone: 'difficult' },
  { id: 'other', label: 'Other/custom', tone: 'difficult' },
];

const TRIGGER_OPTIONS: TriggerOption[] = [
  { id: 'abandonment_fear', label: 'Fear of abandonment', category: 'relationship', tone: 'difficult' },
  { id: 'relationship_conflict', label: 'Relationship conflict', category: 'relationship', tone: 'difficult' },
  { id: 'delayed_reply', label: 'Delayed reply', category: 'relationship', tone: 'difficult' },
  { id: 'feeling_ignored', label: 'Feeling ignored', category: 'relationship', tone: 'difficult' },
  { id: 'criticism', label: 'Criticism', category: 'self', tone: 'difficult' },
  { id: 'loneliness', label: 'Loneliness', category: 'self', tone: 'difficult' },
  { id: 'shame', label: 'Shame', category: 'self', tone: 'difficult' },
  { id: 'work', label: 'Work/school', category: 'situation', tone: 'difficult' },
  { id: 'family', label: 'Family', category: 'relationship', tone: 'difficult' },
  { id: 'money', label: 'Money', category: 'situation', tone: 'difficult' },
  { id: 'sleep', label: 'Sleep', category: 'situation', tone: 'difficult' },
  { id: 'good_sleep', label: 'Good sleep', category: 'situation', tone: 'positive' },
  { id: 'exercise', label: 'Exercise', category: 'situation', tone: 'positive' },
  { id: 'supportive_conversation', label: 'Supportive conversation', category: 'relationship', tone: 'positive' },
  { id: 'felt_connected', label: 'Felt connected', category: 'relationship', tone: 'positive' },
  { id: 'completed_something', label: 'Completed something', category: 'situation', tone: 'positive' },
  { id: 'time_outside', label: 'Time outside', category: 'situation', tone: 'positive' },
  { id: 'therapy_session', label: 'Therapy/session', category: 'situation', tone: 'positive' },
  { id: 'medication_routine', label: 'Medication routine', category: 'situation', tone: 'positive' },
  { id: 'self_care', label: 'Self-care', category: 'self', tone: 'positive' },
  { id: 'work_progress', label: 'Work progress', category: 'situation', tone: 'positive' },
  { id: 'proud_moment', label: 'Something I’m proud of', category: 'self', tone: 'positive' },
  { id: 'other', label: 'Other/custom', category: 'other', tone: 'difficult' },
];

const CONTEXT_OPTIONS: ContextOption[] = [
  { id: 'none', label: 'No one / just me' },
  { id: 'partner', label: 'Partner', relationshipTag: 'partner' },
  { id: 'friend', label: 'Friend', relationshipTag: 'friend' },
  { id: 'family', label: 'Family', relationshipTag: 'parent' },
  { id: 'work_school', label: 'Work/school', relationshipTag: 'coworker' },
  { id: 'community', label: 'Community', relationshipTag: 'other' },
  { id: 'other', label: 'Other/custom' },
];

function isSameLocalDay(a: number, b: number): boolean {
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatCheckInTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function emotionLabelsToIds(emotions: Emotion[]): string[] {
  return emotions.map((emotion) => {
    const match = EMOTION_OPTIONS.find(option => option.label.toLowerCase() === emotion.label.toLowerCase());
    return match?.id ?? 'other';
  });
}

function triggerLabelsToIds(triggers: Trigger[]): string[] {
  return triggers.map((trigger) => {
    const match = TRIGGER_OPTIONS.find(option => option.label.toLowerCase() === trigger.label.toLowerCase());
    return match?.id ?? 'other';
  });
}

function getContextFromNotes(notes?: string): string {
  const match = (notes ?? '').match(/(?:^|\n)Context:\s*(.+)$/i);
  return match?.[1]?.trim() ?? '';
}

function buildCheckInNotes(contextLabel: string): string {
  return ['Quick Today check-in', contextLabel ? `Context: ${contextLabel}` : '']
    .filter(Boolean)
    .join('\n');
}

function getEmotionTone(emotionIds: string[]): 'positive' | 'difficult' {
  const selected = emotionIds
    .filter(id => id !== 'other')
    .map(id => EMOTION_OPTIONS.find(option => option.id === id))
    .filter(Boolean) as EmotionOption[];
  if (selected.length > 0 && selected.every(option => option.tone === 'positive')) return 'positive';
  return 'difficult';
}

function getEmotionToneFromLabels(labels: string[]): 'positive' | 'difficult' {
  const ids = labels.map(label => {
    const match = EMOTION_OPTIONS.find(option => option.label.toLowerCase() === label.toLowerCase());
    return match?.id ?? 'other';
  });
  return getEmotionTone(ids);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Still up?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Winding down?';
}

function getIntensityLabel(intensity: number, tone: 'positive' | 'difficult'): string {
  if (tone === 'positive') {
    if (intensity <= 3) return 'Slight';
    if (intensity <= 6) return 'Noticeable';
    if (intensity <= 8) return 'Strong';
    return 'Very strong';
  }
  if (intensity <= 3) return 'Mild';
  if (intensity <= 6) return 'Moderate';
  if (intensity <= 8) return 'Intense';
  return 'Very intense';
}

function getDistressLevel(intensity: number) {
  if (intensity >= 8) return 'crisis' as const;
  if (intensity >= 6) return 'high' as const;
  if (intensity >= 4) return 'moderate' as const;
  return 'low' as const;
}

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tutorial?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { journalEntries, messageDrafts, addJournalEntry, updateJournalEntry, setDistressLevel } = useApp();
  const medicationContext = useMedications();
  const appointmentContext = useAppointments();
  const dueMedications = medicationContext?.dueMedications ?? [];
  const logMedication = medicationContext?.logMedication ?? (async () => {
    if (__DEV__) console.log('[HomeScreen] Medication context unavailable while logging.');
  });
  const isLogging = medicationContext?.isLogging ?? false;
  const todayAppointments = appointmentContext?.todayAppointments ?? [];
  const nextAppointment = appointmentContext?.nextAppointment ?? null;
  const { trackEvent } = useAnalytics();
  const { maybeShowReviewPrompt } = useReviewPrompt();
  const {
    detection: spiralDetection,
    shouldShowBanner: shouldShowSpiralBanner,
    dismissBanner: dismissSpiralBanner,
    showPausePrompt: spiralPauseVisible,
    pausePromptConfig: spiralPauseConfig,
    dismissPausePrompt: dismissSpiralPause,
  } = useSpiralPrevention();

  const [intensity, setIntensity] = useState<number>(5);
  const [selectedEmotionIds, setSelectedEmotionIds] = useState<string[]>([]);
  const [selectedTriggerIds, setSelectedTriggerIds] = useState<string[]>([]);
  const [selectedRelationshipTags, setSelectedRelationshipTags] = useState<RelationshipType[]>([]);
  const [selectedContextId, setSelectedContextId] = useState<string>('');
  const [customEmotion, setCustomEmotion] = useState<string>('');
  const [customTrigger, setCustomTrigger] = useState<string>('');
  const [customContext, setCustomContext] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [isEditingCheckIn, setIsEditingCheckIn] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [achievement, setAchievement] = useState<HabitAchievement | null>(null);
  const [loggingMedicationKey, setLoggingMedicationKey] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'today' });
  }, [trackEvent]);

  useEffect(() => {
    hasSeenTodayTutorial()
      .then((seen) => setShowTutorial(!seen))
      .catch(() => setShowTutorial(false));
  }, []);

  useEffect(() => {
    if (params.tutorial === '1') {
      setShowTutorial(true);
    }
  }, [params.tutorial]);

  useEffect(() => {
    let mounted = true;
    loadSavedCompanionInsights()
      .then((savedInsights) => getNextHabitAchievement({
        entries: journalEntries,
        savedInsightCount: savedInsights.length,
        dontSendItCount: messageDrafts.filter(draft => draft.rewriteType === 'nosend' || draft.outcome === 'not_sent').length,
      }))
      .then((next) => {
        if (mounted && next) setAchievement(next);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [journalEntries, messageDrafts]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const greeting = useMemo(() => getGreeting(), []);
  const todaysCheckIn = useMemo(() => {
    const now = Date.now();
    return [...journalEntries]
      .filter(entry => isSameLocalDay(entry.timestamp, now))
      .sort((a, b) => b.timestamp - a.timestamp)[0] ?? null;
  }, [journalEntries]);
  const hasCompletedToday = !!todaysCheckIn && !isEditingCheckIn;
  const displayIntensity = hasCompletedToday ? todaysCheckIn.checkIn.intensityLevel : intensity;
  const displayEmotionLabels = hasCompletedToday
    ? todaysCheckIn.checkIn.emotions.map(emotion => emotion.label).filter(Boolean)
    : selectedEmotionIds
      .filter(id => id !== 'other')
      .map(id => EMOTION_OPTIONS.find(emotion => emotion.id === id)?.label ?? id)
      .concat(customEmotion.trim() ? [customEmotion.trim()] : []);
  const displayTriggerLabels = hasCompletedToday
    ? todaysCheckIn.checkIn.triggers.map(trigger => trigger.label).filter(Boolean)
    : selectedTriggerIds
      .filter(id => id !== 'other')
      .map(id => TRIGGER_OPTIONS.find(trigger => trigger.id === id)?.label ?? id)
      .concat(selectedTriggerIds.includes('other') && customTrigger.trim() ? [customTrigger.trim()] : []);
  const displayRelationshipTagLabels = hasCompletedToday
    ? (todaysCheckIn.relationshipTags ?? todaysCheckIn.checkIn.relationshipTags ?? [])
      .map(tag => RELATIONSHIP_TAG_OPTIONS.find(option => option.value === tag)?.label ?? tag)
    : selectedRelationshipTags.map(tag => RELATIONSHIP_TAG_OPTIONS.find(option => option.value === tag)?.label ?? tag);
  const displayContextLabel = hasCompletedToday
    ? getContextFromNotes(todaysCheckIn.checkIn.notes)
    : (selectedContextId === 'other'
      ? customContext.trim()
      : CONTEXT_OPTIONS.find(option => option.id === selectedContextId)?.label ?? '');
  const emotionTone = hasCompletedToday
    ? getEmotionToneFromLabels(displayEmotionLabels)
    : getEmotionTone(selectedEmotionIds);

  useEffect(() => {
    if (!hasCompletedToday || !todaysCheckIn) return;
    void maybeShowReviewPrompt('weekly_positive_mood', {
      moodLabels: todaysCheckIn.checkIn.emotions.map(emotion => emotion.label),
      intensity: todaysCheckIn.checkIn.intensityLevel,
      text: [
        todaysCheckIn.checkIn.notes,
        ...todaysCheckIn.checkIn.triggers.map(trigger => trigger.label),
      ].filter(Boolean).join(' '),
    });
  }, [hasCompletedToday, maybeShowReviewPrompt, todaysCheckIn]);

  const availableInfluenceOptions = useMemo(
    () => TRIGGER_OPTIONS.filter(option => option.id === 'other' || option.tone === emotionTone),
    [emotionTone],
  );
  const recommendationEmotionIds = hasCompletedToday
    ? emotionLabelsToIds(todaysCheckIn.checkIn.emotions)
    : selectedEmotionIds;
  const highIntensity = emotionTone === 'difficult' && displayIntensity >= 7;
  const hasOtherSelected = selectedEmotionIds.includes('other');
  const hasOtherTriggerSelected = selectedTriggerIds.includes('other');
  const checkInCount = journalEntries.length;
  const showSpiralWarning = shouldShowSpiralBanner &&
    spiralDetection.confidenceScore >= 0.65 &&
    spiralDetection.signals.length >= 2;
  const topSpiralSignals = spiralDetection.signals.slice(0, 2).map(signal => signal.label).join(' + ');
  const nextDueMedication = useMemo(
    () => dueMedications.find(item => !item.logged) ?? dueMedications[0] ?? null,
    [dueMedications],
  );
  const highlightedAppointment = useMemo(
    () => todayAppointments.find(appointment => !appointment.completed) ?? nextAppointment,
    [nextAppointment, todayAppointments],
  );

  const recommendation = useMemo(() => {
    if (highIntensity) {
      return {
        title: 'Start by calming your body',
        body: 'When emotions feel intense, BPD Companion suggests a grounding tool before reflection.',
        cta: 'Start Calm Me Down',
        route: '/grounding-mode',
        icon: Wind,
      };
    }
    if (recommendationEmotionIds.some(id => ['angry', 'triggered', 'rejected', 'abandoned'].includes(id))) {
      return {
        title: 'Pause before reacting',
        body: 'Check the message or reply before you send it.',
        cta: 'Open Don’t Send It',
        route: '/dont-send-it',
        icon: MessageSquareText,
      };
    }
    if (recommendationEmotionIds.some(id => ['empty', 'sad', 'numb', 'lonely', 'ashamed'].includes(id))) {
      return {
        title: 'Name what is underneath',
        body: 'A few words can help turn a vague feeling into something you can care for.',
        cta: 'Add a reflection',
        route: '/check-in?source=today',
        icon: Edit3,
      };
    }
    if (emotionTone === 'positive') {
      return {
        title: 'Notice what helped',
        body: hasCompletedToday
          ? 'Your check-in is saved. Positive and steady moments help reveal what supports you.'
          : 'Save what influenced this so your future insights can spot what helps.',
        cta: hasCompletedToday ? 'View Insights' : 'Save check-in first',
        route: hasCompletedToday ? '/(tabs)/insights' : null,
        icon: Target,
      };
    }
    return {
      title: hasCompletedToday ? 'Your insight is building' : 'Keep it simple',
      body: hasCompletedToday
        ? 'Your check-in is saved. Small entries are what reveal patterns over time.'
        : 'Save this check-in. Small, honest entries are what make the app more useful over time.',
      cta: hasCompletedToday ? 'View Insights' : 'Save check-in first',
      route: hasCompletedToday ? '/(tabs)/insights' : null,
      icon: Target,
    };
  }, [emotionTone, hasCompletedToday, highIntensity, recommendationEmotionIds]);

  const smallInsight = useMemo(() => {
    if (checkInCount < 7) {
      return 'Complete more check-ins to unlock your first emotional pattern.';
    }

    const recent = journalEntries.slice(0, 7);
    const averageIntensity = recent.length
      ? Math.round(recent.reduce((sum, entry) => sum + entry.checkIn.intensityLevel, 0) / recent.length)
      : intensity;
    return `Your recent check-ins average ${averageIntensity}/10 intensity. Keep checking in to make this pattern clearer.`;
  }, [checkInCount, intensity, journalEntries]);

  const handleHaptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(style);
    }
  }, []);

  useEffect(() => {
    const allowedIds = new Set(availableInfluenceOptions.map(option => option.id));
    setSelectedTriggerIds(prev => prev.filter(id => allowedIds.has(id)));
  }, [availableInfluenceOptions]);

  const toggleEmotion = useCallback((emotionId: string) => {
    handleHaptic();
    setSavedNotice(null);
    setSelectedEmotionIds(prev => (
      prev.includes(emotionId)
        ? prev.filter(id => id !== emotionId)
        : [...prev, emotionId]
      ));
  }, [handleHaptic]);

  const toggleTrigger = useCallback((triggerId: string) => {
    handleHaptic();
    setSavedNotice(null);
    setSelectedTriggerIds(prev => (
      prev.includes(triggerId)
        ? prev.filter(id => id !== triggerId)
        : [...prev, triggerId]
    ));
  }, [handleHaptic]);

  const selectContext = useCallback((option: ContextOption) => {
    handleHaptic();
    setSavedNotice(null);
    setSelectedContextId(prev => prev === option.id ? '' : option.id);
    if (option.relationshipTag) {
      setSelectedRelationshipTags([option.relationshipTag]);
    } else {
      setSelectedRelationshipTags([]);
    }
    if (option.id !== 'other') setCustomContext('');
  }, [handleHaptic]);

  const saveQuickCheckIn = useCallback(() => {
    const now = Date.now();
    const custom = customEmotion.trim();
    const selectedEmotions: Emotion[] = selectedEmotionIds
      .filter(id => id !== 'other')
      .map(id => {
        const option = EMOTION_OPTIONS.find(emotion => emotion.id === id);
        return {
          id: `today_${id}`,
          label: option?.label ?? id,
          emoji: '',
          intensity,
        };
      });

    if (custom) {
      selectedEmotions.push({
        id: `today_custom_${now}`,
        label: custom,
        emoji: '',
        intensity,
      });
    }

    const customTriggerText = selectedTriggerIds.includes('other') ? customTrigger.trim() : '';
    const selectedTriggers: Trigger[] = selectedTriggerIds
      .filter(id => id !== 'other')
      .map(id => {
        const option = TRIGGER_OPTIONS.find(trigger => trigger.id === id);
        return {
          id: `today_trigger_${id}`,
          label: option?.label ?? id,
          category: option?.category ?? 'other',
          relationshipTags: option?.category === 'relationship' ? selectedRelationshipTags : undefined,
        };
      });

    if (customTriggerText) {
      selectedTriggers.push({
        id: `today_custom_trigger_${now}`,
        label: customTriggerText,
        category: 'other',
        relationshipTags: selectedRelationshipTags,
      });
    }

    const selectedContextLabel = selectedContextId === 'other'
      ? customContext.trim()
      : CONTEXT_OPTIONS.find(option => option.id === selectedContextId)?.label ?? '';

    const existingId = isEditingCheckIn && todaysCheckIn ? todaysCheckIn.id : `today_${now}`;
    const entry: JournalEntry = {
      id: existingId,
      timestamp: now,
      checkIn: {
        id: isEditingCheckIn && todaysCheckIn ? todaysCheckIn.checkIn.id : `ci_today_${now}`,
        timestamp: now,
        triggers: selectedTriggers,
        emotions: selectedEmotions,
        urges: [],
        bodySensations: [],
        intensityLevel: intensity,
        notes: buildCheckInNotes(selectedContextLabel),
        relationshipTags: selectedRelationshipTags,
      },
      relationshipTags: selectedRelationshipTags,
    };

    const wasEditing = isEditingCheckIn && !!todaysCheckIn;

    if (wasEditing) {
      updateJournalEntry(todaysCheckIn.id, entry);
    } else {
      addJournalEntry(entry);
    }
    setDistressLevel(emotionTone === 'positive' ? 'low' : getDistressLevel(intensity));
    trackEvent('today_quick_check_in_saved', {
      intensity,
      emotion_count: selectedEmotions.length,
      trigger_count: selectedTriggers.length,
      relationship_tag_count: selectedRelationshipTags.length,
    });
    setSavedNotice(isEditingCheckIn ? 'Today’s check-in updated.' : 'Today’s check-in saved.');
    setIsEditingCheckIn(false);
    if (!wasEditing) {
      void maybeShowReviewPrompt('after_first_tracking', {
        moodLabels: selectedEmotions.map(emotion => emotion.label),
        intensity,
        text: [
          selectedContextLabel,
          customEmotion,
          customTrigger,
          ...selectedTriggers.map(trigger => trigger.label),
        ].filter(Boolean).join(' '),
      });
    }
  }, [addJournalEntry, customContext, customEmotion, customTrigger, emotionTone, intensity, isEditingCheckIn, maybeShowReviewPrompt, selectedContextId, selectedEmotionIds, selectedRelationshipTags, selectedTriggerIds, setDistressLevel, todaysCheckIn, trackEvent, updateJournalEntry]);

  const handleEditCheckIn = useCallback(() => {
    if (!todaysCheckIn) return;
    handleHaptic();
    setIntensity(todaysCheckIn.checkIn.intensityLevel);
    const ids = emotionLabelsToIds(todaysCheckIn.checkIn.emotions);
    const knownLabels = new Set(EMOTION_OPTIONS.map(option => option.label.toLowerCase()));
    const customLabels = todaysCheckIn.checkIn.emotions
      .map(emotion => emotion.label)
      .filter(label => !knownLabels.has(label.toLowerCase()));
    const triggerIds = triggerLabelsToIds(todaysCheckIn.checkIn.triggers);
    const knownTriggerLabels = new Set(TRIGGER_OPTIONS.map(option => option.label.toLowerCase()));
    const customTriggerLabels = todaysCheckIn.checkIn.triggers
      .map(trigger => trigger.label)
      .filter(label => !knownTriggerLabels.has(label.toLowerCase()));
    const existingContext = getContextFromNotes(todaysCheckIn.checkIn.notes);
    const contextMatch = CONTEXT_OPTIONS.find(option => option.label.toLowerCase() === existingContext.toLowerCase());
    setSelectedEmotionIds([...new Set(ids)]);
    setCustomEmotion(customLabels.join(', '));
    setSelectedTriggerIds([...new Set(triggerIds)]);
    setCustomTrigger(customTriggerLabels.join(', '));
    setSelectedRelationshipTags(todaysCheckIn.relationshipTags ?? todaysCheckIn.checkIn.relationshipTags ?? []);
    setSelectedContextId(contextMatch?.id ?? (existingContext ? 'other' : ''));
    setCustomContext(contextMatch ? '' : existingContext);
    setSavedNotice(null);
    setIsEditingCheckIn(true);
  }, [handleHaptic, todaysCheckIn]);

  const handlePrimaryCta = useCallback(() => {
    handleHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (hasCompletedToday) {
      if (highIntensity || recommendationEmotionIds.some(id => ['angry', 'triggered', 'rejected', 'abandoned', 'overwhelmed'].includes(id))) {
        router.push('/(tabs)/companion' as never);
      } else {
        router.push('/(tabs)/insights' as never);
      }
      return;
    }
    if (savedNotice && !isEditingCheckIn) {
      router.push('/(tabs)/insights' as never);
      return;
    }
    saveQuickCheckIn();
  }, [handleHaptic, hasCompletedToday, highIntensity, isEditingCheckIn, recommendationEmotionIds, router, saveQuickCheckIn, savedNotice]);

  const handleRecommendationPress = useCallback(() => {
    handleHaptic();
    if (!recommendation.route) {
      saveQuickCheckIn();
      return;
    }
    trackEvent('today_recommendation_tapped', { recommendation: recommendation.cta, intensity });
    router.push(recommendation.route as never);
  }, [handleHaptic, intensity, recommendation, router, saveQuickCheckIn, trackEvent]);

  const RecommendationIcon = recommendation.icon;

  const handleMedicationTaken = useCallback(async (medicationId: string, time: MedicationTime | null) => {
    handleHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const key = `${medicationId}-${time?.hour ?? 'as'}-${time?.minute ?? 'needed'}`;
    setLoggingMedicationKey(key);
    try {
      await logMedication({
        medicationId,
        status: 'taken',
        scheduledTime: time,
      });
      trackEvent('today_medication_logged_taken', { medicationId });
    } catch (error) {
      console.log('[Today] Failed to log medication:', error);
    } finally {
      setLoggingMedicationKey(null);
    }
  }, [handleHaptic, logMedication, trackEvent]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>Today</Text>
            <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>One honest signal is enough to start.</Text>
          </View>

          {showSpiralWarning ? (
            <View style={[styles.spiralWarningCard, { backgroundColor: colors.card, borderColor: colors.borderLight, shadowColor: colors.shadow }]}>
              <View style={styles.spiralWarningHeader}>
                <View style={[styles.spiralWarningIcon, { backgroundColor: colors.primaryLight }]}>
                  <Wind size={18} color={colors.primary} />
                </View>
                <View style={styles.spiralWarningTextWrap}>
                  <Text style={[styles.cardKicker, { color: colors.brandTeal }]}>Spiral detection</Text>
                  <Text style={[styles.spiralWarningTitle, { color: colors.text }]}>We’ve seen similar patterns before.</Text>
                </View>
                <TouchableOpacity
                  style={[styles.spiralDismissButton, { backgroundColor: colors.surface }]}
                  onPress={dismissSpiralBanner}
                  activeOpacity={0.75}
                  testID="dismiss-spiral-warning"
                >
                  <X size={15} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.spiralWarningBody, { color: colors.textSecondary }]}>
                This resembles a pattern that previously led to distress. This is not certain, but slowing down now may help.
              </Text>
              {topSpiralSignals ? (
                <Text style={[styles.spiralEvidence, { color: colors.primary }]}>
                  Signals: {topSpiralSignals}. Confidence: {Math.round(spiralDetection.confidenceScore * 100)}%.
                </Text>
              ) : null}
              <View style={styles.spiralActionRow}>
                <TouchableOpacity
                  style={[styles.spiralActionButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    trackEvent('spiral_warning_action_tapped', { action: 'calm_down' });
                    router.push('/grounding-mode' as never);
                  }}
                  activeOpacity={0.84}
                  testID="spiral-action-calm"
                >
                  <Wind size={15} color={Colors.white} />
                  <Text style={styles.spiralPrimaryActionText}>Calm Me Down</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.spiralActionButtonSecondary, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  onPress={() => {
                    trackEvent('spiral_warning_action_tapped', { action: 'companion' });
                    router.push('/(tabs)/companion' as never);
                  }}
                  activeOpacity={0.82}
                  testID="spiral-action-companion"
                >
                  <MessageCircle size={15} color={colors.primary} />
                  <Text style={[styles.spiralSecondaryActionText, { color: colors.primary }]}>Companion</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.spiralActionButtonSecondary, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  onPress={() => {
                    trackEvent('spiral_warning_action_tapped', { action: 'dont_send_it' });
                    router.push('/dont-send-it' as never);
                  }}
                  activeOpacity={0.82}
                  testID="spiral-action-dont-send"
                >
                  <MessageSquareText size={15} color={colors.primary} />
                  <Text style={[styles.spiralSecondaryActionText, { color: colors.primary }]}>Don’t Send It</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {nextDueMedication ? (
            <TouchableOpacity
              style={[styles.medicationDueCard, { backgroundColor: colors.card, borderColor: colors.borderLight, shadowColor: colors.shadow }]}
              onPress={() => router.push('/medications' as never)}
              activeOpacity={0.84}
              testID="today-medication-due-card"
            >
              <View style={[styles.medicationDueIcon, { backgroundColor: colors.primaryLight }]}>
                <Pill size={18} color={colors.primary} />
              </View>
              <View style={styles.medicationDueTextWrap}>
                <Text style={[styles.cardKicker, { color: colors.brandTeal }]}>Medication due</Text>
                <Text style={[styles.medicationDueTitle, { color: colors.text }]} numberOfLines={1}>
                  {nextDueMedication.medication.name}{nextDueMedication.medication.dosage ? ` · ${nextDueMedication.medication.dosage}` : ''}
                </Text>
                <Text style={[styles.medicationDueBody, { color: colors.textSecondary }]}>
                  {nextDueMedication.time.label} · {formatTime(nextDueMedication.time.hour, nextDueMedication.time.minute)}
                </Text>
              </View>
              {nextDueMedication.logged ? (
                <View style={[styles.medicationLoggedPill, { backgroundColor: colors.successLight }]}>
                  <Check size={13} color={colors.success} />
                  <Text style={[styles.medicationLoggedText, { color: colors.success }]}>Taken</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.medicationTakenButton, { backgroundColor: colors.primary }]}
                  onPress={(event) => {
                    event.stopPropagation();
                    void handleMedicationTaken(nextDueMedication.medication.id, nextDueMedication.time);
                  }}
                  disabled={isLogging || loggingMedicationKey === `${nextDueMedication.medication.id}-${nextDueMedication.time.hour}-${nextDueMedication.time.minute}`}
                  activeOpacity={0.82}
                  testID="today-medication-mark-taken"
                >
                  <Text style={styles.medicationTakenText}>Taken</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ) : null}

          {highlightedAppointment ? (
            <TouchableOpacity
              style={[styles.appointmentCard, { backgroundColor: colors.card, borderColor: colors.borderLight, shadowColor: colors.shadow }]}
              onPress={() => router.push(`/appointment-detail?id=${highlightedAppointment.id}` as never)}
              activeOpacity={0.84}
              testID="today-appointment-card"
            >
              <View style={[styles.appointmentIcon, { backgroundColor: colors.brandTealSoft }]}>
                <Calendar size={18} color={colors.brandTeal} />
              </View>
              <View style={styles.appointmentTextWrap}>
                <Text style={[styles.cardKicker, { color: colors.brandTeal }]}>
                  {todayAppointments.some(item => item.id === highlightedAppointment.id) ? 'Appointment today' : 'Upcoming appointment'}
                </Text>
                <Text style={[styles.appointmentTitle, { color: colors.text }]} numberOfLines={1}>
                  {highlightedAppointment.providerName}
                </Text>
                <Text style={[styles.appointmentBody, { color: colors.textSecondary }]}>
                  {APPOINTMENT_TYPE_LABELS[highlightedAppointment.appointmentType]} · {formatAppointmentDate(highlightedAppointment.dateTime)} · {formatAppointmentTime(highlightedAppointment.dateTime)}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}

          {hasCompletedToday ? (
            <View style={[styles.completedCard, { backgroundColor: colors.card, borderColor: colors.borderLight, shadowColor: colors.shadow }]}>
              <View style={styles.completedHeader}>
                <View style={[styles.completedIcon, { backgroundColor: colors.successLight }]}>
                  <Check size={18} color={colors.success} />
                </View>
                <View style={styles.completedHeaderText}>
                  <Text style={[styles.cardKicker, { color: colors.brandTeal }]}>Quick check-in</Text>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Today’s check-in complete ✓</Text>
                </View>
              </View>

              <View style={styles.completedDetails}>
                <View style={[styles.completedDetailRow, { borderColor: colors.borderLight }]}>
                  <Text style={[styles.completedLabel, { color: colors.textSecondary }]}>Emotion</Text>
                  <Text style={[styles.completedValue, { color: colors.text }]}>
                    {displayEmotionLabels.length ? displayEmotionLabels.join(', ') : 'Not added'}
                  </Text>
                </View>
                <View style={[styles.completedDetailRow, { borderColor: colors.borderLight }]}>
                  <Text style={[styles.completedLabel, { color: colors.textSecondary }]}>{emotionTone === 'positive' ? 'Strength' : 'Intensity'}</Text>
                  <Text style={[styles.completedValue, { color: colors.text }]}>{displayIntensity}/10 · {getIntensityLabel(displayIntensity, emotionTone)}</Text>
                </View>
                <View style={[styles.completedDetailRow, { borderColor: colors.borderLight }]}>
                  <Text style={[styles.completedLabel, { color: colors.textSecondary }]}>Influence</Text>
                  <Text style={[styles.completedValue, { color: colors.text }]}>
                    {displayTriggerLabels.length ? displayTriggerLabels.join(', ') : 'No influence recorded'}
                  </Text>
                </View>
                <View style={[styles.completedDetailRow, { borderColor: colors.borderLight }]}>
                  <Text style={[styles.completedLabel, { color: colors.textSecondary }]}>Context</Text>
                  <Text style={[styles.completedValue, { color: colors.text }]}>
                    {displayContextLabel || displayRelationshipTagLabels.join(', ') || 'No context recorded'}
                  </Text>
                </View>
                <View style={[styles.completedDetailRow, { borderColor: colors.borderLight }]}>
                  <Text style={[styles.completedLabel, { color: colors.textSecondary }]}>Time</Text>
                  <Text style={[styles.completedValue, { color: colors.text }]}>{formatCheckInTime(todaysCheckIn.timestamp)}</Text>
                </View>
              </View>

              {savedNotice ? <Text style={styles.savedNotice}>{savedNotice}</Text> : null}
            </View>
          ) : (
          <View style={[styles.checkInCard, { backgroundColor: colors.card, borderColor: colors.borderLight, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Heart size={19} color={Colors.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardKicker, { color: colors.brandTeal }]}>Quick check-in</Text>
                <Text style={[styles.cardTitle, { color: colors.text }]}>How are you feeling right now?</Text>
              </View>
            </View>

            <View style={styles.intensityHeader}>
              <Text style={[styles.intensityValue, { color: colors.primary }]}>{intensity}</Text>
              <View style={styles.intensityCopy}>
                <Text style={[styles.intensityLabel, { color: colors.text }]}>
                  How intense does this feel right now?
                </Text>
                <Text style={[styles.intensityHint, { color: colors.textSecondary }]}>
                  1 = very manageable · 10 = overwhelming
                </Text>
              </View>
            </View>

            <View style={styles.scaleGrid}>
              {Array.from({ length: 10 }, (_, index) => index + 1).map(value => {
                const active = value === intensity;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.scaleButton, { backgroundColor: colors.surface, borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }, emotionTone === 'difficult' && value >= 7 && styles.scaleButtonHigh]}
                    onPress={() => {
                      handleHaptic();
                      setSavedNotice(null);
                      setIntensity(value);
                    }}
                    activeOpacity={0.8}
                    testID={`intensity-${value}`}
                  >
                    <Text style={[styles.scaleButtonText, { color: colors.textSecondary }, active && { color: colors.white }]}>{value}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>What feels closest?</Text>
            <View style={styles.chipGrid}>
              {EMOTION_OPTIONS.map(emotion => {
                const active = selectedEmotionIds.includes(emotion.id);
                return (
                  <TouchableOpacity
                    key={emotion.id}
                    style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => toggleEmotion(emotion.id)}
                    activeOpacity={0.78}
                    testID={`emotion-${emotion.id}`}
                  >
                    {active ? <Check size={13} color={Colors.white} /> : null}
                    <Text style={[styles.chipText, { color: colors.textSecondary }, active && { color: colors.white }]}>{emotion.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {hasOtherSelected ? (
              <TextInput
                value={customEmotion}
                onChangeText={(text) => {
                  setCustomEmotion(text);
                  setSavedNotice(null);
                }}
                placeholder="Write what you feel"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.customEmotionInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                autoCapitalize="sentences"
                testID="custom-emotion-input"
              />
            ) : null}

            <Text style={[styles.inputLabel, { color: colors.text }]}>What influenced this?</Text>
            <Text style={[styles.optionalHint, { color: colors.textSecondary }]}>Optional. Choose anything that fits.</Text>
            <View style={styles.chipGrid}>
              {availableInfluenceOptions.map(trigger => {
                const active = selectedTriggerIds.includes(trigger.id);
                return (
                  <TouchableOpacity
                    key={trigger.id}
                    style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => toggleTrigger(trigger.id)}
                    activeOpacity={0.78}
                    testID={`trigger-${trigger.id}`}
                  >
                    {active ? <Check size={13} color={Colors.white} /> : null}
                    <Text style={[styles.chipText, { color: colors.textSecondary }, active && { color: colors.white }]}>{trigger.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {hasOtherTriggerSelected ? (
              <TextInput
                value={customTrigger}
                onChangeText={(text) => {
                  setCustomTrigger(text);
                  setSavedNotice(null);
                }}
                placeholder="Write what influenced this"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.customEmotionInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                autoCapitalize="sentences"
                testID="custom-trigger-input"
              />
            ) : null}

            <Text style={[styles.inputLabel, { color: colors.text }]}>Was anyone involved?</Text>
            <Text style={[styles.optionalHint, { color: colors.textSecondary }]}>Optional. This can be just you, another person, or a setting.</Text>
            <View style={styles.chipGrid}>
              {CONTEXT_OPTIONS.map(option => {
                const active = selectedContextId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => selectContext(option)}
                    activeOpacity={0.78}
                    testID={`context-${option.id}`}
                  >
                    {active ? <Check size={13} color={Colors.white} /> : null}
                    <Text style={[styles.chipText, { color: colors.textSecondary }, active && { color: colors.white }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedContextId === 'other' ? (
              <TextInput
                value={customContext}
                onChangeText={(text) => {
                  setCustomContext(text);
                  setSavedNotice(null);
                }}
                placeholder="Write who or what context"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.customEmotionInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                autoCapitalize="sentences"
                testID="custom-context-input"
              />
            ) : null}

            {savedNotice ? <Text style={styles.savedNotice}>{savedNotice}</Text> : null}
          </View>
          )}

          {hasCompletedToday ? (
            <TouchableOpacity
              style={[styles.recommendationCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              onPress={handleRecommendationPress}
              activeOpacity={0.82}
              testID="today-recommendation"
            >
              <View style={styles.recommendationIcon}>
                <RecommendationIcon size={18} color={Colors.primary} />
              </View>
              <View style={styles.recommendationTextWrap}>
                <Text style={[styles.recommendationKicker, { color: colors.brandTeal }]}>Recommended next step</Text>
                <Text style={[styles.recommendationTitle, { color: colors.text }]}>{recommendation.title}</Text>
                <Text style={[styles.recommendationBody, { color: colors.textSecondary }]}>{recommendation.body}</Text>
                <Text style={[styles.recommendationCta, { color: colors.primary }]}>{recommendation.cta}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}

          {hasCompletedToday ? (
            <View style={styles.completedActions}>
              <TouchableOpacity
                style={[styles.completedActionButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/companion' as never)}
                activeOpacity={0.84}
                testID="today-talk-to-companion"
              >
                <MessageCircle size={16} color={Colors.white} />
                <Text style={styles.completedPrimaryActionText}>Talk to Companion</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.completedSecondaryButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                onPress={() => router.push('/(tabs)/insights' as never)}
                activeOpacity={0.84}
                testID="today-view-insights"
              >
                <Target size={16} color={colors.primary} />
                <Text style={[styles.completedSecondaryActionText, { color: colors.primary }]}>View Insights</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.completedSecondaryButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                onPress={handleEditCheckIn}
                activeOpacity={0.84}
                testID="today-edit-check-in"
              >
                <Edit3 size={16} color={colors.primary} />
                <Text style={[styles.completedSecondaryActionText, { color: colors.primary }]}>Edit check-in</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={styles.insightHeader}>
              <View style={styles.insightIcon}>
                <Heart size={18} color={Colors.brandTeal} />
              </View>
              <View style={styles.insightTextWrap}>
                <Text style={[styles.cardKicker, { color: colors.brandTeal }]}>Small insight</Text>
                <Text style={[styles.insightText, { color: colors.text }]}>{smallInsight}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.primaryCta, { backgroundColor: colors.primary }, highIntensity && styles.primaryCtaCalm]}
          onPress={handlePrimaryCta}
          activeOpacity={0.88}
          testID="today-primary-cta"
        >
          {highIntensity ? <Wind size={18} color={Colors.white} /> : <Target size={18} color={Colors.white} />}
          <Text style={styles.primaryCtaText}>
            {hasCompletedToday
              ? (highIntensity || recommendationEmotionIds.some(id => ['angry', 'triggered', 'rejected', 'abandoned', 'overwhelmed'].includes(id)) ? 'Talk to Companion' : 'View Insights')
              : savedNotice && !isEditingCheckIn
                ? 'View Insights'
              : 'Save check-in'}
          </Text>
          <ArrowRight size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <SpiralPausePrompt
        visible={spiralPauseVisible}
        config={spiralPauseConfig}
        onClose={dismissSpiralPause}
      />

      <Modal transparent animationType="fade" visible={showTutorial} onRequestClose={() => setShowTutorial(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.tutorialCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.tutorialTitle, { color: colors.text }]}>How BPD Companion helps</Text>
            {[
              'Today: save one quick emotional check-in',
              'Companion: talk through what happened',
              'Tools: calm down, pause, or reflect before reacting',
              'Insights: watch patterns become clearer',
              'Community: connect with peer support',
              'Profile: manage membership and settings',
            ].map((item, index) => (
              <View key={item} style={styles.tutorialStep}>
                <View style={[styles.tutorialStepNumber, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.tutorialStepNumberText, { color: colors.primary }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.tutorialStepText, { color: colors.textSecondary }]}>{item}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.tutorialButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                void markTodayTutorialSeen();
                setShowTutorial(false);
              }}
              testID="today-tutorial-got-it"
            >
              <Text style={styles.tutorialButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={!!achievement} onRequestClose={() => setAchievement(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.achievementCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.achievementKicker, { color: colors.brandTeal }]}>Quiet win</Text>
            <Text style={[styles.achievementTitle, { color: colors.text }]}>{achievement?.title}</Text>
            <Text style={[styles.achievementBody, { color: colors.textSecondary }]}>{achievement?.body}</Text>
            <TouchableOpacity
              style={[styles.tutorialButton, { backgroundColor: colors.primary }]}
              onPress={() => setAchievement(null)}
              testID="dismiss-achievement"
            >
              <Text style={styles.tutorialButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 116,
  },
  header: {
    marginBottom: 18,
    paddingTop: 6,
  },
  eyebrow: {
    color: Colors.brandTeal,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greeting: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
  },
  morningBriefCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
    marginBottom: 14,
  },
  morningBriefHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  morningBriefIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morningBriefTitleWrap: {
    flex: 1,
  },
  morningBriefTitle: {
    color: Colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  briefColumns: {
    gap: 9,
  },
  briefPanel: {
    borderRadius: 16,
    padding: 13,
  },
  briefPanelTitle: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 7,
  },
  briefLine: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginBottom: 4,
  },
  briefLineStrong: {
    color: Colors.text,
    fontWeight: '900',
  },
  spiralWarningCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
    marginBottom: 14,
  },
  spiralWarningHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  spiralWarningIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spiralWarningTextWrap: {
    flex: 1,
  },
  spiralWarningTitle: {
    color: Colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  spiralDismissButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spiralWarningBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 9,
  },
  spiralEvidence: {
    color: Colors.primary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  spiralActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  spiralActionButton: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  spiralActionButtonSecondary: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  spiralPrimaryActionText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  spiralSecondaryActionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  medicationDueCard: {
    minHeight: 86,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
    marginBottom: 14,
  },
  medicationDueIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationDueTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  medicationDueTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 3,
  },
  medicationDueBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  medicationTakenButton: {
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  medicationTakenText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  medicationLoggedPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  medicationLoggedText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '900',
  },
  appointmentCard: {
    minHeight: 86,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
    marginBottom: 14,
  },
  appointmentIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  appointmentTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 3,
  },
  appointmentBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  checkInCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
    marginBottom: 14,
  },
  completedCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
    marginBottom: 14,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  completedIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedHeaderText: {
    flex: 1,
  },
  completedDetails: {
    gap: 0,
  },
  completedDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  completedLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  completedValue: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
    textAlign: 'right',
  },
  completedActions: {
    gap: 10,
    marginBottom: 14,
  },
  completedActionButton: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completedSecondaryButton: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completedPrimaryActionText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  completedSecondaryActionText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardKicker: {
    color: Colors.brandTeal,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
  },
  intensityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  intensityValue: {
    color: Colors.primary,
    fontSize: 52,
    fontWeight: '900',
    width: 70,
    textAlign: 'center',
  },
  intensityCopy: {
    flex: 1,
  },
  intensityLabel: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 3,
  },
  intensityHint: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  scaleGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  scaleButton: {
    flex: 1,
    aspectRatio: 0.86,
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleButtonHigh: {
    borderColor: 'rgba(220, 38, 38, 0.28)',
  },
  scaleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scaleButtonText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  scaleButtonTextActive: {
    color: Colors.white,
  },
  inputLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 9,
  },
  optionalHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -5,
    marginBottom: 9,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.white,
  },
  triggerChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  triggerChipActive: {
    backgroundColor: Colors.brandTealSoft,
    borderColor: Colors.brandTeal,
  },
  triggerChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  triggerChipTextActive: {
    color: Colors.primary,
  },
  savedNotice: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
    marginTop: -2,
  },
  customEmotionInput: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
    marginTop: -4,
    marginBottom: 14,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 14,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationTextWrap: {
    flex: 1,
  },
  recommendationKicker: {
    color: Colors.brandTeal,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  recommendationTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },
  recommendationBody: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  recommendationCta: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
  },
  dontSendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 14,
  },
  dontSendIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dontSendTextWrap: {
    flex: 1,
  },
  dontSendTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },
  dontSendBody: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  insightCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 14,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTextWrap: {
    flex: 1,
  },
  insightText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  communityPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  communityPromptIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityPromptTextWrap: {
    flex: 1,
  },
  communityPromptTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },
  communityPromptBody: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(248, 251, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  primaryCta: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  primaryCtaCalm: {
    backgroundColor: Colors.brandTeal,
  },
  primaryCtaText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  bottomSpacer: {
    height: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 42, 67, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tutorialCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 22,
    gap: 14,
  },
  tutorialTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  tutorialStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tutorialStepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialStepNumberText: {
    fontSize: 13,
    fontWeight: '900',
  },
  tutorialStepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  tutorialButton: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  tutorialButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  achievementCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 24,
    padding: 22,
  },
  achievementKicker: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  achievementTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  achievementBody: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 14,
  },
});
