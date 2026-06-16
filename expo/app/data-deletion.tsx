import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { X, Trash2, AlertTriangle, Database, MessageSquare, BookOpen, Brain, Shield, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

type DeletionCategory = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  keys: string[];
  color: string;
};

const DELETION_CATEGORIES: DeletionCategory[] = [
  {
    id: 'journal',
    icon: <BookOpen size={18} color="#3B82F6" />,
    title: 'Journal Entries',
    description: 'All journal entries, guided journals, and reflections',
    keys: ['journal_entries', 'journal_insights', 'journal_weekly_reports'],
    color: '#FFFFFF',
  },
  {
    id: 'messages',
    icon: <MessageSquare size={18} color="#3B82F6" />,
    title: 'Message Drafts & History',
    description: 'All message drafts, rewrites, outcomes, and communication patterns',
    keys: ['message_drafts', 'message_outcomes', 'communication_patterns', 'draft_vault'],
    color: '#FFFFFF',
  },
  {
    id: 'companion',
    icon: <Brain size={18} color={Colors.brandTeal} />,
    title: 'AI Companion Data',
    description: 'Conversation history, companion memory, and learned preferences',
    keys: ['companion_conversations', 'companion_memory', 'companion_sessions'],
    color: Colors.brandTealSoft,
  },
  {
    id: 'emotions',
    icon: <Database size={18} color={Colors.accent} />,
    title: 'Emotional Data',
    description: 'Check-ins, emotional profiles, mood history, and insights',
    keys: ['check_ins', 'emotional_profile', 'emotional_insights', 'emotional_timeline'],
    color: Colors.accentLight,
  },
  {
    id: 'profile',
    icon: <Shield size={18} color={Colors.danger} />,
    title: 'Profile & Preferences',
    description: 'Your profile settings, onboarding data, and all app preferences',
    keys: ['user_profile', 'onboarding_profile', 'subscription_state', 'notification_preferences'],
    color: Colors.dangerLight,
  },
];

export default function DataDeletionScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedCategories, setDeletedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const toggleCategory = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (selectedCategories.size === DELETION_CATEGORIES.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(DELETION_CATEGORIES.map(c => c.id)));
    }
  }, [selectedCategories.size]);

  const handleDelete = useCallback(async () => {
    if (selectedCategories.size === 0) return;

    const isFullDeletion = selectedCategories.size === DELETION_CATEGORIES.length;
    const title = isFullDeletion ? 'Delete All Data?' : 'Delete Selected Data?';
    const message = isFullDeletion
      ? 'This will permanently delete ALL your data from this device. This action cannot be undone.'
      : `This will permanently delete ${selectedCategories.size} data categor${selectedCategories.size === 1 ? 'y' : 'ies'}. This action cannot be undone.`;

    const doDelete = async () => {
      setIsDeleting(true);
      try {
        const categoriesToDelete = DELETION_CATEGORIES.filter(c => selectedCategories.has(c.id));
        const keysToDelete = categoriesToDelete.flatMap(c => c.keys);

        const allKeys = await AsyncStorage.getAllKeys();
        const matchingKeys = allKeys.filter(key => {
          return keysToDelete.some(pattern => key.includes(pattern));
        });

        if (matchingKeys.length > 0) {
          await AsyncStorage.multiRemove(matchingKeys);
        }

        if (isFullDeletion) {
          await AsyncStorage.clear();
        }

        setDeletedCategories(new Set(selectedCategories));
        setSelectedCategories(new Set());

        if (Platform.OS !== 'web') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        console.log(`[DataDeletion] Deleted ${matchingKeys.length} keys from ${categoriesToDelete.length} categories`);
      } catch (error) {
        console.error('[DataDeletion] Error deleting data:', error);
        Alert.alert('Error', 'Something went wrong while deleting your data. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    };

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Permanently', style: 'destructive', onPress: doDelete },
    ]);
  }, [selectedCategories]);

  const allSelected = selectedCategories.size === DELETION_CATEGORIES.length;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID="close-btn"
        >
          <X size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete My Data</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.warningBanner, { opacity: fadeAnim }]}>
          <AlertTriangle size={20} color={Colors.accent} />
          <View style={styles.warningBannerContent}>
            <Text style={styles.warningTitle}>Data Deletion is Permanent</Text>
            <Text style={styles.warningDesc}>
              Selected data will be permanently removed from this device. This cannot be undone.
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.selectAllRow}>
            <Text style={styles.selectAllLabel}>Select data to delete</Text>
            <TouchableOpacity
              onPress={selectAll}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="select-all-btn"
            >
              <Text style={styles.selectAllBtn}>{allSelected ? 'Deselect All' : 'Select All'}</Text>
            </TouchableOpacity>
          </View>

          {DELETION_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.has(category.id);
            const isDeleted = deletedCategories.has(category.id);
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                  isDeleted && styles.categoryCardDeleted,
                ]}
                onPress={() => !isDeleted && toggleCategory(category.id)}
                activeOpacity={isDeleted ? 1 : 0.7}
                testID={`category-${category.id}`}
              >
                <View style={[styles.categoryIcon, { backgroundColor: isDeleted ? Colors.successLight : category.color }]}>
                  {isDeleted ? <Check size={18} color={Colors.success} /> : category.icon}
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryTitle, isDeleted && styles.categoryTitleDeleted]}>
                    {isDeleted ? `${category.title} — Deleted` : category.title}
                  </Text>
                  <Text style={styles.categoryDesc}>{category.description}</Text>
                </View>
                {!isDeleted && (
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Check size={14} color={Colors.white} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Need help?</Text>
          <Text style={styles.infoText}>
            If you want to delete your account entirely, including any server-side data, please contact us at:
          </Text>
          <View style={styles.emailCard}>
            <Text style={styles.emailLabel}>Email</Text>
            <Text style={styles.emailValue}>privacy@bpdcompanion.app</Text>
          </View>
          <Text style={styles.infoTextSmall}>
            Account deletion requests are processed within 30 days. You will receive a confirmation email when complete.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {selectedCategories.size > 0 && (
        <Animated.View style={[styles.bottomBar, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.8}
            testID="delete-data-btn"
          >
            {isDeleting ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Trash2 size={18} color={Colors.white} />
                <Text style={styles.deleteBtnText}>
                  Delete {selectedCategories.size} Categor{selectedCategories.size === 1 ? 'y' : 'ies'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  warningBanner: {
    flexDirection: 'row' as const,
    gap: 14,
    backgroundColor: Colors.accentLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    alignItems: 'flex-start' as const,
    borderWidth: 1,
    borderColor: 'rgba(196,149,106,0.2)',
  },
  warningBannerContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  selectAllRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  selectAllLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  selectAllBtn: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  categoryCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    gap: 14,
  },
  categoryCardSelected: {
    borderColor: Colors.danger,
    backgroundColor: '#FFFFFF',
  },
  categoryCardDeleted: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
    opacity: 0.7,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.brandNavy,
    marginBottom: 3,
  },
  categoryTitleDeleted: {
    color: Colors.success,
  },
  categoryDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxSelected: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  infoCard: {
    marginTop: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.brandNavy,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  infoTextSmall: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    marginTop: 8,
  },
  emailCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
  },
  emailLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  emailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  bottomBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  deleteBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.danger,
    borderRadius: 16,
    paddingVertical: 16,
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  bottomSpacer: {
    height: 30,
  },
});
