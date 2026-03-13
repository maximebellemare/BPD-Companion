import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G, Rect, Ellipse, Line } from 'react-native-svg';

const PALETTE = {
  navy: '#1B2838',
  navyLight: '#243447',
  teal: '#4A8B8D',
  tealLight: '#6BAAAB',
  tealSoft: '#B8DAD9',
  lilac: '#9B8EC4',
  lilacLight: '#C4BBE0',
  sage: '#7FA68E',
  mist: '#8EAEC4',
  amber: '#C4956A',
  rose: '#C47878',
  cream: '#FAF8F5',
};

interface IllustrationProps {
  size?: number;
  variant?: 'light' | 'dark';
}

export function CalmWavesIllustration({ size = 120, variant = 'light' }: IllustrationProps) {
  const bg = variant === 'dark' ? PALETTE.navy : 'transparent';
  const w1 = variant === 'dark' ? PALETTE.tealLight : PALETTE.teal;
  const w2 = variant === 'dark' ? PALETTE.lilacLight : PALETTE.lilac;
  const w3 = variant === 'dark' ? PALETTE.mist : PALETTE.tealSoft;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {variant === 'dark' && <Rect x="0" y="0" width="120" height="120" rx="28" fill={bg} />}
        <Defs>
          <LinearGradient id="wg1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={w1} stopOpacity="0.6" />
            <Stop offset="1" stopColor={w1} stopOpacity="0.1" />
          </LinearGradient>
          <LinearGradient id="wg2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={w2} stopOpacity="0.5" />
            <Stop offset="1" stopColor={w2} stopOpacity="0.08" />
          </LinearGradient>
        </Defs>
        <Path
          d="M 10 70 Q 30 55 60 65 Q 90 75 110 60 L 110 90 Q 90 95 60 85 Q 30 75 10 90 Z"
          fill="url(#wg1)"
        />
        <Path
          d="M 10 80 Q 35 68 60 76 Q 85 84 110 72 L 110 100 Q 85 104 60 96 Q 35 88 10 100 Z"
          fill="url(#wg2)"
        />
        <Path
          d="M 15 62 Q 40 48 65 58 Q 90 68 105 55"
          stroke={w3}
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        <Circle cx="60" cy="38" r="12" fill={w1} opacity="0.15" />
        <Circle cx="60" cy="38" r="6" fill={w1} opacity="0.3" />
      </Svg>
    </View>
  );
}

export function RippleIllustration({ size = 120, variant = 'light' }: IllustrationProps) {
  const c1 = variant === 'dark' ? PALETTE.tealLight : PALETTE.teal;
  const c2 = variant === 'dark' ? PALETTE.lilacLight : PALETTE.lilac;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {variant === 'dark' && <Rect x="0" y="0" width="120" height="120" rx="28" fill={PALETTE.navy} />}
        <Circle cx="60" cy="60" r="40" stroke={c1} strokeWidth="1" fill="none" opacity="0.15" />
        <Circle cx="60" cy="60" r="30" stroke={c1} strokeWidth="1.2" fill="none" opacity="0.25" />
        <Circle cx="60" cy="60" r="20" stroke={c2} strokeWidth="1.5" fill="none" opacity="0.35" />
        <Circle cx="60" cy="60" r="10" fill={c1} opacity="0.2" />
        <Circle cx="60" cy="60" r="5" fill={c1} opacity="0.5" />
      </Svg>
    </View>
  );
}

export function LighthouseIllustration({ size = 120, variant = 'light' }: IllustrationProps) {
  const base = variant === 'dark' ? PALETTE.tealLight : PALETTE.teal;
  const beam = variant === 'dark' ? PALETTE.lilacLight : PALETTE.lilac;
  const glow = variant === 'dark' ? PALETTE.tealSoft : PALETTE.tealLight;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {variant === 'dark' && <Rect x="0" y="0" width="120" height="120" rx="28" fill={PALETTE.navy} />}
        <Defs>
          <LinearGradient id="lg_beam" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={beam} stopOpacity="0.6" />
            <Stop offset="1" stopColor={beam} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Ellipse cx="60" cy="40" rx="18" ry="18" fill={glow} opacity="0.12" />
        <Path
          d="M 48 28 L 60 10 L 72 28"
          fill="url(#lg_beam)"
        />
        <Rect x="52" y="45" width="16" height="36" rx="4" fill={base} opacity="0.7" />
        <Rect x="48" y="78" width="24" height="8" rx="3" fill={base} opacity="0.5" />
        <Circle cx="60" cy="40" r="8" fill={beam} opacity="0.6" />
        <Circle cx="60" cy="40" r="4" fill={beam} opacity="0.9" />
        <Line x1="60" y1="32" x2="60" y2="14" stroke={beam} strokeWidth="1.5" opacity="0.4" />
      </Svg>
    </View>
  );
}

export function PathwayIllustration({ size = 120, variant = 'light' }: IllustrationProps) {
  const line = variant === 'dark' ? PALETTE.tealLight : PALETTE.teal;
  const accent = variant === 'dark' ? PALETTE.lilacLight : PALETTE.lilac;
  const dot = variant === 'dark' ? PALETTE.sage : PALETTE.sage;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {variant === 'dark' && <Rect x="0" y="0" width="120" height="120" rx="28" fill={PALETTE.navy} />}
        <Path
          d="M 25 95 Q 35 70 50 65 Q 65 60 70 45 Q 75 30 95 25"
          stroke={line}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
        <Path
          d="M 25 95 Q 35 70 50 65 Q 65 60 70 45 Q 75 30 95 25"
          stroke={accent}
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="4 6"
          opacity="0.35"
        />
        <Circle cx="25" cy="95" r="4" fill={line} opacity="0.5" />
        <Circle cx="50" cy="65" r="3" fill={dot} opacity="0.5" />
        <Circle cx="70" cy="45" r="3" fill={accent} opacity="0.5" />
        <Circle cx="95" cy="25" r="6" fill={line} opacity="0.3" />
        <Circle cx="95" cy="25" r="3" fill={line} opacity="0.7" />
      </Svg>
    </View>
  );
}

export function PauseIllustration({ size = 120, variant = 'light' }: IllustrationProps) {
  const ring = variant === 'dark' ? PALETTE.tealLight : PALETTE.teal;
  const bar = variant === 'dark' ? PALETTE.lilacLight : PALETTE.lilac;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {variant === 'dark' && <Rect x="0" y="0" width="120" height="120" rx="28" fill={PALETTE.navy} />}
        <Circle cx="60" cy="60" r="38" stroke={ring} strokeWidth="2" fill="none" opacity="0.2" />
        <Circle cx="60" cy="60" r="32" stroke={ring} strokeWidth="1.5" fill={ring} fillOpacity="0.06" opacity="0.35" />
        <Rect x="48" y="42" width="8" height="36" rx="4" fill={bar} opacity="0.7" />
        <Rect x="64" y="42" width="8" height="36" rx="4" fill={bar} opacity="0.7" />
      </Svg>
    </View>
  );
}

export function TangledToOrganizedIllustration({ size = 120, variant = 'light' }: IllustrationProps) {
  const c1 = variant === 'dark' ? PALETTE.tealLight : PALETTE.teal;
  const c2 = variant === 'dark' ? PALETTE.lilacLight : PALETTE.lilac;
  const c3 = variant === 'dark' ? PALETTE.amber : PALETTE.amber;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {variant === 'dark' && <Rect x="0" y="0" width="120" height="120" rx="28" fill={PALETTE.navy} />}
        <G opacity="0.4">
          <Path d="M 15 60 Q 25 40 35 55 Q 45 70 30 50 Q 20 65 40 60" stroke={c3} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Path d="M 20 55 Q 30 75 25 45 Q 40 65 35 50" stroke={c2} strokeWidth="1" fill="none" strokeLinecap="round" />
        </G>
        <Path d="M 55 35 L 55 85" stroke={c1} strokeWidth="0.5" opacity="0.15" />
        <G opacity="0.7">
          <Path d="M 70 40 Q 85 38 100 40" stroke={c1} strokeWidth="2" fill="none" strokeLinecap="round" />
          <Path d="M 70 55 Q 85 53 100 55" stroke={c2} strokeWidth="2" fill="none" strokeLinecap="round" />
          <Path d="M 70 70 Q 85 68 100 70" stroke={c1} strokeWidth="2" fill="none" strokeLinecap="round" />
          <Path d="M 70 85 Q 85 83 100 85" stroke={c2} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
        </G>
        <Circle cx="66" cy="40" r="2.5" fill={c1} opacity="0.6" />
        <Circle cx="66" cy="55" r="2.5" fill={c2} opacity="0.6" />
        <Circle cx="66" cy="70" r="2.5" fill={c1} opacity="0.6" />
      </Svg>
    </View>
  );
}

export function ShieldHaloIllustration({ size = 120, variant = 'light' }: IllustrationProps) {
  const sh = variant === 'dark' ? PALETTE.tealLight : PALETTE.teal;
  const glow = variant === 'dark' ? PALETTE.lilacLight : PALETTE.lilac;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {variant === 'dark' && <Rect x="0" y="0" width="120" height="120" rx="28" fill={PALETTE.navy} />}
        <Circle cx="60" cy="55" r="35" fill={glow} opacity="0.08" />
        <Circle cx="60" cy="55" r="25" fill={glow} opacity="0.06" />
        <Path
          d="M 60 25 L 85 38 L 85 62 Q 85 82 60 95 Q 35 82 35 62 L 35 38 Z"
          stroke={sh}
          strokeWidth="2"
          fill={sh}
          fillOpacity="0.08"
          opacity="0.6"
        />
        <Path
          d="M 60 40 L 50 55 L 57 55 L 53 75 L 70 52 L 62 52 L 68 40 Z"
          fill={sh}
          opacity="0.35"
        />
      </Svg>
    </View>
  );
}

export function JournalRippleIllustration({ size = 120, variant = 'light' }: IllustrationProps) {
  const c1 = variant === 'dark' ? PALETTE.tealLight : PALETTE.teal;
  const c2 = variant === 'dark' ? PALETTE.lilacLight : PALETTE.lilac;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {variant === 'dark' && <Rect x="0" y="0" width="120" height="120" rx="28" fill={PALETTE.navy} />}
        <Rect x="32" y="25" width="56" height="70" rx="8" stroke={c1} strokeWidth="1.5" fill={c1} fillOpacity="0.05" />
        <Line x1="42" y1="42" x2="78" y2="42" stroke={c1} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <Line x1="42" y1="52" x2="72" y2="52" stroke={c2} strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
        <Line x1="42" y1="62" x2="68" y2="62" stroke={c1} strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
        <Circle cx="60" cy="75" r="8" stroke={c2} strokeWidth="1" fill="none" opacity="0.2" />
        <Circle cx="60" cy="75" r="4" fill={c2} opacity="0.25" />
      </Svg>
    </View>
  );
}

export function MedicationCalmIllustration({ size = 120, variant = 'light' }: IllustrationProps) {
  const c1 = variant === 'dark' ? PALETTE.tealLight : PALETTE.teal;
  const c2 = variant === 'dark' ? PALETTE.lilacLight : PALETTE.lilac;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {variant === 'dark' && <Rect x="0" y="0" width="120" height="120" rx="28" fill={PALETTE.navy} />}
        <Ellipse cx="60" cy="60" rx="22" ry="10" fill={c1} opacity="0.08" />
        <Rect x="44" y="35" width="32" height="50" rx="16" stroke={c1} strokeWidth="2" fill={c1} fillOpacity="0.06" />
        <Line x1="44" y1="60" x2="76" y2="60" stroke={c1} strokeWidth="1.5" opacity="0.3" />
        <Rect x="52" y="54" width="16" height="12" rx="2" fill={c2} opacity="0.2" />
        <Circle cx="60" cy="45" r="3" fill={c1} opacity="0.3" />
      </Svg>
    </View>
  );
}

export function GrowthLightIllustration({ size = 120, variant = 'light' }: IllustrationProps) {
  const c2 = variant === 'dark' ? PALETTE.sage : PALETTE.sage;
  const glow = variant === 'dark' ? PALETTE.lilacLight : PALETTE.lilac;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {variant === 'dark' && <Rect x="0" y="0" width="120" height="120" rx="28" fill={PALETTE.navy} />}
        <Defs>
          <LinearGradient id="gl_g" x1="0.5" y1="1" x2="0.5" y2="0">
            <Stop offset="0" stopColor={c2} stopOpacity="0.4" />
            <Stop offset="1" stopColor={glow} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>
        <Path
          d="M 60 90 L 60 50"
          stroke={c2}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <Path
          d="M 60 50 Q 45 42 48 30 Q 52 20 60 25 Q 68 20 72 30 Q 75 42 60 50"
          fill="url(#gl_g)"
        />
        <Circle cx="60" cy="25" r="10" fill={glow} opacity="0.1" />
        <Path d="M 50 85 Q 55 78 60 90 Q 65 78 70 85" stroke={c2} strokeWidth="1.5" fill="none" opacity="0.3" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
