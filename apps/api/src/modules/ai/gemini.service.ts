import { Injectable, Logger, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { FOOD_ANALYSIS_SYSTEM_PROMPT } from './prompts/food-analysis.prompt';
import { NUTRITION_LABEL_PROMPT } from './prompts/nutrition-label.prompt';
import { AiFoodAnalysisResult, DetectedFoodItem, NutritionLabelResult } from './ai.types';

/** Gemini vision models in fallback order. Google retires models regularly; override with GEMINI_MODELS. */
const DEFAULT_VISION_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];
const MAX_ATTEMPTS = 10;
const MAX_PASSES = 2;
const REQUEST_TIMEOUT_MS = 20_000;
// Mobile client aborts after 35s; stay safely below that across all attempts.
const TOTAL_DEADLINE_MS = 30_000;
const MIN_ATTEMPT_MS = 3_000;
// Overloaded (503/429) models usually stay overloaded for a while; don't waste the budget on them.
const OVERLOAD_COOLDOWN_MS = 60_000;
const RETIRED_COOLDOWN_MS = 6 * 60 * 60_000;
const AI_UNAVAILABLE_MESSAGE = 'AI xizmati vaqtincha ishlamayapti. Iltimos, keyinroq qayta urinib ko‘ring.';

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
export type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private aiClient: GoogleGenAI | null = null;
  private readonly cooldownUntil = new Map<string, number>();
  private lastWorkingModel: string | null = null;

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

  /** Last working model first, cooling-down models last (still tried if everything else fails). */
  private orderModels(): string[] {
    const now = Date.now();
    const models = this.getModelsToTry();
    const ready = models.filter((m) => (this.cooldownUntil.get(m) ?? 0) <= now);
    const cooling = models.filter((m) => !ready.includes(m));
    if (this.lastWorkingModel && ready.includes(this.lastWorkingModel)) {
      ready.splice(ready.indexOf(this.lastWorkingModel), 1);
      ready.unshift(this.lastWorkingModel);
    }
    return [...ready, ...cooling];
  }

  private markFailure(model: string, error: any) {
    const status = Number(error?.status ?? error?.code);
    if (status === 404) {
      this.cooldownUntil.set(model, Date.now() + RETIRED_COOLDOWN_MS);
    } else if (status === 429 || status === 503 || status === 500) {
      this.cooldownUntil.set(model, Date.now() + OVERLOAD_COOLDOWN_MS);
    }
    if (this.lastWorkingModel === model) this.lastWorkingModel = null;
  }

  async analyzeFoodImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<AiFoodAnalysisResult> {
    const { parsed, text } = await this.generateVisionJson(
      FOOD_ANALYSIS_SYSTEM_PROMPT,
      imageBase64,
      mimeType,
      'Rasm tahlilida xatolik yuz berdi. Iltimos, kamerani yaxshi tutib, qaytadan urinib ko‘ring.',
    );
    const items = sanitizeItems(parsed.items);

    if (parsed.isFood === false || items.length === 0) {
      return {
        isFood: false,
        rejectionReason:
          cleanString(parsed.rejectionReason, 300) ||
          'Rasm xira yoki taom aniqlanmadi. Iltimos, kamerani yaqinroq tutib, yorug‘ joyda qayta oling.',
        items: [],
        rawText: text,
      };
    }

    return { isFood: true, items, rawText: text };
  }

  async readNutritionLabel(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<NutritionLabelResult> {
    const { parsed } = await this.generateVisionJson(
      NUTRITION_LABEL_PROMPT,
      imageBase64,
      mimeType,
      'Yorliqni o‘qib bo‘lmadi. Iltimos, jadvalni yaqinroqdan, yorug‘ joyda qayta suratga oling.',
    );
    const label: NutritionLabelResult = {
      isLabel: parsed.isLabel !== false,
      productName: cleanString(parsed.productName),
      caloriesPer100g: clampNumber(parsed.caloriesPer100g, 0, 900),
      proteinPer100g: clampNumber(parsed.proteinPer100g, 0, 100),
      carbsPer100g: clampNumber(parsed.carbsPer100g, 0, 100),
      fatPer100g: clampNumber(parsed.fatPer100g, 0, 100),
      fiberPer100g: clampNumber(parsed.fiberPer100g, 0, 100),
    };
    const hasAnyValue = [label.caloriesPer100g, label.proteinPer100g, label.carbsPer100g, label.fatPer100g].some(
      (v) => v !== undefined,
    );
    if (!label.isLabel || !hasAnyValue) {
      return {
        isLabel: false,
        rejectionReason:
          cleanString(parsed.rejectionReason, 300) ||
          'Ozuqaviy qiymat jadvali topilmadi. Qadoq orqasidagi jadvalni to‘liq suratga oling.',
      };
    }
    return label;
  }

  private generateVisionJson(
    prompt: string,
    imageBase64: string,
    mimeType: string,
    failureMessage: string,
  ): Promise<{ parsed: Record<string, any>; text: string }> {
    return this.generateJson({
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType, data: imageBase64 } }] }],
      failureMessage,
      logLabel: 'Vision',
      logResult: true,
    });
  }

  /** Runs a prompt (text, images or a multi-turn chat) through the model fallback chain and returns the parsed JSON object. */
  async generateJson(options: {
    contents: GeminiContent[];
    systemInstruction?: string;
    temperature?: number;
    failureMessage: string;
    logLabel: string;
    /** Only for non-personal output; chat replies and health advice stay out of the logs. */
    logResult?: boolean;
  }): Promise<{ parsed: Record<string, any>; text: string }> {
    const { contents, systemInstruction, temperature = 0.2, failureMessage, logLabel, logResult = false } = options;
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.error(`${logLabel} request rejected: GEMINI_API_KEY is not configured`);
      throw new ServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
    }

    if (!this.aiClient) {
      this.aiClient = new GoogleGenAI({ apiKey });
    }

    const ordered = this.orderModels();
    const plan: string[] = [];
    for (let pass = 0; pass < MAX_PASSES; pass++) plan.push(...ordered);
    let lastError: any = null;
    const deadline = Date.now() + TOTAL_DEADLINE_MS;

    const retired = new Set<string>();

    for (const [attempt, modelName] of plan.slice(0, MAX_ATTEMPTS).entries()) {
      if (retired.has(modelName)) continue;
      if (attempt > 0) {
        const newPass = attempt % ordered.length === 0;
        await new Promise((r) => setTimeout(r, newPass ? 1_500 : 250));
      }
      const timeout = Math.min(REQUEST_TIMEOUT_MS, deadline - Date.now());
      if (timeout < MIN_ATTEMPT_MS) break;
      try {
        const response = await this.aiClient.models.generateContent({
          model: modelName,
          contents,
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            responseMimeType: 'application/json',
            temperature,
            httpOptions: { timeout },
          },
        });

        let text = response.text?.trim() || '{}';
        if (text.startsWith('```json')) {
          text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (text.startsWith('```')) {
          text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        this.logger.log(
          logResult
            ? `Gemini ${logLabel} (${modelName}) success! Result: ${text.substring(0, 120)}...`
            : `Gemini ${logLabel} (${modelName}) success (${text.length} chars)`,
        );
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          throw new SyntaxError('Gemini response is not a JSON object');
        }
        this.lastWorkingModel = modelName;
        this.cooldownUntil.delete(modelName);
        return { parsed, text };
      } catch (error: any) {
        lastError = error;
        const errMsg = error?.message || String(error);
        this.logger.warn(`Model ${modelName} attempt failed: ${errMsg.slice(0, 200)}`);
        this.markFailure(modelName, error);
        if (Number(error?.status ?? error?.code) === 404) retired.add(modelName);
        if (errMsg.includes('API key not valid') || errMsg.includes('API_KEY_INVALID')) {
          this.logger.error('Gemini API key is invalid! Please check GEMINI_API_KEY');
          throw new ServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
        }
        if (!isRetryable(error)) {
          break;
        }
      }
    }

    this.logger.error(`All Gemini ${logLabel} attempts failed:`, lastError);
    if (lastError && isRetryable(lastError)) {
      throw new ServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
    }
    throw new UnprocessableEntityException(failureMessage);
  }
}

const MAX_ITEMS = 15;

export function cleanString(value: unknown, maxLength = 120): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : undefined;
}

export function clampNumber(value: unknown, min: number, max: number): number | undefined {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
}

/** Model output is untrusted: drop malformed items and clamp numbers before they reach the DB. */
function sanitizeItems(raw: unknown): DetectedFoodItem[] {
  if (!Array.isArray(raw)) return [];
  const items: DetectedFoodItem[] = [];
  for (const entry of raw.slice(0, MAX_ITEMS)) {
    if (!entry || typeof entry !== 'object') continue;
    const i = entry as Record<string, unknown>;
    const name = cleanString(i.name) || cleanString(i.nameUz) || cleanString(i.nameEn) || cleanString(i.nameRu);
    if (!name) continue;
    const weight = clampNumber(i.estimatedWeightGrams, 0, 3000);
    items.push({
      name,
      nameUz: cleanString(i.nameUz),
      nameRu: cleanString(i.nameRu),
      nameEn: cleanString(i.nameEn),
      category: cleanString(i.category, 40),
      estimatedWeightGrams: weight && weight >= 1 ? weight : undefined,
      caloriesPer100g: clampNumber(i.caloriesPer100g, 0, 900),
      proteinPer100g: clampNumber(i.proteinPer100g, 0, 100),
      carbsPer100g: clampNumber(i.carbsPer100g, 0, 100),
      fatPer100g: clampNumber(i.fatPer100g, 0, 100),
      fiberPer100g: clampNumber(i.fiberPer100g, 0, 100),
      confidence: clampNumber(i.confidence, 0, 1),
      ingredients: Array.isArray(i.ingredients)
        ? i.ingredients.map((s) => cleanString(s)).filter(Boolean).slice(0, 30)
        : undefined,
    });
  }
  return items;
}

/** Retired model (404), rate limit (429), server errors, timeouts and malformed JSON are worth another model. */
function isRetryable(error: any): boolean {
  if (error instanceof SyntaxError) return true;
  const status = Number(error?.status ?? error?.code);
  if (status === 404 || status === 408 || status === 429 || status >= 500) return true;
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('timeout') || msg.includes('aborted') || msg.includes('fetch failed');
}
