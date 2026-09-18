import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AIModule } from './modules/ai/ai.module';
import { FoodModule } from './modules/food/food.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { FoodScanModule } from './modules/food-scan/food-scan.module';
import { DiaryModule } from './modules/diary/diary.module';
import { GoalsModule } from './modules/goals/goals.module';
import { TrackingModule } from './modules/tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    AIModule,
    FoodModule,
    NutritionModule,
    FoodScanModule,
    DiaryModule,
    GoalsModule,
    TrackingModule,
  ],
})
export class AppModule {}
