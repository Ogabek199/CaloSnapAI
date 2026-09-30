import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FoodScanService } from './food-scan.service';
import { UpdateScanItemDto } from './dto/update-scan-item.dto';
import { FoodScanResultDto } from './dto/scan-response.dto';
import { ScanImageBodyDto } from './dto/scan-image-body.dto';
import { detectImageMime, MAX_IMAGE_BYTES } from './image-validation';

@ApiTags('Food Scanner (AI)')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('food-scans')
export class FoodScanController {
  constructor(private readonly foodScanService: FoodScanService) {}

  @Post()
  @ApiOperation({
    summary: 'Taom rasmini skanerlash va ovqat qiymatlarini aniqlash',
    description: 'Gemini Vision AI yordamida yuklangan rasm tahlil qilinadi.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Taom surati (JPEG/PNG/WebP/HEIC formati)',
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Taom rasmining fayli',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: FoodScanResultDto })
  @ApiResponse({ status: 400, description: 'Rasm yuklanmadi yoki limit' })
  @ApiResponse({ status: 422, description: 'Rasmda taom topilmadi' })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  async scanFood(
    @Request() req: any,
    @UploadedFile() file?: { buffer: Buffer; mimetype?: string },
    @Body() body?: ScanImageBodyDto,
  ) {
    let buffer: Buffer | undefined = file?.buffer;

    if (!buffer && body?.imageBase64) {
      const raw = body.imageBase64.includes(';base64,')
        ? body.imageBase64.split(';base64,')[1]
        : body.imageBase64;
      buffer = Buffer.from(raw, 'base64');
    }

    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Iltimos, taom rasmini yuklang (image fayl kutilmoqda)');
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new PayloadTooLargeException('Rasm hajmi 8 MB dan oshmasligi kerak');
    }

    const mime = detectImageMime(buffer);
    if (!mime) {
      throw new UnsupportedMediaTypeException('Faqat JPEG, PNG, WebP yoki HEIC rasmlar qabul qilinadi');
    }

    return this.foodScanService.processFoodImage(buffer, mime, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Skanerlash natijasini ID bo‘yicha olish' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, type: FoodScanResultDto })
  async getScan(@Request() req: any, @Param('id') id: string) {
    return this.foodScanService.getScanById(id, req.user.id);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Skanerlangan taom porsiyasi yoki turini o‘zgartirish' })
  @ApiBody({ type: UpdateScanItemDto })
  @ApiResponse({ status: 200, type: FoodScanResultDto })
  async updateScanItem(
    @Request() req: any,
    @Param('id') scanId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateScanItemDto,
  ) {
    return this.foodScanService.updateScanItem(scanId, itemId, body, req.user.id);
  }
}
