import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Animated,
  Linking,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Plus,
  Trash2,
  Users,
  Heart,
  Phone,
  Mail,
  MessageCircle,
  Edit3,
  ChevronRight,
  Shield,
  X,
  Check,
  Send,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSupportContacts } from '@/hooks/useSupportContacts';
import { TrustedContact, ContactRelationshipType, ContactMethod } from '@/types/profile';
import {
  RELATIONSHIP_TYPE_LABELS,
  RELATIONSHIP_TYPE_COLORS,
  SUPPORT_MESSAGE_TEMPLATES,
  createEmptyContact,
  validateContact,
  getContactInitials,
} from '@/services/support/supportContactService';

type ScreenMode = 'list' | 'add' | 'edit' | 'message';

const RELATIONSHIP_TYPES: ContactRelationshipType[] = ['friend', 'partner', 'therapist', 'family', 'other'];
const CONTACT_METHODS: { value: ContactMethod; label: string; icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'text', label: 'Text', icon: MessageCircle },
  { value: 'email', label: 'Email', icon: Mail },
];

export default function TrustedContactsScreen() {
  const { contacts, addContact, replaceContact, removeContact } = useSupportContacts();

  const [mode, setMode] = useState<ScreenMode>('list');
  const [editingContact, setEditingContact] = useState<TrustedContact | null>(null);
  const [messageTarget, setMessageTarget] = useState<TrustedContact | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleStartAdd = useCallback(() => {
    handleHaptic();
    setEditingContact(createEmptyContact());
    setFormError(null);
    setMode('add');
  }, [handleHaptic]);

  const handleStartEdit = useCallback((contact: TrustedContact) => {
    handleHaptic();
    setEditingContact({ ...contact });
    setFormError(null);
    setMode('edit');
  }, [handleHaptic]);

  const handleSave = useCallback(() => {
    if (!editingContact) return;
    const error = validateContact(editingContact);
    if (error) {
      setFormError(error);
      return;
    }
    handleHaptic();
    if (mode === 'add') {
      addContact(editingContact);
    } else {
      replaceContact(editingContact);
    }
    setEditingContact(null);
    setFormError(null);
    setMode('list');
  }, [editingContact, mode, addContact, replaceContact, handleHaptic]);

  const handleCancel = useCallback(() => {
    setEditingContact(null);
    setFormError(null);
    setMode('list');
  }, []);

  const handleRemove = useCallback((contact: TrustedContact) => {
    Alert.alert(
      'Remove Contact',
      `Remove ${contact.name} from your trusted contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            handleHaptic();
            removeContact(contact.id);
          },
        },
      ],
    );
  }, [removeContact, handleHaptic]);

  const handleOpenMessage = useCallback((contact: TrustedContact) => {
    handleHaptic();
    setMessageTarget(contact);
    setMode('message');
  }, [handleHaptic]);

  const handleSendMessage = useCallback((template: string) => {
    if (!messageTarget) return;
    handleHaptic();
    const encoded = encodeURIComponent(template);
    if (messageTarget.preferredContactMethod === 'email' && messageTarget.email) {
      void Linking.openURL(`mailto:${messageTarget.email}?subject=Reaching out&body=${encoded}`);
    } else if (messageTarget.preferredContactMethod === 'call' && messageTarget.phone) {
      void Linking.openURL(`tel:${messageTarget.phone}`);
    } else if (messageTarget.phone) {
      void Linking.openURL(`sms:${messageTarget.phone}?body=${encoded}`);
    }
    setMode('list');
    setMessageTarget(null);
  }, [messageTarget, handleHaptic]);

  const handleQuickCall = useCallback((contact: TrustedContact) => {
    handleHaptic();
    if (contact.phone) {
      void Linking.openURL(`tel:${contact.phone}`);
    }
  }, [handleHaptic]);

  const handleQuickText = useCallback((contact: TrustedContact) => {
    handleHaptic();
    if (contact.phone) {
      void Linking.openURL(`sms:${contact.phone}`);
    } else if (contact.email) {
      void Linking.openURL(`mailto:${contact.email}`);
    }
  }, [handleHaptic]);

  const updateField = useCallback(<K extends keyof TrustedContact>(field: K, value: TrustedContact[K]) => {
    setEditingContact(prev => prev ? { ...prev, [field]: value } : prev);
    if (formError) setFormError(null);
  }, [formError]);

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const order: ContactRelationshipType[] = ['therapist', 'partner', 'family', 'friend', 'other'];
      return order.indexOf(a.relationshipType) - order.indexOf(b.relationshipType);
    });
  }, [contacts]);

  const renderContactCard = (contact: TrustedContact) => {
    const color = RELATIONSHIP_TYPE_COLORS[contact.relationshipType];
    const initials = getContactInitials(contact.name);

    return (
      <View key={contact.id} style={styles.contactCard} testID={`contact-card-${contact.id}`}>
        <View style={styles.contactTop}>
          <View style={[styles.avatar, { backgroundColor: color + '18' }]}>
            <Text style={[styles.avatarText, { color }]}>{initials}</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <View style={styles.contactMeta}>
              <View style={[styles.typeBadge, { backgroundColor: color + '18' }]}>
                <Text style={[styles.typeBadgeText, { color }]}>
                  {RELATIONSHIP_TYPE_LABELS[contact.relationshipType]}
                </Text>
              </View>
              {contact.showInCrisisMode && (
                <View style={styles.crisisBadge}>
                  <Shield size={10} color={Colors.danger} />
                  <Text style={styles.crisisBadgeText}>Crisis</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleStartEdit(contact)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Edit3 size={15} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {contact.notes ? (
          <Text style={styles.contactNotes} numberOfLines={2}>{contact.notes}</Text>
        ) : null}

        <View style={styles.contactActions}>
          {contact.phone ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleQuickCall(contact)}
              activeOpacity={0.7}
            >
              <Phone size={14} color={Colors.primary} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          ) : null}
          {(contact.phone || contact.email) ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleQuickText(contact)}
              activeOpacity={0.7}
            >
              <MessageCircle size={14} color="#3B82F6" />
              <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>
                {contact.phone ? 'Text' : 'Email'}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenMessage(contact)}
            activeOpacity={0.7}
          >
            <Send size={14} color={Colors.accent} />
            <Text style={[styles.actionButtonText, { color: Colors.accent }]}>Template</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(contact)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID={`remove-contact-${contact.id}`}
          >
            <Trash2 size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderForm = () => {
    if (!editingContact) return null;

    return (
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>
            {mode === 'add' ? 'Add Trusted Contact' : 'Edit Contact'}
          </Text>
          <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.textInput}
            value={editingContact.name}
            onChangeText={(v) => updateField('name', v)}
            placeholder="Their name"
            placeholderTextColor={Colors.textMuted}
            testID="contact-name-input"
            autoFocus={mode === 'add'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Relationship</Text>
          <View style={styles.chipRow}>
            {RELATIONSHIP_TYPES.map((type) => {
              const active = editingContact.relationshipType === type;
              const color = RELATIONSHIP_TYPE_COLORS[type];
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    active && { backgroundColor: color + '18', borderColor: color },
                  ]}
                  onPress={() => { handleHaptic(); updateField('relationshipType', type); }}
                >
                  <Text style={[styles.chipText, active && { color, fontWeight: '600' as const }]}>
                    {RELATIONSHIP_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.textInput}
            value={editingContact.phone}
            onChangeText={(v) => updateField('phone', v)}
            placeholder="Phone number"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            testID="contact-phone-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.textInput}
            value={editingContact.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="Email address"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="contact-email-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Preferred Contact Method</Text>
          <View style={styles.chipRow}>
            {CONTACT_METHODS.map(({ value, label, icon: Icon }) => {
              const active = editingContact.preferredContactMethod === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.methodChip, active && styles.methodChipActive]}
                  onPress={() => { handleHaptic(); updateField('preferredContactMethod', value); }}
                >
                  <Icon size={14} color={active ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.methodChipText, active && styles.methodChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={editingContact.notes}
            onChangeText={(v) => updateField('notes', v)}
            placeholder="e.g. best to call after 6pm"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Shield size={16} color={Colors.danger} />
            <View>
              <Text style={styles.switchTitle}>Show in Crisis Mode</Text>
              <Text style={styles.switchDesc}>Quick access during high distress</Text>
            </View>
          </View>
          <Switch
            value={editingContact.showInCrisisMode}
            onValueChange={(v) => updateField('showInCrisisMode', v)}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={editingContact.showInCrisisMode ? Colors.primary : Colors.textMuted}
          />
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
            <Check size={16} color={Colors.white} />
            <Text style={styles.saveBtnText}>
              {mode === 'add' ? 'Add Contact' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMessageTemplates = () => {
    if (!messageTarget) return null;

    return (
      <View style={styles.messageContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Send to {messageTarget.name}</Text>
          <TouchableOpacity
            onPress={() => { setMode('list'); setMessageTarget(null); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.messageSubtitle}>
          Choose a pre-written message to send. You can edit it before sending.
        </Text>

        {SUPPORT_MESSAGE_TEMPLATES.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateCard}
            onPress={() => handleSendMessage(template.message)}
            activeOpacity={0.7}
          >
            <View style={styles.templateContent}>
              <Text style={styles.templateLabel}>{template.label}</Text>
              <Text style={styles.templateMessage}>{template.message}</Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderList = () => (
    <>
      <View style={styles.infoCard}>
        <View style={styles.infoIconWrap}>
          <Users size={18} color={Colors.primary} />
        </View>
        <Text style={styles.infoText}>
          People you trust to reach out to during difficult moments. They appear as quick-access contacts during crisis mode.
        </Text>
      </View>

      {sortedContacts.length > 0 ? (
        sortedContacts.map(renderContactCard)
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Heart size={28} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No trusted contacts yet</Text>
          <Text style={styles.emptyText}>
            Having people you trust to reach out to can make a real difference during intense moments.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleStartAdd}
        activeOpacity={0.7}
        testID="add-contact-btn"
      >
        <Plus size={18} color={Colors.primary} />
        <Text style={styles.addButtonText}>Add Trusted Contact</Text>
      </TouchableOpacity>

      <View style={styles.gentleNote}>
        <Heart size={13} color={Colors.textMuted} />
        <Text style={styles.gentleNoteText}>
          Building a support network is an act of courage.
        </Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Trusted Support',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {mode === 'list' && renderList()}
          {(mode === 'add' || mode === 'edit') && renderForm()}
          {mode === 'message' && renderMessageTemplates()}
        </Animated.View>
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E8F4ED',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 21,
  },
  contactCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  contactTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  contactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  crisisBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.dangerLight,
  },
  crisisBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginTop: 10,
    paddingLeft: 58,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  removeButton: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  formContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500' as const,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  methodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  methodChipTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  switchLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  switchDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  messageContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  messageSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
  },
  templateContent: {
    flex: 1,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  templateMessage: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  gentleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  gentleNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 40,
  },
});
