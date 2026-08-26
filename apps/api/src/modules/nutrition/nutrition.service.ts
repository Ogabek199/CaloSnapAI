import { Injectable } from '@nestjs/common';
import { CalculatedNutrition, NutritionPer100g } from '@eda/types';

@Injectable()
export class NutritionService {
  /**
   * Calculate deterministic nutrition values given weight in grams and nutrition per 100g.
   */
  calculateForWeight(weightGrams: number, per100g: NutritionPer100g): CalculatedNutrition {
    if (weightGrams <= 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    }

    const factor = weightGrams / 100;

    return {
      calories: Math.round(factor * per100g.calories * 10) / 10,
      protein: Math.round(factor * per100g.protein * 10) / 10,
      carbs: Math.round(factor * per100g.carbs * 10) / 10,
      fat: Math.round(factor * per100g.fat * 10) / 10,
      fiber: per100g.fiber ? Math.round(factor * per100g.fiber * 10) / 10 : 0,
    };
  }

  /**
   * Aggregate multiple nutrition items into a single total.
   */
  aggregateNutrition(items: CalculatedNutrition[]): CalculatedNutrition {
    return items.reduce(
      (acc, item) => ({
        calories: Math.round((acc.calories + item.calories) * 10) / 10,
        protein: Math.round((acc.protein + item.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + item.carbs) * 10) / 10,
        fat: Math.round((acc.fat + item.fat) * 10) / 10,
        fiber: Math.round(((acc.fiber || 0) + (item.fiber || 0)) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
  }
}
