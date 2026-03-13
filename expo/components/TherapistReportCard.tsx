import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, ChevronRight, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface TherapistReportCardProps {
  checkInCount: number;
  hasEnoughData: boolean;
  overviewNarrative: string;
  discussionPromptCount: number;
}

function TherapistReportCardComponent({
  checkInCount,
  hasEnoughData,
  overviewNarrative,
  discussionPromptCount,
}: TherapistReportCardProps) {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/therapy-report');
  }, [router]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.03, 0.1],
  });

  const previewText = hasEnoughData
    ? overviewNarrative.length > 90
      ? overviewNarrative.slice(0, 90) + '…'
      : overviewNarrative
    : 'Complete a few more check-ins to generate a therapy report.';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
      testID="therapist-report-card"
    >
      <Animated.View
        style={[
          styles.glowOverlay,
          { opacity: glowOpacity },
        ]}
      />

      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <FileText size={20} color={Colors.primaryDark} />
        </View>
        <View style={styles.badgeRow}>
          {hasEnoughData && (
            <View style={styles.shareBadge}>
              <Share2 size={11} color={Colors.accent} />
              <Text style={styles.shareBadgeText}>Shareable</Text>
            </View>
          )}
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </View>

      <Text style={styles.title}>Therapist Report</Text>
      <Text style={styles.preview}>{previewText}</Text>

      {hasEnoughData && (
        <View style={styles.metaRow}>
          {checkInCount > 0 && (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>
                {checkInCount} check-in{checkInCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {discussionPromptCount > 0 && (
            <View style={[styles.metaChip, styles.metaChipAccent]}>
              <Text style={[styles.metaChipText, styles.metaChipTextAccent]}>
                {discussionPromptCount} discussion topic{discussionPromptCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const TherapistReportCard = React.memo(TherapistReportCardComponent);
export default TherapistReportCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primaryDark,
    borderRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  shareBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  preview: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaChipAccent: {
    backgroundColor: '#F3E8FF',
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  metaChipTextAccent: {
    color: '#8B5CF6',
  },
});
