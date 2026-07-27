import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Anchor,
  Wind,
  BookOpen,
  Sparkles,
  Timer,
  PenLine,
  ArrowRight,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { SpiralPausePromptConfig } from '@/types/spiral';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Anchor,
  Wind,
  BookOpen,
  Sparkles,
  Timer,
  PenLine,
  ArrowRight,
};

interface SpiralPausePromptProps {
  visible: boolean;
  config: SpiralPausePromptConfig;
  onClose: () => void;
}

function SpiralPausePromptInner({ visible, config, onClose }: SpiralPausePromptProps) {
  useLanguage();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const [pauseCountdown, setPauseCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 9 }),
      ]).start();

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      trackEvent('spiral_prompt_shown');
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
      setPauseCountdown(null);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
  }, [visible, fadeAnim, slideAnim, trackEvent]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleOption = useCallback((optionId: string, route: string | null) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (optionId === 'pause_timer') {
      trackEvent('spiral_intervention_used', { intervention_type: 'pause_timer' });
      setPauseCountdown(120);
      countdownRef.current = setInterval(() => {
        setPauseCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = null;
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }

    if (optionId === 'continue') {
      trackEvent('spiral_intervention_skipped');
      onClose();
      return;
    }

    trackEvent('spiral_intervention_used', { intervention_type: optionId });
    onClose();
    if (route) {
      setTimeout(() => {
        router.push(route as never);
      }, 200);
    }
  }, [trackEvent, onClose, router]);

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            testID="pause-prompt-close"
          >
            <X size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {pauseCountdown !== null ? (
            <View style={styles.countdownContainer}>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownText}>{formatCountdown(pauseCountdown)}</Text>
              </View>
              <Text style={styles.countdownLabel}>{localizedText('Breathing space', 'Espacio para respirar')}</Text>
              <Text style={styles.countdownHint}>
                {localizedText(
                  "Let this moment pass. You can respond when you're ready.",
                  'Deja que este momento pase. Puedes responder cuando estés listo/a.',
                )}
              </Text>
              <TouchableOpacity
                style={styles.countdownDone}
                onPress={() => {
                  setPauseCountdown(null);
                  if (countdownRef.current) {
                    clearInterval(countdownRef.current);
                    countdownRef.current = null;
                  }
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.countdownDoneText}>{localizedText("I'm ready", 'Estoy listo/a')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.message}>{config.message}</Text>

              <View style={styles.options}>
                {config.options.map((option) => {
                  const IconComp = ICON_MAP[option.icon] ?? Anchor;
                  const isContinue = option.id === 'continue';

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        isContinue && styles.optionButtonMuted,
                      ]}
                      onPress={() => handleOption(option.id, option.route)}
                      activeOpacity={0.7}
                      testID={`pause-option-${option.id}`}
                    >
                      <IconComp
                        size={18}
                        color={isContinue ? Colors.textMuted : Colors.primary}
                      />
                      <Text
                        style={[
                          styles.optionText,
                          isContinue && styles.optionTextMuted,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const SpiralPausePrompt = React.memo(SpiralPausePromptInner);
export default SpiralPausePrompt;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27,40,56,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  options: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
  },
  optionButtonMuted: {
    backgroundColor: Colors.surface,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  optionTextMuted: {
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  countdownHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  countdownDone: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  countdownDoneText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
});
