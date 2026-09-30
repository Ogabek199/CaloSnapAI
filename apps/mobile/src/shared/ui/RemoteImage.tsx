import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageProps,
  PixelRatio,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { ImageOff } from 'lucide-react-native';
import { resolveMediaUrl } from '../api/api-client';

type Props = Omit<ImageProps, 'source'> & {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  imageStyle?: ImageProps['style'];
  indicatorColor?: string;
  indicatorSize?: 'small' | 'large';
  placeholderColor?: string;
};

const MAX_REQUEST_WIDTH_PX = 1080;
const FALLBACK_WIDTH_DP = 400;

/**
 * Remote image with a spinner while loading and an icon if it fails.
 * Requests a size matching the rendered box so slow networks and weak devices
 * aren't stuck downloading/decoding full-resolution photos.
 */
function RemoteImageBase({
  uri,
  style,
  imageStyle,
  indicatorColor = '#94A3B8',
  indicatorSize = 'small',
  placeholderColor = 'rgba(148, 163, 184, 0.18)',
  onLoad,
  onError,
  ...rest
}: Props) {
  const boxWidth = (StyleSheet.flatten(style) as ViewStyle | undefined)?.width;
  const resolvedUri = useMemo(() => {
    const widthDp = typeof boxWidth === 'number' ? boxWidth : FALLBACK_WIDTH_DP;
    const widthPx = Math.min(MAX_REQUEST_WIDTH_PX, PixelRatio.getPixelSizeForLayoutSize(widthDp));
    return resolveMediaUrl(uri, widthPx);
  }, [uri, boxWidth]);

  const [loading, setLoading] = useState(!!resolvedUri);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoading(!!resolvedUri);
    setFailed(false);
  }, [resolvedUri]);

  if (!resolvedUri || failed) {
    return (
      <View style={[styles.box, { backgroundColor: placeholderColor }, style]}>
        {failed ? <ImageOff size={indicatorSize === 'large' ? 28 : 18} color={indicatorColor} /> : null}
      </View>
    );
  }

  return (
    <View style={[styles.box, { backgroundColor: placeholderColor }, style]}>
      <Image
        resizeMode="cover"
        {...rest}
        source={{ uri: resolvedUri }}
        style={[StyleSheet.absoluteFill, imageStyle]}
        // Downsample on Android so large photos don't blow memory on low-end devices.
        resizeMethod={Platform.OS === 'android' ? 'resize' : undefined}
        fadeDuration={Platform.OS === 'android' ? 150 : undefined}
        onLoad={(e) => {
          setLoading(false);
          onLoad?.(e);
        }}
        onError={(e) => {
          setLoading(false);
          setFailed(true);
          onError?.(e);
        }}
      />
      {loading ? (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator color={indicatorColor} size={indicatorSize} />
        </View>
      ) : null}
    </View>
  );
}

export const RemoteImage = memo(RemoteImageBase);

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
