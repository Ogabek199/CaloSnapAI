import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { DiaryService } from './diary.service';
import { AddMealItemDto } from './dto/add-meal-item.dto';
import { UpdateMealItemDto } from './dto/update-meal-item.dto';
import { AddMealItemsBatchDto } from './dto/add-meal-items-batch.dto';
import { DailyDiarySummaryDto, DiaryMealItemDto } from './dto/diary-response.dto';

@ApiTags('Diary')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Get()
  @ApiOperation({
    summary: 'Belgilangan kun uchun ovqatlanish kundaligi',
    description: 'YYYY-MM-DD sana bo‘yicha kundalik. Kelajak sanalar qabul qilinmaydi.',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    example: '2026-09-18',
    description: 'Local calendar date YYYY-MM-DD',
  })
  @ApiResponse({
    status: 200,
    description: 'Kunlik ovqatlar, kaloriyalar va makrolar',
    type: DailyDiarySummaryDto,
  })
  @ApiResponse({ status: 400, description: 'Noto‘g‘ri yoki kelajak sana' })
  async getByDate(@Request() req: any, @Query('date') date: string) {
    return this.diaryService.getSummaryForDate(req.user.id, date || '');
  }

  @Get('today')
  @ApiOperation({
    summary: 'Bugungi ovqatlanish kundaligi va kaloriya balansi',
    description: 'Bugungi kun uchun 4 ta vaqt (Nonushta, Tushlik, Kechki ovqat, Qalampir/Snack) bo‘yicha iste’mol qilingan taomlar va jami qolgan kaloriya hisoboti.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bugungi ovqatlar ro‘yxati, jami kaloriyalar va makrolar balansi',
    type: DailyDiarySummaryDto,
  })
  async getToday(@Request() req: any) {
    return this.diaryService.getTodaySummary(req.user.id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Kunlar oralig‘idagi kaloriya agregati va streak' })
  @ApiQuery({ name: 'from', required: true, example: '2026-09-12' })
  @ApiQuery({ name: 'to', required: true, example: '2026-09-18' })
  async getSummary(
    @Request() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.diaryService.getRangeSummary(req.user.id, from, to);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Kundalikka yangi taom qo‘shish',
    description: 'Foydalanuvchi tanlagan taomni berilgan vaqt (Nonushta/Tushlik/Kechki/Snack) va gramm bilan kundalikka qo‘shadi.',
  })
  @ApiBody({ type: AddMealItemDto })
  @ApiResponse({
    status: 201,
    description: 'Taom kundalikka muvaffaqiyatli qo‘shildi',
    type: DiaryMealItemDto,
  })
  @ApiResponse({ status: 400, description: 'Yaroqsiz ma’lumotlar kiritildi' })
  @ApiResponse({ status: 404, description: 'Taom bazada topilmadi' })
  async addMealItem(
    @Request() req: any,
    @Body() body: AddMealItemDto,
  ) {
    return this.diaryService.addMealItem(req.user.id, body);
  }

  @Post('items/batch')
  @ApiOperation({
    summary: 'Bir nechta taomni bitta so‘rovda qo‘shish',
    description: 'Skaner natijasidagi barcha taomlarni qo‘shadi va bugungi kundalikni qaytaradi.',
  })
  @ApiBody({ type: AddMealItemsBatchDto })
  @ApiResponse({ status: 201, type: DailyDiarySummaryDto })
  async addMealItemsBatch(@Request() req: any, @Body() body: AddMealItemsBatchDto) {
    return this.diaryService.addMealItemsBatch(req.user.id, body.items);
  }

  @Delete('items/:id')
  @ApiOperation({
    summary: 'Kundalikdan taomni o‘chirish',
    description: 'Iste’mol qilingan taom elementini kundalikdan o‘chiradi.',
  })
  @ApiParam({
    name: 'id',
    description: 'O‘chirilishi kerak bo‘lgan MealItem IDsi',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Taom kundalikdan muvaffaqiyatli o‘chirildi',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Ovqat elementi topilmadi' })
  async removeMealItem(@Request() req: any, @Param('id') id: string) {
    return this.diaryService.removeMealItem(req.user.id, id);
  }

  @Post('items/:id')
  @ApiOperation({
    summary: 'Kundalikdagi taom vaznini tahrirlash',
    description: 'Kundalikka qo‘shilgan taomning grammini yangilash va ozuqaviy qiymatini qayta hisoblash.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tahrirlanadigan MealItem IDsi',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateMealItemDto })
  @ApiResponse({
    status: 200,
    description: 'Taom vazni va kaloriyasi muvaffaqiyatli yangilandi',
    type: DiaryMealItemDto,
  })
  @ApiResponse({ status: 404, description: 'Ovqat elementi topilmadi' })
  async updateMealItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateMealItemDto,
  ) {
    return this.diaryService.updateMealItem(req.user.id, id, body.weightGrams);
  }
}
