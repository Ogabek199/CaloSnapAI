import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { AuthResponseDto, UserDto } from './dto/auth-response.dto';

const AUTH_THROTTLE = { default: { ttl: 15 * 60_000, limit: 10 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({
    summary: 'Yangi foydalanuvchini ro‘yxatdan o‘tkazish',
    description: 'Email yoki telefon raqami orqali yangi profil yaratadi va JWT tokenlarni qaytaradi.',
  })
  @ApiResponse({
    status: 201,
    description: 'Foydalanuvchi muvaffaqiyatli ro‘yxatdan o‘tdi',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Ma’lumotlar xato' })
  @ApiResponse({ status: 409, description: 'Email/telefon allaqachon mavjud' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tizimga kirish (Login)',
    description: 'Email yoki telefon va parol orqali tizimga kirib, JWT tokenlarni oladi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Muvaffaqiyatli kirish va JWT tokenlar',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Email yoki telefon kiritilmagan' })
  @ApiResponse({ status: 401, description: 'Parol yoki login noto‘g‘ri' })
  @ApiBody({ type: LoginDto })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Joriy foydalanuvchi profilini olish',
    description: 'JWT token orqali kirgan foydalanuvchining shaxsiy ma’lumotlari va profil parametrlarini qaytaradi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Foydalanuvchi profili ma’lumotlari',
    type: UserDto,
  })
  @ApiResponse({ status: 401, description: 'Autentifikatsiyadan o‘tilmagan (Token yaroqsiz yoki mavjud emas)' })
  async getMe(@Request() req: any) {
    return req.user;
  }

  @Post('delete-account')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Akkauntni butunlay o‘chirish',
    description: 'Parolni tasdiqlab, foydalanuvchi va unga tegishli barcha ma’lumotlarni o‘chiradi.',
  })
  @ApiBody({ type: DeleteAccountDto })
  async deleteAccount(@Request() req: any, @Body() body: DeleteAccountDto) {
    return this.authService.deleteAccount(req.user.id, body.password);
  }

  @Post('avatar')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Foydalanuvchi profil rasmini yangilash',
    description: 'Foydalanuvchi avatar rasmini saqlaydi',
  })
  @ApiBody({ type: UpdateAvatarDto })
  async updateAvatar(@Request() req: any, @Body() body: UpdateAvatarDto) {
    return this.authService.updateAvatar(req.user.id, body.avatarUrl);
  }
}
