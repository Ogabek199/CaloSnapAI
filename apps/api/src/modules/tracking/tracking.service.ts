import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async addWeight(userId: string, weightKg: number, loggedAt?: string) {
    if (!weightKg || weightKg < 30 || weightKg > 300) {
      throw new BadRequestException('Vazn 30–300 kg oralig‘ida bo‘lishi kerak');
    }
    const at = loggedAt ? new Date(loggedAt) : new Date();
    if (at.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Kelajak sana uchun vazn kiritib bo‘lmaydi');
    }
    const log = await this.prisma.weightLog.create({
      data: { userId, weightKg, loggedAt: at },
    });
    const latest = await this.prisma.weightLog.findFirst({
      where: { userId },
      orderBy: [{ loggedAt: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
    if (latest?.id === log.id) {
      await this.prisma.userProfile.updateMany({
        where: { userId },
        data: { weightKg },
      });
    }
    return log;
  }

  async listWeight(userId: string, days = 30) {
    const range = Number.isFinite(days) ? Math.max(1, Math.min(days, 365)) : 30;
    const since = new Date();
    since.setDate(since.getDate() - range);
    since.setHours(0, 0, 0, 0);
    return this.prisma.weightLog.findMany({
      where: { userId, loggedAt: { gte: since } },
      orderBy: { loggedAt: 'asc' },
    });
  }

  async addWater(userId: string, amountMl: number) {
    const ml = Math.max(1, Math.min(5000, Number.isFinite(amountMl) ? amountMl : 250));
    return this.prisma.waterLog.create({
      data: { userId, amountMl: ml },
    });
  }

  async waterToday(userId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const logs = await this.prisma.waterLog.findMany({
      where: { userId, loggedAt: { gte: start, lt: end } },
      orderBy: { loggedAt: 'desc' },
    });
    const totalMl = logs.reduce((s, l) => s + l.amountMl, 0);
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    return {
      totalMl,
      goalMl: profile?.waterGoalMl || 2000,
      logs,
    };
  }
}
