import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  PayloadTooLargeException,
  Post,
  Query,
  Request,
  UnsupportedMediaTypeException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FoodService, mapFoodForClient } from './food.service';
import { GetFoodsQueryDto } from './dto/get-foods-query.dto';
import { FoodResponseDto } from './dto/food-response.dto';
import { CreateBarcodeFoodDto } from './dto/create-barcode-food.dto';
import { GeminiService } from '../ai/gemini.service';
import { ScanImageBodyDto } from '../food-scan/dto/scan-image-body.dto';
import { detectImageMime, MAX_IMAGE_BYTES } from '../food-scan/image-validation';

@ApiTags('Foods')
@Controller('foods')
export class FoodController {
  constructor(
    private readonly foodService: FoodService,
    private readonly geminiService: GeminiService,
  ) {}

  @Post('nutrition-label')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Qadoqdagi ozuqaviy qiymat yorlig‘ini AI orqali o‘qish' })
  async readNutritionLabel(@Body() body: ScanImageBodyDto) {
    const raw = body?.imageBase64?.includes(';base64,')
      ? body.imageBase64.split(';base64,')[1]
      : body?.imageBase64;
    const buffer = raw ? Buffer.from(raw, 'base64') : undefined;
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Iltimos, yorliq rasmini yuklang');
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new PayloadTooLargeException('Rasm hajmi 8 MB dan oshmasligi kerak');
    }
    const mime = detectImageMime(buffer);
    if (!mime) {
      throw new UnsupportedMediaTypeException('Faqat JPEG, PNG, WebP yoki HEIC rasmlar qabul qilinadi');
    }
    return this.geminiService.readNutritionLabel(buffer.toString('base64'), mime);
  }

  @Post('barcode')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { ttl: 60 * 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Bazada yo‘q qadoqlangan mahsulotni shtrix-kodi bilan qo‘shish' })
  async createBarcodeFood(@Request() req: any, @Body() body: CreateBarcodeFoodDto) {
    const food = await this.foodService.createUserBarcodeFood(req.user.id, body);
    return mapFoodForClient(food);
  }

  @Get()
  @ApiOperation({
    summary: 'Barcha taomlarni olish yoki qidirish',
    description: 'Taomlar bazasidan qidirish (nomi, kategoriyasi, sinonimlari) va ularning 100g dagi ozuqaviy qiymatlarini (BJU, kaloriya) olish.',
  })
  @ApiResponse({
    status: 200,
    description: 'Taomlar ro‘yxati (nutritsion ma’lumotlari bilan)',
    type: [FoodResponseDto],
  })
  async getAllFoods(@Query() query: GetFoodsQueryDto) {
    const foods = await this.foodService.findAll(query.q, query.category);
    return foods.map(mapFoodForClient);
  }

  @Get('barcode/:code')
  @ApiOperation({ summary: 'Shtrix-kod bo‘yicha taom topish' })
  async getByBarcode(@Param('code') code: string) {
    const food = await this.foodService.findByBarcode(code);
    if (!food) {
      return { found: false, food: null };
    }
    return { found: true, food: mapFoodForClient(food) };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'ID bo‘yicha taom ma’lumotlarini olish',
    description: 'Bitta taomning to‘liq tafsilotlari, default porsiyasi va 100g dagi ozuqaviy tarkibi.',
  })
  @ApiParam({
    name: 'id',
    description: 'Taomning UUID identifikatori',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Taomning to‘liq tafsilotlari va 100g dagi BJU/kaloriyasi',
    type: FoodResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Bunday IDli taom topilmadi' })
  async getFoodById(@Param('id') id: string) {
    const food = await this.foodService.findById(id);
    if (!food) {
      throw new NotFoundException('Bunday IDli taom topilmadi');
    }
    return mapFoodForClient(food);
  }
}
