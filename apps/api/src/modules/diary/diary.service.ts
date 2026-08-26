import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { FoodService } from '../food/food.service';
import { MealType } from '@prisma/client';
import { DailyDiarySummary, MealGroup } from '@eda/types';

const DEMO_USER_ID = 'demo-user';

@Injectable()
export class DiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nutritionService: NutritionService,
    private readonly foodService: FoodService,
  ) {}

  private async ensureUserExists(userId: string): Promise<string> {
    const targetId = userId || DEMO_USER_ID;
    try {
      await this.prisma.user.upsert({
        where: { id: targetId },
        update: {},
        create: {
          id: targetId,
          email: `${targetId}@eda.ai`,
          password: 'demo_hashed_password',
          name: 'Foydalanuvchi',
        },
      });
    } catch (e) {
      // User might already exist or concurrent request created it
    }
    return targetId;
  }

  async getTodaySummary(userId?: string): Promise<DailyDiarySummary> {
    const targetUserId = await this.ensureUserExists(userId || DEMO_USER_ID);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meals = await this.prisma.meal.findMany({
      where: {
        userId: targetUserId,
        eatenAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        items: {
          include: {
            food: {
              include: {
                nutrition: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const mealTypes: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
    const mealGroups: MealGroup[] = mealTypes.map((type) => {
      const matchingMeals = meals.filter((m) => m.type === type);
      const allItems = matchingMeals.flatMap((m) =>
        m.items.map((item) => ({
          id: item.id,
          mealId: m.id,
          foodId: item.foodId,
          food: {
            id: item.food.id,
            name: item.food.name,
            nameUz: item.food.nameUz,
            nameRu: item.food.nameRu,
            nameEn: item.food.nameEn,
            category: item.food.category as any,
            imageUrl: item.food.imageUrl,
            nutrition: {
              calories: item.food.nutrition?.caloriesPer100g || 0,
              protein: item.food.nutrition?.proteinPer100g || 0,
              carbs: item.food.nutrition?.carbsPer100g || 0,
              fat: item.food.nutrition?.fatPer100g || 0,
              fiber: item.food.nutrition?.fiberPer100g || 0,
            },
          },
          weightGrams: item.weightGrams,
          nutrition: {
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fiber: item.fiber,
          },
          scanId: item.scanId,
          createdAt: item.createdAt.toISOString(),
        })),
      );

      const totalNutrition = this.nutritionService.aggregateNutrition(allItems.map((i) => i.nutrition));

      return {
        id: type,
        type: type as any,
        items: allItems,
        totalNutrition,
        eatenAt: new Date().toISOString(),
      };
    });

    const allGroupTotals = mealGroups.map((g) => g.totalNutrition);
    const dayTotalNutrition = this.nutritionService.aggregateNutrition(allGroupTotals);

    let goalCalories = 2150;
    try {
      const profile = await this.prisma.userProfile.findUnique({ where: { userId: targetUserId } });
      if (profile?.dailyCalorieGoal) {
        goalCalories = profile.dailyCalorieGoal;
      }
    } catch (e) {}

    const remainingCalories = Math.max(0, Math.round(goalCalories - dayTotalNutrition.calories));

    return {
      date: today.toISOString().split('T')[0],
      meals: mealGroups,
      totalNutrition: dayTotalNutrition,
      goalCalories,
      remainingCalories,
    };
  }

  async addMealItem(
    userId: string,
    dto: { mealType: MealType; foodId: string; weightGrams: number; scanId?: string },
  ) {
    const targetUserId = await this.ensureUserExists(userId || DEMO_USER_ID);

    const food = await this.foodService.findById(dto.foodId);
    if (!food || !food.nutrition) {
      throw new NotFoundException('Tanlangan taom bazada topilmadi');
    }

    const nutrition = this.nutritionService.calculateForWeight(dto.weightGrams, {
      calories: food.nutrition.caloriesPer100g,
      protein: food.nutrition.proteinPer100g,
      carbs: food.nutrition.carbsPer100g,
      fat: food.nutrition.fatPer100g,
      fiber: food.nutrition.fiberPer100g,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let meal = await this.prisma.meal.findFirst({
      where: {
        userId: targetUserId,
        type: dto.mealType,
        eatenAt: {
          gte: today,
        },
      },
    });

    if (!meal) {
      meal = await this.prisma.meal.create({
        data: {
          userId: targetUserId,
          type: dto.mealType,
          eatenAt: new Date(),
        },
      });
    }

    const mealItem = await this.prisma.mealItem.create({
      data: {
        mealId: meal.id,
        foodId: food.id,
        weightGrams: dto.weightGrams,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        fiber: nutrition.fiber || 0,
        scanId: dto.scanId || null,
      },
    });

    return mealItem;
  }

  async removeMealItem(userId: string, itemId: string) {
    const targetUserId = await this.ensureUserExists(userId || DEMO_USER_ID);
    const item = await this.prisma.mealItem.findUnique({
      where: { id: itemId },
      include: { meal: true },
    });

    if (!item || item.meal.userId !== targetUserId) {
      throw new NotFoundException('Ovqat elementi topilmadi');
    }

    await this.prisma.mealItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  }

  async updateMealItem(userId: string, itemId: string, weightGrams: number) {
    const targetUserId = await this.ensureUserExists(userId || DEMO_USER_ID);
    const item = await this.prisma.mealItem.findUnique({
      where: { id: itemId },
      include: { meal: true, food: { include: { nutrition: true } } },
    });

    if (!item || item.meal.userId !== targetUserId) {
      throw new NotFoundException('Ovqat elementi topilmadi');
    }

    if (!item.food.nutrition) {
      throw new NotFoundException('Taom ozuqaviy qiymati topilmadi');
    }

    const nutrition = this.nutritionService.calculateForWeight(weightGrams, {
      calories: item.food.nutrition.caloriesPer100g,
      protein: item.food.nutrition.proteinPer100g,
      carbs: item.food.nutrition.carbsPer100g,
      fat: item.food.nutrition.fatPer100g,
      fiber: item.food.nutrition.fiberPer100g,
    });

    const updated = await this.prisma.mealItem.update({
      where: { id: itemId },
      data: {
        weightGrams,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        fiber: nutrition.fiber || 0,
      },
    });

    return updated;
  }
}

