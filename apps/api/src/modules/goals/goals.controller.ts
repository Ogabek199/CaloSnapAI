import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CalculateGoalsDto } from './dto/calculate-goals.dto';
import { GoalsCalculationResultDto, SaveGoalsResponseDto } from './dto/goals-response.dto';

@ApiTags('Goals & Nutrition')
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Kunlik kaloriya va makrolarni (BJU) hisoblash',
    description: 'Mifflin-St Jeor formulasi va TDEE asosida foydalanuvchining yoshi, jinsi, bo‘yi, vazni va maqsadiga ko‘ra optimal kaloriya va BJU balansini hisoblaydi.',
  })
  @ApiBody({ type: CalculateGoalsDto })
  @ApiResponse({
    status: 200,
    description: 'BMR/TDEE bo‘yicha hisoblangan kunlik kaloriyalar, oqsillar, uglevodlar va yog‘lar',
    type: GoalsCalculationResultDto,
  })
  @ApiResponse({ status: 400, description: 'Kiritilgan ma’lumotlar yaroqsiz' })
  calculateGoals(@Body() body: CalculateGoalsDto) {
    return this.goalsService.calculateTDEE(body);
  }

  @Post('save')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Foydalanuvchi profiliga maqsadlarni saqlash',
    description: 'Hisoblangan fitnes parametrlari va kaloriya maqsadlarini joriy foydalanuvchi profiliga biriktirib saqlaydi.',
  })
  @ApiBody({ type: CalculateGoalsDto })
  @ApiResponse({
    status: 200,
    description: 'Maqsadlar profilga saqlandi va BMR/TDEE yangilandi',
    type: SaveGoalsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Kiritilgan parametrlar xato' })
  @ApiResponse({ status: 401, description: 'Autentifikatsiyadan o‘tilmagan' })
  saveUserGoals(
    @Request() req: any,
    @Body() body: CalculateGoalsDto,
  ) {
    return this.goalsService.updateUserGoals(req.user.id, body);
  }
}
