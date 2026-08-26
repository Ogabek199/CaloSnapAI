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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FoodScanService } from './food-scan.service';
import { UpdateScanItemDto } from './dto/update-scan-item.dto';
import { FoodScanResultDto } from './dto/scan-response.dto';

@ApiTags('Food Scanner (AI)')
@Controller('food-scans')
export class FoodScanController {
  constructor(private readonly foodScanService: FoodScanService) {}

  @Post()
  @ApiOperation({
    summary: 'Taom rasmini skanerlash va ovqat qiymatlarini aniqlash',
    description: 'Gemini Vision AI yordamida yuklangan rasm tahlil qilinadi, taom turlari, taxminiy grammlari va umumiy kaloriya/makrolar hisoblab beriladi.',
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
  @ApiResponse({
    status: 201,
    description: 'Rasm muvaffaqiyatli tahlil qilindi, aniqlangan taomlar va jami kaloriyalar',
    type: FoodScanResultDto,
  })
  @ApiResponse({ status: 400, description: 'Rasm yuklanmadi yoki fayl formati noto‘g‘ri' })
  @ApiResponse({ status: 422, description: 'Rasmda taom topilmadi yoki tahlil qilib bo‘lmadi' })
  @UseInterceptors(FileInterceptor('image'))
  async scanFood(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Iltimos, taom rasmini yuklang (image fayl kutilmoqda)');
    }

    return this.foodScanService.processFoodImage(file.buffer, file.mimetype || 'image/jpeg');
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Skanerlash natijasini ID bo‘yicha olish',
    description: 'Oldin skanerlangan sessiya natijasi va uning tarkibidagi barcha taom elementlarini ko‘rish.',
  })
  @ApiParam({
    name: 'id',
    description: 'Skanerlash sessiyasi IDsi (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Skanerlash natijalari va hisoblangan oziq-ovqat qiymatlari',
    type: FoodScanResultDto,
  })
  @ApiResponse({ status: 404, description: 'Skanerlash sessiyasi topilmadi' })
  async getScan(@Param('id') id: string) {
    return this.foodScanService.getScanById(id);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({
    summary: 'Skanerlangan taom porsiyasi yoki turini o‘zgartirish (Correction)',
    description: 'Foydalanuvchi taom miqdorini (gramm) yoki taom turini qo‘lda tuzatganda, yangi ozuqaviy qiymatlar avtomatik qayta hisoblanadi.',
  })
  @ApiParam({ name: 'id', description: 'Skanerlash sessiyasi IDsi', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiParam({ name: 'itemId', description: 'Skanerlangan element IDsi (FoodScanItem ID)', example: '550e8400-e29b-41d4-a716-446655440001' })
  @ApiBody({ type: UpdateScanItemDto })
  @ApiResponse({
    status: 200,
    description: 'Porsiya yoki taom yangilandi va yangi kaloriya/BJU qayta hisoblandi',
    type: FoodScanResultDto,
  })
  @ApiResponse({ status: 404, description: 'Skanerlash yoki element topilmadi' })
  async updateScanItem(
    @Param('id') scanId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateScanItemDto,
  ) {
    return this.foodScanService.updateScanItem(scanId, itemId, body);
  }
}
