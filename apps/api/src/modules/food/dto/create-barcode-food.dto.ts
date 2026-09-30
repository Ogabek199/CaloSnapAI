import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateBarcodeFoodDto {
  @ApiProperty({ example: '4780044571525' })
  @IsString()
  @Matches(/^\d{8,14}$/, { message: 'Shtrix-kod 8–14 ta raqamdan iborat bo‘lishi kerak' })
  barcode!: string;

  @ApiProperty({ example: 'Family gazsiz suv 0.5 L' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  @Max(900)
  caloriesPer100g!: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  proteinPer100g!: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  carbsPer100g!: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  fatPer100g!: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fiberPer100g?: number;

  @ApiPropertyOptional({ example: 500, description: 'Qadoq hajmi (g yoki ml)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5000)
  servingGrams?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDrink?: boolean;
}
