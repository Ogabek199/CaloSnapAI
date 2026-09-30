import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Gender, ActivityLevel, FitnessGoal, HealthCondition } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate BMR (Mifflin-St Jeor formula) and TDEE (Total Daily Energy Expenditure)
   */
  calculateTDEE(params: {
    gender: Gender;
    age: number;
    weightKg: number;
    heightCm: number;
    activityLevel: ActivityLevel;
    goal: FitnessGoal;
  }): { dailyCalories: number; protein: number; carbs: number; fat: number } {
    // 1. Basal Metabolic Rate (BMR)
    let bmr = 10 * params.weightKg + 6.25 * params.heightCm - 5 * params.age;
    if (params.gender === 'MALE') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // 2. Activity Multiplier
    const multipliers: Record<ActivityLevel, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      VERY_ACTIVE: 1.725,
      EXTRA_ACTIVE: 1.9,
    };

    let maintenanceCalories = bmr * (multipliers[params.activityLevel] || 1.55);

    // 3. Goal Adjustment
    let targetCalories = maintenanceCalories;
    if (params.goal === 'LOSE_WEIGHT') {
      targetCalories -= 400; // Calorie deficit
    } else if (params.goal === 'GAIN_WEIGHT' || params.goal === 'BUILD_MUSCLE') {
      targetCalories += 350; // Calorie surplus
    }

    targetCalories = Math.max(1200, Math.round(targetCalories));

    // 4. Macro targets (Protein: 2g/kg, Fat: 25% of calories, Carbs: remainder)
    const proteinGrams = Math.round(params.weightKg * 2.0);
    const fatGrams = Math.round((targetCalories * 0.25) / 9);
    const carbsGrams = Math.round((targetCalories - (proteinGrams * 4 + fatGrams * 9)) / 4);

    return {
      dailyCalories: targetCalories,
      protein: proteinGrams,
      carbs: Math.max(0, carbsGrams),
      fat: fatGrams,
    };
  }

  async updateUserGoals(userId: string, dto: any) {
    const goals = this.calculateTDEE(dto);

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        age: dto.age,
        gender: dto.gender,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        activityLevel: dto.activityLevel,
        goal: dto.goal,
        dailyCalorieGoal: goals.dailyCalories,
        proteinGoalGrams: goals.protein,
        carbsGoalGrams: goals.carbs,
        fatGoalGrams: goals.fat,
        onboardingCompleted: true,
      },
      create: {
        userId,
        age: dto.age,
        gender: dto.gender,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        activityLevel: dto.activityLevel,
        goal: dto.goal,
        dailyCalorieGoal: goals.dailyCalories,
        proteinGoalGrams: goals.protein,
        carbsGoalGrams: goals.carbs,
        fatGoalGrams: goals.fat,
        onboardingCompleted: true,
      },
    });

    return {
      profile,
      calculatedGoals: goals,
    };
  }

  async updateHealthConditions(userId: string, conditions: HealthCondition[]) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new NotFoundException('Profil topilmadi');
    const updated = await this.prisma.userProfile.update({
      where: { userId },
      data: { healthConditions: [...new Set(conditions)] },
      select: { healthConditions: true },
    });
    return { healthConditions: updated.healthConditions };
  }
}
