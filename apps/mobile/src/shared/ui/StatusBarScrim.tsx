import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const withAlpha = (hex: string, alpha: string) => (/^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex);

/** Fades scrolling content out under the status bar / notch instead of cutting it off at a hard edge. */
export function StatusBarScrim({ color }: { color: string }) {
  const { top } = useSafeAreaInsets();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[color, withAlpha(color, 'F2'), withAlpha(color, '00')]}
      locations={[0, 0.6, 1]}
      style={[styles.scrim, { height: top + 18 }]}
    />
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
});
