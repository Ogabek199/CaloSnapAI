import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

const TRACK_W = 51;
const TRACK_H = 31;
const THUMB = 27;
const PAD = 2;
const TRAVEL = TRACK_W - THUMB - PAD * 2;

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  activeColor: string;
  inactiveColor: string;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** Same geometry and motion as UIKit's UISwitch, so it looks identical on Android and iOS. */
export const IOSSwitch = memo(function IOSSwitch({
  value,
  onValueChange,
  activeColor,
  inactiveColor,
  disabled,
  accessibilityLabel,
}: Props) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 240,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  const pressTo = (to: number) =>
    Animated.timing(press, { toValue: to, duration: 140, useNativeDriver: false }).start();

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor],
  });
  // UISwitch stretches the knob while the finger is down and slides it from the far edge.
  const thumbWidth = press.interpolate({ inputRange: [0, 1], outputRange: [THUMB, THUMB + 6] });
  const translateX = Animated.add(
    Animated.multiply(progress, TRAVEL),
    Animated.multiply(Animated.multiply(progress, press), -6),
  );

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        Haptics.selectionAsync();
        onValueChange(!value);
      }}
      onPressIn={() => pressTo(1)}
      onPressOut={() => pressTo(0)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View style={[styles.thumb, { width: thumbWidth, transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    padding: PAD,
    justifyContent: 'center',
  },
  thumb: {
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
