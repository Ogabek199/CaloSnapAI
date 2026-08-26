import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Home, Camera, BookOpen, User, ScanLine } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';

export function IOSTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t, themeMode, theme } = useAppStore();
  const strings = t();
  const currentTheme = theme();
  const isDark = themeMode === 'dark';

  // Hide tab bar if current screen requests it (e.g. scanner viewfinder)
  const currentRoute = state.routes[state.index];
  const { options } = descriptors[currentRoute.key];
  if ((options.tabBarStyle as any)?.display === 'none') {
    return null;
  }

  const isHomeFocused = state.index === 0;
  const isDiaryFocused = state.routes[state.index]?.name === 'diary';
  const isProfileFocused = state.routes[state.index]?.name === 'profile';

  const navigateTo = (routeName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(routeName);
  };

  const openScanner = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('scan');
  };

  const dockBg = isDark ? '#0D1322' : '#FFFFFF';
  const dockBorder = isDark ? '#1E293B' : '#E2E8F0';
  const notchBg = isDark ? '#0B0F19' : '#FFFFFF';

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      {/* Center Elevated Floating Green Camera Button */}
      <View style={styles.centerButtonWrapper} pointerEvents="box-none">
        <View style={[styles.cutoutNotchOuter, { backgroundColor: notchBg, borderColor: dockBorder }]}>
          <TouchableOpacity
            style={styles.floatingGreenButton}
            activeOpacity={0.88}
            onPress={openScanner}
          >
            <Camera color="#FFFFFF" size={26} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Full-width Dock Bar */}
      <View
        style={[
          styles.whiteDock,
          {
            backgroundColor: dockBg,
            borderTopColor: dockBorder,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        {/* Tab 1: Asosiy (Home) */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => navigateTo('index')}
        >
          <Home
            color={isHomeFocused ? '#10B981' : '#64748B'}
            size={22}
            strokeWidth={isHomeFocused ? 2.4 : 1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isHomeFocused ? '#10B981' : '#64748B',
                fontWeight: isHomeFocused ? '700' : '500',
              },
            ]}
          >
            {strings.home}
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Kundalik (Diary) */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => navigateTo('diary')}
        >
          <BookOpen
            color={isDiaryFocused ? '#10B981' : '#64748B'}
            size={22}
            strokeWidth={isDiaryFocused ? 2.4 : 1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isDiaryFocused ? '#10B981' : '#64748B',
                fontWeight: isDiaryFocused ? '700' : '500',
              },
            ]}
          >
            {strings.diary}
          </Text>
        </TouchableOpacity>

        {/* Center Gap for the Notch/Elevated Button */}
        <View style={styles.centerGapSpace} />

        {/* Tab 3: Skaner (Scan shortcut) */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={openScanner}
        >
          <ScanLine
            color="#64748B"
            size={22}
            strokeWidth={1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: '#64748B',
                fontWeight: '500',
              },
            ]}
          >
            {strings.scan}
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Profil (Profile) */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => navigateTo('profile')}
        >
          <User
            color={isProfileFocused ? '#10B981' : '#64748B'}
            size={22}
            strokeWidth={isProfileFocused ? 2.4 : 1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isProfileFocused ? '#10B981' : '#64748B',
                fontWeight: isProfileFocused ? '700' : '500',
              },
            ]}
          >
            {strings.userProfile}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  whiteDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 66,
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 24,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    height: '100%',
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.2,
    marginTop: 3,
  },
  centerGapSpace: {
    width: 64,
  },
  centerButtonWrapper: {
    position: 'absolute',
    top: -24,
    alignSelf: 'center',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutoutNotchOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  floatingGreenButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
});
