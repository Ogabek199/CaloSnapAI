import { Injectable, NotFoundException, UnprocessableEntityException, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { PrismaService } from '../../database/prisma.service';
import { AIService } from '../ai/ai.service';
import { FoodService } from '../food/food.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { FoodScanResult, CalculatedNutrition, UpdateScanItemDto } from '@eda/types';

@Injectable()
export class FoodScanService {
  private readonly logger = new Logger(FoodScanService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly foodService: FoodService,
    private readonly nutritionService: NutritionService,
  ) {}

  async processFoodImage(
    fileBuffer: Buffer,
    mimeType: string,
    userId?: string,
  ): Promise<FoodScanResult> {
    let processedBuffer = fileBuffer;
    let finalMime = mimeType;

    try {
      // Optimize image: max 1024x1024, JPEG 82% quality to speed up upload & AI latency 3x
      processedBuffer = await sharp(fileBuffer)
        .rotate()
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();
      finalMime = 'image/jpeg';
      this.logger.log(`Image optimized: original ${fileBuffer.length} bytes -> ${processedBuffer.length} bytes`);
    } catch (e: any) {
      this.logger.warn(`Image compression skipped, using original buffer: ${e?.message}`);
      processedBuffer = fileBuffer;
    }

    const base64Image = processedBuffer.toString('base64');
    const imageUrl = `data:${finalMime};base64,${base64Image.substring(0, 80)}...`;

    // 1. AI Perception via Gemini
    const aiResult = await this.aiService.analyzeImage(base64Image, finalMime);

    if (!aiResult.isFood || !aiResult.items || aiResult.items.length === 0) {
      throw new UnprocessableEntityException(
        aiResult.rejectionReason || 'Rasmda taom yoki ichimlik aniqlanmadi. Iltimos, haqiqiy ovqat rasmini yuklang.',
      );
    }

    // 2. Create FoodScan Record in DB
    const scan = await this.prisma.foodScan.create({
      data: {
        userId: userId || null,
        imageUrl: imageUrl,
        status: 'COMPLETED',
        rawAiText: aiResult.rawText || '',
      },
    });

    const calculatedItems = [];

    // 3. Match each detected item against Nutrition DB & calculate exact calories/macros
    for (const item of aiResult.items) {
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
          scanId: scan.id,
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
          food: {
            include: {
              nutrition: true,
            },
          },
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

    if (calculatedItems.length === 0) {
      throw new UnprocessableEntityException('Taom aniqlandi, lekin bazada mos ovqat qiymati topilmadi.');
    }

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

  async getScanById(id: string): Promise<FoodScanResult> {
    const scan = await this.prisma.foodScan.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            food: {
              include: {
                nutrition: true,
              },
            },
          },
        },
      },
    });

    if (!scan) {
      throw new NotFoundException(`Skanerlash natijasi topilmadi: ${id}`);
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
          calories: item.food.nutrition.caloriesPer100g,
          protein: item.food.nutrition.proteinPer100g,
          carbs: item.food.nutrition.carbsPer100g,
          fat: item.food.nutrition.fatPer100g,
          fiber: item.food.nutrition.fiberPer100g,
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

  async updateScanItem(scanId: string, itemId: string, dto: UpdateScanItemDto): Promise<FoodScanResult> {
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
      if (newFood) {
        foodToUse = newFood as any;
      }
    }

    const weight = dto.weightGrams !== undefined ? dto.weightGrams : item.weightGrams;
    const newNutrition = this.nutritionService.calculateForWeight(weight, {
      calories: foodToUse.nutrition.caloriesPer100g,
      protein: foodToUse.nutrition.proteinPer100g,
      carbs: foodToUse.nutrition.carbsPer100g,
      fat: foodToUse.nutrition.fatPer100g,
      fiber: foodToUse.nutrition.fiberPer100g,
    });

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

    return this.getScanById(scanId);
  }
}
