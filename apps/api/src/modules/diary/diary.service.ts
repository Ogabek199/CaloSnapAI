import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { FoodService } from '../food/food.service';
import { MealType } from '@prisma/client';
import { DailyDiarySummary, MealGroup } from '@eda/types';

const DEMO_USER_ID = 'demo-user';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

  /** Local calendar day bounds from YYYY-MM-DD */
  private parseLocalDay(dateStr: string): { start: Date; end: Date; key: string } {
    if (!DATE_RE.test(dateStr)) {
      throw new BadRequestException('Sana YYYY-MM-DD formatida bo‘lishi kerak');
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    if (
      Number.isNaN(start.getTime()) ||
      start.getFullYear() !== y ||
      start.getMonth() !== m - 1 ||
      start.getDate() !== d
    ) {
      throw new BadRequestException('Noto‘g‘ri sana');
    }
    const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
    return { start, end, key: dateStr };
  }

  private todayKeyLocal(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async getTodaySummary(userId?: string): Promise<DailyDiarySummary> {
    return this.getSummaryForDate(userId, this.todayKeyLocal());
  }

  async getSummaryForDate(userId: string | undefined, dateStr: string): Promise<DailyDiarySummary> {
    const targetUserId = await this.ensureUserExists(userId || DEMO_USER_ID);
    const { start, end, key } = this.parseLocalDay(dateStr);

    const todayKey = this.todayKeyLocal();
    if (key > todayKey) {
      throw new BadRequestException('Kelajak kunlar uchun kundalik mavjud emas');
    }

    const meals = await this.prisma.meal.findMany({
      where: {
        userId: targetUserId,
        eatenAt: {
          gte: start,
          lt: end,
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
        eatenAt: start.toISOString(),
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
      date: key,
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

    const n = food.nutrition as any;
    const per100 = {
      calories: n.caloriesPer100g ?? n.calories ?? 0,
      protein: n.proteinPer100g ?? n.protein ?? 0,
      carbs: n.carbsPer100g ?? n.carbs ?? 0,
      fat: n.fatPer100g ?? n.fat ?? 0,
      fiber: n.fiberPer100g ?? n.fiber ?? 0,
    };
    const nutrition = this.nutritionService.calculateForWeight(dto.weightGrams, per100);

    // #region agent log
    fetch('http://127.0.0.1:7792/ingest/6c5ee04d-5922-41f6-a1d7-1daa74bc9cfe',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d39391'},body:JSON.stringify({sessionId:'d39391',runId:'post-fix',hypothesisId:'H5',location:'diary.service.ts:addMealItem',message:'meal item nutrition calc',data:{foodId:dto.foodId,weightGrams:dto.weightGrams,per100,calories:nutrition.calories,isNaN:Number.isNaN(nutrition.calories)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if ([nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat].some((v) => !Number.isFinite(v))) {
      throw new BadRequestException('Taom ozuqaviy qiymati hisoblanmadi');
    }

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
        meal: { connect: { id: meal.id } },
        food: { connect: { id: food.id } },
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

    const n = item.food.nutrition as any;
    const nutrition = this.nutritionService.calculateForWeight(weightGrams, {
      calories: n.caloriesPer100g ?? n.calories ?? 0,
      protein: n.proteinPer100g ?? n.protein ?? 0,
      carbs: n.carbsPer100g ?? n.carbs ?? 0,
      fat: n.fatPer100g ?? n.fat ?? 0,
      fiber: n.fiberPer100g ?? n.fiber ?? 0,
    });

    if ([nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat].some((v) => !Number.isFinite(v))) {
      throw new BadRequestException('Taom ozuqaviy qiymati hisoblanmadi');
    }

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

  /**
   * Daily calorie totals for a date range (inclusive), plus logging streak.
   * from/to: YYYY-MM-DD local calendar keys.
   */
  async getRangeSummary(userId: string, fromStr: string, toStr: string) {
    const targetUserId = await this.ensureUserExists(userId || DEMO_USER_ID);
    const { start: fromStart } = this.parseLocalDay(fromStr);
    const { end: toEnd } = this.parseLocalDay(toStr);
    if (fromStr > toStr) {
      throw new BadRequestException('from sana to dan katta bo‘lishi mumkin emas');
    }

    let goalCalories = 2150;
    try {
      const profile = await this.prisma.userProfile.findUnique({ where: { userId: targetUserId } });
      if (profile?.dailyCalorieGoal) goalCalories = profile.dailyCalorieGoal;
    } catch (e) {}

    const meals = await this.prisma.meal.findMany({
      where: {
        userId: targetUserId,
        eatenAt: { gte: fromStart, lt: toEnd },
      },
      include: { items: true },
      orderBy: { eatenAt: 'asc' },
    });

    const byDate = new Map<string, { calories: number; protein: number; carbs: number; fat: number; logged: boolean }>();

    // Seed empty days
    const cursor = new Date(fromStart);
    while (cursor < toEnd) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      byDate.set(`${y}-${m}-${d}`, { calories: 0, protein: 0, carbs: 0, fat: 0, logged: false });
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const meal of meals) {
      const eaten = new Date(meal.eatenAt);
      const y = eaten.getFullYear();
      const m = String(eaten.getMonth() + 1).padStart(2, '0');
      const d = String(eaten.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      const bucket = byDate.get(key);
      if (!bucket) continue;
      for (const item of meal.items) {
        bucket.calories += item.calories || 0;
        bucket.protein += item.protein || 0;
        bucket.carbs += item.carbs || 0;
        bucket.fat += item.fat || 0;
        bucket.logged = true;
      }
    }

    const days = Array.from(byDate.entries()).map(([date, v]) => ({
      date,
      calories: Math.round(v.calories),
      protein: Math.round(v.protein * 10) / 10,
      carbs: Math.round(v.carbs * 10) / 10,
      fat: Math.round(v.fat * 10) / 10,
      logged: v.logged,
      goalHit: v.logged && v.calories > 0 && v.calories <= goalCalories * 1.05 && v.calories >= goalCalories * 0.85,
    }));

    // Streak: consecutive logged days ending at today (or toStr if today in range)
    const todayKey = this.todayKeyLocal();
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      if (day.date > todayKey) continue;
      if (day.logged) streak += 1;
      else break;
    }

    const loggedDays = days.filter((d) => d.logged);
    const avgCalories =
      loggedDays.length > 0
        ? Math.round(loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length)
        : 0;

    return {
      from: fromStr,
      to: toStr,
      goalCalories,
      streak,
      avgCalories,
      daysLogged: loggedDays.length,
      days,
    };
  }
}
