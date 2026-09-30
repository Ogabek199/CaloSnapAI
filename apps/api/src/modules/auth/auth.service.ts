import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { detectImageMime } from '../food-scan/image-validation';
import { hasActivePremium } from '../subscription/subscription.service';
import { RegisterDto } from './dto/register.dto';

export const REFRESH_TOKEN_TYPE = 'refresh';

const PHONE_EMAIL_SUFFIX = '@phone.eda.ai';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function toSafeUser<T extends { password: string; refreshToken: string | null; isPremium: boolean; premiumUntil: Date | null }>(
  user: T,
) {
  const { password, refreshToken, ...rest } = user;
  return { ...rest, isPremium: hasActivePremium(user) };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly storage: StorageService,
  ) {}

  private normalizeIdentifier(input: string): string {
    const trimmed = (input || '').trim().toLowerCase();
    if (trimmed.includes('@')) {
      if (!EMAIL_RE.test(trimmed) || trimmed.endsWith(PHONE_EMAIL_SUFFIX)) {
        throw new BadRequestException('To‘g‘ri email manzil kiriting');
      }
      return trimmed;
    }
    // Clean phone number (e.g. +998901234567 -> 998901234567@phone.eda.ai)
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      throw new BadRequestException('Telefon raqami noto‘g‘ri');
    }
    return `${digitsOnly}@phone.eda.ai`;
  }

  async register(dto: RegisterDto) {
    const rawIdentifier = dto.phone || dto.email;
    if (!rawIdentifier) {
      throw new BadRequestException('Telefon raqami yoki email kiritilishi shart');
    }

    const email = this.normalizeIdentifier(rawIdentifier);
    const name = (dto.name || '').trim().replace(/\s+/g, ' ');
    if (name.length < 2) {
      throw new BadRequestException('Ism kamida 2 ta harfdan iborat bo‘lishi kerak');
    }
    const p = dto.profile;
    const hasRealStats = !!(p && p.age && p.heightCm && p.weightKg && p.goal && p.gender && p.activityLevel);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Bu telefon raqami bilan foydalanuvchi allaqachon mavjud. Tizimga kiring.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user
      .create({
        data: {
          email,
          password: hashedPassword,
          name,
          profile: {
            create: {
              age: dto.profile?.age ?? 25,
              gender: dto.profile?.gender ?? 'MALE',
              heightCm: dto.profile?.heightCm ?? 180,
              weightKg: dto.profile?.weightKg ?? 80,
              activityLevel: dto.profile?.activityLevel ?? 'MODERATE',
              goal: dto.profile?.goal ?? 'LOSE_WEIGHT',
              dailyCalorieGoal: dto.profile?.dailyCalorieGoal ?? 2150,
              proteinGoalGrams: dto.profile?.proteinGoalGrams,
              carbsGoalGrams: dto.profile?.carbsGoalGrams,
              fatGoalGrams: dto.profile?.fatGoalGrams,
              onboardingCompleted: hasRealStats,
            },
          },
        },
        include: {
          profile: true,
        },
      })
      .catch((e) => {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw new ConflictException('Bu telefon raqami bilan foydalanuvchi allaqachon mavjud. Tizimga kiring.');
        }
        throw e;
      });

    const tokens = this.generateTokens(user.id, user.email);
    const safeUser = toSafeUser(user);

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
      throw new NotFoundException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'Bu telefon raqami bilan foydalanuvchi topilmadi. Ro‘yxatdan o‘ting.',
      });
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_PASSWORD',
        message: 'Parol noto‘g‘ri',
      });
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
    const safeUser = toSafeUser(user);

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

  async updateAvatar(userId: string, avatarInput: string) {
    let avatarUrl = avatarInput;
    if (avatarInput.startsWith('data:image/')) {
      const raw = Buffer.from(avatarInput.split(';base64,')[1] || '', 'base64');
      if (!detectImageMime(raw)) {
        throw new BadRequestException('Profil rasmi JPEG, PNG yoki WebP bo‘lishi kerak');
      }
      const jpeg = await sharp(raw)
        .rotate()
        .resize(512, 512, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer()
        .catch(() => {
          throw new BadRequestException('Profil rasmini o‘qib bo‘lmadi');
        });
      // Without remote storage the mobile app can't resolve a relative /uploads path, so keep a small data URI.
      avatarUrl = this.storage.isRemote
        ? await this.storage.saveJpeg(jpeg, 'avatars')
        : `data:image/jpeg;base64,${jpeg.toString('base64')}`;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      include: { profile: true },
    });
    const safeUser = toSafeUser(user);
    return safeUser;
  }

  /**
   * Permanently removes the account and everything tied to it (profile, diary, logs, scans, photos).
   * Store subscriptions are billed by Apple/Google and must be cancelled there; the app tells the user.
   */
  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const isMatch = await bcrypt.compare(password || '', user.password);
    if (!isMatch) {
      // 403, not 401: clients treat 401 as an expired session and sign the user out.
      throw new ForbiddenException({
        statusCode: 403,
        code: 'INVALID_PASSWORD',
        message: 'Parol noto‘g‘ri',
      });
    }

    const scans = await this.prisma.foodScan.findMany({ where: { userId }, select: { imageUrl: true } });
    await this.prisma.$transaction([
      // Scans only SetNull on user delete, but their photos are personal data.
      this.prisma.foodScan.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
    await this.storage.deleteMany([user.avatarUrl, ...scans.map((s) => s.imageUrl)]);
    return { deleted: true };
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      refreshToken: this.jwtService.sign({ ...payload, typ: REFRESH_TOKEN_TYPE }, { expiresIn: '30d' }),
    };
  }
}
