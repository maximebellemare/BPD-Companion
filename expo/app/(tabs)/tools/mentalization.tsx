import React, { useRef, useEffect, useCallback } from 'react';
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
import { ChevronLeft, ChevronRight, Clock, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { MENTALIZATION_TOOLS } from '@/data/mentalizationTools';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

export default function MentalizationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleToolPress = useCallback((toolId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/tools/guided-walkthrough?toolId=${toolId}&toolType=mentalization` as never);
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>{localizedText('Perspective Tools', 'Herramientas de perspectiva')}</Text>
            <Text style={styles.subtitle}>{localizedText("Understand what's really happening", 'Entiende qué está pasando realmente')}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introBanner}>
            <View style={styles.introIcon}>
              <Search size={24} color="#3B82F6" />
            </View>
            <Text style={styles.introTitle}>{localizedText('MBT-Inspired Perspective Taking', 'Toma de perspectiva inspirada en MBT')}</Text>
            <Text style={styles.introDesc}>
              {localizedText(
                'These tools help you step back from emotional certainty and consider other viewpoints — including your own blind spots.',
                'Estas herramientas te ayudan a tomar distancia de la certeza emocional y considerar otros puntos de vista, incluidos tus propios puntos ciegos.',
              )}
            </Text>
          </View>

          <View style={styles.toolsList}>
            {MENTALIZATION_TOOLS.map(tool => (
              <TouchableOpacity
                key={tool.id}
                style={styles.toolCard}
                onPress={() => handleToolPress(tool.id)}
                activeOpacity={0.7}
                testID={`mbt-${tool.id}`}
              >
                <View style={styles.toolCardTop}>
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolSubtitle} numberOfLines={2}>{tool.subtitle}</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textMuted} />
                </View>
                <View style={styles.toolMeta}>
                  <View style={styles.durationBadge}>
                    <Clock size={12} color={Colors.textMuted} />
                    <Text style={styles.durationText}>{tool.duration}</Text>
                  </View>
                  <View style={styles.tagRow}>
                    {tool.tags.slice(0, 2).map(tag => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  introBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 24,
  },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#D9E2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  introTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#2E2A72',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  introDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
  },
  toolsList: {
    gap: 10,
  },
  toolCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toolCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toolInfo: {
    flex: 1,
    paddingRight: 8,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  toolSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  toolMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '500' as const,
  },
});
