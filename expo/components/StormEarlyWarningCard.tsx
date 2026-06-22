import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import {
  CloudRain,
  CloudSun,
  Wind,
  Anchor,
  Sparkles,
  Clock,
  HeartHandshake,
  BookOpen,
  ChevronRight,
  X,
  Eye,
  Info,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  StormEarlyWarningResult,
  StormPhase,
  StormSupportOption,
  EarlyWarningSignal,
} from '@/services/prediction/stormPatternAnalyzer';

interface Props {
  warning: StormEarlyWarningResult;
}

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Wind,
  Anchor,
  Sparkles,
  Clock,
  HeartHandshake,
  BookOpen,
};

const PHASE_THEME: Record<StormPhase, { bg: string; border: string; accent: string; iconBg: string }> = {
  clear: { bg: Colors.primaryLight, border: '#D9E2EC', accent: Colors.primary, iconBg: '#14B8A614' },
  early_signs: { bg: '#FFFFFF', border: '#D9E2EC', accent: '#2E2A72', iconBg: '#2E2A7212' },
  building: { bg: '#FFFFFF', border: '#D9E2EC', accent: '#67E8F9', iconBg: '#67E8F912' },
  escalating: { bg: '#FFFFFF', border: '#D9E2EC', accent: '#3B82F6', iconBg: '#3B82F612' },
};

const PHASE_LABEL: Record<StormPhase, string> = {
  clear: 'All clear',
  early_signs: 'Early signs',
  building: 'Something building',
  escalating: 'Needs attention',
};

const SIGNAL_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  distress_escalation: CloudRain,
  abandonment_cluster: HeartHandshake,
  reassurance_loop: Clock,
  rewrite_frequency: BookOpen,
  emotional_volatility: Wind,
  relationship_tension: HeartHandshake,
  coping_decline: Anchor,
};

export default React.memo(function StormEarlyWarningCard({ warning }: Props) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  const { phase, signals, supportOptions, narrative, shouldShow } = warning;

  useEffect(() => {
    if (shouldShow && !dismissed) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      if (phase === 'building' || phase === 'escalating') {
        const shimmer = Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(shimmerAnim, {
              toValue: 0,
              duration: 3000,
              useNativeDriver: true,
            }),
          ])
        );
        shimmer.start();
        return () => shimmer.stop();
      }
    }
  }, [shouldShow, dismissed, phase, fadeAnim, shimmerAnim]);

  const handleCardPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDetail(true);
  }, []);

  const handleDismiss = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setDismissed(true));
  }, [fadeAnim]);

  const handleSupportPress = useCallback((option: StormSupportOption) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDetail(false);
    router.push(option.route as never);
  }, [router]);

  if (!shouldShow || dismissed) return null;

  const theme = PHASE_THEME[phase];
  const topOptions = supportOptions.slice(0, 3);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.06],
  });

  return (
    <>
      <Animated.View
        style={[styles.container, { opacity: fadeAnim }]}
        testID="storm-early-warning-card"
      >
        <Animated.View
          style={[
            styles.shimmerLayer,
            {
              backgroundColor: theme.accent,
              opacity: shimmerOpacity,
              borderRadius: 22,
            },
          ]}
        />
        <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.headerRow}
            onPress={handleCardPress}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.iconBg }]}>
              {phase === 'escalating' ? (
                <CloudRain size={20} color={theme.accent} />
              ) : (
                <Eye size={20} color={theme.accent} />
              )}
            </View>
            <View style={styles.headerText}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.accent }]}>
                  Emotional Weather
                </Text>
                <View style={[styles.phaseBadge, { backgroundColor: theme.accent + '16' }]}>
                  <Text style={[styles.phaseLabel, { color: theme.accent }]}>
                    {PHASE_LABEL[phase]}
                  </Text>
                </View>
              </View>
              {narrative && (
                <Text style={styles.narrative} numberOfLines={2}>{narrative}</Text>
              )}
            </View>
            <ChevronRight size={16} color={theme.accent} style={{ opacity: 0.5 }} />
          </TouchableOpacity>

          {topOptions.length > 0 && (
            <View style={styles.optionsRow}>
              {topOptions.map((option) => {
                const IconComp = ICON_MAP[option.icon] ?? Wind;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionChip, { backgroundColor: Colors.white }]}
                    onPress={() => handleSupportPress(option)}
                    activeOpacity={0.7}
                    testID={`ew-option-${option.type}`}
                  >
                    <View style={[styles.chipIcon, { backgroundColor: theme.iconBg }]}>
                      <IconComp size={14} color={theme.accent} />
                    </View>
                    <Text style={styles.chipLabel} numberOfLines={1}>{option.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={13} color={Colors.textMuted} />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowDetail(false)}
            >
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalIconCircle, { backgroundColor: theme.accent + '10' }]}>
              {phase === 'escalating' ? (
                <CloudRain size={34} color={theme.accent} />
              ) : phase === 'building' ? (
                <CloudSun size={34} color={theme.accent} />
              ) : (
                <Eye size={34} color={theme.accent} />
              )}
            </View>

            <Text style={styles.modalTitle}>Emotional Weather</Text>

            <View style={[styles.modalPhaseBadge, { backgroundColor: theme.accent + '12' }]}>
              <Text style={[styles.modalPhaseText, { color: theme.accent }]}>
                {PHASE_LABEL[phase]}
              </Text>
            </View>

            {narrative && (
              <Text style={styles.modalNarrative}>{narrative}</Text>
            )}

            {signals.length > 0 && (
              <View style={styles.signalsSection}>
                <Text style={styles.sectionTitle}>What we're noticing</Text>
                {signals.map((signal: EarlyWarningSignal) => {
                  const SignalIcon = SIGNAL_ICONS[signal.type] ?? Eye;
                  return (
                    <View
                      key={signal.id}
                      style={[styles.signalCard, { borderLeftColor: theme.accent }]}
                    >
                      <View style={styles.signalHeader}>
                        <View style={[styles.signalIconWrap, { backgroundColor: theme.iconBg }]}>
                          <SignalIcon size={14} color={theme.accent} />
                        </View>
                        <Text style={styles.signalLabel}>{signal.label}</Text>
                      </View>
                      <Text style={styles.signalNarrative}>{signal.narrative}</Text>
                      <View style={styles.signalStrength}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.strengthBar,
                              {
                                backgroundColor: i < Math.round(signal.weight)
                                  ? theme.accent
                                  : Colors.border,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {supportOptions.length > 0 && (
              <View style={styles.supportSection}>
                <Text style={styles.sectionTitle}>Things that might help</Text>
                {supportOptions.map((option) => {
                  const IconComp = ICON_MAP[option.icon] ?? Wind;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.supportRow}
                      onPress={() => handleSupportPress(option)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.supportIcon, { backgroundColor: theme.accent + '10' }]}>
                        <IconComp size={18} color={theme.accent} />
                      </View>
                      <View style={styles.supportText}>
                        <Text style={styles.supportTitle}>{option.title}</Text>
                        <Text style={styles.supportDesc}>{option.description}</Text>
                      </View>
                      <ChevronRight size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.reassurance}>
              <Info size={14} color={Colors.textMuted} />
              <Text style={styles.reassuranceText}>
                This is based on your recent patterns — a gentle observation, never a diagnosis. Noticing what's happening is already a form of self-care.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    position: 'relative',
  },
  shimmerLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  phaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  phaseLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  narrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 7,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  chipIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dismissBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  modalClose: {
    position: 'absolute',
    right: 20,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  modalPhaseBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 14,
  },
  modalPhaseText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  modalNarrative: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  signalsSection: {
    marginBottom: 24,
  },
  signalCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  signalIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  signalNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  signalStrength: {
    flexDirection: 'row',
    gap: 3,
  },
  strengthBar: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  supportSection: {
    marginBottom: 24,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  supportIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  supportDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  reassuranceText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
