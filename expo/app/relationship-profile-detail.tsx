import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  ChevronRight,
  Plus,
  Trash2,
  TrendingUp,
  Sparkles,
  Shield,
  Activity,
  Zap,
  Edit3,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRelationshipDetail } from '@/hooks/useRelationships';
import { RELATIONSHIP_TYPE_META } from '@/types/relationship';

export default function RelationshipProfileDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    profile,
    analysis,
    isLoading,
    updateProfile,
    deleteProfile,
  } = useRelationshipDetail(id ?? '');

  const [editingNotes, setEditingNotes] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [newTrigger, setNewTrigger] = useState<string>('');
  const [newPositive, setNewPositive] = useState<string>('');
  const [showAddTrigger, setShowAddTrigger] = useState<boolean>(false);
  const [showAddPositive, setShowAddPositive] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (profile) {
      setNotes(profile.notes);
    }
  }, [profile]);

  const handleDelete = useCallback(() => {
    if (!profile) return;
    Alert.alert(
      'Remove Profile',
      `Remove ${profile.name}? This won't delete check-in or journal data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteProfile();
            router.back();
          },
        },
      ],
    );
  }, [profile, deleteProfile, router]);

  const handleSaveNotes = useCallback(() => {
    updateProfile({ notes: notes.trim() });
    setEditingNotes(false);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [notes, updateProfile]);

  const handleAddTrigger = useCallback(() => {
    if (!newTrigger.trim() || !profile) return;
    const updated = [...profile.emotionalTriggers, newTrigger.trim()];
    updateProfile({ emotionalTriggers: updated });
    setNewTrigger('');
    setShowAddTrigger(false);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [newTrigger, profile, updateProfile]);

  const handleRemoveTrigger = useCallback((trigger: string) => {
    if (!profile) return;
    const updated = profile.emotionalTriggers.filter(t => t !== trigger);
    updateProfile({ emotionalTriggers: updated });
  }, [profile, updateProfile]);

  const handleAddPositive = useCallback(() => {
    if (!newPositive.trim() || !profile) return;
    const updated = [...profile.positiveInteractions, newPositive.trim()];
    updateProfile({ positiveInteractions: updated });
    setNewPositive('');
    setShowAddPositive(false);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [newPositive, profile, updateProfile]);

  const handleOpenCopilot = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/relationship-copilot' as never);
  }, [router]);

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>{isLoading ? 'Loading...' : 'Profile not found'}</Text>
        </View>
      </View>
    );
  }

  const meta = RELATIONSHIP_TYPE_META[profile.relationshipType];
  const events = analysis?.events ?? [];
  const insights = analysis?.insights ?? [];
  const interventions = analysis?.interventions ?? [];
  const topEmotion = analysis?.topEmotion;
  const topTrigger = analysis?.topTrigger;
  const helpfulTools = analysis?.helpfulCopingTools ?? [];
  const distressAvg = analysis?.recentDistressAvg ?? 0;
  const recentEvents = events.slice(0, 8);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.headerBar, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID="detail-back"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{profile.name}</Text>
          <Text style={styles.headerType}>{meta.emoji} {meta.label}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
          testID="detail-delete"
        >
          <Trash2 size={18} color={Colors.danger} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={[styles.heroCard, { backgroundColor: meta.color + '08' }]}>
            <View style={[styles.heroAvatar, { backgroundColor: meta.color + '14' }]}>
              <Text style={styles.heroAvatarText}>{meta.emoji}</Text>
            </View>
            <Text style={styles.heroName}>{profile.name}</Text>
            <Text style={styles.heroType}>{meta.label}</Text>

            {(topEmotion || topTrigger || distressAvg > 0) && (
              <View style={styles.heroStats}>
                {topEmotion && (
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatLabel}>Top emotion</Text>
                    <Text style={[styles.heroStatValue, { color: meta.color }]}>{topEmotion}</Text>
                  </View>
                )}
                {topTrigger && (
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatLabel}>Top trigger</Text>
                    <Text style={[styles.heroStatValue, { color: meta.color }]}>{topTrigger}</Text>
                  </View>
                )}
                {distressAvg > 0 && (
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatLabel}>Avg distress</Text>
                    <Text style={[styles.heroStatValue, { color: distressAvg >= 6 ? '#3B82F6' : meta.color }]}>
                      {distressAvg.toFixed(1)}/10
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.copilotButton, { backgroundColor: meta.color }]}
              onPress={handleOpenCopilot}
              activeOpacity={0.8}
              testID="open-copilot-from-profile"
            >
              <Heart size={16} color={Colors.white} />
              <Text style={styles.copilotButtonText}>Open Relationship Copilot</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Edit3 size={16} color={Colors.textMuted} />
              <Text style={styles.sectionTitle}>Notes</Text>
              {!editingNotes && (
                <TouchableOpacity onPress={() => setEditingNotes(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            {editingNotes ? (
              <View>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="What helps, what makes things hard, common patterns..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  testID="notes-input"
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity style={styles.notesCancelBtn} onPress={() => { setEditingNotes(false); setNotes(profile.notes); }}>
                    <Text style={styles.notesCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.notesSaveBtn} onPress={handleSaveNotes}>
                    <Check size={14} color={Colors.white} />
                    <Text style={styles.notesSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.notesText}>
                {profile.notes || 'No notes yet. Tap Edit to add context about this relationship.'}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Zap size={16} color={Colors.textMuted} />
              <Text style={styles.sectionTitle}>Known Triggers</Text>
              <TouchableOpacity onPress={() => setShowAddTrigger(!showAddTrigger)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Plus size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {showAddTrigger && (
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  value={newTrigger}
                  onChangeText={setNewTrigger}
                  placeholder="e.g. delayed replies, mixed signals"
                  placeholderTextColor={Colors.textMuted}
                  onSubmitEditing={handleAddTrigger}
                  testID="add-trigger-input"
                />
                <TouchableOpacity style={styles.addSubmit} onPress={handleAddTrigger} disabled={!newTrigger.trim()}>
                  <Check size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )}
            {profile.emotionalTriggers.length === 0 && !showAddTrigger && (
              <Text style={styles.emptyListText}>No triggers recorded yet</Text>
            )}
            <View style={styles.chipGrid}>
              {profile.emotionalTriggers.map((trigger, i) => (
                <TouchableOpacity
                  key={`${trigger}-${i}`}
                  style={styles.chipItem}
                  onLongPress={() => handleRemoveTrigger(trigger)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipItemText}>⚡ {trigger}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {helpfulTools.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Shield size={16} color={Colors.textMuted} />
                <Text style={styles.sectionTitle}>What Seems to Help</Text>
              </View>
              <View style={styles.chipGrid}>
                {helpfulTools.map((tool, i) => (
                  <View key={`${tool}-${i}`} style={[styles.chipItem, styles.chipItemGreen]}>
                    <Text style={styles.chipItemTextGreen}>💚 {tool}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Heart size={16} color={Colors.textMuted} />
              <Text style={styles.sectionTitle}>Positive Moments</Text>
              <TouchableOpacity onPress={() => setShowAddPositive(!showAddPositive)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Plus size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {showAddPositive && (
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  value={newPositive}
                  onChangeText={setNewPositive}
                  placeholder="e.g. they checked in on me, we laughed together"
                  placeholderTextColor={Colors.textMuted}
                  onSubmitEditing={handleAddPositive}
                  testID="add-positive-input"
                />
                <TouchableOpacity style={styles.addSubmitGreen} onPress={handleAddPositive} disabled={!newPositive.trim()}>
                  <Check size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )}
            {profile.positiveInteractions.length === 0 && !showAddPositive && (
              <Text style={styles.emptyListText}>Recording positive moments can help balance your perspective during hard times.</Text>
            )}
            <View style={styles.chipGrid}>
              {profile.positiveInteractions.map((item, i) => (
                <View key={`${item}-${i}`} style={[styles.chipItem, styles.chipItemWarm]}>
                  <Text style={styles.chipItemTextWarm}>☀️ {item}</Text>
                </View>
              ))}
            </View>
          </View>

          {insights.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={16} color={Colors.textMuted} />
                <Text style={styles.sectionTitle}>Pattern Insights</Text>
              </View>
              {insights.slice(0, 5).map(insight => (
                <View key={insight.id} style={styles.insightCard}>
                  <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                  <View style={styles.insightContent}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <Text style={styles.insightDesc}>{insight.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {interventions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Activity size={16} color={Colors.textMuted} />
                <Text style={styles.sectionTitle}>What May Help</Text>
              </View>
              {interventions.slice(0, 4).map(intv => (
                <TouchableOpacity
                  key={intv.id}
                  style={styles.interventionCard}
                  onPress={() => {
                    if (intv.actionRoute) {
                      if (Platform.OS !== 'web') {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.push(intv.actionRoute as never);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.interventionEmoji}>{intv.emoji}</Text>
                  <View style={styles.interventionContent}>
                    <Text style={styles.interventionTitle}>{intv.title}</Text>
                    <Text style={styles.interventionDesc}>{intv.description}</Text>
                  </View>
                  {intv.actionRoute && <ChevronRight size={14} color={Colors.textMuted} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {recentEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={16} color={Colors.textMuted} />
                <Text style={styles.sectionTitle}>Recent Activity</Text>
              </View>
              {recentEvents.map(event => (
                <View key={event.id} style={styles.eventRow}>
                  <View style={styles.eventDot} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventLabel}>{event.label}</Text>
                    <Text style={styles.eventDetail}>{event.detail}</Text>
                  </View>
                  <Text style={styles.eventTime}>
                    {formatTimeAgo(event.timestamp)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.footerDisclaimer}>
            <Text style={styles.footerDisclaimerText}>
              This profile is stored locally on your device and never shared. Patterns are generated from your check-ins, journals, and messages to help you understand this relationship better.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
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
  headerCenter: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerType: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroAvatarText: {
    fontSize: 36,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  heroStat: {
    alignItems: 'center',
    minWidth: 80,
  },
  heroStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  copilotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  copilotButtonText: {
    fontSize: 15,
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
    flex: 1,
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  editLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  notesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    lineHeight: 22,
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  notesCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  notesCancelText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  notesSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  notesSaveText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addSubmit: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSubmitGreen: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipItem: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipItemGreen: {
    backgroundColor: Colors.successLight,
  },
  chipItemWarm: {
    backgroundColor: Colors.warmGlow,
  },
  chipItemText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  chipItemTextGreen: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  chipItemTextWarm: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  insightEmoji: {
    fontSize: 22,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  interventionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  interventionEmoji: {
    fontSize: 22,
  },
  interventionContent: {
    flex: 1,
  },
  interventionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  interventionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginTop: 5,
  },
  eventContent: {
    flex: 1,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  eventDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  footerDisclaimer: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  footerDisclaimerText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
