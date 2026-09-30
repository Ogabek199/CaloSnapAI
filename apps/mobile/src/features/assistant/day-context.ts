import type { AssistantDayContext } from '../../shared/api/api-client';
import { localDateKey, useDiaryStore } from '../../store/useDiaryStore';
import { applyFeastAdjustment, useFeastStore } from '../../store/useFeastStore';

/** Today's intake from the loaded diary; undefined when the diary holds another day, so the AI never sees stale numbers. */
export function getTodayContext(): AssistantDayContext | undefined {
  const { todaySummary, calorieGoal } = useDiaryStore.getState();
  const today = localDateKey();
  if (!todaySummary || todaySummary.date !== today) return undefined;
  const total = todaySummary.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const baseGoal = todaySummary.goalCalories || calorieGoal || 2150;
  const goal = applyFeastAdjustment(baseGoal, useFeastStore.getState().getActiveAdjustmentForDate(today));
  return {
    consumedCalories: Math.round(total.calories || 0),
    consumedProtein: Math.round(total.protein || 0),
    consumedCarbs: Math.round(total.carbs || 0),
    consumedFat: Math.round(total.fat || 0),
    goalCalories: Math.round(goal),
  };
}
