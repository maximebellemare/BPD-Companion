import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Plus,
  Heart,
  ChevronRight,
  TrendingUp,
  Activity,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRelationships } from '@/hooks/useRelationships';
import {
  RELATIONSHIP_TYPE_META,
  RelationshipProfileAnalysis,
} from '@/types/relationship';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

function ProfileCard({
  analysis,
  index,
  onPress,
}: {
  analysis: RelationshipProfileAnalysis;
  index: number;
  onPress: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { profile, topEmotion, topTrigger, eventCount, recentDistressAvg, insights } = analysis;
  const meta = RELATIONSHIP_TYPE_META[profile.relationshipType];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 12,
        tension: 60,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [scaleAnim, onPress]);

  const importantInsights = insights.filter(i => i.severity === 'important' || i.severity === 'gentle');

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.profileCard}
        onPress={handlePress}
        activeOpacity={0.85}
        testID={`relationship-profile-${profile.id}`}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardAvatar, { backgroundColor: meta.color + '18' }]}>
            <Text style={styles.cardAvatarEmoji}>{meta.emoji}</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardName}>{profile.name}</Text>
            <Text style={styles.cardType}>{meta.label}</Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </View>

        {eventCount > 0 && (
          <View style={styles.cardStatsRow}>
            {topEmotion && (
              <View style={styles.cardStatChip}>
                <Activity size={12} color={meta.color} />
                <Text style={styles.cardStatText}>{topEmotion}</Text>
              </View>
            )}
            {topTrigger && (
              <View style={styles.cardStatChip}>
                <TrendingUp size={12} color={Colors.accent} />
                <Text style={styles.cardStatText} numberOfLines={1}>{topTrigger}</Text>
              </View>
            )}
            {recentDistressAvg > 0 && (
              <View style={[styles.cardStatChip, recentDistressAvg >= 7 && styles.cardStatChipWarm]}>
                <Text style={styles.cardStatText}>
                  {recentDistressAvg.toFixed(1)}/10
                </Text>
              </View>
            )}
          </View>
        )}

        {importantInsights.length > 0 && (
          <View style={styles.cardInsightRow}>
            <Sparkles size={13} color={Colors.primary} />
            <Text style={styles.cardInsightText} numberOfLines={2}>
              {importantInsights[0].description}
            </Text>
          </View>
        )}

        {eventCount === 0 && (
          <View style={styles.cardEmptyHint}>
            <Text style={styles.cardEmptyHintText}>
              Start checking in and this profile will build insights automatically
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RelationshipProfilesScreen() {
  const router = useRouter();
  const { analyses, isLoading } = useRelationships();
  useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: localizedText('Relationship Profiles', 'Perfiles de relación'),
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
          <View style={styles.headerIconWrap}>
            <Heart size={28} color={Colors.white} />
          </View>
          <Text style={styles.headerTitle}>{localizedText('Your People', 'Tus personas')}</Text>
          <Text style={styles.headerDesc}>
            {localizedText(
              'Track emotional patterns with the people who matter most. This helps you understand your reactions and respond more securely.',
              'Registra patrones emocionales con las personas que más importan. Esto te ayuda a entender tus reacciones y responder con más seguridad.',
            )}
          </Text>
        </Animated.View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {analyses.length > 0 ? (
              <View style={styles.profilesList}>
                {analyses.map((analysis, i) => (
                  <ProfileCard
                    key={analysis.profile.id}
                    analysis={analysis}
                    index={i}
                    onPress={() => {
                      handleHaptic();
                      router.push(`/profile/relationship-detail?id=${analysis.profile.id}` as never);
                    }}
                  />
                ))}
              </View>
            ) : (
              <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
                <View style={styles.emptyIconWrap}>
                  <Heart size={36} color={Colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>{localizedText('No profiles yet', 'Aún no hay perfiles')}</Text>
                <Text style={styles.emptyDesc}>
                  {localizedText(
                    "Add someone you'd like to understand your emotional patterns with. Everything stays private and local.",
                    'Agrega a alguien con quien quieras entender tus patrones emocionales. Todo se mantiene privado y local.',
                  )}
                </Text>
              </Animated.View>
            )}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                handleHaptic();
                router.push('/profile/add-relationship' as never);
              }}
              activeOpacity={0.8}
              testID="add-relationship-btn"
            >
              <Plus size={20} color={Colors.white} />
              <Text style={styles.addButtonText}>{localizedText('Add Relationship Profile', 'Agregar perfil de relación')}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            {localizedText(
              "All relationship data stays on your device. It's here to help you grow, never to judge.",
              'Todos los datos de relaciones permanecen en tu dispositivo. Están aquí para ayudarte a crecer, nunca para juzgarte.',
            )}
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
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center' as const,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  headerDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center' as const,
  },
  profilesList: {
    gap: 12,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cardAvatarEmoji: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  cardType: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardStatsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cardStatChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cardStatChipWarm: {
    backgroundColor: '#FFFFFF',
  },
  cardStatText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    maxWidth: 100,
  },
  cardInsightRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cardInsightText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  cardEmptyHint: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cardEmptyHintText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  footerNote: {
    marginTop: 28,
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
