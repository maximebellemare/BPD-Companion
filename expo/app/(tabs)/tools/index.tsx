import React, { useRef, useEffect, useState, useCallback } from 'react';
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
import {
  Wind,
  MessageCircle,
  HeartCrack,
  ShieldOff,
  Eye as EyeIcon,
  Zap,
  Brain,
  Anchor,
  ChevronRight,
  Sparkles,
  Shield,
  Activity,
  Search,
  Bookmark,
  Sprout,
  HeartHandshake,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { QUICK_ACCESS_TOOLS } from '@/data/quickAccessTools';
import { getRecentlyUsedTools, getMostHelpfulTools } from '@/services/tools/toolOutcomeService';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Wind,
  MessageCircle,
  HeartCrack,
  ShieldOff,
  Eye: EyeIcon,
  Zap,
  Brain,
  Anchor,
};

interface RecentTool {
  toolId: string;
  toolType: string;
  timestamp: number;
}

interface HelpfulTool {
  toolId: string;
  toolType: string;
  helpRate: number;
  uses: number;
}

export default function ToolsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [recentTools, setRecentTools] = useState<RecentTool[]>([]);
  const [_helpfulTools, setHelpfulTools] = useState<HelpfulTool[]>([]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    getRecentlyUsedTools(3).then(tools => {
      setRecentTools(tools.map(t => ({ toolId: t.toolId, toolType: t.toolType, timestamp: t.timestamp })));
    }).catch(e => console.log('[Tools] Error loading recent:', e));

    getMostHelpfulTools(3).then(setHelpfulTools).catch(e => console.log('[Tools] Error loading helpful:', e));
  }, []);

  const handleQuickAccess = useCallback((route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as never);
  }, [router]);

  const handleNav = useCallback((route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as never);
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <Text style={styles.title}>Tools</Text>
          <Text style={styles.subtitle}>What do you need right now?</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.quickAccessGrid}>
            {QUICK_ACCESS_TOOLS.map(tool => {
              const IconComp = ICON_MAP[tool.iconName];
              return (
                <TouchableOpacity
                  key={tool.id}
                  style={[styles.quickCard, { backgroundColor: tool.bgColor }]}
                  onPress={() => handleQuickAccess(tool.route)}
                  activeOpacity={0.7}
                  testID={`quick-${tool.id}`}
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: tool.color + '20' }]}>
                    {IconComp && <IconComp size={18} color={tool.color} />}
                  </View>
                  <Text style={[styles.quickLabel, { color: tool.color }]} numberOfLines={1}>
                    {tool.label}
                  </Text>
                  <Text style={styles.quickSublabel} numberOfLines={1}>
                    {tool.sublabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.matcherCard}
            onPress={() => handleNav('/tools/tool-matcher')}
            activeOpacity={0.7}
            testID="tool-matcher-card"
          >
            <View style={styles.matcherLeft}>
              <View style={styles.matcherIcon}>
                <Sparkles size={20} color={Colors.white} />
              </View>
              <View style={styles.matcherInfo}>
                <Text style={styles.matcherTitle}>Find the Right Tool</Text>
                <Text style={styles.matcherDesc}>Tell us how you feel and we'll match you with what helps</Text>
              </View>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skill Libraries</Text>
          </View>

          <View style={styles.libraryGrid}>
            <TouchableOpacity
              style={styles.libraryCard}
              onPress={() => handleNav('/tools/dbt-coach')}
              activeOpacity={0.7}
              testID="dbt-library-card"
            >
              <View style={[styles.libraryIcon, { backgroundColor: '#FDE8E3' }]}>
                <Shield size={20} color="#E17055" />
              </View>
              <Text style={styles.libraryTitle}>DBT Skills</Text>
              <Text style={styles.libraryDesc}>32 guided skills</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.libraryCard}
              onPress={() => handleNav('/tools/mentalization')}
              activeOpacity={0.7}
              testID="mbt-library-card"
            >
              <View style={[styles.libraryIcon, { backgroundColor: '#F0ECF7' }]}>
                <Search size={20} color="#9B8EC4" />
              </View>
              <Text style={styles.libraryTitle}>Perspective</Text>
              <Text style={styles.libraryDesc}>MBT-style tools</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.libraryCard}
              onPress={() => handleNav('/tools/relationship-recovery')}
              activeOpacity={0.7}
              testID="rr-library-card"
            >
              <View style={[styles.libraryIcon, { backgroundColor: '#F5E0E0' }]}>
                <HeartCrack size={20} color="#C47878" />
              </View>
              <Text style={styles.libraryTitle}>Recovery</Text>
              <Text style={styles.libraryDesc}>Post-conflict support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.libraryCard}
              onPress={() => handleNav('/tools/body-regulation')}
              activeOpacity={0.7}
              testID="body-library-card"
            >
              <View style={[styles.libraryIcon, { backgroundColor: '#E8F4F4' }]}>
                <Activity size={20} color="#4A8B8D" />
              </View>
              <Text style={styles.libraryTitle}>Body</Text>
              <Text style={styles.libraryDesc}>Physical regulation</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>More Tools</Text>
          </View>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => handleNav('/tools/playbook')}
            activeOpacity={0.7}
            testID="playbook-card"
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.accentLight }]}>
                <Bookmark size={18} color={Colors.accent} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>My Playbook</Text>
                <Text style={styles.featureDesc}>Tools that work best for you</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => handleNav('/companion/simulator' as never)}
            activeOpacity={0.7}
            testID="simulator-card"
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: '#E3EFF7' }]}>
                <Zap size={18} color="#5B8FB9" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Response Simulator</Text>
                <Text style={styles.featureDesc}>Explore how different reactions play out</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => handleNav('/my-growth' as never)}
            activeOpacity={0.7}
            testID="growth-card"
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: '#E3EDE8' }]}>
                <Sprout size={18} color="#6B9080" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>My Growth</Text>
                <Text style={styles.featureDesc}>Values, strengths & identity reflections</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => handleNav('/relationship-profiles' as never)}
            activeOpacity={0.7}
            testID="relationship-card"
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: '#FFF5F9' }]}>
                <HeartHandshake size={18} color="#E84393" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Relationship Support</Text>
                <Text style={styles.featureDesc}>Profiles, copilot & spiral guard</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {recentTools.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recently Used</Text>
              </View>
              {recentTools.map(tool => (
                <View key={tool.toolId} style={styles.recentChip}>
                  <Clock size={14} color={Colors.textMuted} />
                  <Text style={styles.recentText}>{tool.toolId}</Text>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 24 }} />
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
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.brandTeal,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 32,
  },
  quickAccessGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    width: '48%' as unknown as number,
    flexGrow: 1,
    flexBasis: '47%' as unknown as number,
    borderRadius: 16,
    padding: 14,
    minHeight: 96,
  },
  quickIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  quickSublabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  matcherCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.brandNavy,
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
  },
  matcherLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    flex: 1,
  },
  matcherIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  matcherInfo: {
    flex: 1,
  },
  matcherTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 3,
  },
  matcherDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  libraryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 28,
  },
  libraryCard: {
    width: '48%' as unknown as number,
    flexGrow: 1,
    flexBasis: '47%' as unknown as number,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  libraryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  libraryTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  libraryDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  featureCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  featureLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    flex: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  recentChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  recentText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
