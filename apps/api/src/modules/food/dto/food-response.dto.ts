import { ApiProperty } from '@nestjs/swagger';

export class FoodNutritionDto {
  @ApiProperty({ example: 180, description: '100g dagi kaloriya (kkal)' })
  caloriesPer100g: number;

  @ApiProperty({ example: 12.5, description: '100g dagi oqsil (gramm)' })
  proteinPer100g: number;

  @ApiProperty({ example: 25.0, description: '100g dagi uglevod (gramm)' })
  carbsPer100g: number;

  @ApiProperty({ example: 8.5, description: '100g dagi yog‘ (gramm)' })
  fatPer100g: number;

  @ApiProperty({ example: 2.0, description: '100g dagi kletchatka (gramm)' })
  fiberPer100g: number;
}

export class FoodResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Osh' })
  name: string;

  @ApiProperty({ example: 'Palov (Osh)' })
  nameUz: string;

  @ApiProperty({ example: 'Плов', required: false })
  nameRu?: string;

  @ApiProperty({ example: 'Pilaf / Plov', required: false })
  nameEn?: string;

  @ApiProperty({
    example: 'UZBEK_NATIONAL',
    enum: [
      'UZBEK_NATIONAL',
      'FAST_FOOD',
      'HEALTHY',
      'DESSERT',
      'DRINK',
      'SOUP',
      'SALAD',
      'BAKERY',
      'MEAT_POULTRY',
      'FRUIT_VEGETABLE',
      'DAIRY',
      'SNACK',
      'OTHER',
    ],
  })
  category: string;

  @ApiProperty({ example: 'https://images.unsplash.com/...', required: false })
  imageUrl?: string;

  @ApiProperty({ example: 350, description: 'Standart 1 porsiya vazni (gramm)' })
  defaultServingGrams: number;

  @ApiProperty({ example: ['osh', 'palov', 'plov'], type: [String] })
  aliases: string[];

  @ApiProperty({ type: () => FoodNutritionDto })
  nutrition: FoodNutritionDto;
}
