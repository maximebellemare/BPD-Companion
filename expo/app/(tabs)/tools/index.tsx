import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Anchor, Heart, Eye, ArrowRightLeft, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { COPING_EXERCISES } from '@/constants/data';
import { CopingCategory } from '@/types';

const CATEGORY_CONFIG: Record<CopingCategory, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  description: string;
}> = {
  'grounding': {
    label: 'Grounding',
    icon: <Anchor size={20} color={Colors.primary} />,
    color: Colors.primary,
    bg: Colors.primaryLight,
    description: 'Anchor yourself in the present moment',
  },
  'self-soothing': {
    label: 'Self-Soothing',
    icon: <Heart size={20} color="#C77DBA" />,
    color: '#C77DBA',
    bg: '#F5E6F3',
    description: 'Comfort and care for yourself',
  },
  'reality-check': {
    label: 'Reality Check',
    icon: <Eye size={20} color={Colors.accent} />,
    color: Colors.accent,
    bg: Colors.accentLight,
    description: 'Separate facts from stories',
  },
  'opposite-action': {
    label: 'Opposite Action',
    icon: <ArrowRightLeft size={20} color="#5B8FB9" />,
    color: '#5B8FB9',
    bg: '#E3EFF7',
    description: 'Act against unhelpful urges',
  },
};

const CATEGORIES: CopingCategory[] = ['grounding', 'self-soothing', 'reality-check', 'opposite-action'];

export default function ToolsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <Text style={styles.title}>Coping Tools</Text>
          <Text style={styles.subtitle}>DBT-informed skills for when things feel hard</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {CATEGORIES.map(category => {
            const config = CATEGORY_CONFIG[category];
            const exercises = COPING_EXERCISES.filter(e => e.category === category);

            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIconWrap, { backgroundColor: config.bg }]}>
                    {config.icon}
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryLabel}>{config.label}</Text>
                    <Text style={styles.categoryDesc}>{config.description}</Text>
                  </View>
                </View>

                <View style={styles.exerciseList}>
                  {exercises.map(exercise => (
                    <TouchableOpacity
                      key={exercise.id}
                      style={styles.exerciseCard}
                      onPress={() => router.push(`/exercise?id=${exercise.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.exerciseContent}>
                        <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                        <Text style={styles.exerciseDesc} numberOfLines={2}>
                          {exercise.description}
                        </Text>
                      </View>
                      <View style={styles.exerciseMeta}>
                        <Clock size={12} color={Colors.textMuted} />
                        <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  categorySection: {
    marginBottom: 28,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  categoryDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  exerciseList: {
    gap: 10,
  },
  exerciseCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  exerciseContent: {
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  exerciseDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseDuration: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
