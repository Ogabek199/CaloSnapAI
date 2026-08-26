import { ApiProperty } from '@nestjs/swagger';
import { FoodResponseDto } from '../../food/dto/food-response.dto';
import { CalculatedNutritionDto } from '../../food-scan/dto/scan-response.dto';

export class DiaryMealItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  mealId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  foodId: string;

  @ApiProperty({ type: () => FoodResponseDto })
  food: FoodResponseDto;

  @ApiProperty({ example: 350, description: 'Iste’mol qilingan vazn (gramm)' })
  weightGrams: number;

  @ApiProperty({ type: () => CalculatedNutritionDto })
  nutrition: CalculatedNutritionDto;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', required: false })
  scanId?: string;

  @ApiProperty({ example: '2026-08-26T13:00:00.000Z' })
  createdAt: string;
}

export class MealGroupDto {
  @ApiProperty({ example: 'LUNCH' })
  id: string;

  @ApiProperty({ example: 'LUNCH', enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] })
  type: string;

  @ApiProperty({ type: () => [DiaryMealItemDto] })
  items: DiaryMealItemDto[];

  @ApiProperty({ type: () => CalculatedNutritionDto })
  totalNutrition: CalculatedNutritionDto;

  @ApiProperty({ example: '2026-08-26T13:00:00.000Z' })
  eatenAt: string;
}

export class DailyDiarySummaryDto {
  @ApiProperty({ example: '2026-08-26' })
  date: string;

  @ApiProperty({ type: () => [MealGroupDto] })
  meals: MealGroupDto[];

  @ApiProperty({ type: () => CalculatedNutritionDto })
  totalNutrition: CalculatedNutritionDto;

  @ApiProperty({ example: 2150, description: 'Kunlik kaloriya maqsadi' })
  goalCalories: number;

  @ApiProperty({ example: 1470, description: 'Qolgan kaloriya limiti' })
  remainingCalories: number;
}
