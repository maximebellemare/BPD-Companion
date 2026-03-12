import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Plus, Trash2, Users, Heart, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useProfile } from '@/providers/ProfileProvider';
import { TrustedContact } from '@/types/profile';
import { RELATIONSHIP_TYPE_OPTIONS } from '@/services/profile/profileService';

export default function TrustedContactsScreen() {
  const { profile, updateProfile } = useProfile();

  const [contacts, setContacts] = useState<TrustedContact[]>(
    () => profile.trustedContacts || []
  );
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('');

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleAddContact = useCallback(() => {
    if (!newName.trim()) return;
    handleHaptic();

    const contact: TrustedContact = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim(),
      relationship: newRelationship || 'Other',
    };

    const updated = [...contacts, contact];
    setContacts(updated);
    updateProfile({ trustedContacts: updated });
    setNewName('');
    setNewPhone('');
    setNewRelationship('');
    setIsAdding(false);
  }, [newName, newPhone, newRelationship, contacts, updateProfile, handleHaptic]);

  const handleRemoveContact = useCallback((id: string) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this trusted contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = contacts.filter(c => c.id !== id);
            setContacts(updated);
            updateProfile({ trustedContacts: updated });
          },
        },
      ]
    );
  }, [contacts, updateProfile]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Trusted Contacts',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Users size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            These are people you trust to reach out to during difficult moments. They can be friends, family, or anyone who makes you feel safe.
          </Text>
        </View>

        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactAvatar}>
              <User size={18} color={Colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactDetails}>
                {contact.relationship}{contact.phone ? ` \u00B7 ${contact.phone}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveContact(contact.id)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              testID={`remove-contact-${contact.id}`}
            >
              <Trash2 size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}

        {contacts.length === 0 && !isAdding && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Heart size={24} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptyText}>
              Having trusted people to reach out to can make a real difference during intense moments.
            </Text>
          </View>
        )}

        {isAdding ? (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>Add a Trusted Contact</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Their name"
                placeholderTextColor={Colors.textMuted}
                testID="contact-name-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone (optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="Phone number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                testID="contact-phone-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Relationship</Text>
              <View style={styles.relationshipGrid}>
                {RELATIONSHIP_TYPE_OPTIONS.map((rel) => (
                  <TouchableOpacity
                    key={rel}
                    style={[
                      styles.relationshipChip,
                      newRelationship === rel && styles.relationshipChipActive,
                    ]}
                    onPress={() => {
                      handleHaptic();
                      setNewRelationship(rel);
                    }}
                  >
                    <Text
                      style={[
                        styles.relationshipChipText,
                        newRelationship === rel && styles.relationshipChipTextActive,
                      ]}
                    >
                      {rel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.addFormActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsAdding(false);
                  setNewName('');
                  setNewPhone('');
                  setNewRelationship('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, !newName.trim() && styles.saveButtonDisabled]}
                onPress={handleAddContact}
                disabled={!newName.trim()}
              >
                <Text style={[styles.saveButtonText, !newName.trim() && styles.saveButtonTextDisabled]}>
                  Add Contact
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              handleHaptic();
              setIsAdding(true);
            }}
            activeOpacity={0.7}
            testID="add-contact-btn"
          >
            <Plus size={18} color={Colors.primary} />
            <Text style={styles.addButtonText}>Add a Trusted Contact</Text>
          </TouchableOpacity>
        )}

        <View style={styles.gentleNote}>
          <Heart size={14} color={Colors.textMuted} />
          <Text style={styles.gentleNoteText}>
            Building a support network is an act of courage. You don't have to do this alone.
          </Text>
        </View>

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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  contactDetails: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    maxWidth: 280,
  },
  addForm: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: 8,
  },
  addFormTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
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
  relationshipGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  relationshipChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  relationshipChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  relationshipChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  relationshipChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  addFormActions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  saveButtonTextDisabled: {
    opacity: 0.7,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed' as const,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  gentleNote: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 24,
  },
  gentleNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 18,
    maxWidth: 280,
    fontStyle: 'italic' as const,
  },
  bottomSpacer: {
    height: 40,
  },
});
