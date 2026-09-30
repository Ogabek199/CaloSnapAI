import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from '../subscription/subscription.service';

/** Must run after AuthGuard('jwt'): relies on `req.user.isPremium` computed by JwtStrategy. */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    private readonly subscriptions: SubscriptionService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest().user;
    if (!user?.id) throw new UnauthorizedException();
    if (user.isPremium) return true;

    if (this.config.get('NODE_ENV') !== 'production' && this.config.get('AI_PREMIUM_BYPASS') === 'true') {
      return true;
    }

    // A purchase may land before the RevenueCat webhook does; ask RevenueCat directly before refusing.
    const synced = await this.subscriptions.syncUser(user.id).catch(() => null);
    if (synced?.isPremium) return true;

    throw new ForbiddenException({
      statusCode: 403,
      code: 'PREMIUM_REQUIRED',
      message: 'Bu funksiya faqat Pro obunachilar uchun',
    });
  }
}
