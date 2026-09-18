import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FoodScanController } from './food-scan.controller';
import { FoodScanService } from './food-scan.service';
import { AIModule } from '../ai/ai.module';
import { FoodModule } from '../food/food.module';
import { NutritionModule } from '../nutrition/nutrition.module';

@Module({
  imports: [ConfigModule, AIModule, FoodModule, NutritionModule],
  controllers: [FoodScanController],
  providers: [FoodScanService],
  exports: [FoodScanService],
})
export class FoodScanModule {}
