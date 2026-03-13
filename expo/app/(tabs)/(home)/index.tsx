import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Heart, Wind, Sparkles, BarChart3, ChevronRight, Zap } from 'lucide-react-native';
import EmotionalTrendsCard from '@/components/EmotionalTrendsCard';
import EarlyWarningBanner from '@/components/EarlyWarningBanner';
import DailyReflectionCard from '@/components/DailyReflectionCard';
import SmartCopingCard from '@/components/SmartCopingCard';
import EarlySupportCard from '@/components/EarlySupportCard';
import AICompanionHomeCard from '@/components/AICompanionHomeCard';
import HomeInsightsPreview from '@/components/HomeInsightsPreview';
import EmotionalStormCard from '@/components/EmotionalStormCard';
import { useEarlyWarning } from '@/hooks/useEarlyWarning';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useCrisisPrediction } from '@/hooks/useCrisisPrediction';
import { useEmotionalStorm } from '@/hooks/useEmotionalStorm';
import { useQuery } from '@tanstack/react-query';
import { ritualRepository } from '@/services/repositories';
import { getTodayEntry, getWeeklyReflection } from '@/services/ritual/dailyCheckInService';
import { computeRitualAnalytics } from '@/services/ritual/dailyRitualService';
import WeeklyRitualSummary from '@/components/WeeklyRitualSummary';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { VALIDATION_MESSAGES } from '@/constants/data';
import { useApp } from '@/providers/AppProvider';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import BehavioralCoachingCard from '@/components/BehavioralCoachingCard';
import RelationshipSpiralCard from '@/components/RelationshipSpiralCard';
import { useCoaching } from '@/hooks/useCoaching';
import { useRelationshipSpiral } from '@/hooks/useRelationshipSpiral';
import WeeklyReflectionCard from '@/components/WeeklyReflectionCard';
import { generateWeeklyReflection } from '@/services/reflection/weeklyReflectionService';
import EmotionalLoopsCard from '@/components/EmotionalLoopsCard';
import { useEmotionalLoops } from '@/hooks/useEmotionalLoops';
import CrisisModeCard from '@/components/CrisisModeCard';
import { useCrisisDetection } from '@/hooks/useCrisisDetection';
import RelationshipCopilotCard from '@/components/RelationshipCopilotCard';
import { useRelationshipCopilot } from '@/hooks/useRelationshipCopilot';
import TherapistReportCard from '@/components/TherapistReportCard';
import { generateTherapyReport } from '@/services/therapy/therapyReportService';
import IdentityBuilderCard from '@/components/IdentityBuilderCard';
import ProgressDashboardCard from '@/components/ProgressDashboardCard';
import MessageGuardCard from '@/components/MessageGuardCard';
import StormEarlyWarningCard from '@/components/StormEarlyWarningCard';
import { useStormEarlyWarning } from '@/hooks/useStormEarlyWarning';
import ReflectionMirrorCard from '@/components/ReflectionMirrorCard';
import { generateReflectionMirror } from '@/services/reflection/reflectionMirrorService';
import EmotionalProfileCard from '@/components/EmotionalProfileCard';
import EmotionalTimelineCard from '@/components/EmotionalTimelineCard';
import { buildEpisodeReplayState } from '@/services/timeline/emotionalEpisodeService';
import RelationshipGuardBanner from '@/components/RelationshipGuardBanner';
import { useRelationshipGuard } from '@/hooks/useRelationshipGuard';
import RelationshipHubCard from '@/components/RelationshipHubCard';
import PersonalizedSuggestionsCard from '@/components/PersonalizedSuggestionsCard';
import JourneyFlowBanner from '@/components/JourneyFlowBanner';
import { useEmotionalContext } from '@/providers/EmotionalContextProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import ConflictReplayCard from '@/components/ConflictReplayCard';
import { useConflictReplay } from '@/hooks/useConflictReplay';
import EmotionalInsightsCard from '@/components/EmotionalInsightsCard';
import SafetyPredictorCard from '@/components/SafetyPredictorCard';
import { useEmotionalSafety } from '@/hooks/useEmotionalSafety';
import BreakthroughCard from '@/components/BreakthroughCard';
import { useBreakthroughs } from '@/hooks/useBreakthroughs';
import DailyRitualsCard from '@/components/DailyRitualsCard';
import { dailyRitualsRepository } from '@/services/repositories';
import TrustedSupportCard from '@/components/TrustedSupportCard';

interface CardSlot {
  key: string;
  priority: number;
  render: () => React.ReactNode;
}

const MAX_CARDS_BY_ZONE: Record<string, number> = {
  crisis: 4,
  relationship_distress: 6,
  activated: 6,
  recovering: 8,
  calm: 10,
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { journalEntries, messageDrafts } = useApp();
  const { zone, getCardPriority, isCardVisible } = useEmotionalContext();
  const [showAllCards, setShowAllCards] = useState<boolean>(false);
  const earlyWarning = useEarlyWarning();
  const { recommendations, topRecommendation } = useRecommendations();
  const crisisPrediction = useCrisisPrediction();
  const emotionalStorm = useEmotionalStorm();
  const { dailyCoaching } = useCoaching();
  const relationshipSpiral = useRelationshipSpiral();
  const emotionalLoops = useEmotionalLoops();
  const crisisDetection = useCrisisDetection();
  const { recentRelationshipDistress, lastSession } = useRelationshipCopilot();
  const stormWarning = useStormEarlyWarning();
  const relationshipGuard = useRelationshipGuard();
  const { trackEvent } = useAnalytics();
  const conflictReplay = useConflictReplay();
  const safetyPrediction = useEmotionalSafety();
  const breakthroughs = useBreakthroughs();

  const dailyRitualsQuery = useQuery({
    queryKey: ['daily_rituals'],
    queryFn: () => dailyRitualsRepository.getState(),
  });
  const dailyRitualCompletions = useMemo(() => dailyRitualsQuery.data?.completions ?? [], [dailyRitualsQuery.data]);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'home' });
  }, [trackEvent]);

  const weeklyReflection = useMemo(
    () => generateWeeklyReflection(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const episodeReplayState = useMemo(
    () => buildEpisodeReplayState(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const reflectionMirror = useMemo(
    () => generateReflectionMirror(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const therapyReport = useMemo(
    () => generateTherapyReport(journalEntries, messageDrafts, 7),
    [journalEntries, messageDrafts],
  );

  const ritualQuery = useQuery({
    queryKey: ['ritual'],
    queryFn: () => ritualRepository.getState(),
  });

  const ritualEntries = useMemo(() => ritualQuery.data?.entries ?? [], [ritualQuery.data?.entries]);
  const ritualStreak = ritualQuery.data?.streak ?? { currentStreak: 0, longestStreak: 0, lastCheckInDate: '', totalCheckIns: 0 };
  const todayRitualEntry = getTodayEntry(ritualEntries);
  const weeklySummary = getWeeklyReflection(ritualEntries);
  const ritualAnalytics = useMemo(() => computeRitualAnalytics(ritualEntries), [ritualEntries]);
  const [validationIndex, setValidationIndex] = useState<number>(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const validationFade = useRef(new Animated.Value(1)).current;
  const buttonGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    );
    breatheLoop.start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlow, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlow, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    return () => {
      breatheLoop.stop();
      glowLoop.stop();
    };
  }, [breatheAnim, fadeAnim, buttonGlow]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(validationFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setValidationIndex(prev => (prev + 1) % VALIDATION_MESSAGES.length);
        Animated.timing(validationFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [validationFade]);

  const handleTriggered = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    router.push('/check-in');
  }, [pulseAnim, router]);

  const handleSafetyMode = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    router.push('/safety-mode');
  }, [router]);

  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const breatheOpacity = breatheAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  const glowOpacity = buttonGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  const recentCount = journalEntries.filter(
    e => Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1000
  ).length;

  const zoneSubtitle = useMemo(() => {
    switch (zone) {
      case 'crisis': return "Let's get through this together.";
      case 'relationship_distress': return "Relationship stress detected. Support is here.";
      case 'activated': return "You seem activated. Take a breath.";
      case 'recovering': return "You're doing the work. That matters.";
      default: return "You're here. That matters.";
    }
  }, [zone]);

  const cardSlots = useMemo<CardSlot[]>(() => {
    const slots: CardSlot[] = [];

    const addSlot = (key: string, render: () => React.ReactNode) => {
      if (isCardVisible(key)) {
        slots.push({ key, priority: getCardPriority(key), render });
      }
    };

    addSlot('journey_flow', () => (
      <JourneyFlowBanner key="journey_flow" />
    ));

    addSlot('crisis_mode', () => (
      <CrisisModeCard key="crisis_mode" detection={crisisDetection} />
    ));

    addSlot('relationship_guard', () => (
      <RelationshipGuardBanner
        key="relationship_guard"
        alertLevel={relationshipGuard.alertLevel}
        primaryMessage={relationshipGuard.primaryMessage}
        supportNarrative={relationshipGuard.supportNarrative}
        signals={relationshipGuard.signals}
        interventions={relationshipGuard.interventions}
        shouldShowGuard={relationshipGuard.shouldShowGuard}
      />
    ));

    addSlot('relationship_copilot', () => (
      <RelationshipCopilotCard
        key="relationship_copilot"
        shouldShow={recentRelationshipDistress.shouldShowCopilot}
        relationshipTriggerCount={recentRelationshipDistress.relationshipTriggerCount}
        recentDraftCount={recentRelationshipDistress.recentDraftCount}
        lastSessionLabel={lastSession ? 'recent' : null}
      />
    ));

    addSlot('relationship_spiral', () => (
      <RelationshipSpiralCard
        key="relationship_spiral"
        riskLevel={relationshipSpiral.riskLevel}
        message={relationshipSpiral.message}
        supportMessage={relationshipSpiral.supportMessage}
        signals={relationshipSpiral.signals}
        interventions={relationshipSpiral.interventions}
        score={relationshipSpiral.score}
      />
    ));

    addSlot('message_guard', () => (
      <MessageGuardCard key="message_guard" recentDraftCount={messageDrafts.length} />
    ));

    addSlot('personalized_suggestions', () => (
      <PersonalizedSuggestionsCard key="personalized_suggestions" />
    ));

    addSlot('ai_companion', () => (
      <AICompanionHomeCard key="ai_companion" />
    ));

    if (dailyCoaching) {
      addSlot('coaching', () => (
        <BehavioralCoachingCard key="coaching" coaching={dailyCoaching} />
      ));
    }

    addSlot('home_insights', () => (
      <HomeInsightsPreview key="home_insights" />
    ));

    addSlot('progress_dashboard', () => (
      <ProgressDashboardCard key="progress_dashboard" />
    ));

    addSlot('weekly_reflection', () => (
      <WeeklyReflectionCard
        key="weekly_reflection"
        weekLabel={weeklyReflection.weekLabel}
        hasEnoughData={weeklyReflection.hasEnoughData}
        openingNarrative={weeklyReflection.openingNarrative}
        improvementCount={weeklyReflection.growthSignals.improvements.length}
      />
    ));

    addSlot('therapy_report', () => (
      <TherapistReportCard
        key="therapy_report"
        checkInCount={therapyReport.checkInCount}
        hasEnoughData={therapyReport.hasEnoughData}
        overviewNarrative={therapyReport.overviewNarrative}
        discussionPromptCount={therapyReport.discussionPrompts.length}
      />
    ));

    addSlot('emotional_loops', () => (
      <EmotionalLoopsCard key="emotional_loops" report={emotionalLoops} />
    ));

    addSlot('relationship_hub', () => (
      <RelationshipHubCard key="relationship_hub" />
    ));

    addSlot('conflict_replay', () => (
      <ConflictReplayCard
        key="conflict_replay"
        eventCount={conflictReplay.events.length}
        latestTrigger={conflictReplay.events[0]?.triggerDetail}
        latestOutcome={conflictReplay.events[0]?.outcome}
      />
    ));

    addSlot('safety_predictor', () => (
      <SafetyPredictorCard key="safety_predictor" prediction={safetyPrediction} />
    ));

    addSlot('breakthrough_moments', () => (
      <BreakthroughCard key="breakthrough_moments" summary={breakthroughs.summary} />
    ));

    addSlot('emotional_insights', () => (
      <EmotionalInsightsCard key="emotional_insights" />
    ));

    addSlot('emotional_profile', () => (
      <EmotionalProfileCard key="emotional_profile" />
    ));

    addSlot('reflection_mirror', () => (
      <ReflectionMirrorCard
        key="reflection_mirror"
        hasEnoughData={reflectionMirror.hasEnoughData}
        topTheme={reflectionMirror.emotionalThemes[0]?.label ?? null}
        growthCount={reflectionMirror.growthSignals.length}
      />
    ));

    addSlot('emotional_timeline', () => (
      <EmotionalTimelineCard key="emotional_timeline" replayState={episodeReplayState} />
    ));

    addSlot('identity_builder', () => (
      <IdentityBuilderCard key="identity_builder" />
    ));

    addSlot('storm_warning', () => (
      <StormEarlyWarningCard key="storm_warning" warning={stormWarning} />
    ));

    addSlot('emotional_storm', () => (
      <EmotionalStormCard key="emotional_storm" storm={emotionalStorm} />
    ));

    addSlot('early_support', () => (
      <EarlySupportCard key="early_support" prediction={crisisPrediction} />
    ));

    addSlot('early_warning', () => (
      <EarlyWarningBanner
        key="early_warning"
        warningLevel={earlyWarning.warningLevel}
        message={earlyWarning.message}
        patterns={earlyWarning.patterns}
        suggestions={earlyWarning.suggestions}
      />
    ));

    addSlot('emotional_trends', () => (
      <EmotionalTrendsCard
        key="emotional_trends"
        trend={earlyWarning.emotionalTrend}
        warningLevel={earlyWarning.warningLevel}
        onPress={() => router.push('/insights')}
      />
    ));

    addSlot('smart_coping', () => (
      <SmartCopingCard
        key="smart_coping"
        recommendations={recommendations}
        topRecommendation={topRecommendation}
      />
    ));

    addSlot('daily_rituals', () => (
      <DailyRitualsCard
        key="daily_rituals"
        completions={dailyRitualCompletions}
        onPress={() => router.push('/daily-rituals')}
      />
    ));

    addSlot('trusted_support', () => (
      <TrustedSupportCard key="trusted_support" variant="home" />
    ));

    addSlot('upgrade_prompt', () => (
      <UpgradePromptCard key="upgrade_prompt" />
    ));

    return slots.sort((a, b) => a.priority - b.priority);
  }, [
    isCardVisible, getCardPriority, crisisDetection, relationshipGuard,
    recentRelationshipDistress, lastSession, relationshipSpiral, messageDrafts,
    dailyCoaching, weeklyReflection, therapyReport, emotionalLoops,
    reflectionMirror, episodeReplayState, stormWarning, emotionalStorm,
    crisisPrediction, earlyWarning, recommendations, topRecommendation, router,
    conflictReplay, safetyPrediction, breakthroughs.summary, dailyRitualCompletions,
  ]);

  const maxCards = MAX_CARDS_BY_ZONE[zone] ?? 10;
  const visibleCardSlots = useMemo(() => {
    if (showAllCards) return cardSlots;
    return cardSlots.slice(0, maxCards);
  }, [cardSlots, showAllCards, maxCards]);

  const hasHiddenCards = cardSlots.length > maxCards && !showAllCards;

  const handleShowMore = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowAllCards(true);
    trackEvent('home_show_more_tapped', { zone, hidden_count: cardSlots.length - maxCards });
  }, [zone, cardSlots.length, maxCards, trackEvent]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.greeting}>BPD Companion</Text>
          <Text style={styles.subtitle}>{zoneSubtitle}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <DailyReflectionCard
            todayEntry={todayRitualEntry}
            streak={ritualStreak}
            weeklySummary={weeklySummary}
            onPress={() => router.push('/daily-ritual')}
          />
        </Animated.View>

        <Animated.View style={[styles.validationCard, { opacity: fadeAnim }]}>
          <Animated.Text style={[styles.validationText, { opacity: validationFade }]}>
            {VALIDATION_MESSAGES[validationIndex]}
          </Animated.Text>
        </Animated.View>

        <View style={styles.mainButtonContainer}>
          <Animated.View
            style={[
              styles.breatheRing,
              {
                transform: [{ scale: breatheScale }],
                opacity: breatheOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.glowRing,
              { opacity: glowOpacity },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.triggeredButton}
              onPress={handleTriggered}
              activeOpacity={0.85}
              testID="triggered-button"
            >
              <Heart size={28} color={Colors.white} fill={Colors.white} />
              <Text style={styles.triggeredText}>I'm triggered{'\n'}right now</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Text style={styles.mainButtonHint}>
          Tap to start a guided check-in
        </Text>

        <Animated.View style={[styles.regulationBanner, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.regulationButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              router.push('/guided-regulation');
            }}
            activeOpacity={0.7}
            testID="guided-regulation-button"
          >
            <View style={styles.regulationIconWrap}>
              <Zap size={20} color="#D4956A" />
            </View>
            <View style={styles.regulationTextWrap}>
              <Text style={styles.regulationTitle}>Guided Regulation</Text>
              <Text style={styles.regulationDesc}>Step-by-step calming when distress is high</Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.quickActions, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={handleSafetyMode}
            activeOpacity={0.7}
            testID="safety-mode-button"
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.dangerLight }]}>
              <Shield size={20} color={Colors.danger} />
            </View>
            <Text style={styles.quickActionLabel}>Safety Mode</Text>
            <Text style={styles.quickActionDesc}>High distress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/exercise?id=c1')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.primaryLight }]}>
              <Wind size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Breathe</Text>
            <Text style={styles.quickActionDesc}>Quick calm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/exercise?id=c5')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.accentLight }]}>
              <Sparkles size={20} color={Colors.accent} />
            </View>
            <Text style={styles.quickActionLabel}>Reality Check</Text>
            <Text style={styles.quickActionDesc}>Check facts</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <WeeklyRitualSummary
            analytics={ritualAnalytics}
            onPress={() => router.push('/daily-ritual')}
          />
        </Animated.View>

        {visibleCardSlots.map(slot => (
          <Animated.View key={slot.key} style={{ opacity: fadeAnim }}>
            {slot.render()}
          </Animated.View>
        ))}

        {hasHiddenCards && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={handleShowMore}
              activeOpacity={0.7}
              testID="show-more-cards"
            >
              <Text style={styles.showMoreText}>
                Show {cardSlots.length - maxCards} more tool{cardSlots.length - maxCards !== 1 ? 's' : ''}
              </Text>
              <ChevronRight size={14} color={Colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {recentCount > 0 && (
          <Animated.View style={[styles.insightCard, { opacity: fadeAnim }]}>
            <Text style={styles.insightTitle}>This week</Text>
            <Text style={styles.insightValue}>{recentCount} check-in{recentCount !== 1 ? 's' : ''}</Text>
            <Text style={styles.insightDesc}>
              Every check-in is an act of self-awareness.
            </Text>
          </Animated.View>
        )}

        <Animated.View style={[{ opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.insightsBanner}
            onPress={() => router.push('/insights')}
            activeOpacity={0.7}
            testID="insights-button"
          >
            <View style={styles.insightsBannerLeft}>
              <View style={styles.insightsBannerIcon}>
                <BarChart3 size={20} color={Colors.white} />
              </View>
              <View style={styles.insightsBannerText}>
                <Text style={styles.insightsBannerTitle}>Your Insights</Text>
                <Text style={styles.insightsBannerDesc}>See your emotional patterns</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.white} style={{ opacity: 0.7 }} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    marginTop: 16,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  validationCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  validationText: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '500' as const,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mainButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    height: 200,
  },
  breatheRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary,
  },
  triggeredButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  triggeredText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  mainButtonHint: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: -16,
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  quickActionDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  insightValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginTop: 4,
  },
  insightDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  insightsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },
  insightsBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightsBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  insightsBannerText: {
    flex: 1,
  },
  insightsBannerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 2,
  },
  insightsBannerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  regulationBanner: {
    marginBottom: 4,
  },
  regulationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  regulationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  regulationTextWrap: {
    flex: 1,
  },
  regulationTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  regulationDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  showMoreButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
