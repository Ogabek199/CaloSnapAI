import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  PayloadTooLargeException,
  Post,
  Request,
  UnsupportedMediaTypeException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { detectImageMime, MAX_IMAGE_BYTES } from '../food-scan/image-validation';
import { AssistantService } from './assistant.service';
import { ChatDto, ChefDto, HealthCheckDto } from './dto/assistant.dto';
import { PremiumGuard } from './premium.guard';

const HOUR_MS = 60 * 60_000;

@ApiTags('AI Assistant (Pro)')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), PremiumGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('chat')
  @HttpCode(200)
  @Throttle({ default: { ttl: HOUR_MS, limit: 60 } })
  @ApiOperation({ summary: 'AI Dietolog bilan suhbat' })
  chat(@Request() req: any, @Body() body: ChatDto) {
    return this.assistant.chat(req.user.id, body);
  }

  @Post('chef')
  @HttpCode(200)
  @Throttle({ default: { ttl: HOUR_MS, limit: 20 } })
  @ApiOperation({ summary: 'AI Oshpaz: muzlatgich rasmi yoki masalliqlardan retseptlar' })
  chef(@Request() req: any, @Body() body: ChefDto) {
    return this.assistant.chef(req.user.id, body, decodeOptionalImage(body.imageBase64));
  }

  @Post('health-check')
  @HttpCode(200)
  @Throttle({ default: { ttl: HOUR_MS, limit: 60 } })
  @ApiOperation({ summary: 'Taomni sog‘liq holatlariga (diabet, qon bosimi, xolesterin) ko‘ra tekshirish' })
  healthCheck(@Request() req: any, @Body() body: HealthCheckDto) {
    return this.assistant.healthCheck(req.user.id, body);
  }
}

function decodeOptionalImage(imageBase64?: string): { base64: string; mime: string } | undefined {
  if (!imageBase64) return undefined;
  const raw = imageBase64.includes(';base64,') ? imageBase64.split(';base64,')[1] : imageBase64;
  const buffer = Buffer.from(raw, 'base64');
  if (buffer.length === 0) throw new BadRequestException('Rasm o‘qilmadi');
  if (buffer.length > MAX_IMAGE_BYTES) throw new PayloadTooLargeException('Rasm hajmi 8 MB dan oshmasligi kerak');
  const mime = detectImageMime(buffer);
  if (!mime) throw new UnsupportedMediaTypeException('Faqat JPEG, PNG, WebP yoki HEIC rasmlar qabul qilinadi');
  return { base64: buffer.toString('base64'), mime };
}
