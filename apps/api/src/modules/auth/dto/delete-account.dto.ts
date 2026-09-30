import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({ description: 'Tasdiqlash uchun joriy parol' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
