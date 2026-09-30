import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { HealthCondition } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GeminiContent, GeminiService, clampNumber, cleanString } from '../ai/gemini.service';
import { AssistantLanguage, ChatDto, ChefDto, HealthCheckDto } from './dto/assistant.dto';
import { buildUserContext, chatSystemPrompt, chefPrompt, healthCheckPrompt } from './assistant.prompts';

const MAX_CHAT_TURNS = 20;
const MAX_REPLY_CHARS = 4000;

export interface ChefRecipe {
  name: string;
  description?: string;
  timeMinutes?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  ingredients: { name: string; amount?: string }[];
  steps: string[];
  healthNote?: string;
}

export interface ChefResult {
  isFood: boolean;
  rejectionReason?: string;
  ingredients: string[];
  recipes: ChefRecipe[];
}

export type HealthAlertLevel = 'danger' | 'warning' | 'info';

export interface HealthCheckResult {
  overall: 'good' | 'caution' | 'avoid' | 'none';
  alerts: { level: HealthAlertLevel; condition?: HealthCondition; title: string; message: string }[];
}

@Injectable()
export class AssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  private loadProfile(userId: string) {
    return this.prisma.userProfile.findUnique({ where: { userId } });
  }

  async chat(userId: string, dto: ChatDto): Promise<{ reply: string }> {
    const contents = normalizeTurns(dto.messages);
    const profile = await this.loadProfile(userId);
    const { parsed } = await this.gemini.generateJson({
      contents,
      systemInstruction: chatSystemPrompt(dto.language, buildUserContext(profile, dto.context)),
      temperature: 0.6,
      failureMessage: 'Javob tayyorlab bo‘lmadi. Iltimos, savolni qayta yuboring.',
      logLabel: 'Chat',
    });
    const reply = stripMarkdown(cleanString(parsed.reply, MAX_REPLY_CHARS));
    if (!reply) throw new UnprocessableEntityException('Javob tayyorlab bo‘lmadi. Iltimos, savolni qayta yuboring.');
    // Prompt rules can be jailbroken; code must never reach the user regardless of what the model did.
    if (looksLikeCode(reply)) return { reply: OFF_TOPIC_REPLY[dto.language || 'uz'] };
    return { reply };
  }

  async chef(userId: string, dto: ChefDto, image?: { base64: string; mime: string }): Promise<ChefResult> {
    const ingredients = [...new Set((dto.ingredients ?? []).map((i) => i.trim()).filter(Boolean))];
    if (!image && ingredients.length === 0) {
      throw new BadRequestException('Masalliqlar rasmini yuklang yoki kamida bitta masalliq kiriting');
    }
    const profile = await this.loadProfile(userId);
    const prompt = chefPrompt({
      language: dto.language,
      userContext: buildUserContext(profile, dto.context),
      mealType: dto.mealType,
      ingredients,
      fromImage: !!image,
    });
    const { parsed } = await this.gemini.generateJson({
      contents: [
        {
          role: 'user',
          parts: image ? [{ text: prompt }, { inlineData: { mimeType: image.mime, data: image.base64 } }] : [{ text: prompt }],
        },
      ],
      temperature: 0.5,
      failureMessage: 'Retseptlarni tayyorlab bo‘lmadi. Iltimos, qayta urinib ko‘ring.',
      logLabel: 'Chef',
      logResult: true,
    });

    const detected = sanitizeStringList(parsed.ingredients, 40, 60);
    const recipes = sanitizeRecipes(parsed.recipes);
    if (parsed.isFood === false || recipes.length === 0) {
      return {
        isFood: false,
        rejectionReason:
          cleanString(parsed.rejectionReason, 300) ||
          (image
            ? 'Rasmda masalliqlar topilmadi. Muzlatgich yoki mahsulotlarni yorug‘ joyda, yaqinroqdan suratga oling.'
            : 'Bu masalliqlardan retsept tuzib bo‘lmadi. Boshqa mahsulotlarni kiriting.'),
        ingredients: detected,
        recipes: [],
      };
    }
    return { isFood: true, ingredients: detected.length ? detected : ingredients, recipes };
  }

  async healthCheck(userId: string, dto: HealthCheckDto): Promise<HealthCheckResult> {
    const profile = await this.loadProfile(userId);
    const conditions = profile?.healthConditions ?? [];
    // Nothing to check against: skip the paid model call entirely.
    if (conditions.length === 0) return { overall: 'none', alerts: [] };

    const totals = dto.items.reduce(
      (acc, i) => ({
        calories: acc.calories + i.calories,
        protein: acc.protein + i.protein,
        carbs: acc.carbs + i.carbs,
        fat: acc.fat + i.fat,
        fiber: acc.fiber + (i.fiber ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
    const itemsText = [
      ...dto.items.map(
        (i) =>
          `- ${i.name}: ${Math.round(i.weightGrams)} g, ${Math.round(i.calories)} kcal, P ${round1(i.protein)} g, C ${round1(i.carbs)} g, F ${round1(i.fat)} g` +
          (i.fiber ? `, fibre ${round1(i.fiber)} g` : ''),
      ),
      `TOTAL: ${Math.round(totals.calories)} kcal, P ${round1(totals.protein)} g, C ${round1(totals.carbs)} g, F ${round1(totals.fat)} g, fibre ${round1(totals.fiber)} g`,
    ].join('\n');

    const { parsed } = await this.gemini.generateJson({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: healthCheckPrompt({
                language: dto.language,
                userContext: buildUserContext(profile, dto.context),
                itemsText,
              }),
            },
          ],
        },
      ],
      temperature: 0.2,
      failureMessage: 'Sog‘liq tekshiruvini bajarib bo‘lmadi. Keyinroq qayta urinib ko‘ring.',
      logLabel: 'HealthCheck',
    });

    const alerts = sanitizeAlerts(parsed.alerts, conditions);
    if (alerts.length === 0) {
      throw new UnprocessableEntityException('Sog‘liq tekshiruvini bajarib bo‘lmadi. Keyinroq qayta urinib ko‘ring.');
    }
    const overall = ['good', 'caution', 'avoid'].includes(parsed.overall)
      ? (parsed.overall as HealthCheckResult['overall'])
      : alerts.some((a) => a.level === 'danger')
        ? 'avoid'
        : alerts.some((a) => a.level === 'warning')
          ? 'caution'
          : 'good';
    return { overall, alerts };
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const OFF_TOPIC_REPLY: Record<AssistantLanguage, string> = {
  uz: 'Men faqat ovqatlanish, kaloriya va sog‘lom turmush tarzi bo‘yicha yordam beraman. Bugun nima yedingiz yoki qanday taom haqida bilmoqchisiz?',
  ru: 'Я помогаю только с вопросами питания, калорий и здорового образа жизни. Что вы сегодня ели или о каком блюде хотите узнать?',
  en: 'I can only help with nutrition, calories and healthy eating. What did you eat today, or which dish would you like to know about?',
  tr: 'Yalnızca beslenme, kalori ve sağlıklı yaşam konularında yardımcı olabilirim. Bugün ne yediniz ya da hangi yemek hakkında bilgi almak istersiniz?',
  kk: 'Мен тек тамақтану, калория және салауатты өмір салты бойынша көмектесемін. Бүгін не жедіңіз немесе қандай тағам туралы білгіңіз келеді?',
  ko: '저는 영양, 칼로리, 건강한 식습관에 관해서만 도와드릴 수 있어요. 오늘 무엇을 드셨나요, 아니면 어떤 음식이 궁금하신가요?',
  es: 'Solo puedo ayudarte con nutrición, calorías y alimentación saludable. ¿Qué comiste hoy o sobre qué plato quieres saber?',
  de: 'Ich kann nur bei Ernährung, Kalorien und gesundem Essen helfen. Was hast du heute gegessen oder über welches Gericht möchtest du mehr wissen?',
  fr: 'Je peux uniquement vous aider sur la nutrition, les calories et l’alimentation saine. Qu’avez-vous mangé aujourd’hui, ou sur quel plat souhaitez-vous des informations ?',
};

const CODE_PATTERNS = [
  /```/,
  /<\/?(script|html|div|body|style)\b/i,
  /^\s*import\s+[\w{}*, ]+\s+from\s+['"]/m,
  /^\s*from\s+[\w.]+\s+import\s+\w+/m,
  /^\s*(def|function|public|private|package|#include)\s+\w+.*[(:{]\s*$/m,
  /^\s*(const|let|var)\s+\w+\s*=/m,
  /\b(console\.log|System\.out|printf?\s*\(|echo\s+["$]|sudo\s|pip install|npm (i|install)|SELECT\s+.+\s+FROM|INSERT\s+INTO|DROP\s+TABLE)/i,
  /^#!\//m,
  /=>\s*\{/,
];

function looksLikeCode(text: string): boolean {
  return CODE_PATTERNS.some((re) => re.test(text));
}

/** Gemini wants alternating turns that start and end with the user. */
function normalizeTurns(messages: ChatDto['messages']): GeminiContent[] {
  const turns: GeminiContent[] = [];
  for (const m of messages.slice(-MAX_CHAT_TURNS)) {
    const text = m.text.trim();
    if (!text) continue;
    const last = turns[turns.length - 1];
    if (last && last.role === m.role) {
      (last.parts[0] as { text: string }).text += `\n\n${text}`;
    } else {
      turns.push({ role: m.role, parts: [{ text }] });
    }
  }
  while (turns.length && turns[0].role !== 'user') turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== 'user') {
    throw new BadRequestException('Oxirgi xabar foydalanuvchidan bo‘lishi kerak');
  }
  return turns;
}

function stripMarkdown(text?: string): string | undefined {
  return text
    ?.replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim();
}

function sanitizeStringList(raw: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(raw)) return [];
  const out = raw.map((s) => cleanString(s, maxLength)).filter((s): s is string => !!s);
  return [...new Set(out)].slice(0, maxItems);
}

function sanitizeRecipes(raw: unknown): ChefRecipe[] {
  if (!Array.isArray(raw)) return [];
  const recipes: ChefRecipe[] = [];
  for (const entry of raw.slice(0, 3)) {
    if (!entry || typeof entry !== 'object') continue;
    const r = entry as Record<string, unknown>;
    const name = cleanString(r.name, 80);
    const steps = sanitizeStringList(r.steps, 12, 400);
    if (!name || steps.length === 0) continue;
    const ingredients = Array.isArray(r.ingredients)
      ? r.ingredients
          .slice(0, 20)
          .map((i): { name?: string; amount?: string } => {
            if (typeof i === 'string') return { name: cleanString(i, 60) };
            if (!i || typeof i !== 'object') return {};
            const o = i as Record<string, unknown>;
            return { name: cleanString(o.name, 60), amount: cleanString(o.amount, 40) };
          })
          .filter((i): i is { name: string; amount?: string } => !!i.name)
      : [];
    const difficulty = ['easy', 'medium', 'hard'].includes(r.difficulty as string)
      ? (r.difficulty as ChefRecipe['difficulty'])
      : 'easy';
    recipes.push({
      name,
      description: cleanString(r.description, 220),
      timeMinutes: clampNumber(r.timeMinutes, 1, 300),
      difficulty,
      servings: Math.round(clampNumber(r.servings, 1, 12) ?? 1),
      caloriesPerServing: Math.round(clampNumber(r.caloriesPerServing, 0, 3000) ?? 0),
      proteinPerServing: round1(clampNumber(r.proteinPerServing, 0, 300) ?? 0),
      carbsPerServing: round1(clampNumber(r.carbsPerServing, 0, 400) ?? 0),
      fatPerServing: round1(clampNumber(r.fatPerServing, 0, 300) ?? 0),
      ingredients,
      steps,
      healthNote: cleanString(r.healthNote, 260),
    });
  }
  return recipes;
}

function sanitizeAlerts(raw: unknown, conditions: HealthCondition[]): HealthCheckResult['alerts'] {
  if (!Array.isArray(raw)) return [];
  const alerts: HealthCheckResult['alerts'] = [];
  for (const entry of raw.slice(0, 4)) {
    if (!entry || typeof entry !== 'object') continue;
    const a = entry as Record<string, unknown>;
    const title = cleanString(a.title, 70);
    const message = cleanString(a.message, 300);
    if (!title || !message) continue;
    const level: HealthAlertLevel = ['danger', 'warning', 'info'].includes(a.level as string)
      ? (a.level as HealthAlertLevel)
      : 'warning';
    const condition = conditions.includes(a.condition as HealthCondition) ? (a.condition as HealthCondition) : undefined;
    alerts.push({ level, ...(condition ? { condition } : {}), title, message });
  }
  return alerts;
}
