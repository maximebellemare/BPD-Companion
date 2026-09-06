import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Activity,
  ArrowRight,
  HeartHandshake,
  MessageCircle,
  Search,
} from 'lucide-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/hooks/useLanguage';
import {
  startTrialActivation,
  type TrialActivationChoiceId,
} from '@/services/subscription/trialActivationService';

type ActivationChoice = {
  id: TrialActivationChoiceId;
  title: string;
  description: string;
  route: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
};

export default function TrialActivationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { trackEvent } = useAnalytics();
  const { user } = useAuth();
  const { language } = useLanguage();

  const localizedText = useCallback((english: string, spanish: string) =>
    language === 'es' ? spanish : english, [language]);

  const choices = useMemo<ActivationChoice[]>(
    () => [
      {
        id: 'overwhelmed',
        title: localizedText(
          'My emotions feel overwhelming',
          'Mis emociones se sienten abrumadoras',
        ),
        description: localizedText(
          'Calm your body and lower the intensity first.',
          'Calma tu cuerpo y reduce primero la intensidad.',
        ),
        route: '/grounding-mode',
        icon: Activity,
      },
      {
        id: 'message',
        title: localizedText(
          "I'm about to send something I may regret",
          'Estoy a punto de enviar algo de lo que podría arrepentirme',
        ),
        description: localizedText(
          'Slow down, review the message, and choose what to do next.',
          'Baja el ritmo, revisa el mensaje y decide qué hacer después.',
        ),
        route: '/message-guard',
        icon: MessageCircle,
      },
      {
        id: 'trigger',
        title: localizedText(
          "Something triggered me and I don't understand why",
          'Algo me activó y no entiendo por qué',
        ),
        description: localizedText(
          'Unpack what happened, what it meant to you, and what came up.',
          'Explora qué pasó, qué significó para ti y qué apareció emocionalmente.',
        ),
        route: '/understand-trigger',
        icon: Search,
      },
      {
        id: 'relationship',
        title: localizedText(
          "I'm spiraling about a relationship",
          'Estoy entrando en una espiral por una relación',
        ),
        description: localizedText(
          'Get support for conflict, rejection fears, and relationship distress.',
          'Obtén apoyo para conflictos, miedo al rechazo y angustia en relaciones.',
        ),
        route: '/tools/relationship-recovery',
        icon: HeartHandshake,
      },
    ],
    [localizedText],
  );

  useEffect(() => {
    trackEvent('trial_activation_screen_viewed');
  }, [trackEvent]);

  const choose = async (choice: ActivationChoice) => {
    trackEvent('trial_activation_choice_selected', {
      choice_id: choice.id,
      destination: choice.route,
    });

    try {
      await startTrialActivation({
        ownerId: user?.id ?? null,
        choiceId: choice.id,
        choiceRoute: choice.route,
      });
    } catch (error) {
      if (__DEV__) {
        console.log('[TrialActivation] Could not persist activation state', {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    router.push(choice.route as never);
  };

  const skip = () => {
    trackEvent('trial_activation_skipped');
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
            paddingTop: Math.max(insets.top + 24, 44),
            paddingBottom: Math.max(insets.bottom + 32, 48),
          },
        ]}
      >
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.primaryLight,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {localizedText(
              'YOUR TRIAL IS ACTIVE',
              'TU PRUEBA ESTÁ ACTIVA',
            )}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {localizedText(
            'Your BPD Companion is ready.',
            'Tu BPD Companion está listo.',
          )}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {localizedText(
            "Let's make your first few minutes useful. What do you need help with right now?",
            'Hagamos que tus primeros minutos sean útiles. ¿Con qué necesitas ayuda ahora mismo?',
          )}
        </Text>

        <View style={styles.choiceList}>
          {choices.map((choice) => {
            const Icon = choice.icon;

            return (
              <TouchableOpacity
                key={choice.id}
                activeOpacity={0.78}
                onPress={() => choose(choice)}
                style={[
                  styles.choiceCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Icon size={24} color={colors.primary} strokeWidth={2} />
                </View>

                <View style={styles.choiceCopy}>
                  <Text style={[styles.choiceTitle, { color: colors.text }]}>
                    {choice.title}
                  </Text>
                  <Text
                    style={[
                      styles.choiceDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {choice.description}
                  </Text>
                </View>

                <ArrowRight
                  size={20}
                  color={colors.textSecondary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={[
            styles.planCard,
            {
              backgroundColor: colors.primaryLight,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Text style={[styles.planEyebrow, { color: colors.primary }]}>
            {localizedText('YOUR STARTER ROADMAP', 'TU MAPA INICIAL')}
          </Text>

          <PlanRow
            day={localizedText('Day 1', 'Día 1')}
            text={localizedText(
              'Use one tool for something you are feeling right now.',
              'Usa una herramienta para algo que estás sintiendo ahora.',
            )}
            colors={colors}
          />

          <PlanRow
            day={localizedText('Day 2', 'Día 2')}
            text={localizedText(
              'Understand one trigger or emotional pattern.',
              'Comprende un desencadenante o patrón emocional.',
            )}
            colors={colors}
          />

          <PlanRow
            day={localizedText('Day 3', 'Día 3')}
            text={localizedText(
              'Build the tools you want available when things get hard.',
              'Construye las herramientas que quieres tener disponibles cuando las cosas se pongan difíciles.',
            )}
            colors={colors}
          />
        </View>

        <TouchableOpacity onPress={skip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            {localizedText(
              "I'll explore on my own",
              'Exploraré por mi cuenta',
            )}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function PlanRow({
  day,
  text,
  colors,
}: {
  day: string;
  text: string;
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
  };
}) {
  return (
    <View style={styles.planRow}>
      <View style={styles.planDay}>
        <Text style={[styles.planDayText, { color: colors.primary }]}>
          {day}
        </Text>
      </View>

      <Text style={[styles.planText, { color: colors.text }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 18,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 26,
  },
  choiceList: {
    gap: 12,
  },
  choiceCard: {
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCopy: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 4,
  },
  choiceDescription: {
    fontSize: 14,
    lineHeight: 19,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginTop: 28,
    gap: 16,
  },
  planEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  planDay: {
    width: 48,
  },
  planDayText: {
    fontSize: 13,
    fontWeight: '800',
  },
  planText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  skipButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 10,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
