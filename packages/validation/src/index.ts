import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Noto‘g‘ri email formati'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak'),
  name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo‘lishi kerak'),
});

export const loginSchema = z.object({
  email: z.string().email('Noto‘g‘ri email formati'),
  password: z.string().min(1, 'Parolni kiriting'),
});

export const userProfileSchema = z.object({
  age: z.number().int().min(10).max(120),
  gender: z.enum(['MALE', 'FEMALE']),
  heightCm: z.number().min(50).max(250),
  weightKg: z.number().min(20).max(300),
  activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE', 'EXTRA_ACTIVE']),
  goal: z.enum(['LOSE_WEIGHT', 'MAINTAIN', 'GAIN_WEIGHT', 'BUILD_MUSCLE']),
  dailyCalorieGoal: z.number().optional(),
});

export const updateScanItemSchema = z.object({
  foodId: z.string().uuid().optional(),
  weightGrams: z.number().positive('Og‘irlik 0 dan katta bo‘lishi kerak').max(3000),
});

export const addMealItemSchema = z.object({
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  foodId: z.string().uuid(),
  weightGrams: z.number().positive().max(3000),
  eatenAt: z.string().datetime().optional(),
});
