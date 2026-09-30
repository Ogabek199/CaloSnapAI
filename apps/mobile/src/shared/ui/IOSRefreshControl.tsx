import React from 'react';
import {
  Platform,
  RefreshControl,
  RefreshControlProps,
} from 'react-native';

type Props = RefreshControlProps & {
  refreshing: boolean;
  onRefresh: () => void;
  /** Spinner / tint color — use high-contrast in dark mode. */
  tintColor: string;
  /** Background color of the refresh indicator plate on Android. */
  backgroundColor?: string;
  children?: React.ReactNode;
};

/**
 * Pull-to-refresh with a theme-visible spinner on both platforms.
 * - iOS: native UIRefreshControl + matching tint
 * - Android: SwipeRefreshLayout (wraps NativeScrollView via cloneElement children)
 */
export function IOSRefreshControl({
  refreshing,
  onRefresh,
  tintColor,
  backgroundColor,
  children,
  style,
  ...rest
}: Props) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={tintColor}
      titleColor={tintColor}
      colors={[tintColor]}
      progressBackgroundColor={backgroundColor || '#FFFFFF'}
      progressViewOffset={Platform.OS === 'android' ? 0 : undefined}
      style={style}
      {...rest}
    >
      {children}
    </RefreshControl>
  );
}

/** Kept for backwards compatibility; RefreshControl handles the spinner cleanly. */
export function AndroidRefreshBanner(_props: {
  refreshing: boolean;
  tintColor: string;
}) {
  return null;
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
    banner: null,
  };
}
