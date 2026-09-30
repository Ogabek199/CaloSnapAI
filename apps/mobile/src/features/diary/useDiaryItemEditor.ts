import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useDiaryStore } from '../../store/useDiaryStore';
import { useToastStore } from '../../store/useToastStore';
import { useAppStore, useStrings } from '../../store/useAppStore';
import { foodName } from '../../shared/i18n/languages';

const MIN_GRAMS = 30;
const MAX_GRAMS = 1200;

type Macro = 'calories' | 'protein' | 'carbs' | 'fat';

function per100(item: DiaryItemLike, key: Macro, weight: number): number {
  const fromFood = item.food?.nutrition?.[key];
  if (typeof fromFood === 'number') return fromFood;
  const total = item.nutrition?.[key];
  if (typeof total === 'number' && weight > 0) {
    return Math.round((total / weight) * 1000) / 10;
  }
  return 0;
}

type DiaryItemLike = {
  id: string;
  weightGrams: number;
  food?: { nameUz?: string; nameRu?: string; nameEn?: string; name?: string; nutrition?: { calories?: number; protein?: number; carbs?: number; fat?: number } };
  nutrition?: { calories?: number; protein?: number; carbs?: number; fat?: number };
};

export type EditItemState = {
  id: string;
  name: string;
  weight: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

export function useDiaryItemEditor() {
  const removeDiaryItem = useDiaryStore((s) => s.removeDiaryItem);
  const updateDiaryItem = useDiaryStore((s) => s.updateDiaryItem);
  const showToast = useToastStore((s) => s.showToast);
  const strings = useStrings();
  const language = useAppStore((st) => st.language);

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; weight: number } | null>(null);

  const [editVisible, setEditVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<EditItemState | null>(null);
  const [editWeight, setEditWeight] = useState('300');

  const promptDelete = useCallback((item: DiaryItemLike) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItemToDelete({
      id: item.id,
      name: foodName(item.food, language, strings.defaultFoodName),
      weight: item.weightGrams,
    });
    setDeleteVisible(true);
  }, [strings.defaultFoodName, language]);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    if (!useDiaryStore.getState().isSelectedToday()) {
      setDeleteVisible(false);
      showToast(strings.onlyTodayEdit, 'warning');
      return;
    }
    try {
      await removeDiaryItem(itemToDelete.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeleteVisible(false);
      setItemToDelete(null);
      showToast(strings.itemDeleted, 'info');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(e?.message || strings.errGeneric, 'error');
    }
  }, [itemToDelete, removeDiaryItem, showToast, strings]);

  const promptEdit = useCallback((item: DiaryItemLike) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const w = item.weightGrams || 100;

    setItemToEdit({
      id: item.id,
      name: foodName(item.food, language, strings.defaultFoodName),
      weight: w,
      caloriesPer100g: per100(item, 'calories', w),
      proteinPer100g: per100(item, 'protein', w),
      carbsPer100g: per100(item, 'carbs', w),
      fatPer100g: per100(item, 'fat', w),
    });
    setEditWeight(String(w));
    setEditVisible(true);
  }, [strings.defaultFoodName, language]);

  const adjustWeight = useCallback((delta: number) => {
    Haptics.selectionAsync();
    setEditWeight((prev) => {
      const current = parseInt(prev, 10) || 300;
      return String(Math.max(MIN_GRAMS, Math.min(MAX_GRAMS, current + delta)));
    });
  }, []);

  const confirmEdit = useCallback(async () => {
    if (!itemToEdit) return;
    const grams = parseInt(editWeight, 10);
    if (isNaN(grams) || grams < MIN_GRAMS || grams > MAX_GRAMS) {
      showToast(
        strings.gramsRange.replace('{min}', String(MIN_GRAMS)).replace('{max}', String(MAX_GRAMS)),
        'warning',
      );
      return;
    }
    if (!useDiaryStore.getState().isSelectedToday()) {
      setEditVisible(false);
      showToast(strings.onlyTodayEdit, 'warning');
      return;
    }
    try {
      await updateDiaryItem(itemToEdit.id, grams);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditVisible(false);
      setItemToEdit(null);
      showToast(strings.portionUpdated, 'success');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(e?.message || strings.errGeneric, 'error');
    }
  }, [itemToEdit, editWeight, updateDiaryItem, showToast, strings]);

  const grams = parseInt(editWeight, 10) || 0;
  const preview = itemToEdit
    ? {
        cal: Math.round((itemToEdit.caloriesPer100g * grams) / 100),
        protein: Math.round(((itemToEdit.proteinPer100g * grams) / 100) * 10) / 10,
        carbs: Math.round(((itemToEdit.carbsPer100g * grams) / 100) * 10) / 10,
        fat: Math.round(((itemToEdit.fatPer100g * grams) / 100) * 10) / 10,
      }
    : null;

  return {
    deleteVisible,
    setDeleteVisible,
    itemToDelete,
    promptDelete,
    confirmDelete,
    editVisible,
    setEditVisible,
    itemToEdit,
    editWeight,
    setEditWeight,
    promptEdit,
    adjustWeight,
    confirmEdit,
    preview,
  };
}
