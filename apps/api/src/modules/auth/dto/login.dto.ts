import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Foydalanuvchi elektron pochta manzili (agar telefon kiritilmasa)',
  })
  @IsEmail({}, { message: 'To‘g‘ri email manzil kiriting' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '+998901234567',
    description: 'Foydalanuvchi telefon raqami (agar email kiritilmasa)',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Secret123!',
    description: 'Foydalanuvchi paroli',
  })
  @IsString()
  @IsNotEmpty({ message: 'Parol kiritilishi shart' })
  password: string;
}

