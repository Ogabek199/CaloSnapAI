import { ApiProperty } from '@nestjs/swagger';
import { ActivityLevel, FitnessGoal, Gender } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty({ example: 25, required: false })
  age?: number;

  @ApiProperty({ example: Gender.MALE, enum: Gender, required: false })
  gender?: Gender;

  @ApiProperty({ example: 178, required: false })
  heightCm?: number;

  @ApiProperty({ example: 75.5, required: false })
  weightKg?: number;

  @ApiProperty({
    example: ActivityLevel.MODERATE,
    enum: ActivityLevel,
    required: false,
  })
  activityLevel?: ActivityLevel;

  @ApiProperty({
    example: FitnessGoal.LOSE_WEIGHT,
    enum: FitnessGoal,
    required: false,
  })
  goal?: FitnessGoal;

  @ApiProperty({ example: 2150, required: false })
  dailyCalorieGoal?: number;

  @ApiProperty({ example: 150, required: false })
  proteinGoalGrams?: number;

  @ApiProperty({ example: 230, required: false })
  carbsGoalGrams?: number;

  @ApiProperty({ example: 60, required: false })
  fatGoalGrams?: number;
}

export class UserDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Ali Valiyev' })
  name: string;

  @ApiProperty({ example: '+998901234567', required: false })
  phone?: string;

  @ApiProperty({ example: 'USER' })
  role: string;

  @ApiProperty({ type: () => UserProfileDto, required: false })
  profile?: UserProfileDto;

  @ApiProperty({ example: '2026-08-26T12:00:00.000Z' })
  createdAt: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token (amal qilish muddati: 7 kun)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Refresh Token (amal qilish muddati: 30 kun)',
  })
  refreshToken: string;

  @ApiProperty({ type: () => UserDto })
  user: UserDto;
}
