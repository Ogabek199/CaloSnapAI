import { Platform, ViewStyle } from 'react-native';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  hero: 32,
} as const;

/**
 * Soft card depth that matches iOS on both platforms.
 * Android: never use elevation here — it makes nested SVG (CalorieRing)
 * and some ScrollView children invisible on Android.
 */
export function softShadow(level: 'sm' | 'md' = 'sm'): ViewStyle {
  if (level === 'md') {
    return Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
        shadowColor: '#000000',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    })!;
  }

  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1.5 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    android: {
      elevation: 1.5,
      shadowColor: '#000000',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1.5 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
  })!;
}

/** Android Text often adds extra font padding; strip it for iOS-like vertical rhythm without clipping glyphs. */
export const androidTextFix =
  Platform.OS === 'android'
    ? ({ includeFontPadding: false } as const)
    : ({} as const);

