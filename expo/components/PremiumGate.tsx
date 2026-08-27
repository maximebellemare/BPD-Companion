import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, Lock, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { PremiumFeature } from '@/types/subscription';
import { useEntitlements } from '@/hooks/useEntitlements';
import { getUpgradeReason } from '@/services/subscription/entitlementService';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showInline?: boolean;
}

export default function PremiumGate({ feature, children, fallback, showInline = false }: PremiumGateProps) {
  const { canAccess } = useEntitlements();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showInline) {
    return <InlineUpgradePrompt feature={feature} />;
  }

  return <FullUpgradePrompt feature={feature} />;
}

function InlineUpgradePrompt({ feature }: { feature: PremiumFeature }) {
  const router = useRouter();
  useLanguage();
  const reason = getUpgradeReason(feature);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/upgrade');
  }, [router]);

  return (
    <TouchableOpacity
      style={styles.inlineContainer}
      onPress={handlePress}
      activeOpacity={0.8}
      testID={`premium-gate-inline-${feature}`}
    >
      <View style={styles.inlineIconWrap}>
        <Lock size={14} color="#67E8F9" />
      </View>
      <Text style={styles.inlineText} numberOfLines={2}>{reason}</Text>
      <View style={styles.inlineArrow}>
        <ArrowRight size={14} color="#67E8F9" />
      </View>
    </TouchableOpacity>
  );
}

function FullUpgradePrompt({ feature }: { feature: PremiumFeature }) {
  const router = useRouter();
  useLanguage();
  const reason = getUpgradeReason(feature);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/upgrade');
  }, [router]);

  return (
    <Animated.View
      style={[
        styles.fullContainer,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={styles.fullIconWrap}>
        <Crown size={28} color="#67E8F9" />
      </View>
      <Text style={styles.fullTitle}>{localizedText('Membership required', 'Membresía requerida')}</Text>
      <Text style={styles.fullDescription}>{reason}</Text>
      <TouchableOpacity
        style={styles.fullButton}
        onPress={handlePress}
        activeOpacity={0.8}
        testID={`premium-gate-full-${feature}`}
      >
        <Crown size={16} color={Colors.white} />
        <Text style={styles.fullButtonText}>{localizedText('Start membership', 'Iniciar membresía')}</Text>
      </TouchableOpacity>
      <Text style={styles.fullFooter}>{localizedText('Free trial available', 'Prueba gratis disponible')}</Text>
    </Animated.View>
  );
}

export function PremiumInlinePrompt({ feature, message }: { feature: PremiumFeature; message?: string }) {
  const router = useRouter();
  const { canAccess } = useEntitlements();
  useLanguage();
  const reason = message ?? getUpgradeReason(feature);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/upgrade');
  }, [router]);

  if (canAccess(feature)) return null;

  return (
    <TouchableOpacity
      style={styles.inlinePromptContainer}
      onPress={handlePress}
      activeOpacity={0.8}
      testID={`premium-inline-${feature}`}
    >
      <View style={styles.inlinePromptIconWrap}>
        <Crown size={13} color="#67E8F9" />
      </View>
      <Text style={styles.inlinePromptText} numberOfLines={2}>{reason}</Text>
      <View style={styles.inlinePromptArrow}>
        <ArrowRight size={12} color="#67E8F9" />
      </View>
    </TouchableOpacity>
  );
}

export function PremiumBadge() {
  useLanguage();
  return (
    <View style={styles.badge} testID="premium-badge">
      <Crown size={10} color="#67E8F9" />
      <Text style={styles.badgeText}>{localizedText('MEMBER', 'MIEMBRO')}</Text>
    </View>
  );
}

export function PremiumLockOverlay({ feature, children }: { feature: PremiumFeature; children: React.ReactNode }) {
  const router = useRouter();
  const { canAccess } = useEntitlements();
  useLanguage();

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/upgrade');
  }, [router]);

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={styles.lockOverlayWrap}
      testID={`premium-lock-${feature}`}
    >
      {children}
      <View style={styles.lockOverlay}>
        <View style={styles.lockOverlayBadge}>
          <Lock size={12} color={Colors.white} />
          <Text style={styles.lockOverlayText}>{localizedText('Membership', 'Membresía')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inlinePromptContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  inlinePromptIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  inlinePromptText: {
    flex: 1,
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 17,
    fontWeight: '500' as const,
  },
  inlinePromptArrow: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 6,
  },
  inlineContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  inlineIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  inlineText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  inlineArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
  fullContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  fullIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#D9E2EC',
  },
  fullTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  fullDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 280,
  },
  fullButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  fullButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  fullFooter: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 14,
  },
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#67E8F9',
    letterSpacing: 0.5,
  },
  lockOverlayWrap: {
    position: 'relative' as const,
  },
  lockOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  lockOverlayBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(45,52,54,0.75)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  lockOverlayText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
