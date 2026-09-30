import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { AddMealItemDto } from './add-meal-item.dto';

export const MAX_BATCH_ITEMS = 20;

export class AddMealItemsBatchDto {
  @ApiProperty({ type: [AddMealItemDto], description: `Bir so‘rovda ko‘pi bilan ${MAX_BATCH_ITEMS} ta taom` })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => AddMealItemDto)
  items!: AddMealItemDto[];
}
