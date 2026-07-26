import React, { useCallback, useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Eye,
  MessageSquareText,
  PauseCircle,
  PenLine,
  Pill,
  Search,
  Shield,
  Sparkles,
  Users,
  Wind,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { trackEvent, trackToolUsage } from '@/services/analytics/analyticsService';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';

type HighlightTarget = 'calm' | 'pause' | 'trigger' | 'reflect';

type MainTool = {
  id: HighlightTarget;
  title: string;
  description: string;
  route: string;
  actionLabel: string;
  icon: React.ReactNode;
};

type LibraryTool = {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ReactNode;
};

function normalizeHighlight(value: string | string[] | undefined): HighlightTarget | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  if (raw === 'high-intensity' || raw === 'grounding' || raw === 'calm') return 'calm';
  if (raw === 'texting' || raw === 'reacting' || raw === 'pause') return 'pause';
  if (raw === 'trigger') return 'trigger';
  if (raw === 'reflect') return 'reflect';
  return null;
}

export default function ToolsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useTranslation('tools');
  const params = useLocalSearchParams<{ highlight?: string; source?: string }>();
  const highlight = normalizeHighlight(params.highlight ?? params.source);

  const mainTools = useMemo<MainTool[]>(() => [
    {
      id: 'calm',
      title: t('calmTitle'),
      description: t('calmDescription'),
      route: '/grounding-mode',
      actionLabel: t('calmAction'),
      icon: <Wind size={22} color={colors.brandTeal} />,
    },
    {
      id: 'pause',
      title: t('pauseTitle'),
      description: t('pauseDescription'),
      route: '/dont-send-it',
      actionLabel: t('pauseAction'),
      icon: <PauseCircle size={22} color={colors.accent} />,
    },
    {
      id: 'trigger',
      title: t('triggerTitle'),
      description: t('triggerDescription'),
      route: '/understand-trigger',
      actionLabel: t('triggerAction'),
      icon: <Brain size={22} color={colors.primary} />,
    },
    {
      id: 'reflect',
      title: t('reflectTitle'),
      description: t('reflectDescription'),
      route: '/reflect-and-learn',
      actionLabel: t('reflectAction'),
      icon: <BookOpen size={22} color={colors.brandTeal} />,
    },
  ], [colors, t]);

  const libraryTools = useMemo<LibraryTool[]>(() => [
    {
      id: 'bpd-academy',
      title: t('secondary.library.bpdAcademy.title'),
      description: t('secondary.library.bpdAcademy.description'),
      route: '/bpd-academy',
      icon: <GraduationCap size={18} color={colors.primary} />,
    },
    {
      id: 'relationship-simulator',
      title: t('secondary.library.relationshipSimulator.title'),
      description: t('secondary.library.relationshipSimulator.description'),
      route: '/relationship-simulator',
      icon: <Users size={18} color={colors.primary} />,
    },
    {
      id: 'rewrite-message',
      title: t('secondary.library.rewriteMessage.title'),
      description: t('secondary.library.rewriteMessage.description'),
      route: '/rewrite-the-message',
      icon: <MessageSquareText size={18} color={colors.brandTeal} />,
    },
    {
      id: 'spot-distortion',
      title: t('secondary.library.spotDistortion.title'),
      description: t('secondary.library.spotDistortion.description'),
      route: '/spot-the-distortion',
      icon: <Eye size={18} color={colors.primary} />,
    },
    {
      id: 'emotional-detective',
      title: t('secondary.library.emotionalDetective.title'),
      description: t('secondary.library.emotionalDetective.description'),
      route: '/emotional-detective',
      icon: <Search size={18} color={colors.accent} />,
    },
    {
      id: 'dbt',
      title: t('secondary.library.dbt.title'),
      description: t('secondary.library.dbt.description'),
      route: '/tools/dbt-coach',
      icon: <Shield size={18} color={colors.primary} />,
    },
    {
      id: 'grounding',
      title: t('secondary.library.grounding.title'),
      description: t('secondary.library.grounding.description'),
      route: '/grounding-mode',
      icon: <Wind size={18} color={colors.brandTeal} />,
    },
    {
      id: 'cbt-thought-record',
      title: t('secondary.library.cbtThoughtRecord.title'),
      description: t('secondary.library.cbtThoughtRecord.description'),
      route: '/cbt-thought-record',
      icon: <PenLine size={18} color={colors.accent} />,
    },
  ], [colors, t]);

  const medicationsTitle = t('secondary.medications.title');
  const medicationsDescription = t('secondary.medications.description');
  const appointmentsTitle = t('secondary.appointments.title');
  const appointmentsDescription = t('secondary.appointments.description');
  const communityTitle = t('secondary.community.title');
  const communityDescription = t('secondary.community.description');

  const handleNav = useCallback((route: string, source: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    void trackToolUsage('used', { tool_name: route, source });
    router.push(route as never);
  }, [router]);

  React.useEffect(() => {
    void trackEvent('screen_view', { screen: 'tools' });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('homeTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('homeSubtitle')}
          </Text>
        </View>

        <View style={styles.mainGrid}>
          {mainTools.map((tool) => {
            const isHighlighted = highlight === tool.id;
            return (
              <TouchableOpacity
                key={tool.id}
                style={[
                  styles.mainCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isHighlighted ? colors.brandTeal : colors.borderLight,
                    shadowColor: colors.shadow,
                  },
                  isHighlighted && styles.mainCardHighlighted,
                ]}
                onPress={() => handleNav(tool.route, `tools_${tool.id}`)}
                activeOpacity={0.82}
                testID={`tools-main-${tool.id}`}
              >
                <View style={styles.mainCardTop}>
                  <View style={[styles.mainIconWrap, { backgroundColor: colors.surface }]}>
                    {tool.icon}
                  </View>
                  {isHighlighted && (
                    <View style={[styles.recommendedPill, { backgroundColor: colors.brandTealSoft }]}>
                      <Sparkles size={12} color={colors.brandTeal} />
                      <Text style={[styles.recommendedText, { color: colors.brandTeal }]}>{t('suggested')}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.mainTitle, { color: colors.text }]}>{tool.title}</Text>
                <Text style={[styles.mainDescription, { color: colors.textSecondary }]}>{tool.description}</Text>
                <View style={styles.mainActionRow}>
                  <Text style={[styles.mainActionText, { color: colors.primary }]}>{tool.actionLabel}</Text>
                  <ArrowRight size={15} color={colors.primary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.moreSupportHeader}>
          <Text style={[styles.libraryTitle, { color: colors.text }]}>{t('moreSupport')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.communityCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
          onPress={() => handleNav('/medications' as never, 'tools_medications')}
          activeOpacity={0.8}
          testID="tools-medications-card"
          accessibilityRole="button"
          accessibilityLabel={`${medicationsTitle}. ${medicationsDescription}`}
        >
          <View style={[styles.communityIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Pill size={22} color={colors.primary} />
          </View>
          <View style={styles.communityTextWrap}>
            <Text style={[styles.communityTitle, { color: colors.text }]}>{medicationsTitle}</Text>
            <Text style={[styles.communityBody, { color: colors.textSecondary }]}>
              {medicationsDescription}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.communityCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
          onPress={() => handleNav('/appointments' as never, 'tools_appointments')}
          activeOpacity={0.8}
          testID="tools-appointments-card"
          accessibilityRole="button"
          accessibilityLabel={`${appointmentsTitle}. ${appointmentsDescription}`}
        >
          <View style={[styles.communityIconWrap, { backgroundColor: colors.brandTealSoft }]}>
            <Calendar size={22} color={colors.brandTeal} />
          </View>
          <View style={styles.communityTextWrap}>
            <Text style={[styles.communityTitle, { color: colors.text }]}>{appointmentsTitle}</Text>
            <Text style={[styles.communityBody, { color: colors.textSecondary }]}>
              {appointmentsDescription}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.communityCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
          onPress={() => handleNav('/community' as never, 'tools_community')}
          activeOpacity={0.8}
          testID="tools-community-card"
          accessibilityRole="button"
          accessibilityLabel={`${communityTitle}. ${communityDescription}`}
        >
          <View style={[styles.communityIconWrap, { backgroundColor: colors.brandTealSoft }]}>
            <HeartHandshake size={22} color={colors.brandTeal} />
          </View>
          <View style={styles.communityTextWrap}>
            <Text style={[styles.communityTitle, { color: colors.text }]}>{communityTitle}</Text>
            <Text style={[styles.communityBody, { color: colors.textSecondary }]}>
              {communityDescription}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.libraryHeader}>
          <Text style={[styles.libraryTitle, { color: colors.text }]}>{t('secondary.skillLibrary')}</Text>
        </View>

        <View style={styles.libraryList}>
          {libraryTools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[styles.libraryRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              onPress={() => handleNav(tool.route, `library_${tool.id}`)}
              activeOpacity={0.76}
              testID={`tools-library-${tool.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${tool.title}. ${tool.description}`}
            >
              <View style={[styles.libraryIconWrap, { backgroundColor: colors.surface }]}>
                {tool.icon}
              </View>
              <View style={styles.libraryTextWrap}>
                <Text style={[styles.libraryRowTitle, { color: colors.text }]}>{tool.title}</Text>
                <Text style={[styles.libraryRowDesc, { color: colors.textSecondary }]}>{tool.description}</Text>
              </View>
              <ChevronRight size={17} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  mainGrid: {
    gap: 12,
  },
  mainCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
  },
  mainCardHighlighted: {
    borderWidth: 2,
  },
  mainCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mainIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '900',
  },
  mainTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    marginBottom: 6,
  },
  mainDescription: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 13,
  },
  mainActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainActionText: {
    fontSize: 14,
    fontWeight: '900',
  },
  libraryHeader: {
    marginBottom: 10,
  },
  moreSupportHeader: {
    marginTop: 22,
    marginBottom: 10,
  },
  libraryTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 4,
  },
  librarySubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  communityCard: {
    minHeight: 92,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    marginBottom: 22,
  },
  communityIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityTextWrap: {
    flex: 1,
  },
  communityTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  communityBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  libraryList: {
    gap: 8,
    marginBottom: 14,
  },
  libraryRow: {
    minHeight: 62,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  libraryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryTextWrap: {
    flex: 1,
  },
  libraryRowTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },
  libraryRowDesc: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
});
