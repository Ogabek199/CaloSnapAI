import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { Gender, ActivityLevel, FitnessGoal } from '@prisma/client';

export class CalculateGoalsDto {
  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'Jins (MALE, FEMALE)',
  })
  @IsEnum(Gender, { message: 'Jins MALE yoki FEMALE bo‘lishi kerak' })
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({
    example: 25,
    description: 'Yosh',
    minimum: 10,
    maximum: 120,
  })
  @IsInt()
  @Min(10)
  @Max(120)
  age: number;

  @ApiProperty({
    example: 75.5,
    description: 'Vazn (kg)',
    minimum: 30,
    maximum: 300,
  })
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg: number;

  @ApiProperty({
    example: 178,
    description: 'Bo‘y (sm)',
    minimum: 100,
    maximum: 250,
  })
  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm: number;

  @ApiProperty({
    enum: ActivityLevel,
    example: ActivityLevel.MODERATE,
    description: 'Jismoniy faollik darajasi (SEDENTARY, LIGHT, MODERATE, VERY_ACTIVE, EXTRA_ACTIVE)',
  })
  @IsEnum(ActivityLevel)
  @IsNotEmpty()
  activityLevel: ActivityLevel;

  @ApiProperty({
    enum: FitnessGoal,
    example: FitnessGoal.LOSE_WEIGHT,
    description: 'Fitness maqsadi (LOSE_WEIGHT, MAINTAIN, GAIN_WEIGHT, BUILD_MUSCLE)',
  })
  @IsEnum(FitnessGoal)
  @IsNotEmpty()
  goal: FitnessGoal;
}
