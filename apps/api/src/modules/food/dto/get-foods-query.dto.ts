import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FoodCategory } from '@prisma/client';

export class GetFoodsQueryDto {
  @ApiPropertyOptional({
    example: 'Osh',
    description: 'Taom nomi bo‘yicha qidiruv (uz/ru/en yoki sinonimlar)',
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: FoodCategory,
    example: FoodCategory.UZBEK_NATIONAL,
    description: 'Taom kategoriyasi bo‘yicha filter',
  })
  @IsEnum(FoodCategory)
  @IsOptional()
  category?: FoodCategory;
}
