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
import { X, Shield, Lock, Eye, Server, Trash2, Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Colors from '@/constants/colors';
import { BRAND } from '@/constants/branding';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  index: number;
  fadeAnim: Animated.Value;
}

function PolicySection({ icon, title, children, index, fadeAnim }: SectionProps) {
  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [12 + index * 4, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </Animated.View>
  );
}

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation('legal');
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sections = t('privacy.sections', { returnObjects: true, brand: BRAND.name }) as {
    title: string;
    body: string[];
    bullets: string[];
  }[];
  const icons = [
    <Eye key="eye" size={16} color={Colors.brandTeal} />,
    <Lock key="lock" size={16} color="#3B82F6" />,
    <Server key="server" size={16} color={Colors.accent} />,
    <Trash2 key="trash" size={16} color={Colors.danger} />,
    <Mail key="mail" size={16} color={Colors.brandMist} />,
  ];

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
        <Text style={styles.headerTitle}>{t('privacy.title')}</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
          <View style={styles.heroIconWrap}>
            <Shield size={28} color={Colors.brandTeal} />
          </View>
          <Text style={styles.heroTitle}>{t('privacy.heroTitle')}</Text>
          <Text style={styles.heroDesc}>
            {t('privacy.heroDescription', { brand: BRAND.name })}
          </Text>
          <View style={styles.updatedBadge}>
            <Text style={styles.updatedText}>{t('privacy.lastUpdatedLabel', { date: t('privacy.lastUpdated') })}</Text>
          </View>
        </Animated.View>

        {sections.map((section, index) => (
          <PolicySection
            key={section.title}
            icon={icons[index] ?? icons[0]}
            title={section.title}
            index={index}
            fadeAnim={fadeAnim}
          >
            <Text style={styles.bodyText}>{section.body[0]}</Text>
            {section.bullets.length > 0 && (
              <View style={styles.bulletList}>
                {section.bullets.map(item => (
                  <Text key={item} style={styles.bulletItem}>{item}</Text>
                ))}
              </View>
            )}
            {index === 4 && (
              <View style={styles.contactCard}>
                <Text style={styles.contactLabel}>{t('privacy.email')}</Text>
                <Text style={styles.contactValue}>{t('privacy.contactEmail')}</Text>
              </View>
            )}
            {section.body.slice(1).map(item => (
              <Text key={item} style={index === 4 ? styles.bodyTextMuted : styles.bodyText}>{item}</Text>
            ))}
          </PolicySection>
        ))}

        <View style={styles.footerNotice}>
          <Text style={styles.footerNoticeText}>
            {t('privacy.footer', { brand: BRAND.name })}
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
    backgroundColor: Colors.brandTealSoft,
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
    shadowColor: 'rgba(74,139,141,0.15)',
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
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
  bodyTextMuted: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    marginTop: 8,
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
  footerNotice: {
    marginTop: 10,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
  },
  footerNoticeText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    textAlign: 'center' as const,
  },
  bottomSpacer: {
    height: 30,
  },
});
