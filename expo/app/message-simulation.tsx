import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { simulateResponsePaths } from '@/services/messages/messageSimulationService';
import {
  EnhancedMessageContext,
  MessageEmotionalState,
  MessageInterpretation,
  MessageUrge,
  MessageDesiredOutcome,
} from '@/types/messageHealth';


const RISK_COLORS = {
  low: Colors.success,
  moderate: Colors.accent,
  high: Colors.danger,
};

function RiskPill({ level, label }: { level: 'low' | 'moderate' | 'high'; label: string }) {
  return (
    <View style={[styles.riskPill, { backgroundColor: RISK_COLORS[level] + '15' }]}>
      <View style={[styles.riskDot, { backgroundColor: RISK_COLORS[level] }]} />
      <Text style={[styles.riskPillText, { color: RISK_COLORS[level] }]}>{label}</Text>
    </View>
  );
}

export default function MessageSimulationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    draft: string;
    situation: string;
    emotionalState: string;
    interpretation: string;
    urge: string;
    desiredOutcome: string;
  }>();

  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const context: EnhancedMessageContext = useMemo(() => ({
    draft: params.draft ?? '',
    situation: params.situation ?? '',
    emotionalState: (params.emotionalState as MessageEmotionalState) || null,
    interpretation: (params.interpretation as MessageInterpretation) || null,
    urge: (params.urge as MessageUrge) || null,
    desiredOutcome: (params.desiredOutcome as MessageDesiredOutcome) || null,
  }), [params]);

  const paths = useMemo(() => {
    if (!context.draft) return [];
    return simulateResponsePaths(context.draft, context);
  }, [context]);

  const handleCopy = (path: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Response Paths</Text>
          <Text style={styles.headerSub}>See how different approaches may play out</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Each path shows a different way to respond to the same situation. Compare the likely effects before choosing.
          </Text>
        </View>

        {paths.map((path) => {
          const isExpanded = expandedPath === path.path;
          const isCopied = copiedPath === path.path;

          return (
            <TouchableOpacity
              key={path.path}
              style={[
                styles.pathCard,
                path.isRecommended && styles.pathCardRecommended,
                { borderLeftColor: path.color },
              ]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExpandedPath(isExpanded ? null : path.path);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.pathHeader}>
                <View style={[styles.pathIconBadge, { backgroundColor: path.color + '15' }]}>
                  <Text style={styles.pathEmoji}>{path.emoji}</Text>
                </View>
                <View style={styles.pathHeaderText}>
                  <View style={styles.pathTitleRow}>
                    <Text style={[styles.pathLabel, { color: path.color }]}>{path.label}</Text>
                    {path.isRecommended && (
                      <View style={styles.recommendedBadge}>
                        <Star size={10} color={Colors.success} />
                        <Text style={styles.recommendedText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronUp size={16} color={Colors.textMuted} />
                ) : (
                  <ChevronDown size={16} color={Colors.textMuted} />
                )}
              </View>

              <View style={styles.pathRiskRow}>
                <RiskPill level={path.regretRisk} label={`Regret: ${path.regretRisk}`} />
                <RiskPill level={path.dignityProtection === 'high' ? 'low' : path.dignityProtection === 'low' ? 'high' : 'moderate'} label={`Dignity: ${path.dignityProtection}`} />
                <RiskPill level={path.clarityLevel === 'high' ? 'low' : path.clarityLevel === 'low' ? 'high' : 'moderate'} label={`Clarity: ${path.clarityLevel}`} />
              </View>

              {isExpanded && (
                <View style={styles.pathExpanded}>
                  <View style={styles.pathMessageCard}>
                    <Text style={styles.pathMessageLabel}>Example message</Text>
                    <Text style={styles.pathMessageText}>{path.exampleMessage}</Text>
                    <TouchableOpacity
                      style={styles.pathCopyBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleCopy(path.path);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {isCopied ? (
                        <Check size={12} color={Colors.success} />
                      ) : (
                        <Copy size={12} color={Colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.effectSection}>
                    <View style={styles.effectRow}>
                      <View style={styles.effectIconWrap}>
                        <Text style={styles.effectIcon}>💭</Text>
                      </View>
                      <View style={styles.effectContent}>
                        <Text style={styles.effectLabel}>Short-term effect</Text>
                        <Text style={styles.effectText}>{path.shortTermEffect}</Text>
                      </View>
                    </View>

                    <View style={styles.effectRow}>
                      <View style={styles.effectIconWrap}>
                        <Text style={styles.effectIcon}>🤝</Text>
                      </View>
                      <View style={styles.effectContent}>
                        <Text style={styles.effectLabel}>Relationship effect</Text>
                        <Text style={styles.effectText}>{path.relationshipEffect}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.originalSection}>
          <Text style={styles.originalLabel}>Your original message</Text>
          <Text style={styles.originalText}>{context.draft}</Text>
        </View>

        <View style={styles.disclaimerCard}>
          <AlertTriangle size={14} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            These are simplified projections based on communication patterns. Real outcomes depend on many factors.
          </Text>
        </View>
      </ScrollView>
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
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: Colors.brandNavy,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  introText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 21,
  },
  pathCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  pathCardRecommended: {
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  pathIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathEmoji: {
    fontSize: 20,
  },
  pathHeaderText: {
    flex: 1,
  },
  pathTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pathLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  pathRiskRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskPillText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  pathExpanded: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 14,
  },
  pathMessageCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    position: 'relative',
  },
  pathMessageLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  pathMessageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    paddingRight: 24,
  },
  pathCopyBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectSection: {
    gap: 12,
  },
  effectRow: {
    flexDirection: 'row',
    gap: 10,
  },
  effectIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectIcon: {
    fontSize: 16,
  },
  effectContent: {
    flex: 1,
  },
  effectLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  effectText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  originalSection: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  originalLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  originalText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
