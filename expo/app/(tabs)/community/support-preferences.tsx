import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import { SUPPORT_TOPICS } from '@/constants/community';
import { useSupportPreferences, useRecommendedCircles } from '@/hooks/useSupportCircles';
import { useSupportCircles } from '@/hooks/useCommunityFeed';
import { SupportTopic } from '@/types/community';

export default function SupportPreferencesScreen() {
  const router = useRouter();
  useLanguage();
  const { preferences, savePreferences, isSaving } = useSupportPreferences();
  const { recommended } = useRecommendedCircles();
  const { joinCircle } = useSupportCircles();
  const [selectedTopics, setSelectedTopics] = useState<SupportTopic[]>(preferences.topics);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (preferences.topics.length > 0) {
      setSelectedTopics(preferences.topics);
    }
  }, [preferences.topics]);

  const handleToggleTopic = useCallback((topic: SupportTopic) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }, []);

  const handleSave = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    savePreferences(selectedTopics);
    router.back();
  }, [selectedTopics, savePreferences, router]);

  const handleJoinCircle = useCallback((circleId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    joinCircle(circleId);
  }, [joinCircle]);

  const hasChanges = JSON.stringify(selectedTopics.sort()) !== JSON.stringify([...preferences.topics].sort());

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{localizedText('Support Preferences', 'Preferencias de apoyo')}</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.introCard}>
            <Text style={styles.introEmoji}>🎯</Text>
            <Text style={styles.introTitle}>{localizedText('What matters to you?', '¿Qué es importante para ti?')}</Text>
            <Text style={styles.introText}>
              {localizedText(
                "Select topics you'd like support with. We'll match you with circles and peers who share similar goals.",
                'Elige los temas en los que quieres apoyo. Te recomendaremos círculos y personas con metas parecidas.',
              )}
            </Text>
          </View>

          <View style={styles.topicsSection}>
            {SUPPORT_TOPICS.map((topic) => {
              const isSelected = selectedTopics.includes(topic.id);
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[styles.topicCard, isSelected && styles.topicCardSelected]}
                  onPress={() => handleToggleTopic(topic.id)}
                  activeOpacity={0.7}
                  testID={`topic-${topic.id}`}
                >
                  <View style={styles.topicLeft}>
                    <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                    <View style={styles.topicInfo}>
                      <Text style={[styles.topicLabel, isSelected && styles.topicLabelSelected]}>
                        {topic.label}
                      </Text>
                      <Text style={styles.topicDescription}>{topic.description}</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Check size={14} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {recommended.length > 0 && selectedTopics.length > 0 && (
            <View style={styles.recommendedSection}>
              <View style={styles.sectionHeader}>
                <Sparkles size={16} color={Colors.brandAmber} />
                <Text style={styles.sectionTitle}>{localizedText('Recommended for you', 'Recomendado para ti')}</Text>
              </View>
              {recommended.map((circle) => (
                <View key={circle.id} style={[styles.recommendedCircle, { borderColor: circle.color + '30' }]}>
                  <View style={styles.recommendedLeft}>
                    <Text style={styles.recommendedEmoji}>{circle.emoji}</Text>
                    <View style={styles.recommendedInfo}>
                      <Text style={styles.recommendedName}>{circle.name}</Text>
                      <Text style={styles.recommendedMembers}>
                        {localizedText(`${circle.memberCount} members`, `${circle.memberCount} miembros`)}
                      </Text>
                    </View>
                  </View>
                  {!circle.isJoined ? (
                    <TouchableOpacity
                      style={[styles.joinSmallBtn, { backgroundColor: circle.color }]}
                      onPress={() => handleJoinCircle(circle.id)}
                    >
                      <Text style={styles.joinSmallBtnText}>{localizedText('Join', 'Unirme')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.joinedSmallBadge, { backgroundColor: circle.color + '15' }]}>
                      <Text style={[styles.joinedSmallText, { color: circle.color }]}>
                        {localizedText('Joined', 'Ya estás dentro')}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {hasChanges && (
        <SafeAreaView edges={['bottom']} style={styles.saveBarSafe}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isSaving}
            testID="save-preferences-btn"
          >
            <Text style={styles.saveBtnText}>
              {isSaving
                ? localizedText('Saving...', 'Guardando...')
                : localizedText(`Save preferences (${selectedTopics.length})`, `Guardar preferencias (${selectedTopics.length})`)}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeTop: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  introCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  introEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  topicsSection: {
    gap: 10,
    marginBottom: 20,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  topicCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  topicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  topicEmoji: {
    fontSize: 24,
  },
  topicInfo: {
    flex: 1,
  },
  topicLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  topicLabelSelected: {
    color: Colors.primaryDark,
  },
  topicDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  recommendedCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  recommendedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recommendedEmoji: {
    fontSize: 22,
  },
  recommendedInfo: {
    flex: 1,
  },
  recommendedName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  recommendedMembers: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  joinSmallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  joinSmallBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  joinedSmallBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  joinedSmallText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  saveBarSafe: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  bottomSpacer: {
    height: 100,
  },
});
