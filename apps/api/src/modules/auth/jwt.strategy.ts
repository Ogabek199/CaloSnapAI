import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { hasActivePremium } from '../subscription/subscription.service';
import { REFRESH_TOKEN_TYPE } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; typ?: string }) {
    if (payload.typ === REFRESH_TOKEN_TYPE) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    const { password, refreshToken, ...result } = user;
    const phone = result.email.endsWith('@phone.eda.ai')
      ? `+${result.email.replace('@phone.eda.ai', '')}`
      : undefined;
    return { ...result, isPremium: hasActivePremium(user), ...(phone ? { phone } : {}) };
  }
}
