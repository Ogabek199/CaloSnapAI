import Constants from 'expo-constants';
import { Food, FoodScanResult, DailyDiarySummary, UpdateScanItemDto } from '@eda/types';

// Prefer explicit env; else Expo LAN host; else localhost
const getApiBaseUrl = () => {
  const fromEnv =
    process.env.EXPO_PUBLIC_API_URL ||
    (Constants.expoConfig?.extra as any)?.apiUrl;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, '');
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri && !hostUri.includes('exp.direct')) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api/v1`;
  }
  return 'http://localhost:3000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();
console.log('[Taom AI] Connecting to backend at:', API_BASE_URL);

const getAuthHeaders = (extra: Record<string, string> = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extra,
  };
  try {
    const { useAppStore } = require('../../store/useAppStore');
    const token = useAppStore?.getState()?.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {}
  return headers;
};

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(
        `Serverdan javob kelmadi (Vaqt tugadi). Telefoningiz va Mac bir xil Wi-Fi tarmog'ida ekanligini tekshiring (${API_BASE_URL})`,
      );
    }
    if (error.message && (error.message.includes('Network request failed') || error.message.includes('Failed to fetch'))) {
      throw new Error(
        `Serverga ulanib bo‘lmadi (${API_BASE_URL}). Telefon va kompyuter bitta Wi-Fi tarmog‘iga ulanganligini tekshiring.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const ApiClient = {
  /**
   * Upload real food photo for AI analysis
   */
  async scanFood(imageUri: string): Promise<FoodScanResult> {
    const formData = new FormData();

    const filename = imageUri.split('/').pop() || 'food.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    try {
      const { useAppStore } = require('../../store/useAppStore');
      const token = useAppStore?.getState()?.token;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {}

    const response = await fetchWithTimeout(`${API_BASE_URL}/food-scans`, {
      method: 'POST',
      body: formData,
      headers,
    }, 30000); // 30s for AI photo analysis

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        responseData?.message ||
        responseData?.error ||
        `Server xatosi (${response.status}): Rasmda ovqat aniqlanmadi yoki ulanishda muammo.`;
      throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    }

    return responseData;
  },

  /**
   * Search foods in database
   */
  async searchFoods(query: string = ''): Promise<Food[]> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/foods?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Taomlar ro‘yxatini yuklashda xatolik yuz berdi');
    }
    return await response.json();
  },

  /**
   * Update scanned item (Portion or Food type)
   */
  async updateScanItem(scanId: string, itemId: string, dto: UpdateScanItemDto): Promise<FoodScanResult> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/food-scans/${scanId}/items/${itemId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || 'Tuzatishni saqlashda xatolik');
    }

    return await response.json();
  },

  /**
   * Get diary summary for a calendar date (YYYY-MM-DD). Defaults to today.
   */
  async getDiaryByDate(date: string): Promise<DailyDiarySummary> {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/diary?date=${encodeURIComponent(date)}`,
      {
        headers: getAuthHeaders(),
      },
    );
    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || 'Kundalik ma’lumotlarini yuklashda xatolik');
    }
    return await response.json();
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/diary/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mealType, foodId, weightGrams, scanId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || 'Taomni kundalikka saqlashda xatolik');
    }

    return await response.json();
  },

  /**
   * Remove Item from Diary
   */
  async removeMealItem(itemId: string) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/diary/items/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Taomni o‘chirishda xatolik');
    }

    return await response.json();
  },

  /**
   * Update Item Portion in Diary
   */
  async updateMealItem(itemId: string, weightGrams: number) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/diary/items/${itemId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ weightGrams }),
    });

    if (!response.ok) {
      throw new Error('Porsiyani yangilashda xatolik');
    }

    return await response.json();
  },

  /**
   * Phone Number / Email Authentication
   */
  async login(identifier: string, password: string) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phone: identifier, password }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || 'Telefon raqami yoki parol noto‘g‘ri');
    }
    return data;
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phone: identifier, name, password, profile }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || 'Ro‘yxatdan o‘tishda xatolik');
    }
    return data;
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/goals/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || 'Maqsadlarni saqlashda xatolik');
    }
    return data;
  },

  /**
   * Fetch current user profile
   */
  async getMe() {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || 'Foydalanuvchi ma’lumotlarini yuklab bo‘lmadi');
    }
    return data;
  },

  /**
   * Update Profile Avatar URL
   */
  async updateAvatar(avatarUrl: string) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/avatar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ avatarUrl }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || 'Profil rasmini saqlashda xatolik');
    }
    return data;
  },

  async getDiarySummary(from: string, to: string) {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/diary/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { headers: getAuthHeaders() },
    );
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || 'Haftalik statistika yuklanmadi');
    }
    return data as {
      from: string;
      to: string;
      goalCalories: number;
      streak: number;
      avgCalories: number;
      daysLogged: number;
      days: { date: string; calories: number; logged: boolean; goalHit: boolean }[];
    };
  },

  async addWeight(weightKg: number) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/tracking/weight`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ weightKg }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || 'Vazn saqlanmadi');
    return data;
  },

  async listWeight(days = 30) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/tracking/weight?days=${days}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || 'Vazn tarixi yuklanmadi');
    return data as { id: string; weightKg: number; loggedAt: string }[];
  },

  async addWater(amountMl = 250) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/tracking/water`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amountMl }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || 'Suv qo‘shilmadi');
    return data;
  },

  async waterToday() {
    const response = await fetchWithTimeout(`${API_BASE_URL}/tracking/water/today`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || 'Suv ma’lumoti yuklanmadi');
    return data as { totalMl: number; goalMl: number };
  },

  async findFoodByBarcode(code: string) {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/foods/barcode/${encodeURIComponent(code)}`,
      { headers: getAuthHeaders() },
    );
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || 'Barcode qidiruvi xatosi');
    return data as { found: boolean; food: Food | null };
  },
};
