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
  CloudLightning,
  Wind,
  Anchor,
  Sparkles,
  Clock,
  ChevronRight,
  X,
  Info,
  CloudSun,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  EmotionalStormResult,
  StormIntensity,
  StormSuggestion,
  StormPattern,
} from '@/services/prediction/emotionalStormService';

interface Props {
  storm: EmotionalStormResult;
}

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Wind,
  Anchor,
  Sparkles,
  Clock,
};

const INTENSITY_THEME: Record<StormIntensity, { bg: string; border: string; accent: string; iconBg: string }> = {
  calm: { bg: Colors.primaryLight, border: '#C8DDD1', accent: Colors.primary, iconBg: '#6B908018' },
  building: { bg: '#FFF8F0', border: '#F5E6D8', accent: '#C4884F', iconBg: '#C4884F14' },
  approaching: { bg: '#FFF3EC', border: '#F2D8C6', accent: '#D07A42', iconBg: '#D07A4214' },
  active: { bg: '#FFF0EE', border: '#FDCFCA', accent: '#C0392B', iconBg: '#C0392B12' },
};

const INTENSITY_LABEL: Record<StormIntensity, string> = {
  calm: 'All clear',
  building: 'Something building',
  approaching: 'Storm approaching',
  active: 'High intensity',
};

export default React.memo(function EmotionalStormCard({ storm }: Props) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [showDetail, setShowDetail] = useState<boolean>(false);

  const { intensity, patterns, suggestions, message } = storm;

  useEffect(() => {
    if (intensity !== 'calm' && patterns.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }).start();

      if (intensity === 'active' || intensity === 'approaching') {
        const glow = Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 2200,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 2200,
              useNativeDriver: true,
            }),
          ])
        );
        glow.start();
        return () => glow.stop();
      }
    }
  }, [intensity, patterns.length, fadeAnim, glowAnim]);

  const handleSuggestionPress = useCallback((suggestion: StormSuggestion) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDetail(false);
    router.push(suggestion.route as never);
  }, [router]);

  const handleCardPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDetail(true);
  }, []);

  if (patterns.length === 0) return null;

  const theme = INTENSITY_THEME[intensity];
  const topSuggestions = suggestions.slice(0, 4);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.08],
  });

  return (
    <>
      <Animated.View
        style={[styles.container, { opacity: fadeAnim }]}
        testID="emotional-storm-card"
      >
        <Animated.View
          style={[
            styles.glowLayer,
            {
              backgroundColor: theme.accent,
              opacity: glowOpacity,
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
              {intensity === 'active' || intensity === 'approaching' ? (
                <CloudLightning size={20} color={theme.accent} />
              ) : (
                <CloudSun size={20} color={theme.accent} />
              )}
            </View>
            <View style={styles.headerText}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.accent }]}>Early Support</Text>
                <View style={[styles.intensityBadge, { backgroundColor: theme.accent + '18' }]}>
                  <Text style={[styles.intensityLabel, { color: theme.accent }]}>
                    {INTENSITY_LABEL[intensity]}
                  </Text>
                </View>
              </View>
              {message && (
                <Text style={styles.message} numberOfLines={2}>{message}</Text>
              )}
            </View>
            <ChevronRight size={16} color={theme.accent} style={{ opacity: 0.5 }} />
          </TouchableOpacity>

          <View style={styles.suggestionsRow}>
            {topSuggestions.map((suggestion) => {
              const IconComp = ICON_MAP[suggestion.icon] ?? Wind;
              return (
                <TouchableOpacity
                  key={suggestion.id}
                  style={[styles.suggestionChip, { backgroundColor: Colors.white }]}
                  onPress={() => handleSuggestionPress(suggestion)}
                  activeOpacity={0.7}
                  testID={`storm-suggestion-${suggestion.type}`}
                >
                  <View style={[styles.chipIconWrap, { backgroundColor: theme.iconBg }]}>
                    <IconComp size={14} color={theme.accent} />
                  </View>
                  <Text style={styles.chipLabel} numberOfLines={1}>{suggestion.title}</Text>
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
              {intensity === 'active' || intensity === 'approaching' ? (
                <CloudLightning size={32} color={theme.accent} />
              ) : (
                <CloudSun size={32} color={theme.accent} />
              )}
            </View>
            <Text style={styles.modalTitle}>Early Support</Text>
            <View style={[styles.modalBadge, { backgroundColor: theme.accent + '14' }]}>
              <Text style={[styles.modalBadgeText, { color: theme.accent }]}>
                {INTENSITY_LABEL[intensity]}
              </Text>
            </View>
            {message && <Text style={styles.modalMessage}>{message}</Text>}

            {patterns.length > 0 && (
              <View style={styles.patternsSection}>
                <Text style={styles.sectionTitle}>What we're noticing</Text>
                {patterns.map((pattern: StormPattern) => (
                  <View key={pattern.id} style={[styles.patternCard, { borderLeftColor: theme.accent }]}>
                    <Text style={styles.patternLabel}>{pattern.label}</Text>
                    <Text style={styles.patternDesc}>{pattern.description}</Text>
                    <View style={styles.strengthRow}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.strengthDot,
                            {
                              backgroundColor: i < pattern.strength ? theme.accent : Colors.border,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {suggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.sectionTitle}>Things that might help</Text>
                {suggestions.map((suggestion) => {
                  const IconComp = ICON_MAP[suggestion.icon] ?? Wind;
                  return (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.suggestionRow}
                      onPress={() => handleSuggestionPress(suggestion)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.suggestionRowIcon, { backgroundColor: theme.accent + '12' }]}>
                        <IconComp size={18} color={theme.accent} />
                      </View>
                      <View style={styles.suggestionRowText}>
                        <Text style={styles.suggestionRowTitle}>{suggestion.title}</Text>
                        <Text style={styles.suggestionRowDesc}>{suggestion.description}</Text>
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
                This is based on your recent patterns — a gentle suggestion, never a diagnosis. You're doing well by paying attention.
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
  glowLayer: {
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
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  intensityLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
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
  chipIconWrap: {
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
    width: 68,
    height: 68,
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
    marginBottom: 8,
  },
  modalBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
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
  patternsSection: {
    marginBottom: 24,
  },
  patternCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  patternLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  patternDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  strengthRow: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthDot: {
    width: 8,
    height: 4,
    borderRadius: 2,
  },
  suggestionsSection: {
    marginBottom: 24,
  },
  suggestionRow: {
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
  suggestionRowIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionRowText: {
    flex: 1,
  },
  suggestionRowTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  suggestionRowDesc: {
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
