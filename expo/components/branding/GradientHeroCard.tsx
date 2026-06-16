import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { BrandTypography } from '@/constants/branding';

interface GradientHeroCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  variant?: 'navy' | 'teal' | 'warm';
}

export default function GradientHeroCard({
  title,
  subtitle,
  icon,
  onPress,
  variant = 'teal',
}: GradientHeroCardProps) {
  const bgColor = variant === 'navy' ? Colors.brandNavy
    : variant === 'warm' ? '#2E2A72'
    : Colors.brandTeal;

  const accentColor = variant === 'navy' ? Colors.brandTeal
    : variant === 'warm' ? Colors.brandAmber
    : '#FFFFFF';

  const content = (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.decorRing} />
      <View style={styles.decorDot} />
      <View style={styles.contentRow}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {onPress && (
          <ChevronRight size={18} color={accentColor} style={{ opacity: 0.6 }} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  contentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    zIndex: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...BrandTypography.subtitle,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(240, 237, 233, 0.65)',
    lineHeight: 18,
  },
  decorRing: {
    position: 'absolute' as const,
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  decorDot: {
    position: 'absolute' as const,
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
