import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { Phone, MessageCircle, Heart, Wind, Shield, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { SafetyAssessment, CRISIS_RESOURCES } from '@/types/aiSafety';
import { getInterventionConfig } from '@/services/ai/aiSafetyService';

interface SafetyInterventionBannerProps {
  assessment: SafetyAssessment;
  onDismiss?: () => void;
  compact?: boolean;
}

export default React.memo(function SafetyInterventionBanner({
  assessment,
  onDismiss,
  compact = false,
}: SafetyInterventionBannerProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const config = getInterventionConfig(assessment);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleCall988 = () => {
    if (Platform.OS === 'web') {
      void Linking.openURL('https://988lifeline.org/');
    } else {
      void Linking.openURL('tel:988');
    }
  };

  const handleText988 = () => {
    if (Platform.OS === 'web') {
      void Linking.openURL('https://988lifeline.org/chat/');
    } else {
      void Linking.openURL('sms:988');
    }
  };

  const handleTextCrisisLine = () => {
    if (Platform.OS === 'web') {
      void Linking.openURL('https://www.crisistextline.org/');
    } else {
      void Linking.openURL('sms:741741&body=HOME');
    }
  };

  const handleGrounding = () => {
    router.push('/grounding-mode');
  };

  const handleCrisisMode = () => {
    router.push('/crisis-mode');
  };

  if (assessment.level === 'safe') return null;

  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, { opacity: fadeAnim }]} testID="safety-banner-compact">
        <View style={styles.compactInner}>
          <Shield size={16} color={Colors.danger} />
          <Text style={styles.compactText}>
            {assessment.level === 'crisis'
              ? 'You matter. Support is available 24/7.'
              : 'You\'re going through something heavy. Tools are here for you.'}
          </Text>
        </View>
        {config.showCrisisHotline && (
          <TouchableOpacity
            style={styles.compactAction}
            onPress={handleCall988}
            testID="safety-compact-988"
          >
            <Phone size={14} color={Colors.white} />
            <Text style={styles.compactActionText}>988</Text>
          </TouchableOpacity>
        )}
        {config.showGroundingTools && (
          <TouchableOpacity
            style={styles.compactGrounding}
            onPress={handleGrounding}
            testID="safety-compact-grounding"
          >
            <Wind size={14} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} testID="safety-banner">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Heart size={18} color={Colors.danger} />
          <Text style={styles.headerText}>
            {assessment.level === 'crisis'
              ? 'You\'re not alone right now'
              : 'Support is here for you'}
          </Text>
        </View>
        {onDismiss && assessment.level !== 'crisis' && (
          <TouchableOpacity onPress={onDismiss} testID="safety-banner-dismiss">
            <Text style={styles.dismissText}>Okay</Text>
          </TouchableOpacity>
        )}
      </View>

      {config.showCrisisHotline && (
        <View style={styles.crisisSection}>
          <TouchableOpacity
            style={styles.crisisButton}
            onPress={handleCall988}
            testID="safety-call-988"
          >
            <Phone size={18} color={Colors.white} />
            <View style={styles.crisisButtonTextContainer}>
              <Text style={styles.crisisButtonTitle}>
                {CRISIS_RESOURCES.hotline988.action}
              </Text>
              <Text style={styles.crisisButtonSubtitle}>
                {CRISIS_RESOURCES.hotline988.description}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textCrisisButton}
            onPress={handleText988}
            testID="safety-text-988"
          >
            <MessageCircle size={16} color={Colors.danger} />
            <Text style={styles.textCrisisLabel}>Text 988</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textCrisisButton}
            onPress={handleTextCrisisLine}
            testID="safety-crisis-text-line"
          >
            <MessageCircle size={16} color={Colors.danger} />
            <Text style={styles.textCrisisLabel}>{CRISIS_RESOURCES.crisisText.action}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.toolsSection}>
        {config.showGroundingTools && (
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleGrounding}
            testID="safety-grounding"
          >
            <Wind size={16} color={Colors.primary} />
            <Text style={styles.toolLabel}>Grounding</Text>
            <ChevronRight size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {config.showBreathingExercise && (
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleCrisisMode}
            testID="safety-breathing"
          >
            <Shield size={16} color={Colors.primary} />
            <Text style={styles.toolLabel}>Crisis mode</Text>
            <ChevronRight size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {config.showTrustedContactPrompt && (
        <View style={styles.contactPrompt}>
          <Text style={styles.contactText}>
            Is there someone you trust that you could reach out to right now?
          </Text>
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.safetyBg,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(196, 120, 120, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dismissText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  crisisSection: {
    gap: 8,
    marginBottom: 12,
  },
  crisisButton: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crisisButtonTextContainer: {
    flex: 1,
  },
  crisisButtonTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  crisisButtonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  textCrisisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(196, 120, 120, 0.2)',
  },
  textCrisisLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.danger,
  },
  toolsSection: {
    gap: 6,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    borderRadius: 10,
  },
  toolLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  contactPrompt: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196, 120, 120, 0.15)',
  },
  contactText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.safetyBg,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(196, 120, 120, 0.15)',
  },
  compactInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  compactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.danger,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  compactActionText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  compactGrounding: {
    padding: 4,
  },
});
