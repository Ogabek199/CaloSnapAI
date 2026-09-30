import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { AddWaterDto, AddWeightDto } from './dto/tracking.dto';

@ApiTags('Tracking')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('weight')
  @ApiOperation({ summary: 'Vazn yozuvi qo‘shish' })
  async addWeight(@Request() req: any, @Body() body: AddWeightDto) {
    return this.trackingService.addWeight(req.user.id, body.weightKg, body.loggedAt);
  }

  @Get('weight')
  @ApiOperation({ summary: 'Vazn tarixi' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  async listWeight(@Request() req: any, @Query('days') days?: string) {
    return this.trackingService.listWeight(req.user.id, days ? parseInt(days, 10) : 30);
  }

  @Post('water')
  @ApiOperation({ summary: 'Suv qo‘shish (ml)' })
  async addWater(@Request() req: any, @Body() body: AddWaterDto) {
    return this.trackingService.addWater(req.user.id, body.amountMl ?? 250);
  }

  @Get('water/today')
  @ApiOperation({ summary: 'Bugungi suv iste’moli' })
  async waterToday(@Request() req: any) {
    return this.trackingService.waterToday(req.user.id);
  }
}
