import React, { useEffect } from 'react';
import { Stack, Redirect, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalToast } from '../src/shared/ui/Toast';
import { BiometricLockGate } from '../src/shared/security/BiometricLockGate';
import { useAppStore, usePalette } from '../src/store/useAppStore';
import { NotificationService } from '../src/shared/notifications/notification.service';

const queryClient = new QueryClient();

/**
 * Declarative auth/onboarding gate.
 * Must render as a sibling AFTER <Stack>, never wrap the navigator,
 * and only redirect once the root navigation container is ready.
 */
function AuthRedirect() {
  const { isLoggedIn, token, isOnboardingCompleted } = useAppStore();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  if (!navigationState?.key) {
    return null;
  }

  const rootSegment = segments[0] as string | undefined;
  const isAuthScreen = rootSegment === 'auth';
  const isOnboardingScreen = rootSegment === 'onboarding';

  if (!isLoggedIn || !token) {
    if (!isAuthScreen) {
      return <Redirect href="/auth" />;
    }
    return null;
  }

  if (!isOnboardingCompleted) {
    if (!isOnboardingScreen) {
      return <Redirect href="/onboarding" />;
    }
    return null;
  }

  if (isAuthScreen || isOnboardingScreen) {
    return <Redirect href="/(tabs)" />;
  }

  return null;
}

export default function RootLayout() {
  const { themeMode, mealRemindersEnabled, language, isLoggedIn, token, updateUserStats } =
    useAppStore();
  const currentTheme = usePalette();

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

  // Cold-start profile sync
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    (async () => {
      try {
        const { ApiClient } = require('../src/shared/api/api-client');
        const me = await ApiClient.getMe();
        if (me) {
          updateUserStats({
            id: me.id,
            name: me.name,
            email: me.email,
            phone: me.phone,
            avatarUrl: me.avatarUrl || '',
            age: me.profile?.age,
            weightKg: me.profile?.weightKg,
            heightCm: me.profile?.heightCm,
            gender: me.profile?.gender,
            fitnessGoal: me.profile?.goal,
            activityLevel: me.profile?.activityLevel,
          });
          if (me.profile?.dailyCalorieGoal) {
            try {
              const { useDiaryStore } = require('../src/store/useDiaryStore');
              useDiaryStore.getState().setCalorieGoal(me.profile.dailyCalorieGoal);
            } catch {}
          }
        }
      } catch (e) {
        console.log('[RootLayout] getMe sync skipped:', e);
      }
    })();
  }, [isLoggedIn, token]);

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
          <Stack.Screen name="auth" options={{ headerShown: false }} />
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
          <Stack.Screen
            name="diary/add"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </Stack>
        <AuthRedirect />
        <BiometricLockGate />
        <GlobalToast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
