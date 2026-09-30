import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const ASSISTANT_LANGUAGES = ['uz', 'ru', 'en', 'tr', 'kk', 'ko', 'es', 'de', 'fr'] as const;
export type AssistantLanguage = (typeof ASSISTANT_LANGUAGES)[number];

export const CHEF_MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

// Base64 inflates size by ~4/3, so 12M chars ≈ 8 MB of image bytes.
const MAX_BASE64_CHARS = 12_000_000;

/** What the user has eaten today; computed on the device so it matches the user's local day. */
export class DayContextDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(30000) consumedCalories?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(3000) consumedProtein?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(3000) consumedCarbs?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(3000) consumedFat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(30000) goalCalories?: number;
}

class AssistantBaseDto {
  @ApiPropertyOptional({ enum: ASSISTANT_LANGUAGES, default: 'uz' })
  @IsOptional()
  @IsIn(ASSISTANT_LANGUAGES)
  language?: AssistantLanguage;

  @ApiPropertyOptional({ type: DayContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayContextDto)
  context?: DayContextDto;
}

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'model'] })
  @IsIn(['user', 'model'])
  role: 'user' | 'model';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text: string;
}

export class ChatDto extends AssistantBaseDto {
  @ApiProperty({ type: [ChatMessageDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}

export class ChefDto extends AssistantBaseDto {
  @ApiPropertyOptional({ description: 'Muzlatgich yoki masalliqlar rasmi (base64 / data URI)' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_BASE64_CHARS)
  imageBase64?: string;

  @ApiPropertyOptional({ type: [String], example: ['tovuq', 'guruch', 'sabzi'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  ingredients?: string[];

  @ApiPropertyOptional({ enum: CHEF_MEAL_TYPES })
  @IsOptional()
  @IsIn(CHEF_MEAL_TYPES)
  mealType?: (typeof CHEF_MEAL_TYPES)[number];
}

export class HealthCheckItemDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120) name: string;
  @ApiProperty() @IsNumber() @Min(0) @Max(5000) weightGrams: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(20000) calories: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(2000) protein: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(2000) carbs: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(2000) fat: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(2000) fiber?: number;
}

export class HealthCheckDto extends AssistantBaseDto {
  @ApiProperty({ type: [HealthCheckItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => HealthCheckItemDto)
  items: HealthCheckItemDto[];
}
