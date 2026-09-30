import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../shared/storage/safe-storage';
import { localDateKey } from './useDiaryStore';

export const FEAST_MAX_DAILY_DEFICIT = 400;
export const FEAST_MIN_DAILY_GOAL = 1200;
export const FEAST_DURATION_OPTIONS = [2, 3, 4] as const;
export const FEAST_RECOMMENDED_DAYS = 3;

export type FeastReason = 'wedding' | 'birthday' | 'holiday' | 'weekend';

export interface FeastPlan {
  id: string;
  feastDate: string; // YYYY-MM-DD
  title: string;
  reason?: FeastReason;
  surplusCalories: number;
  compensationDays: number; // 2, 3, or 4
  dailyDeficit: number;
  startDate: string; // YYYY-MM-DD (day after feastDate)
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  extraWaterMl: number;
  recommendedWalkMinutes: number;
  createdAt: string;
}

export function addDaysToDateKey(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const ry = date.getFullYear();
  const rm = String(date.getMonth() + 1).padStart(2, '0');
  const rd = String(date.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

export function daysDifference(startKey: string, targetKey: string): number {
  const [y1, m1, d1] = startKey.split('-').map(Number);
  const [y2, m2, d2] = targetKey.split('-').map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function calcFeastDailyDeficit(surplus: number, days: number): number {
  return Math.min(FEAST_MAX_DAILY_DEFICIT, Math.round(surplus / days));
}

/** Never pushes the goal below a safe floor (or below the user's own base goal if that is already lower). */
export function applyFeastAdjustment(baseGoal: number, adjustment: number): number {
  if (!adjustment) return baseGoal;
  const floor = Math.min(baseGoal, FEAST_MIN_DAILY_GOAL);
  return Math.max(floor, Math.round(baseGoal + adjustment));
}

interface FeastState {
  activePlan: FeastPlan | null;
  isModalOpen: boolean;
  initialSuggestedSurplus: number;
  openModal: (suggestedSurplus?: number) => void;
  closeModal: () => void;
  startFeastPlan: (params: {
    feastDate?: string;
    title?: string;
    reason?: FeastReason;
    surplusCalories: number;
    compensationDays: number;
  }) => FeastPlan;
  cancelFeastPlan: () => void;
  completeFeastPlan: () => void;
  reset: () => void;
  /** Clears the plan once today is past its endDate. Returns true if a plan was completed. */
  expireIfFinished: (today?: string) => boolean;
  getActiveAdjustmentForDate: (date: string) => number;
  getCurrentDayProgress: (date?: string) => {
    currentDay: number;
    totalDays: number;
    isFeastDay: boolean;
    inRecovery: boolean;
  } | null;
  isFeastDay: (date: string) => boolean;
  isFeastActiveToday: () => boolean;
}

export const useFeastStore = create<FeastState>()(
  persist(
    (set, get) => ({
      activePlan: null,
      isModalOpen: false,
      initialSuggestedSurplus: 800,

      openModal: (suggestedSurplus) =>
        set({
          isModalOpen: true,
          initialSuggestedSurplus:
            suggestedSurplus && suggestedSurplus > 0 ? Math.round(suggestedSurplus / 50) * 50 : 800,
        }),

      closeModal: () => set({ isModalOpen: false }),

      startFeastPlan: ({ feastDate, title, reason, surplusCalories, compensationDays }) => {
        const targetFeastDate = feastDate || localDateKey();
        const days = Math.min(Math.max(compensationDays, 2), 4);
        const surplus = Math.max(100, Math.min(surplusCalories, 3000));
        const dailyDeficit = calcFeastDailyDeficit(surplus, days);

        const newPlan: FeastPlan = {
          id: `feast_${Date.now()}`,
          feastDate: targetFeastDate,
          title: title || 'Ziyofat / Bayram dasturxoni',
          reason,
          surplusCalories: surplus,
          compensationDays: days,
          dailyDeficit,
          startDate: addDaysToDateKey(targetFeastDate, 1),
          endDate: addDaysToDateKey(targetFeastDate, days),
          isActive: true,
          extraWaterMl: 500,
          recommendedWalkMinutes: 25,
          createdAt: new Date().toISOString(),
        };

        set({ activePlan: newPlan, isModalOpen: false });
        return newPlan;
      },

      cancelFeastPlan: () => set({ activePlan: null }),

      completeFeastPlan: () => set({ activePlan: null }),

      reset: () => set({ activePlan: null, isModalOpen: false, initialSuggestedSurplus: 800 }),

      expireIfFinished: (today) => {
        const plan = get().activePlan;
        if (!plan) return false;
        if ((today || localDateKey()) > plan.endDate) {
          set({ activePlan: null });
          return true;
        }
        return false;
      },

      getActiveAdjustmentForDate: (date: string) => {
        const plan = get().activePlan;
        if (!plan || !plan.isActive) return 0;
        // Feast day absorbs the surplus so it never shows as "over limit"; it is paid back over the recovery window.
        if (date === plan.feastDate) {
          return plan.surplusCalories;
        }
        if (date >= plan.startDate && date <= plan.endDate) {
          return -plan.dailyDeficit;
        }
        return 0;
      },

      getCurrentDayProgress: (date?: string) => {
        const plan = get().activePlan;
        if (!plan || !plan.isActive) return null;

        const targetDate = date || localDateKey();

        if (targetDate === plan.feastDate) {
          return {
            currentDay: 0,
            totalDays: plan.compensationDays,
            isFeastDay: true,
            inRecovery: false,
          };
        }

        if (targetDate >= plan.startDate && targetDate <= plan.endDate) {
          const diff = daysDifference(plan.startDate, targetDate);
          return {
            currentDay: Math.min(diff + 1, plan.compensationDays),
            totalDays: plan.compensationDays,
            isFeastDay: false,
            inRecovery: true,
          };
        }

        return null;
      },

      isFeastDay: (date: string) => {
        const plan = get().activePlan;
        return !!(plan && plan.isActive && plan.feastDate === date);
      },

      isFeastActiveToday: () => get().getCurrentDayProgress(localDateKey()) !== null,
    }),
    {
      name: 'calosnap_feast_storage',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ activePlan: state.activePlan }),
      onRehydrateStorage: () => (state) => {
        state?.expireIfFinished();
      },
    },
  ),
);
