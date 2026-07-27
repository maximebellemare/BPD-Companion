import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Shield, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import type { PlaybookReport } from '@/types/playbook';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

interface PlaybookCardProps {
  playbook: PlaybookReport;
}

export default React.memo(function PlaybookCard({ playbook }: PlaybookCardProps) {
  useLanguage();
  const router = useRouter();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/emotional-playbook');
  };

  const accentOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const strategyCount = playbook.totalStrategiesTracked;
  const topTool = playbook.topStrategy;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
      testID="playbook-card"
    >
      <View style={styles.header}>
        <Animated.View style={[styles.iconWrap, { opacity: accentOpacity }]}>
          <BookOpen size={18} color="#67E8F9" />
        </Animated.View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{localizedText('My Emotional Playbook', 'Mi guía emocional')}</Text>
          <Text style={styles.subtitle}>
            {strategyCount > 0
              ? localizedText(
                `${strategyCount} strateg${strategyCount === 1 ? 'y' : 'ies'} personalized for you`,
                `${strategyCount} estrategia${strategyCount === 1 ? '' : 's'} personalizada${strategyCount === 1 ? '' : 's'} para ti`,
              )
              : localizedText('Building your personal coping guide', 'Construyendo tu guía personal de afrontamiento')}
          </Text>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </View>

      {topTool && (
        <View style={styles.topStrategy}>
          <View style={styles.topStrategyIcon}>
            <Shield size={14} color={Colors.primary} />
          </View>
          <View style={styles.topStrategyContent}>
            <Text style={styles.topStrategyLabel}>{localizedText('Top strategy', 'Estrategia principal')}</Text>
            <Text style={styles.topStrategyName} numberOfLines={1}>{topTool.title}</Text>
          </View>
          {topTool.avgDistressReduction > 0 && (
            <View style={styles.reductionBadge}>
              <Zap size={10} color="#67E8F9" />
              <Text style={styles.reductionText}>-{topTool.avgDistressReduction}</Text>
            </View>
          )}
        </View>
      )}

      {!playbook.hasEnoughData && (
        <Text style={styles.encouragement}>
          {localizedText(
            'A few more check-ins will reveal what works best for you.',
            'Unos registros más mostrarán qué te funciona mejor.',
          )}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  topStrategy: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  topStrategyIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topStrategyContent: {
    flex: 1,
  },
  topStrategyLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  topStrategyName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 1,
  },
  reductionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  reductionText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#67E8F9',
  },
  encouragement: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
