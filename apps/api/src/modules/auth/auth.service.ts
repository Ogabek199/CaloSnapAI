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

  async register(dto: {
    email?: string;
    phone?: string;
    password: string;
    name: string;
    profile?: {
      age?: number;
      gender?: 'MALE' | 'FEMALE';
      heightCm?: number;
      weightKg?: number;
      activityLevel?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
      goal?: 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_WEIGHT' | 'BUILD_MUSCLE';
      dailyCalorieGoal?: number;
      proteinGoalGrams?: number;
      carbsGoalGrams?: number;
      fatGoalGrams?: number;
    };
  }) {
    const rawIdentifier = dto.phone || dto.email;
    if (!rawIdentifier) {
      throw new BadRequestException('Telefon raqami yoki email kiritilishi shart');
    }

    const email = this.normalizeIdentifier(rawIdentifier);

    const existing = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (existing) {
      const isMatch = await bcrypt.compare(dto.password, existing.password);
      if (isMatch) {
        if (dto.profile) {
          await this.prisma.userProfile.upsert({
            where: { userId: existing.id },
            update: {
              age: dto.profile.age ?? existing.profile?.age ?? 25,
              gender: (dto.profile.gender as any) ?? existing.profile?.gender ?? 'MALE',
              heightCm: dto.profile.heightCm ?? existing.profile?.heightCm ?? 180,
              weightKg: dto.profile.weightKg ?? existing.profile?.weightKg ?? 80,
              activityLevel: (dto.profile.activityLevel as any) ?? existing.profile?.activityLevel ?? 'MODERATE',
              goal: (dto.profile.goal as any) ?? existing.profile?.goal ?? 'LOSE_WEIGHT',
              dailyCalorieGoal: dto.profile.dailyCalorieGoal ?? existing.profile?.dailyCalorieGoal ?? 2150,
              proteinGoalGrams: dto.profile.proteinGoalGrams ?? existing.profile?.proteinGoalGrams,
              carbsGoalGrams: dto.profile.carbsGoalGrams ?? existing.profile?.carbsGoalGrams,
              fatGoalGrams: dto.profile.fatGoalGrams ?? existing.profile?.fatGoalGrams,
            },
            create: {
              userId: existing.id,
              age: dto.profile.age ?? 25,
              gender: (dto.profile.gender as any) ?? 'MALE',
              heightCm: dto.profile.heightCm ?? 180,
              weightKg: dto.profile.weightKg ?? 80,
              activityLevel: (dto.profile.activityLevel as any) ?? 'MODERATE',
              goal: (dto.profile.goal as any) ?? 'LOSE_WEIGHT',
              dailyCalorieGoal: dto.profile.dailyCalorieGoal ?? 2150,
            },
          });
        }
        const updatedUser = await this.prisma.user.findUnique({
          where: { id: existing.id },
          include: { profile: true },
        });
        const tokens = this.generateTokens(existing.id, existing.email);
        const { password, ...safeUser } = updatedUser || existing;
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
      throw new BadRequestException('Bu telefon raqami bilan foydalanuvchi allaqachon mavjud. Tizimga kiring.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: dto.name,
        profile: {
          create: {
            age: dto.profile?.age ?? 25,
            gender: (dto.profile?.gender as any) ?? 'MALE',
            heightCm: dto.profile?.heightCm ?? 180,
            weightKg: dto.profile?.weightKg ?? 80,
            activityLevel: (dto.profile?.activityLevel as any) ?? 'MODERATE',
            goal: (dto.profile?.goal as any) ?? 'LOSE_WEIGHT',
            dailyCalorieGoal: dto.profile?.dailyCalorieGoal ?? 2150,
            proteinGoalGrams: dto.profile?.proteinGoalGrams,
            carbsGoalGrams: dto.profile?.carbsGoalGrams,
            fatGoalGrams: dto.profile?.fatGoalGrams,
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

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      include: { profile: true },
    });
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async requestPasswordReset(identifier: string) {
    const email = this.normalizeIdentifier(identifier);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak whether user exists
      return { ok: true, message: 'Agar akkaunt mavjud bo‘lsa, kod yuborildi' };
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.passwordResetOtp.create({
      data: { userId: user.id, codeHash, expiresAt },
    });
    // SMS gateway yo‘q — developmentda kod qaytariladi; productionda faqat SMS
    const isDev = process.env.NODE_ENV !== 'production';
    return {
      ok: true,
      message: 'Parolni tiklash kodi yaratildi',
      ...(isDev ? { debugCode: code } : {}),
    };
  }

  async confirmPasswordReset(identifier: string, code: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Yangi parol kamida 6 belgidan iborat bo‘lishi kerak');
    }
    const email = this.normalizeIdentifier(identifier);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Noto‘g‘ri kod yoki foydalanuvchi');
    }
    const otp = await this.prisma.passwordResetOtp.findFirst({
      where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) {
      throw new BadRequestException('Kod muddati tugagan yoki topilmadi');
    }
    const match = await bcrypt.compare(code, otp.codeHash);
    if (!match) {
      throw new UnauthorizedException('Kod noto‘g‘ri');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
      this.prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { used: true } }),
    ]);
    return { ok: true, message: 'Parol muvaffaqiyatli yangilandi' };
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
    };
  }
}
