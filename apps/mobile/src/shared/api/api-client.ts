import Constants from 'expo-constants';
import { Food, FoodScanResult, DailyDiarySummary, UpdateScanItemDto } from '@eda/types';

// Automatically detect machine IP when running in Expo Go on mobile
const getApiBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api/v1`;
  }
  return 'http://192.168.1.70:3000/api/v1';
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

    const response = await fetch(`${API_BASE_URL}/food-scans`, {
      method: 'POST',
      body: formData,
      headers,
    });

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
    const response = await fetch(`${API_BASE_URL}/foods?q=${encodeURIComponent(query)}`, {
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
    const response = await fetch(`${API_BASE_URL}/food-scans/${scanId}/items/${itemId}`, {
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
   * Get Today's Diary Summary
   */
  async getTodayDiary(): Promise<DailyDiarySummary> {
    const response = await fetch(`${API_BASE_URL}/diary/today`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Kundalik ma’lumotlarini yuklashda xatolik');
    }
    return await response.json();
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
    const response = await fetch(`${API_BASE_URL}/diary/items`, {
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
    const response = await fetch(`${API_BASE_URL}/diary/items/${itemId}`, {
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
    const response = await fetch(`${API_BASE_URL}/diary/items/${itemId}`, {
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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
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

  async register(identifier: string, name: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phone: identifier, name, password }),
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
    const response = await fetch(`${API_BASE_URL}/goals/save`, {
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
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || 'Foydalanuvchi ma’lumotlarini yuklab bo‘lmadi');
    }
    return data;
  },
};
