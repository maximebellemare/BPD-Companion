import React, { useRef, useEffect, useCallback } from 'react';
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
  ChevronRight,
  Repeat,
  Zap,
  Heart,
  ArrowRight,
  Timer,
  Anchor,
  Wind,
  BookOpen,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useEmotionalLoops } from '@/hooks/useEmotionalLoops';
import { EmotionalLoop, InterruptPoint, LoopNodeType } from '@/types/emotionalLoop';

const NODE_COLORS: Record<LoopNodeType, { bg: string; text: string; border: string }> = {
  trigger: { bg: '#FFF0ED', text: '#C94438', border: '#F5C4BE' },
  emotion: { bg: '#EDE9FE', text: '#7C3AED', border: '#C4B5FD' },
  urge: { bg: '#FFF7ED', text: '#C8762A', border: '#FCD9B6' },
  behavior: { bg: '#E0F2FE', text: '#0369A1', border: '#93C5FD' },
  outcome: { bg: Colors.successLight, text: '#047857', border: '#A7F3D0' },
  coping: { bg: Colors.primaryLight, text: Colors.primaryDark, border: '#A7D5C3' },
};

const NODE_LABELS: Record<LoopNodeType, string> = {
  trigger: 'Trigger',
  emotion: 'Emotion',
  urge: 'Urge',
  behavior: 'Behavior',
  outcome: 'Outcome',
  coping: 'Coping',
};

const INTERVENTION_ICONS: Record<string, typeof Timer> = {
  Timer,
  Anchor,
  Wind,
  BookOpen,
  Sparkles,
};

export default function EmotionalLoopsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const report = useEmotionalLoops();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

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

  const handleInterrupt = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(route as never);
  }, [router]);

  const hasData = report.totalPatternsDetected > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Repeat size={20} color={Colors.accent} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Emotional Loops</Text>
            <Text style={styles.headerSubtitle}>Patterns you can interrupt</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID="close-loops"
        >
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {hasData ? (
            <View style={styles.insightBanner}>
              <View style={styles.insightIconWrap}>
                <TrendingUp size={18} color={Colors.white} />
              </View>
              <Text style={styles.insightText}>{report.topInsight}</Text>
            </View>
          ) : (
            <View style={styles.emptyBanner}>
              <AlertCircle size={20} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                As you check in and use the app, emotional patterns will appear here. Keep going — awareness builds over time.
              </Text>
            </View>
          )}
        </Animated.View>

        {report.triggerChains.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <SectionHeader icon={<Zap size={16} color="#C94438" />} title="Trigger Chains" color="#C94438" />
            {report.triggerChains.map(loop => (
              <LoopCard key={loop.id} loop={loop} />
            ))}
          </Animated.View>
        )}

        {report.emotionChains.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <SectionHeader icon={<Heart size={16} color="#7C3AED" />} title="Emotion Chains" color="#7C3AED" />
            {report.emotionChains.map(loop => (
              <LoopCard key={loop.id} loop={loop} />
            ))}
          </Animated.View>
        )}

        {report.behaviorChains.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <SectionHeader icon={<Repeat size={16} color="#0369A1" />} title="Behavior Chains" color="#0369A1" />
            {report.behaviorChains.map(loop => (
              <LoopCard key={loop.id} loop={loop} />
            ))}
          </Animated.View>
        )}

        {report.interruptPoints.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <SectionHeader icon={<Anchor size={16} color={Colors.primary} />} title="Helpful Interrupt Points" color={Colors.primary} />
            {report.interruptPoints.slice(0, 6).map(point => (
              <InterruptCard key={point.id} point={point} onAction={handleInterrupt} />
            ))}
          </Animated.View>
        )}

        {!hasData && (
          <Animated.View style={[styles.placeholderSection, { opacity: fadeAnim }]}>
            <PlaceholderLoop
              nodes={['Communication uncertainty', 'Anxiety', 'Urge to text', 'Reassurance seeking']}
              types={['trigger', 'emotion', 'urge', 'behavior']}
            />
            <Text style={styles.placeholderLabel}>Example pattern</Text>
            <Text style={styles.placeholderDesc}>
              When communication feels uncertain, anxiety often rises and the urge to send messages quickly appears.
            </Text>

            <View style={styles.placeholderDivider} />

            <PlaceholderLoop
              nodes={['Conflict', 'Shame', 'Withdrawal']}
              types={['trigger', 'emotion', 'behavior']}
            />
            <Text style={styles.placeholderLabel}>Example pattern</Text>
            <Text style={styles.placeholderDesc}>
              Conflict may lead to shame, which often leads to pulling away. A grounding step before withdrawing may help.
            </Text>

            <View style={styles.placeholderInterrupt}>
              <Text style={styles.placeholderInterruptTitle}>Interrupt suggestions</Text>
              <View style={styles.interruptChips}>
                <View style={styles.interruptChip}>
                  <Timer size={14} color={Colors.primary} />
                  <Text style={styles.interruptChipLabel}>Pause</Text>
                </View>
                <View style={styles.interruptChip}>
                  <Anchor size={14} color={Colors.primary} />
                  <Text style={styles.interruptChipLabel}>Grounding</Text>
                </View>
                <View style={styles.interruptChip}>
                  <Sparkles size={14} color={Colors.primary} />
                  <Text style={styles.interruptChipLabel}>Message rewrite</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SectionHeader({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const LoopCard = React.memo(function LoopCard({ loop }: { loop: EmotionalLoop }) {
  return (
    <View style={styles.loopCard}>
      <View style={styles.chainRow}>
        {loop.nodes.map((node, idx) => {
          const colors = NODE_COLORS[node.type];
          return (
            <React.Fragment key={node.id}>
              {idx > 0 && (
                <View style={styles.arrowWrap}>
                  <ArrowRight size={14} color={Colors.textMuted} />
                </View>
              )}
              <View style={[styles.nodeChip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Text style={[styles.nodeType, { color: colors.text }]}>{NODE_LABELS[node.type]}</Text>
                <Text style={[styles.nodeLabel, { color: colors.text }]} numberOfLines={1}>{node.label}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
      {loop.narrative ? (
        <Text style={styles.narrativeText}>{loop.narrative}</Text>
      ) : null}
      <View style={styles.loopMeta}>
        <Text style={styles.loopMetaText}>Seen {loop.occurrences} time{loop.occurrences !== 1 ? 's' : ''}</Text>
        {loop.averageDistress > 0 && (
          <Text style={styles.loopMetaText}>Avg. intensity: {loop.averageDistress}/10</Text>
        )}
      </View>
    </View>
  );
});

const InterruptCard = React.memo(function InterruptCard({
  point,
  onAction,
}: {
  point: InterruptPoint;
  onAction: (route: string) => void;
}) {
  return (
    <View style={styles.interruptCard}>
      <Text style={styles.interruptNarrative}>{point.narrative}</Text>
      <View style={styles.interruptActions}>
        {point.suggestions.map(s => {
          const IconComp = INTERVENTION_ICONS[s.icon] ?? Sparkles;
          return (
            <TouchableOpacity
              key={s.id}
              style={styles.interruptAction}
              onPress={() => onAction(s.route)}
              activeOpacity={0.7}
            >
              <View style={styles.interruptActionIcon}>
                <IconComp size={16} color={Colors.primary} />
              </View>
              <View style={styles.interruptActionText}>
                <Text style={styles.interruptActionLabel}>{s.label}</Text>
                <Text style={styles.interruptActionDesc} numberOfLines={1}>{s.description}</Text>
              </View>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

function PlaceholderLoop({ nodes, types }: { nodes: string[]; types: LoopNodeType[] }) {
  return (
    <View style={styles.chainRow}>
      {nodes.map((label, idx) => {
        const nodeType = types[idx] ?? 'emotion';
        const colors = NODE_COLORS[nodeType];
        return (
          <React.Fragment key={label}>
            {idx > 0 && (
              <View style={styles.arrowWrap}>
                <ArrowRight size={14} color={Colors.textMuted} />
              </View>
            )}
            <View style={[styles.nodeChip, { backgroundColor: colors.bg, borderColor: colors.border, opacity: 0.7 }]}>
              <Text style={[styles.nodeType, { color: colors.text }]}>{NODE_LABELS[nodeType]}</Text>
              <Text style={[styles.nodeLabel, { color: colors.text }]} numberOfLines={1}>{label}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  insightBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'flex-start',
    gap: 12,
  },
  insightIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.white,
    lineHeight: 21,
  },
  emptyBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'flex-start',
    gap: 12,
  },
  emptyText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionDot: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  loopCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  chainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  arrowWrap: {
    paddingHorizontal: 2,
  },
  nodeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  nodeType: {
    fontSize: 9,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  nodeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 1,
    maxWidth: 100,
  },
  narrativeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginTop: 4,
    fontStyle: 'italic',
  },
  loopMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  loopMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  interruptCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  interruptNarrative: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 12,
  },
  interruptActions: {
    gap: 8,
  },
  interruptAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  interruptActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interruptActionText: {
    flex: 1,
  },
  interruptActionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  interruptActionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  placeholderSection: {
    marginTop: 8,
  },
  placeholderLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 4,
  },
  placeholderDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  placeholderDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 20,
  },
  placeholderInterrupt: {
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  placeholderInterruptTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  interruptChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interruptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  interruptChipLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
});
