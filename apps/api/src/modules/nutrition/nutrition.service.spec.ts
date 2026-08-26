import { NutritionService } from './nutrition.service';

describe('NutritionService — Calorie & Macro Engine', () => {
  let service: NutritionService;

  beforeEach(() => {
    service = new NutritionService();
  });

  it('should calculate accurate calories and macros for 350g Plov (177 kcal/100g)', () => {
    const plovNutritionPer100g = {
      calories: 177,
      protein: 5.2,
      carbs: 21.4,
      fat: 8.1,
      fiber: 1.2,
    };

    const result = service.calculateForWeight(350, plovNutritionPer100g);

    // 350 / 100 * 177 = 619.5 kcal
    expect(result.calories).toBe(619.5);
    // 350 / 100 * 5.2 = 18.2g
    expect(result.protein).toBe(18.2);
    // 350 / 100 * 21.4 = 74.9g
    expect(result.carbs).toBe(74.9);
    // 350 / 100 * 8.1 = 28.35 -> 28.4g
    expect(result.fat).toBe(28.4);
    // 350 / 100 * 1.2 = 4.2g
    expect(result.fiber).toBe(4.2);
  });

  it('should return 0 for 0 grams weight', () => {
    const result = service.calculateForWeight(0, {
      calories: 200,
      protein: 10,
      carbs: 20,
      fat: 5,
    });

    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
  });

  it('should correctly aggregate multiple meal items into total daily nutrition', () => {
    const item1 = { calories: 619.5, protein: 18.2, carbs: 74.9, fat: 28.4, fiber: 4.2 };
    const item2 = { calories: 38.4, protein: 1.3, carbs: 5.4, fat: 1.0, fiber: 1.7 };

    const total = service.aggregateNutrition([item1, item2]);

    expect(total.calories).toBe(657.9);
    expect(total.protein).toBe(19.5);
    expect(total.carbs).toBe(80.3);
    expect(total.fat).toBe(29.4);
    expect(total.fiber).toBe(5.9);
  });
});
