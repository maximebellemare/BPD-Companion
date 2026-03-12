import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useProfile } from '@/providers/ProfileProvider';
import {
  TRIGGER_OPTIONS,
  URGE_OPTIONS,
  COPING_OPTIONS,
  GROUNDING_TOOL_OPTIONS,
  RELATIONSHIP_TRIGGER_OPTIONS,
  EMOTIONAL_SPIRAL_OPTIONS,
} from '@/services/profile/profileService';

type ListType = 'triggers' | 'urges' | 'coping' | 'grounding' | 'relationship' | 'spirals';

interface ListConfig {
  title: string;
  subtitle: string;
  options: string[];
  profileKey: 'commonTriggers' | 'commonUrges' | 'whatHelpsMe' | 'preferredGroundingTools' | 'relationshipTriggers' | 'emotionalSpirals';
}

const LIST_CONFIGS: Record<ListType, ListConfig> = {
  triggers: {
    title: 'My Common Triggers',
    subtitle: 'Select the triggers that come up most often for you.',
    options: TRIGGER_OPTIONS,
    profileKey: 'commonTriggers',
  },
  urges: {
    title: 'My Common Urges',
    subtitle: "These are the urges that pull at you hardest. There's no judgment here.",
    options: URGE_OPTIONS,
    profileKey: 'commonUrges',
  },
  coping: {
    title: 'What Usually Helps Me',
    subtitle: "Tools and strategies you've found helpful.",
    options: COPING_OPTIONS,
    profileKey: 'whatHelpsMe',
  },
  grounding: {
    title: 'Preferred Grounding Tools',
    subtitle: 'Your go-to grounding techniques for intense moments.',
    options: GROUNDING_TOOL_OPTIONS,
    profileKey: 'preferredGroundingTools',
  },
  relationship: {
    title: 'Relationship Triggers',
    subtitle: 'Situations in relationships that tend to activate strong feelings.',
    options: RELATIONSHIP_TRIGGER_OPTIONS,
    profileKey: 'relationshipTriggers',
  },
  spirals: {
    title: 'My Emotional Spirals',
    subtitle: 'Recognizing your spiral patterns is a powerful step. Select the ones that feel familiar.',
    options: EMOTIONAL_SPIRAL_OPTIONS,
    profileKey: 'emotionalSpirals',
  },
};

export default function EditListScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const { profile, updateProfile } = useProfile();

  const listType = (type || 'triggers') as ListType;
  const config = LIST_CONFIGS[listType] || LIST_CONFIGS.triggers;

  const [selected, setSelected] = useState<string[]>(
    () => (profile[config.profileKey] as string[]) || []
  );

  const handleToggle = useCallback((item: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelected(prev => {
      const next = prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item];
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    updateProfile({ [config.profileKey]: selected });
    router.back();
  }, [selected, config.profileKey, updateProfile, router]);

  const hasChanges = useMemo(() => {
    const current = (profile[config.profileKey] as string[]) || [];
    if (current.length !== selected.length) return true;
    return !current.every(item => selected.includes(item));
  }, [profile, config.profileKey, selected]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: config.title,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={!hasChanges}
              testID="save-btn"
            >
              <Text style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>{config.subtitle}</Text>

        <View style={styles.optionsGrid}>
          {config.options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <TouchableOpacity
                key={option}
                style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                onPress={() => handleToggle(option)}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <Check size={14} color={Colors.white} />
                  </View>
                )}
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.countText}>
          {selected.length} selected
        </Text>

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
    paddingTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  optionChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  optionChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  countText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    marginTop: 20,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  bottomSpacer: {
    height: 40,
  },
});
