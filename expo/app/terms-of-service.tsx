import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { X, FileText, CheckCircle, AlertTriangle, CreditCard, Scale } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Colors from '@/constants/colors';
import { BRAND } from '@/constants/branding';

interface SectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

function TermsSection({ number, title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{number}</Text>
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function TermsOfServiceScreen() {
  const { t } = useTranslation('legal');
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sections = t('terms.sections', { returnObjects: true, brand: BRAND.name }) as {
    title: string;
    body: string[];
    bullets: string[];
    warning?: string;
    label?: string;
  }[];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID="close-btn"
        >
          <X size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('terms.title')}</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
          <View style={styles.heroIconWrap}>
            <FileText size={28} color={Colors.brandNavy} />
          </View>
          <Text style={styles.heroTitle}>{t('terms.title')}</Text>
          <Text style={styles.heroDesc}>
            {t('terms.heroDescription', { brand: BRAND.name })}
          </Text>
          <View style={styles.updatedBadge}>
            <Text style={styles.updatedText}>{t('terms.effectiveLabel', { date: t('terms.lastUpdated') })}</Text>
          </View>
        </Animated.View>

        {sections.map((section, index) => (
          <TermsSection key={section.title} number={`${index + 1}`} title={section.title}>
            {section.warning && (
              <View style={styles.warningCard}>
                <AlertTriangle size={16} color={Colors.accent} />
                <Text style={styles.warningText}>{section.warning}</Text>
              </View>
            )}
            {section.label && (
              <View style={styles.iconRow}>
                {index === 3 ? <CreditCard size={16} color={Colors.brandTeal} /> : <Scale size={16} color="#3B82F6" />}
                <Text style={styles.iconRowText}>{section.label}</Text>
              </View>
            )}
            {section.body.map(item => (
              <Text key={item} style={styles.bodyText}>{item}</Text>
            ))}
            {section.bullets.length > 0 && (
              <View style={styles.bulletList}>
                {section.bullets.map(item => (
                  <Text key={item} style={styles.bulletItem}>{item}</Text>
                ))}
              </View>
            )}
            {index === 8 && (
              <View style={styles.contactCard}>
                <Text style={styles.contactLabel}>{t('terms.email')}</Text>
                <Text style={styles.contactValue}>{t('terms.contactEmail')}</Text>
              </View>
            )}
          </TermsSection>
        ))}

        <View style={styles.acceptanceCard}>
          <CheckCircle size={18} color={Colors.success} />
          <Text style={styles.acceptanceText}>
            {t('terms.acceptance', { brand: BRAND.name })}
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
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
    shadowColor: 'rgba(27,40,56,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  heroDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center' as const,
  },
  updatedBadge: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.white,
  },
  updatedText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 14,
    overflow: 'hidden' as const,
    shadowColor: 'rgba(27,40,56,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    paddingBottom: 0,
    gap: 10,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  numberText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.brandNavy,
    flex: 1,
  },
  sectionBody: {
    padding: 16,
    paddingTop: 12,
  },
  bodyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 10,
  },
  bulletList: {
    marginBottom: 10,
    gap: 6,
  },
  bulletItem: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    paddingLeft: 16,
  },
  warningCard: {
    flexDirection: 'row' as const,
    gap: 10,
    backgroundColor: Colors.accentLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'flex-start' as const,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
    lineHeight: 19,
  },
  iconRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  iconRowText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  contactCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  acceptanceCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
  },
  acceptanceText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  bottomSpacer: {
    height: 30,
  },
});
