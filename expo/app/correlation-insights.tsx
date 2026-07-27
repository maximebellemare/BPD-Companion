import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Link2,
  Sparkles,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Pill,
  Calendar,
  CheckSquare,
  MessageCircle,
  Shield,
  Clock,
  Sprout,
  Eye,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCorrelationInsights } from '@/hooks/useCorrelationInsights';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import {
  CorrelationInsight,
  CorrelationCategory,
  CorrelationStrength,
  WhatHelpsItem,
} from '@/types/correlationInsight';

const CATEGORY_CONFIG: Record<CorrelationCategory, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  label: string;
}> = {
  medication_mood: {
    icon: <Pill size={16} color="#2E2A72" />,
    color: '#2E2A72',
    bgColor: '#D9E2EC',
    get label() { return localizedText('Medication & Mood', 'Medicación y ánimo'); },
  },
  appointment_intensity: {
    icon: <Calendar size={16} color="#3B82F6" />,
    color: '#3B82F6',
    bgColor: '#FFFFFF',
    get label() { return localizedText('Appointments & Intensity', 'Citas e intensidad'); },
  },
  checkin_routine: {
    icon: <CheckSquare size={16} color="#14B8A6" />,
    color: '#14B8A6',
    bgColor: '#D9E2EC',
    get label() { return localizedText('Check-in Routine', 'Rutina de registros'); },
  },
  coping_distress: {
    icon: <Shield size={16} color="#14B8A6" />,
    color: '#14B8A6',
    bgColor: '#FFFFFF',
    get label() { return localizedText('Coping & Distress', 'Afrontamiento y malestar'); },
  },
  pause_regret: {
    icon: <MessageCircle size={16} color="#67E8F9" />,
    color: '#67E8F9',
    bgColor: '#D9E2EC',
    get label() { return localizedText('Pausing & Regret', 'Pausa y arrepentimiento'); },
  },
  movement_mood: {
    icon: <TrendingUp size={16} color="#14B8A6" />,
    color: '#14B8A6',
    bgColor: '#FFFFFF',
    get label() { return localizedText('Movement & Mood', 'Movimiento y ánimo'); },
  },
  relationship_outcome: {
    icon: <MessageCircle size={16} color="#3B82F6" />,
    color: '#3B82F6',
    bgColor: '#FFFFFF',
    get label() { return localizedText('Relationship Outcomes', 'Resultados relacionales'); },
  },
  time_pattern: {
    icon: <Clock size={16} color="#3B82F6" />,
    color: '#3B82F6',
    bgColor: '#D9E2EC',
    get label() { return localizedText('Time Patterns', 'Patrones de horario'); },
  },
  routine_stability: {
    icon: <Sprout size={16} color="#14B8A6" />,
    color: '#14B8A6',
    bgColor: '#D9E2EC',
    get label() { return localizedText('Routine & Stability', 'Rutina y estabilidad'); },
  },
};

const STRENGTH_CONFIG: Record<CorrelationStrength, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  strong: { get label() { return localizedText('Strong', 'Fuerte'); }, color: '#14B8A6', bgColor: '#FFFFFF' },
  moderate: { get label() { return localizedText('Moderate', 'Moderada'); }, color: '#67E8F9', bgColor: '#D9E2EC' },
  weak: { get label() { return localizedText('Emerging', 'Emergente'); }, color: '#3B82F6', bgColor: '#F7FAFC' },
};

function CorrelationCard({
  insight,
  index,
  onPress,
}: {
  insight: CorrelationInsight;
  index: number;
  onPress: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const config = CATEGORY_CONFIG[insight.category];
  const strengthConfig = STRENGTH_CONFIG[insight.strength];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay: index * 90,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        delay: index * 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const directionColor = insight.direction === 'positive'
    ? '#14B8A6'
    : insight.direction === 'negative'
      ? '#67E8F9'
      : Colors.textMuted;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.correlationCard}
        activeOpacity={0.7}
        onPress={onPress}
        testID={`correlation-card-${index}`}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.cardIcon, { backgroundColor: config.bgColor }]}>
            {config.icon}
          </View>
          <View style={styles.cardTopMeta}>
            <Text style={styles.cardCategoryLabel}>{config.label}</Text>
            <View style={styles.cardBadgeRow}>
              <View style={[styles.strengthBadge, { backgroundColor: strengthConfig.bgColor }]}>
                <Text style={[styles.strengthText, { color: strengthConfig.color }]}>
                  {strengthConfig.label}
                </Text>
              </View>
              {!insight.viewed && (
                <View style={styles.newDot} />
              )}
            </View>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </View>

        <Text style={styles.cardTitle}>{insight.title}</Text>
        <Text style={styles.cardNarrative} numberOfLines={3}>{insight.narrative}</Text>

        <View style={styles.cardSourceRow}>
          <View style={[styles.sourceDot, { backgroundColor: directionColor }]} />
          <Text style={styles.sourceText}>{insight.sourceA}</Text>
          <Link2 size={10} color={Colors.textMuted} />
          <Text style={styles.sourceText}>{insight.sourceB}</Text>
          <Text style={styles.dataPointsText}>{insight.dataPoints} {localizedText('data points', 'datos')}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CorrelationDetailSheet({
  insight,
  onClose,
}: {
  insight: CorrelationInsight;
  onClose: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const config = CATEGORY_CONFIG[insight.category];
  const strengthConfig = STRENGTH_CONFIG[insight.strength];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.detailOverlay, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.detailBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.detailSheet}>
        <View style={styles.detailHandle} />

        <View style={styles.detailTopRow}>
          <View style={[styles.detailIcon, { backgroundColor: config.bgColor }]}>
            {config.icon}
          </View>
          <View style={styles.detailTopMeta}>
            <Text style={styles.detailCategoryLabel}>{config.label}</Text>
            <View style={[styles.strengthBadge, { backgroundColor: strengthConfig.bgColor }]}>
              <Text style={[styles.strengthText, { color: strengthConfig.color }]}>
                {strengthConfig.label} {localizedText('correlation', 'correlación')}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.detailTitle}>{insight.title}</Text>
        <Text style={styles.detailNarrative}>{insight.narrative}</Text>

        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <Sparkles size={14} color={Colors.primary} />
            <Text style={styles.detailSectionLabel}>{localizedText('What this means', 'Qué significa')}</Text>
          </View>
          <Text style={styles.detailSectionText}>{insight.supportiveNote}</Text>
        </View>

        <View style={styles.detailMetaRow}>
          <View style={styles.detailMetaItem}>
            <Text style={styles.detailMetaValue}>{insight.dataPoints}</Text>
            <Text style={styles.detailMetaLabel}>{localizedText('Data points', 'Datos')}</Text>
          </View>
          <View style={styles.detailMetaDivider} />
          <View style={styles.detailMetaItem}>
            <Text style={styles.detailMetaValue}>{Math.round(insight.confidence * 100)}%</Text>
            <Text style={styles.detailMetaLabel}>{localizedText('Confidence', 'Confianza')}</Text>
          </View>
          <View style={styles.detailMetaDivider} />
          <View style={styles.detailMetaItem}>
            <Text style={[styles.detailMetaValue, { color: config.color }]}>{strengthConfig.label}</Text>
            <Text style={styles.detailMetaLabel}>{localizedText('Strength', 'Fuerza')}</Text>
          </View>
        </View>

        <View style={styles.detailSourcesSection}>
          <Text style={styles.detailSourcesLabel}>{localizedText('Connected data', 'Datos conectados')}</Text>
          <View style={styles.detailSourcesRow}>
            <View style={styles.detailSourceChip}>
              <Text style={styles.detailSourceChipText}>{insight.sourceA}</Text>
            </View>
            <Link2 size={12} color={Colors.textMuted} />
            <View style={styles.detailSourceChip}>
              <Text style={styles.detailSourceChipText}>{insight.sourceB}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.detailCloseBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.detailCloseBtnText}>{localizedText('Got it', 'Entendido')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function WhatHelpsSection({ items }: { items: WhatHelpsItem[] }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (items.length === 0) return null;

  return (
    <Animated.View style={[styles.whatHelpsCard, { opacity: fadeAnim }]}>
      <View style={styles.whatHelpsHeader}>
        <View style={styles.whatHelpsIconWrap}>
          <Sprout size={18} color="#14B8A6" />
        </View>
        <Text style={styles.whatHelpsTitle}>{localizedText('What seems to help', 'Lo que parece ayudar')}</Text>
      </View>
      {items.slice(0, 5).map((item, i) => {
        const strengthConfig = STRENGTH_CONFIG[item.strength];
        return (
          <View key={item.id} style={[styles.whatHelpsRow, i === items.length - 1 && styles.whatHelpsRowLast]}>
            <Text style={styles.whatHelpsEmoji}>{item.emoji}</Text>
            <View style={styles.whatHelpsContent}>
              <Text style={styles.whatHelpsLabel}>{item.label}</Text>
              <Text style={styles.whatHelpsDesc} numberOfLines={2}>{item.description}</Text>
            </View>
            <View style={[styles.whatHelpsDot, { backgroundColor: strengthConfig.color }]} />
          </View>
        );
      })}
    </Animated.View>
  );
}

function SummaryCards({ total, strong }: { total: number; strong: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.summaryRow, { opacity: fadeAnim }]}>
      <View style={styles.summaryItem}>
        <View style={[styles.summaryIconWrap, { backgroundColor: '#D9E2EC' }]}>
          <Link2 size={16} color="#3B82F6" />
        </View>
        <Text style={styles.summaryValue}>{total}</Text>
        <Text style={styles.summaryLabel}>{localizedText('Correlations', 'Correlaciones')}</Text>
      </View>
      <View style={styles.summaryItem}>
        <View style={[styles.summaryIconWrap, { backgroundColor: '#FFFFFF' }]}>
          <Eye size={16} color="#14B8A6" />
        </View>
        <Text style={styles.summaryValue}>{strong}</Text>
        <Text style={styles.summaryLabel}>{localizedText('Strong', 'Fuertes')}</Text>
      </View>
    </Animated.View>
  );
}

export default function CorrelationInsightsScreen() {
  useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    insights,
    summary,
    whatHelps,
    hasEnoughData,
    generateInsights,
    markViewed,
    isGenerating,
  } = useCorrelationInsights();
  const { trackEvent } = useAnalytics();

  const [selectedInsight, setSelectedInsight] = useState<CorrelationInsight | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'correlation_insights' });
  }, [trackEvent]);

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleInsightPress = useCallback((insight: CorrelationInsight) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!insight.viewed) {
      markViewed(insight.id);
    }
    setSelectedInsight(insight);
    trackEvent('correlation_detail_opened', {
      category: insight.category,
      strength: insight.strength,
    });
  }, [markViewed, trackEvent]);

  const handleRefresh = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    generateInsights();
  }, [generateInsights]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    generateInsights();
    setTimeout(() => setRefreshing(false), 1000);
  }, [generateInsights]);

  const hasInsights = insights.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          testID="correlation-insights-back"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{localizedText('Correlations', 'Correlaciones')}</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          style={styles.refreshButton}
          activeOpacity={0.7}
          testID="correlation-insights-refresh"
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <RefreshCw size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {!hasEnoughData ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Link2 size={40} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{localizedText('Correlations are building', 'Las correlaciones se están formando')}</Text>
            <Text style={styles.emptySubtitle}>
              {localizedText(
                'As you use the app, patterns will emerge between your daily actions and emotional outcomes. Keep checking in, logging medications, and using your tools.',
                'A medida que uses la app, aparecerán patrones entre tus acciones diarias y tus resultados emocionales. Sigue registrándote, anotando medicación y usando tus herramientas.',
              )}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/check-in')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>{localizedText('Start a Check-in', 'Iniciar registro')}</Text>
            </TouchableOpacity>
          </View>
        ) : hasInsights ? (
          <>
            <Text style={styles.sectionIntro}>
              {localizedText(
                'Connections between your daily habits and emotional patterns',
                'Conexiones entre tus hábitos diarios y tus patrones emocionales',
              )}
            </Text>

            <SummaryCards total={summary.totalCorrelations} strong={summary.strongCorrelations} />

            <WhatHelpsSection items={whatHelps} />

            <View style={styles.insightsSection}>
              <Text style={styles.insightsSectionTitle}>{localizedText('All correlations', 'Todas las correlaciones')}</Text>
              {insights.map((insight, i) => (
                <CorrelationCard
                  key={insight.id}
                  insight={insight}
                  index={i}
                  onPress={() => handleInsightPress(insight)}
                />
              ))}
            </View>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                {localizedText(
                  'These patterns are observations, not diagnoses. Words like "seems" and "tends to" reflect that correlation does not mean causation.',
                  'Estos patrones son observaciones, no diagnósticos. Palabras como “parece” y “tiende a” reflejan que correlación no significa causalidad.',
                )}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Link2 size={40} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{localizedText('No strong patterns yet', 'Aún no hay patrones fuertes')}</Text>
            <Text style={styles.emptySubtitle}>
              {localizedText(
                'Keep using the app — checking in, logging medications, and tracking appointments. Correlations will emerge as data accumulates.',
                'Sigue usando la app: registrándote, anotando medicación y dando seguimiento a citas. Las correlaciones aparecerán a medida que se acumulen datos.',
              )}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {selectedInsight && (
        <CorrelationDetailSheet
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionIntro: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  whatHelpsCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  whatHelpsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 16,
  },
  whatHelpsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  whatHelpsTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  whatHelpsRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  whatHelpsRowLast: {
    borderBottomWidth: 0,
  },
  whatHelpsEmoji: {
    fontSize: 20,
    marginTop: 1,
  },
  whatHelpsContent: {
    flex: 1,
  },
  whatHelpsLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  whatHelpsDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  whatHelpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightsSection: {
    marginBottom: 16,
  },
  insightsSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  correlationCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTopRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 12,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cardTopMeta: {
    flex: 1,
  },
  cardCategoryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginBottom: 3,
  },
  cardBadgeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  newDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accent,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  cardNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardSourceRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sourceText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  dataPointsText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginLeft: 'auto' as const,
  },
  detailOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end' as const,
    zIndex: 100,
  },
  detailBackdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
  },
  detailSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '85%' as const,
  },
  detailHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center' as const,
    marginBottom: 20,
  },
  detailTopRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  detailTopMeta: {
    flex: 1,
    gap: 4,
  },
  detailCategoryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  detailNarrative: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
    marginBottom: 20,
  },
  detailSection: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  detailSectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  detailSectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  detailSectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  detailMetaRow: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  detailMetaItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  detailMetaValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  detailMetaLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  detailMetaDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  detailSourcesSection: {
    marginBottom: 16,
  },
  detailSourcesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailSourcesRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  detailSourceChip: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailSourceChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  detailCloseBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  detailCloseBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  disclaimer: {
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 23,
    marginBottom: 28,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
