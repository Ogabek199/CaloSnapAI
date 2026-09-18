import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { FOOD_ANALYSIS_SYSTEM_PROMPT } from './prompts/food-analysis.prompt';
import { AiFoodAnalysisResult } from './ai.types';

/** Default multimodal (vision) models — cheapest/fastest first, stable 2.5 as last resort. */
const DEFAULT_VISION_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private aiClient: GoogleGenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.aiClient = new GoogleGenAI({ apiKey });
      this.logger.log('Gemini AI Client initialized successfully.');
      this.logger.log(`Vision model fallback chain: ${this.getModelsToTry().join(' → ')}`);
    } else {
      this.logger.error('GEMINI_API_KEY is not set in environment!');
    }
  }

  /** Comma-separated override via GEMINI_MODELS=model-a,model-b */
  private getModelsToTry(): string[] {
    const raw = this.configService.get<string>('GEMINI_MODELS')?.trim();
    if (raw) {
      const fromEnv = raw
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
      if (fromEnv.length > 0) return fromEnv;
    }
    return DEFAULT_VISION_MODELS;
  }

  async analyzeFoodImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<AiFoodAnalysisResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new UnprocessableEntityException('Gemini API kaliti topilmadi.');
    }

    if (!this.aiClient) {
      this.aiClient = new GoogleGenAI({ apiKey });
    }

    const modelsToTry = this.getModelsToTry();
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await this.aiClient.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: FOOD_ANALYSIS_SYSTEM_PROMPT },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        let text = response.text?.trim() || '{}';
        if (text.startsWith('```json')) {
          text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (text.startsWith('```')) {
          text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        this.logger.log(`Gemini Vision (${modelName}) success! Result: ${text.substring(0, 120)}...`);
        const parsed = JSON.parse(text);

        if (parsed.isFood === false || !parsed.items || parsed.items.length === 0) {
          return {
            isFood: false,
            rejectionReason:
              parsed.rejectionReason ||
              'Rasm xira yoki taom aniqlanmadi. Iltimos, kamerani yaqinroq tutib, yorug‘ joyda qayta oling.',
            items: [],
            rawText: text,
          };
        }

        return {
          isFood: true,
          items: parsed.items,
          rawText: text,
        };
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Model ${modelName} attempt failed: ${error?.message || error}`);
      }
    }

    this.logger.error('All Gemini Vision models failed:', lastError);
    throw new UnprocessableEntityException(
      'Rasm tahlilida xatolik yuz berdi. Iltimos, kamerani yaxshi tutib, qaytadan urinib ko‘ring.',
    );
  }
}
