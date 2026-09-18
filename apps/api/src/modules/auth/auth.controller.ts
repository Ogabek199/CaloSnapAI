import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Yangi foydalanuvchini ro‘yxatdan o‘tkazish',
    description: 'Email yoki telefon raqami orqali yangi profil yaratadi va JWT tokenlarni qaytaradi.',
  })
  @ApiResponse({
    status: 201,
    description: 'Foydalanuvchi muvaffaqiyatli ro‘yxatdan o‘tdi',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Email/telefon allaqachon mavjud yoki ma’lumotlar xato' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
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

  @Post('avatar')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Foydalanuvchi profil rasmini yangilash',
    description: 'Foydalanuvchi avatar rasmini saqlaydi',
  })
  async updateAvatar(@Request() req: any, @Body() body: { avatarUrl: string }) {
    return this.authService.updateAvatar(req.user.id, body.avatarUrl);
  }

  @Post('password/request-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parolni tiklash OTP so‘rash (telefon/email)' })
  async requestReset(@Body() body: { phone?: string; email?: string }) {
    const id = body.phone || body.email;
    if (!id) throw new BadRequestException('Telefon yoki email kerak');
    return this.authService.requestPasswordReset(id);
  }

  @Post('password/confirm-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OTP + yangi parol bilan parolni yangilash' })
  async confirmReset(
    @Body() body: { phone?: string; email?: string; code: string; newPassword: string },
  ) {
    const id = body.phone || body.email;
    if (!id || !body.code || !body.newPassword) {
      throw new BadRequestException('Ma’lumotlar to‘liq emas');
    }
    return this.authService.confirmPasswordReset(id, body.code, body.newPassword);
  }
}
