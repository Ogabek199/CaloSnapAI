import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalToast } from '../src/shared/ui/Toast';
import { useAppStore } from '../src/store/useAppStore';
import { NotificationService } from '../src/shared/notifications/notification.service';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { themeMode, theme, mealRemindersEnabled, language } = useAppStore();
  const currentTheme = theme();

  useEffect(() => {
    try {
      if (mealRemindersEnabled) {
        NotificationService?.scheduleMealReminders?.(language)?.catch?.(() => {});
      } else {
        NotificationService?.cancelMealReminders?.()?.catch?.(() => {});
      }
    } catch (e) {
      console.log('[RootLayout] Notification init skipped:', e);
    }
  }, [mealRemindersEnabled, language]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: currentTheme.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="scan/analyzing"
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="scan/result"
            options={{
              presentation: 'card',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="scan/edit"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </Stack>
        {/* Global Floating Top-Center Toast */}
        <GlobalToast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
