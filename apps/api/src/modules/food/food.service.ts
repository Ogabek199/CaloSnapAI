import { Injectable, Logger } from '@nestjs/common';
import { FoodCategory } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DetectedFoodItem } from '../ai/ai.types';

const VALID_CATEGORIES = new Set<string>(Object.values(FoodCategory));

const CATEGORY_ALIASES: Record<string, FoodCategory> = {
  MAIN_DISH: FoodCategory.UZBEK_NATIONAL,
  BAKERY: FoodCategory.GRAIN_BREAD,
  SNACK: FoodCategory.OTHER,
  FAST_FOOD: FoodCategory.OTHER,
  HEALTHY: FoodCategory.OTHER,
  DRINK: FoodCategory.BEVERAGE,
  BREAD: FoodCategory.GRAIN_BREAD,
  MEAT: FoodCategory.MEAT_POULTRY,
  FRUIT: FoodCategory.FRUIT_VEGETABLE,
  VEGETABLE: FoodCategory.FRUIT_VEGETABLE,
};

function normalizeCategory(raw?: string | null): FoodCategory {
  if (!raw) return FoodCategory.OTHER;
  const upper = String(raw).trim().toUpperCase();
  if (VALID_CATEGORIES.has(upper)) return upper as FoodCategory;
  return CATEGORY_ALIASES[upper] || FoodCategory.OTHER;
}

/** Map Prisma nutrition row → mobile/shared @eda/types NutritionPer100g shape (HTTP only) */
export function mapNutritionForClient(nutrition: any) {
  if (!nutrition) return null;
  return {
    calories: nutrition.caloriesPer100g,
    protein: nutrition.proteinPer100g,
    carbs: nutrition.carbsPer100g,
    fat: nutrition.fatPer100g,
    fiber: nutrition.fiberPer100g ?? 0,
  };
}

export function mapFoodForClient(food: any) {
  if (!food) return null;
  return {
    ...food,
    nutrition: mapNutritionForClient(food.nutrition),
  };
}

@Injectable()
export class FoodService {
  private readonly logger = new Logger(FoodService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: string, category?: string) {
    const where: any = {};

    if (query) {
      const q = query.trim().toLowerCase();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { nameUz: { contains: q, mode: 'insensitive' } },
        { nameRu: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { aliases: { has: q } },
      ];
    }

    if (category) {
      where.category = category;
    }

    return this.prisma.food.findMany({
      where,
      include: {
        nutrition: true,
      },
      orderBy: {
        nameUz: 'asc',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.food.findUnique({
      where: { id },
      include: {
        nutrition: true,
      },
    });
  }

  async findByBarcode(barcode: string) {
    const code = (barcode || '').trim();
    if (!code) return null;
    return this.prisma.food.findFirst({
      where: { barcode: code },
      include: { nutrition: true },
    });
  }

  /**
   * Match an AI-detected food item to the best matching food in the database,
   * or dynamically create a new food record if not found!
   */
  async matchOrCreateDetectedFood(detected: DetectedFoodItem | string) {
    const item: DetectedFoodItem =
      typeof detected === 'string'
        ? {
            name: detected,
            nameUz: detected,
            estimatedWeightGrams: 250,
            confidence: 0.9,
          }
        : detected;

    const searchTerms = [
      item.nameUz,
      item.name,
      item.nameRu,
      item.nameEn,
    ].filter(Boolean) as string[];

    const allFoods = await this.prisma.food.findMany({
      include: { nutrition: true },
    });

    // 1. Try to find existing food by exact or substring matching across all names and aliases
    for (const term of searchTerms) {
      const clean = term.trim().toLowerCase();
      if (!clean) continue;

      for (const food of allFoods) {
        const namesToTest = [
          food.name.toLowerCase(),
          food.nameUz.toLowerCase(),
          food.nameRu?.toLowerCase() || '',
          food.nameEn?.toLowerCase() || '',
          ...food.aliases.map((a) => a.toLowerCase()),
        ];

        for (const name of namesToTest) {
          if (!name) continue;
          if (clean === name || clean.includes(name) || name.includes(clean)) {
            this.logger.log(`Matched detected "${term}" to DB food: "${food.nameUz}" (${food.id})`);
            return food;
          }
        }
      }
    }

    // 2. If not found in database, dynamically CREATE this food in the DB so it is permanently recognized!
    const nameUz = item.nameUz || item.name;
    const nameRu = item.nameRu || item.name;
    const nameEn = item.nameEn || item.name;
    const defaultServing = item.estimatedWeightGrams || 250;

    const calPer100g = typeof item.caloriesPer100g === 'number' ? item.caloriesPer100g : 180;
    const proPer100g = typeof item.proteinPer100g === 'number' ? item.proteinPer100g : 0;
    const carbPer100g = typeof item.carbsPer100g === 'number' ? item.carbsPer100g : 0;
    const fatPer100g = typeof item.fatPer100g === 'number' ? item.fatPer100g : 0;
    const fibPer100g = typeof item.fiberPer100g === 'number' ? item.fiberPer100g : 0;

    const categoryToWrite = normalizeCategory(item.category as string | undefined);
    try {
      this.logger.log(`Creating new recognized food in DB: "${nameUz}" (${calPer100g} kcal/100g)`);
      const newFood = await this.prisma.food.create({
        data: {
          name: nameUz,
          nameUz: nameUz,
          nameRu: nameRu,
          nameEn: nameEn,
          category: categoryToWrite,
          defaultServingGrams: defaultServing,
          aliases: [
            item.name.toLowerCase(),
            nameUz.toLowerCase(),
            nameRu.toLowerCase(),
            nameEn.toLowerCase(),
          ].filter(Boolean),
          nutrition: {
            create: {
              caloriesPer100g: calPer100g,
              proteinPer100g: proPer100g,
              carbsPer100g: carbPer100g,
              fatPer100g: fatPer100g,
              fiberPer100g: fibPer100g,
            },
          },
        },
        include: {
          nutrition: true,
        },
      });

      return newFood;
    } catch (e: any) {
      this.logger.warn(`Could not create food "${nameUz}", falling back to query: ${e?.message}`);
      // Only return an exact name match — never an unrelated food
      const found = await this.prisma.food.findFirst({
        where: { nameUz },
        include: { nutrition: true },
      });
      return found || null;
    }
  }

  // Alias for backwards compatibility
  async matchDetectedFood(detectedName: string) {
    return this.matchOrCreateDetectedFood(detectedName);
  }
}
