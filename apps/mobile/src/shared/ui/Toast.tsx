import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';
import { useToastStore } from '../../store/useToastStore';
import { usePalette } from '../../store/useAppStore';
import { androidTextFix } from '../theme/spacing';

const { width } = Dimensions.get('window');
const TOAST_WIDTH = Math.min(width - 32, 380);

/** Dynamic Island iPhones (14 Pro+) — top inset ≈ 59; notch models ≈ 47. */
function deviceHasDynamicIsland(topInset: number): boolean {
  return Platform.OS === 'ios' && topInset >= 59;
}

export function GlobalToast() {
  const insets = useSafeAreaInsets();
  const { visible, message, type, hideToast } = useToastStore(
    useShallow((s) => ({ visible: s.visible, message: s.message, type: s.type, hideToast: s.hideToast })),
  );
  const currentTheme = usePalette();
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const islandMode = deviceHasDynamicIsland(insets.top);

  useEffect(() => {
    if (!visible || !message) return;

    opacity.setValue(0);
    translateY.setValue(islandMode ? -8 : -14);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 110,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, message, islandMode, opacity, translateY]);

  if (!visible || !message) return null;

  const accent =
    type === 'success'
      ? currentTheme.primary
      : type === 'error' || type === 'warning'
        ? currentTheme.secondary
        : currentTheme.info;

  const Icon =
    type === 'success' ? CheckCircle2 : type === 'error' || type === 'warning' ? AlertCircle : Info;

  const body = islandMode ? (
    <TouchableOpacity style={styles.islandPill} activeOpacity={0.92} onPress={hideToast}>
      <Icon color={accent} size={15} />
      <Text style={[styles.islandText, androidTextFix]} numberOfLines={2}>
        {message}
      </Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: currentTheme.card,
          borderColor: accent,
        },
      ]}
      activeOpacity={0.9}
      onPress={hideToast}
    >
      <View style={styles.iconBox}>
        <Icon color={accent} size={20} />
      </View>
      <Text style={[styles.messageText, { color: currentTheme.text }, androidTextFix]} numberOfLines={3}>
        {message}
      </Text>
      <TouchableOpacity style={styles.closeBtn} onPress={hideToast} hitSlop={8}>
        <X color={currentTheme.textMuted} size={16} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        islandMode ? styles.islandWrapper : styles.wrapper,
        { top: insets.top + (islandMode ? 6 : 10) },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={{ opacity, transform: [{ translateY }] }}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        {body}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  islandWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    paddingHorizontal: 28,
  },
  islandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    width: Math.min(width - 56, 320),
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#000000',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  islandText: {
    flex: 1,
    flexShrink: 1,
    color: '#F5F5F5',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 17,
  },
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    paddingHorizontal: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    // Explicit width — Android collapses flex:1 Text inside maxWidth-only rows.
    width: TOAST_WIDTH,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
      default: {},
    }),
    gap: 10,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeBtn: {
    padding: 4,
  },
});
