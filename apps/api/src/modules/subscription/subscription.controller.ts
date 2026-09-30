import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { timingSafeEqual } from 'crypto';
import { RevenueCatEvent, SubscriptionService } from './subscription.service';

@ApiExcludeController()
@SkipThrottle({ default: true, ip: true })
@Controller('webhooks')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
  ) {}

  @Post('revenuecat')
  @HttpCode(HttpStatus.OK)
  async revenuecat(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { event?: RevenueCatEvent },
  ) {
    const expected = this.configService.get<string>('REVENUECAT_WEBHOOK_AUTH');
    if (!expected) {
      throw new ServiceUnavailableException('Webhook not configured');
    }
    if (!authorization || !safeEqual(authorization, expected)) {
      throw new UnauthorizedException();
    }
    if (!body?.event?.type) {
      return { ok: true, ignored: true };
    }

    await this.subscriptionService.handleEvent(body.event);
    return { ok: true };
  }
}

@ApiTags('Subscription')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('subscription')
export class SubscriptionSyncController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Re-read premium status from RevenueCat right after a purchase/restore' })
  async sync(@Request() req: any) {
    return this.subscriptionService.syncUser(req.user.id);
  }
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
