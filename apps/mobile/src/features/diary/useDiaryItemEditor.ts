import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useDiaryStore } from '../../store/useDiaryStore';
import { useToastStore } from '../../store/useToastStore';

type DiaryItemLike = {
  id: string;
  weightGrams: number;
  food?: { nameUz?: string; name?: string; nutrition?: { calories?: number; protein?: number; carbs?: number; fat?: number } };
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
  const { removeDiaryItem, updateDiaryItem } = useDiaryStore();
  const { showToast } = useToastStore();

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; weight: number } | null>(null);

  const [editVisible, setEditVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<EditItemState | null>(null);
  const [editWeight, setEditWeight] = useState('300');

  const promptDelete = useCallback((item: DiaryItemLike) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItemToDelete({
      id: item.id,
      name: item.food?.nameUz || item.food?.name || 'Taom',
      weight: item.weightGrams,
    });
    setDeleteVisible(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await removeDiaryItem(itemToDelete.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeleteVisible(false);
      setItemToDelete(null);
      showToast('Taom o‘chirildi', 'info');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(e?.message || 'O‘chirishda xatolik', 'error');
    }
  }, [itemToDelete, removeDiaryItem, showToast]);

  const promptEdit = useCallback((item: DiaryItemLike) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const w = item.weightGrams || 100;
    const calPer100 =
      item.food?.nutrition?.calories ||
      Math.round(((item.nutrition?.calories || 0) / w) * 100) ||
      150;
    const protPer100 =
      item.food?.nutrition?.protein ||
      Math.round(((item.nutrition?.protein || 0) / w) * 100) ||
      10;
    const carbPer100 =
      item.food?.nutrition?.carbs ||
      Math.round(((item.nutrition?.carbs || 0) / w) * 100) ||
      20;
    const fatPer100 =
      item.food?.nutrition?.fat ||
      Math.round(((item.nutrition?.fat || 0) / w) * 100) ||
      8;

    setItemToEdit({
      id: item.id,
      name: item.food?.nameUz || item.food?.name || 'Taom',
      weight: w,
      caloriesPer100g: calPer100,
      proteinPer100g: protPer100,
      carbsPer100g: carbPer100,
      fatPer100g: fatPer100,
    });
    setEditWeight(String(w));
    setEditVisible(true);
  }, []);

  const adjustWeight = useCallback((delta: number) => {
    Haptics.selectionAsync();
    setEditWeight((prev) => {
      const current = parseInt(prev, 10) || 300;
      return String(Math.max(30, Math.min(1200, current + delta)));
    });
  }, []);

  const confirmEdit = useCallback(async () => {
    if (!itemToEdit) return;
    const grams = parseInt(editWeight, 10);
    if (isNaN(grams) || grams < 30 || grams > 1200) {
      showToast('Gramm 30–1200 oralig‘ida bo‘lishi kerak', 'warning');
      return;
    }
    try {
      await updateDiaryItem(itemToEdit.id, grams);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditVisible(false);
      setItemToEdit(null);
      showToast('Porsiya yangilandi', 'success');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(e?.message || 'Yangilashda xatolik', 'error');
    }
  }, [itemToEdit, editWeight, updateDiaryItem, showToast]);

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
