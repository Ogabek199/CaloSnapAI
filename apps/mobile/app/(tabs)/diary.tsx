import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  Trash2,
  Edit3,
  Flame,
  AlertTriangle,
  Sparkles,
  Camera,
  Minus,
  Utensils,
  Clock,
  Check,
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../src/store/useAppStore';
import { useDiaryStore } from '../../src/store/useDiaryStore';
import { useToastStore } from '../../src/store/useToastStore';
import { CustomModal } from '../../src/shared/ui/CustomModal';

interface MealConfig {
  type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  title: string;
  emoji: string;
  timeRange: string;
  accentDark: string;
  accentLight: string;
  badgeBgDark: string;
  badgeBgLight: string;
}

const MEAL_CONFIGS: Record<string, MealConfig> = {
  BREAKFAST: {
    type: 'BREAKFAST',
    title: 'Nonushta',
    emoji: '🍳',
    timeRange: '07:00 – 10:00',
    accentDark: '#F59E0B',
    accentLight: '#D97706',
    badgeBgDark: 'rgba(245, 158, 11, 0.14)',
    badgeBgLight: 'rgba(217, 119, 6, 0.10)',
  },
  LUNCH: {
    type: 'LUNCH',
    title: 'Tushlik',
    emoji: '🍲',
    timeRange: '12:00 – 15:00',
    accentDark: '#00E599',
    accentLight: '#059669',
    badgeBgDark: 'rgba(0, 229, 153, 0.14)',
    badgeBgLight: 'rgba(5, 150, 105, 0.10)',
  },
  DINNER: {
    type: 'DINNER',
    title: 'Kechki ovqat',
    emoji: '🥩',
    timeRange: '18:00 – 21:00',
    accentDark: '#818CF8',
    accentLight: '#4F46E5',
    badgeBgDark: 'rgba(129, 140, 248, 0.14)',
    badgeBgLight: 'rgba(79, 70, 229, 0.10)',
  },
  SNACK: {
    type: 'SNACK',
    title: 'Qisqa tamaddi',
    emoji: '🥪',
    timeRange: 'Oraliq vaqtlar',
    accentDark: '#F472B6',
    accentLight: '#DB2777',
    badgeBgDark: 'rgba(244, 114, 182, 0.14)',
    badgeBgLight: 'rgba(219, 39, 119, 0.10)',
  },
};

export default function DiaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, theme, themeMode } = useAppStore();
  const { todaySummary, refreshDiary, removeDiaryItem, updateDiaryItem } = useDiaryStore();
  const { showToast } = useToastStore();

  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Delete
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; weight: number } | null>(null);

  // Modal State for Edit
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<{
    id: string;
    name: string;
    weight: number;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
  } | null>(null);
  const [editWeight, setEditWeight] = useState('300');

  const currentTheme = theme();
  const isDark = themeMode === 'dark';
  const strings = t();

  useEffect(() => {
    refreshDiary();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refreshDiary();
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  };

  // 1. Open Delete Modal
  const promptDelete = (item: { id: string; food: { nameUz?: string; name: string }; weightGrams: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItemToDelete({
      id: item.id,
      name: item.food.nameUz || item.food.name,
      weight: item.weightGrams,
    });
    setDeleteModalVisible(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await removeDiaryItem(itemToDelete.id);
    setDeleteModalVisible(false);
    setItemToDelete(null);
    showToast('Taom kundalikdan muvaffaqiyatli o‘chirildi', 'info');
  };

  // 2. Open Edit Modal
  const promptEdit = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const calPer100 = item.food.nutrition?.calories || Math.round((item.nutrition.calories / item.weightGrams) * 100) || 150;
    const protPer100 = item.food.nutrition?.protein || Math.round((item.nutrition.protein / item.weightGrams) * 100) || 10;
    const carbPer100 = item.food.nutrition?.carbs || Math.round((item.nutrition.carbs / item.weightGrams) * 100) || 20;
    const fatPer100 = item.food.nutrition?.fat || Math.round((item.nutrition.fat / item.weightGrams) * 100) || 8;

    setItemToEdit({
      id: item.id,
      name: item.food.nameUz || item.food.name,
      weight: item.weightGrams,
      caloriesPer100g: calPer100,
      proteinPer100g: protPer100,
      carbsPer100g: carbPer100,
      fatPer100g: fatPer100,
    });
    setEditWeight(item.weightGrams.toString());
    setEditModalVisible(true);
  };

  // Adjust Edit Weight
  const adjustEditWeight = (delta: number) => {
    Haptics.selectionAsync();
    const current = parseInt(editWeight, 10) || 300;
    const next = Math.max(30, Math.min(1000, current + delta));
    setEditWeight(next.toString());
  };

  // Confirm Edit
  const confirmEdit = async () => {
    if (!itemToEdit) return;
    const grams = parseInt(editWeight, 10);
    if (isNaN(grams) || grams < 30 || grams > 1200) {
      showToast('Iltimos, to‘g‘ri gramm kiriting (30 - 1200g oralig‘ida)', 'warning');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateDiaryItem(itemToEdit.id, grams);
    setEditModalVisible(false);
    setItemToEdit(null);
    showToast('Porsiya muvaffaqiyatli yangilandi', 'success');
  };

  const total = todaySummary?.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goal = todaySummary?.goalCalories || 2150;
  const consumed = Math.round(total.calories || 0);
  const remaining = Math.max(0, Math.round(goal - consumed));
  const progressPercent = goal > 0 ? Math.min(100, Math.max(0, (consumed / goal) * 100)) : 0;

  // Macro Targets
  const proteinTarget = Math.max(1, Math.round((goal * 0.25) / 4));
  const carbsTarget = Math.max(1, Math.round((goal * 0.5) / 4));
  const fatTarget = Math.max(1, Math.round((goal * 0.25) / 9));

  // Calculated preview for Edit Modal
  const editGramsNumber = parseInt(editWeight, 10) || 0;
  const previewCal = itemToEdit ? Math.round((itemToEdit.caloriesPer100g * editGramsNumber) / 100) : 0;
  const previewProt = itemToEdit ? Math.round(((itemToEdit.proteinPer100g * editGramsNumber) / 100) * 10) / 10 : 0;
  const previewCarb = itemToEdit ? Math.round(((itemToEdit.carbsPer100g * editGramsNumber) / 100) * 10) / 10 : 0;
  const previewFat = itemToEdit ? Math.round(((itemToEdit.fatPer100g * editGramsNumber) / 100) * 10) / 10 : 0;

  const formattedDate = `${strings.today}, ${new Date().toLocaleDateString('uz-UZ', { weekday: 'long', month: 'long', day: 'numeric' })}`;

  const openScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/scan');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0A0E1A' : currentTheme.background }]}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
            {strings.diaryTitle}
          </Text>
          <Text style={[styles.dateSub, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
            {formattedDate}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.quickScanBtn,
            {
              backgroundColor: isDark ? 'rgba(0, 229, 153, 0.14)' : 'rgba(5, 150, 105, 0.10)',
              borderColor: isDark ? 'rgba(0, 229, 153, 0.35)' : 'rgba(5, 150, 105, 0.3)',
            },
          ]}
          activeOpacity={0.8}
          onPress={openScan}
        >
          <Camera color={isDark ? '#00E599' : '#059669'} size={15} strokeWidth={2.4} />
          <Text style={[styles.quickScanText, { color: isDark ? '#00E599' : '#059669' }]}>
            {strings.addFood}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#00E599' : '#059669'}
            colors={[isDark ? '#00E599' : '#059669']}
          />
        }
      >
        {/* Daily Summary Hero Card */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isDark ? '#121A2B' : currentTheme.card,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
              shadowColor: isDark ? '#000000' : '#64748B',
              shadowOpacity: isDark ? 0.25 : 0.06,
            },
          ]}
        >
          {/* 3 Metric Columns */}
          <View style={styles.calorieRow}>
            {/* Consumed */}
            <View style={styles.calorieItem}>
              <Text style={[styles.summaryBigVal, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                {consumed}
              </Text>
              <Text style={[styles.summaryLabel, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                {strings.consumed} (kcal)
              </Text>
            </View>

            <View style={[styles.summaryDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : currentTheme.border }]} />

            {/* Goal */}
            <View style={styles.calorieItem}>
              <Text style={[styles.summaryBigVal, { color: isDark ? '#F59E0B' : '#D97706' }]}>
                {goal}
              </Text>
              <Text style={[styles.summaryLabel, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                {strings.goalKcal}
              </Text>
            </View>

            <View style={[styles.summaryDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : currentTheme.border }]} />

            {/* Remaining */}
            <View style={styles.calorieItem}>
              <Text style={[styles.summaryBigVal, { color: isDark ? '#00E599' : '#059669' }]}>
                {remaining}
              </Text>
              <Text style={[styles.summaryLabel, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                {strings.remaining} (kcal)
              </Text>
            </View>
          </View>

          {/* Liquid Gradient Progress Bar */}
          <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#0A0E1A' : '#E2E8F0' }]}>
            <LinearGradient
              colors={isDark ? ['#059669', '#00E599'] : ['#059669', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
            />
          </View>

          {/* 3 Macro Target Pills */}
          <View style={styles.macroPillsRow}>
            {/* Protein */}
            <View
              style={[
                styles.macroPill,
                {
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)',
                },
              ]}
            >
              <View style={[styles.macroPillDot, { backgroundColor: isDark ? '#3B82F6' : '#2563EB' }]} />
              <View>
                <Text style={[styles.macroPillLabel, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                  {strings.protein}
                </Text>
                <Text style={[styles.macroPillVal, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
                  {Math.round(total.protein)}g <Text style={styles.macroTargetText}>/ {proteinTarget}g</Text>
                </Text>
              </View>
            </View>

            {/* Carbs */}
            <View
              style={[
                styles.macroPill,
                {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(217, 119, 6, 0.08)',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(217, 119, 6, 0.2)',
                },
              ]}
            >
              <View style={[styles.macroPillDot, { backgroundColor: isDark ? '#F59E0B' : '#D97706' }]} />
              <View>
                <Text style={[styles.macroPillLabel, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                  {strings.carbs}
                </Text>
                <Text style={[styles.macroPillVal, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                  {Math.round(total.carbs)}g <Text style={styles.macroTargetText}>/ {carbsTarget}g</Text>
                </Text>
              </View>
            </View>

            {/* Fat */}
            <View
              style={[
                styles.macroPill,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(220, 38, 38, 0.08)',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.2)',
                },
              ]}
            >
              <View style={[styles.macroPillDot, { backgroundColor: isDark ? '#EF4444' : '#DC2626' }]} />
              <View>
                <Text style={[styles.macroPillLabel, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                  {strings.fat}
                </Text>
                <Text style={[styles.macroPillVal, { color: isDark ? '#F87171' : '#B91C1C' }]}>
                  {Math.round(total.fat)}g <Text style={styles.macroTargetText}>/ {fatTarget}g</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Meal Group Sections: 4 Meals */}
        {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map((mealType) => {
          const config = MEAL_CONFIGS[mealType];
          const meal = todaySummary?.meals?.find((m) => m.type === mealType);
          const items = meal?.items || [];
          const mealCalories = Math.round(meal?.totalNutrition?.calories || 0);
          const hasItems = items.length > 0;

          const accentColor = isDark ? config.accentDark : config.accentLight;
          const badgeBg = isDark ? config.badgeBgDark : config.badgeBgLight;

          return (
            <View
              key={mealType}
              style={[
                styles.mealSectionCard,
                {
                  backgroundColor: isDark ? '#121A2B' : currentTheme.card,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : currentTheme.border,
                  shadowColor: isDark ? '#000000' : '#64748B',
                  shadowOpacity: isDark ? 0.2 : 0.06,
                },
              ]}
            >
              {/* Meal Header */}
              <View
                style={[
                  styles.mealSectionHeader,
                  { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : currentTheme.border },
                ]}
              >
                <View style={styles.mealTitleLeft}>
                  <View style={[styles.mealIconBox, { backgroundColor: badgeBg, borderColor: accentColor }]}>
                    <Text style={styles.mealIconEmoji}>{config.emoji}</Text>
                  </View>
                  <View>
                    <Text style={[styles.mealTitleText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                      {config.title}
                    </Text>
                    <View style={styles.mealMetaRow}>
                      <Clock color={isDark ? '#64748B' : '#64748B'} size={11} />
                      <Text style={[styles.mealTimeRangeText, { color: isDark ? '#64748B' : '#64748B' }]}>
                        {config.timeRange}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Calorie Badge on Top Right */}
                <View
                  style={[
                    styles.mealCalorieBadge,
                    {
                      backgroundColor: hasItems ? badgeBg : (isDark ? '#0A0E1A' : '#F1F5F9'),
                      borderColor: hasItems ? accentColor : (isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border),
                    },
                  ]}
                >
                  {hasItems && <Flame color={accentColor} size={13} fill={accentColor} />}
                  <Text
                    style={[
                      styles.mealCalorieText,
                      { color: hasItems ? accentColor : (isDark ? '#64748B' : '#64748B') },
                    ]}
                  >
                    {mealCalories} kcal
                  </Text>
                </View>
              </View>

              {/* Meal Items List or Empty State */}
              {!hasItems ? (
                <View style={styles.emptyMealPlaceholder}>
                  <Text style={[styles.emptyMealText, { color: isDark ? '#64748B' : currentTheme.textMuted }]}>
                    {strings.noFoodLogged}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.addFirstFoodBtn,
                      {
                        backgroundColor: isDark ? '#0A0E1A' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={openScan}
                  >
                    <Plus color={accentColor} size={14} strokeWidth={2.4} />
                    <Text style={[styles.addFirstFoodText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                      {strings.addFood}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.foodItemsList}>
                  {items.map((item) => {
                    const dishName = item.food.nameUz || item.food.name;
                    const dishCalories = Math.round(item.nutrition.calories);
                    const dishProtein = Math.round(item.nutrition.protein);
                    const dishCarbs = Math.round(item.nutrition.carbs);
                    const dishFat = Math.round(item.nutrition.fat);

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.foodCardRow,
                          {
                            backgroundColor: isDark ? '#0A0E1A' : '#F8FAFC',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : currentTheme.border,
                          },
                        ]}
                      >
                        {/* Dish Avatar */}
                        <View
                          style={[
                            styles.dishThumbnailBox,
                            { backgroundColor: isDark ? '#121A2B' : '#EDF2F7' },
                          ]}
                        >
                          {item.food?.imageUrl ? (
                            <Image source={{ uri: item.food.imageUrl }} style={styles.dishImage} />
                          ) : (
                            <Utensils color={accentColor} size={16} />
                          )}
                        </View>

                        {/* Dish Details */}
                        <View style={styles.foodInfoCol}>
                          <Text
                            style={[styles.foodRowTitle, { color: isDark ? '#F8FAFC' : currentTheme.text }]}
                            numberOfLines={1}
                          >
                            {dishName}
                          </Text>
                          <View style={styles.dishSubMetaRow}>
                            <Text style={[styles.foodRowWeightBadge, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                              {item.weightGrams}g
                            </Text>
                            <Text style={styles.foodMetaDot}>•</Text>
                            <Text style={[styles.foodRowSub, { color: isDark ? '#64748B' : currentTheme.textMuted }]}>
                              O: {dishProtein}g · U: {dishCarbs}g · Y: {dishFat}g
                            </Text>
                          </View>
                        </View>

                        {/* Calories & Action Buttons */}
                        <View style={styles.foodRowRight}>
                          <Text style={[styles.foodRowCalories, { color: accentColor }]}>
                            {dishCalories} kcal
                          </Text>

                          <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                              style={[
                                styles.actionIconBtn,
                                {
                                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.14)' : 'rgba(37, 99, 235, 0.08)',
                                },
                              ]}
                              onPress={() => promptEdit(item)}
                              activeOpacity={0.7}
                            >
                              <Edit3 color={isDark ? '#60A5FA' : '#2563EB'} size={13} />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.actionIconBtn,
                                {
                                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.14)' : 'rgba(220, 38, 38, 0.08)',
                                },
                              ]}
                              onPress={() => promptDelete(item)}
                              activeOpacity={0.7}
                            >
                              <Trash2 color={isDark ? '#EF4444' : '#DC2626'} size={13} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {/* Add More button at bottom of card */}
                  <TouchableOpacity
                    style={[
                      styles.addMoreBtn,
                      {
                        backgroundColor: isDark ? '#0A0E1A' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
                      },
                    ]}
                    onPress={openScan}
                    activeOpacity={0.8}
                  >
                    <Plus color={accentColor} size={14} strokeWidth={2.4} />
                    <Text style={[styles.addMoreText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                      Yana taom qo‘shish
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* 1. Delete Confirmation Modal */}
      <CustomModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title="Taomni o‘chirish"
      >
        <View style={styles.modalContentBox}>
          <View style={[styles.modalWarningIconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.10)' }]}>
            <AlertTriangle color={isDark ? '#EF4444' : '#DC2626'} size={30} />
          </View>

          <Text style={[styles.modalWarningTitle, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
            Haqiqatan ham o‘chirmoqchimisiz?
          </Text>

          {itemToDelete && (
            <View
              style={[
                styles.modalFoodPreview,
                {
                  backgroundColor: isDark ? '#0A0E1A' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
                },
              ]}
            >
              <Text style={[styles.modalFoodName, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                {itemToDelete.name}
              </Text>
              <Text style={[styles.modalFoodWeight, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                {itemToDelete.weight} gramm
              </Text>
            </View>
          )}

          <Text style={[styles.modalWarningDesc, { color: isDark ? '#94A3B8' : currentTheme.textMuted }]}>
            Bu taom kundalikdan va kunlik kaloriya balansingizdan o‘chiriladi.
          </Text>

          <View style={styles.modalActionButtons}>
            <TouchableOpacity
              style={[
                styles.modalCancelBtn,
                {
                  backgroundColor: isDark ? '#0A0E1A' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
                },
              ]}
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                Bekor qilish
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalConfirmDeleteBtn,
                { backgroundColor: isDark ? '#EF4444' : '#DC2626' },
              ]}
              onPress={confirmDelete}
            >
              <Trash2 color="#FFFFFF" size={16} />
              <Text style={styles.modalConfirmDeleteText}>O‘chirish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomModal>

      {/* 2. Edit Portion Modal */}
      <CustomModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        title="Porsiyani o‘zgartirish"
      >
        <View style={styles.modalContentBox}>
          {itemToEdit && (
            <>
              <Text style={[styles.editFoodTitle, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                {itemToEdit.name}
              </Text>

              {/* Live Preview Calories Card */}
              <View
                style={[
                  styles.editCaloriePreviewBox,
                  {
                    backgroundColor: isDark ? '#0A0E1A' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
                  },
                ]}
              >
                <View style={styles.editFlameIconBox}>
                  <Flame color={isDark ? '#F59E0B' : '#D97706'} size={24} fill={isDark ? '#F59E0B' : '#D97706'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editPreviewKcal, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                    ~{previewCal} kcal
                  </Text>
                  <Text style={[styles.editPreviewMacros, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                    O: {previewProt}g · U: {previewCarb}g · Y: {previewFat}g
                  </Text>
                </View>
              </View>

              {/* Portion Stepper Controls */}
              <View style={styles.editStepperContainer}>
                <Text style={[styles.stepperTitle, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                  {strings.portionAmount}
                </Text>
                <View
                  style={[
                    styles.stepperRow,
                    {
                      backgroundColor: isDark ? '#0A0E1A' : '#F1F5F9',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.stepperChangeBtn,
                      {
                        backgroundColor: isDark ? '#121A2B' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
                      },
                    ]}
                    onPress={() => adjustEditWeight(-50)}
                  >
                    <Minus color={isDark ? '#F8FAFC' : currentTheme.text} size={18} strokeWidth={2.4} />
                  </TouchableOpacity>

                  <View style={styles.stepperValueBox}>
                    <TextInput
                      style={[styles.stepperInput, { color: isDark ? '#F8FAFC' : currentTheme.text }]}
                      keyboardType="numeric"
                      value={editWeight}
                      onChangeText={setEditWeight}
                    />
                    <Text style={[styles.stepperGramsLabel, { color: isDark ? '#64748B' : currentTheme.textMuted }]}>
                      {strings.grams}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.stepperChangeBtn,
                      {
                        backgroundColor: isDark ? '#121A2B' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
                      },
                    ]}
                    onPress={() => adjustEditWeight(50)}
                  >
                    <Plus color={isDark ? '#F8FAFC' : currentTheme.text} size={18} strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>

                {/* Quick Weight Chips */}
                <View style={styles.quickChipsRow}>
                  {[150, 250, 350, 450, 500].map((grams) => {
                    const isSelected = parseInt(editWeight, 10) === grams;
                    return (
                      <TouchableOpacity
                        key={grams}
                        style={[
                          styles.quickChip,
                          {
                            backgroundColor: isSelected
                              ? (isDark ? 'rgba(0, 229, 153, 0.16)' : 'rgba(5, 150, 105, 0.12)')
                              : (isDark ? '#0A0E1A' : '#F1F5F9'),
                            borderColor: isSelected
                              ? (isDark ? '#00E599' : '#059669')
                              : (isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border),
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setEditWeight(grams.toString());
                        }}
                      >
                        <Text
                          style={[
                            styles.quickChipText,
                            {
                              color: isSelected
                                ? (isDark ? '#00E599' : '#059669')
                                : (isDark ? '#94A3B8' : currentTheme.textSecondary),
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {grams}g
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalCancelBtn,
                    {
                      backgroundColor: isDark ? '#0A0E1A' : '#F1F5F9',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
                    },
                  ]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={[styles.modalCancelText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                    Bekor qilish
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalConfirmSaveBtn,
                    { backgroundColor: isDark ? '#00E599' : '#059669' },
                  ]}
                  onPress={confirmEdit}
                >
                  <Check color="#0A0E1A" size={16} strokeWidth={2.8} />
                  <Text style={[styles.modalConfirmSaveText, { color: '#0A0E1A' }]}>
                    Saqlash
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </CustomModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  dateSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  quickScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickScanText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calorieItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryBigVal: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 34,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  macroPillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  macroPillLabel: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  macroPillVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  macroTargetText: {
    fontSize: 9.5,
    fontWeight: '500',
    opacity: 0.7,
  },
  mealSectionCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  mealTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  mealIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIconEmoji: {
    fontSize: 18,
  },
  mealTitleText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  mealMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mealTimeRangeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mealCalorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  mealCalorieText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyMealPlaceholder: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyMealText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addFirstFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  addFirstFoodText: {
    fontSize: 12,
    fontWeight: '700',
  },
  foodItemsList: {
    marginTop: 12,
    gap: 8,
  },
  foodCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    gap: 10,
  },
  dishThumbnailBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dishImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  foodInfoCol: {
    flex: 1,
  },
  foodRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  dishSubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  foodRowWeightBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  foodMetaDot: {
    fontSize: 10,
    color: '#64748B',
  },
  foodRowSub: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  foodRowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  foodRowCalories: {
    fontSize: 13,
    fontWeight: '800',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  addMoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalContentBox: {
    alignItems: 'center',
    paddingTop: 4,
  },
  modalWarningIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalWarningTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalFoodPreview: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalFoodName: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalFoodWeight: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  modalWarningDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
    lineHeight: 17,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalConfirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  editFoodTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  editCaloriePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
    marginBottom: 16,
  },
  editFlameIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPreviewKcal: {
    fontSize: 17,
    fontWeight: '800',
  },
  editPreviewMacros: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  editStepperContainer: {
    width: '100%',
    marginBottom: 18,
  },
  stepperTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    marginBottom: 10,
  },
  stepperChangeBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepperValueBox: {
    alignItems: 'center',
  },
  stepperInput: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    minWidth: 70,
  },
  stepperGramsLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  quickChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
  },
  modalConfirmSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalConfirmSaveText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
