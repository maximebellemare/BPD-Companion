import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { X, Heart, AlertTriangle, Phone, Shield, Stethoscope, HandHeart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { BRAND } from '@/constants/branding';

const CRISIS_RESOURCES = [
  {
    name: '988 Suicide & Crisis Lifeline',
    description: 'Call or text 988 for free, 24/7 support',
    phone: '988',
    color: Colors.danger,
  },
  {
    name: 'Crisis Text Line',
    description: 'Text HOME to 741741',
    phone: '741741',
    color: '#3B82F6',
  },
  {
    name: 'NAMI Helpline',
    description: '1-800-950-NAMI (6264)',
    phone: '18009506264',
    color: Colors.success,
  },
  {
    name: 'International Association for Suicide Prevention',
    description: 'Find resources in your country',
    url: 'https://www.iasp.info/resources/Crisis_Centres/',
    color: Colors.brandLilac,
  },
];

export default function MentalHealthDisclaimerScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleCall = (phone: string) => {
    if (Platform.OS === 'web') {
      void Linking.openURL(`tel:${phone}`);
    } else {
      void Linking.openURL(`tel:${phone}`);
    }
  };

  const handleOpenURL = (url: string) => {
    void Linking.openURL(url);
  };

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
        <Text style={styles.headerTitle}>Mental Health Disclaimer</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
          <View style={styles.heroIconWrap}>
            <Heart size={28} color={Colors.danger} />
          </View>
          <Text style={styles.heroTitle}>Important Information</Text>
          <Text style={styles.heroDesc}>
            Please read this carefully before using {BRAND.name}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.primaryWarning, { opacity: fadeAnim }]}>
          <AlertTriangle size={20} color={Colors.accent} />
          <Text style={styles.primaryWarningText}>
            {BRAND.name} is a self-help companion app. It is NOT a replacement for professional mental health care, therapy, diagnosis, or medication.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Stethoscope size={16} color={Colors.brandTeal} />
            <Text style={styles.sectionTitle}>What This App Is</Text>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.checkList}>
              <Text style={styles.checkItem}>A tool for emotional awareness and self-reflection</Text>
              <Text style={styles.checkItem}>A companion for practicing communication skills</Text>
              <Text style={styles.checkItem}>A journaling and mood-tracking space</Text>
              <Text style={styles.checkItem}>A supplement to professional treatment</Text>
              <Text style={styles.checkItem}>A space to practice DBT-inspired coping skills</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Shield size={16} color={Colors.danger} />
            <Text style={styles.sectionTitle}>What This App Is Not</Text>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.crossList}>
              <Text style={styles.crossItem}>Not a therapist or mental health professional</Text>
              <Text style={styles.crossItem}>Not a diagnostic tool</Text>
              <Text style={styles.crossItem}>Not a substitute for medication management</Text>
              <Text style={styles.crossItem}>Not an emergency or crisis service</Text>
              <Text style={styles.crossItem}>Not qualified to provide clinical advice</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <HandHeart size={16} color="#3B82F6" />
            <Text style={styles.sectionTitle}>AI-Generated Content</Text>
          </View>
          <View style={styles.sectionBody}>
            <Text style={styles.bodyText}>
              The AI companion, message analysis, and insight features use artificial intelligence to generate responses. These responses are:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>Not clinical advice</Text>
              <Text style={styles.bulletItem}>Not always accurate or appropriate for your situation</Text>
              <Text style={styles.bulletItem}>Generated based on patterns, not professional assessment</Text>
              <Text style={styles.bulletItem}>Meant to support reflection, not replace expert guidance</Text>
            </View>
            <Text style={styles.bodyText}>
              Always consult with qualified mental health professionals for clinical decisions.
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.crisisSection, { opacity: fadeAnim }]}>
          <View style={styles.crisisHeader}>
            <Phone size={18} color={Colors.white} />
            <Text style={styles.crisisTitle}>Crisis Resources</Text>
          </View>
          <Text style={styles.crisisDesc}>
            If you or someone you know is in immediate danger or experiencing a mental health crisis, please contact one of these resources:
          </Text>
          <View style={styles.resourcesList}>
            {CRISIS_RESOURCES.map((resource, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resourceCard}
                onPress={() => {
                  if (resource.phone) {
                    handleCall(resource.phone);
                  } else if (resource.url) {
                    handleOpenURL(resource.url);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.resourceDot, { backgroundColor: resource.color }]} />
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceName}>{resource.name}</Text>
                  <Text style={styles.resourceDesc}>{resource.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={styles.footerCard}>
          <Text style={styles.footerText}>
            We care deeply about your wellbeing. If you're struggling, please reach out to a mental health professional. You deserve real, qualified support.
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
    backgroundColor: Colors.dangerLight,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
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
  primaryWarning: {
    flexDirection: 'row' as const,
    gap: 12,
    backgroundColor: Colors.accentLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    alignItems: 'flex-start' as const,
    borderWidth: 1,
    borderColor: 'rgba(196,149,106,0.2)',
  },
  primaryWarningText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 22,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 14,
    overflow: 'hidden' as const,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    paddingBottom: 0,
    gap: 10,
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
  checkList: {
    gap: 8,
  },
  checkItem: {
    fontSize: 14,
    color: Colors.success,
    lineHeight: 20,
    paddingLeft: 8,
    fontWeight: '500' as const,
  },
  crossList: {
    gap: 8,
  },
  crossItem: {
    fontSize: 14,
    color: Colors.danger,
    lineHeight: 20,
    paddingLeft: 8,
    fontWeight: '500' as const,
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
  crisisSection: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  crisisHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 12,
  },
  crisisTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  crisisDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 21,
    marginBottom: 16,
  },
  resourcesList: {
    gap: 8,
  },
  resourceCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  resourceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: 2,
  },
  resourceDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  footerCard: {
    padding: 18,
    backgroundColor: Colors.brandTealSoft,
    borderRadius: 16,
    marginTop: 4,
  },
  footerText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
  bottomSpacer: {
    height: 30,
  },
});
