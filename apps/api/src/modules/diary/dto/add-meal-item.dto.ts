import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max } from 'class-validator';
import { MealType } from '@prisma/client';

export class AddMealItemDto {
  @ApiProperty({
    enum: MealType,
    example: MealType.LUNCH,
    description: 'Ovqatlanish vaqti turi (BREAKFAST, LUNCH, DINNER, SNACK)',
  })
  @IsEnum(MealType, { message: 'Ovqatlanish turi noto‘g‘ri (BREAKFAST, LUNCH, DINNER, SNACK)' })
  @IsNotEmpty()
  mealType: MealType;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Taomning ma’lumotlar bazasidagi IDsi (Food ID)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Taom IDsi kiritilishi shart' })
  foodId: string;

  @ApiProperty({
    example: 350,
    description: 'Taom miqdori (grammda)',
  })
  @IsNumber()
  @IsPositive({ message: 'Vazn musbat son bo‘lishi kerak' })
  @Max(5000)
  weightGrams: number;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Agar rasm skanerdan qo‘shilayotgan bo‘lsa, skanerlash IDsi',
  })
  @IsString()
  @IsOptional()
  scanId?: string;
}
