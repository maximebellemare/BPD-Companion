import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';
import { BRAND, BrandTypography } from '@/constants/branding';
import BrandLogo from './BrandLogo';

interface BrandHeroProps {
  contextMessage?: string;
  showFullBrand?: boolean;
}

export default function BrandHero({ contextMessage, showFullBrand = true }: BrandHeroProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.heroBackground}>
        <View style={styles.orbitRingOuter} />
        <View style={styles.orbitRingMid} />
        <View style={styles.orbitRingInner} />
        <View style={styles.heroContent}>
          <View style={styles.logoRow}>
            <BrandLogo size={54} variant="light" animated />
          </View>
          <Text style={styles.brandName}>{BRAND.name}</Text>
          {showFullBrand && (
            <Text style={styles.tagline}>{BRAND.shortTagline}</Text>
          )}
          {contextMessage && (
            <View style={styles.contextPill}>
              <Text style={styles.contextMessage}>{contextMessage}</Text>
            </View>
          )}
        </View>
        <View style={styles.glowAccent} />
        <View style={styles.glowAccent2} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  heroBackground: {
    backgroundColor: Colors.brandNavy,
    borderRadius: 26,
    paddingVertical: 30,
    paddingHorizontal: 24,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  heroContent: {
    alignItems: 'center' as const,
    zIndex: 2,
  },
  logoRow: {
    marginBottom: 14,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#F0EDE9',
    letterSpacing: -0.6,
    textAlign: 'center' as const,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'rgba(107, 170, 171, 0.9)',
    marginTop: 5,
    textAlign: 'center' as const,
    letterSpacing: 0.4,
  },
  contextPill: {
    marginTop: 14,
    backgroundColor: 'rgba(74, 139, 141, 0.12)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  contextMessage: {
    ...BrandTypography.body,
    color: 'rgba(240, 237, 233, 0.75)',
    textAlign: 'center' as const,
    fontSize: 14,
  },
  orbitRingOuter: {
    position: 'absolute' as const,
    top: -70,
    right: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(74, 139, 141, 0.08)',
  },
  orbitRingMid: {
    position: 'absolute' as const,
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 0.8,
    borderColor: 'rgba(155, 142, 196, 0.06)',
  },
  orbitRingInner: {
    position: 'absolute' as const,
    bottom: -45,
    left: -45,
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(155, 142, 196, 0.07)',
  },
  glowAccent: {
    position: 'absolute' as const,
    top: 15,
    right: 30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(74, 139, 141, 0.06)',
  },
  glowAccent2: {
    position: 'absolute' as const,
    bottom: 10,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(155, 142, 196, 0.04)',
  },
});
