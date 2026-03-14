import React, { useRef, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  haptic?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.brandTeal, text: Colors.white },
  secondary: { bg: Colors.brandTealSoft, text: Colors.brandTeal },
  outline: { bg: 'transparent', text: Colors.brandTeal, border: Colors.brandTeal },
  ghost: { bg: 'transparent', text: Colors.textSecondary },
  danger: { bg: Colors.dangerLight, text: Colors.dangerDark },
};

const SIZE_STYLES: Record<ButtonSize, { paddingV: number; paddingH: number; fontSize: number; radius: number }> = {
  sm: { paddingV: 8, paddingH: 14, fontSize: 13, radius: 10 },
  md: { paddingV: 13, paddingH: 20, fontSize: 15, radius: 14 },
  lg: { paddingV: 16, paddingH: 28, fontSize: 16, radius: 16 },
};

export default function ActionButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  style,
  textStyle,
  testID,
  haptic = true,
}: ActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (haptic && Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress, haptic]);

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.base,
          {
            backgroundColor: variantStyle.bg,
            paddingVertical: sizeStyle.paddingV,
            paddingHorizontal: sizeStyle.paddingH,
            borderRadius: sizeStyle.radius,
            borderWidth: variantStyle.border ? 1.5 : 0,
            borderColor: variantStyle.border ?? 'transparent',
            opacity: isDisabled ? 0.5 : 1,
          },
          variant === 'primary' && styles.primaryShadow,
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={isDisabled}
        testID={testID}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variantStyle.text} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                {
                  fontSize: sizeStyle.fontSize,
                  fontWeight: '600' as const,
                  color: variantStyle.text,
                },
                textStyle,
              ]}
            >
              {label}
            </Text>
            {iconRight}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryShadow: {
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
});
