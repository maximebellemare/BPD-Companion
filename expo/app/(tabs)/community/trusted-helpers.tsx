import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Award, Flame, Heart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { DEV_SEEDED_TRUSTED_CONTRIBUTORS } from '@/constants/community';
import { identifyTrustedContributors } from '@/services/community/supportMatchingService';

export default function TrustedHelpersScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const trusted = useMemo(
    () => identifyTrustedContributors(DEV_SEEDED_TRUSTED_CONTRIBUTORS),
    []
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Trusted Helpers</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.introCard}>
            <View style={styles.introIconCircle}>
              <Award size={28} color={Colors.primary} />
            </View>
            <Text style={styles.introTitle}>Trusted Helpers</Text>
            <Text style={styles.introText}>
              These community members consistently provide supportive, constructive, and helpful responses to others.
            </Text>
          </View>

          <View style={styles.criteriaCard}>
            <Text style={styles.criteriaTitle}>How helpers earn trust</Text>
            <View style={styles.criteriaRow}>
              <Heart size={14} color={Colors.brandAmber} />
              <Text style={styles.criteriaText}>Replies rated helpful by other members</Text>
            </View>
            <View style={styles.criteriaRow}>
              <Award size={14} color={Colors.brandLilac} />
              <Text style={styles.criteriaText}>Positive feedback from the community</Text>
            </View>
            <View style={styles.criteriaRow}>
              <Flame size={14} color={Colors.accent} />
              <Text style={styles.criteriaText}>Consistent, active participation</Text>
            </View>
          </View>

          {trusted.map((contributor, index) => (
            <View key={contributor.userId} style={styles.helperCard}>
              <View style={styles.helperRank}>
                <Text style={styles.helperRankText}>{index + 1}</Text>
              </View>
              <View style={styles.helperAvatar}>
                <Text style={styles.helperInitial}>
                  {contributor.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.helperInfo}>
                <View style={styles.helperNameRow}>
                  <Text style={styles.helperName}>{contributor.displayName}</Text>
                  <View style={styles.trustedBadge}>
                    <Award size={10} color={Colors.primary} />
                    <Text style={styles.trustedLabel}>Trusted</Text>
                  </View>
                </View>
                <View style={styles.helperStats}>
                  <View style={styles.helperStatItem}>
                    <Heart size={11} color={Colors.textMuted} />
                    <Text style={styles.helperStatText}>{contributor.helpfulCount} helpful</Text>
                  </View>
                  <View style={styles.statDot} />
                  <View style={styles.helperStatItem}>
                    <Flame size={11} color={Colors.textMuted} />
                    <Text style={styles.helperStatText}>{contributor.activityStreak}d streak</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeTop: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  introCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  introIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  criteriaCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
    gap: 12,
  },
  criteriaTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  criteriaText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 10,
    gap: 12,
  },
  helperRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.warmGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperRankText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.brandAmber,
  },
  helperAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperInitial: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  helperInfo: {
    flex: 1,
  },
  helperNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  helperName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  trustedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trustedLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  helperStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helperStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helperStatText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  bottomSpacer: {
    height: 40,
  },
});
