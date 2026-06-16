import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Zap,
  Heart,
  AlertTriangle,
  Wrench,
  Flame,
  Activity,
  BarChart3,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useProfile } from '@/providers/ProfileProvider';

export default function PatternsScreen() {
  const { patternSummary } = useProfile();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const maxCheckIn = Math.max(...patternSummary.weeklyCheckIns, 1);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My Patterns',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.introCard}>
            <BarChart3 size={20} color={Colors.primary} />
            <Text style={styles.introText}>
              These patterns are based on your check-ins and journal entries from the past 30 days.
            </Text>
          </View>

          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: Colors.dangerLight }]}>
                <Zap size={18} color={Colors.danger} />
              </View>
              <Text style={styles.overviewLabel}>Top Trigger</Text>
              <Text style={styles.overviewValue} numberOfLines={2}>
                {patternSummary.topTriggerThisMonth ?? 'No data yet'}
              </Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: '#FFFFFF' }]}>
                <AlertTriangle size={18} color="#3B82F6" />
              </View>
              <Text style={styles.overviewLabel}>Common Urge</Text>
              <Text style={styles.overviewValue} numberOfLines={2}>
                {patternSummary.mostCommonUrge ?? 'No data yet'}
              </Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: Colors.primaryLight }]}>
                <Wrench size={18} color={Colors.primary} />
              </View>
              <Text style={styles.overviewLabel}>Most Used Tool</Text>
              <Text style={styles.overviewValue} numberOfLines={2}>
                {patternSummary.mostUsedExercise ?? 'No data yet'}
              </Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: Colors.accentLight }]}>
                <Activity size={18} color={Colors.accent} />
              </View>
              <Text style={styles.overviewLabel}>Avg Distress</Text>
              <Text style={styles.overviewValue}>
                {patternSummary.averageDistressIntensity > 0
                  ? `${patternSummary.averageDistressIntensity} / 10`
                  : 'No data yet'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week's Check-ins</Text>
            <View style={styles.chartCard}>
              <View style={styles.barChart}>
                {patternSummary.weeklyCheckIns.map((count, i) => (
                  <View key={i} style={styles.barColumn}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${Math.max((count / maxCheckIn) * 100, 4)}%` as never,
                            backgroundColor: count > 0 ? Colors.primary : Colors.border,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{weekDays[i]}</Text>
                    {count > 0 && <Text style={styles.barValue}>{count}</Text>}
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.summaryLabel}>Total Check-ins (30 days)</Text>
                <Text style={styles.summaryValue}>{patternSummary.checkInCount}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <View style={[styles.summaryDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.summaryLabel}>Total Journal Entries</Text>
                <Text style={styles.summaryValue}>{patternSummary.totalJournalEntries}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <View style={[styles.summaryDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.summaryLabel}>Current Streak</Text>
                <Text style={styles.summaryValue}>
                  {patternSummary.journalStreak} day{patternSummary.journalStreak !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.encouragementCard}>
              <Flame size={20} color={Colors.accent} />
              <Text style={styles.encouragementText}>
                {patternSummary.checkInCount > 0
                  ? "Every check-in is an act of self-awareness. You're building a deeper understanding of yourself."
                  : "Start checking in to discover your emotional patterns. There's no wrong way to begin."}
              </Text>
            </View>
          </View>

          <View style={styles.gentleNote}>
            <Heart size={14} color={Colors.textMuted} />
            <Text style={styles.gentleNoteText}>
              Patterns aren't flaws — they're information. Be gentle with what you discover here.
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  introCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
  overviewGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 24,
  },
  overviewCard: {
    width: '48%' as never,
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: '46%' as never,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  overviewIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  overviewLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  barChart: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    height: 120,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center' as const,
  },
  barContainer: {
    flex: 1,
    width: 24,
    justifyContent: 'flex-end' as const,
    marginBottom: 8,
  },
  bar: {
    width: 24,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  barValue: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 6,
  },
  encouragementCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: Colors.warmGlow,
    padding: 16,
    borderRadius: 14,
  },
  encouragementText: {
    flex: 1,
    fontSize: 14,
    color: Colors.accent,
    lineHeight: 20,
    fontStyle: 'italic' as const,
  },
  gentleNote: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 16,
  },
  gentleNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 18,
    maxWidth: 280,
  },
  bottomSpacer: {
    height: 30,
  },
});
