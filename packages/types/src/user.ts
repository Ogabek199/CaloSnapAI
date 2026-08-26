export type Gender = 'MALE' | 'FEMALE';

export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHT'
  | 'MODERATE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';

export type FitnessGoal = 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_WEIGHT' | 'BUILD_MUSCLE';

export interface UserProfile {
  id: string;
  userId: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  dailyCalorieGoal: number;
  proteinGoalGrams?: number;
  carbsGoalGrams?: number;
  fatGoalGrams?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  profile?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}
