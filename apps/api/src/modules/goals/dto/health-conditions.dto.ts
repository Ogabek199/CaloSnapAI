import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum } from 'class-validator';
import { HealthCondition } from '@prisma/client';

export class UpdateHealthConditionsDto {
  @ApiProperty({ enum: HealthCondition, isArray: true, example: [HealthCondition.DIABETES_TYPE_2] })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(5)
  @IsEnum(HealthCondition, { each: true })
  conditions: HealthCondition[];
}
