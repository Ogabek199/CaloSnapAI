import { create } from 'zustand';
import { FoodScanResult, FoodScanItem, Food } from '@eda/types';

interface ScanState {
  imageUri: string | null;
  scanResult: FoodScanResult | null;
  selectedItemIndex: number;
  scanMode: 'single' | 'table';
  isAnalyzing: boolean;
  analysisCancelled: boolean;

  setImageUri: (uri: string | null) => void;
  setScanResult: (result: FoodScanResult | null) => void;
  setAnalyzing: (status: boolean) => void;
  setSelectedItemIndex: (index: number) => void;
  setScanMode: (mode: 'single' | 'table') => void;
  cancelAnalysis: () => void;
  resetAnalysisCancel: () => void;
  reset: () => void;

  updateItemWeight: (itemIndex: number, newWeight: number) => void;
  swapItemFood: (itemIndex: number, newFood: Food) => void;
  removeItem: (itemIndex: number) => void;
  addItem: (food: Food, weightGrams?: number) => void;
}

export const useScanStore = create<ScanState>((set) => ({
  imageUri: null,
  scanResult: null,
  selectedItemIndex: 0,
  scanMode: 'single',
  isAnalyzing: false,
  analysisCancelled: false,

  setImageUri: (uri) => set({ imageUri: uri }),
  setScanResult: (result) => set({ scanResult: result }),
  setAnalyzing: (status) => set({ isAnalyzing: status }),
  setSelectedItemIndex: (index) => set({ selectedItemIndex: index }),
  setScanMode: (mode) => set({ scanMode: mode }),
  cancelAnalysis: () =>
    set({
      analysisCancelled: true,
      isAnalyzing: false,
      scanResult: null,
      imageUri: null,
    }),
  resetAnalysisCancel: () => set({ analysisCancelled: false }),
  reset: () =>
    set({
      imageUri: null,
      scanResult: null,
      selectedItemIndex: 0,
      scanMode: 'single',
      isAnalyzing: false,
      analysisCancelled: false,
    }),

  updateItemWeight: (itemIndex, newWeight) =>
    set((state) => {
      if (!state.scanResult || !state.scanResult.items[itemIndex]) return state;

      const items = [...state.scanResult.items];
      const target = { ...items[itemIndex] };
      const factor = newWeight / 100;
      const per100g = target.food.nutrition;

      target.weightGrams = newWeight;
      target.nutrition = {
        calories: Math.round(factor * per100g.calories * 10) / 10,
        protein: Math.round(factor * per100g.protein * 10) / 10,
        carbs: Math.round(factor * per100g.carbs * 10) / 10,
        fat: Math.round(factor * per100g.fat * 10) / 10,
        fiber: per100g.fiber ? Math.round(factor * per100g.fiber * 10) / 10 : 0,
      };
      target.isUserModified = true;

      items[itemIndex] = target;

      const totalNutrition = items.reduce(
        (acc, item) => ({
          calories: Math.round((acc.calories + item.nutrition.calories) * 10) / 10,
          protein: Math.round((acc.protein + item.nutrition.protein) * 10) / 10,
          carbs: Math.round((acc.carbs + item.nutrition.carbs) * 10) / 10,
          fat: Math.round((acc.fat + item.nutrition.fat) * 10) / 10,
          fiber: Math.round(((acc.fiber || 0) + (item.nutrition.fiber || 0)) * 10) / 10,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      );

      return {
        scanResult: {
          ...state.scanResult,
          items,
          totalNutrition,
        },
      };
    }),

  swapItemFood: (itemIndex, newFood) =>
    set((state) => {
      if (!state.scanResult || !state.scanResult.items[itemIndex]) return state;

      const items = [...state.scanResult.items];
      const current = items[itemIndex];
      const factor = current.weightGrams / 100;
      const per100g = newFood.nutrition;

      const updated: FoodScanItem = {
        ...current,
        foodId: newFood.id,
        food: newFood,
        nutrition: {
          calories: Math.round(factor * per100g.calories * 10) / 10,
          protein: Math.round(factor * per100g.protein * 10) / 10,
          carbs: Math.round(factor * per100g.carbs * 10) / 10,
          fat: Math.round(factor * per100g.fat * 10) / 10,
          fiber: per100g.fiber ? Math.round(factor * per100g.fiber * 10) / 10 : 0,
        },
        isUserModified: true,
      };

      items[itemIndex] = updated;

      const totalNutrition = items.reduce(
        (acc, item) => ({
          calories: Math.round((acc.calories + item.nutrition.calories) * 10) / 10,
          protein: Math.round((acc.protein + item.nutrition.protein) * 10) / 10,
          carbs: Math.round((acc.carbs + item.nutrition.carbs) * 10) / 10,
          fat: Math.round((acc.fat + item.nutrition.fat) * 10) / 10,
          fiber: Math.round(((acc.fiber || 0) + (item.nutrition.fiber || 0)) * 10) / 10,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      );

      return {
        scanResult: {
          ...state.scanResult,
          items,
          totalNutrition,
        },
      };
    }),

  removeItem: (itemIndex) =>
    set((state) => {
      if (!state.scanResult || !state.scanResult.items[itemIndex]) return state;

      const items = state.scanResult.items.filter((_, idx) => idx !== itemIndex);
      const totalNutrition = items.reduce(
        (acc, item) => ({
          calories: Math.round((acc.calories + item.nutrition.calories) * 10) / 10,
          protein: Math.round((acc.protein + item.nutrition.protein) * 10) / 10,
          carbs: Math.round((acc.carbs + item.nutrition.carbs) * 10) / 10,
          fat: Math.round((acc.fat + item.nutrition.fat) * 10) / 10,
          fiber: Math.round(((acc.fiber || 0) + (item.nutrition.fiber || 0)) * 10) / 10,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      );

      const nextSelectedIndex = Math.min(state.selectedItemIndex, Math.max(0, items.length - 1));

      return {
        selectedItemIndex: nextSelectedIndex,
        scanResult: {
          ...state.scanResult,
          items,
          totalNutrition,
        },
      };
    }),

  addItem: (food, weightGrams = 150) =>
    set((state) => {
      if (!state.scanResult) return state;

      const factor = weightGrams / 100;
      const per100g = food.nutrition;
      const newItem: FoodScanItem = {
        foodId: food.id,
        food,
        weightGrams,
        confidence: 0.95,
        nutrition: {
          calories: Math.round(factor * per100g.calories * 10) / 10,
          protein: Math.round(factor * per100g.protein * 10) / 10,
          carbs: Math.round(factor * per100g.carbs * 10) / 10,
          fat: Math.round(factor * per100g.fat * 10) / 10,
          fiber: per100g.fiber ? Math.round(factor * per100g.fiber * 10) / 10 : 0,
        },
        isUserModified: true,
      };

      const items = [...state.scanResult.items, newItem];
      const totalNutrition = items.reduce(
        (acc, item) => ({
          calories: Math.round((acc.calories + item.nutrition.calories) * 10) / 10,
          protein: Math.round((acc.protein + item.nutrition.protein) * 10) / 10,
          carbs: Math.round((acc.carbs + item.nutrition.carbs) * 10) / 10,
          fat: Math.round((acc.fat + item.nutrition.fat) * 10) / 10,
          fiber: Math.round(((acc.fiber || 0) + (item.nutrition.fiber || 0)) * 10) / 10,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      );

      return {
        selectedItemIndex: items.length - 1,
        scanResult: {
          ...state.scanResult,
          items,
          totalNutrition,
        },
      };
    }),
}));
