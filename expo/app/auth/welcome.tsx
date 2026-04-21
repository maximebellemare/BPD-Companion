import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Shield, Cloud, Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { BRAND } from '@/constants/branding';
import { useAuth } from '@/providers/AuthProvider';

export default function WelcomeScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  const handleSignUp = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth/sign-up');
  }, [router]);

  const handleSignIn = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth/sign-in');
  }, [router]);

  const handleGuest = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const proceed = () => {
      continueAsGuest();
    };
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(
        'Continue as guest?\n\nYour journal entries, check-ins, moods, medications, and all other data will only live on this device. If you delete the app, switch devices, or clear data — it will be permanently lost.\n\nYou can create an account anytime later.',
      ) : true;
      if (ok) proceed();
      return;
    }
    Alert.alert(
      'Continue as guest?',
      'Your journal entries, check-ins, moods, medications, and all other data will only live on this device. If you delete the app, switch devices, or clear data — it will be permanently lost.\n\nYou can create an account anytime later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue as guest', style: 'destructive', onPress: proceed },
      ],
    );
  }, [continueAsGuest]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Shield size={14} color={Colors.brandTeal} />
          <Text style={styles.badgeText} testID="auth-badge">Private & encrypted</Text>
        </View>
        <Text style={styles.title}>{BRAND.name}</Text>
        <Text style={styles.subtitle}>{BRAND.tagline}</Text>

        <View style={styles.illustration}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
        </View>
      </View>

      <View style={styles.features}>
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Cloud size={18} color={Colors.brandTeal} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Synced across devices</Text>
            <Text style={styles.featureSub}>Your entries, moods, and progress stay with you</Text>
          </View>
        </View>
        <View style={styles.feature}>
          <View style={[styles.featureIcon, { backgroundColor: Colors.brandLilacSoft }]}>
            <Lock size={18} color={Colors.brandLilac} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Built for privacy</Text>
            <Text style={styles.featureSub}>Only you see what you write — encrypted in transit</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignUp}
          activeOpacity={0.9}
          testID="auth-sign-up"
        >
          <Text style={styles.primaryButtonText}>Create account</Text>
          <ArrowRight size={18} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSignIn}
          activeOpacity={0.8}
          testID="auth-sign-in"
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostButton}
          onPress={handleGuest}
          activeOpacity={0.7}
          testID="auth-guest"
        >
          <Text style={styles.ghostButtonText}>Continue as guest</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  hero: {
    flex: 1,
    paddingTop: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.brandTealSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 18,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 22,
  },
  illustration: {
    flex: 1,
    marginTop: 24,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.brandTealSoft,
    minHeight: 200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27,40,56,0.08)',
  },
  features: {
    gap: 14,
    marginVertical: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.brandNavy,
  },
  featureSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    gap: 10,
    paddingBottom: 8,
  },
  primaryButton: {
    backgroundColor: Colors.brandNavy,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 15,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.brandNavy,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  ghostButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500' as const,
    textDecorationLine: 'underline',
  },
});
