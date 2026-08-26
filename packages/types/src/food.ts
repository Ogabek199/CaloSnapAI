import { NutritionPer100g } from './nutrition';

export type FoodCategory =
  | 'UZBEK_NATIONAL'
  | 'MEAT_POULTRY'
  | 'SOUP'
  | 'GRAIN_BREAD'
  | 'SALAD'
  | 'BEVERAGE'
  | 'DESSERT'
  | 'FRUIT_VEGETABLE'
  | 'OTHER';

export interface Food {
  id: string;
  name: string;
  nameUz: string;
  nameRu?: string;
  nameEn?: string;
  category: FoodCategory;
  imageUrl?: string;
  nutrition: NutritionPer100g;
  defaultServingGrams?: number;
  aliases?: string[];
  createdAt?: string;
  updatedAt?: string;
}
