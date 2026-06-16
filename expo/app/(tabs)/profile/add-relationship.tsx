import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Heart, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRelationships } from '@/hooks/useRelationships';
import {
  RelationshipType,
  RELATIONSHIP_TYPE_META,
} from '@/types/relationship';

const RELATIONSHIP_TYPES: RelationshipType[] = [
  'partner',
  'ex',
  'friend',
  'parent',
  'sibling',
  'coworker',
  'therapist',
  'other',
];

export default function AddRelationshipScreen() {
  const router = useRouter();
  const { addProfile, isAddingProfile } = useRelationships();
  const [name, setName] = useState<string>('');
  const [selectedType, setSelectedType] = useState<RelationshipType | null>(null);
  const [notes, setNotes] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const canSave = name.trim().length >= 1 && selectedType !== null;

  const handleSave = useCallback(() => {
    if (!canSave || !selectedType) return;
    handleHaptic();
    addProfile(
      { name: name.trim(), type: selectedType, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  }, [canSave, selectedType, name, notes, addProfile, router, handleHaptic]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Add Relationship',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
            <View style={styles.headerIconWrap}>
              <Heart size={24} color={Colors.white} />
            </View>
            <Text style={styles.headerTitle}>Track a Relationship</Text>
            <Text style={styles.headerDesc}>
              Add someone you'd like to understand your emotional patterns with. This stays completely private.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
            <Text style={styles.label}>Name or Nickname</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Alex, Mom, Best Friend"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
              testID="relationship-name-input"
            />
          </Animated.View>

          <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
            <Text style={styles.label}>Relationship Type</Text>
            <View style={styles.typeGrid}>
              {RELATIONSHIP_TYPES.map(type => {
                const meta = RELATIONSHIP_TYPE_META[type];
                const isSelected = selectedType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      isSelected && { backgroundColor: meta.color + '18', borderColor: meta.color },
                    ]}
                    onPress={() => {
                      handleHaptic();
                      setSelectedType(type);
                    }}
                    activeOpacity={0.7}
                    testID={`type-${type}`}
                  >
                    <Text style={styles.typeEmoji}>{meta.emoji}</Text>
                    <Text style={[styles.typeLabel, isSelected && { color: meta.color, fontWeight: '700' as const }]}>
                      {meta.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.typeCheck, { backgroundColor: meta.color }]}>
                        <Check size={10} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Anything you'd like to remember about this relationship..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              testID="relationship-notes-input"
            />
          </Animated.View>

          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave || isAddingProfile}
            activeOpacity={0.8}
            testID="save-relationship-btn"
          >
            <Heart size={18} color={Colors.white} />
            <Text style={styles.saveButtonText}>
              {isAddingProfile ? 'Saving...' : 'Add Profile'}
            </Text>
          </TouchableOpacity>

          <View style={styles.safetyNote}>
            <Text style={styles.safetyNoteText}>
              All data stays on your device. The app will automatically connect check-ins, journal entries, and messages to this profile to build insights over time.
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center' as const,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  headerDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top' as const,
  },
  typeGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  typeChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  typeEmoji: {
    fontSize: 18,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  typeCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 2,
  },
  saveButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  safetyNote: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
  },
  safetyNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
  bottomSpacer: {
    height: 20,
  },
});
