import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import {
  AlertTriangle,
  Wind,
  BookOpen,
  Pause,
  MessageCircle,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { EarlyWarningSuggestion, DetectedPattern, WarningLevel } from '@/types/prediction';

interface Props {
  warningLevel: WarningLevel;
  message: string | null;
  patterns: DetectedPattern[];
  suggestions: EarlyWarningSuggestion[];
}

const ICON_MAP: Record<string, typeof Wind> = {
  Wind,
  BookOpen,
  Pause,
  MessageCircle,
};

const WARNING_COLORS: Record<WarningLevel, { bg: string; border: string; accent: string }> = {
  none: { bg: Colors.white, border: Colors.border, accent: Colors.primary },
  mild: { bg: '#FFFFFF', border: '#D9E2EC', accent: '#67E8F9' },
  moderate: { bg: '#FFFFFF', border: '#FFFFFF', accent: '#3B82F6' },
  elevated: { bg: '#FFFFFF', border: '#D9E2EC', accent: '#3B82F6' },
};

export default React.memo(function EarlyWarningBanner({
  warningLevel,
  message,
  patterns,
  suggestions,
}: Props) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (warningLevel !== 'none' && !dismissed) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [warningLevel, dismissed, fadeAnim, slideAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDetail(true);
  }, []);

  const handleDismiss = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setDismissed(true));
  }, [fadeAnim]);

  const handleSuggestionPress = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDetail(false);
    router.push(route as never);
  }, [router]);

  if (warningLevel === 'none' || !message || dismissed) return null;

  const colors = WARNING_COLORS[warningLevel];

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.banner, { backgroundColor: colors.bg, borderColor: colors.border }]}
          onPress={handlePress}
          activeOpacity={0.85}
          testID="early-warning-banner"
        >
          <View style={styles.bannerContent}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent + '15' }]}>
              <ShieldCheck size={18} color={colors.accent} />
            </View>
            <View style={styles.bannerTextWrap}>
              <Text style={[styles.bannerTitle, { color: colors.accent }]}>
                Gentle Heads Up
              </Text>
              <Text style={styles.bannerMessage} numberOfLines={2}>
                {message}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.accent} style={{ opacity: 0.6 }} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={14} color={Colors.textMuted} />
        </TouchableOpacity>
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

          <View style={styles.modalContent}>
            <View style={[styles.modalIconCircle, { backgroundColor: colors.accent + '12' }]}>
              <ShieldCheck size={32} color={colors.accent} />
            </View>
            <Text style={styles.modalTitle}>Emotional Check-In</Text>
            <Text style={styles.modalMessage}>{message}</Text>

            {patterns.length > 0 && (
              <View style={styles.patternsSection}>
                <Text style={styles.sectionTitle}>What we noticed</Text>
                {patterns.map(pattern => (
                  <View key={pattern.id} style={styles.patternCard}>
                    <View style={[styles.patternDot, { backgroundColor: colors.accent }]} />
                    <View style={styles.patternTextWrap}>
                      <Text style={styles.patternLabel}>{pattern.label}</Text>
                      <Text style={styles.patternDesc}>{pattern.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {suggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.sectionTitle}>Things that might help</Text>
                {suggestions.map(suggestion => {
                  const IconComponent = ICON_MAP[suggestion.icon] ?? Wind;
                  return (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.suggestionCard}
                      onPress={() => handleSuggestionPress(suggestion.route)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.suggestionIcon, { backgroundColor: Colors.primaryLight }]}>
                        <IconComponent size={18} color={Colors.primary} />
                      </View>
                      <View style={styles.suggestionTextWrap}>
                        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                        <Text style={styles.suggestionDesc}>{suggestion.description}</Text>
                      </View>
                      <ChevronRight size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.reassurance}>
              <AlertTriangle size={14} color={Colors.textMuted} />
              <Text style={styles.reassuranceText}>
                This is based on your recent patterns. It's never a diagnosis — just a gentle nudge to take care of yourself.
              </Text>
            </View>
          </View>
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
  banner: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  bannerMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
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
  patternsSection: {
    marginBottom: 24,
  },
  patternCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  patternTextWrap: {
    flex: 1,
  },
  patternLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  patternDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  suggestionsSection: {
    marginBottom: 24,
  },
  suggestionCard: {
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
  suggestionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTextWrap: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  suggestionDesc: {
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
