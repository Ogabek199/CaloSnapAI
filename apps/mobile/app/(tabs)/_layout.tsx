import React from 'react';
import { Tabs } from 'expo-router';
import { AppTabBar } from '../../src/shared/ui/AppTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
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
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
