import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import {
  markNeverAskAgain,
  markReviewCompleted,
  markReviewPromptDismissed,
  maybeShowReviewPrompt as maybeShowReviewPromptFromService,
  requestAppReview,
  ReviewMoodContext,
  ReviewPromptTrigger,
} from '@/services/review/reviewPromptService';

type ReviewPromptContextValue = {
  maybeShowReviewPrompt: (trigger: ReviewPromptTrigger, context?: ReviewMoodContext) => Promise<void>;
  openManualReviewPrompt: () => void;
};

const ReviewPromptContext = createContext<ReviewPromptContextValue | null>(null);

export function ReviewPromptProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const hasShownThisSession = useRef(false);

  const userId = user?.id ?? null;

  const showPrompt = useCallback(() => {
    if (Platform.OS === 'web') return;
    hasShownThisSession.current = true;
    setVisible(true);
  }, []);

  const maybeShowReviewPrompt = useCallback(async (
    trigger: ReviewPromptTrigger,
    context?: ReviewMoodContext,
  ) => {
    if (hasShownThisSession.current) return;
    const shouldShow = await maybeShowReviewPromptFromService(trigger, userId, context);
    if (shouldShow) showPrompt();
  }, [showPrompt, userId]);

  const openManualReviewPrompt = useCallback(() => {
    showPrompt();
  }, [showPrompt]);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const handleRate = useCallback(async () => {
    close();
    await requestAppReview(userId);
    await markReviewCompleted(userId);
  }, [close, userId]);

  const handleMaybeLater = useCallback(async () => {
    close();
    await markReviewPromptDismissed(userId);
  }, [close, userId]);

  const handleAlreadyReviewed = useCallback(async () => {
    close();
    await markReviewCompleted(userId);
  }, [close, userId]);

  const handleNeverAskAgain = useCallback(async () => {
    close();
    await markNeverAskAgain(userId);
  }, [close, userId]);

  const value = useMemo<ReviewPromptContextValue>(() => ({
    maybeShowReviewPrompt,
    openManualReviewPrompt,
  }), [maybeShowReviewPrompt, openManualReviewPrompt]);

  return (
    <ReviewPromptContext.Provider value={value}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleMaybeLater}
      >
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
              <Star size={24} color={Colors.brandTeal} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Enjoying BPD Companion?</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              If the app is helping you, a quick review would mean a lot and helps more people find it.
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => void handleRate()}
              activeOpacity={0.84}
              testID="review-rate-app-btn"
            >
              <Text style={styles.primaryButtonText}>Rate the app</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={() => void handleMaybeLater()}
              activeOpacity={0.78}
              testID="review-maybe-later-btn"
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Maybe later</Text>
            </TouchableOpacity>

            <View style={styles.textButtonRow}>
              <TouchableOpacity
                onPress={() => void handleAlreadyReviewed()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                testID="review-already-reviewed-btn"
              >
                <Text style={[styles.textButton, { color: colors.primary }]}>I already reviewed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void handleNeverAskAgain()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                testID="review-never-ask-btn"
              >
                <Text style={[styles.textButton, { color: colors.textMuted }]}>Don’t ask again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ReviewPromptContext.Provider>
  );
}

export function useReviewPrompt() {
  const context = useContext(ReviewPromptContext);
  if (!context) {
    throw new Error('useReviewPrompt must be used within ReviewPromptProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 42, 67, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  textButtonRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  textButton: {
    fontSize: 13,
    fontWeight: '700',
  },
});
