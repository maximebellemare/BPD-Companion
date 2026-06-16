import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { HeartHandshake, ChevronRight, Users, Shield, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useRelationships } from '@/hooks/useRelationships';

export default React.memo(function RelationshipHubCard() {
  const router = useRouter();
  const { profiles, analyses } = useRelationships();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/relationship-profiles' as never);
  }, [router]);

  const handleCopilot = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/relationship-copilot' as never);
  }, [router]);

  const totalEvents = analyses.reduce((sum, a) => sum + a.eventCount, 0);
  const hasProfiles = profiles.length > 0;

  return (
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
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.8}
        testID="relationship-hub-card"
      >
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <HeartHandshake size={22} color="#3B82F6" />
          </View>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Relationship Support</Text>
              <View style={styles.proBadge}>
                <Shield size={9} color={Colors.white} />
                <Text style={styles.proText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              {hasProfiles
                ? `${profiles.length} profile${profiles.length !== 1 ? 's' : ''} · ${totalEvents} data points`
                : 'Track patterns and get support in relationships'}
            </Text>
          </View>
          <ChevronRight size={16} color="#3B82F6" style={{ opacity: 0.6 }} />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionChip}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <Users size={13} color={Colors.primary} />
            <Text style={styles.actionChipText}>
              {hasProfiles ? 'Profiles' : 'Add profile'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionChip, styles.actionChipAccent]}
            onPress={handleCopilot}
            activeOpacity={0.7}
          >
            <Sparkles size={13} color="#3B82F6" />
            <Text style={[styles.actionChipText, styles.actionChipTextAccent]}>Copilot</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => {
              if (Platform.OS !== 'web') {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/relationship-spiral' as never);
            }}
            activeOpacity={0.7}
          >
            <Shield size={13} color={Colors.primary} />
            <Text style={styles.actionChipText}>Guard</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#0B1238',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#3B82F6',
    letterSpacing: -0.1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#0B1238',
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionChipAccent: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0B1238',
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  actionChipTextAccent: {
    color: '#3B82F6',
  },
});
