import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FoodService } from './food.service';
import { GetFoodsQueryDto } from './dto/get-foods-query.dto';
import { FoodResponseDto } from './dto/food-response.dto';

@ApiTags('Foods')
@Controller('foods')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

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
    return this.foodService.findAll(query.q, query.category);
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
    return this.foodService.findById(id);
  }
}
