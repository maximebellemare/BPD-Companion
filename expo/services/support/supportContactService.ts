import { TrustedContact, ContactRelationshipType } from '@/types/profile';

export const RELATIONSHIP_TYPE_LABELS: Record<ContactRelationshipType, string> = {
  friend: 'Friend',
  partner: 'Partner',
  therapist: 'Therapist',
  family: 'Family',
  other: 'Other',
};

export const RELATIONSHIP_TYPE_COLORS: Record<ContactRelationshipType, string> = {
  friend: '#3B82F6',
  partner: '#E84393',
  therapist: '#6B9080',
  family: '#D4956A',
  other: '#8B5CF6',
};

export const SUPPORT_MESSAGE_TEMPLATES: { id: string; label: string; message: string }[] = [
  {
    id: 'difficult_moment',
    label: 'Difficult moment',
    message: "I'm having a difficult moment and could use some support.",
  },
  {
    id: 'need_calm',
    label: 'Need help calming',
    message: "I may need help calming down. Could you talk with me for a bit?",
  },
  {
    id: 'just_listen',
    label: 'Just listen',
    message: "I'm going through something hard. I don't need advice — just someone to listen.",
  },
  {
    id: 'check_in',
    label: 'Check in',
    message: "Can you check in on me? I'm not feeling like myself right now.",
  },
  {
    id: 'safe_space',
    label: 'Need safe space',
    message: "I need to be around someone I feel safe with. Are you available?",
  },
];

export function createEmptyContact(): TrustedContact {
  return {
    id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    relationshipType: 'friend',
    phone: '',
    email: '',
    preferredContactMethod: 'text',
    notes: '',
    showInCrisisMode: true,
    createdAt: Date.now(),
  };
}

export function validateContact(contact: TrustedContact): string | null {
  if (!contact.name.trim()) {
    return 'Please enter a name.';
  }
  if (!contact.phone.trim() && !contact.email.trim()) {
    return 'Please enter a phone number or email.';
  }
  return null;
}

export function getCrisisModeContacts(contacts: TrustedContact[]): TrustedContact[] {
  return contacts.filter(c => c.showInCrisisMode);
}

export function getContactInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
