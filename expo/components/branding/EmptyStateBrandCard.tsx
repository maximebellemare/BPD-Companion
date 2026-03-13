import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';
import { BrandTypography, BrandSpacing } from '@/constants/branding';

interface EmptyStateBrandCardProps {
  title: string;
  message: string;
  illustration?: React.ReactNode;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyStateBrandCard({
  title,
  message,
  illustration,
  icon,
  actionLabel,
  onAction,
}: EmptyStateBrandCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.illustrationWrap}>
        {illustration ?? icon ?? null}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  illustrationWrap: {
    marginBottom: 20,
  },
  title: {
    ...BrandTypography.subtitle,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  message: {
    ...BrandTypography.body,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  actionButton: {
    marginTop: 20,
    backgroundColor: Colors.brandTeal,
    borderRadius: BrandSpacing.buttonRadius,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: Colors.brandNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
