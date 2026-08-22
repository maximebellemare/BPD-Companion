import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronRight } from 'lucide-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/hooks/useLanguage';
import {
  dismissTrialFirstWin,
  scheduleTrialActivationRemindersAfterFirstWin,
} from '@/services/subscription/trialActivationService';

export default function TrialFirstWinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const [scheduling, setScheduling] = useState(false);

  const localizedText = (english: string, spanish: string) =>
    language === 'es' ? spanish : english;

  const continueWithReminders = async () => {
    if (scheduling) return;

    setScheduling(true);

    try {
      await scheduleTrialActivationRemindersAfterFirstWin();
    } finally {
      setScheduling(false);
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/(tabs)/(home)' as never);
    }
  };

  const continueWithoutReminders = async () => {
    await dismissTrialFirstWin();

    if (router.canDismiss()) {
      router.dismissAll();
    }

    router.replace('/(tabs)/(home)' as never);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: Math.max(insets.top + 40, 60),
            paddingBottom: Math.max(insets.bottom + 32, 48),
          },
        ]}
      >
        <View
          style={[
            styles.successCircle,
            { backgroundColor: colors.successLight },
          ]}
        >
          <Check size={38} color={colors.success} strokeWidth={3} />
        </View>

        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          {localizedText('DAY 1 STARTED', 'DÍA 1 COMENZADO')}
        </Text>

        <Text style={[styles.title, { color: colors.text }]}>
          {localizedText(
            'You just used BPD Companion when it mattered.',
            'Acabas de usar BPD Companion cuando importaba.',
          )}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {localizedText(
            "That's the goal — not another app to scroll through, but tools you can reach for when emotions, triggers, or relationships feel hard.",
            'Ese es el objetivo: no otra aplicación para explorar, sino herramientas que puedas usar cuando las emociones, los desencadenantes o las relaciones se sientan difíciles.',
          )}
        </Text>

        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <ProgressRow
            label={localizedText('Day 1', 'Día 1')}
            text={localizedText(
              'Use one tool in a real moment',
              'Usa una herramienta en un momento real',
            )}
            completed
            colors={colors}
          />

          <ProgressRow
            label={localizedText('Day 2', 'Día 2')}
            text={localizedText(
              'Understand one trigger',
              'Comprende un desencadenante',
            )}
            colors={colors}
          />

          <ProgressRow
            label={localizedText('Day 3', 'Día 3')}
            text={localizedText(
              'Build your personal toolkit',
              'Construye tu kit personal',
            )}
            colors={colors}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          disabled={scheduling}
          onPress={() => {
            void continueWithReminders();
          }}
        >
          {scheduling ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={[styles.primaryText, { color: colors.white }]}>
                {localizedText(
                  'Keep this going tomorrow',
                  'Continuar mañana',
                )}
              </Text>
              <ChevronRight size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.permissionNote, { color: colors.textMuted }]}>
          {localizedText(
            "We'll ask permission to send your Day 2 reminder.",
            'Pediremos permiso para enviarte el recordatorio del Día 2.',
          )}
        </Text>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            void continueWithoutReminders();
          }}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            {localizedText(
              'Continue without reminders',
              'Continuar sin recordatorios',
            )}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function ProgressRow({
  label,
  text,
  completed = false,
  colors,
}: {
  label: string;
  text: string;
  completed?: boolean;
  colors: {
    primary: string;
    text: string;
    textMuted: string;
    success: string;
    successLight: string;
  };
}) {
  return (
    <View style={styles.progressRow}>
      <View
        style={[
          styles.progressMarker,
          {
            backgroundColor: completed
              ? colors.successLight
              : 'transparent',
            borderColor: completed
              ? colors.success
              : colors.textMuted,
          },
        ]}
      >
        {completed ? (
          <Check size={14} color={colors.success} strokeWidth={3} />
        ) : null}
      </View>

      <View style={styles.progressCopy}>
        <Text
          style={[
            styles.progressLabel,
            { color: completed ? colors.success : colors.primary },
          ]}
        >
          {label}
        </Text>
        <Text style={[styles.progressText, { color: colors.text }]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  successCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  title: {
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '800',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 28,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 20,
    marginBottom: 28,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'flex-start',
  },
  progressMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCopy: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  progressText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '800',
  },
  permissionNote: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },
  skipButton: {
    alignSelf: 'center',
    padding: 16,
    marginTop: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
