import { TrustedContact, ContactRelationshipType } from '@/types/profile';
import { localizedField, localizedFields, localizedText } from '@/lib/i18n/staticText';

const relationshipTypeLabels = {
  friend: 'Friend',
  partner: 'Partner',
  therapist: 'Therapist',
  family: 'Family',
  other: 'Other',
};

localizedField(relationshipTypeLabels, 'friend', 'Friend', 'Amistad');
localizedField(relationshipTypeLabels, 'partner', 'Partner', 'Pareja');
localizedField(relationshipTypeLabels, 'therapist', 'Therapist', 'Terapeuta');
localizedField(relationshipTypeLabels, 'family', 'Family', 'Familia');
localizedField(relationshipTypeLabels, 'other', 'Other', 'Otro');

export const RELATIONSHIP_TYPE_LABELS = relationshipTypeLabels as Record<ContactRelationshipType, string>;

export const RELATIONSHIP_TYPE_COLORS: Record<ContactRelationshipType, string> = {
  friend: '#3B82F6',
  partner: '#3B82F6',
  therapist: '#14B8A6',
  family: '#67E8F9',
  other: '#3B82F6',
};

export const SUPPORT_MESSAGE_TEMPLATES: { id: string; label: string; message: string }[] = [
  localizedFields({
    id: 'difficult_moment',
    label: 'Difficult moment',
    message: "I'm having a difficult moment and could use some support.",
  }, {
    label: { en: 'Difficult moment', es: 'Momento difícil' },
    message: {
      en: "I'm having a difficult moment and could use some support.",
      es: 'Estoy pasando por un momento difícil y me vendría bien un poco de apoyo.',
    },
  }),
  localizedFields({
    id: 'need_calm',
    label: 'Need help calming',
    message: "I may need help calming down. Could you talk with me for a bit?",
  }, {
    label: { en: 'Need help calming', es: 'Necesito calmarme' },
    message: {
      en: "I may need help calming down. Could you talk with me for a bit?",
      es: 'Quizá necesito ayuda para calmarme. ¿Podrías hablar conmigo un rato?',
    },
  }),
  localizedFields({
    id: 'just_listen',
    label: 'Just listen',
    message: "I'm going through something hard. I don't need advice — just someone to listen.",
  }, {
    label: { en: 'Just listen', es: 'Solo escuchar' },
    message: {
      en: "I'm going through something hard. I don't need advice — just someone to listen.",
      es: 'Estoy pasando por algo difícil. No necesito consejos; solo alguien que me escuche.',
    },
  }),
  localizedFields({
    id: 'check_in',
    label: 'Check in',
    message: "Can you check in on me? I'm not feeling like myself right now.",
  }, {
    label: { en: 'Check in', es: 'Preguntar cómo estoy' },
    message: {
      en: "Can you check in on me? I'm not feeling like myself right now.",
      es: '¿Puedes escribirme para ver cómo estoy? Ahora mismo no me siento como yo.',
    },
  }),
  localizedFields({
    id: 'safe_space',
    label: 'Need safe space',
    message: "I need to be around someone I feel safe with. Are you available?",
  }, {
    label: { en: 'Need safe space', es: 'Necesito un espacio seguro' },
    message: {
      en: "I need to be around someone I feel safe with. Are you available?",
      es: 'Necesito estar cerca de alguien con quien me sienta segura/o. ¿Estás disponible?',
    },
  }),
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
    return localizedText('Please enter a name.', 'Ingresa un nombre.');
  }
  if (!contact.phone.trim() && !contact.email.trim()) {
    return localizedText('Please enter a phone number or email.', 'Ingresa un número de teléfono o correo electrónico.');
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
