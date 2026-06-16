import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  X,
  MessageCircle,
  Mail,
  Bug,
  Lightbulb,
  Heart,
  Star,
  Send,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Shield,
  FileText,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { BRAND } from '@/constants/branding';

type FeedbackType = 'bug' | 'feature' | 'general' | 'appreciation';

const FEEDBACK_TYPES: { id: FeedbackType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'bug', label: 'Bug Report', icon: <Bug size={18} color={Colors.danger} />, color: Colors.dangerLight },
  { id: 'feature', label: 'Feature Idea', icon: <Lightbulb size={18} color={Colors.accent} />, color: Colors.accentLight },
  { id: 'general', label: 'General Feedback', icon: <MessageCircle size={18} color="#3B82F6" />, color: '#FFFFFF' },
  { id: 'appreciation', label: 'Appreciation', icon: <Heart size={18} color="#3B82F6" />, color: '#FFFFFF' },
];

const FAQ_ITEMS = [
  { q: 'Is my data private?', a: 'Yes. All data is stored locally on your device by default. See our Privacy Policy for details.' },
  { q: 'How do I cancel my subscription?', a: 'You can manage subscriptions through your device settings (App Store or Google Play).' },
  { q: 'Can I delete my data?', a: 'Yes. Go to Profile > Delete My Data to remove specific categories or all data.' },
  { q: 'Is the AI a real therapist?', a: 'No. The AI companion is a self-help tool, not a substitute for professional mental health care.' },
];

export default function SupportFeedbackScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!feedbackType || !feedbackText.trim()) {
      Alert.alert('Missing Information', 'Please select a feedback type and write your message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackEntry = {
        id: Date.now().toString(),
        type: feedbackType,
        text: feedbackText.trim(),
        rating,
        createdAt: Date.now(),
      };

      const existing = await AsyncStorage.getItem('user_feedback');
      const feedbackList = existing ? JSON.parse(existing) : [];
      feedbackList.push(feedbackEntry);
      await AsyncStorage.setItem('user_feedback', JSON.stringify(feedbackList));

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setSubmitted(true);
      console.log('[Feedback] Submitted');
    } catch (error) {
      console.error('[Feedback] Error submitting:', error);
      Alert.alert('Error', 'Could not save your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackType, feedbackText, rating]);

  const handleEmail = useCallback(() => {
    void Linking.openURL('mailto:support@bpdcompanion.app?subject=BPD%20Companion%20Support');
  }, []);

  const resetForm = useCallback(() => {
    setFeedbackType(null);
    setFeedbackText('');
    setRating(0);
    setSubmitted(false);
  }, []);

  if (submitted) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} testID="close-btn">
            <X size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support & Feedback</Text>
          <View style={styles.closeBtn} />
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Heart size={36} color={Colors.brandTeal} />
          </View>
          <Text style={styles.successTitle}>Thank You</Text>
          <Text style={styles.successDesc}>
            Your feedback helps us make {BRAND.name} better for everyone. We read every message.
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={resetForm} testID="send-more-btn">
            <Text style={styles.successBtnText}>Send More Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.successBtnSecondary} onPress={() => router.back()} testID="done-btn">
            <Text style={styles.successBtnSecondaryText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Support & Feedback</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.quickLinks}>
            <Text style={styles.sectionLabel}>QUICK LINKS</Text>
            <View style={styles.linksGroup}>
              <TouchableOpacity style={styles.linkRow} onPress={handleEmail} testID="email-support-btn">
                <View style={[styles.linkIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Mail size={16} color="#3B82F6" />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle}>Email Support</Text>
                  <Text style={styles.linkDesc}>support@bpdcompanion.app</Text>
                </View>
                <ExternalLink size={14} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.push('/privacy-policy' as never)}
                testID="privacy-link"
              >
                <View style={[styles.linkIcon, { backgroundColor: Colors.brandTealSoft }]}>
                  <Shield size={16} color={Colors.brandTeal} />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle}>Privacy Policy</Text>
                  <Text style={styles.linkDesc}>How we protect your data</Text>
                </View>
                <ChevronRight size={14} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.push('/terms-of-service' as never)}
                testID="terms-link"
              >
                <View style={[styles.linkIcon, { backgroundColor: Colors.surface }]}>
                  <FileText size={16} color={Colors.brandNavy} />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle}>Terms of Service</Text>
                  <Text style={styles.linkDesc}>Usage terms and conditions</Text>
                </View>
                <ChevronRight size={14} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.linkRow, styles.linkRowLast]}
                onPress={() => router.push('/data-deletion' as never)}
                testID="data-deletion-link"
              >
                <View style={[styles.linkIcon, { backgroundColor: Colors.dangerLight }]}>
                  <Trash2 size={16} color={Colors.danger} />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle}>Delete My Data</Text>
                  <Text style={styles.linkDesc}>Remove your personal data</Text>
                </View>
                <ChevronRight size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.feedbackSection}>
            <Text style={styles.sectionLabel}>SEND FEEDBACK</Text>

            <Text style={styles.feedbackPrompt}>What type of feedback?</Text>
            <View style={styles.typeGrid}>
              {FEEDBACK_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    feedbackType === type.id && styles.typeCardActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setFeedbackType(type.id);
                  }}
                  testID={`type-${type.id}`}
                >
                  <View style={[styles.typeIconWrap, { backgroundColor: type.color }]}>
                    {type.icon}
                  </View>
                  <Text style={[
                    styles.typeLabel,
                    feedbackType === type.id && styles.typeLabelActive,
                  ]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.feedbackPrompt}>How would you rate your experience?</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setRating(star);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  testID={`star-${star}`}
                >
                  <Star
                    size={32}
                    color={star <= rating ? Colors.accent : Colors.border}
                    fill={star <= rating ? Colors.accent : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.feedbackPrompt}>Your message</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Tell us what's on your mind..."
              placeholderTextColor={Colors.textMuted}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              testID="feedback-input"
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!feedbackType || !feedbackText.trim()) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmitFeedback}
              disabled={isSubmitting || !feedbackType || !feedbackText.trim()}
              activeOpacity={0.8}
              testID="submit-feedback-btn"
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Send size={16} color={Colors.white} />
                  <Text style={styles.submitBtnText}>Send Feedback</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.faqSection}>
            <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
            <View style={styles.faqGroup}>
              {FAQ_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.faqRow, index === FAQ_ITEMS.length - 1 && styles.faqRowLast]}
                  onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  activeOpacity={0.7}
                  testID={`faq-${index}`}
                >
                  <View style={styles.faqHeader}>
                    <HelpCircle size={16} color={Colors.brandTeal} />
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                  </View>
                  {expandedFaq === index && (
                    <Text style={styles.faqAnswer}>{item.a}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
  },
  quickLinks: {
    marginBottom: 28,
  },
  linksGroup: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden' as const,
  },
  linkRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  linkRowLast: {
    borderBottomWidth: 0,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.brandNavy,
  },
  linkDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  feedbackSection: {
    marginBottom: 28,
  },
  feedbackPrompt: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 20,
  },
  typeCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    gap: 8,
    width: '48%' as unknown as number,
  },
  typeCardActive: {
    borderColor: Colors.brandTeal,
    backgroundColor: Colors.brandTealSoft,
  },
  typeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    flex: 1,
  },
  typeLabelActive: {
    color: Colors.brandNavy,
  },
  ratingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    justifyContent: 'center' as const,
    marginBottom: 20,
    paddingVertical: 8,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 120,
    lineHeight: 22,
    marginBottom: 16,
  },
  submitBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.brandTeal,
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  faqSection: {
    marginBottom: 20,
  },
  faqGroup: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden' as const,
  },
  faqRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  faqRowLast: {
    borderBottomWidth: 0,
  },
  faqHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.brandNavy,
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginTop: 10,
    paddingLeft: 26,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 40,
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  successBtn: {
    backgroundColor: Colors.brandTeal,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginBottom: 12,
  },
  successBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  successBtnSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  successBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  bottomSpacer: {
    height: 30,
  },
});
