import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Max } from 'class-validator';

export class UpdateMealItemDto {
  @ApiProperty({
    example: 300,
    description: 'Taomning yangi miqdori (grammda)',
    minimum: 1,
  })
  @IsNumber()
  @IsPositive({ message: 'Vazn musbat son bo‘lishi kerak' })
  @Max(5000)
  weightGrams: number;
}
