import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Platform,
  Pressable,
} from 'react-native';
import { usePalette } from '../../store/useAppStore';
import { Radius, FontSize, Spacing } from '../theme/spacing';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
}

export function TextField({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightPress,
  style,
  ...props
}: TextFieldProps) {
  const t = usePalette();

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: t.textSecondary }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.row,
          {
            backgroundColor: t.cardHover,
            borderColor: error ? t.danger : t.border,
          },
        ]}
      >
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          {...props}
          placeholderTextColor={t.textMuted}
          style={[
            styles.input,
            { color: t.text },
            Platform.OS === 'android' ? { includeFontPadding: false } as any : null,
            style,
          ]}
          textAlignVertical="center"
        />
        {rightIcon ? (
          <Pressable
            onPress={onRightPress}
            hitSlop={10}
            style={styles.icon}
            disabled={!onRightPress}
          >
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: t.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'android' ? 0 : 0,
    margin: 0,
  },
  error: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    marginLeft: 2,
  },
});
