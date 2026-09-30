import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserThrottlerGuard } from './common/user-throttler.guard';
import * as Joi from 'joi';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AIModule } from './modules/ai/ai.module';
import { FoodModule } from './modules/food/food.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { FoodScanModule } from './modules/food-scan/food-scan.module';
import { DiaryModule } from './modules/diary/diary.module';
import { GoalsModule } from './modules/goals/goals.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { HealthController } from './modules/health/health.controller';
import { LegalController } from './modules/legal/legal.controller';
import { StorageModule } from './modules/storage/storage.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { AssistantModule } from './modules/assistant/assistant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        TZ: Joi.string().optional(),
        DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
        JWT_SECRET: Joi.string().min(32).required(),
        GEMINI_API_KEY: Joi.string().required(),
        GEMINI_MODELS: Joi.string().optional(),
        SCAN_DAILY_LIMIT: Joi.number().integer().min(1).optional(),
        CORS_ORIGINS: Joi.string().optional(),
        CLOUDINARY_URL: Joi.string()
          .pattern(/^cloudinary:\/\//)
          .allow('')
          .optional(),
        REVENUECAT_WEBHOOK_AUTH: Joi.string().min(16).allow('').optional(),
        REVENUECAT_SECRET_API_KEY: Joi.string().allow('').optional(),
        REVENUECAT_ENTITLEMENT_IDS: Joi.string().optional(),
        AI_PREMIUM_BYPASS: Joi.string().valid('true', 'false').optional(),
      }),
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    ThrottlerModule.forRoot([
      // Per user when a bearer token is present, otherwise per IP (see UserThrottlerGuard).
      { name: 'default', ttl: 60_000, limit: 120 },
      // Backstop for a single IP regardless of token, sized for many users behind one carrier NAT.
      { name: 'ip', ttl: 60_000, limit: 1200, getTracker: (req) => `ip:${req.ip}` },
    ]),
    DatabaseModule,
    StorageModule,
    AuthModule,
    AIModule,
    FoodModule,
    NutritionModule,
    FoodScanModule,
    DiaryModule,
    GoalsModule,
    TrackingModule,
    SubscriptionModule,
    AssistantModule,
  ],
  controllers: [HealthController, LegalController],
  providers: [{ provide: APP_GUARD, useClass: UserThrottlerGuard }],
})
export class AppModule {}
