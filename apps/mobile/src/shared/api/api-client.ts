import Constants from 'expo-constants';
import { Food, FoodScanResult, DailyDiarySummary, UpdateScanItemDto } from '@eda/types';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';
import type { StringKey } from '../i18n/translations';

const DEV_API_PORT = 3000;
const DEFAULT_TIMEOUT_MS = 15000;
const SCAN_TIMEOUT_MS = 45000;

// Explicit env wins. The LAN/localhost fallback is dev-only so release builds never ship a dev host.
const getApiBaseUrl = (): string | null => {
  const fromEnv =
    process.env.EXPO_PUBLIC_API_URL ||
    (Constants.expoConfig?.extra as any)?.apiUrl;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/+$/, '');
  }
  if (!__DEV__) return null;
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri && !hostUri.includes('exp.direct')) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:${DEV_API_PORT}/api/v1`;
  }
  return `http://localhost:${DEV_API_PORT}/api/v1`;
};

const API_BASE_URL = getApiBaseUrl();
const API_ORIGIN = API_BASE_URL ? API_BASE_URL.replace(/^(https?:\/\/[^/]+).*$/, '$1') : null;

/**
 * Makes server media URLs loadable: relative `/uploads/...` paths get the API origin, and
 * Cloudinary URLs are resized server-side so weak devices don't decode full-size photos.
 */
export const resolveMediaUrl = (url?: string | null, maxWidthPx?: number): string | null => {
  if (!url) return null;
  if (url.startsWith('/')) return API_ORIGIN ? `${API_ORIGIN}${url}` : null;
  if (maxWidthPx && url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    const [prefix, rest] = url.split('/image/upload/');
    if (rest && !/^[a-z]_[^/]*,/.test(rest) && !/^[a-z]_[^/,]+\//.test(rest)) {
      return `${prefix}/image/upload/w_${Math.round(maxWidthPx)},c_limit,q_auto/${rest}`;
    }
  }
  return url;
};

export type LegalPage = 'privacy' | 'terms' | 'delete-account';

/** Public legal pages; must match the URLs entered in App Store Connect and Play Console. */
export const legalUrl = (page: LegalPage, lang: string): string | null => {
  const base = process.env.EXPO_PUBLIC_LEGAL_BASE_URL?.replace(/\/+$/, '') || API_ORIGIN;
  // `v` busts copies cached by older builds, which were served with a 1-hour max-age.
  return base ? `${base}/legal/${page}?lang=${encodeURIComponent(lang)}&v=2` : null;
};

if (__DEV__) {
  console.log('[CaloSnap] Connecting to backend at:', API_BASE_URL);
} else if (!API_BASE_URL) {
  console.error('[ApiClient] EXPO_PUBLIC_API_URL is not configured for this build.');
}

export type NutritionLabelResult = {
  isLabel: boolean;
  rejectionReason?: string;
  productName?: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  fiberPer100g?: number;
};

export type HealthCondition =
  | 'DIABETES_TYPE_1'
  | 'DIABETES_TYPE_2'
  | 'PREDIABETES'
  | 'HYPERTENSION'
  | 'HIGH_CHOLESTEROL';

export const HEALTH_CONDITIONS: HealthCondition[] = [
  'DIABETES_TYPE_1',
  'DIABETES_TYPE_2',
  'PREDIABETES',
  'HYPERTENSION',
  'HIGH_CHOLESTEROL',
];

/** Today's intake, sent so the assistant reasons about the user's local day. */
export type AssistantDayContext = {
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  goalCalories: number;
};

export type ChatTurn = { role: 'user' | 'model'; text: string };

export type ChefRecipe = {
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
};

export type ChefResult = {
  isFood: boolean;
  rejectionReason?: string;
  ingredients: string[];
  recipes: ChefRecipe[];
};

export type HealthAlert = {
  level: 'danger' | 'warning' | 'info';
  condition?: HealthCondition;
  title: string;
  message: string;
};

export type HealthCheckResult = {
  overall: 'good' | 'caution' | 'avoid' | 'none';
  alerts: HealthAlert[];
};

export type HealthCheckItem = {
  name: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
};

export type ApiErrorCode =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'payload_too_large'
  | 'rate_limited'
  | 'server'
  | 'http';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, code: ApiErrorCode, status = 0, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

const strings = () => useAppStore.getState().t();

const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ApiError(strings().errTimeout, 'timeout');
    }
    throw new ApiError(strings().errNetwork, 'network');
  } finally {
    clearTimeout(timeoutId);
  }
};

const parseBody = async (response: Response): Promise<any> => {
  const text = await response.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const extractMessage = (data: any): string | null => {
  const msg = data?.message ?? data?.error;
  if (Array.isArray(msg)) {
    const joined = msg.filter((m) => typeof m === 'string').join(', ');
    return joined || null;
  }
  return typeof msg === 'string' && msg.trim() ? msg : null;
};

const SERVER_CODE_KEYS: Partial<Record<string, StringKey>> = {
  USER_NOT_FOUND: 'errUserNotFound',
  INVALID_PASSWORD: 'errWrongPassword',
  PREMIUM_REQUIRED: 'premiumRequired',
  NOT_FOOD: 'nonFoodErrorMsg',
};

// The API answers in Uzbek; known messages are mapped to the user's language.
const SERVER_MESSAGE_KEYS: [RegExp, StringKey][] = [
  [/allaqachon mavjud/, 'errUserExists'],
  [/Telefon raqami noto/, 'errPhoneInvalid'],
  [/Ism kamida/, 'errNameTooShort'],
  [/Parol kamida/, 'errPasswordTooShort'],
  [/Parol 72/, 'errPasswordTooLong'],
  [/Parol noto/, 'errWrongPassword'],
  [/Vazn 30/, 'errWeightRange'],
  [/Kelajak sana uchun vazn/, 'errFutureWeight'],
  [/Shtrix-kod/, 'errBarcodeInvalid'],
  [/yig‘indisi 100 g/, 'errMacrosOver100'],
  [/Kaloriya oqsil/, 'errCaloriesMismatch'],
  [/Mahsulotni saqlab/, 'errProductSaveFailed'],
  [/Faqat JPEG|JPEG, PNG yoki WebP/, 'errImageUnsupported'],
  [/8 MB/, 'errImageTooLarge'],
  [/Rasm(ni)? o‘qi/, 'errImageUnreadable'],
  [/bazada mos ovqat qiymati/, 'errFoodNotInDb'],
  [/Masalliqlar rasmini yuklang/, 'errChefNeedInput'],
];

/** Server error text in the user's language; unknown messages fall back to a translated generic one. */
const localizeServerError = (data: any, fallback: string): string => {
  const s = strings();
  const msg = extractMessage(data);
  if (msg && useAppStore.getState().language === 'uz') return msg;
  const code = typeof data?.code === 'string' ? data.code : '';
  if (code === 'SCAN_LIMIT_REACHED') return s.errScanLimit.replace('{n}', String(data?.limit ?? ''));
  const codeKey = SERVER_CODE_KEYS[code];
  if (codeKey) return s[codeKey];
  if (!msg) return fallback;
  const match = SERVER_MESSAGE_KEYS.find(([re]) => re.test(msg));
  return match ? s[match[1]] : fallback;
};

/** Only the session that sent the rejected token is logged out, so a stale in-flight request can't sign out a newer session. */
const handleUnauthorized = (sentToken: string) => {
  const state = useAppStore.getState();
  if (!state.token || state.token !== sentToken) return;
  state.logout();
  useToastStore.getState().showToast(strings().errSessionExpired, 'warning');
};

const toApiError = (
  status: number,
  data: any,
  fallback: string,
  sentToken: string | null,
): ApiError => {
  const s = strings();
  if (status === 401 && sentToken) {
    handleUnauthorized(sentToken);
    return new ApiError(s.errSessionExpired, 'unauthorized', status, data);
  }
  if (status === 413) return new ApiError(s.errImageTooLarge, 'payload_too_large', status, data);
  if (status === 429) return new ApiError(s.errTooManyRequests, 'rate_limited', status, data);
  if (status >= 500) return new ApiError(s.errServer, 'server', status, data);
  return new ApiError(localizeServerError(data, fallback), 'http', status, data);
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Attach the bearer token (default true). */
  auth?: boolean;
  timeoutMs?: number;
  fallbackError?: string;
  /** GET only: reuse a successful response for this long. */
  cacheMs?: number;
};

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_GET_RETRIES = 2;
const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 10_000;
const MAX_CACHE_ENTRIES = 100;

const responseCache = new Map<string, { expiresAt: number; data: unknown }>();
const inflightGets = new Map<string, Promise<unknown>>();
// After a 429 every request waits out the server's Retry-After instead of hammering it.
let rateLimitedUntil = 0;

/** Drop cached GET responses (call on pull-to-refresh or after data changes outside ApiClient). */
export const clearApiCache = () => responseCache.clear();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const backoffMs = (attempt: number) => 400 * 2 ** attempt + Math.random() * 300;

// Timeouts are not retried: the server is likely overloaded and a retry would only add to it.
const isRetryable = (e: unknown) =>
  e instanceof ApiError && (e.code === 'network' || RETRYABLE_STATUS.has(e.status));

async function send<T>(path: string, options: RequestOptions, token: string | null): Promise<T> {
  if (Date.now() < rateLimitedUntil) {
    throw new ApiError(strings().errTooManyRequests, 'rate_limited', 429);
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetchWithTimeout(
    `${API_BASE_URL}${path}`,
    {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    },
    options.timeoutMs,
  );

  const data = await parseBody(response);
  if (!response.ok) {
    if (response.status === 429) {
      const retryAfterSec = Number(response.headers.get('retry-after'));
      rateLimitedUntil =
        Date.now() + (Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec * 1000 : DEFAULT_RATE_LIMIT_COOLDOWN_MS);
    }
    throw toApiError(response.status, data, options.fallbackError || strings().errGeneric, token);
  }
  return data as T;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(strings().errNetwork, 'network');
  }
  const token = options.auth === false ? null : useAppStore.getState().token;
  const method = options.method || 'GET';

  if (method !== 'GET') {
    const result = await send<T>(path, options, token);
    clearApiCache();
    return result;
  }

  const key = `${token ?? ''}|${path}`;
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data as T;

  const pending = inflightGets.get(key);
  if (pending) return pending as Promise<T>;

  const run = (async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        const data = await send<T>(path, options, token);
        if (options.cacheMs) {
          if (responseCache.size >= MAX_CACHE_ENTRIES) responseCache.clear();
          responseCache.set(key, { expiresAt: Date.now() + options.cacheMs, data });
        }
        return data;
      } catch (e) {
        if (attempt >= MAX_GET_RETRIES || !isRetryable(e)) throw e;
        await sleep(backoffMs(attempt));
      }
    }
  })().finally(() => inflightGets.delete(key));

  inflightGets.set(key, run);
  return run;
}

const uploadScanMultipart = (imageUri: string, token: string): Promise<FoodScanResult> =>
  new Promise<FoodScanResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/food-scans`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = SCAN_TIMEOUT_MS;

    xhr.onload = () => {
      let data: any = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data) {
        resolve(data);
      } else {
        reject(toApiError(xhr.status, data, strings().errGeneric, token));
      }
    };
    xhr.onerror = () => reject(new ApiError(strings().errNetwork, 'network'));
    xhr.ontimeout = () => reject(new ApiError(strings().errTimeout, 'timeout'));

    const filename = imageUri.split('/').pop() || 'food.jpg';
    const ext = (/\.(\w+)$/.exec(filename)?.[1] || 'jpeg').toLowerCase();
    const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const formData = new FormData();
    formData.append('image', { uri: imageUri, name: filename, type } as any);
    xhr.send(formData);
  });

export const ApiClient = {
  /**
   * Upload real food photo for AI analysis
   */
  async scanFood(imageUri: string): Promise<FoodScanResult> {
    const token = useAppStore.getState().token;
    if (!token) {
      throw new ApiError(strings().errLoginRequired, 'unauthorized');
    }
    if (!API_BASE_URL) {
      throw new ApiError(strings().errNetwork, 'network');
    }

    let base64Image: string | undefined;

    if (imageUri.startsWith('data:image')) {
      const parts = imageUri.split(';base64,');
      base64Image = parts[1] || parts[0];
    } else {
      try {
        const manipResult = await manipulateAsync(
          imageUri,
          [{ resize: { width: 1024 } }],
          { compress: 0.82, format: SaveFormat.JPEG, base64: true },
        );
        if (manipResult.base64) {
          base64Image = manipResult.base64;
        }
      } catch (manipErr) {
        if (__DEV__) console.warn('[ApiClient] Image manipulation to base64 fallback:', manipErr);
      }
    }

    if (!base64Image) {
      return uploadScanMultipart(imageUri, token);
    }

    return request<FoodScanResult>('/food-scans', {
      method: 'POST',
      body: { imageBase64: base64Image, mimeType: 'image/jpeg' },
      timeoutMs: SCAN_TIMEOUT_MS,
    });
  },

  /**
   * Search foods in database
   */
  async searchFoods(query: string = ''): Promise<Food[]> {
    const q = query.trim();
    const data = await request<Food[] | null>(`/foods?q=${encodeURIComponent(q)}`, {
      cacheMs: q ? 2 * 60_000 : 10 * 60_000,
    });
    return Array.isArray(data) ? data : [];
  },

  /**
   * Update scanned item (Portion or Food type)
   */
  async updateScanItem(scanId: string, itemId: string, dto: UpdateScanItemDto): Promise<FoodScanResult> {
    return request<FoodScanResult>(
      `/food-scans/${encodeURIComponent(scanId)}/items/${encodeURIComponent(itemId)}`,
      { method: 'PATCH', body: dto },
    );
  },

  /**
   * Get diary summary for a calendar date (YYYY-MM-DD).
   */
  async getDiaryByDate(date: string): Promise<DailyDiarySummary> {
    return request<DailyDiarySummary>(`/diary?date=${encodeURIComponent(date)}`, { cacheMs: 15_000 });
  },

  /**
   * Get Today's Diary Summary
   */
  async getTodayDiary(): Promise<DailyDiarySummary> {
    const n = new Date();
    const y = n.getFullYear();
    const m = String(n.getMonth() + 1).padStart(2, '0');
    const d = String(n.getDate()).padStart(2, '0');
    return ApiClient.getDiaryByDate(`${y}-${m}-${d}`);
  },

  /**
   * Add Item to Diary
   */
  async addMealItem(
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
    foodId: string,
    weightGrams: number,
    scanId?: string,
  ) {
    return request<any>('/diary/items', {
      method: 'POST',
      body: { mealType, foodId, weightGrams, ...(scanId ? { scanId } : {}) },
    });
  },

  /** Adds several items in one request and returns today's updated diary. */
  async addMealItemsBatch(
    items: {
      mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
      foodId: string;
      weightGrams: number;
      scanId?: string;
    }[],
  ): Promise<DailyDiarySummary> {
    return request<DailyDiarySummary>('/diary/items/batch', { method: 'POST', body: { items } });
  },

  /**
   * Remove Item from Diary
   */
  async removeMealItem(itemId: string) {
    return request<any>(`/diary/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
  },

  /**
   * Update Item Portion in Diary
   */
  async updateMealItem(itemId: string, weightGrams: number) {
    return request<any>(`/diary/items/${encodeURIComponent(itemId)}`, {
      method: 'POST',
      body: { weightGrams },
    });
  },

  /**
   * Phone Number / Email Authentication
   */
  async login(identifier: string, password: string) {
    return request<any>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { phone: identifier, password },
      fallbackError: strings().authError,
    });
  },

  async register(
    identifier: string,
    name: string,
    password: string,
    profile?: {
      age?: number;
      gender?: 'MALE' | 'FEMALE';
      heightCm?: number;
      weightKg?: number;
      activityLevel?: string;
      goal?: string;
      dailyCalorieGoal?: number;
      proteinGoalGrams?: number;
      carbsGoalGrams?: number;
      fatGoalGrams?: number;
    },
  ) {
    return request<any>('/auth/register', {
      method: 'POST',
      auth: false,
      body: {
        phone: identifier,
        name,
        password,
        ...(profile ? { profile } : {}),
      },
      fallbackError: strings().authError,
    });
  },

  /**
   * Save user goals to backend
   */
  async saveGoals(dto: {
    age: number;
    gender: 'MALE' | 'FEMALE';
    weightKg: number;
    heightCm: number;
    activityLevel: string;
    goal: string;
  }) {
    return request<any>('/goals/save', { method: 'POST', body: dto });
  },

  /**
   * Fetch current user profile
   */
  async getMe() {
    return request<any>('/auth/me', { cacheMs: 30_000 });
  },

  async syncSubscription(): Promise<{ isPremium: boolean; premiumUntil: string | null }> {
    return request<{ isPremium: boolean; premiumUntil: string | null }>('/subscription/sync', {
      method: 'POST',
    });
  },

  /**
   * Update Profile Avatar URL
   */
  async deleteAccount(password: string) {
    return request<{ deleted: boolean }>('/auth/delete-account', {
      method: 'POST',
      body: { password },
      timeoutMs: 30000,
    });
  },

  async updateAvatar(avatarUrl: string) {
    return request<any>('/auth/avatar', {
      method: 'POST',
      body: { avatarUrl },
      timeoutMs: 30000,
    });
  },

  async getDiarySummary(from: string, to: string) {
    return request<{
      from: string;
      to: string;
      goalCalories: number;
      streak: number;
      avgCalories: number;
      daysLogged: number;
      days: { date: string; calories: number; logged: boolean; goalHit: boolean }[];
    }>(`/diary/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { cacheMs: 30_000 });
  },

  async addWeight(weightKg: number) {
    return request<any>('/tracking/weight', { method: 'POST', body: { weightKg } });
  },

  async listWeight(days = 30) {
    const data = await request<{ id: string; weightKg: number; loggedAt: string }[] | null>(
      `/tracking/weight?days=${encodeURIComponent(String(days))}`,
      { cacheMs: 60_000 },
    );
    return Array.isArray(data) ? data : [];
  },

  async addWater(amountMl = 250) {
    return request<any>('/tracking/water', {
      method: 'POST',
      body: { amountMl: Math.round(amountMl) },
    });
  },

  async waterToday() {
    return request<{ totalMl: number; goalMl: number }>('/tracking/water/today', { cacheMs: 15_000 });
  },

  /** Reads per-100g values from a photo of a package's nutrition facts table. */
  async readNutritionLabel(imageUri: string): Promise<NutritionLabelResult> {
    // Label text is small, so keep more resolution than a plate photo needs.
    const { base64 } = await manipulateAsync(imageUri, [{ resize: { width: 1600 } }], {
      compress: 0.85,
      format: SaveFormat.JPEG,
      base64: true,
    });
    if (!base64) throw new ApiError(strings().errGeneric, 'http');
    return request<NutritionLabelResult>('/foods/nutrition-label', {
      method: 'POST',
      body: { imageBase64: base64 },
      timeoutMs: SCAN_TIMEOUT_MS,
    });
  },

  async updateHealthConditions(conditions: HealthCondition[]) {
    return request<{ healthConditions: HealthCondition[] }>('/goals/health-conditions', {
      method: 'PUT',
      body: { conditions },
    });
  },

  async assistantChat(messages: ChatTurn[], language: string, context?: AssistantDayContext) {
    return request<{ reply: string }>('/assistant/chat', {
      method: 'POST',
      body: { messages, language, context },
      timeoutMs: SCAN_TIMEOUT_MS,
    });
  },

  async assistantChef(input: {
    imageUri?: string;
    ingredients?: string[];
    mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
    language: string;
    context?: AssistantDayContext;
  }): Promise<ChefResult> {
    let imageBase64: string | undefined;
    if (input.imageUri) {
      const { base64 } = await manipulateAsync(input.imageUri, [{ resize: { width: 1024 } }], {
        compress: 0.75,
        format: SaveFormat.JPEG,
        base64: true,
      });
      if (!base64) throw new ApiError(strings().errGeneric, 'http');
      imageBase64 = base64;
    }
    return request<ChefResult>('/assistant/chef', {
      method: 'POST',
      body: {
        imageBase64,
        ingredients: input.ingredients?.length ? input.ingredients : undefined,
        mealType: input.mealType,
        language: input.language,
        context: input.context,
      },
      timeoutMs: SCAN_TIMEOUT_MS,
    });
  },

  async assistantHealthCheck(items: HealthCheckItem[], language: string, context?: AssistantDayContext) {
    return request<HealthCheckResult>('/assistant/health-check', {
      method: 'POST',
      body: { items, language, context },
      timeoutMs: SCAN_TIMEOUT_MS,
    });
  },

  /** Registers an unknown package under its barcode so later scans (by anyone) find it. */
  async createBarcodeFood(input: {
    barcode: string;
    name: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    fiberPer100g?: number;
    servingGrams?: number;
    isDrink?: boolean;
  }): Promise<Food> {
    return request<Food>('/foods/barcode', { method: 'POST', body: input });
  },

  async findFoodByBarcode(code: string) {
    return request<{ found: boolean; food: Food | null }>(
      `/foods/barcode/${encodeURIComponent(code)}`,
      { cacheMs: 10 * 60_000 },
    );
  },
};
