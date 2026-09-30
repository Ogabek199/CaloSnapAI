import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, Max } from 'class-validator';

export class UpdateScanItemDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'To‘g‘rilangan taom IDsi (agar AI taom turini xato aniqlagan bo‘lsa)',
  })
  @IsString()
  @IsOptional()
  foodId?: string;

  @ApiPropertyOptional({
    example: 450,
    description: 'To‘g‘rilangan taom vazni (grammda)',
  })
  @IsNumber()
  @IsPositive()
  @Max(5000)
  @IsOptional()
  weightGrams?: number;
}
