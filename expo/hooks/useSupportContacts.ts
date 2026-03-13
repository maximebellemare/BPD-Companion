import { useCallback, useMemo } from 'react';
import { useProfile } from '@/providers/ProfileProvider';
import { TrustedContact } from '@/types/profile';
import { getCrisisModeContacts } from '@/services/support/supportContactService';

export function useSupportContacts() {
  const { profile, updateProfile } = useProfile();

  const contacts = useMemo(() => profile.trustedContacts ?? [], [profile.trustedContacts]);

  const crisisModeContacts = useMemo(
    () => getCrisisModeContacts(contacts),
    [contacts],
  );

  const addContact = useCallback((contact: TrustedContact) => {
    console.log('[SupportContacts] Adding contact:', contact.name);
    const updated = [...contacts, contact];
    updateProfile({ trustedContacts: updated });
  }, [contacts, updateProfile]);

  const updateContact = useCallback((id: string, updates: Partial<TrustedContact>) => {
    console.log('[SupportContacts] Updating contact:', id);
    const updated = contacts.map(c =>
      c.id === id ? { ...c, ...updates } : c,
    );
    updateProfile({ trustedContacts: updated });
  }, [contacts, updateProfile]);

  const removeContact = useCallback((id: string) => {
    console.log('[SupportContacts] Removing contact:', id);
    const updated = contacts.filter(c => c.id !== id);
    updateProfile({ trustedContacts: updated });
  }, [contacts, updateProfile]);

  const replaceContact = useCallback((contact: TrustedContact) => {
    console.log('[SupportContacts] Replacing contact:', contact.id);
    const idx = contacts.findIndex(c => c.id === contact.id);
    if (idx >= 0) {
      const updated = [...contacts];
      updated[idx] = contact;
      updateProfile({ trustedContacts: updated });
    } else {
      addContact(contact);
    }
  }, [contacts, updateProfile, addContact]);

  return {
    contacts,
    crisisModeContacts,
    addContact,
    updateContact,
    removeContact,
    replaceContact,
    hasContacts: contacts.length > 0,
    hasCrisisContacts: crisisModeContacts.length > 0,
  };
}
