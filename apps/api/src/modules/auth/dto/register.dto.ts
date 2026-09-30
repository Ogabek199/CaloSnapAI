import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityLevel, FitnessGoal, Gender } from '@prisma/client';

export class RegisterProfileDto {
  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 178 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @ApiPropertyOptional({ example: 75.5 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg?: number;

  @ApiPropertyOptional({ enum: ActivityLevel, example: ActivityLevel.MODERATE })
  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel;

  @ApiPropertyOptional({ enum: FitnessGoal, example: FitnessGoal.LOSE_WEIGHT })
  @IsOptional()
  @IsEnum(FitnessGoal)
  goal?: FitnessGoal;

  @ApiPropertyOptional({ example: 2150 })
  @IsOptional()
  @IsNumber()
  @Min(800)
  @Max(10000)
  dailyCalorieGoal?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  proteinGoalGrams?: number;

  @ApiPropertyOptional({ example: 230 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2000)
  carbsGoalGrams?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  fatGoalGrams?: number;
}

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
  @MaxLength(254)
  phone?: string;

  @ApiProperty({
    example: 'Secret123!',
    description: 'Foydalanuvchi paroli (kamida 6 ta belgi)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak' })
  @MaxLength(72, { message: 'Parol 72 belgidan oshmasligi kerak' })
  password: string;

  @ApiProperty({
    example: 'Ali Valiyev',
    description: 'Foydalanuvchi ismi va familiyasi',
  })
  @IsString()
  @IsNotEmpty({ message: 'Ism kiritilishi shart' })
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({
    description: 'Foydalanuvchining boshlang‘ich jismoniy ko‘rsatkichlari',
    type: () => RegisterProfileDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterProfileDto)
  profile?: RegisterProfileDto;
}
