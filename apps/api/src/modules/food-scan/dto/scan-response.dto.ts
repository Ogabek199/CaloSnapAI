import { ApiProperty } from '@nestjs/swagger';
import { FoodResponseDto } from '../../food/dto/food-response.dto';

export class CalculatedNutritionDto {
  @ApiProperty({ example: 680, description: 'Jami kaloriya (kkal)' })
  calories: number;

  @ApiProperty({ example: 28.5, description: 'Jami oqsil (gramm)' })
  protein: number;

  @ApiProperty({ example: 74.0, description: 'Jami uglevod (gramm)' })
  carbs: number;

  @ApiProperty({ example: 31.2, description: 'Jami yog‘ (gramm)' })
  fat: number;

  @ApiProperty({ example: 5.4, description: 'Jami kletchatka (gramm)' })
  fiber: number;
}

export class FoodScanItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  foodId: string;

  @ApiProperty({ type: () => FoodResponseDto })
  food: FoodResponseDto;

  @ApiProperty({ example: 350, description: 'Aniqlangan/belgilangan vazn (gramm)' })
  weightGrams: number;

  @ApiProperty({ type: () => CalculatedNutritionDto })
  nutrition: CalculatedNutritionDto;

  @ApiProperty({ example: 0.95, description: 'AI aniqlik darajasi (0 - 1.0)' })
  confidence: number;

  @ApiProperty({ example: false, description: 'Foydalanuvchi tomonidan tahrirlanganmi' })
  isUserModified: boolean;
}

export class FoodScanResultDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  id: string;

  @ApiProperty({ example: 'data:image/jpeg;base64,...' })
  imageUrl: string;

  @ApiProperty({ example: 'COMPLETED', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] })
  status: string;

  @ApiProperty({ type: () => [FoodScanItemDto] })
  items: FoodScanItemDto[];

  @ApiProperty({ type: () => CalculatedNutritionDto })
  totalNutrition: CalculatedNutritionDto;

  @ApiProperty({ example: '2026-08-26T12:30:00.000Z' })
  createdAt: string;
}
