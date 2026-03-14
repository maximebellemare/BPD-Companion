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
import { ChevronLeft, Bookmark, Pin, Trash2, TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { PlaybookEntry } from '@/types/tools';
import { getPlaybook, togglePlaybookPin, removeFromPlaybook, getMostHelpfulTools } from '@/services/tools/toolOutcomeService';

export default function PlaybookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [playbook, setPlaybook] = useState<PlaybookEntry[]>([]);
  const [helpfulTools, setHelpfulTools] = useState<Array<{ toolId: string; toolType: string; helpRate: number; uses: number }>>([]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pb, ht] = await Promise.all([getPlaybook(), getMostHelpfulTools(5)]);
      setPlaybook(pb);
      setHelpfulTools(ht);
    } catch (e) {
      console.log('[Playbook] Error loading data:', e);
    }
  };

  const handlePin = useCallback(async (toolId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await togglePlaybookPin(toolId);
    void loadData();
  }, []);

  const handleRemove = useCallback(async (toolId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removeFromPlaybook(toolId);
    void loadData();
  }, []);

  const pinnedTools = playbook.filter(p => p.pinned);
  const otherTools = playbook.filter(p => !p.pinned);

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
            <Text style={styles.title}>My Playbook</Text>
            <Text style={styles.subtitle}>Tools that work best for you</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {playbook.length === 0 && helpfulTools.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Bookmark size={32} color={Colors.accent} />
              </View>
              <Text style={styles.emptyTitle}>Your playbook is empty</Text>
              <Text style={styles.emptyDesc}>
                As you use tools and mark them helpful, they'll appear here. Over time, this becomes your personalized go-to toolkit.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyBtnText}>Explore Tools</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {helpfulTools.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <TrendingUp size={16} color={Colors.success} />
                    <Text style={styles.sectionTitle}>Most Effective for You</Text>
                  </View>
                  {helpfulTools.map(tool => (
                    <View key={tool.toolId} style={styles.helpfulCard}>
                      <View style={styles.helpfulInfo}>
                        <Text style={styles.helpfulTitle}>{tool.toolId}</Text>
                        <View style={styles.helpfulMeta}>
                          <Text style={styles.helpfulRate}>{tool.helpRate}% helpful</Text>
                          <Text style={styles.helpfulUses}>{tool.uses} uses</Text>
                        </View>
                      </View>
                      <View style={styles.helpfulBar}>
                        <View style={[styles.helpfulBarFill, { width: `${tool.helpRate}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {pinnedTools.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Pin size={16} color={Colors.accent} />
                    <Text style={styles.sectionTitle}>Pinned</Text>
                  </View>
                  {pinnedTools.map(entry => (
                    <View key={entry.toolId} style={styles.playbookCard}>
                      <View style={styles.playbookInfo}>
                        <Text style={styles.playbookTitle}>{entry.toolTitle}</Text>
                        <Text style={styles.playbookMeta}>
                          Used {entry.useCount} times
                          {entry.bestForSituations.length > 0 && ` · Best for ${entry.bestForSituations[0]}`}
                        </Text>
                      </View>
                      <View style={styles.playbookActions}>
                        <TouchableOpacity onPress={() => handlePin(entry.toolId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Pin size={16} color={Colors.accent} fill={Colors.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemove(entry.toolId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Trash2 size={16} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {otherTools.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Bookmark size={16} color={Colors.textSecondary} />
                    <Text style={styles.sectionTitle}>Saved Tools</Text>
                  </View>
                  {otherTools.map(entry => (
                    <View key={entry.toolId} style={styles.playbookCard}>
                      <View style={styles.playbookInfo}>
                        <Text style={styles.playbookTitle}>{entry.toolTitle}</Text>
                        <Text style={styles.playbookMeta}>Used {entry.useCount} times</Text>
                      </View>
                      <View style={styles.playbookActions}>
                        <TouchableOpacity onPress={() => handlePin(entry.toolId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Pin size={16} color={Colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemove(entry.toolId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Trash2 size={16} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 23,
    marginBottom: 28,
  },
  emptyBtn: {
    backgroundColor: Colors.brandNavy,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  helpfulCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  helpfulInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  helpfulTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  helpfulMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  helpfulRate: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  helpfulUses: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  helpfulBar: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  helpfulBarFill: {
    height: 4,
    backgroundColor: Colors.success,
    borderRadius: 2,
  },
  playbookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  playbookInfo: {
    flex: 1,
  },
  playbookTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  playbookMeta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  playbookActions: {
    flexDirection: 'row',
    gap: 14,
    marginLeft: 12,
  },
});
