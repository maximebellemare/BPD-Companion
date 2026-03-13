import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  CalmWavesIllustration,
  TangledToOrganizedIllustration,
  PauseIllustration,
  RippleIllustration,
  PathwayIllustration,
  LighthouseIllustration,
  ShieldHaloIllustration,
} from './IllustrationBase';

export type OnboardingTheme =
  | 'welcome'
  | 'emotions'
  | 'relationships'
  | 'pause'
  | 'awareness'
  | 'growth'
  | 'safety'
  | 'default';

interface OnboardingIllustrationProps {
  theme: OnboardingTheme;
  size?: number;
  variant?: 'light' | 'dark';
}

export default function OnboardingIllustration({
  theme,
  size = 140,
  variant = 'light',
}: OnboardingIllustrationProps) {
  const renderIllustration = () => {
    switch (theme) {
      case 'welcome':
        return <LighthouseIllustration size={size} variant={variant} />;
      case 'emotions':
        return <CalmWavesIllustration size={size} variant={variant} />;
      case 'relationships':
        return <TangledToOrganizedIllustration size={size} variant={variant} />;
      case 'pause':
        return <PauseIllustration size={size} variant={variant} />;
      case 'awareness':
        return <RippleIllustration size={size} variant={variant} />;
      case 'growth':
        return <PathwayIllustration size={size} variant={variant} />;
      case 'safety':
        return <ShieldHaloIllustration size={size} variant={variant} />;
      default:
        return <RippleIllustration size={size} variant={variant} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.glowBg, { width: size * 1.3, height: size * 1.3, borderRadius: size * 0.65 }]} />
      {renderIllustration()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  glowBg: {
    position: 'absolute' as const,
    backgroundColor: 'rgba(74, 139, 141, 0.04)',
  },
});
