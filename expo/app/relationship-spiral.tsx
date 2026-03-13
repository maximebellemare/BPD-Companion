import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  HeartCrack,
  ChevronRight,
  Timer,
  Anchor,
  Zap,
  BookOpen,
  Sparkles,
  Wind,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Link2,
  PenLine,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRelationshipSpiral } from '@/hooks/useRelationshipSpiral';
import { useRelationshipGuard } from '@/hooks/useRelationshipGuard';
import { SpiralRiskLevel, SpiralIntervention, SpiralChain, SpiralSignal } from '@/types/relationshipPrediction';
import { RiskInterpretation } from '@/services/prediction/relationshipRiskInterpreter';
import {
  GuardAlertLevel,
  GuardIntervention,
  GuardSignalSummary,
  ResponseSimulation,
} from '@/types/relationshipSpiral';

const RISK_THEME: Record<SpiralRiskLevel, { bg: string; accent: string; label: string; icon: string }> = {
  calm: { bg: Colors.primaryLight, accent: Colors.primary, label: 'Calm', icon: '🌿' },
  watchful: { bg: '#FFF9F0', accent: '#C8975A', label: 'Watchful', icon: '👀' },
  rising: { bg: '#FFF5EE', accent: '#D4764E', label: 'Rising', icon: '🌊' },
  urgent: { bg: '#FFF0ED', accent: '#C94438', label: 'Needs Attention', icon: '⚡' },
};

const ALERT_THEME: Record<GuardAlertLevel, { bg: string; accent: string; label: string }> = {
  none: { bg: Colors.primaryLight, accent: Colors.primary, label: 'Clear' },
  gentle: { bg: '#F0F7F3', accent: '#6B9080', label: 'Gentle notice' },
  moderate: { bg: '#FFF9F0', accent: '#C8975A', label: 'Take care' },
  strong: { bg: '#FFF0ED', accent: '#D4764E', label: 'Slow down' },
};

const INTERVENTION_ICONS: Record<string, typeof Timer> = {
  Timer,
  Anchor,
  Zap,
  BookOpen,
  Sparkles,
  Wind,
  PenLine,
  Eye,
};

export default function RelationshipSpiralScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const spiral = useRelationshipSpiral();
  const guard = useRelationshipGuard();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [expandedSim, setExpandedSim] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'guard' | 'signals'>('guard');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleIntervention = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(route as never);
  }, [router]);

  const handleToggleSim = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedSim(prev => prev === id ? null : id);
  }, []);

  const theme = RISK_THEME[spiral.riskLevel];
  const alertTheme = ALERT_THEME[guard.alertLevel];
  const hasData = guard.signals.length > 0 || spiral.signals.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerHandle} />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={[styles.heroSection, { backgroundColor: alertTheme.bg }]}>
            <View style={[styles.heroIcon, { backgroundColor: alertTheme.accent + '14' }]}>
              <HeartCrack size={28} color={alertTheme.accent} />
            </View>
            <Text style={styles.heroTitle}>Relationship Spiral Guard</Text>
            <Text style={styles.heroSubtitle}>
              Detecting patterns that may lead to impulsive communication or emotional spirals
            </Text>

            <View style={[styles.alertIndicator, { backgroundColor: alertTheme.accent + '12' }]}>
              <View style={[styles.alertDot, { backgroundColor: alertTheme.accent }]} />
              <View style={styles.alertTextWrap}>
                <Text style={[styles.alertLabel, { color: alertTheme.accent }]}>
                  {alertTheme.label}
                </Text>
                <Text style={styles.alertMeta}>
                  {guard.signals.length > 0
                    ? `${guard.signals.length} signal${guard.signals.length !== 1 ? 's' : ''} detected`
                    : 'No active signals'}
                </Text>
              </View>
            </View>
          </View>

          {guard.primaryMessage && (
            <View style={styles.messageCard}>
              <ShieldCheck size={16} color={alertTheme.accent} />
              <Text style={styles.messageText}>{guard.primaryMessage}</Text>
            </View>
          )}

          {guard.supportNarrative && (
            <View style={styles.supportCard}>
              <Text style={styles.supportText}>{guard.supportNarrative}</Text>
            </View>
          )}

          {hasData && (
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'guard' && styles.tabActive]}
                onPress={() => setActiveTab('guard')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'guard' && styles.tabTextActive]}>
                  Guard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'signals' && styles.tabActive]}
                onPress={() => setActiveTab('signals')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'signals' && styles.tabTextActive]}>
                  Signals
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'guard' && (
            <>
              {guard.interventions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>What may help right now</Text>
                  {guard.interventions.slice(0, 4).map(intervention => (
                    <GuardInterventionCard
                      key={intervention.id}
                      intervention={intervention}
                      onPress={() => handleIntervention(intervention.route)}
                    />
                  ))}
                </View>
              )}

              {guard.simulations.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Eye size={16} color={Colors.textMuted} />
                    <Text style={styles.sectionTitle}>Response Simulations</Text>
                  </View>
                  <Text style={styles.sectionHint}>
                    See how different responses might feel and affect the relationship
                  </Text>
                  {guard.simulations.map(sim => (
                    <SimulationCard
                      key={sim.id}
                      simulation={sim}
                      expanded={expandedSim === sim.id}
                      onToggle={() => handleToggleSim(sim.id)}
                    />
                  ))}
                </View>
              )}

              {guard.signals.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <TrendingUp size={16} color={Colors.textMuted} />
                    <Text style={styles.sectionTitle}>Active Guard Signals</Text>
                  </View>
                  {guard.signals.map(signal => (
                    <GuardSignalCard
                      key={signal.id}
                      signal={signal}
                      accentColor={alertTheme.accent}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === 'signals' && (
            <>
              {spiral.interventions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Interventions</Text>
                  {spiral.interventions.map(intervention => (
                    <SpiralInterventionCard
                      key={intervention.id}
                      intervention={intervention}
                      onPress={() => handleIntervention(intervention.route)}
                    />
                  ))}
                </View>
              )}

              {spiral.signals.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <TrendingUp size={16} color={Colors.textMuted} />
                    <Text style={styles.sectionTitle}>Spiral Signals</Text>
                  </View>
                  {spiral.signals.map(signal => (
                    <SignalCard key={signal.id} signal={signal} accentColor={theme.accent} />
                  ))}
                </View>
              )}

              {spiral.chains.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Link2 size={16} color={Colors.textMuted} />
                    <Text style={styles.sectionTitle}>Common Spiral Chains</Text>
                  </View>
                  <Text style={styles.sectionHint}>
                    Patterns that tend to appear together in your data
                  </Text>
                  {spiral.chains.map(chain => (
                    <ChainCard key={chain.id} chain={chain} />
                  ))}
                </View>
              )}

              {spiral.interpretations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>What this means</Text>
                  {spiral.interpretations.map(interp => (
                    <InterpretationCard key={interp.id} interpretation={interp} />
                  ))}
                </View>
              )}
            </>
          )}

          {!hasData && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <ShieldCheck size={32} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No signals right now</Text>
              <Text style={styles.emptyDesc}>
                As you use the app more, this screen will detect relationship-triggered emotional patterns and help you intervene before spirals build.
              </Text>
            </View>
          )}

          <View style={styles.disclaimer}>
            <AlertTriangle size={13} color={Colors.textMuted} />
            <Text style={styles.disclaimerText}>
              This is based on your recent patterns and is not a diagnosis. These signals are designed to help you pause and reflect, not to judge your behavior.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function SimulationCard({
  simulation,
  expanded,
  onToggle,
}: {
  simulation: ResponseSimulation;
  expanded: boolean;
  onToggle: () => void;
}) {
  const animHeight = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animHeight, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expanded, animHeight]);

  return (
    <View style={[
      styles.simCard,
      simulation.isRecommended && styles.simCardRecommended,
    ]}>
      <TouchableOpacity
        style={styles.simHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.simEmoji}>{simulation.emoji}</Text>
        <View style={styles.simHeaderText}>
          <View style={styles.simLabelRow}>
            <Text style={[styles.simLabel, { color: simulation.color }]}>{simulation.label}</Text>
            {simulation.isRecommended && (
              <View style={[styles.recommendedBadge, { backgroundColor: simulation.color + '18' }]}>
                <Text style={[styles.recommendedText, { color: simulation.color }]}>recommended</Text>
              </View>
            )}
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={16} color={Colors.textMuted} />
        ) : (
          <ChevronDown size={16} color={Colors.textMuted} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.simBody}>
          <View style={styles.simMessageWrap}>
            <Text style={styles.simMessageLabel}>Example message</Text>
            <Text style={styles.simMessage}>"{simulation.exampleMessage}"</Text>
          </View>

          <View style={styles.simImpactRow}>
            <View style={styles.simImpactCard}>
              <Text style={styles.simImpactLabel}>Emotional impact</Text>
              <Text style={styles.simImpactText}>{simulation.emotionalImpact}</Text>
            </View>
            <View style={styles.simImpactCard}>
              <Text style={styles.simImpactLabel}>Relationship impact</Text>
              <Text style={styles.simImpactText}>{simulation.relationshipImpact}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function GuardInterventionCard({
  intervention,
  onPress,
}: {
  intervention: GuardIntervention;
  onPress: () => void;
}) {
  const IconComp = INTERVENTION_ICONS[intervention.icon] ?? Wind;

  return (
    <TouchableOpacity
      style={styles.interventionCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.interventionIconWrap}>
        <IconComp size={18} color={Colors.primary} />
      </View>
      <View style={styles.interventionContent}>
        <Text style={styles.interventionTitle}>{intervention.title}</Text>
        <Text style={styles.interventionDesc}>{intervention.description}</Text>
      </View>
      <ChevronRight size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function GuardSignalCard({
  signal,
  accentColor,
}: {
  signal: GuardSignalSummary;
  accentColor: string;
}) {
  return (
    <View style={styles.signalCard}>
      <View style={styles.signalHeader}>
        <View style={[styles.signalStrength, { backgroundColor: accentColor + '18' }]}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.strengthDot,
                { backgroundColor: i < signal.strength ? accentColor : accentColor + '25' },
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={styles.signalLabel}>{signal.title}</Text>
      <Text style={styles.signalDesc}>{signal.narrative}</Text>
      {signal.relatedTriggers.length > 0 && (
        <View style={styles.triggerRow}>
          {signal.relatedTriggers.slice(0, 3).map((trigger, i) => (
            <View key={i} style={styles.triggerChip}>
              <Text style={styles.triggerChipText}>{trigger}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function SpiralInterventionCard({ intervention, onPress }: { intervention: SpiralIntervention; onPress: () => void }) {
  const IconComp = INTERVENTION_ICONS[intervention.icon] ?? Wind;

  return (
    <TouchableOpacity
      style={styles.interventionCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.interventionIconWrap}>
        <IconComp size={18} color={Colors.primary} />
      </View>
      <View style={styles.interventionContent}>
        <Text style={styles.interventionTitle}>{intervention.title}</Text>
        <Text style={styles.interventionDesc}>{intervention.description}</Text>
      </View>
      <ChevronRight size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function SignalCard({ signal, accentColor }: { signal: SpiralSignal; accentColor: string }) {
  return (
    <View style={styles.signalCard}>
      <View style={styles.signalHeader}>
        <View style={[styles.signalStrength, { backgroundColor: accentColor + '18' }]}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.strengthDot,
                { backgroundColor: i < signal.strength ? accentColor : accentColor + '25' },
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={styles.signalLabel}>{signal.label}</Text>
      <Text style={styles.signalDesc}>{signal.description}</Text>
      {signal.relatedTriggers.length > 0 && (
        <View style={styles.triggerRow}>
          {signal.relatedTriggers.slice(0, 3).map((trigger, i) => (
            <View key={i} style={styles.triggerChip}>
              <Text style={styles.triggerChipText}>{trigger}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ChainCard({ chain }: { chain: SpiralChain }) {
  return (
    <View style={styles.chainCard}>
      <View style={styles.chainFlow}>
        <View style={styles.chainNode}>
          <Text style={styles.chainNodeLabel}>Trigger</Text>
          <Text style={styles.chainNodeValue}>{chain.trigger}</Text>
        </View>
        <ArrowRight size={14} color={Colors.textMuted} />
        <View style={styles.chainNode}>
          <Text style={styles.chainNodeLabel}>Emotion</Text>
          <Text style={styles.chainNodeValue}>{chain.emotion}</Text>
        </View>
        <ArrowRight size={14} color={Colors.textMuted} />
        <View style={styles.chainNode}>
          <Text style={styles.chainNodeLabel}>Urge</Text>
          <Text style={styles.chainNodeValue}>{chain.urge}</Text>
        </View>
      </View>
      <View style={styles.chainFooter}>
        <Text style={styles.chainFrequency}>
          {chain.frequencyThisWeek}x this week
        </Text>
        <View style={styles.chainHelpRow}>
          <Sparkles size={12} color={Colors.primary} />
          <Text style={styles.chainHelp}>{chain.whatHelps}</Text>
        </View>
      </View>
    </View>
  );
}

function InterpretationCard({ interpretation }: { interpretation: RiskInterpretation }) {
  const accentColor = interpretation.tone === 'gentle'
    ? Colors.accent
    : interpretation.tone === 'encouraging'
      ? Colors.success
      : Colors.primary;

  return (
    <View style={styles.interpretationCard}>
      <View style={[styles.interpretationAccent, { backgroundColor: accentColor }]} />
      <View style={styles.interpretationContent}>
        <Text style={styles.interpretationHeadline}>{interpretation.headline}</Text>
        <Text style={styles.interpretationBody}>{interpretation.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 20,
  },
  headerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    borderRadius: 24,
    padding: 24,
    marginTop: 12,
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  alertIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    alignSelf: 'stretch',
  },
  alertDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  alertMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  supportCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  supportText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginTop: 24,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: '600' as const,
  },
  section: {
    marginTop: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: -8,
    marginBottom: 14,
    lineHeight: 18,
  },
  interventionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  interventionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interventionContent: {
    flex: 1,
  },
  interventionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  interventionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  simCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  simCardRecommended: {
    borderColor: Colors.primary + '40',
    borderWidth: 1.5,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  simEmoji: {
    fontSize: 22,
  },
  simHeaderText: {
    flex: 1,
  },
  simLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  recommendedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  simBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 14,
  },
  simMessageWrap: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  simMessageLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  simMessage: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  simImpactRow: {
    gap: 10,
  },
  simImpactCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  simImpactLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  simImpactText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  signalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  signalStrength: {
    flexDirection: 'row',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  strengthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  signalLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  signalDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  triggerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  triggerChip: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  triggerChipText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  chainCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chainFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  chainNode: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  chainNodeLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  chainNodeValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  chainFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  chainFrequency: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.accent,
    marginBottom: 6,
  },
  chainHelpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  chainHelp: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  interpretationCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    position: 'relative',
    overflow: 'hidden',
  },
  interpretationAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  interpretationContent: {
    flex: 1,
  },
  interpretationHeadline: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  interpretationBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
