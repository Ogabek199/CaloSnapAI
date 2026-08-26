import { Injectable } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiFoodAnalysisResult } from './ai.types';

@Injectable()
export class AIService {
  constructor(private readonly geminiService: GeminiService) {}

  async analyzeImage(imageBase64: string, mimeType: string): Promise<AiFoodAnalysisResult> {
    return this.geminiService.analyzeFoodImage(imageBase64, mimeType);
  }
}
