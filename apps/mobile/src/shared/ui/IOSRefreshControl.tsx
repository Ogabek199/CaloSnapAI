import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  RefreshControl,
  RefreshControlProps,
  StyleSheet,
  View,
} from 'react-native';

type Props = {
  refreshing: boolean;
  onRefresh: () => void;
  /** Spinner / tint color — use high-contrast in dark mode. */
  tintColor: string;
  /** Reserved for callers; Android uses custom banner instead of Material plate. */
  backgroundColor?: string;
};

/**
 * Pull-to-refresh with a theme-visible spinner on both platforms.
 * - iOS: native UIRefreshControl + matching tint
 * - Android: gesture via RefreshControl + ActivityIndicator banner
 * - Both: RefreshBanner while refreshing (always contrast-safe)
 */
export function IOSRefreshControl({
  refreshing,
  onRefresh,
  tintColor,
}: Props) {
  if (Platform.OS === 'ios') {
    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={tintColor}
        // Helps spinner stay readable when the scroll view bg is dark
        titleColor={tintColor}
      />
    );
  }

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['transparent']}
      progressBackgroundColor="transparent"
      progressViewOffset={-80}
    />
  );
}

/** Place at the top of ScrollView content while refreshing (both platforms). */
export function AndroidRefreshBanner({
  refreshing,
  tintColor,
}: {
  refreshing: boolean;
  tintColor: string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (refreshing) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.85);
    }
  }, [refreshing, opacity, scale]);

  // Android always needs the custom banner (native plate is hidden).
  // iOS also shows it in dark-friendly tint so the spinner never disappears.
  if (!refreshing) return null;

  // On iOS the native control already spins above content — keep banner for Android
  // and as a fallback chip when native tint blends into dark backgrounds.
  if (Platform.OS === 'ios') {
    return (
      <Animated.View
        style={[styles.iosChipWrap, { opacity, transform: [{ scale }] }]}
        pointerEvents="none"
      >
        <View style={[styles.iosChip, { backgroundColor: 'rgba(26,155,108,0.18)' }]}>
          <ActivityIndicator color={tintColor} size="small" />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.banner, { opacity, transform: [{ scale }] }]}>
      <ActivityIndicator color={tintColor} size="small" />
    </Animated.View>
  );
}

/** Convenience: build refreshControl + optional banner props. */
export function useIOSRefreshProps(
  refreshing: boolean,
  onRefresh: () => void,
  tintColor: string,
  backgroundColor?: string,
): {
  refreshControl: React.ReactElement<RefreshControlProps>;
  banner: React.ReactNode;
} {
  return {
    refreshControl: (
      <IOSRefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={tintColor}
        backgroundColor={backgroundColor}
      />
    ),
    banner: <AndroidRefreshBanner refreshing={refreshing} tintColor={tintColor} />,
  };
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  iosChipWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  iosChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
