import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AIService } from './ai.service';

@Module({
  providers: [GeminiService, AIService],
  exports: [AIService, GeminiService],
})
export class AIModule {}
