import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { usePalette } from '../../store/useAppStore';
import { Radius, FontSize, Spacing } from '../theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const t = usePalette();
  const isDisabled = disabled || loading;

  const bg =
    variant === 'primary'
      ? t.primary
      : variant === 'secondary'
        ? t.cardHover
        : 'transparent';

  const color =
    variant === 'primary' ? t.onPrimary : variant === 'secondary' ? t.text : t.primary;

  const borderColor = variant === 'ghost' ? t.border : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'ghost' ? 1 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.label, { color }, textStyle]}>{title}</Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
