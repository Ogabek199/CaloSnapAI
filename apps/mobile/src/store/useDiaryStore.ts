import { create } from 'zustand';
import { DailyDiarySummary } from '@eda/types';
import { ApiClient } from '../shared/api/api-client';

const createDefaultSummary = (goal = 2150): DailyDiarySummary => {
  const isTodayIso = new Date().toISOString();

  const meals = [
    {
      id: 'BREAKFAST',
      type: 'BREAKFAST' as const,
      items: [],
      totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      eatenAt: isTodayIso,
    },
    {
      id: 'LUNCH',
      type: 'LUNCH' as const,
      items: [],
      totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      eatenAt: isTodayIso,
    },
    {
      id: 'DINNER',
      type: 'DINNER' as const,
      items: [],
      totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      eatenAt: isTodayIso,
    },
    {
      id: 'SNACK',
      type: 'SNACK' as const,
      items: [],
      totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      eatenAt: isTodayIso,
    },
  ];

  return {
    date: new Date().toISOString().split('T')[0],
    meals,
    totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    goalCalories: goal,
    remainingCalories: goal,
  };
};

interface DiaryState {
  todaySummary: DailyDiarySummary;
  calorieGoal: number;
  isLoading: boolean;
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

export const useDiaryStore = create<DiaryState>((set, get) => ({
  todaySummary: createDefaultSummary(),
  calorieGoal: 2150,
  isLoading: false,

  setSummary: (summary) =>
    set({
      todaySummary: summary,
      calorieGoal: summary.goalCalories || 2150,
    }),

  setCalorieGoal: (goal) =>
    set((state) => ({
      calorieGoal: goal,
      todaySummary: {
        ...state.todaySummary,
        goalCalories: goal,
        remainingCalories: Math.max(0, Math.round(goal - (state.todaySummary?.totalNutrition?.calories || 0))),
      },
    })),

  resetDiary: () =>
    set({
      todaySummary: createDefaultSummary(2150),
      calorieGoal: 2150,
      isLoading: false,
    }),

  refreshDiary: async () => {
    set({ isLoading: true });
    try {
      const summary = await ApiClient.getTodayDiary();
      if (summary && summary.meals) {
        set({
          todaySummary: summary,
          calorieGoal: summary.goalCalories || get().calorieGoal,
        });
      }
    } catch (e) {
      console.log('Diary refresh notice:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addScanToDiary: async (mealType, newItems, scanId) => {
    const state = get();
    const currentSummary = state.todaySummary || createDefaultSummary(state.calorieGoal);

    // 1. Immediate optimistic local UI update
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

    set({
      todaySummary: {
        ...currentSummary,
        meals: updatedMeals,
        totalNutrition: allMealsTotal,
        remainingCalories,
      },
    });

    // 2. Persist to backend database
    try {
      for (const item of newItems) {
        const foodId = item.foodId || item.food?.id;
        if (foodId) {
          await ApiClient.addMealItem(
            mealType,
            foodId,
            item.weightGrams || 300,
            scanId,
          );
        }
      }
      // 3. Sync full state from backend
      const latestSummary = await ApiClient.getTodayDiary();
      if (latestSummary && latestSummary.meals) {
        set({ todaySummary: latestSummary });
      }
    } catch (err) {
      console.log('Error persisting meal to backend:', err);
    }
  },

  removeDiaryItem: async (itemId: string) => {
    try {
      await ApiClient.removeMealItem(itemId);
      await get().refreshDiary();
    } catch (e) {
      console.log('Error removing meal item:', e);
    }
  },

  updateDiaryItem: async (itemId: string, weightGrams: number) => {
    try {
      await ApiClient.updateMealItem(itemId, weightGrams);
      await get().refreshDiary();
    } catch (e) {
      console.log('Error updating meal item:', e);
    }
  },
}));
