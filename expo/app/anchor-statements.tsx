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
import { X, Plus, Pin, Heart, Trash2, Anchor, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAnchorStatements } from '@/hooks/useIdentity';
import { EXAMPLE_ANCHOR_STATEMENTS } from '@/services/identity/valuesService';

export default function AnchorStatementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { anchors, pinnedAnchors, save, isSaving, togglePin, toggleFavorite, remove } = useAnchorStatements();
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const addAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    Animated.timing(addAnim, {
      toValue: isAdding ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isAdding, addAnim]);

  const handleSave = useCallback(() => {
    if (!newText.trim()) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    save(newText.trim());
    setNewText('');
    setIsAdding(false);
  }, [newText, save]);

  const handleAddExample = useCallback((text: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    save(text);
  }, [save]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      'Remove Statement',
      'Are you sure you want to remove this anchor statement?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => remove(id) },
      ],
    );
  }, [remove]);

  const existingTexts = anchors.map(a => a.text);
  const availableExamples = EXAMPLE_ANCHOR_STATEMENTS.filter(
    e => !existingTexts.includes(e)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          testID="close-anchors"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Anchor Statements</Text>
          <Text style={styles.headerSubtitle}>Words to hold onto</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => setIsAdding(!isAdding)}
        >
          <Plus size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.introCard}>
            <Anchor size={20} color="#2D8B7A" />
            <Text style={styles.introText}>
              Anchor statements are short truths you can return to when emotions try to pull you away from who you are.
            </Text>
          </View>

          {isAdding && (
            <Animated.View style={[styles.addCard, { opacity: addAnim }]}>
              <Text style={styles.addLabel}>Write your own anchor</Text>
              <TextInput
                style={styles.addInput}
                value={newText}
                onChangeText={setNewText}
                placeholder="I can pause and still care..."
                placeholderTextColor={Colors.textMuted}
                multiline
                autoFocus
                testID="anchor-input"
              />
              <View style={styles.addActions}>
                <TouchableOpacity
                  style={styles.addCancel}
                  onPress={() => { setIsAdding(false); setNewText(''); }}
                >
                  <Text style={styles.addCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addSave, !newText.trim() && styles.addSaveDisabled]}
                  onPress={handleSave}
                  disabled={!newText.trim() || isSaving}
                  testID="save-anchor"
                >
                  <Text style={styles.addSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {pinnedAnchors.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Pin size={14} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Pinned</Text>
              </View>
              {pinnedAnchors.map((anchor) => (
                <View key={anchor.id} style={[styles.anchorCard, styles.anchorCardPinned]}>
                  <Text style={styles.anchorText}>{anchor.text}</Text>
                  <View style={styles.anchorActions}>
                    <TouchableOpacity
                      onPress={() => togglePin(anchor.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Pin size={16} color={Colors.primary} fill={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => toggleFavorite(anchor.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Heart
                        size={16}
                        color={anchor.isFavorite ? '#E84393' : Colors.textMuted}
                        fill={anchor.isFavorite ? '#E84393' : 'none'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {anchors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Your Anchors ({anchors.length})
              </Text>
              {anchors.filter(a => !a.isPinned).map((anchor) => (
                <View key={anchor.id} style={styles.anchorCard}>
                  <Text style={styles.anchorText}>{anchor.text}</Text>
                  <View style={styles.anchorActions}>
                    <TouchableOpacity
                      onPress={() => togglePin(anchor.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Pin size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => toggleFavorite(anchor.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Heart
                        size={16}
                        color={anchor.isFavorite ? '#E84393' : Colors.textMuted}
                        fill={anchor.isFavorite ? '#E84393' : 'none'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(anchor.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {availableExamples.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={14} color={Colors.accent} />
                <Text style={styles.sectionTitle}>Inspiration</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Tap to add any of these to your collection.
              </Text>
              {availableExamples.map((text, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exampleCard}
                  onPress={() => handleAddExample(text)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exampleText}>{text}</Text>
                  <Plus size={16} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
        <View style={{ height: 40 }} />
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
  addBtnHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E0F5EF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#C0E5D8',
    marginBottom: 20,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#2D6B5A',
    lineHeight: 21,
  },
  addCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  addInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 14,
  },
  addActions: {
    flexDirection: 'row',
    gap: 10,
  },
  addCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  addCancelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  addSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  addSaveDisabled: {
    opacity: 0.5,
  },
  addSaveText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  anchorCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  anchorCardPinned: {
    backgroundColor: Colors.warmGlow,
    borderColor: Colors.accentLight,
  },
  anchorText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    fontWeight: '500' as const,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  anchorActions: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'flex-end',
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
});
