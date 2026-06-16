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
import Colors from '@/constants/colors';
import { BRAND } from '@/constants/branding';

const LAST_UPDATED = 'March 14, 2026';

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
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroDesc}>
            {BRAND.name} is designed with your emotional safety and data privacy at its core. We collect only what is necessary to provide you a meaningful experience.
          </Text>
          <View style={styles.updatedBadge}>
            <Text style={styles.updatedText}>Last updated: {LAST_UPDATED}</Text>
          </View>
        </Animated.View>

        <PolicySection
          icon={<Eye size={16} color={Colors.brandTeal} />}
          title="What We Collect"
          index={0}
          fadeAnim={fadeAnim}
        >
          <Text style={styles.bodyText}>
            We collect information you voluntarily provide, including:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>Journal entries and check-in data</Text>
            <Text style={styles.bulletItem}>Emotional state and mood information</Text>
            <Text style={styles.bulletItem}>Message drafts and communication patterns</Text>
            <Text style={styles.bulletItem}>Profile preferences and settings</Text>
            <Text style={styles.bulletItem}>Anonymous usage analytics</Text>
          </View>
          <Text style={styles.bodyText}>
            We do not collect your real name, phone contacts, location, or any data from outside this app unless you explicitly provide it.
          </Text>
        </PolicySection>

        <PolicySection
          icon={<Lock size={16} color="#3B82F6" />}
          title="How We Protect Your Data"
          index={1}
          fadeAnim={fadeAnim}
        >
          <Text style={styles.bodyText}>
            All personal data is stored locally on your device by default. If cloud sync is enabled, data is encrypted in transit and at rest.
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>End-to-end encryption for synced data</Text>
            <Text style={styles.bulletItem}>No third-party advertising or data selling</Text>
            <Text style={styles.bulletItem}>Optional biometric lock for app access</Text>
            <Text style={styles.bulletItem}>Anonymous community posting by default</Text>
          </View>
        </PolicySection>

        <PolicySection
          icon={<Server size={16} color={Colors.accent} />}
          title="AI Processing"
          index={2}
          fadeAnim={fadeAnim}
        >
          <Text style={styles.bodyText}>
            When you use AI-powered features (companion chat, message analysis, insights), your input is processed by our AI systems to generate responses.
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>AI conversations are not used to train models</Text>
            <Text style={styles.bulletItem}>Processing is done securely with encrypted connections</Text>
            <Text style={styles.bulletItem}>You can delete AI conversation history at any time</Text>
            <Text style={styles.bulletItem}>AI memory can be cleared from your profile settings</Text>
          </View>
        </PolicySection>

        <PolicySection
          icon={<Trash2 size={16} color={Colors.danger} />}
          title="Data Deletion"
          index={3}
          fadeAnim={fadeAnim}
        >
          <Text style={styles.bodyText}>
            You have the right to delete your data at any time. You can:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>Delete individual entries (journals, messages, etc.)</Text>
            <Text style={styles.bulletItem}>Clear AI companion memory</Text>
            <Text style={styles.bulletItem}>Request full account and data deletion</Text>
            <Text style={styles.bulletItem}>Export your data before deletion</Text>
          </View>
          <Text style={styles.bodyText}>
            Full data deletion can be requested through the app's Settings or by contacting support. Deletion is processed within 30 days.
          </Text>
        </PolicySection>

        <PolicySection
          icon={<Mail size={16} color={Colors.brandMist} />}
          title="Contact Us"
          index={4}
          fadeAnim={fadeAnim}
        >
          <Text style={styles.bodyText}>
            If you have questions about this privacy policy or your data, please reach out:
          </Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>support@bpdcompanion.app</Text>
          </View>
          <Text style={styles.bodyTextMuted}>
            We aim to respond to all privacy inquiries within 48 hours.
          </Text>
        </PolicySection>

        <View style={styles.footerNotice}>
          <Text style={styles.footerNoticeText}>
            By using {BRAND.name}, you agree to the collection and use of information in accordance with this policy. We may update this policy from time to time and will notify you of significant changes.
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
