import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../auth/dto/auth-response.dto';

export class GoalsCalculationResultDto {
  @ApiProperty({ example: 2150, description: 'Kunlik tavsiya etilgan kaloriya (kkal)' })
  dailyCalories: number;

  @ApiProperty({ example: 150, description: 'Kunlik tavsiya etilgan oqsil (gramm)' })
  protein: number;

  @ApiProperty({ example: 230, description: 'Kunlik tavsiya etilgan uglevod (gramm)' })
  carbs: number;

  @ApiProperty({ example: 60, description: 'Kunlik tavsiya etilgan yog‘ (gramm)' })
  fat: number;
}

export class SaveGoalsResponseDto {
  @ApiProperty({ type: () => UserProfileDto })
  profile: UserProfileDto;

  @ApiProperty({ type: () => GoalsCalculationResultDto })
  calculatedGoals: GoalsCalculationResultDto;
}
