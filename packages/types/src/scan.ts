import { CalculatedNutrition } from './nutrition';
import { Food } from './food';

export type ScanStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface GeminiDetectedItem {
  name: string;
  estimatedWeightGrams: number;
  confidence: number;
  ingredients?: string[];
  visualNotes?: string;
}

export interface GeminiVisionResponse {
  items: GeminiDetectedItem[];
}

export interface FoodScanItem {
  id?: string;
  foodId: string;
  food: Food;
  weightGrams: number;
  nutrition: CalculatedNutrition;
  confidence: number;
  isUserModified?: boolean;
}

export interface FoodScanResult {
  id: string;
  imageUrl: string;
  status: ScanStatus;
  items: FoodScanItem[];
  totalNutrition: CalculatedNutrition;
  createdAt: string;
}

export interface UpdateScanItemDto {
  foodId?: string;
  weightGrams?: number;
}
