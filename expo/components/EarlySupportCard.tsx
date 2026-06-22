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
  HeartHandshake,
  Wind,
  Anchor,
  MessageCircleHeart,
  Clock,
  ChevronRight,
  X,
  Info,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  CrisisPredictionResult,
  CrisisRiskLevel,
  SupportAction,
  CrisisIndicator,
} from '@/services/prediction/crisisPredictionService';

interface Props {
  prediction: CrisisPredictionResult;
}

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Wind,
  Anchor,
  MessageCircleHeart,
  Clock,
};

const RISK_THEME: Record<CrisisRiskLevel, { bg: string; border: string; accent: string; glow: string }> = {
  low: { bg: Colors.primaryLight, border: '#D9E2EC', accent: Colors.primary, glow: '#14B8A620' },
  moderate: { bg: '#FFFFFF', border: '#D9E2EC', accent: '#67E8F9', glow: '#67E8F918' },
  high: { bg: '#FFFFFF', border: '#D9E2EC', accent: '#3B82F6', glow: '#3B82F615' },
};

export default React.memo(function EarlySupportCard({ prediction }: Props) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showDetail, setShowDetail] = useState<boolean>(false);

  const { riskLevel, indicators, actions, message } = prediction;

  useEffect(() => {
    if (riskLevel !== 'low' || indicators.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      if (riskLevel === 'high') {
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.04,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1800,
              useNativeDriver: true,
            }),
          ])
        );
        pulse.start();
        return () => pulse.stop();
      }
    }
  }, [riskLevel, indicators.length, fadeAnim, pulseAnim]);

  const handleActionPress = useCallback((action: SupportAction) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(action.route as never);
  }, [router]);

  const handleDetailOpen = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDetail(true);
  }, []);

  if (indicators.length === 0) return null;

  const theme = RISK_THEME[riskLevel];
  const topActions = actions.slice(0, 4);

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
        testID="early-support-card"
      >
        <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.headerRow}
            onPress={handleDetailOpen}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.accent + '15' }]}>
              <HeartHandshake size={20} color={theme.accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.accent }]}>Early Support</Text>
              {message && (
                <Text style={styles.message} numberOfLines={2}>{message}</Text>
              )}
            </View>
            <ChevronRight size={16} color={theme.accent} style={{ opacity: 0.5 }} />
          </TouchableOpacity>

          <View style={styles.actionsGrid}>
            {topActions.map((action) => {
              const IconComp = ICON_MAP[action.icon] ?? Wind;
              return (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.actionButton, { backgroundColor: Colors.white }]}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.7}
                  testID={`support-action-${action.type}`}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: theme.glow }]}>
                    <IconComp size={16} color={theme.accent} />
                  </View>
                  <Text style={styles.actionLabel} numberOfLines={1}>{action.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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
            <View style={[styles.modalIconCircle, { backgroundColor: theme.accent + '12' }]}>
              <HeartHandshake size={32} color={theme.accent} />
            </View>
            <Text style={styles.modalTitle}>Early Support</Text>
            {message && <Text style={styles.modalMessage}>{message}</Text>}

            {indicators.length > 0 && (
              <View style={styles.indicatorsSection}>
                <Text style={styles.sectionTitle}>What we're noticing</Text>
                {indicators.map((indicator: CrisisIndicator) => (
                  <View key={indicator.id} style={[styles.indicatorCard, { borderLeftColor: theme.accent }]}>
                    <Text style={styles.indicatorLabel}>{indicator.label}</Text>
                    <Text style={styles.indicatorDesc}>{indicator.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {actions.length > 0 && (
              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>Things that might help</Text>
                {actions.map((action) => {
                  const IconComp = ICON_MAP[action.icon] ?? Wind;
                  return (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.actionRow}
                      onPress={() => {
                        setShowDetail(false);
                        handleActionPress(action);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionRowIcon, { backgroundColor: theme.accent + '12' }]}>
                        <IconComp size={18} color={theme.accent} />
                      </View>
                      <View style={styles.actionRowText}>
                        <Text style={styles.actionRowTitle}>{action.title}</Text>
                        <Text style={styles.actionRowDesc}>{action.description}</Text>
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
                This is based on your recent patterns. It's a gentle suggestion, never a diagnosis. You're doing well by paying attention.
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
  },
  card: {
    borderRadius: 20,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
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
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  indicatorsSection: {
    marginBottom: 24,
  },
  indicatorCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  indicatorLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  indicatorDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionRow: {
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
  actionRowIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRowText: {
    flex: 1,
  },
  actionRowTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  actionRowDesc: {
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
