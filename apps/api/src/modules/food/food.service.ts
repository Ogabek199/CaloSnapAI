import { ConflictException, Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { FoodCategory, FoodSource, Prisma } from '@prisma/client';
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

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’ʻʼ`´]/g, "'")
    .split(/[^\p{L}\p{N}']+/u)
    .filter(Boolean)
    .join(' ');
}

/** True when `needle` appears in `haystack` as a sequence of whole words. */
function containsPhrase(haystack: string, needle: string): boolean {
  if (needle.length < 3 || haystack === needle) return false;
  return ` ${haystack} `.includes(` ${needle} `);
}

const OFF_BARCODE_RE = /^\d{8,14}$/;

export type CreateBarcodeFoodInput = {
  barcode: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  servingGrams?: number;
  isDrink?: boolean;
};

type MatchCandidate = {
  food: Prisma.FoodGetPayload<{ include: { nutrition: true } }>;
  names: string[];
};
const FOOD_SEARCH_LIMIT = 100;
// The mobile picker loads the full catalogue once; this only guards against unbounded growth.
const FOOD_LIST_LIMIT = 1000;
const FOOD_LIST_CACHE_MS = 5 * 60_000;
const BARCODE_MISS_CACHE_MS = 60 * 60_000;
const BARCODE_MISS_CACHE_MAX = 10_000;

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

  private readonly listCache = new Map<string, { expiresAt: number; data: any[] }>();
  private readonly barcodeMisses = new Map<string, number>();
  private readonly barcodeInflight = new Map<string, Promise<any>>();

  constructor(private readonly prisma: PrismaService) {}

  private matchCache: { expiresAt: number; data: Promise<MatchCandidate[]> } | null = null;

  private invalidateListCache() {
    this.listCache.clear();
    this.matchCache = null;
  }

  /** Normalized names for every food, shared by all scan items instead of re-reading the table per item. */
  private getMatchCandidates(): Promise<MatchCandidate[]> {
    if (this.matchCache && this.matchCache.expiresAt > Date.now()) return this.matchCache.data;
    const data = this.prisma.food
      .findMany({ include: { nutrition: true } })
      .then((foods) =>
        foods.map((food) => ({
          food,
          names: [food.name, food.nameUz, food.nameRu, food.nameEn, ...food.aliases]
            .filter(Boolean)
            .map((n) => normalizeName(n as string))
            .filter(Boolean),
        })),
      );
    data.catch(() => {
      this.matchCache = null;
    });
    this.matchCache = { expiresAt: Date.now() + FOOD_LIST_CACHE_MS, data };
    return data;
  }

  async findAll(query?: string, category?: string) {
    const q = query?.trim();
    if (!q) {
      const key = category || '';
      const cached = this.listCache.get(key);
      if (cached && cached.expiresAt > Date.now()) return cached.data;
      const data = await this.queryFoods(undefined, category);
      this.listCache.set(key, { expiresAt: Date.now() + FOOD_LIST_CACHE_MS, data });
      return data;
    }
    return this.queryFoods(q, category);
  }

  private async queryFoods(query?: string, category?: string) {
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
      take: query ? FOOD_SEARCH_LIMIT : FOOD_LIST_LIMIT,
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
    if (!code || code.length > 64) return null;

    const missUntil = this.barcodeMisses.get(code);
    if (missUntil && missUntil > Date.now()) return null;

    const pending = this.barcodeInflight.get(code);
    if (pending) return pending;

    const lookup = this.lookupBarcode(code)
      .then((food) => {
        if (!food) {
          if (this.barcodeMisses.size > BARCODE_MISS_CACHE_MAX) this.barcodeMisses.clear();
          this.barcodeMisses.set(code, Date.now() + BARCODE_MISS_CACHE_MS);
        }
        return food;
      })
      .finally(() => this.barcodeInflight.delete(code));
    this.barcodeInflight.set(code, lookup);
    return lookup;
  }

  private async lookupBarcode(code: string) {
    // 1. Check local PostgreSQL database first
    const existing = await this.prisma.food.findFirst({
      where: { barcode: code },
      include: { nutrition: true },
    });
    if (existing) {
      return existing;
    }
    // Only real EAN/UPC codes go upstream; anything else would just create junk catalogue rows.
    if (!OFF_BARCODE_RE.test(code)) {
      return null;
    }

    // 2. Fetch from OpenFoodFacts global database
    try {
      const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`;
      const res = await fetch(offUrl, {
        headers: {
          'User-Agent': 'CaloSnap - Android/iOS Nutrition App - Contact: info@calosnap.app',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (!data || data.status !== 1 || !data.product) {
        return null;
      }

      const p = data.product;
      const rawName = p.product_name || p.product_name_en || p.product_name_ru || p.generic_name || `Product ${code}`;
      const brand = p.brands ? ` (${p.brands.split(',')[0].trim()})` : '';
      const fullName = `${rawName}${brand}`.trim();

      const nutriments = p.nutriments || {};
      const hasValue = (key: string) =>
        nutriments[key] !== undefined && nutriments[key] !== '' && Number.isFinite(Number(nutriments[key]));
      const hasNutritionData = [
        'energy-kcal_100g', 'energy-kcal', 'energy_100g',
        'proteins_100g', 'proteins', 'carbohydrates_100g', 'carbohydrates', 'fat_100g', 'fat',
      ].some(hasValue);
      // Without any nutrition facts the defaults below would silently log a real product as 0 kcal.
      if (!hasNutritionData) {
        this.logger.log(`[OpenFoodFacts] ${code} has no nutrition facts; treating as not found`);
        return null;
      }
      const cals = Number(
        nutriments['energy-kcal_100g'] ??
        nutriments['energy-kcal'] ??
        (nutriments['energy_100g'] ? Math.round(Number(nutriments['energy_100g']) / 4.184) : 0)
      ) || 0;
      const protein = Number(nutriments['proteins_100g'] ?? nutriments['proteins'] ?? 0) || 0;
      const carbs = Number(nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? 0) || 0;
      const fat = Number(nutriments['fat_100g'] ?? nutriments['fat'] ?? 0) || 0;
      const fiber = Number(nutriments['fiber_100g'] ?? nutriments['fiber'] ?? 0) || 0;

      const servingGrams = Number(p.serving_quantity) || 100;
      const imageUrl = p.image_front_url || p.image_url || p.image_small_url || null;

      let category: FoodCategory = FoodCategory.OTHER;
      const cats = (p.categories || '').toLowerCase();
      if (cats.includes('beverage') || cats.includes('drink') || cats.includes('soda') || cats.includes('juice') || cats.includes('tea') || cats.includes('coffee')) {
        category = FoodCategory.BEVERAGE;
      } else if (cats.includes('bread') || cats.includes('bakery') || cats.includes('cereal') || cats.includes('pasta')) {
        category = FoodCategory.GRAIN_BREAD;
      } else if (cats.includes('meat') || cats.includes('poultry') || cats.includes('fish') || cats.includes('seafood')) {
        category = FoodCategory.MEAT_POULTRY;
      } else if (cats.includes('dessert') || cats.includes('chocolate') || cats.includes('sweet') || cats.includes('snack') || cats.includes('biscuit') || cats.includes('candy')) {
        category = FoodCategory.DESSERT;
      } else if (cats.includes('fruit') || cats.includes('vegetable')) {
        category = FoodCategory.FRUIT_VEGETABLE;
      } else if (cats.includes('soup')) {
        category = FoodCategory.SOUP;
      } else if (cats.includes('salad')) {
        category = FoodCategory.SALAD;
      }

      const created = await this.prisma.food.create({
        data: {
          name: fullName,
          nameUz: p.product_name || fullName,
          nameRu: p.product_name_ru || fullName,
          nameEn: p.product_name_en || fullName,
          barcode: code,
          category,
          source: FoodSource.OPEN_FOOD_FACTS,
          imageUrl,
          defaultServingGrams: servingGrams > 0 ? servingGrams : 100,
          aliases: [rawName, code, p.brands || ''].filter(Boolean),
          nutrition: {
            create: {
              caloriesPer100g: Math.round(cals * 10) / 10,
              proteinPer100g: Math.round(protein * 10) / 10,
              carbsPer100g: Math.round(carbs * 10) / 10,
              fatPer100g: Math.round(fat * 10) / 10,
              fiberPer100g: Math.round(fiber * 10) / 10,
            },
          },
        },
        include: { nutrition: true },
      });

      this.logger.log(`[OpenFoodFacts] Cached new product: ${fullName} (${code})`);
      this.invalidateListCache();
      return created;
    } catch (err: any) {
      this.logger.warn(`[OpenFoodFacts] Lookup failed for barcode ${code}: ${err?.message}`);
      return null;
    }
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

    const searchTerms = [item.nameUz, item.name, item.nameRu, item.nameEn]
      .filter(Boolean)
      .map((t) => normalizeName(t as string))
      .filter(Boolean);

    const candidates = await this.getMatchCandidates();

    // 1. Exact name/alias match, then whole-word containment (so "osh" never matches "kartoshka").
    for (const term of searchTerms) {
      const hit = candidates.find((c) => c.names.includes(term));
      if (hit) {
        this.logger.log(`Matched detected "${term}" to DB food: "${hit.food.nameUz}" (${hit.food.id})`);
        return hit.food;
      }
    }
    for (const term of searchTerms) {
      const hit = candidates.find((c) =>
        c.names.some((name) => containsPhrase(term, name) || containsPhrase(name, term)),
      );
      if (hit) {
        this.logger.log(`Matched detected "${term}" to DB food: "${hit.food.nameUz}" (${hit.food.id})`);
        return hit.food;
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
          source: FoodSource.AI_DETECTED,
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

      this.invalidateListCache();
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

  /**
   * Adds a package a user scanned but no catalogue knew, so the next scan of this barcode finds it.
   * If someone registered the barcode in the meantime, their row wins and is returned instead.
   */
  async createUserBarcodeFood(userId: string, input: CreateBarcodeFoodInput) {
    const code = input.barcode.trim();
    if (!OFF_BARCODE_RE.test(code)) {
      throw new UnprocessableEntityException('Shtrix-kod noto‘g‘ri');
    }
    const existing = await this.prisma.food.findFirst({
      where: { barcode: code },
      include: { nutrition: true },
    });
    if (existing) return existing;

    const name = input.name.trim();
    const { caloriesPer100g: kcal, proteinPer100g: protein, carbsPer100g: carbs, fatPer100g: fat } = input;
    const fiber = input.fiberPer100g ?? 0;
    if (protein + carbs + fat + fiber > 105) {
      throw new UnprocessableEntityException('Oqsil, uglevod va yog‘ yig‘indisi 100 g dan oshmasligi kerak');
    }
    // Macros alone already carry this much energy; a much lower kcal value means a typo (e.g. kJ vs kcal mix-up).
    const macroKcal = protein * 4 + carbs * 4 + fat * 9;
    if (kcal < macroKcal * 0.6 - 20) {
      throw new UnprocessableEntityException('Kaloriya oqsil, uglevod va yog‘ qiymatlariga mos kelmayapti');
    }

    const round1 = (n: number) => Math.round(n * 10) / 10;
    try {
      const created = await this.prisma.food.create({
        data: {
          name,
          nameUz: name,
          nameRu: name,
          nameEn: name,
          barcode: code,
          category: input.isDrink ? FoodCategory.BEVERAGE : FoodCategory.OTHER,
          source: FoodSource.USER_SUBMITTED,
          createdByUserId: userId,
          defaultServingGrams: input.servingGrams && input.servingGrams > 0 ? input.servingGrams : 100,
          aliases: [name.toLowerCase(), code],
          nutrition: {
            create: {
              caloriesPer100g: round1(kcal),
              proteinPer100g: round1(protein),
              carbsPer100g: round1(carbs),
              fatPer100g: round1(fat),
              fiberPer100g: round1(fiber),
            },
          },
        },
        include: { nutrition: true },
      });
      this.barcodeMisses.delete(code);
      this.invalidateListCache();
      this.logger.log(`[UserFood] ${userId} added "${name}" (${code})`);
      return created;
    } catch (e: any) {
      this.logger.warn(`[UserFood] create failed for ${code}: ${e?.message}`);
      throw new ConflictException('Mahsulotni saqlab bo‘lmadi. Qayta urinib ko‘ring.');
    }
  }

  // Alias for backwards compatibility
  async matchDetectedFood(detectedName: string) {
    return this.matchOrCreateDetectedFood(detectedName);
  }
}
