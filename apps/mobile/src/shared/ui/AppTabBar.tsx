import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
  PanResponder,
  Platform,
} from 'react-native';
import type { Tabs } from 'expo-router';

export type AppTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Home, Camera, BookOpen, User } from 'lucide-react-native';
import { useAppStore, usePalette, useStrings } from '../../store/useAppStore';
import {
  TAB_BAR_HEIGHT,
  TAB_BAR_MIN_INSET,
  TAB_BAR_BOTTOM_GAP,
  TAB_BAR_H_MARGIN,
} from '../theme/layout';
import { androidTextFix } from '../theme/spacing';

type LucideIcon = typeof Home;

const TABS: { name: string; labelKey: 'home' | 'diary' | 'scan' | 'userProfile'; Icon: LucideIcon }[] = [
  { name: 'index', labelKey: 'home', Icon: Home },
  { name: 'diary', labelKey: 'diary', Icon: BookOpen },
  { name: 'scan', labelKey: 'scan', Icon: Camera },
  { name: 'profile', labelKey: 'userProfile', Icon: User },
];

const BUBBLE_INSET = 4;

/**
 * Floating transparent glass tab bar + liquid selection indicator.
 * Hooks always run — never early-return before hooks.
 */
export function AppTabBar({ state, descriptors, navigation }: AppTabBarProps) {
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const colors = usePalette();
  const isDark = useAppStore((s) => s.themeMode === 'dark');
  const isIOS = Platform.OS === 'ios';

  const currentRoute = state.routes[state.index];
  const { options } = descriptors[currentRoute.key];
  const hideBar =
    (options.tabBarStyle as { display?: string } | undefined)?.display === 'none';

  const activeIndex = Math.min(
    Math.max(
      TABS.findIndex((tab) => tab.name === state.routes[state.index]?.name),
      0,
    ),
    TABS.length - 1,
  );

  const bottomPad = Math.max(insets.bottom, TAB_BAR_MIN_INSET) + TAB_BAR_BOTTOM_GAP;

  const tabLayouts = useRef<({ x: number; width: number } | undefined)[]>([]);
  const bubbleX = useRef(new Animated.Value(BUBBLE_INSET)).current;
  const bubbleW = useRef(new Animated.Value(0)).current;
  const squishX = useRef(new Animated.Value(1)).current;
  const squishY = useRef(new Animated.Value(1)).current;

  const onTabLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x: rawX, width: rawW } = e.nativeEvent.layout;
    const x = rawX + BUBBLE_INSET;
    const width = Math.max(0, rawW - BUBBLE_INSET * 2);
    tabLayouts.current[index] = { x, width };
    if (index === activeIndex) {
      bubbleX.setValue(x);
      bubbleW.setValue(width);
    }
  };

  const dockRef = useRef<View>(null);
  const dockPageX = useRef(0);
  const dockWidth = useRef(0);
  const dragging = useRef(false);
  const lifted = useRef(false);
  const hoverRef = useRef(activeIndex);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const measureDock = () => {
    dockRef.current?.measureInWindow((x) => {
      dockPageX.current = x;
    });
  };

  const setLift = (on: boolean) => {
    lifted.current = on;
    Animated.parallel([
      Animated.spring(squishX, { toValue: on ? 1.08 : 1, friction: 6, tension: 120, useNativeDriver: false }),
      Animated.spring(squishY, { toValue: on ? 1.08 : 1, friction: 6, tension: 120, useNativeDriver: false }),
    ]).start();
  };

  const snapBubbleTo = (index: number) => {
    const target = tabLayouts.current[index];
    if (!target) return;
    Animated.parallel([
      Animated.spring(bubbleX, { toValue: target.x, friction: 7, tension: 68, useNativeDriver: false }),
      Animated.spring(bubbleW, { toValue: target.width, friction: 7, tension: 68, useNativeDriver: false }),
    ]).start();
  };

  const indexAt = (localX: number) => {
    const inner = dockWidth.current - BUBBLE_INSET * 2;
    if (inner <= 0) return hoverRef.current;
    const i = Math.floor(((localX - BUBBLE_INSET) / inner) * TABS.length);
    return Math.min(Math.max(i, 0), TABS.length - 1);
  };

  const followFinger = (pageX: number) => {
    const localX = pageX - dockPageX.current;
    const idx = indexAt(localX);
    if (idx !== hoverRef.current) {
      hoverRef.current = idx;
      setHoverIndex(idx);
      Haptics.selectionAsync();
    }
    const w = tabLayouts.current[idx]?.width ?? 0;
    const maxX = dockWidth.current - BUBBLE_INSET - w;
    bubbleX.stopAnimation();
    bubbleX.setValue(Math.min(Math.max(localX - w / 2, BUBBLE_INSET), Math.max(maxX, BUBBLE_INSET)));
    bubbleW.setValue(w);
  };

  const finishDrag = (commit: boolean) => {
    if (!dragging.current) return;
    dragging.current = false;
    setHoverIndex(null);
    setLift(false);
    const target = hoverRef.current;
    if (commit && target !== activeIndexRef.current) {
      goRef.current(TABS[target].name);
    } else {
      snapBubbleTo(activeIndexRef.current);
    }
  };

  const handlersRef = useRef({ followFinger, finishDrag, setLift, measureDock });
  handlersRef.current = { followFinger, finishDrag, setLift, measureDock };
  const goRef = useRef<(name: string) => void>(() => {});

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        lifted.current || (Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy)),
      onPanResponderGrant: (e) => {
        dragging.current = true;
        hoverRef.current = activeIndexRef.current;
        handlersRef.current.measureDock();
        if (!lifted.current) handlersRef.current.setLift(true);
        handlersRef.current.followFinger(e.nativeEvent.pageX);
      },
      onPanResponderMove: (e) => handlersRef.current.followFinger(e.nativeEvent.pageX),
      onPanResponderRelease: () => handlersRef.current.finishDrag(true),
      onPanResponderTerminate: () => handlersRef.current.finishDrag(false),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  useEffect(() => {
    const target = tabLayouts.current[activeIndex];
    if (hideBar || !target) return;

    Animated.parallel([
      Animated.spring(bubbleX, {
        toValue: target.x,
        useNativeDriver: false,
        friction: 7,
        tension: 68,
      }),
      Animated.spring(bubbleW, {
        toValue: target.width,
        useNativeDriver: false,
        friction: 7,
        tension: 68,
      }),
      Animated.sequence([
        Animated.timing(squishX, {
          toValue: 1.18,
          duration: 90,
          useNativeDriver: false,
        }),
        Animated.spring(squishX, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(squishY, {
          toValue: 0.88,
          duration: 90,
          useNativeDriver: false,
        }),
        Animated.spring(squishY, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, [activeIndex, bubbleX, bubbleW, squishX, squishY, hideBar]);

  // Early return ONLY after all hooks
  if (hideBar) {
    return null;
  }

  const go = (name: string) => {
    Haptics.impactAsync(
      name === 'scan' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
    navigation.navigate(name);
  };
  goRef.current = go;

  // Light: visible white glass. Dark: soft translucent panel.
  const dockBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)';
  const dockWash = isDark ? 'rgba(28,28,30,0.55)' : 'rgba(255,255,255,0.78)';
  // Android BlurView is unreliable — clean solid frosted fill matches iOS glass look.
  const androidDockFill = isDark ? '#1A1D24' : '#FFFFFF';

  const liquidTop = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,1)';
  const liquidMid = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(248,248,250,0.95)';
  const liquidBot = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(240,240,245,0.9)';
  const liquidBorder = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.06)';
  const liquidSpec = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,1)';

  return (
    <View style={[styles.outer, { paddingBottom: bottomPad }]} pointerEvents="box-none">
      <View
        style={[
          styles.dockShadow,
          !isDark ? styles.dockShadowLight : styles.dockShadowDark,
          Platform.OS === 'android' && {
            backgroundColor: isDark ? '#1A1D24' : '#FFFFFF',
          },
        ]}
      >
        <View
          ref={dockRef}
          style={[styles.dockWrap, { borderColor: dockBorder }]}
          onLayout={(e) => {
            dockWidth.current = e.nativeEvent.layout.width;
            measureDock();
          }}
          {...panResponder.panHandlers}
        >
          {isIOS ? (
            <>
              <BlurView
                intensity={isDark ? 36 : 50}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dockWash }]} />
            </>
          ) : (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: androidDockFill }]}
            />
          )}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.bubble,
              {
                width: bubbleW,
                left: bubbleX,
                borderColor: liquidBorder,
                transform: [{ scaleX: squishX }, { scaleY: squishY }],
                ...Platform.select({
                  ios: {
                    shadowColor: isDark ? '#000' : '#94A3B8',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 8,
                  },
                  android: {
                    elevation: 1.5,
                    shadowColor: isDark ? '#000' : '#94A3B8',
                  },
                  default: {},
                }),
              },
            ]}
          >
            {isIOS ? (
              <BlurView
                intensity={20}
                tint={isDark ? 'light' : 'extraLight'}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <LinearGradient
              colors={[liquidTop, liquidMid, liquidBot]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primaryBg }]} />
            <LinearGradient
              colors={[liquidSpec, 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
              style={styles.spec}
            />
          </Animated.View>

          {TABS.map((tab, i) => {
            const focused = i === (hoverIndex ?? activeIndex);
            const color = focused ? colors.primary : colors.textMuted;
            return (
              <Pressable
                key={tab.name}
                onPress={() => go(tab.name)}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLift(true);
                }}
                onPressOut={() => {
                  if (!dragging.current && lifted.current) setLift(false);
                }}
                delayLongPress={250}
                onLayout={onTabLayout(i)}
                accessibilityRole="tab"
                accessibilityState={{ selected: i === activeIndex }}
                style={({ pressed }) => [
                  styles.tab,
                  { opacity: pressed && hoverIndex === null ? 0.65 : 1 },
                ]}
              >
                <tab.Icon color={color} size={23} strokeWidth={focused ? 2.3 : 1.7} />
                <Text style={[styles.label, { color, fontWeight: focused ? '600' : '500' }, androidTextFix]}>
                  {strings[tab.labelKey]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    paddingHorizontal: TAB_BAR_H_MARGIN,
    alignItems: 'center',
  },
  dockShadow: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
  },
  dockShadowLight: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  dockShadowDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  dockWrap: {
    width: '100%',
    height: TAB_BAR_HEIGHT,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BUBBLE_INSET,
    backgroundColor: 'transparent',
  },
  bubble: {
    position: 'absolute',
    top: BUBBLE_INSET,
    bottom: BUBBLE_INSET,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  spec: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: '40%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 1,
  },
  label: {
    fontSize: 10,
    letterSpacing: -0.15,
  },
});
