import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { Radius, Spacing } from '../theme/spacing';
import { useAppStore, usePalette } from '../../store/useAppStore';

type BoneProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

// One pulse drives every mounted bone, so a full-screen skeleton costs a single native animation.
const sharedPulse = new Animated.Value(0.45);
let pulseLoop: Animated.CompositeAnimation | null = null;
let pulseUsers = 0;

function acquirePulse() {
  pulseUsers += 1;
  if (pulseLoop) return;
  pulseLoop = Animated.loop(
    Animated.sequence([
      Animated.timing(sharedPulse, {
        toValue: 1,
        duration: 750,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(sharedPulse, {
        toValue: 0.4,
        duration: 750,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]),
  );
  pulseLoop.start();
}

function releasePulse() {
  pulseUsers = Math.max(0, pulseUsers - 1);
  if (pulseUsers === 0 && pulseLoop) {
    pulseLoop.stop();
    pulseLoop = null;
  }
}

/** Soft iOS-style pulsing bone. */
export const SkeletonBone = React.memo(function SkeletonBone({
  width = '100%',
  height = 14,
  radius = Radius.sm,
  style,
}: BoneProps) {
  const isDark = useAppStore((s) => s.themeMode === 'dark');
  const opacity = sharedPulse;

  useEffect(() => {
    acquirePulse();
    return releasePulse;
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: isDark ? '#2A2F3A' : '#E8E8E4',
          opacity,
        },
        style,
      ]}
    />
  );
});

/**
 * Fade + slight rise when real content replaces a skeleton.
 * On Android, native-driver opacity on a parent makes elevated (and some
 * SVG) children invisible — render a plain View instead.
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 320,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  return <FadeInContent delay={delay} duration={duration} style={style}>{children}</FadeInContent>;
}

function FadeInContent({
  children,
  delay = 0,
  duration = 320,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

/** Home calorie card + meal list placeholder. */
export function HomeSkeleton() {
  const c = usePalette();

  return (
    <View style={styles.stack}>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <SkeletonBone width={110} height={12} />
        <View style={styles.ringRow}>
          <SkeletonBone width={128} height={128} radius={64} />
          <View style={styles.sideStats}>
            <SkeletonBone width={72} height={22} />
            <SkeletonBone width={56} height={10} />
            <View style={{ height: 12 }} />
            <SkeletonBone width={72} height={22} />
            <SkeletonBone width={56} height={10} />
          </View>
        </View>
        <View style={styles.macroGap}>
          <SkeletonBone height={10} />
          <SkeletonBone height={10} />
          <SkeletonBone height={10} />
        </View>
      </View>

      <View style={styles.sectionHead}>
        <SkeletonBone width={140} height={18} />
        <SkeletonBone width={56} height={14} />
      </View>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, paddingVertical: Spacing.md }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.foodRow, i < 2 && { marginBottom: Spacing.md }]}>
            <SkeletonBone width={56} height={56} radius={14} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBone width="70%" height={14} />
              <SkeletonBone width="45%" height={10} />
              <SkeletonBone width="85%" height={10} />
            </View>
            <SkeletonBone width={36} height={18} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Diary summary + meal cards placeholder. */
export function DiarySkeleton() {
  const c = usePalette();

  return (
    <View style={styles.stack}>
      <View style={[styles.summary, { backgroundColor: c.card, borderColor: c.border }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.summaryCell}>
            <SkeletonBone width={48} height={22} />
            <SkeletonBone width={56} height={10} />
          </View>
        ))}
      </View>

      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.card, { backgroundColor: c.card, borderColor: c.border, gap: Spacing.md }]}
        >
          <View style={styles.mealHead}>
            <SkeletonBone width={40} height={40} radius={12} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBone width={100} height={14} />
              <SkeletonBone width={72} height={10} />
            </View>
            <SkeletonBone width={56} height={12} />
          </View>
          <SkeletonBone height={52} radius={Radius.md} />
        </View>
      ))}
    </View>
  );
}

/** Food search list rows. */
export function FoodListSkeleton({ rows = 6 }: { rows?: number }) {
  const c = usePalette();

  return (
    <View style={styles.listStack}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={[styles.listRow, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <SkeletonBone width={40} height={40} radius={12} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBone width="60%" height={14} />
            <SkeletonBone width="90%" height={10} />
          </View>
          <SkeletonBone width={18} height={18} radius={9} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {},
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sideStats: { flex: 1, marginLeft: Spacing.xl },
  macroGap: { marginTop: 4 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summary: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
  },
  mealHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  listStack: { marginTop: 8 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
});
