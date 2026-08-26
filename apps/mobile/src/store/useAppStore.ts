import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../shared/storage/safe-storage';
import { Language, translations } from '../shared/i18n/translations';
import { DarkTheme, LightTheme, ThemePalette } from '../shared/theme/colors';

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
  activityLevel?: 'SEDENTARY' | 'MODERATE' | 'VERY_ACTIVE';
}

const defaultUser: UserState = {
  name: 'Foydalanuvchi',
  email: '',
  phone: '',
  avatarUrl: '',
  age: 25,
  weightKg: 80,
  heightCm: 180,
  gender: 'MALE',
  fitnessGoal: 'LOSE_WEIGHT',
  activityLevel: 'MODERATE',
};

interface AppState {
  language: Language;
  themeMode: 'dark' | 'light';
  isLoggedIn: boolean;
  isOnboardingCompleted: boolean;
  mealRemindersEnabled: boolean;
  user: UserState;
  token: string | null;

  setLanguage: (lang: Language) => void;
  setThemeMode: (theme: 'dark' | 'light') => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setMealRemindersEnabled: (enabled: boolean) => void;
  setAvatarUrl: (url: string) => void;
  updateUserStats: (stats: Partial<UserState>) => void;
  login: (identifier: string, name: string, token?: string, phone?: string, profile?: any) => void;
  logout: () => void;
  t: () => typeof translations['uz'];
  theme: () => ThemePalette;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'uz',
      themeMode: 'dark',
      isLoggedIn: false,
      isOnboardingCompleted: false,
      mealRemindersEnabled: true,
      user: defaultUser,
      token: null,

      setLanguage: (lang) => set({ language: lang }),
      setThemeMode: (theme) => set({ themeMode: theme }),
      setOnboardingCompleted: (completed) => set({ isOnboardingCompleted: completed }),
      setMealRemindersEnabled: (enabled) => set({ mealRemindersEnabled: enabled }),
      setAvatarUrl: (url) =>
        set((state) => ({
          user: { ...state.user, avatarUrl: url },
        })),

      updateUserStats: (stats) =>
        set((state) => ({
          user: { ...state.user, ...stats },
        })),

      login: (identifier, name, token, phone, profile) => {
        set((state) => ({
          isLoggedIn: true,
          token: token || state.token,
          user: {
            ...state.user,
            id: profile?.userId || profile?.id || state.user.id,
            email: identifier.includes('@') ? identifier : `${identifier.replace(/\D/g, '')}@phone.eda.ai`,
            phone: phone || (identifier.includes('@') ? '' : identifier),
            name: name || state.user.name || 'Foydalanuvchi',
            age: profile?.age ?? state.user.age ?? 25,
            weightKg: profile?.weightKg ?? state.user.weightKg ?? 80,
            heightCm: profile?.heightCm ?? state.user.heightCm ?? 180,
            gender: profile?.gender ?? state.user.gender ?? 'MALE',
            fitnessGoal: profile?.goal ?? state.user.fitnessGoal ?? 'LOSE_WEIGHT',
            activityLevel: profile?.activityLevel ?? state.user.activityLevel ?? 'MODERATE',
          },
        }));
      },

      logout: () => {
        set({
          isLoggedIn: false,
          token: null,
          user: {
            ...defaultUser,
            name: 'Mehmon',
          },
        });

        // Clear user-specific caches across stores
        try {
          const { useDiaryStore } = require('./useDiaryStore');
          useDiaryStore?.getState()?.resetDiary?.();
        } catch (e) {}

        try {
          const { useScanStore } = require('./useScanStore');
          useScanStore?.getState()?.setImageUri?.(null);
          useScanStore?.getState()?.setScanResult?.(null);
        } catch (e) {}
      },

      t: () => translations[get().language] || translations.uz,
      theme: () => (get().themeMode === 'light' ? LightTheme : DarkTheme),
    }),
    {
      name: 'taom-app-storage',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        language: state.language,
        themeMode: state.themeMode,
        isLoggedIn: state.isLoggedIn,
        isOnboardingCompleted: state.isOnboardingCompleted,
        mealRemindersEnabled: state.mealRemindersEnabled,
        user: state.user,
        token: state.token,
      }),
    },
  ),
);
