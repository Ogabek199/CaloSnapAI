import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createTokenSplitStorage } from '../shared/storage/safe-storage';
import { Language, translations } from '../shared/i18n/translations';
import { deviceLanguage } from '../shared/i18n/languages';
import { DarkTheme, LightTheme, ThemePalette } from '../shared/theme/colors';
import type { HealthCondition } from '../shared/api/api-client';

export interface UserState {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  age: number;
  weightKg: number;
  heightCm: number;
  gender: 'MALE' | 'FEMALE';
  fitnessGoal: 'LOSE_WEIGHT' | 'MAINTAIN' | 'BUILD_MUSCLE';
  activityLevel?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
  isPremium?: boolean;
  healthConditions?: HealthCondition[];
}

const defaultUser: UserState = {
  name: 'Foydalanuvchi',
  email: '',
  phone: '',
  avatarUrl: '',
  isPremium: false,
  age: 25,
  weightKg: 80,
  heightCm: 180,
  gender: 'MALE',
  fitnessGoal: 'LOSE_WEIGHT',
  activityLevel: 'MODERATE',
  healthConditions: [],
};

export type PremiumSource = 'server' | 'store';

interface AppState {
  language: Language;
  themeMode: 'dark' | 'light';
  isLoggedIn: boolean;
  isOnboardingCompleted: boolean;
  mealRemindersEnabled: boolean;
  /** Optional app unlock via Face ID / biometrics (device-local). */
  biometricLockEnabled: boolean;
  user: UserState;
  token: string | null;
  /** Pro is granted by either the backend (webhook / promo) or the store entitlement; tracked separately so neither overrides the other. */
  premiumSources: { server: boolean; store: boolean };

  setLanguage: (lang: Language) => void;
  setThemeMode: (theme: 'dark' | 'light') => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setMealRemindersEnabled: (enabled: boolean) => void;
  setBiometricLockEnabled: (enabled: boolean) => void;
  setAvatarUrl: (url: string) => void;
  setIsPremium: (isPremium: boolean, source?: PremiumSource) => void;
  updateUserStats: (stats: Partial<UserState>) => void;
  login: (
    identifier: string,
    name: string,
    token?: string,
    phone?: string,
    profile?: any,
    avatarUrl?: string,
  ) => void;
  logout: () => void;
  t: () => typeof translations['uz'];
  theme: () => ThemePalette;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: deviceLanguage(),
      themeMode: 'light',
      isLoggedIn: false,
      isOnboardingCompleted: false,
      mealRemindersEnabled: true,
      biometricLockEnabled: false,
      user: defaultUser,
      token: null,
      premiumSources: { server: false, store: false },

      setLanguage: (lang) => set({ language: lang }),
      setThemeMode: (theme) => set({ themeMode: theme }),
      setOnboardingCompleted: (completed) => set({ isOnboardingCompleted: completed }),
      setMealRemindersEnabled: (enabled) => set({ mealRemindersEnabled: enabled }),
      setBiometricLockEnabled: (enabled) => set({ biometricLockEnabled: enabled }),
      setAvatarUrl: (url) =>
        set((state) => ({
          user: { ...state.user, avatarUrl: url },
        })),

      setIsPremium: (isPremium, source = 'store') =>
        set((state) => {
          const premiumSources = { ...state.premiumSources, [source]: isPremium };
          return {
            premiumSources,
            user: { ...state.user, isPremium: premiumSources.server || premiumSources.store },
          };
        }),

      updateUserStats: (stats) =>
        set((state) => ({
          user: { ...state.user, ...stats },
        })),

      login: (identifier, name, token, phone, profile, avatarUrl) => {
        set((state) => {
          const serverPremium = !!(profile?.isPremium ?? profile?.user?.isPremium ?? state.premiumSources.server);
          const premiumSources = { ...state.premiumSources, server: serverPremium };
          return {
            isLoggedIn: true,
            token: token || state.token,
            premiumSources,
            user: {
              ...state.user,
              id: profile?.userId || profile?.id || state.user.id,
              email: identifier.includes('@') ? identifier : `${identifier.replace(/\D/g, '')}@phone.eda.ai`,
              phone: phone || (identifier.includes('@') ? '' : identifier),
              name: name || state.user.name || get().t().defaultUserName,
              avatarUrl: avatarUrl ?? profile?.avatarUrl ?? profile?.user?.avatarUrl ?? state.user.avatarUrl ?? '',
              age: profile?.age ?? state.user.age ?? 25,
              weightKg: profile?.weightKg ?? state.user.weightKg ?? 80,
              heightCm: profile?.heightCm ?? state.user.heightCm ?? 180,
              gender: profile?.gender ?? state.user.gender ?? 'MALE',
              fitnessGoal: profile?.goal ?? state.user.fitnessGoal ?? 'LOSE_WEIGHT',
              activityLevel: profile?.activityLevel ?? state.user.activityLevel ?? 'MODERATE',
              healthConditions: Array.isArray(profile?.healthConditions) ? profile.healthConditions : [],
              isPremium: premiumSources.server || premiumSources.store,
            },
          };
        });
      },

      logout: () => {
        set({
          isLoggedIn: false,
          token: null,
          isOnboardingCompleted: false,
          premiumSources: { server: false, store: false },
          user: {
            ...defaultUser,
            name: 'Mehmon',
          },
        });

        // Detach purchases from this account so the next user doesn't inherit the subscription.
        try {
          const { RevenueCatService } = require('../shared/services/revenuecat.service');
          void RevenueCatService?.logOut?.();
        } catch (e) {}

        // Clear user-specific caches across stores
        try {
          const { useDiaryStore } = require('./useDiaryStore');
          useDiaryStore?.getState()?.resetDiary?.();
        } catch (e) {}

        try {
          const { useScanStore } = require('./useScanStore');
          useScanStore?.getState()?.reset?.();
        } catch (e) {}

        try {
          const { useFeastStore } = require('./useFeastStore');
          useFeastStore?.getState()?.reset?.();
        } catch (e) {}

        try {
          const { useChatStore } = require('./useChatStore');
          useChatStore?.getState()?.reset?.();
        } catch (e) {}

        try {
          const { useSubscriptionStore } = require('./useSubscriptionStore');
          useSubscriptionStore?.getState()?.closePaywall?.();
        } catch (e) {}
      },

      t: () => translations[get().language] || translations.uz,
      theme: () => (get().themeMode === 'light' ? LightTheme : DarkTheme),
    }),
    {
      name: 'taom-app-storage',
      storage: createJSONStorage(() => createTokenSplitStorage('token')),
      partialize: (state) => ({
        language: state.language,
        themeMode: state.themeMode,
        isLoggedIn: state.isLoggedIn,
        isOnboardingCompleted: state.isOnboardingCompleted,
        mealRemindersEnabled: state.mealRemindersEnabled,
        biometricLockEnabled: state.biometricLockEnabled,
        user: state.user,
        token: state.token,
        premiumSources: state.premiumSources,
      }),
    },
  ),
);

/** Re-renders when themeMode changes (unlike calling store.theme(), which is a stable fn). */
export function usePalette(): ThemePalette {
  return useAppStore((s) => (s.themeMode === 'light' ? LightTheme : DarkTheme));
}

/** Re-renders when language changes (unlike calling store.t(), which is a stable fn). */
export function useStrings() {
  return useAppStore((s) => translations[s.language] || translations.uz);
}
