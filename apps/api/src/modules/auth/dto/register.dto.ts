import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Foydalanuvchi elektron pochta manzili (agar telefon kiritilmasa)',
  })
  @IsEmail({}, { message: 'To‘g‘ri email manzil kiriting' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '+998901234567',
    description: 'Foydalanuvchi telefon raqami (agar email kiritilmasa)',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Secret123!',
    description: 'Foydalanuvchi paroli (kamida 6 ta belgi)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak' })
  password: string;

  @ApiProperty({
    example: 'Ali Valiyev',
    description: 'Foydalanuvchi ismi va familiyasi',
  })
  @IsString()
  @IsNotEmpty({ message: 'Ism kiritilishi shart' })
  name: string;

  @ApiPropertyOptional({
    description: 'Foydalanuvchining boshlang‘ich jismoniy ko‘rsatkichlari',
  })
  @IsOptional()
  profile?: {
    age?: number;
    gender?: 'MALE' | 'FEMALE';
    heightCm?: number;
    weightKg?: number;
    activityLevel?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
    goal?: 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_WEIGHT' | 'BUILD_MUSCLE';
    dailyCalorieGoal?: number;
    proteinGoalGrams?: number;
    carbsGoalGrams?: number;
    fatGoalGrams?: number;
  };
}
