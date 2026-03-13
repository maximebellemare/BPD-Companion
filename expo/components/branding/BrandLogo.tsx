import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Path, Rect, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import Colors from '@/constants/colors';

interface BrandLogoProps {
  size?: number;
  variant?: 'default' | 'light' | 'dark';
  animated?: boolean;
}

export default function BrandLogo({ size = 48, variant = 'default', animated = false }: BrandLogoProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [animated, pulseAnim, fadeAnim]);

  const isLight = variant === 'light';
  const isDark = variant === 'dark';

  const beamColor = isLight ? '#FFFFFF' : Colors.brandLilac;
  const baseColor = isLight ? 'rgba(255,255,255,0.85)' : Colors.brandTeal;
  const glowColor = isLight ? 'rgba(255,255,255,0.2)' : 'rgba(74, 139, 141, 0.15)';
  const bgColor = isDark ? Colors.brandNavy : isLight ? 'rgba(255,255,255,0.12)' : Colors.brandTealSoft;

  const svgSize = size * 0.65;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: bgColor,
        },
        animated && {
          transform: [{ scale: pulseAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <Defs>
          <LinearGradient id="bl_beam" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={beamColor} stopOpacity="0.7" />
            <Stop offset="1" stopColor={beamColor} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="bl_base" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={baseColor} stopOpacity="0.9" />
            <Stop offset="1" stopColor={baseColor} stopOpacity="0.5" />
          </LinearGradient>
        </Defs>

        <Circle cx={cx} cy={cy * 0.65} r={cx * 0.35} fill={glowColor} />

        <Path
          d={`M ${cx - cx * 0.3} ${cy * 0.55} L ${cx} ${cy * 0.15} L ${cx + cx * 0.3} ${cy * 0.55}`}
          fill="url(#bl_beam)"
        />

        <Line
          x1={cx}
          y1={cy * 0.2}
          x2={cx}
          y2={cy * 0.5}
          stroke={beamColor}
          strokeWidth={1.2}
          opacity={0.5}
          strokeLinecap="round"
        />

        <Rect
          x={cx - cx * 0.22}
          y={cy * 0.7}
          width={cx * 0.44}
          height={cy * 0.75}
          rx={cx * 0.08}
          fill="url(#bl_base)"
        />

        <Rect
          x={cx - cx * 0.32}
          y={cy * 1.4}
          width={cx * 0.64}
          height={cy * 0.18}
          rx={cx * 0.06}
          fill={baseColor}
          opacity={0.5}
        />

        <Circle
          cx={cx}
          cy={cy * 0.62}
          r={cx * 0.12}
          fill={beamColor}
          opacity={0.8}
        />

        <Circle
          cx={cx}
          cy={cy * 0.62}
          r={cx * 0.06}
          fill={beamColor}
          opacity={1}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
