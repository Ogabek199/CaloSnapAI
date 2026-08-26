export interface DetectedFoodItem {
  name: string;
  nameUz?: string;
  nameRu?: string;
  nameEn?: string;
  category?: string;
  estimatedWeightGrams: number;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  fiberPer100g?: number;
  confidence: number;
  ingredients?: string[];
  visualNotes?: string;
}

export interface AiFoodAnalysisResult {
  isFood: boolean;
  rejectionReason?: string;
  items: DetectedFoodItem[];
  rawText?: string;
}
