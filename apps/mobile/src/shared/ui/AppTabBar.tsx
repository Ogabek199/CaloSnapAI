import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Home, Camera, BookOpen, User } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import {
  TAB_BAR_HEIGHT,
  TAB_BAR_MIN_INSET,
  TAB_BAR_BOTTOM_GAP,
  TAB_BAR_H_MARGIN,
} from '../theme/layout';

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
export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t, theme, themeMode } = useAppStore();
  const strings = t();
  const colors = theme();
  const isDark = themeMode === 'dark';

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

  const tabWidth = useRef(0);
  const bubbleX = useRef(new Animated.Value(BUBBLE_INSET)).current;
  const bubbleW = useRef(new Animated.Value(0)).current;
  const squishX = useRef(new Animated.Value(1)).current;
  const squishY = useRef(new Animated.Value(1)).current;

  const onDockLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    const tw = w / TABS.length;
    tabWidth.current = tw;
    const bw = Math.max(tw - BUBBLE_INSET * 2, 0);
    bubbleW.setValue(bw);
    bubbleX.setValue(activeIndex * tw + BUBBLE_INSET);
  };

  useEffect(() => {
    if (hideBar || tabWidth.current <= 0) return;
    const tw = tabWidth.current;
    const targetX = activeIndex * tw + BUBBLE_INSET;

    Animated.parallel([
      Animated.spring(bubbleX, {
        toValue: targetX,
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
  }, [activeIndex, bubbleX, squishX, squishY, hideBar]);

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

  // Light: visible white glass. Dark: soft translucent panel.
  const dockBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)';
  const dockWash = isDark ? 'rgba(28,28,30,0.55)' : 'rgba(255,255,255,0.78)';

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
        ]}
      >
        <View style={[styles.dockWrap, { borderColor: dockBorder }]} onLayout={onDockLayout}>
          <BlurView
            intensity={Platform.OS === 'ios' ? (isDark ? 36 : 50) : isDark ? 50 : 70}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dockWash }]} />

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
                  android: { elevation: 2 },
                  default: {},
                }),
              },
            ]}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 20 : 28}
              tint={isDark ? 'light' : 'extraLight'}
              experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[liquidTop, liquidMid, liquidBot]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[liquidSpec, 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
              style={styles.spec}
            />
          </Animated.View>

          {TABS.map((tab, i) => {
            const focused = i === activeIndex;
            const color = focused ? colors.primary : colors.textMuted;
            return (
              <Pressable
                key={tab.name}
                onPress={() => go(tab.name)}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.65 : 1 }]}
              >
                <tab.Icon color={color} size={23} strokeWidth={focused ? 2.3 : 1.7} />
                <Text style={[styles.label, { color, fontWeight: focused ? '600' : '500' }]}>
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
    elevation: 8,
  },
  dockShadowDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  dockWrap: {
    width: '100%',
    height: TAB_BAR_HEIGHT,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bubble: {
    position: 'absolute',
    top: BUBBLE_INSET,
    bottom: BUBBLE_INSET,
    borderRadius: 22,
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
