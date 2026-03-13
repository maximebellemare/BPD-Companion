import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, ChevronRight, Sparkles, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useIdentityValues } from '@/hooks/useIdentity';
import { CORE_VALUES } from '@/services/identity/valuesService';
import type { PersonalValue, ValueCategory } from '@/types/identity';

const CATEGORY_META: Record<ValueCategory, { label: string; color: string; bg: string }> = {
  connection: { label: 'Connection', color: '#E84393', bg: '#FFF0F6' },
  integrity: { label: 'Integrity', color: '#6B9080', bg: '#E3EDE8' },
  self: { label: 'Self', color: '#D4956A', bg: '#FFF8F0' },
  growth: { label: 'Growth', color: '#00B894', bg: '#E0F5EF' },
  peace: { label: 'Peace', color: '#3B82F6', bg: '#E8F0FE' },
};

export default function ValuesExplorerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, selectedIds, toggle, updateReflection } = useIdentityValues();
  const [activeCategory, setActiveCategory] = useState<ValueCategory | 'all'>('all');
  const [reflectingValue, setReflectingValue] = useState<PersonalValue | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const filteredValues = activeCategory === 'all'
    ? CORE_VALUES
    : CORE_VALUES.filter(v => v.category === activeCategory);

  const handleToggle = useCallback((value: PersonalValue) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const isSelected = selectedIds.includes(value.id);
    if (!isSelected && selectedIds.length >= 7) {
      Alert.alert(
        'Values Limit',
        'Choosing fewer values helps you stay focused. Try removing one first.',
        [{ text: 'Got it' }],
      );
      return;
    }
    toggle({ valueId: value.id });
  }, [selectedIds, toggle]);

  const handleReflect = useCallback((value: PersonalValue) => {
    const existing = state.selectedValues.find(v => v.valueId === value.id);
    setReflectingValue(value);
    setReflectionText(existing?.reflection ?? '');
  }, [state.selectedValues]);

  const handleSaveReflection = useCallback(() => {
    if (!reflectingValue) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    updateReflection({ valueId: reflectingValue.id, reflection: reflectionText.trim() });
    setReflectingValue(null);
    setReflectionText('');
  }, [reflectingValue, reflectionText, updateReflection]);

  const categories: Array<ValueCategory | 'all'> = ['all', 'connection', 'integrity', 'self', 'growth', 'peace'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID="close-values"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Values Explorer</Text>
          <Text style={styles.headerSubtitle}>What matters most to you</Text>
        </View>
        <View style={styles.closeBtn} />
      </View>

      {reflectingValue ? (
        <Animated.View style={[styles.reflectionOverlay, { opacity: fadeAnim }]}>
          <View style={styles.reflectionCard}>
            <Text style={styles.reflectionEmoji}>{reflectingValue.emoji}</Text>
            <Text style={styles.reflectionLabel}>{reflectingValue.label}</Text>
            <Text style={styles.reflectionQuestion}>
              How do you want this value to show up in your relationships and in conflict?
            </Text>
            <TextInput
              style={styles.reflectionInput}
              value={reflectionText}
              onChangeText={setReflectionText}
              placeholder="Write a short reflection..."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
              testID="reflection-input"
            />
            <View style={styles.reflectionActions}>
              <TouchableOpacity
                style={styles.reflectionCancel}
                onPress={() => { setReflectingValue(null); setReflectionText(''); }}
              >
                <Text style={styles.reflectionCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reflectionSave}
                onPress={handleSaveReflection}
                testID="save-reflection"
              >
                <Check size={18} color={Colors.white} />
                <Text style={styles.reflectionSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.introCard}>
              <Sparkles size={20} color={Colors.accent} />
              <Text style={styles.introText}>
                Choose up to 7 values that feel most true to who you are. These will guide your responses during emotionally charged moments.
              </Text>
            </View>

            {selectedIds.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.selectedTitle}>Your Values ({selectedIds.length}/7)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedRow}>
                  {CORE_VALUES.filter(v => selectedIds.includes(v.id))
                    .sort((a, b) => {
                      const rA = state.selectedValues.find(sv => sv.valueId === a.id)?.rank ?? 999;
                      const rB = state.selectedValues.find(sv => sv.valueId === b.id)?.rank ?? 999;
                      return rA - rB;
                    })
                    .map((value) => {
                      const meta = CATEGORY_META[value.category];
                      const sel = state.selectedValues.find(sv => sv.valueId === value.id);
                      return (
                        <TouchableOpacity
                          key={value.id}
                          style={[styles.selectedChip, { backgroundColor: meta.bg, borderColor: meta.color }]}
                          onPress={() => handleReflect(value)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.selectedChipEmoji}>{value.emoji}</Text>
                          <Text style={[styles.selectedChipLabel, { color: meta.color }]}>{value.label}</Text>
                          {sel?.reflection ? (
                            <View style={[styles.reflectionDot, { backgroundColor: meta.color }]} />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryRow}
              contentContainerStyle={styles.categoryRowContent}
            >
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                const meta = cat === 'all' ? { label: 'All', color: Colors.text, bg: Colors.surface } : CATEGORY_META[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: isActive ? meta.color : meta.bg },
                    ]}
                    onPress={() => setActiveCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      { color: isActive ? Colors.white : meta.color },
                    ]}>
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {filteredValues.map((value) => {
              const isSelected = selectedIds.includes(value.id);
              const meta = CATEGORY_META[value.category];
              const sel = state.selectedValues.find(sv => sv.valueId === value.id);
              return (
                <View key={value.id} style={styles.valueCard}>
                  <TouchableOpacity
                    style={styles.valueMain}
                    onPress={() => handleToggle(value)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.valueCheck, isSelected && { backgroundColor: meta.color, borderColor: meta.color }]}>
                      {isSelected && <Check size={14} color={Colors.white} />}
                    </View>
                    <View style={styles.valueContent}>
                      <View style={styles.valueHeader}>
                        <Text style={styles.valueEmoji}>{value.emoji}</Text>
                        <Text style={styles.valueLabel}>{value.label}</Text>
                        <View style={[styles.valueCategoryBadge, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.valueCategoryText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.valueDescription}>{value.description}</Text>
                    </View>
                  </TouchableOpacity>
                  {isSelected && (
                    <TouchableOpacity
                      style={styles.valueReflectBtn}
                      onPress={() => handleReflect(value)}
                      activeOpacity={0.7}
                    >
                      <Heart size={14} color={meta.color} />
                      <Text style={[styles.valueReflectText, { color: meta.color }]}>
                        {sel?.reflection ? 'Edit reflection' : 'Add reflection'}
                      </Text>
                      <ChevronRight size={14} color={meta.color} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </Animated.View>
          <View style={{ height: 40 }} />
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.accentLight,
    marginBottom: 20,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  selectedSection: {
    marginBottom: 16,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  selectedRow: {
    flexDirection: 'row',
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    gap: 6,
  },
  selectedChipEmoji: {
    fontSize: 16,
  },
  selectedChipLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  reflectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryRow: {
    marginBottom: 20,
  },
  categoryRowContent: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  valueCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 10,
    overflow: 'hidden',
  },
  valueMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  valueCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  valueContent: {
    flex: 1,
  },
  valueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  valueEmoji: {
    fontSize: 18,
  },
  valueLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  valueCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  valueCategoryText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  valueDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  valueReflectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 6,
  },
  valueReflectText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  reflectionOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  reflectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  reflectionEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  reflectionLabel: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  reflectionQuestion: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  reflectionInput: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  reflectionActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  reflectionCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  reflectionCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  reflectionSave: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reflectionSaveText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
