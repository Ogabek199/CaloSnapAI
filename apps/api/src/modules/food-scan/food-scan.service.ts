import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { hasActivePremium } from '../subscription/subscription.service';
import { AIService } from '../ai/ai.service';
import { DetectedFoodItem } from '../ai/ai.types';
import { FoodService } from '../food/food.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { FoodScanResult, CalculatedNutrition, UpdateScanItemDto } from '@eda/types';

const FREE_DAILY_SCAN_LIMIT = 30;

@Injectable()
export class FoodScanService {
  private readonly logger = new Logger(FoodScanService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly foodService: FoodService,
    private readonly nutritionService: NutritionService,
    private readonly configService: ConfigService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Every attempt (including failed / non-food ones) counts toward the daily quota,
   * because each one costs a Gemini call. The advisory lock serializes concurrent
   * requests from the same user so they cannot all pass the check at once.
   */
  private async reserveScan(userId: string): Promise<string> {
    const limit = parseInt(this.configService.get('SCAN_DAILY_LIMIT') || `${FREE_DAILY_SCAN_LIMIT}`, 10);

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { isPremium: true, premiumUntil: true },
      });
      if (!user) throw new BadRequestException('Foydalanuvchi topilmadi');

      if (!hasActivePremium(user)) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const count = await tx.foodScan.count({
          where: { userId, createdAt: { gte: start } },
        });
        if (count >= limit) {
          throw new ForbiddenException({
            statusCode: 403,
            code: 'SCAN_LIMIT_REACHED',
            limit,
            message: `Kunlik skaner limiti tugadi (${limit}). Ertaga qayta urinib ko‘ring yoki qo‘lda taom qo‘shing.`,
          });
        }
      }

      const scan = await tx.foodScan.create({
        data: { userId, imageUrl: '', status: 'PROCESSING' },
        select: { id: true },
      });
      return scan.id;
    });
  }

  private async markScanFailed(scanId: string, rawAiText?: string) {
    await this.prisma.foodScan
      .update({ where: { id: scanId }, data: { status: 'FAILED', rawAiText } })
      .catch((e) => this.logger.warn(`Failed to mark scan ${scanId} as FAILED: ${e?.message}`));
  }

  async processFoodImage(
    fileBuffer: Buffer,
    mimeType: string,
    userId?: string,
  ): Promise<FoodScanResult> {
    if (!userId) {
      throw new BadRequestException('Autentifikatsiya talab qilinadi');
    }
    const scanId = await this.reserveScan(userId);

    let processedBuffer = fileBuffer;
    let finalMime = mimeType;

    try {
      processedBuffer = await sharp(fileBuffer)
        .rotate()
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();
      finalMime = 'image/jpeg';
      this.logger.log(`Image optimized: original ${fileBuffer.length} bytes -> ${processedBuffer.length} bytes`);
    } catch (e: any) {
      this.logger.warn(`Image compression skipped: ${e?.message}`);
      processedBuffer = fileBuffer;
    }

    const base64Image = processedBuffer.toString('base64');

    let aiResult: Awaited<ReturnType<AIService['analyzeImage']>>;
    try {
      aiResult = await this.aiService.analyzeImage(base64Image, finalMime);
    } catch (e) {
      await this.markScanFailed(scanId);
      throw e;
    }

    if (!aiResult.isFood || !aiResult.items || aiResult.items.length === 0) {
      await this.markScanFailed(scanId, aiResult.rawText || '');
      throw new UnprocessableEntityException({
        statusCode: 422,
        code: 'NOT_FOOD',
        message:
          aiResult.rejectionReason || 'Rasmda taom yoki ichimlik aniqlanmadi. Iltimos, haqiqiy ovqat rasmini yuklang.',
      });
    }

    let storedUrl = '';
    if (finalMime === 'image/jpeg') {
      try {
        storedUrl = await this.storage.saveJpeg(processedBuffer, 'scans');
      } catch (e: any) {
        this.logger.warn(`Scan image upload failed: ${e?.message}`);
      }
    }

    let calculatedItems: FoodScanResult['items'];
    try {
      calculatedItems = await this.createScanItems(scanId, aiResult.items);
    } catch (e) {
      await this.markScanFailed(scanId, aiResult.rawText || '');
      throw e;
    }

    if (calculatedItems.length === 0) {
      await this.markScanFailed(scanId, aiResult.rawText || '');
      throw new UnprocessableEntityException('Taom aniqlandi, lekin bazada mos ovqat qiymati topilmadi.');
    }

    const scan = await this.prisma.foodScan.update({
      where: { id: scanId },
      data: {
        imageUrl: storedUrl,
        status: 'COMPLETED',
        rawAiText: aiResult.rawText || '',
      },
    });

    const totalNutrition: CalculatedNutrition = this.nutritionService.aggregateNutrition(
      calculatedItems.map((i) => i.nutrition),
    );

    return {
      id: scan.id,
      imageUrl: scan.imageUrl,
      status: scan.status as any,
      items: calculatedItems,
      totalNutrition,
      createdAt: scan.createdAt.toISOString(),
    };
  }

  private async createScanItems(scanId: string, items: DetectedFoodItem[]): Promise<FoodScanResult['items']> {
    const calculatedItems: FoodScanResult['items'] = [];

    for (const item of items) {
      const matchedFood = await this.foodService.matchOrCreateDetectedFood(item);
      if (!matchedFood || !matchedFood.nutrition) continue;

      const weight = item.estimatedWeightGrams || matchedFood.defaultServingGrams || 300;
      const nutrition = this.nutritionService.calculateForWeight(weight, {
        calories: matchedFood.nutrition.caloriesPer100g,
        protein: matchedFood.nutrition.proteinPer100g,
        carbs: matchedFood.nutrition.carbsPer100g,
        fat: matchedFood.nutrition.fatPer100g,
        fiber: matchedFood.nutrition.fiberPer100g,
      });

      const scanItem = await this.prisma.foodScanItem.create({
        data: {
          scanId,
          foodId: matchedFood.id,
          weightGrams: weight,
          confidence: item.confidence || 0.9,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          fiber: nutrition.fiber || 0,
          isUserModified: false,
        },
        include: {
          food: { include: { nutrition: true } },
        },
      });

      calculatedItems.push({
        id: scanItem.id,
        foodId: scanItem.foodId,
        food: {
          id: scanItem.food.id,
          name: scanItem.food.name,
          nameUz: scanItem.food.nameUz,
          nameRu: scanItem.food.nameRu,
          nameEn: scanItem.food.nameEn,
          category: scanItem.food.category as any,
          imageUrl: scanItem.food.imageUrl,
          defaultServingGrams: scanItem.food.defaultServingGrams,
          nutrition: {
            calories: scanItem.food.nutrition.caloriesPer100g,
            protein: scanItem.food.nutrition.proteinPer100g,
            carbs: scanItem.food.nutrition.carbsPer100g,
            fat: scanItem.food.nutrition.fatPer100g,
            fiber: scanItem.food.nutrition.fiberPer100g,
          },
        },
        weightGrams: scanItem.weightGrams,
        nutrition: {
          calories: scanItem.calories,
          protein: scanItem.protein,
          carbs: scanItem.carbs,
          fat: scanItem.fat,
          fiber: scanItem.fiber,
        },
        confidence: scanItem.confidence,
        isUserModified: scanItem.isUserModified,
      });
    }

    return calculatedItems;
  }

  async getScanById(id: string, userId: string): Promise<FoodScanResult> {
    const scan = await this.prisma.foodScan.findUnique({
      where: { id },
      include: {
        items: {
          include: { food: { include: { nutrition: true } } },
        },
      },
    });

    if (!scan) {
      throw new NotFoundException(`Skanerlash natijasi topilmadi: ${id}`);
    }
    if (!userId || !scan.userId || scan.userId !== userId) {
      throw new ForbiddenException('Bu skaner sizga tegishli emas');
    }

    const items = scan.items.map((item) => ({
      id: item.id,
      foodId: item.foodId,
      food: {
        id: item.food.id,
        name: item.food.name,
        nameUz: item.food.nameUz,
        nameRu: item.food.nameRu,
        nameEn: item.food.nameEn,
        category: item.food.category as any,
        imageUrl: item.food.imageUrl,
        defaultServingGrams: item.food.defaultServingGrams,
        nutrition: {
          calories: item.food.nutrition?.caloriesPer100g ?? 0,
          protein: item.food.nutrition?.proteinPer100g ?? 0,
          carbs: item.food.nutrition?.carbsPer100g ?? 0,
          fat: item.food.nutrition?.fatPer100g ?? 0,
          fiber: item.food.nutrition?.fiberPer100g ?? 0,
        },
      },
      weightGrams: item.weightGrams,
      nutrition: {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
      },
      confidence: item.confidence,
      isUserModified: item.isUserModified,
    }));

    const totalNutrition = this.nutritionService.aggregateNutrition(items.map((i) => i.nutrition));

    return {
      id: scan.id,
      imageUrl: scan.imageUrl,
      status: scan.status as any,
      items,
      totalNutrition,
      createdAt: scan.createdAt.toISOString(),
    };
  }

  async updateScanItem(
    scanId: string,
    itemId: string,
    dto: UpdateScanItemDto,
    userId: string,
  ): Promise<FoodScanResult> {
    const scan = await this.prisma.foodScan.findUnique({ where: { id: scanId } });
    if (!scan) throw new NotFoundException('Skanerlash topilmadi');
    if (!userId || !scan.userId || scan.userId !== userId) {
      throw new ForbiddenException('Bu skaner sizga tegishli emas');
    }

    const item = await this.prisma.foodScanItem.findUnique({
      where: { id: itemId },
      include: { food: { include: { nutrition: true } } },
    });

    if (!item || item.scanId !== scanId) {
      throw new NotFoundException('Skanerlangan taom elementi topilmadi');
    }

    let foodToUse = item.food;
    if (dto.foodId && dto.foodId !== item.foodId) {
      const newFood = await this.foodService.findById(dto.foodId);
      if (!newFood || !newFood.nutrition) {
        throw new NotFoundException('Tanlangan taom bazada topilmadi');
      }
      foodToUse = newFood;
    }

    const n = foodToUse.nutrition || {};
    const per100 = {
      calories: (n as any).caloriesPer100g ?? (n as any).calories ?? 0,
      protein: (n as any).proteinPer100g ?? (n as any).protein ?? 0,
      carbs: (n as any).carbsPer100g ?? (n as any).carbs ?? 0,
      fat: (n as any).fatPer100g ?? (n as any).fat ?? 0,
      fiber: (n as any).fiberPer100g ?? (n as any).fiber ?? 0,
    };

    const weight = dto.weightGrams !== undefined ? dto.weightGrams : item.weightGrams;
    const newNutrition = this.nutritionService.calculateForWeight(weight, per100);

    await this.prisma.foodScanItem.update({
      where: { id: itemId },
      data: {
        foodId: foodToUse.id,
        weightGrams: weight,
        calories: newNutrition.calories,
        protein: newNutrition.protein,
        carbs: newNutrition.carbs,
        fat: newNutrition.fat,
        fiber: newNutrition.fiber || 0,
        isUserModified: true,
      },
    });

    return this.getScanById(scanId, userId);
  }
}
