import React, { useCallback, useEffect, useState } from 'react';
import { Stack, Redirect, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalToast } from '../src/shared/ui/Toast';
import { AnimatedSplash } from '../src/shared/ui/AnimatedSplash';
import { PurchaseCelebration } from '../src/features/subscription/PurchaseCelebration';
import { BiometricLockGate } from '../src/shared/security/BiometricLockGate';
import { useColdLockStore } from '../src/shared/security/lock-state';
import { FeastBalancerModal } from '../src/features/feast/FeastBalancerModal';
import { useAppStore, usePalette } from '../src/store/useAppStore';
import { localDateKey } from '../src/store/useDiaryStore';

const queryClient = new QueryClient();

function useAppStoreHydrated() {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAppStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}

/**
 * Declarative auth/onboarding gate.
 * Must render as a sibling AFTER <Stack>, never wrap the navigator,
 * and only redirect once the root navigation container is ready
 * and the persisted session has been restored.
 */
function AuthRedirect() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const token = useAppStore((s) => s.token);
  const isOnboardingCompleted = useAppStore((s) => s.isOnboardingCompleted);
  const hydrated = useAppStoreHydrated();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  if (!navigationState?.key || !hydrated) {
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
  const themeMode = useAppStore((s) => s.themeMode);
  const mealRemindersEnabled = useAppStore((s) => s.mealRemindersEnabled);
  const language = useAppStore((s) => s.language);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const token = useAppStore((s) => s.token);
  const updateUserStats = useAppStore((s) => s.updateUserStats);
  const userId = useAppStore((s) => s.user.id);
  const currentTheme = usePalette();
  const hydrated = useAppStoreHydrated();
  const coldLockStatus = useColdLockStore((s) => s.status);
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  useEffect(() => {
    // Lazy-load so expo-notifications never runs during route module eval on Android Expo Go.
    (async () => {
      try {
        const { NotificationService } = await import(
          '../src/shared/notifications/notification.service'
        );
        if (mealRemindersEnabled && isLoggedIn) {
          await NotificationService.scheduleMealReminders(language);
        } else {
          await NotificationService.cancelMealReminders();
        }
      } catch (e) {
        if (__DEV__) console.log('[RootLayout] Notification init skipped:', e);
      }
    })();
  }, [mealRemindersEnabled, language, isLoggedIn]);

  // RevenueCat: identify with our backend user id so purchases follow the account.
  useEffect(() => {
    (async () => {
      try {
        const { RevenueCatService } = await import(
          '../src/shared/services/revenuecat.service'
        );
        if (isLoggedIn && userId) {
          await RevenueCatService.logIn(userId);
        } else {
          await RevenueCatService.init();
        }
      } catch (e) {
        if (__DEV__) console.warn('[RootLayout] RevenueCat init skipped:', e);
      }
    })();
  }, [isLoggedIn, userId]);

  // Cold-start profile sync
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const { ApiClient } = require('../src/shared/api/api-client');
        const me = await ApiClient.getMe();
        if (cancelled || !me) return;
        const stats = Object.fromEntries(
          Object.entries({
            id: me.id,
            name: me.name,
            email: me.email,
            phone: me.phone,
            avatarUrl: me.avatarUrl || undefined,
            age: me.profile?.age,
            weightKg: me.profile?.weightKg,
            heightCm: me.profile?.heightCm,
            gender: me.profile?.gender,
            fitnessGoal: me.profile?.goal,
            activityLevel: me.profile?.activityLevel,
            healthConditions: Array.isArray(me.profile?.healthConditions) ? me.profile.healthConditions : undefined,
          }).filter(([, v]) => v !== undefined && v !== null),
        );
        updateUserStats(stats);
        // Server-side grants (webhook / promo) also unlock Pro; RevenueCat listener handles the rest.
        useAppStore.getState().setIsPremium(!!me.isPremium, 'server');
        if (me.profile?.dailyCalorieGoal) {
          try {
            const { useDiaryStore } = require('../src/store/useDiaryStore');
            useDiaryStore.getState().setCalorieGoal(me.profile.dailyCalorieGoal);
          } catch {}
        }
      } catch (e) {
        if (__DEV__) console.log('[RootLayout] getMe sync skipped:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, token]);

  // Keep "today" selected across midnight when the app is resumed from background.
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    let lastToday = localDateKey();
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const today = localDateKey();
      if (today === lastToday) return;
      try {
        const { useDiaryStore } = require('../src/store/useDiaryStore');
        const diary = useDiaryStore.getState();
        if (diary.selectedDate === lastToday) {
          void diary.setSelectedDate(today);
        }
      } catch {}
      lastToday = today;
    });
    return () => sub.remove();
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
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="scan/analyzing"
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
              gestureEnabled: false,
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
          <Stack.Screen name="scan/barcode" options={{ headerShown: false }} />
          <Stack.Screen
            name="diary/add"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="paywall"
            options={{
              presentation: 'transparentModal',
              animation: 'none',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
        </Stack>
        <AuthRedirect />
        {isLoggedIn && token ? <FeastBalancerModal /> : null}
        <BiometricLockGate />
        <GlobalToast />
        <PurchaseCelebration />
        {showSplash ? (
          <AnimatedSplash start={hydrated && coldLockStatus === 'open'} onFinish={hideSplash} />
        ) : null}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
