import { create } from 'zustand';
import { DailyDiarySummary } from '@eda/types';
import { ApiClient } from '../shared/api/api-client';

/** Local calendar date as YYYY-MM-DD */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const createDefaultSummary = (goal = 2150, date = localDateKey()): DailyDiarySummary => {
  const iso = new Date().toISOString();

  const meals = [
    {
      id: 'BREAKFAST',
      type: 'BREAKFAST' as const,
      items: [],
      totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      eatenAt: iso,
    },
    {
      id: 'LUNCH',
      type: 'LUNCH' as const,
      items: [],
      totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      eatenAt: iso,
    },
    {
      id: 'DINNER',
      type: 'DINNER' as const,
      items: [],
      totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      eatenAt: iso,
    },
    {
      id: 'SNACK',
      type: 'SNACK' as const,
      items: [],
      totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      eatenAt: iso,
    },
  ];

  return {
    date,
    meals,
    totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    goalCalories: goal,
    remainingCalories: goal,
  };
};

interface DiaryState {
  selectedDate: string;
  todaySummary: DailyDiarySummary;
  calorieGoal: number;
  isLoading: boolean;
  /** True after the first refresh attempt finishes (success or fail). */
  hasLoaded: boolean;
  isSelectedToday: () => boolean;
  setSelectedDate: (date: string) => Promise<void>;
  setSummary: (summary: DailyDiarySummary) => void;
  setCalorieGoal: (goal: number) => void;
  resetDiary: () => void;
  addScanToDiary: (
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
    items: any[],
    scanId?: string,
  ) => Promise<void>;
  refreshDiary: () => Promise<void>;
  removeDiaryItem: (itemId: string) => Promise<void>;
  updateDiaryItem: (itemId: string, weightGrams: number) => Promise<void>;
}

// Bumped on every diary load and on reset so late responses (older date, previous user) are dropped.
let loadSeq = 0;

export const useDiaryStore = create<DiaryState>((set, get) => ({
  selectedDate: localDateKey(),
  todaySummary: createDefaultSummary(),
  calorieGoal: 2150,
  isLoading: false,
  hasLoaded: false,

  isSelectedToday: () => get().selectedDate === localDateKey(),

  setSummary: (summary) =>
    set({
      todaySummary: summary,
      selectedDate: summary.date || get().selectedDate,
      calorieGoal: summary.goalCalories || 2150,
      hasLoaded: true,
    }),

  setCalorieGoal: (goal) =>
    set((state) => ({
      calorieGoal: goal,
      todaySummary: {
        ...state.todaySummary,
        goalCalories: goal,
        remainingCalories: Math.max(
          0,
          Math.round(goal - (state.todaySummary?.totalNutrition?.calories || 0)),
        ),
      },
    })),

  resetDiary: () => {
    loadSeq++;
    set({
      selectedDate: localDateKey(),
      todaySummary: createDefaultSummary(2150),
      calorieGoal: 2150,
      isLoading: false,
      hasLoaded: false,
    });
  },

  setSelectedDate: async (date: string) => {
    const today = localDateKey();
    if (date > today) return;
    const seq = ++loadSeq;
    set({ selectedDate: date, isLoading: true });
    try {
      const summary = await ApiClient.getDiaryByDate(date);
      if (seq !== loadSeq) return;
      if (summary && summary.meals) {
        set({
          todaySummary: summary,
          calorieGoal: summary.goalCalories || get().calorieGoal,
        });
      }
    } catch (e) {
      if (seq !== loadSeq) return;
      if (get().todaySummary?.date !== date) {
        set({ todaySummary: createDefaultSummary(get().calorieGoal, date) });
      }
      if (__DEV__) console.log('Diary date load notice:', e);
    } finally {
      if (seq === loadSeq) set({ isLoading: false, hasLoaded: true });
    }
  },

  refreshDiary: async () => {
    const seq = ++loadSeq;
    set({ isLoading: true });
    try {
      // Keep selectedDate aligned with "today" if calendar day rolled over
      let date = get().selectedDate;
      const today = localDateKey();
      if (date > today) {
        date = today;
        set({ selectedDate: today });
      }
      const summary = await ApiClient.getDiaryByDate(date);
      if (seq !== loadSeq) return;
      if (summary && summary.meals) {
        set({
          todaySummary: summary,
          calorieGoal: summary.goalCalories || get().calorieGoal,
        });
      }
    } catch (e) {
      if (__DEV__) console.log('Diary refresh notice:', e);
    } finally {
      if (seq === loadSeq) set({ isLoading: false, hasLoaded: true });
    }
  },

  addScanToDiary: async (mealType, newItems, scanId) => {
    const state = get();
    // Always add to today; switch view to today
    const today = localDateKey();
    const previousSummary = state.todaySummary;
    const previousDate = state.selectedDate;

    if (state.selectedDate !== today) {
      set({ selectedDate: today });
    }
    const currentSummary =
      state.selectedDate === today
        ? state.todaySummary || createDefaultSummary(state.calorieGoal, today)
        : createDefaultSummary(state.calorieGoal, today);

    const updatedMeals = currentSummary.meals.map((group) => {
      if (group.type === mealType) {
        const combinedItems = [...group.items, ...newItems];
        const totalNutrition = combinedItems.reduce(
          (acc, i) => ({
            calories: Math.round((acc.calories + (i.nutrition?.calories || 0)) * 10) / 10,
            protein: Math.round((acc.protein + (i.nutrition?.protein || 0)) * 10) / 10,
            carbs: Math.round((acc.carbs + (i.nutrition?.carbs || 0)) * 10) / 10,
            fat: Math.round((acc.fat + (i.nutrition?.fat || 0)) * 10) / 10,
            fiber: Math.round(((acc.fiber || 0) + (i.nutrition?.fiber || 0)) * 10) / 10,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        );
        return {
          ...group,
          items: combinedItems,
          totalNutrition,
        };
      }
      return group;
    });

    const allMealsTotal = updatedMeals.reduce(
      (acc, g) => ({
        calories: Math.round((acc.calories + g.totalNutrition.calories) * 10) / 10,
        protein: Math.round((acc.protein + g.totalNutrition.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + g.totalNutrition.carbs) * 10) / 10,
        fat: Math.round((acc.fat + g.totalNutrition.fat) * 10) / 10,
        fiber: Math.round(((acc.fiber || 0) + (g.totalNutrition.fiber || 0)) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );

    const remainingCalories = Math.max(0, Math.round(state.calorieGoal - allMealsTotal.calories));

    const seq = ++loadSeq;
    set({
      selectedDate: today,
      isLoading: false,
      todaySummary: {
        ...currentSummary,
        date: today,
        meals: updatedMeals,
        totalNutrition: allMealsTotal,
        remainingCalories,
      },
    });

    const payload = newItems
      .map((item) => ({
        mealType,
        foodId: item.foodId || item.food?.id,
        weightGrams: item.weightGrams || 300,
        ...(scanId ? { scanId } : {}),
      }))
      .filter((item): item is typeof item & { foodId: string } => !!item.foodId);

    try {
      const latestSummary =
        payload.length > 0
          ? await ApiClient.addMealItemsBatch(payload)
          : await ApiClient.getDiaryByDate(today);
      if (seq === loadSeq && latestSummary && latestSummary.meals) {
        set({ todaySummary: latestSummary, selectedDate: today });
      }
    } catch (err) {
      if (seq === loadSeq) {
        // A timeout may still have saved server-side; prefer the server's view over a blind rollback.
        const latest = await ApiClient.getDiaryByDate(today).catch(() => null);
        if (seq === loadSeq) {
          if (latest && latest.meals) {
            set({ todaySummary: latest, selectedDate: today });
          } else {
            set({ todaySummary: previousSummary, selectedDate: previousDate });
          }
        }
      }
      throw err;
    }
  },

  removeDiaryItem: async (itemId: string) => {
    if (!get().isSelectedToday()) return;
    try {
      await ApiClient.removeMealItem(itemId);
      await get().refreshDiary();
    } catch (e) {
      if (__DEV__) console.log('Error removing meal item:', e);
      throw e;
    }
  },

  updateDiaryItem: async (itemId: string, weightGrams: number) => {
    if (!get().isSelectedToday()) return;
    try {
      await ApiClient.updateMealItem(itemId, weightGrams);
      await get().refreshDiary();
    } catch (e) {
      if (__DEV__) console.log('Error updating meal item:', e);
      throw e;
    }
  },
}));
