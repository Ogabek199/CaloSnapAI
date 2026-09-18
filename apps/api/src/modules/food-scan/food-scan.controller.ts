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
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
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
  @UseInterceptors(FileInterceptor('image'))
  async scanFood(
    @Request() req: any,
    @UploadedFile() file?: { buffer: Buffer; mimetype?: string },
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('Iltimos, taom rasmini yuklang (image fayl kutilmoqda)');
    }

    return this.foodScanService.processFoodImage(
      file.buffer,
      file.mimetype || 'image/jpeg',
      req.user.id,
    );
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
