import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class AddWeightDto {
  @ApiProperty({ example: 78.5 })
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg!: number;

  @ApiPropertyOptional({ example: '2026-09-28T08:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  loggedAt?: string;
}

export class AddWaterDto {
  @ApiPropertyOptional({ example: 250, default: 250 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  amountMl?: number;
}
