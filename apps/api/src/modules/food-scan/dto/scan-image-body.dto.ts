import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// Base64 inflates size by ~4/3, so 12M chars ≈ 8 MB of image bytes.
const MAX_BASE64_CHARS = 12_000_000;

export class ScanImageBodyDto {
  @ApiPropertyOptional({ description: 'Base64 (yoki data URI) ko‘rinishidagi rasm' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_BASE64_CHARS)
  imageBase64?: string;

  @ApiPropertyOptional({ example: 'image/jpeg', deprecated: true })
  @IsOptional()
  @IsString()
  mimeType?: string;
}
