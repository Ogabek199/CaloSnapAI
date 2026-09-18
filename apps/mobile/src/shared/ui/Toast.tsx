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
import { useToastStore } from '../../store/useToastStore';
import { usePalette } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

/** Dynamic Island iPhones (14 Pro+) — top inset ≈ 59; notch models ≈ 47. */
function deviceHasDynamicIsland(topInset: number): boolean {
  return Platform.OS === 'ios' && topInset >= 59;
}

export function GlobalToast() {
  const insets = useSafeAreaInsets();
  const { visible, message, type, hideToast } = useToastStore();
  const currentTheme = usePalette();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  const islandMode = deviceHasDynamicIsland(insets.top);

  useEffect(() => {
    if (!visible || !message) return;

    opacity.setValue(0);
    translateY.setValue(islandMode ? -8 : -12);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
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

  // Sit just under the Dynamic Island / status area — never overlap the hardware cutout.
  if (islandMode) {
    return (
      <View
        style={[styles.islandWrapper, { top: insets.top + 6 }]}
        pointerEvents="box-none"
      >
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
          <TouchableOpacity
            style={styles.islandPill}
            activeOpacity={0.92}
            onPress={hideToast}
          >
            <Icon color={accent} size={15} />
            <Text style={styles.islandText} numberOfLines={2}>
              {message}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { top: insets.top + 10 }]} pointerEvents="box-none">
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <TouchableOpacity
          style={[
            styles.container,
            {
              backgroundColor: currentTheme.card,
              borderColor: accent,
              shadowColor: '#000000',
            },
          ]}
          activeOpacity={0.9}
          onPress={hideToast}
        >
          <View style={styles.iconBox}>
            <Icon color={accent} size={20} />
          </View>
          <Text style={[styles.messageText, { color: currentTheme.text }]} numberOfLines={2}>
            {message}
          </Text>
          <TouchableOpacity style={styles.closeBtn} onPress={hideToast}>
            <X color={currentTheme.textMuted} size={16} />
          </TouchableOpacity>
        </TouchableOpacity>
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
    elevation: 99999,
    paddingHorizontal: 28,
  },
  islandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    maxWidth: Math.min(width - 56, 320),
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 14,
  },
  islandText: {
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
    elevation: 99999,
    paddingHorizontal: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    maxWidth: Math.min(width - 32, 380),
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 12,
    gap: 10,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
});
