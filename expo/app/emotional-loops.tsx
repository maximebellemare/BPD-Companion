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
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useEmotionalLoops } from '@/hooks/useEmotionalLoops';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useLoopInterruptPlans } from '@/hooks/useLoopInterruptPlans';
import { EmotionalLoop, InterruptPoint, LoopNodeType } from '@/types/emotionalLoop';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText, localizedArray } from '@/lib/i18n/staticText';

const NODE_COLORS: Record<LoopNodeType, { bg: string; text: string; border: string }> = {
  trigger: { bg: '#FFFFFF', text: '#3B82F6', border: '#D9E2EC' },
  emotion: { bg: '#FFFFFF', text: '#3B82F6', border: '#2E2A72' },
  urge: { bg: '#FFFFFF', text: '#3B82F6', border: '#D9E2EC' },
  behavior: { bg: '#FFFFFF', text: '#3B82F6', border: '#3B82F6' },
  outcome: { bg: Colors.successLight, text: '#14B8A6', border: '#D9E2EC' },
  coping: { bg: Colors.primaryLight, text: Colors.primaryDark, border: '#14B8A6' },
};

const NODE_LABELS: Record<LoopNodeType, string> = {
  get trigger() { return localizedText('Trigger', 'Desencadenante'); },
  get emotion() { return localizedText('Emotion', 'Emoción'); },
  get urge() { return localizedText('Urge', 'Impulso'); },
  get behavior() { return localizedText('Behavior', 'Conducta'); },
  get outcome() { return localizedText('Outcome', 'Resultado'); },
  get coping() { return localizedText('Coping', 'Regulación'); },
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
  const { plans } = useLoopInterruptPlans();
  const { trackEvent } = useAnalytics();
  useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    trackEvent('emotional_loop_viewed');
    trackEvent('screen_view', { screen: 'emotional_loops' });
  }, [trackEvent]);

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

  const handleLoopPress = useCallback((loopId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/loop-detail?loopId=${loopId}` as never);
  }, [router]);

  const handleViewPlans = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/loop-interrupt-plan' as never);
  }, [router]);

  const hasData = report.totalPatternsDetected > 0;
  const favoritePlans = plans.filter(p => p.isFavorite);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Repeat size={20} color={Colors.accent} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{localizedText('Emotional Loops', 'Bucles emocionales')}</Text>
            <Text style={styles.headerSubtitle}>{localizedText('Patterns you can interrupt', 'Patrones que puedes interrumpir')}</Text>
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
                {localizedText(
                  'As you check in and use the app, emotional patterns will appear here. Keep going — awareness builds over time.',
                  'A medida que hagas check-ins y uses la app, tus patrones emocionales aparecerán aquí. Sigue avanzando: la conciencia se construye con el tiempo.',
                )}
              </Text>
            </View>
          )}
        </Animated.View>

        {(plans.length > 0 || hasData) && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TouchableOpacity
              style={styles.plansButton}
              onPress={handleViewPlans}
              activeOpacity={0.7}
              testID="view-interrupt-plans"
            >
              <View style={styles.plansIconWrap}>
                <Shield size={18} color={Colors.primary} />
              </View>
              <View style={styles.plansTextWrap}>
                <Text style={styles.plansTitle}>{localizedText('Interrupt Plans', 'Planes de interrupción')}</Text>
                <Text style={styles.plansSubtitle}>
                  {plans.length > 0
                    ? localizedText(
                      `${plans.length} plan${plans.length !== 1 ? 's' : ''} saved${favoritePlans.length > 0 ? ` · ${favoritePlans.length} favorite${favoritePlans.length !== 1 ? 's' : ''}` : ''}`,
                      `${plans.length} plan${plans.length === 1 ? '' : 'es'} guardado${plans.length === 1 ? '' : 's'}${favoritePlans.length > 0 ? ` · ${favoritePlans.length} favorito${favoritePlans.length === 1 ? '' : 's'}` : ''}`,
                    )
                    : localizedText('Create your first interrupt plan', 'Crea tu primer plan de interrupción')}
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {report.triggerChains.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <SectionHeader icon={<Zap size={16} color="#3B82F6" />} title={localizedText('Trigger Chains', 'Cadenas de desencadenantes')} color="#3B82F6" />
            {report.triggerChains.map(loop => (
              <LoopCard key={loop.id} loop={loop} onPress={handleLoopPress} />
            ))}
          </Animated.View>
        )}

        {report.emotionChains.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <SectionHeader icon={<Heart size={16} color="#3B82F6" />} title={localizedText('Emotion Chains', 'Cadenas emocionales')} color="#3B82F6" />
            {report.emotionChains.map(loop => (
              <LoopCard key={loop.id} loop={loop} onPress={handleLoopPress} />
            ))}
          </Animated.View>
        )}

        {report.behaviorChains.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <SectionHeader icon={<Repeat size={16} color="#3B82F6" />} title={localizedText('Behavior Chains', 'Cadenas de conducta')} color="#3B82F6" />
            {report.behaviorChains.map(loop => (
              <LoopCard key={loop.id} loop={loop} onPress={handleLoopPress} />
            ))}
          </Animated.View>
        )}

        {report.interruptPoints.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <SectionHeader icon={<Anchor size={16} color={Colors.primary} />} title={localizedText('Helpful Interrupt Points', 'Puntos útiles para interrumpir')} color={Colors.primary} />
            {report.interruptPoints.slice(0, 6).map(point => (
              <InterruptCard key={point.id} point={point} onAction={handleInterrupt} />
            ))}
          </Animated.View>
        )}

        {!hasData && (
          <Animated.View style={[styles.placeholderSection, { opacity: fadeAnim }]}>
            <PlaceholderLoop
              nodes={localizedArray(
                ['Communication uncertainty', 'Anxiety', 'Urge to text', 'Reassurance seeking'],
                ['Incertidumbre en la comunicación', 'Ansiedad', 'Impulso de escribir', 'Búsqueda de tranquilidad'],
              )}
              types={['trigger', 'emotion', 'urge', 'behavior']}
            />
            <Text style={styles.placeholderLabel}>{localizedText('Example pattern', 'Patrón de ejemplo')}</Text>
            <Text style={styles.placeholderDesc}>
              {localizedText(
                'When communication feels uncertain, anxiety often rises and the urge to send messages quickly appears.',
                'Cuando la comunicación se siente incierta, la ansiedad suele subir y aparece el impulso de enviar mensajes rápidamente.',
              )}
            </Text>

            <View style={styles.placeholderDivider} />

            <PlaceholderLoop
              nodes={localizedArray(['Conflict', 'Shame', 'Withdrawal'], ['Conflicto', 'Vergüenza', 'Retiro'])}
              types={['trigger', 'emotion', 'behavior']}
            />
            <Text style={styles.placeholderLabel}>{localizedText('Example pattern', 'Patrón de ejemplo')}</Text>
            <Text style={styles.placeholderDesc}>
              {localizedText(
                'Conflict may lead to shame, which often leads to pulling away. A grounding step before withdrawing may help.',
                'El conflicto puede llevar a la vergüenza, y la vergüenza a alejarte. Un paso de arraigo antes de retirarte puede ayudar.',
              )}
            </Text>

            <View style={styles.placeholderInterrupt}>
              <Text style={styles.placeholderInterruptTitle}>{localizedText('Interrupt suggestions', 'Sugerencias para interrumpir')}</Text>
              <View style={styles.interruptChips}>
                <View style={styles.interruptChip}>
                  <Timer size={14} color={Colors.primary} />
                  <Text style={styles.interruptChipLabel}>{localizedText('Pause', 'Pausa')}</Text>
                </View>
                <View style={styles.interruptChip}>
                  <Anchor size={14} color={Colors.primary} />
                  <Text style={styles.interruptChipLabel}>{localizedText('Grounding', 'Arraigo')}</Text>
                </View>
                <View style={styles.interruptChip}>
                  <Sparkles size={14} color={Colors.primary} />
                  <Text style={styles.interruptChipLabel}>{localizedText('Message rewrite', 'Reescribir mensaje')}</Text>
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

const LoopCard = React.memo(function LoopCard({ loop, onPress }: { loop: EmotionalLoop; onPress: (id: string) => void }) {
  return (
    <TouchableOpacity
      style={styles.loopCard}
      onPress={() => onPress(loop.id)}
      activeOpacity={0.7}
      testID={`loop-card-${loop.id}`}
    >
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
      <View style={styles.loopFooter}>
        <View style={styles.loopMeta}>
          <Text style={styles.loopMetaText}>
            {localizedText(
              `Seen ${loop.occurrences} time${loop.occurrences !== 1 ? 's' : ''}`,
              `Visto ${loop.occurrences} vez${loop.occurrences === 1 ? '' : 'es'}`,
            )}
          </Text>
          {loop.averageDistress > 0 && (
            <Text style={styles.loopMetaText}>{localizedText('Avg. intensity:', 'Intensidad prom.:')} {loop.averageDistress}/10</Text>
          )}
        </View>
        <View style={styles.detailHint}>
          <Text style={styles.detailHintText}>{localizedText('Details', 'Detalles')}</Text>
          <ChevronRight size={12} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
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
    marginBottom: 20,
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
    marginBottom: 20,
    alignItems: 'flex-start',
    gap: 12,
  },
  emptyText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  plansButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  plansIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plansTextWrap: {
    flex: 1,
  },
  plansTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  plansSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
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
  loopFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  loopMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  loopMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  detailHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailHintText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
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
