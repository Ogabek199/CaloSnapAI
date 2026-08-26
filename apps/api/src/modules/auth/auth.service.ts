import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private normalizeIdentifier(input: string): string {
    const trimmed = (input || '').trim().toLowerCase();
    if (trimmed.includes('@')) {
      return trimmed;
    }
    // Clean phone number (e.g. +998901234567 -> 998901234567@phone.eda.ai)
    const digitsOnly = trimmed.replace(/\D/g, '');
    return `${digitsOnly}@phone.eda.ai`;
  }

  async register(dto: { email?: string; phone?: string; password: string; name: string }) {
    const rawIdentifier = dto.phone || dto.email;
    if (!rawIdentifier) {
      throw new BadRequestException('Telefon raqami yoki email kiritilishi shart');
    }

    const email = this.normalizeIdentifier(rawIdentifier);

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException('Bu telefon raqami bilan foydalanuvchi allaqachon mavjud');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: dto.name,
        profile: {
          create: {
            age: 25,
            gender: 'MALE',
            heightCm: 180,
            weightKg: 80,
            activityLevel: 'MODERATE',
            goal: 'LOSE_WEIGHT',
            dailyCalorieGoal: 2150,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const tokens = this.generateTokens(user.id, user.email);
    const { password, ...safeUser } = user;

    const cleanPhone =
      dto.phone ||
      (email.endsWith('@phone.eda.ai') ? `+${email.replace('@phone.eda.ai', '')}` : '');

    return {
      ...tokens,
      user: {
        ...safeUser,
        phone: cleanPhone,
      },
    };
  }

  async login(dto: { email?: string; phone?: string; password: string }) {
    const rawIdentifier = dto.phone || dto.email;
    if (!rawIdentifier) {
      throw new BadRequestException('Telefon raqami yoki email kiritilishi shart');
    }

    const email = this.normalizeIdentifier(rawIdentifier);

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Telefon raqami yoki parol noto‘g‘ri');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Telefon raqami yoki parol noto‘g‘ri');
    }

    // Ensure user has profile if it was missing
    if (!user.profile) {
      const profile = await this.prisma.userProfile.create({
        data: {
          userId: user.id,
          age: 25,
          gender: 'MALE',
          heightCm: 180,
          weightKg: 80,
          activityLevel: 'MODERATE',
          goal: 'LOSE_WEIGHT',
          dailyCalorieGoal: 2150,
        },
      });
      user = { ...user, profile };
    }

    const tokens = this.generateTokens(user.id, user.email);
    const { password, ...safeUser } = user;

    const cleanPhone =
      dto.phone ||
      (email.endsWith('@phone.eda.ai') ? `+${email.replace('@phone.eda.ai', '')}` : '');

    return {
      ...tokens,
      user: {
        ...safeUser,
        phone: cleanPhone,
      },
    };
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
    };
  }
}
