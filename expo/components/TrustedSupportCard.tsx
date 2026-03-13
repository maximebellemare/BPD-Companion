import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Phone, MessageCircle, ChevronRight, Shield, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSupportContacts } from '@/hooks/useSupportContacts';
import {
  RELATIONSHIP_TYPE_COLORS,
  RELATIONSHIP_TYPE_LABELS,
  getContactInitials,
} from '@/services/support/supportContactService';
import { TrustedContact } from '@/types/profile';

interface TrustedSupportCardProps {
  variant?: 'home' | 'crisis';
  maxContacts?: number;
}

const TrustedSupportCard = React.memo(function TrustedSupportCard({
  variant = 'home',
  maxContacts = 3,
}: TrustedSupportCardProps) {
  const router = useRouter();
  const { contacts, crisisModeContacts, hasContacts } = useSupportContacts();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const displayContacts = variant === 'crisis' ? crisisModeContacts : contacts;

  useEffect(() => {
    if (variant === 'crisis') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [variant, pulseAnim]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleCall = useCallback((contact: TrustedContact) => {
    handleHaptic();
    if (contact.phone) {
      void Linking.openURL(`tel:${contact.phone}`);
    }
  }, [handleHaptic]);

  const handleText = useCallback((contact: TrustedContact) => {
    handleHaptic();
    const defaultMsg = encodeURIComponent(
      "I'm having a difficult moment and could use some support.",
    );
    if (contact.phone) {
      void Linking.openURL(`sms:${contact.phone}?body=${defaultMsg}`);
    } else if (contact.email) {
      void Linking.openURL(`mailto:${contact.email}?subject=Reaching out&body=${defaultMsg}`);
    }
  }, [handleHaptic]);

  const handleManage = useCallback(() => {
    handleHaptic();
    router.push('/profile/trusted-contacts' as never);
  }, [handleHaptic, router]);

  if (!hasContacts && variant === 'home') {
    return (
      <TouchableOpacity
        style={styles.emptyCard}
        onPress={handleManage}
        activeOpacity={0.7}
        testID="trusted-support-empty"
      >
        <View style={styles.emptyIconWrap}>
          <Heart size={18} color={Colors.primary} />
        </View>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>Trusted Support Network</Text>
          <Text style={styles.emptyDesc}>Add people you trust for moments of distress</Text>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  }

  if (displayContacts.length === 0) return null;

  const isCrisis = variant === 'crisis';
  const visibleContacts = displayContacts.slice(0, maxContacts);

  return (
    <Animated.View
      style={[
        isCrisis ? styles.crisisContainer : styles.homeContainer,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.headerIcon, isCrisis ? styles.headerIconCrisis : styles.headerIconHome]}>
          {isCrisis ? (
            <Shield size={16} color={Colors.danger} />
          ) : (
            <Users size={16} color="#3B82F6" />
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, isCrisis && styles.headerTitleCrisis]}>
            {isCrisis ? 'Reach out to someone you trust' : 'Trusted Support'}
          </Text>
          {isCrisis && (
            <Text style={styles.headerSubtitle}>
              You don't have to go through this alone
            </Text>
          )}
        </View>
      </View>

      {visibleContacts.map((contact) => {
        const color = RELATIONSHIP_TYPE_COLORS[contact.relationshipType];
        const initials = getContactInitials(contact.name);

        return (
          <View
            key={contact.id}
            style={[styles.contactRow, isCrisis && styles.contactRowCrisis]}
          >
            <View style={[styles.contactAvatar, { backgroundColor: color + '18' }]}>
              <Text style={[styles.contactAvatarText, { color }]}>{initials}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactType}>
                {RELATIONSHIP_TYPE_LABELS[contact.relationshipType]}
              </Text>
            </View>
            {contact.phone ? (
              <TouchableOpacity
                style={[styles.contactAction, styles.callAction]}
                onPress={() => handleCall(contact)}
                activeOpacity={0.7}
              >
                <Phone size={14} color={Colors.primary} />
              </TouchableOpacity>
            ) : null}
            {(contact.phone || contact.email) ? (
              <TouchableOpacity
                style={[styles.contactAction, styles.textAction]}
                onPress={() => handleText(contact)}
                activeOpacity={0.7}
              >
                <MessageCircle size={14} color="#3B82F6" />
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}

      {displayContacts.length > maxContacts && (
        <Text style={styles.moreText}>
          +{displayContacts.length - maxContacts} more contact{displayContacts.length - maxContacts !== 1 ? 's' : ''}
        </Text>
      )}

      {!isCrisis && (
        <TouchableOpacity
          style={styles.manageButton}
          onPress={handleManage}
          activeOpacity={0.7}
        >
          <Text style={styles.manageButtonText}>Manage Contacts</Text>
          <ChevronRight size={14} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
});

export default TrustedSupportCard;

const styles = StyleSheet.create({
  homeContainer: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  crisisContainer: {
    backgroundColor: '#FFF8F5',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FADDD3',
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconHome: {
    backgroundColor: '#E6F0FF',
  },
  headerIconCrisis: {
    backgroundColor: Colors.dangerLight,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  headerTitleCrisis: {
    color: '#C0392B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  contactRowCrisis: {
    borderBottomColor: '#F5DDD5',
  },
  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  contactType: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  contactAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  callAction: {
    backgroundColor: Colors.primaryLight,
  },
  textAction: {
    backgroundColor: '#E6F0FF',
  },
  moreText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 12,
    marginTop: 4,
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
