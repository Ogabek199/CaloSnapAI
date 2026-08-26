import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Camera,
  Flame,
  ChevronRight,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Utensils,
  Clock,
  Minus,
  AlertTriangle,
  Check,
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
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

const MEAL_CONFIGS: MealConfig[] = [
  {
    type: 'BREAKFAST',
    title: 'Nonushta',
    emoji: '🍳',
    timeRange: '07:00 – 10:00',
    accentDark: '#F59E0B',
    accentLight: '#D97706',
    badgeBgDark: 'rgba(245, 158, 11, 0.14)',
    badgeBgLight: 'rgba(217, 119, 6, 0.10)',
  },
  {
    type: 'LUNCH',
    title: 'Tushlik',
    emoji: '🍲',
    timeRange: '12:00 – 15:00',
    accentDark: '#00E599',
    accentLight: '#059669',
    badgeBgDark: 'rgba(0, 229, 153, 0.14)',
    badgeBgLight: 'rgba(5, 150, 105, 0.10)',
  },
  {
    type: 'DINNER',
    title: 'Kechki ovqat',
    emoji: '🥩',
    timeRange: '18:00 – 21:00',
    accentDark: '#818CF8',
    accentLight: '#4F46E5',
    badgeBgDark: 'rgba(129, 140, 248, 0.14)',
    badgeBgLight: 'rgba(79, 70, 229, 0.10)',
  },
  {
    type: 'SNACK',
    title: 'Qisqa tamaddi',
    emoji: '🥪',
    timeRange: 'Oraliq vaqtlar',
    accentDark: '#F472B6',
    accentLight: '#DB2777',
    badgeBgDark: 'rgba(244, 114, 182, 0.14)',
    badgeBgLight: 'rgba(219, 39, 119, 0.10)',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, theme, themeMode, user, isOnboardingCompleted } = useAppStore();
  const { todaySummary, calorieGoal, refreshDiary, removeDiaryItem, updateDiaryItem } = useDiaryStore();
  const { showToast } = useToastStore();

  const [refreshing, setRefreshing] = useState(false);

  // Custom Delete Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; weight: number } | null>(null);

  // Custom Edit Modal State
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
    if (!isOnboardingCompleted) {
      router.replace('/onboarding');
      return;
    }
    refreshDiary();
  }, [isOnboardingCompleted]);

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

  // Real nutritional data from state
  const total = todaySummary?.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goal = todaySummary?.goalCalories || calorieGoal || 2150;
  const consumed = Math.round(total.calories || 0);
  const remaining = Math.max(0, Math.round(goal - consumed));
  const progressPercent = goal > 0 ? Math.min(100, Math.max(0, (consumed / goal) * 100)) : 0;

  // Circular gauge calculations
  const size = 130;
  const strokeWidth = 9;
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  // Real Macro Targets & Percentages
  const proteinTarget = Math.max(1, Math.round((goal * 0.25) / 4));
  const carbsTarget = Math.max(1, Math.round((goal * 0.5) / 4));
  const fatTarget = Math.max(1, Math.round((goal * 0.25) / 9));

  const proteinPercent = total.protein > 0 ? Math.min(100, Math.max(8, (total.protein / proteinTarget) * 100)) : 0;
  const carbsPercent = total.carbs > 0 ? Math.min(100, Math.max(8, (total.carbs / carbsTarget) * 100)) : 0;
  const fatPercent = total.fat > 0 ? Math.min(100, Math.max(8, (total.fat / fatTarget) * 100)) : 0;

  const openScanForMeal = (mealType?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/scan');
  };

  // 1. Trigger Custom Delete Modal
  const promptDelete = (item: { id: string; food?: { nameUz?: string; name: string }; weightGrams: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItemToDelete({
      id: item.id,
      name: item.food?.nameUz || item.food?.name || 'Noma‘lum taom',
      weight: item.weightGrams,
    });
    setDeleteModalVisible(true);
  };

  // Confirm Delete Action
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await removeDiaryItem(itemToDelete.id);
    setDeleteModalVisible(false);
    setItemToDelete(null);
    showToast('Taom kundalikdan muvaffaqiyatli o‘chirildi', 'info');
  };

  // 2. Trigger Custom Edit Modal
  const promptEdit = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const calPer100 = item.food?.nutrition?.calories || Math.round((item.nutrition.calories / item.weightGrams) * 100) || 150;
    const protPer100 = item.food?.nutrition?.protein || Math.round((item.nutrition.protein / item.weightGrams) * 100) || 10;
    const carbPer100 = item.food?.nutrition?.carbs || Math.round((item.nutrition.carbs / item.weightGrams) * 100) || 20;
    const fatPer100 = item.food?.nutrition?.fat || Math.round((item.nutrition.fat / item.weightGrams) * 100) || 8;

    setItemToEdit({
      id: item.id,
      name: item.food?.nameUz || item.food?.name || 'Noma‘lum taom',
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

  // Confirm Edit Action
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

  // Calculated preview for Edit Modal
  const editGramsNumber = parseInt(editWeight, 10) || 0;
  const previewCal = itemToEdit ? Math.round((itemToEdit.caloriesPer100g * editGramsNumber) / 100) : 0;
  const previewProt = itemToEdit ? Math.round(((itemToEdit.proteinPer100g * editGramsNumber) / 100) * 10) / 10 : 0;
  const previewCarb = itemToEdit ? Math.round(((itemToEdit.carbsPer100g * editGramsNumber) / 100) * 10) / 10 : 0;
  const previewFat = itemToEdit ? Math.round(((itemToEdit.fatPer100g * editGramsNumber) / 100) * 10) / 10 : 0;

  const formattedDate = `${strings.today}, ${new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })}`;

  const renderMealCard = (config: MealConfig) => {
    const mealData = todaySummary?.meals?.find((m) => m.type === config.type);
    const mealCalories = Math.round(mealData?.totalNutrition?.calories || 0);
    const items = mealData?.items || [];
    const mealProtein = Math.round(mealData?.totalNutrition?.protein || 0);
    const mealCarbs = Math.round(mealData?.totalNutrition?.carbs || 0);
    const mealFat = Math.round(mealData?.totalNutrition?.fat || 0);
    const hasItems = items.length > 0;

    const accentColor = isDark ? config.accentDark : config.accentLight;
    const badgeBg = isDark ? config.badgeBgDark : config.badgeBgLight;

    return (
      <View
        key={config.type}
        style={[
          styles.mealCard,
          {
            backgroundColor: isDark ? '#121A2B' : currentTheme.card,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : currentTheme.border,
            shadowColor: isDark ? '#000000' : '#64748B',
            shadowOpacity: isDark ? 0.25 : 0.06,
          },
        ]}
      >
        {/* Top Header Row */}
        <View style={styles.mealCardHeaderRow}>
          <View style={styles.mealHeaderLeft}>
            {/* Glowing Icon Box */}
            <View
              style={[
                styles.mealIconBox,
                { backgroundColor: badgeBg, borderColor: accentColor },
              ]}
            >
              <Text style={styles.mealEmojiText}>{config.emoji}</Text>
            </View>

            {/* Meal Title & Time Subtitle */}
            <View style={styles.mealTitleBlock}>
              <Text style={[styles.mealTitleText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                {config.title}
              </Text>
              <View style={styles.mealMetaRow}>
                <Clock color={isDark ? '#64748B' : '#64748B'} size={11} />
                <Text style={[styles.mealTimeRangeText, { color: isDark ? '#64748B' : '#64748B' }]}>
                  {config.timeRange}
                </Text>
                <Text style={[styles.metaDot, { color: isDark ? '#64748B' : '#94A3B8' }]}>•</Text>
                <Text style={[styles.mealItemCountText, { color: hasItems ? accentColor : (isDark ? '#64748B' : '#94A3B8') }]}>
                  {hasItems ? `${items.length} ta taom` : 'Hali bo‘sh'}
                </Text>
              </View>
            </View>
          </View>

          {/* Calorie Badge on Top Right */}
          <View
            style={[
              styles.mealKcalPillBadge,
              {
                backgroundColor: hasItems ? badgeBg : (isDark ? '#0A0E1A' : '#F1F5F9'),
                borderColor: hasItems ? accentColor : (isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border),
              },
            ]}
          >
            {hasItems && <Flame color={accentColor} size={13} fill={accentColor} />}
            <Text
              style={[
                styles.mealKcalPillText,
                { color: hasItems ? accentColor : (isDark ? '#64748B' : '#64748B') },
              ]}
            >
              {mealCalories} kcal
            </Text>
          </View>
        </View>

        {/* Nutritional Summary Bar (Protein, Carbs, Fat) */}
        {hasItems && (
          <View
            style={[
              styles.mealMacroPillsRow,
              { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.05)' : currentTheme.border },
            ]}
          >
            <View
              style={[
                styles.macroPill,
                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.14)' : 'rgba(37, 99, 235, 0.08)' },
              ]}
            >
              <View style={[styles.macroPillDot, { backgroundColor: isDark ? '#3B82F6' : '#2563EB' }]} />
              <Text style={[styles.macroPillText, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
                Oqsil: {mealProtein}g
              </Text>
            </View>

            <View
              style={[
                styles.macroPill,
                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(217, 119, 6, 0.08)' },
              ]}
            >
              <View style={[styles.macroPillDot, { backgroundColor: isDark ? '#F59E0B' : '#D97706' }]} />
              <Text style={[styles.macroPillText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                Uglevod: {mealCarbs}g
              </Text>
            </View>

            <View
              style={[
                styles.macroPill,
                { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.14)' : 'rgba(220, 38, 38, 0.08)' },
              ]}
            >
              <View style={[styles.macroPillDot, { backgroundColor: isDark ? '#EF4444' : '#DC2626' }]} />
              <Text style={[styles.macroPillText, { color: isDark ? '#F87171' : '#B91C1C' }]}>
                Yog‘: {mealFat}g
              </Text>
            </View>
          </View>
        )}

        {/* Logged Dishes List */}
        {hasItems ? (
          <View style={styles.dishesListContainer}>
            {items.map((item) => {
              const dishName = item.food?.nameUz || item.food?.name || 'Noma‘lum taom';
              const dishCalories = Math.round(item.nutrition?.calories || 0);
              const dishProtein = Math.round(item.nutrition?.protein || 0);
              const dishCarbs = Math.round(item.nutrition?.carbs || 0);
              const dishFat = Math.round(item.nutrition?.fat || 0);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.dishCardItem,
                    {
                      backgroundColor: isDark ? '#0A0E1A' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : currentTheme.border,
                    },
                  ]}
                >
                  {/* Dish Thumbnail / Avatar */}
                  <View
                    style={[
                      styles.dishThumbnailBox,
                      { backgroundColor: isDark ? '#121A2B' : '#EDF2F7' },
                    ]}
                  >
                    {item.food?.imageUrl ? (
                      <Image source={{ uri: item.food.imageUrl }} style={styles.dishImage} />
                    ) : (
                      <Utensils color={accentColor} size={18} />
                    )}
                  </View>

                  {/* Dish Info */}
                  <View style={styles.dishInfoBlock}>
                    <Text
                      numberOfLines={1}
                      style={[styles.dishNameText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}
                    >
                      {dishName}
                    </Text>
                    <View style={styles.dishSubRow}>
                      <Text style={[styles.dishWeightText, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                        {item.weightGrams}g
                      </Text>
                      <Text style={[styles.dishSubDot, { color: isDark ? '#64748B' : '#94A3B8' }]}>•</Text>
                      <Text style={[styles.dishMacroMiniText, { color: isDark ? '#64748B' : currentTheme.textMuted }]}>
                        O: {dishProtein}g · U: {dishCarbs}g · Y: {dishFat}g
                      </Text>
                    </View>
                  </View>

                  {/* Dish Calories & Custom Action Buttons */}
                  <View style={styles.dishRightSide}>
                    <Text style={[styles.dishKcalText, { color: accentColor }]}>
                      {dishCalories} kcal
                    </Text>
                    <View style={styles.dishActionButtonsRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                          styles.dishActionIconBtn,
                          {
                            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.14)' : 'rgba(37, 99, 235, 0.08)',
                          },
                        ]}
                        onPress={() => promptEdit(item)}
                      >
                        <Edit3 color={isDark ? '#60A5FA' : '#2563EB'} size={13} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                          styles.dishActionIconBtn,
                          {
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.14)' : 'rgba(220, 38, 38, 0.08)',
                          },
                        ]}
                        onPress={() => promptDelete(item)}
                      >
                        <Trash2 color={isDark ? '#EF4444' : '#DC2626'} size={13} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          /* Empty Meal State */
          <View
            style={[
              styles.emptyMealBox,
              {
                backgroundColor: isDark ? 'rgba(10, 14, 26, 0.5)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : currentTheme.border,
              },
            ]}
          >
            <Text style={[styles.emptyMealText, { color: isDark ? '#64748B' : '#64748B' }]}>
              Ushbu vaqt uchun hali taom kiritilmagan
            </Text>
          </View>
        )}

        {/* Action Button: Add Food */}
        <TouchableOpacity
          activeOpacity={0.82}
          style={[
            styles.addMealButton,
            {
              backgroundColor: isDark ? '#0A0E1A' : '#F8FAFC',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
            },
          ]}
          onPress={() => openScanForMeal(config.type)}
        >
          <View style={styles.addMealButtonContent}>
            <View style={[styles.addPlusCircle, { backgroundColor: badgeBg }]}>
              <Plus color={accentColor} size={15} strokeWidth={2.6} />
            </View>
            <Text style={[styles.addMealButtonText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
              Taom qo‘shish
            </Text>
            <Camera color={isDark ? '#64748B' : '#64748B'} size={15} style={{ marginLeft: 'auto' }} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0A0E1A' : currentTheme.background }]}>
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
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greetingLine1, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
              {strings.greeting}
            </Text>
            <Text style={[styles.greetingLine2, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
              {user.name ? `${user.name.split(' ')[0]}!` : 'Foydalanuvchi!'}
            </Text>
            <Text style={[styles.dateText, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
              {formattedDate}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.avatarBadge,
              {
                backgroundColor: isDark ? '#121A2B' : currentTheme.card,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : currentTheme.border,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/profile')}
          >
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarMiniImg} />
            ) : (
              <Text style={{ fontSize: 20 }}>👤</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Real Dynamic Calorie Card with Circular Gauge & 3-Column Macro Bars */}
        <View
          style={[
            styles.calorieCard,
            {
              backgroundColor: isDark ? '#121A2B' : currentTheme.card,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : currentTheme.border,
              shadowColor: isDark ? '#000000' : '#64748B',
              shadowOpacity: isDark ? 0.25 : 0.06,
            },
          ]}
        >
          {/* Card Header */}
          <View style={styles.calorieHeader}>
            <View style={styles.flameIconBox}>
              <Flame color="#F59E0B" size={18} fill="#F59E0B" />
            </View>
            <Text style={[styles.calorieTitle, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
              {strings.calorieBalance}
            </Text>
          </View>

          {/* Gauge Center & Stats */}
          <View style={styles.gaugeRow}>
            {/* Left Box: Consumed */}
            <View style={styles.gaugeSideBoxLeft}>
              <Text style={[styles.gaugeSideLabel, { color: isDark ? '#94A3B8' : currentTheme.textMuted }]}>
                {strings.consumed}
              </Text>
              <Text style={[styles.gaugeSideValue, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                {consumed}
              </Text>
            </View>

            {/* Center Gauge with SVG Ring */}
            <View style={styles.gaugeCenterWrapper}>
              <Svg width={size} height={size}>
                <Defs>
                  <SvgGradient id="mainGaugeGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={isDark ? '#00E599' : '#10B981'} />
                    <Stop offset="100%" stopColor="#059669" />
                  </SvgGradient>
                </Defs>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={isDark ? '#1A2338' : '#E2E8F0'}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="url(#mainGaugeGrad)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  transform={`rotate(-90 ${center} ${center})`}
                />
              </Svg>

              <View style={styles.gaugeInnerContent}>
                <Text style={[styles.gaugeBigNumber, { color: isDark ? '#FFFFFF' : currentTheme.text }]}>
                  {goal}
                </Text>
                <Text style={[styles.gaugeKcalText, { color: isDark ? '#00E599' : '#059669' }]}>
                  kcal
                </Text>
              </View>
            </View>

            {/* Right Box: Remaining */}
            <View style={styles.gaugeSideBoxRight}>
              <Text style={[styles.gaugeSideLabelRight, { color: isDark ? '#94A3B8' : currentTheme.textMuted }]}>
                {strings.remaining}
              </Text>
              <Text style={[styles.gaugeSideValueRight, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                {remaining}
              </Text>
            </View>
          </View>

          {/* 3 Real Macro Cards with Vertical Progress Fills */}
          <View style={styles.macroCardsRow}>
            {/* Oqsil (Protein) */}
            <View
              style={[
                styles.macroCardItem,
                {
                  backgroundColor: isDark ? '#0A0E1A' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : currentTheme.border,
                },
              ]}
            >
              <View style={[styles.macroLiquidFill, { height: `${proteinPercent}%` }]}>
                <LinearGradient
                  colors={isDark ? ['#1E3A8A', '#2563EB'] : ['rgba(59, 130, 246, 0.12)', 'rgba(59, 130, 246, 0.26)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.macroTopLine, { backgroundColor: isDark ? '#60A5FA' : '#3B82F6' }]} />
              </View>
              <Text style={[styles.macroTopTitle, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                {strings.protein}
              </Text>
              <View style={styles.macroBottomLabels}>
                <Text style={[styles.macroGramText, { color: isDark ? '#FFFFFF' : currentTheme.text }]}>
                  {Math.round(total.protein * 10) / 10}g
                </Text>
                <Text style={[styles.macroSubText, { color: isDark ? '#94A3B8' : currentTheme.textMuted }]}>
                  {strings.protein}
                </Text>
              </View>
            </View>

            {/* Uglevod (Carbs) */}
            <View
              style={[
                styles.macroCardItem,
                {
                  backgroundColor: isDark ? '#0A0E1A' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : currentTheme.border,
                },
              ]}
            >
              <View style={[styles.macroLiquidFill, { height: `${carbsPercent}%` }]}>
                <LinearGradient
                  colors={isDark ? ['#78350F', '#D97706'] : ['rgba(245, 158, 11, 0.12)', 'rgba(245, 158, 11, 0.26)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.macroTopLine, { backgroundColor: isDark ? '#FBBF24' : '#D97706' }]} />
              </View>
              <Text style={[styles.macroTopTitle, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                {strings.carbs}
              </Text>
              <View style={styles.macroBottomLabels}>
                <Text style={[styles.macroGramText, { color: isDark ? '#FFFFFF' : currentTheme.text }]}>
                  {Math.round(total.carbs * 10) / 10}g
                </Text>
                <Text style={[styles.macroSubText, { color: isDark ? '#94A3B8' : currentTheme.textMuted }]}>
                  {strings.carbs}
                </Text>
              </View>
            </View>

            {/* Yog' (Fat) */}
            <View
              style={[
                styles.macroCardItem,
                {
                  backgroundColor: isDark ? '#0A0E1A' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : currentTheme.border,
                },
              ]}
            >
              <View style={[styles.macroLiquidFill, { height: `${fatPercent}%` }]}>
                <LinearGradient
                  colors={isDark ? ['#7F1D1D', '#DC2626'] : ['rgba(239, 68, 68, 0.12)', 'rgba(239, 68, 68, 0.26)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.macroTopLine, { backgroundColor: isDark ? '#F87171' : '#DC2626' }]} />
              </View>
              <Text style={[styles.macroTopTitle, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                {strings.fat}
              </Text>
              <View style={styles.macroBottomLabels}>
                <Text style={[styles.macroGramText, { color: isDark ? '#FFFFFF' : currentTheme.text }]}>
                  {Math.round(total.fat * 10) / 10}g
                </Text>
                <Text style={[styles.macroSubText, { color: isDark ? '#94A3B8' : currentTheme.textMuted }]}>
                  {strings.fat}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Aqlli Skaner Feature Banner */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => openScanForMeal()}
          style={[styles.scanBannerContainer, { shadowColor: isDark ? '#00E599' : '#059669' }]}
        >
          <LinearGradient
            colors={['#059669', '#00E599']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scanBannerGradient}
          >
            <View style={styles.scanIconBox}>
              <Camera color="#0A0E1A" size={22} strokeWidth={2.4} />
            </View>
            <View style={styles.scanBannerTextContent}>
              <View style={styles.scanTagRow}>
                <Sparkles color="#0A0E1A" size={11} />
                <Text style={styles.scanTagText}>AI Vision Engine</Text>
              </View>
              <Text style={styles.scanBannerTitle}>{strings.scanFood}</Text>
              <Text style={styles.scanBannerDesc}>{strings.scanFoodDesc}</Text>
            </View>
            <ChevronRight color="#0A0E1A" size={22} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Bugungi taomlar Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
              {strings.todaysMeals}
            </Text>
            <View
              style={[
                styles.sectionBadge,
                {
                  backgroundColor: isDark ? 'rgba(0, 229, 153, 0.12)' : 'rgba(16, 185, 129, 0.10)',
                  borderColor: isDark ? 'rgba(0, 229, 153, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                },
              ]}
            >
              <Text style={[styles.sectionBadgeText, { color: isDark ? '#00E599' : '#059669' }]}>
                4 ta vaqt
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/(tabs)/diary')}
          >
            <Text style={[styles.seeAllText, { color: isDark ? '#00E599' : '#059669' }]}>
              {strings.seeAll}
            </Text>
            <ChevronRight color={isDark ? '#00E599' : '#059669'} size={14} />
          </TouchableOpacity>
        </View>

        {/* 4 Meals: Nonushta, Tushlik, Kechki ovqat, Tamaddi */}
        <View style={styles.mealsStackContainer}>
          {MEAL_CONFIGS.map(renderMealCard)}
        </View>
      </ScrollView>

      {/* 1. Custom Delete Confirmation Modal */}
      <CustomModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title="Taomni o‘chirish"
      >
        <View style={styles.modalContentBox}>
          <View
            style={[
              styles.modalWarningIconBox,
              { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.10)' },
            ]}
          >
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
            Bu taom bugungi kundalik va kaloriya hisobingizdan o‘chiriladi.
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

      {/* 2. Custom Edit Portion Modal */}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  greetingLine1: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greetingLine2: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: -2,
  },
  dateText: {
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  avatarMiniImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  calorieCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flameIconBox: {
    marginRight: 6,
  },
  calorieTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  gaugeSideBoxLeft: {
    alignItems: 'flex-start',
    width: 70,
  },
  gaugeSideLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  gaugeSideValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  gaugeCenterWrapper: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeInnerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeBigNumber: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  gaugeKcalText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
  },
  gaugeSideBoxRight: {
    alignItems: 'flex-end',
    width: 70,
  },
  gaugeSideLabelRight: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 2,
  },
  gaugeSideValueRight: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  macroCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  macroCardItem: {
    flex: 1,
    height: 116,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    position: 'relative',
  },
  macroLiquidFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  macroTopLine: {
    height: 2,
    width: '100%',
  },
  macroTopTitle: {
    fontSize: 11,
    fontWeight: '600',
    zIndex: 2,
  },
  macroBottomLabels: {
    alignItems: 'center',
    zIndex: 2,
  },
  macroGramText: {
    fontSize: 13,
    fontWeight: '700',
  },
  macroSubText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  scanBannerContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 22,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  scanBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  scanIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scanBannerTextContent: {
    flex: 1,
  },
  scanTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  scanTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0A0E1A',
  },
  scanBannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0A0E1A',
  },
  scanBannerDesc: {
    fontSize: 11,
    color: 'rgba(10, 14, 26, 0.85)',
    marginTop: 1,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mealsStackContainer: {
    gap: 14,
  },
  mealCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  mealCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  mealIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealEmojiText: {
    fontSize: 20,
  },
  mealTitleBlock: {
    flex: 1,
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
    marginTop: 3,
  },
  mealTimeRangeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 10,
  },
  mealItemCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mealKcalPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  mealKcalPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  mealMacroPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  macroPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dishesListContainer: {
    marginTop: 12,
    gap: 8,
  },
  dishCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    gap: 10,
  },
  dishThumbnailBox: {
    width: 40,
    height: 40,
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
  dishInfoBlock: {
    flex: 1,
  },
  dishNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dishSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dishWeightText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dishSubDot: {
    fontSize: 10,
  },
  dishMacroMiniText: {
    fontSize: 10,
    fontWeight: '500',
  },
  dishRightSide: {
    alignItems: 'flex-end',
    gap: 4,
  },
  dishKcalText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dishActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dishActionIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMealBox: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyMealText: {
    fontSize: 11,
    fontWeight: '500',
  },
  addMealButton: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  addMealButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  addPlusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMealButtonText: {
    fontSize: 13,
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
