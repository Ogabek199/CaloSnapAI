import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

type Props = Omit<ImageProps, 'source'> & {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  imageStyle?: ImageProps['style'];
  indicatorColor?: string;
  indicatorSize?: 'small' | 'large';
  placeholderColor?: string;
};

/**
 * Remote image with iOS-style ActivityIndicator until the asset finishes loading.
 */
export function RemoteImage({
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
  const [loading, setLoading] = useState(!!uri);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoading(!!uri);
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return <View style={[styles.box, { backgroundColor: placeholderColor }, style]} />;
  }

  return (
    <View style={[styles.box, { backgroundColor: placeholderColor }, style]}>
      <Image
        {...rest}
        source={{ uri }}
        style={[StyleSheet.absoluteFillObject, imageStyle]}
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

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
