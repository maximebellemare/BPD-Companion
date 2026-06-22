import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { X, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useNotificationEntry } from '@/providers/NotificationEntryProvider';

interface NotificationEntryBannerProps {
  onDismiss?: () => void;
  onAction?: () => void;
  compact?: boolean;
}

export default function NotificationEntryBanner({
  onDismiss,
  onAction,
  compact = false,
}: NotificationEntryBannerProps) {
  const { entryState, clearEntry, markFlowStarted } = useNotificationEntry();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (entryState.active) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      markFlowStarted();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [entryState.active, slideAnim, opacityAnim, markFlowStarted]);

  const handleDismiss = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    clearEntry();
    onDismiss?.();
  }, [clearEntry, onDismiss]);

  const handleAction = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onAction?.();
  }, [onAction]);

  if (!entryState.active) return null;

  const getCategoryAccent = (): string => {
    switch (entryState.category) {
      case 'relationship_support': return '#D9E2EC';
      case 'calm_followup':
      case 'regulation_followup': return '#D9E2EC';
      case 'weekly_reflection': return '#D9E2EC';
      case 'therapist_report': return '#D9E2EC';
      case 'ritual_reminder': return '#D9E2EC';
      default: return Colors.primaryLight;
    }
  };

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          { backgroundColor: getCategoryAccent() },
          { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
        ]}
      >
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {entryState.entryTitle}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.compactDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: getCategoryAccent() }]} />
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.title}>{entryState.entryTitle}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {entryState.entrySubtitle}
          </Text>
        </View>
        <View style={styles.actions}>
          {onAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAction}
              activeOpacity={0.7}
            >
              <ArrowRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden' as const,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
    gap: 12,
  },
  textContent: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  compactContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  compactDismiss: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
