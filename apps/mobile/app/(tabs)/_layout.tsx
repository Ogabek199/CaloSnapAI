import React from 'react';
import { Tabs } from 'expo-router';
import { AppTabBar } from '../../src/shared/ui/AppTabBar';
import { usePalette } from '../../src/store/useAppStore';

export default function TabLayout() {
  const c = usePalette();
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="diary" options={{ title: 'Diary' }} />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          // Full-screen camera — hide bar while shooting (Telegram keeps bar; camera needs immersion)
          tabBarStyle: { display: 'none' },
          sceneStyle: { backgroundColor: '#000000' },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
