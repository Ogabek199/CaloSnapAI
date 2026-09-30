import { Module } from '@nestjs/common';
import { SubscriptionController, SubscriptionSyncController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  controllers: [SubscriptionController, SubscriptionSyncController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
