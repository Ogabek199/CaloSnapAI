import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { DiaryService } from './diary.service';
import { AddMealItemDto } from './dto/add-meal-item.dto';
import { UpdateMealItemDto } from './dto/update-meal-item.dto';
import { DailyDiarySummaryDto, DiaryMealItemDto } from './dto/diary-response.dto';

@ApiTags('Diary')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

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
