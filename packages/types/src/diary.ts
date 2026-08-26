import { CalculatedNutrition } from './nutrition';
import { Food } from './food';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface MealItem {
  id: string;
  mealId: string;
  foodId: string;
  food: Food;
  weightGrams: number;
  nutrition: CalculatedNutrition;
  scanId?: string;
  createdAt: string;
}

export interface MealGroup {
  id: string;
  type: MealType;
  items: MealItem[];
  totalNutrition: CalculatedNutrition;
  eatenAt: string;
}

export interface DailyDiarySummary {
  date: string;
  meals: MealGroup[];
  totalNutrition: CalculatedNutrition;
  goalCalories: number;
  remainingCalories: number;
}
