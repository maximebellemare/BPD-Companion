import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { PremiumFeature } from '@/types/subscription';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  inline?: boolean;
}

export default function PremiumGate({ feature, children, fallback, inline }: PremiumGateProps) {
  const { canAccessFeature } = useSubscription();
  const router = useRouter();

  const handleUpgrade = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/upgrade');
  }, [router]);

  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (inline) {
    return (
      <TouchableOpacity
        style={styles.inlineBanner}
        onPress={handleUpgrade}
        activeOpacity={0.7}
        testID={`premium-gate-${feature}`}
      >
        <View style={styles.inlineIconWrap}>
          <Lock size={14} color="#D4956A" />
        </View>
        <View style={styles.inlineTextWrap}>
          <Text style={styles.inlineTitle}>Premium Feature</Text>
          <Text style={styles.inlineDesc}>Upgrade to access this</Text>
        </View>
        <View style={styles.inlineUpgradeBtn}>
          <Crown size={12} color={Colors.white} />
          <Text style={styles.inlineUpgradeText}>Upgrade</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container} testID={`premium-gate-${feature}`}>
      <View style={styles.lockOverlay}>
        <View style={styles.lockBadge}>
          <Crown size={28} color="#D4956A" />
        </View>
        <Text style={styles.lockTitle}>Premium Feature</Text>
        <Text style={styles.lockDesc}>
          Unlock deeper insights and advanced support tools
        </Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handleUpgrade}
          activeOpacity={0.7}
        >
          <Crown size={16} color={Colors.white} />
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: 'hidden' as const,
    marginVertical: 8,
  },
  lockOverlay: {
    backgroundColor: '#FFF8F2',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    borderColor: '#F5E0CC',
    borderStyle: 'dashed' as const,
  },
  lockBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFF0E3',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  lockTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  lockDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 19,
    marginBottom: 18,
    maxWidth: 240,
  },
  upgradeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#D4956A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  inlineBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF8F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F5E0CC',
    marginVertical: 8,
  },
  inlineIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF0E3',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  inlineTextWrap: {
    flex: 1,
  },
  inlineTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  inlineDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  inlineUpgradeBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#D4956A',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  inlineUpgradeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
