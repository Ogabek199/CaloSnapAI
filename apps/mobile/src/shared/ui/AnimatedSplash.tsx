import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Must match the expo-splash-screen plugin in app.json (backgroundColor, imageWidth, and
// splash.png's mark at 42% of the image width) so the native splash hands over without a jump.
const SPLASH_BG = '#16A86B';
const NATIVE_SPLASH_IMAGE_WIDTH = 360;
const NATIVE_MARK_RATIO = 0.42;

type Props = {
  /**
   * Holds the static first frame (identical to the native splash) until true, e.g. while the
   * session is restored or Face ID is pending; then plays the intro and fades into the app.
   */
  start: boolean;
  onFinish: () => void;
};

export function AnimatedSplash({ start, onFinish }: Props) {
  const { width } = useWindowDimensions();
  const markSize = Math.min(width, NATIVE_SPLASH_IMAGE_WIDTH) * NATIVE_MARK_RATIO;

  const markScale = useRef(new Animated.Value(1)).current;
  const scanY = useRef(new Animated.Value(0)).current;
  const scanOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(16)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const overlayScale = useRef(new Animated.Value(1)).current;
  const [introDone, setIntroDone] = useState(false);
  const exiting = useRef(false);

  useEffect(() => {
    if (!start) return;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) {
          textOpacity.setValue(1);
          textY.setValue(0);
          setIntroDone(true);
          return;
        }
        Animated.sequence([
          Animated.spring(markScale, { toValue: 0.86, friction: 6, tension: 120, useNativeDriver: true }),
          Animated.parallel([
            Animated.spring(markScale, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(scanOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
              Animated.timing(scanY, {
                toValue: 1,
                duration: 650,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(scanOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.delay(250),
              Animated.parallel([
                Animated.timing(textOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
                Animated.timing(textY, {
                  toValue: 0,
                  duration: 420,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ]),
        ]).start(() => {
          if (!cancelled) setIntroDone(true);
        });
      });
    return () => {
      cancelled = true;
    };
  }, [start, markScale, scanOpacity, scanY, textOpacity, textY]);

  useEffect(() => {
    if (!introDone || exiting.current) return;
    exiting.current = true;
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 380,
        delay: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(overlayScale, {
        toValue: 1.08,
        duration: 380,
        delay: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, [introDone, onFinish, overlayOpacity, overlayScale]);

  const scanTranslate = scanY.interpolate({
    inputRange: [0, 1],
    outputRange: [markSize * 0.14, markSize * 0.84],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.root, { opacity: overlayOpacity, transform: [{ scale: overlayScale }] }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: textOpacity }]}>
        <LinearGradient
          colors={['#22C58B', SPLASH_BG, '#0F7A55']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={{ width: markSize, height: markSize, transform: [{ scale: markScale }] }}>
        <Image source={require('../../../assets/logo-mark.png')} style={styles.mark} resizeMode="contain" />
        <Animated.View
          style={[
            styles.scanLine,
            {
              left: markSize * 0.12,
              right: markSize * 0.12,
              opacity: scanOpacity,
              transform: [{ translateY: scanTranslate }],
            },
          ]}
        />
      </Animated.View>

      <Animated.View style={[styles.textWrap, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
        <Text style={styles.title}>CaloSnap</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_BG,
    zIndex: 1000,
    elevation: 1000,
  },
  mark: { width: '100%', height: '100%' },
  scanLine: {
    position: 'absolute',
    top: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  textWrap: {
    position: 'absolute',
    bottom: '22%',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
});
