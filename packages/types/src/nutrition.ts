export interface NutritionPer100g {
  calories: number; // kcal
  protein: number;  // grams
  carbs: number;    // grams
  fat: number;      // grams
  fiber?: number;   // grams
}

export interface CalculatedNutrition {
  calories: number; // kcal
  protein: number;  // grams
  carbs: number;    // grams
  fat: number;      // grams
  fiber?: number;   // grams
}

export interface PortionOption {
  label: string;
  weightGrams: number;
}
