import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { PremiumGuard } from './premium.guard';

@Module({
  imports: [AIModule, SubscriptionModule],
  controllers: [AssistantController],
  providers: [AssistantService, PremiumGuard],
})
export class AssistantModule {}
