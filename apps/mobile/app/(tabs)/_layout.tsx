import React from 'react';
import { Tabs } from 'expo-router';
import { IOSTabBar } from '../../src/shared/ui/IOSTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <IOSTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="diary" />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
