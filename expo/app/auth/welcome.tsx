import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Shield, Brain, PauseCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { BRAND } from '@/constants/branding';
import BrandLogo from '@/components/branding/BrandLogo';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(['auth', 'common']);

  const handleSignUp = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth/sign-up');
  }, [router]);

  const handleSignIn = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth/sign-in');
  }, [router]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Shield size={14} color={Colors.brandTeal} />
          <Text style={styles.badgeText} testID="auth-badge">{t('auth:welcome.badge')}</Text>
        </View>
        <View style={styles.languageRow}>
          {(['en', 'es'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.languageChip, language === option && styles.languageChipActive]}
              onPress={() => void setLanguage(option)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: language === option }}
              testID={`language-${option}`}
            >
              <Text style={[styles.languageChipText, language === option && styles.languageChipTextActive]}>
                {option === 'es' ? t('common:spanish') : t('common:english')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{BRAND.name}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{BRAND.tagline}</Text>

        <View style={styles.illustration}>
          <BrandLogo size={108} animated />
          <View style={styles.bpdMark}>
            <Text style={styles.bpdLetters}>BPD Companion</Text>
          </View>
          <Text style={styles.heroText}>
            {t('auth:welcome.heroText')}
          </Text>
        </View>
      </View>

      <View style={styles.features}>
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Brain size={18} color={Colors.brandTeal} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t('auth:welcome.featurePatternsTitle')}</Text>
            <Text style={styles.featureSub}>{t('auth:welcome.featurePatternsBody')}</Text>
          </View>
        </View>
        <View style={styles.feature}>
          <View style={[styles.featureIcon, { backgroundColor: Colors.brandLilacSoft }]}>
            <PauseCircle size={18} color={Colors.brandLilac} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t('auth:welcome.featurePauseTitle')}</Text>
            <Text style={styles.featureSub}>{t('auth:welcome.featurePauseBody')}</Text>
          </View>
        </View>
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            {t('common:notTherapy')}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignUp}
          activeOpacity={0.9}
          testID="auth-sign-up"
        >
          <Text style={styles.primaryButtonText}>{t('auth:welcome.createAccount')}</Text>
          <ArrowRight size={18} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSignIn}
          activeOpacity={0.8}
          testID="auth-sign-in"
        >
          <Text style={styles.secondaryButtonText}>{t('auth:welcome.haveAccount')}</Text>
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
  languageRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    marginBottom: 16,
    gap: 4,
  },
  languageChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  languageChipActive: {
    backgroundColor: Colors.brandTealSoft,
  },
  languageChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  languageChipTextActive: {
    color: Colors.brandTeal,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 0,
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
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  bpdMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  bpdLetters: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: 0,
  },
  heroText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 14,
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
    color: Colors.text,
  },
  featureSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  disclaimerBox: {
    backgroundColor: Colors.brandLilacSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disclaimerText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    gap: 10,
    paddingBottom: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
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
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
