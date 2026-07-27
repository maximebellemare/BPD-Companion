import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  Heart,
  ChevronRight,
  X,
  Users,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedField, localizedText } from '@/lib/i18n/staticText';
import { useRelationships } from '@/hooks/useRelationships';
import {
  RelationshipType,
  RELATIONSHIP_TYPE_META,
} from '@/types/relationship';

const RELATIONSHIP_TYPES: { type: RelationshipType; label: string; emoji: string; color: string }[] = [
  localizedField({ type: 'partner', label: 'Partner', emoji: '💕', color: '#3B82F6' }, 'label', 'Partner', 'Pareja'),
  localizedField({ type: 'ex', label: 'Ex', emoji: '💔', color: '#67E8F9' }, 'label', 'Ex', 'Expareja'),
  localizedField({ type: 'friend', label: 'Friend', emoji: '🤝', color: '#14B8A6' }, 'label', 'Friend', 'Amistad'),
  localizedField({ type: 'parent', label: 'Parent', emoji: '🏠', color: '#3B82F6' }, 'label', 'Parent', 'Madre/padre'),
  localizedField({ type: 'sibling', label: 'Sibling', emoji: '👫', color: '#3B82F6' }, 'label', 'Sibling', 'Hermana/o'),
  localizedField({ type: 'coworker', label: 'Coworker', emoji: '💼', color: '#14B8A6' }, 'label', 'Coworker', 'Trabajo'),
  localizedField({ type: 'therapist', label: 'Therapist', emoji: '🧠', color: '#14B8A6' }, 'label', 'Therapist', 'Terapeuta'),
  localizedField({ type: 'other', label: 'Other', emoji: '👤', color: '#2E2A72' }, 'label', 'Other', 'Otro'),
];

export default function RelationshipProfilesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLanguage();
  const { profiles, analyses, isLoading, addProfile, deleteProfile } = useRelationships();

  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newType, setNewType] = useState<RelationshipType | null>(null);
  const [newNotes, setNewNotes] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const createSlide = useRef(new Animated.Value(300)).current;
  const createFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const openCreate = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowCreate(true);
    setNewName('');
    setNewType(null);
    setNewNotes('');
    Animated.parallel([
      Animated.timing(createSlide, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(createFade, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [createSlide, createFade]);

  const closeCreate = useCallback(() => {
    Animated.parallel([
      Animated.timing(createSlide, { toValue: 300, duration: 250, useNativeDriver: true }),
      Animated.timing(createFade, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setShowCreate(false);
    });
  }, [createSlide, createFade]);

  const handleCreate = useCallback(() => {
    if (!newName.trim() || !newType) return;
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    addProfile({ name: newName.trim(), type: newType, notes: newNotes.trim() || undefined });
    closeCreate();
    console.log('[RelationshipProfiles] Created profile:', newName, newType);
  }, [newName, newType, newNotes, addProfile, closeCreate]);

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert(
      localizedText('Remove Profile', 'Eliminar perfil'),
      localizedText(
        `Remove ${name} from your relationship profiles? This won't delete any check-in or journal data.`,
        `¿Eliminar a ${name} de tus perfiles de relación? Esto no eliminará datos de check-ins ni diarios.`,
      ),
      [
        { text: localizedText('Cancel', 'Cancelar'), style: 'cancel' },
        {
          text: localizedText('Remove', 'Eliminar'),
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            deleteProfile(id);
          },
        },
      ],
    );
  }, [deleteProfile]);

  const handleOpenProfile = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/relationship-profile-detail?id=${id}` as never);
  }, [router]);

  const handleOpenCopilot = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/relationship-copilot' as never);
  }, [router]);

  const handleOpenSpiral = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/relationship-spiral' as never);
  }, [router]);

  const handleOpenInsights = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/relationship-insights' as never);
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID="profiles-back"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{localizedText('Relationships', 'Relaciones')}</Text>
          <Text style={styles.headerSubtitle}>
            {localizedText('Understanding your patterns in connection', 'Entiende tus patrones en la conexión')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreate}
          activeOpacity={0.7}
          testID="add-profile"
        >
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={handleOpenCopilot}
              activeOpacity={0.7}
              testID="quick-copilot"
            >
              <View style={[styles.quickIconWrap, { backgroundColor: '#FFFFFF' }]}>
                <Heart size={18} color="#3B82F6" />
              </View>
              <Text style={styles.quickLabel}>Copilot</Text>
              <Text style={styles.quickDesc}>{localizedText('Get guided support', 'Recibe apoyo guiado')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={handleOpenSpiral}
              activeOpacity={0.7}
              testID="quick-spiral"
            >
              <View style={[styles.quickIconWrap, { backgroundColor: '#FFFFFF' }]}>
                <Shield size={18} color="#3B82F6" />
              </View>
              <Text style={styles.quickLabel}>{localizedText('Spiral Guard', 'Protector de espirales')}</Text>
              <Text style={styles.quickDesc}>{localizedText('Detect patterns', 'Detecta patrones')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={handleOpenInsights}
              activeOpacity={0.7}
              testID="quick-insights"
            >
              <View style={[styles.quickIconWrap, { backgroundColor: Colors.primaryLight }]}>
                <TrendingUp size={18} color={Colors.primary} />
              </View>
              <Text style={styles.quickLabel}>{localizedText('Insights', 'Insights')}</Text>
              <Text style={styles.quickDesc}>{localizedText('See patterns', 'Ver patrones')}</Text>
            </TouchableOpacity>
          </View>

          {profiles.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Users size={36} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>{localizedText('No profiles yet', 'Aún no hay perfiles')}</Text>
              <Text style={styles.emptyDesc}>
                {localizedText(
                  'Create a relationship profile to track patterns, triggers, and what helps in specific relationships. This is optional — you can still use all features without it.',
                  'Crea un perfil de relación para registrar patrones, detonantes y lo que ayuda en relaciones específicas. Es opcional: puedes usar todas las funciones sin hacerlo.',
                )}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={openCreate}
                activeOpacity={0.8}
              >
                <Plus size={16} color={Colors.white} />
                <Text style={styles.emptyButtonText}>{localizedText('Add someone', 'Agregar a alguien')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {profiles.map((profile, index) => {
            const analysis = analyses.find(a => a.profile.id === profile.id);
            const meta = RELATIONSHIP_TYPE_META[profile.relationshipType];
            const eventCount = analysis?.eventCount ?? 0;
            const topEmotion = analysis?.topEmotion;
            const topTrigger = analysis?.topTrigger;
            const distressAvg = analysis?.recentDistressAvg ?? 0;

            return (
              <TouchableOpacity
                key={profile.id}
                style={styles.profileCard}
                onPress={() => handleOpenProfile(profile.id)}
                onLongPress={() => handleDelete(profile.id, profile.name)}
                activeOpacity={0.7}
                testID={`profile-${index}`}
              >
                <View style={styles.profileHeader}>
                  <View style={[styles.profileAvatar, { backgroundColor: meta.color + '14' }]}>
                    <Text style={styles.profileAvatarText}>{meta.emoji}</Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.profileType}>{meta.label}</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </View>

                {eventCount > 0 && (
                  <View style={styles.profileStats}>
                    {topEmotion && (
                      <View style={styles.statChip}>
                        <Text style={styles.statChipText}>💭 {topEmotion}</Text>
                      </View>
                    )}
                    {topTrigger && (
                      <View style={styles.statChip}>
                        <Text style={styles.statChipText}>⚡ {topTrigger}</Text>
                      </View>
                    )}
                    {distressAvg > 0 && (
                      <View style={[styles.statChip, distressAvg >= 6 && styles.statChipWarn]}>
                        <Text style={[styles.statChipText, distressAvg >= 6 && styles.statChipTextWarn]}>
                          {distressAvg.toFixed(1)}/10
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {eventCount === 0 && profile.notes ? (
                  <Text style={styles.profileNotes} numberOfLines={2}>{profile.notes}</Text>
                ) : null}

                <View style={styles.profileFooter}>
                  <Text style={styles.profileFooterText}>
                    {eventCount > 0
                      ? localizedText(`${eventCount} data point${eventCount !== 1 ? 's' : ''}`, `${eventCount} dato${eventCount !== 1 ? 's' : ''}`)
                      : localizedText('No data yet — use check-ins and messages to build patterns', 'Aún no hay datos: usa check-ins y mensajes para construir patrones')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {profiles.length > 0 && (
            <View style={styles.footerHint}>
              <Sparkles size={14} color={Colors.textMuted} />
              <Text style={styles.footerHintText}>
                {localizedText(
                  'Long press a profile to remove it. Patterns build automatically from your check-ins, journals, and messages.',
                  'Mantén presionado un perfil para eliminarlo. Los patrones se construyen automáticamente desde tus check-ins, diarios y mensajes.',
                )}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {showCreate && (
        <Animated.View style={[styles.createOverlay, { opacity: createFade }]}>
          <TouchableOpacity style={styles.createBackdrop} onPress={closeCreate} activeOpacity={1} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.createKeyboard}
          >
            <Animated.View style={[styles.createSheet, { transform: [{ translateY: createSlide }] }]}>
              <View style={styles.createHandle} />
              <View style={styles.createHeader}>
                <Text style={styles.createTitle}>{localizedText('Add a relationship', 'Agregar una relación')}</Text>
                <TouchableOpacity onPress={closeCreate} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <X size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.createLabel}>{localizedText('Name or nickname', 'Nombre o apodo')}</Text>
              <TextInput
                style={styles.createInput}
                value={newName}
                onChangeText={setNewName}
                placeholder={localizedText('How you know them', 'Cómo les conoces')}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                testID="new-profile-name"
              />

              <Text style={styles.createLabel}>{localizedText('Relationship type', 'Tipo de relación')}</Text>
              <View style={styles.typeGrid}>
                {RELATIONSHIP_TYPES.map(rt => (
                  <TouchableOpacity
                    key={rt.type}
                    style={[
                      styles.typeChip,
                      newType === rt.type && { borderColor: rt.color, backgroundColor: rt.color + '0C' },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setNewType(rt.type);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.typeChipEmoji}>{rt.emoji}</Text>
                    <Text style={[
                      styles.typeChipLabel,
                      newType === rt.type && { color: rt.color, fontWeight: '600' as const },
                    ]}>
                      {rt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.createLabel}>{localizedText('Notes (optional)', 'Notas (opcional)')}</Text>
              <TextInput
                style={[styles.createInput, styles.createInputMulti]}
                value={newNotes}
                onChangeText={setNewNotes}
                placeholder={localizedText(
                  'Common triggers, what helps, what makes it hard...',
                  'Detonantes comunes, lo que ayuda, lo que lo hace difícil...',
                )}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                testID="new-profile-notes"
              />

              <TouchableOpacity
                style={[
                  styles.createSubmit,
                  (!newName.trim() || !newType) && styles.createSubmitDisabled,
                ]}
                onPress={handleCreate}
                activeOpacity={0.8}
                disabled={!newName.trim() || !newType}
                testID="create-profile-submit"
              >
                <Text style={styles.createSubmitText}>{localizedText('Create Profile', 'Crear perfil')}</Text>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
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
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  quickDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  profileType: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statChip: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statChipWarn: {
    backgroundColor: '#FFFFFF',
  },
  statChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  statChipTextWarn: {
    color: '#3B82F6',
  },
  profileNotes: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    marginTop: 12,
    fontStyle: 'italic',
  },
  profileFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  profileFooterText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  footerHintText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  createOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  createBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  createKeyboard: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  createSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  createHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  createHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  createTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  createLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  createInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  createInputMulti: {
    minHeight: 80,
    paddingTop: 14,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  typeChipEmoji: {
    fontSize: 16,
  },
  typeChipLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  createSubmit: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  createSubmitDisabled: {
    opacity: 0.4,
  },
  createSubmitText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
