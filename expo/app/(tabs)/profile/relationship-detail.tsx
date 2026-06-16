import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  Heart,
  ChevronRight,
  Trash2,
  Plus,
  Sparkles,
  Shield,
  Activity,
  TrendingUp,
  Zap,
  Clock,
  MessageSquare,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRelationshipDetail } from '@/hooks/useRelationships';
import {
  RELATIONSHIP_TYPE_META,
  RelationshipPatternInsight,
  RelationshipInterventionCard,
  RelationshipEvent,
} from '@/types/relationship';

const INSIGHT_TYPE_CONFIG: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  emotional: { icon: Activity, color: '#3B82F6', bg: '#FFFFFF' },
  communication: { icon: MessageSquare, color: '#3B82F6', bg: '#FFFFFF' },
  coping: { icon: Shield, color: Colors.success, bg: Colors.successLight },
  conflict: { icon: Zap, color: '#3B82F6', bg: '#FFFFFF' },
  growth: { icon: TrendingUp, color: Colors.primary, bg: Colors.primaryLight },
};

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 12,
        tension: 60,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
}

function InsightCard({ insight, index }: { insight: RelationshipPatternInsight; index: number }) {
  const config = INSIGHT_TYPE_CONFIG[insight.type] ?? INSIGHT_TYPE_CONFIG.emotional;
  const IconComponent = config.icon;

  return (
    <AnimatedSection delay={200 + index * 60}>
      <View style={[styles.insightCard, { borderLeftColor: config.color }]}>
        <View style={[styles.insightIconWrap, { backgroundColor: config.bg }]}>
          <IconComponent size={16} color={config.color} />
        </View>
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightDesc}>{insight.description}</Text>
        </View>
      </View>
    </AnimatedSection>
  );
}

function InterventionCard({
  intervention,
  index,
  onPress,
}: {
  intervention: RelationshipInterventionCard;
  index: number;
  onPress: () => void;
}) {
  return (
    <AnimatedSection delay={400 + index * 60}>
      <TouchableOpacity
        style={styles.interventionCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.interventionEmoji}>{intervention.emoji}</Text>
        <View style={styles.interventionContent}>
          <Text style={styles.interventionTitle}>{intervention.title}</Text>
          <Text style={styles.interventionDesc}>{intervention.description}</Text>
        </View>
        {intervention.actionRoute && (
          <ChevronRight size={16} color={Colors.textMuted} />
        )}
      </TouchableOpacity>
    </AnimatedSection>
  );
}

function EventItem({ event }: { event: RelationshipEvent }) {
  const typeEmoji: Record<string, string> = {
    message_rewrite: '✏️',
    trigger: '⚡',
    emotion: '💭',
    journal: '📝',
    distress: '📊',
    coping: '💚',
  };

  return (
    <View style={styles.eventItem}>
      <Text style={styles.eventEmoji}>{typeEmoji[event.type] ?? '📌'}</Text>
      <View style={styles.eventContent}>
        <Text style={styles.eventLabel}>{event.label}</Text>
        <Text style={styles.eventDetail}>{event.detail}</Text>
      </View>
      <Text style={styles.eventTime}>
        {new Date(event.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </Text>
    </View>
  );
}

export default function RelationshipDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, analysis, isLoading, updateProfile, deleteProfile } = useRelationshipDetail(id ?? '');
  const [showAddPositive, setShowAddPositive] = useState<boolean>(false);
  const [positiveText, setPositiveText] = useState<string>('');

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Remove Profile',
      `Are you sure you want to remove ${profile?.name ?? 'this profile'}? This will also remove all associated data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteProfile();
            router.back();
          },
        },
      ]
    );
  }, [profile, deleteProfile, router]);

  const handleAddPositive = useCallback(() => {
    if (!positiveText.trim() || !profile) return;
    handleHaptic();
    updateProfile({
      positiveInteractions: [...(profile.positiveInteractions ?? []), positiveText.trim()],
    });
    setPositiveText('');
    setShowAddPositive(false);
  }, [positiveText, profile, updateProfile, handleHaptic]);

  const handleInterventionPress = useCallback((intervention: RelationshipInterventionCard) => {
    handleHaptic();
    if (intervention.actionRoute) {
      router.push(intervention.actionRoute as never);
    }
  }, [router, handleHaptic]);

  if (isLoading || !profile) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Loading...', headerStyle: { backgroundColor: Colors.background }, headerShadowVisible: false }} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const meta = RELATIONSHIP_TYPE_META[profile.relationshipType];
  const insights = analysis?.insights ?? [];
  const interventions = analysis?.interventions ?? [];
  const events = analysis?.events ?? [];
  const recentEvents = events.slice(0, 10);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: profile.name,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="delete-profile-btn"
            >
              <Trash2 size={20} color={Colors.danger} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedSection delay={0}>
          <View style={styles.profileHeader}>
            <View style={[styles.profileAvatar, { backgroundColor: meta.color + '18' }]}>
              <Text style={styles.profileAvatarEmoji}>{meta.emoji}</Text>
            </View>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileType}>{meta.label}</Text>
            {profile.notes ? (
              <Text style={styles.profileNotes}>{profile.notes}</Text>
            ) : null}
          </View>
        </AnimatedSection>

        {analysis && analysis.eventCount > 0 && (
          <AnimatedSection delay={100}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewValue}>{analysis.eventCount}</Text>
                <Text style={styles.overviewLabel}>Events</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewValue}>
                  {analysis.recentDistressAvg > 0 ? analysis.recentDistressAvg.toFixed(1) : '—'}
                </Text>
                <Text style={styles.overviewLabel}>Avg Distress</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewValue}>
                  {analysis.helpfulCopingTools.length > 0 ? analysis.helpfulCopingTools[0] : '—'}
                </Text>
                <Text style={styles.overviewLabel}>Top Tool</Text>
              </View>
            </View>
          </AnimatedSection>
        )}

        {insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#FFFFFF' }]}>
                <Sparkles size={16} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Emotional Patterns</Text>
                <Text style={styles.sectionSubtitle}>What your data suggests</Text>
              </View>
            </View>
            {insights.map((insight, i) => (
              <InsightCard key={insight.id} insight={insight} index={i} />
            ))}
          </View>
        )}

        {interventions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: Colors.primaryLight }]}>
                <Shield size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Support Suggestions</Text>
                <Text style={styles.sectionSubtitle}>Calming steps that may help</Text>
              </View>
            </View>
            {interventions.map((intervention, i) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                index={i}
                onPress={() => handleInterventionPress(intervention)}
              />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: Colors.successLight }]}>
              <Heart size={16} color={Colors.success} />
            </View>
            <View style={styles.sectionHeaderTextWrap}>
              <Text style={styles.sectionTitle}>Positive Moments</Text>
              <Text style={styles.sectionSubtitle}>Good things to remember</Text>
            </View>
            <TouchableOpacity
              style={styles.addSmallBtn}
              onPress={() => {
                handleHaptic();
                setShowAddPositive(!showAddPositive);
              }}
              activeOpacity={0.7}
            >
              {showAddPositive ? (
                <X size={16} color={Colors.textMuted} />
              ) : (
                <Plus size={16} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {showAddPositive && (
            <AnimatedSection delay={0}>
              <View style={styles.addPositiveRow}>
                <TextInput
                  style={styles.positiveInput}
                  placeholder="Something positive about this relationship..."
                  placeholderTextColor={Colors.textMuted}
                  value={positiveText}
                  onChangeText={setPositiveText}
                  multiline
                  testID="positive-input"
                />
                <TouchableOpacity
                  style={[styles.savePositiveBtn, !positiveText.trim() && styles.savePositiveBtnDisabled]}
                  onPress={handleAddPositive}
                  disabled={!positiveText.trim()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.savePositiveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </AnimatedSection>
          )}

          {profile.positiveInteractions.length > 0 ? (
            <View style={styles.positiveList}>
              {profile.positiveInteractions.map((item, i) => (
                <View key={`positive_${i}`} style={styles.positiveItem}>
                  <Text style={styles.positiveEmoji}>☀️</Text>
                  <Text style={styles.positiveText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPositive}>
              <Text style={styles.emptyPositiveText}>
                Recording positive moments can help balance your perspective during harder times
              </Text>
            </View>
          )}
        </View>

        {recentEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#FFFFFF' }]}>
                <Clock size={16} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Text style={styles.sectionSubtitle}>Events linked to {profile.name}</Text>
              </View>
            </View>
            <AnimatedSection delay={500}>
              <View style={styles.eventsList}>
                {recentEvents.map(event => (
                  <EventItem key={event.id} event={event} />
                ))}
              </View>
            </AnimatedSection>
          </View>
        )}

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            These patterns are generated from your local data using gentle language. They reflect tendencies, not certainties.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  profileHeader: {
    alignItems: 'center' as const,
    paddingVertical: 20,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  profileAvatarEmoji: {
    fontSize: 36,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  profileNotes: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  overviewRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center' as const,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 3,
    textAlign: 'center' as const,
  },
  overviewLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 14,
  },
  sectionHeaderTextWrap: {
    flex: 1,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  insightCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    gap: 12,
    alignItems: 'flex-start' as const,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  insightIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  interventionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  interventionEmoji: {
    fontSize: 24,
  },
  interventionContent: {
    flex: 1,
  },
  interventionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  interventionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  addSmallBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addPositiveRow: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  positiveInput: {
    fontSize: 15,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top' as const,
    marginBottom: 10,
  },
  savePositiveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center' as const,
  },
  savePositiveBtnDisabled: {
    opacity: 0.5,
  },
  savePositiveBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  positiveList: {
    gap: 8,
  },
  positiveItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  positiveEmoji: {
    fontSize: 18,
    marginTop: 1,
  },
  positiveText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  emptyPositive: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  emptyPositiveText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
  },
  eventsList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden' as const,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  eventItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  eventEmoji: {
    fontSize: 18,
    width: 28,
    textAlign: 'center' as const,
  },
  eventContent: {
    flex: 1,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  eventDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  eventTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  footerNote: {
    marginTop: 8,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
  },
  footerNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
  bottomSpacer: {
    height: 20,
  },
});
