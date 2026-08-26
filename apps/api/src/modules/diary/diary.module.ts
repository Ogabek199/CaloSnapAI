import { Module } from '@nestjs/common';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { NutritionModule } from '../nutrition/nutrition.module';
import { FoodModule } from '../food/food.module';

@Module({
  imports: [NutritionModule, FoodModule],
  controllers: [DiaryController],
  providers: [DiaryService],
  exports: [DiaryService],
})
export class DiaryModule {}
