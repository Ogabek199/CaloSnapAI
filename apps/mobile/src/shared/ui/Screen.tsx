import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette } from '../../store/useAppStore';
import { tabBarScrollPadding } from '../theme/layout';
import { Spacing } from '../theme/spacing';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  keyboard?: boolean;
  /** Extra bottom space so content clears the custom iOS-style tab bar. */
  tabBarInset?: boolean;
}

export function Screen({
  children,
  scroll = false,
  style,
  contentStyle,
  edges = ['top', 'left', 'right'],
  keyboard = true,
  tabBarInset = false,
}: ScreenProps) {
  const t = usePalette();
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarInset ? tabBarScrollPadding(insets.bottom) : undefined;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        bottomPad != null ? { paddingBottom: bottomPad } : null,
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        bottomPad != null ? { paddingBottom: bottomPad } : null,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const inner = keyboard ? (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, { backgroundColor: t.background }, style]}
    >
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
});
