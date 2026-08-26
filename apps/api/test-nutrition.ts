import { NutritionService } from './src/modules/nutrition/nutrition.service';

const service = new NutritionService();

console.log('--- Testing NutritionService (Determinstic Calorie Engine) ---');

// Test 1: 350g Plov
const plovPer100g = {
  calories: 177,
  protein: 5.2,
  carbs: 21.4,
  fat: 8.1,
  fiber: 1.2,
};

const plovResult = service.calculateForWeight(350, plovPer100g);
console.log('Plov 350g calculated:', plovResult);

if (plovResult.calories === 619.5 && plovResult.protein === 18.2 && plovResult.carbs === 74.9 && plovResult.fat === 28.4) {
  console.log('✅ TEST 1 PASSED: 350g Plov = 619.5 kcal (~620 kcal)');
} else {
  console.error('❌ TEST 1 FAILED', plovResult);
  process.exit(1);
}

// Test 2: 0g
const zeroResult = service.calculateForWeight(0, plovPer100g);
if (zeroResult.calories === 0 && zeroResult.protein === 0) {
  console.log('✅ TEST 2 PASSED: 0g = 0 kcal');
} else {
  console.error('❌ TEST 2 FAILED', zeroResult);
  process.exit(1);
}

// Test 3: Aggregate
const saladPer100g = {
  calories: 32,
  protein: 1.1,
  carbs: 4.5,
  fat: 0.8,
  fiber: 1.4,
};
const saladResult = service.calculateForWeight(120, saladPer100g);
const total = service.aggregateNutrition([plovResult, saladResult]);

console.log('Aggregated meal total:', total);
if (total.calories === 657.9) {
  console.log('✅ TEST 3 PASSED: Meal aggregate total is accurate (657.9 kcal)');
} else {
  console.error('❌ TEST 3 FAILED', total);
  process.exit(1);
}

console.log('🎉 ALL NUTRITION ENGINE TESTS PASSED!');
