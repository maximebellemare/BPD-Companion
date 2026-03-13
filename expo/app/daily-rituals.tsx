import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Sun,
  Cloud,
  Moon,
  Flame,
  Check,
  Wind,
  Leaf,
  Clock,
  Calendar,
  Award,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { RitualType, RitualCompletion } from '@/types/ritual';
import { dailyRitualsRepository } from '@/services/repositories';
import {
  RITUAL_CONFIG,
  getTodayDateString,
  getCurrentRitualType,
  getTodayStatus,
  getWeeklyRitualData,
  getRecentReflections,
  getRitualStreakMessage,
  COPING_TOOLS,
} from '@/services/rituals/ritualService';

type ScreenMode = 'hub' | 'morning' | 'midday_breathe' | 'midday_ground' | 'evening' | 'complete';

export default function DailyRitualsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<ScreenMode>('hub');
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [intention, setIntention] = useState<string>('');
  const [keyMoment, setKeyMoment] = useState<string>('');
  const [selectedCoping, setSelectedCoping] = useState<string[]>([]);
  const [lessonLearned, setLessonLearned] = useState<string>('');
  const [breathCount, setBreathCount] = useState<number>(0);
  const [completedType, setCompletedType] = useState<RitualType | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;


  const ritualsQuery = useQuery({
    queryKey: ['daily_rituals'],
    queryFn: () => dailyRitualsRepository.getState(),
  });

  const completions = useMemo(() => ritualsQuery.data?.completions ?? [], [ritualsQuery.data]);
  const streak = useMemo(() => ritualsQuery.data?.streak ?? {
    currentStreak: 0, longestStreak: 0, lastRitualDate: '', totalCompletions: 0, weeklyCompletionRate: 0,
  }, [ritualsQuery.data]);

  const todayStatus = useMemo(() => getTodayStatus(completions), [completions]);
  const weekData = useMemo(() => getWeeklyRitualData(completions), [completions]);
  const recentReflections = useMemo(() => getRecentReflections(completions), [completions]);

  const saveMutation = useMutation({
    mutationFn: (completion: RitualCompletion) => dailyRitualsRepository.addCompletion(completion),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['daily_rituals'] });
    },
  });

  const animateTransition = useCallback((callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const startRitual = useCallback((type: RitualType) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    console.log('[DailyRituals] Starting ritual:', type);

    if (type === 'morning') {
      animateTransition(() => setMode('morning'));
    } else if (type === 'midday') {
      animateTransition(() => setMode('midday_breathe'));
    } else {
      animateTransition(() => setMode('evening'));
    }
  }, [animateTransition]);

  useEffect(() => {
    if (mode === 'midday_breathe') {
      setBreathCount(0);
      const breatheLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
          Animated.timing(breatheAnim, { toValue: 0, duration: 5000, useNativeDriver: true }),
        ])
      );
      breatheLoop.start();

      const interval = setInterval(() => {
        setBreathCount(prev => prev + 1);
      }, 9000);

      return () => {
        breatheLoop.stop();
        clearInterval(interval);
      };
    }
  }, [mode, breatheAnim]);

  const completeMorning = useCallback(() => {
    if (!selectedEmotion) return;
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const completion: RitualCompletion = {
      id: `ritual_m_${Date.now()}`,
      date: getTodayDateString(),
      timestamp: Date.now(),
      type: 'morning',
      emotion: selectedEmotion,
      energyLevel,
      intention,
    };
    saveMutation.mutate(completion);
    setCompletedType('morning');
    animateTransition(() => setMode('complete'));
  }, [selectedEmotion, energyLevel, intention, saveMutation, animateTransition]);

  const completeMidday = useCallback((tool: 'breathe' | 'ground') => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const completion: RitualCompletion = {
      id: `ritual_mid_${Date.now()}`,
      date: getTodayDateString(),
      timestamp: Date.now(),
      type: 'midday',
      breathingCompleted: tool === 'breathe',
      groundingCompleted: tool === 'ground',
    };
    saveMutation.mutate(completion);
    setCompletedType('midday');
    animateTransition(() => setMode('complete'));
  }, [saveMutation, animateTransition]);

  const completeEvening = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const completion: RitualCompletion = {
      id: `ritual_e_${Date.now()}`,
      date: getTodayDateString(),
      timestamp: Date.now(),
      type: 'evening',
      emotion: selectedEmotion ?? undefined,
      keyMoment,
      copingUsed: selectedCoping,
      lessonLearned,
    };
    saveMutation.mutate(completion);
    setCompletedType('evening');
    animateTransition(() => setMode('complete'));
  }, [selectedEmotion, keyMoment, selectedCoping, lessonLearned, saveMutation, animateTransition]);

  const resetAndGoHub = useCallback(() => {
    setSelectedEmotion(null);
    setEnergyLevel(5);
    setIntention('');
    setKeyMoment('');
    setSelectedCoping([]);
    setLessonLearned('');
    setBreathCount(0);
    animateTransition(() => setMode('hub'));
  }, [animateTransition]);

  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const breatheOpacity = breatheAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });

  const breatheLabel = breatheAnim.interpolate({
    inputRange: [0, 0.44, 0.45, 1],
    outputRange: [1, 1, 0, 0],
  });

  const exhaleLabel = breatheAnim.interpolate({
    inputRange: [0, 0.44, 0.45, 1],
    outputRange: [0, 0, 1, 1],
  });

  const getDayLabel = (dateStr: string): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date(dateStr + 'T12:00:00');
    return days[d.getDay()];
  };

  const renderHub = () => (
    <ScrollView contentContainerStyle={styles.hubContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Daily Rituals</Text>
        <Text style={styles.heroSubtitle}>Simple routines for emotional awareness</Text>
      </View>

      {streak.currentStreak > 0 && (
        <View style={styles.streakBanner}>
          <View style={styles.streakLeft}>
            <Flame size={22} color="#E17055" />
            <View>
              <Text style={styles.streakCount}>{streak.currentStreak} day streak</Text>
              <Text style={styles.streakMsg}>{getRitualStreakMessage(streak)}</Text>
            </View>
          </View>
          {streak.longestStreak > streak.currentStreak && (
            <View style={styles.bestBadge}>
              <Award size={12} color={Colors.primary} />
              <Text style={styles.bestText}>Best: {streak.longestStreak}</Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.sectionLabel}>TODAY'S RITUALS</Text>
      <View style={styles.ritualsGrid}>
        {(['morning', 'midday', 'evening'] as RitualType[]).map((type) => {
          const config = RITUAL_CONFIG[type];
          const completed = type === 'morning' ? todayStatus.morning : type === 'midday' ? todayStatus.midday : todayStatus.evening;
          const isCurrent = getCurrentRitualType() === type;
          const IconComponent = type === 'morning' ? Sun : type === 'midday' ? Cloud : Moon;

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.ritualCard,
                completed && styles.ritualCardCompleted,
                isCurrent && !completed && styles.ritualCardCurrent,
              ]}
              onPress={() => {
                if (!completed) startRitual(type);
              }}
              activeOpacity={completed ? 1 : 0.7}
              testID={`ritual-card-${type}`}
            >
              <View style={[styles.ritualIconWrap, { backgroundColor: completed ? `${config.color}20` : isCurrent ? `${config.color}15` : Colors.surface }]}>
                {completed ? (
                  <Check size={20} color={config.color} />
                ) : (
                  <IconComponent size={20} color={completed ? config.color : isCurrent ? config.color : Colors.textMuted} />
                )}
              </View>
              <Text style={[styles.ritualLabel, completed && { color: config.color }]}>{config.shortLabel}</Text>
              <Text style={styles.ritualDesc}>
                {completed ? 'Complete' : config.description}
              </Text>
              {isCurrent && !completed && (
                <View style={[styles.currentBadge, { backgroundColor: `${config.color}20` }]}>
                  <Clock size={10} color={config.color} />
                  <Text style={[styles.currentBadgeText, { color: config.color }]}>Now</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {todayStatus.completedCount === 3 && (
        <View style={styles.allCompleteCard}>
          <Text style={styles.allCompleteEmoji}>✨</Text>
          <Text style={styles.allCompleteTitle}>All rituals complete</Text>
          <Text style={styles.allCompleteDesc}>You showed up for yourself in every part of today.</Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>THIS WEEK</Text>
      <View style={styles.weekGrid}>
        {weekData.map((day) => {
          const isToday = day.date === getTodayDateString();
          return (
            <View key={day.date} style={[styles.weekDay, isToday && styles.weekDayToday]}>
              <Text style={[styles.weekDayLabel, isToday && styles.weekDayLabelToday]}>{getDayLabel(day.date)}</Text>
              <View style={styles.weekDots}>
                <View style={[styles.weekDot, day.morning && styles.weekDotFilled, day.morning && { backgroundColor: RITUAL_CONFIG.morning.color }]} />
                <View style={[styles.weekDot, day.midday && styles.weekDotFilled, day.midday && { backgroundColor: RITUAL_CONFIG.midday.color }]} />
                <View style={[styles.weekDot, day.evening && styles.weekDotFilled, day.evening && { backgroundColor: RITUAL_CONFIG.evening.color }]} />
              </View>
              {day.completedCount === 3 && <Text style={styles.weekCheckmark}>✓</Text>}
            </View>
          );
        })}
      </View>

      {streak.weeklyCompletionRate > 0 && (
        <View style={styles.completionRateCard}>
          <Calendar size={16} color={Colors.primary} />
          <Text style={styles.completionRateText}>
            {streak.weeklyCompletionRate}% weekly completion
          </Text>
          <View style={styles.completionBarBg}>
            <View style={[styles.completionBarFill, { width: `${streak.weeklyCompletionRate}%` }]} />
          </View>
        </View>
      )}

      {recentReflections.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>RECENT REFLECTIONS</Text>
          {recentReflections.map((ref) => (
            <View key={ref.id} style={styles.reflectionCard}>
              <View style={styles.reflectionHeader}>
                <Text style={styles.reflectionType}>
                  {RITUAL_CONFIG[ref.type].emoji} {RITUAL_CONFIG[ref.type].shortLabel}
                </Text>
                <Text style={styles.reflectionDate}>
                  {new Date(ref.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
              {ref.intention && (
                <View style={styles.reflectionRow}>
                  <Text style={styles.reflectionLabel}>Intention</Text>
                  <Text style={styles.reflectionValue}>{ref.intention}</Text>
                </View>
              )}
              {ref.keyMoment && (
                <View style={styles.reflectionRow}>
                  <Text style={styles.reflectionLabel}>Key moment</Text>
                  <Text style={styles.reflectionValue}>{ref.keyMoment}</Text>
                </View>
              )}
              {ref.lessonLearned && (
                <View style={styles.reflectionRow}>
                  <Text style={styles.reflectionLabel}>Lesson</Text>
                  <Text style={styles.reflectionValue}>{ref.lessonLearned}</Text>
                </View>
              )}
            </View>
          ))}
        </>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const renderMorning = () => (
    <ScrollView contentContainerStyle={styles.ritualContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.ritualTitle}>{RITUAL_CONFIG.morning.prompt}</Text>
      <Text style={styles.ritualSubtitle}>Start your day with gentle awareness</Text>

      <Text style={styles.fieldLabel}>How are you feeling?</Text>
      <View style={styles.emotionGrid}>
        {RITUAL_CONFIG.morning.emotions.map(e => {
          const isSelected = selectedEmotion === e.id;
          return (
            <TouchableOpacity
              key={e.id}
              style={[styles.emotionChip, isSelected && styles.emotionChipSelected]}
              onPress={() => {
                setSelectedEmotion(e.id);
                if (Platform.OS !== 'web') void Haptics.selectionAsync();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.emotionEmoji}>{e.emoji}</Text>
              <Text style={[styles.emotionLabel, isSelected && styles.emotionLabelSelected]}>{e.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>Energy level</Text>
      <View style={styles.energyContainer}>
        <Text style={styles.energyValue}>{energyLevel}</Text>
        <Text style={styles.energyDesc}>
          {energyLevel <= 2 ? 'Very low' : energyLevel <= 4 ? 'Low' : energyLevel <= 6 ? 'Moderate' : energyLevel <= 8 ? 'Good' : 'High energy'}
        </Text>
        <View style={styles.energyDots}>
          {Array.from({ length: 10 }, (_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                setEnergyLevel(i + 1);
                if (Platform.OS !== 'web') void Haptics.selectionAsync();
              }}
              style={[
                styles.energyDot,
                {
                  backgroundColor: i < energyLevel
                    ? (i < 3 ? '#F44336' : i < 5 ? '#FF9800' : i < 7 ? '#FFC107' : '#4CAF50')
                    : Colors.border,
                  transform: [{ scale: i + 1 === energyLevel ? 1.3 : 1 }],
                },
              ]}
            />
          ))}
        </View>
      </View>

      <Text style={styles.fieldLabel}>Set an intention for today</Text>
      <TextInput
        style={styles.textInputField}
        placeholder="What do you want to carry into today?"
        placeholderTextColor={Colors.textMuted}
        value={intention}
        onChangeText={setIntention}
      />
      <View style={styles.suggestionsWrap}>
        {RITUAL_CONFIG.morning.intentionSuggestions.map((sug, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.suggestionPill, intention === sug && styles.suggestionPillSelected]}
            onPress={() => {
              setIntention(sug);
              if (Platform.OS !== 'web') void Haptics.selectionAsync();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.suggestionPillText, intention === sug && styles.suggestionPillTextSelected]}>{sug}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderMiddayBreathe = () => (
    <View style={styles.middayContainer}>
      <Text style={styles.ritualTitle}>Take a moment to breathe</Text>
      <Text style={styles.ritualSubtitle}>A gentle reset for the middle of your day</Text>

      <View style={styles.breatheCircleWrap}>
        <Animated.View style={[styles.breatheCircle, { transform: [{ scale: breatheScale }], opacity: breatheOpacity }]}>
          <Wind size={36} color={Colors.white} />
        </Animated.View>
        <View style={styles.breatheLabelWrap}>
          <Animated.Text style={[styles.breatheLabel, { opacity: breatheLabel }]}>Breathe in...</Animated.Text>
          <Animated.Text style={[styles.breatheLabel, { opacity: exhaleLabel }]}>Breathe out...</Animated.Text>
        </View>
      </View>

      <Text style={styles.breatheCount}>{breathCount} breaths</Text>

      <View style={styles.middayActions}>
        <TouchableOpacity
          style={styles.middayFinishBtn}
          onPress={() => completeMidday('breathe')}
          activeOpacity={0.8}
          disabled={breathCount < 1}
        >
          <Check size={20} color={Colors.white} />
          <Text style={styles.middayFinishText}>I feel calmer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.middaySwitchBtn}
          onPress={() => animateTransition(() => setMode('midday_ground'))}
          activeOpacity={0.7}
        >
          <Leaf size={16} color={Colors.primary} />
          <Text style={styles.middaySwitchText}>Try grounding instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMiddayGround = () => (
    <View style={styles.middayContainer}>
      <Text style={styles.ritualTitle}>Grounding exercise</Text>
      <Text style={styles.ritualSubtitle}>Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste</Text>

      <View style={styles.groundingSteps}>
        {[
          { count: 5, sense: 'see', emoji: '👁️' },
          { count: 4, sense: 'touch', emoji: '✋' },
          { count: 3, sense: 'hear', emoji: '👂' },
          { count: 2, sense: 'smell', emoji: '👃' },
          { count: 1, sense: 'taste', emoji: '👅' },
        ].map((step) => (
          <View key={step.sense} style={styles.groundingStep}>
            <Text style={styles.groundingEmoji}>{step.emoji}</Text>
            <Text style={styles.groundingText}>{step.count} thing{step.count > 1 ? 's' : ''} you can {step.sense}</Text>
          </View>
        ))}
      </View>

      <View style={styles.middayActions}>
        <TouchableOpacity
          style={styles.middayFinishBtn}
          onPress={() => completeMidday('ground')}
          activeOpacity={0.8}
        >
          <Check size={20} color={Colors.white} />
          <Text style={styles.middayFinishText}>I feel more grounded</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.middaySwitchBtn}
          onPress={() => animateTransition(() => setMode('midday_breathe'))}
          activeOpacity={0.7}
        >
          <Wind size={16} color={Colors.primary} />
          <Text style={styles.middaySwitchText}>Try breathing instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEvening = () => (
    <ScrollView contentContainerStyle={styles.ritualContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.ritualTitle}>{RITUAL_CONFIG.evening.prompt}</Text>
      <Text style={styles.ritualSubtitle}>Close the day with gentle reflection</Text>

      <Text style={styles.fieldLabel}>How are you feeling now?</Text>
      <View style={styles.emotionGrid}>
        {RITUAL_CONFIG.evening.emotions.map(e => {
          const isSelected = selectedEmotion === e.id;
          return (
            <TouchableOpacity
              key={e.id}
              style={[styles.emotionChip, isSelected && styles.emotionChipSelected]}
              onPress={() => {
                setSelectedEmotion(e.id);
                if (Platform.OS !== 'web') void Haptics.selectionAsync();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.emotionEmoji}>{e.emoji}</Text>
              <Text style={[styles.emotionLabel, isSelected && styles.emotionLabelSelected]}>{e.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>What stood out emotionally today?</Text>
      <TextInput
        style={[styles.textInputField, { minHeight: 80 }]}
        placeholder="A moment, feeling, or interaction that stayed with you..."
        placeholderTextColor={Colors.textMuted}
        multiline
        value={keyMoment}
        onChangeText={setKeyMoment}
        textAlignVertical="top"
      />

      <Text style={styles.fieldLabel}>What helped today?</Text>
      <View style={styles.copingGrid}>
        {COPING_TOOLS.map(tool => {
          const isSelected = selectedCoping.includes(tool.id);
          return (
            <TouchableOpacity
              key={tool.id}
              style={[styles.copingChip, isSelected && styles.copingChipSelected]}
              onPress={() => {
                if (Platform.OS !== 'web') void Haptics.selectionAsync();
                setSelectedCoping(prev =>
                  isSelected ? prev.filter(c => c !== tool.id) : [...prev, tool.id]
                );
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.copingEmoji}>{tool.emoji}</Text>
              <Text style={[styles.copingLabel, isSelected && styles.copingLabelSelected]}>{tool.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>What did you learn about yourself?</Text>
      <TextInput
        style={styles.textInputField}
        placeholder="Optional — a small takeaway from today"
        placeholderTextColor={Colors.textMuted}
        value={lessonLearned}
        onChangeText={setLessonLearned}
      />
    </ScrollView>
  );

  const renderComplete = () => {
    const config = completedType ? RITUAL_CONFIG[completedType] : RITUAL_CONFIG.morning;
    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeEmoji}>{config.emoji}</Text>
        <Text style={styles.completeTitle}>{config.shortLabel} ritual complete</Text>
        <Text style={styles.completeSubtitle}>You showed up for yourself</Text>

        {streak.currentStreak > 0 && (
          <View style={styles.completeStreakBadge}>
            <Flame size={18} color="#E17055" />
            <Text style={styles.completeStreakText}>{streak.currentStreak + 1} day streak</Text>
          </View>
        )}

        <TouchableOpacity style={styles.completeBackBtn} onPress={resetAndGoHub} activeOpacity={0.8}>
          <Text style={styles.completeBackText}>Back to rituals</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.completeDoneBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.completeDoneText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getFooterAction = (): { label: string; onPress: () => void; disabled: boolean } | null => {
    switch (mode) {
      case 'morning':
        return { label: 'Complete Morning Check-In', onPress: completeMorning, disabled: !selectedEmotion };
      case 'evening':
        return { label: 'Complete Evening Reflection', onPress: completeEvening, disabled: false };
      default:
        return null;
    }
  };

  const footerAction = getFooterAction();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            if (mode === 'hub') {
              router.back();
            } else if (mode === 'complete') {
              resetAndGoHub();
            } else {
              animateTransition(() => setMode('hub'));
            }
          }}
          style={styles.closeButton}
        >
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {mode === 'hub' ? 'Daily Rituals' : mode === 'complete' ? '' : RITUAL_CONFIG[mode === 'midday_breathe' || mode === 'midday_ground' ? 'midday' : mode].label}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.View style={[styles.bodyWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {mode === 'hub' && renderHub()}
        {mode === 'morning' && renderMorning()}
        {mode === 'midday_breathe' && renderMiddayBreathe()}
        {mode === 'midday_ground' && renderMiddayGround()}
        {mode === 'evening' && renderEvening()}
        {mode === 'complete' && renderComplete()}
      </Animated.View>

      {footerAction && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity
            style={[styles.footerBtn, footerAction.disabled && styles.footerBtnDisabled]}
            onPress={footerAction.onPress}
            activeOpacity={0.8}
            disabled={footerAction.disabled}
          >
            <Check size={20} color={Colors.white} />
            <Text style={styles.footerBtnText}>{footerAction.label}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bodyWrap: {
    flex: 1,
  },
  hubContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  heroSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 22,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDE8E3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  streakCount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#E17055',
  },
  streakMsg: {
    fontSize: 12,
    color: '#C0392B',
    marginTop: 1,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  bestText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 4,
  },
  ritualsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  ritualCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  ritualCardCompleted: {
    borderColor: Colors.primaryLight,
    backgroundColor: '#F7FBF9',
  },
  ritualCardCurrent: {
    borderColor: '#E8A87C',
    backgroundColor: '#FFF8F3',
  },
  ritualIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  ritualDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  allCompleteCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  allCompleteEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  allCompleteTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  allCompleteDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  weekGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  weekDay: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  weekDayToday: {
    borderColor: Colors.primary,
    backgroundColor: '#F7FBF9',
  },
  weekDayLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
  },
  weekDayLabelToday: {
    color: Colors.primary,
  },
  weekDots: {
    flexDirection: 'row',
    gap: 3,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  weekDotFilled: {
    backgroundColor: Colors.primary,
  },
  weekCheckmark: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '700' as const,
  },
  completionRateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  completionRateText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  completionBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  completionBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  reflectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reflectionType: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reflectionDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  reflectionRow: {
    marginBottom: 8,
  },
  reflectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reflectionValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  ritualContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120,
  },
  ritualTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  ritualSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  emotionChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  emotionEmoji: {
    fontSize: 16,
  },
  emotionLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  emotionLabelSelected: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  energyContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  energyValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  energyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 20,
  },
  energyDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  energyDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  textInputField: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    lineHeight: 22,
    marginBottom: 12,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  suggestionPill: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionPillSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  suggestionPillText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  suggestionPillTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  middayContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breatheCircleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginTop: 24,
    marginBottom: 16,
  },
  breatheCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breatheLabelWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  breatheLabel: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    position: 'absolute',
  },
  breatheCount: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 32,
  },
  middayActions: {
    width: '100%',
    gap: 12,
    paddingHorizontal: 16,
  },
  middayFinishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    gap: 8,
  },
  middayFinishText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  middaySwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  middaySwitchText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  groundingSteps: {
    width: '100%',
    gap: 14,
    marginVertical: 32,
    paddingHorizontal: 16,
  },
  groundingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  groundingEmoji: {
    fontSize: 24,
  },
  groundingText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  copingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  copingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  copingChipSelected: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  copingEmoji: {
    fontSize: 14,
  },
  copingLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  copingLabelSelected: {
    color: '#8B6914',
    fontWeight: '600' as const,
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  completeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  completeStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE8E3',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    marginTop: 24,
  },
  completeStreakText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#E17055',
  },
  completeBackBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 32,
  },
  completeBackText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  completeDoneBtn: {
    paddingVertical: 12,
    marginTop: 8,
  },
  completeDoneText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    gap: 8,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  footerBtnDisabled: {
    opacity: 0.5,
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
