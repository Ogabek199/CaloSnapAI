import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/.../avatar.jpg' })
  @IsString()
  @MaxLength(3_000_000)
  @Matches(/^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/, {
    message: 'avatarUrl https URL yoki data:image base64 bo‘lishi kerak',
  })
  avatarUrl!: string;
}
