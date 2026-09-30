import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Flame,
  Check,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Utensils,
  Trash2,
  PlusCircle,
  PartyPopper,
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, usePalette, useStrings } from '../../src/store/useAppStore';
import { foodName } from '../../src/shared/i18n/languages';
import type { Language } from '../../src/shared/i18n/translations';
import { ApiClient } from '../../src/shared/api/api-client';
import { useScanStore } from '../../src/store/useScanStore';
import { HealthCheckCard } from '../../src/features/assistant/HealthCheckCard';
import { useDiaryStore } from '../../src/store/useDiaryStore';
import { useFeastStore } from '../../src/store/useFeastStore';
import { useToastStore } from '../../src/store/useToastStore';
import { CustomModal } from '../../src/shared/ui/CustomModal';
import { FontSize, Radius, Spacing, softShadow } from '../../src/shared/theme/spacing';

const QUICK_SIDE_DISHES = [
  {
    name: 'Tandir non',
    nameUz: 'Tandir non',
    nameRu: 'Тандырная лепешка',
    nameEn: 'Tandoor bread',
    names: { tr: 'Tandır ekmeği', kk: 'Тандыр нан', ko: '탄디르 빵', es: 'Pan de tandir', de: 'Tandir-Brot', fr: 'Pain tandir' },
    grams: 50,
    calories: 130,
    protein: 4,
    carbs: 25,
    fat: 0.8,
    emoji: '🥖',
  },
  {
    name: 'Achichuk salat',
    nameUz: 'Achichuk salat',
    nameRu: 'Салат Ачичук',
    nameEn: 'Tomato & onion salad',
    names: { tr: 'Domates soğan salatası', kk: 'Қызанақ-пияз салаты', ko: '토마토 양파 샐러드', es: 'Ensalada de tomate y cebolla', de: 'Tomaten-Zwiebel-Salat', fr: 'Salade tomates-oignons' },
    grams: 120,
    calories: 42,
    protein: 1.2,
    carbs: 4.8,
    fat: 2.1,
    emoji: '🥗',
  },
  {
    name: 'Ko‘k choy',
    nameUz: 'Ko‘k choy',
    nameRu: 'Зеленый чай',
    nameEn: 'Green tea',
    names: { tr: 'Yeşil çay', kk: 'Көк шай', ko: '녹차', es: 'Té verde', de: 'Grüner Tee', fr: 'Thé vert' },
    grams: 250,
    calories: 2,
    protein: 0,
    carbs: 0.5,
    fat: 0,
    emoji: '🫖',
  },
  {
    name: 'Coca-Cola',
    nameUz: 'Coca-Cola',
    nameRu: 'Кока-кола',
    nameEn: 'Coca-Cola',
    names: {} as Partial<Record<Language, string>>,
    grams: 330,
    calories: 140,
    protein: 0,
    carbs: 35,
    fat: 0,
    emoji: '🥤',
  },
  {
    name: 'Go‘shtli Somsa',
    nameUz: 'Go‘shtli Somsa',
    nameRu: 'Самса с мясом',
    nameEn: 'Meat Samosa',
    names: { tr: 'Etli samsa', kk: 'Етті самса', ko: '고기 삼사', es: 'Samsa de carne', de: 'Samsa mit Fleisch', fr: 'Samsa à la viande' },
    grams: 130,
    calories: 360,
    protein: 14,
    carbs: 28,
    fat: 22,
    emoji: '🥟',
  },
  {
    name: 'Qatiq / Ayron',
    nameUz: 'Qatiq / Ayron',
    nameRu: 'Айран / Кефир',
    nameEn: 'Kefir / Ayran',
    names: { tr: 'Ayran / Kefir', kk: 'Айран / Кефир', ko: '아이란 / 케피르', es: 'Ayran / Kéfir', de: 'Ayran / Kefir', fr: 'Ayran / Kéfir' },
    grams: 200,
    calories: 80,
    protein: 6.2,
    carbs: 8.4,
    fat: 3.2,
    emoji: '🥛',
  },
];

const isLocalFoodId = (id?: string) => !id || id.startsWith('quick-') || id.startsWith('custom-');
const normalizeName = (s?: string) => (s || '').trim().toLowerCase();

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeMode = useAppStore((s) => s.themeMode);
  const language = useAppStore((s) => s.language);
  const scanResult = useScanStore((s) => s.scanResult);
  const updateItemWeight = useScanStore((s) => s.updateItemWeight);
  const selectedItemIndex = useScanStore((s) => s.selectedItemIndex);
  const setSelectedItemIndex = useScanStore((s) => s.setSelectedItemIndex);
  const scanMode = useScanStore((s) => s.scanMode);
  const removeItem = useScanStore((s) => s.removeItem);
  const addItem = useScanStore((s) => s.addItem);
  const addScanToDiary = useDiaryStore((s) => s.addScanToDiary);
  const openFeastModal = useFeastStore((s) => s.openModal);
  const showToast = useToastStore((s) => s.showToast);

  const c = usePalette();
  const strings = useStrings();
  const dark = themeMode === 'dark';
  const savingRef = useRef(false);

  const localizedName = (food: Parameters<typeof foodName>[0]) => foodName(food, language);

  const [selectedMealType, setSelectedMealType] = useState<
    'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
  >('LUNCH');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customDishName, setCustomDishName] = useState('');
  const [customDishCalories, setCustomDishCalories] = useState('');
  const [customDishGrams, setCustomDishGrams] = useState('150');

  const items = scanResult?.items || [];
  const isMultiDish = items.length > 1 || scanMode === 'table';

  const totalNutrition = scanResult?.totalNutrition || {
    calories: items.reduce((acc, i) => acc + (i.nutrition?.calories || 0), 0),
    protein: items.reduce((acc, i) => acc + (i.nutrition?.protein || 0), 0),
    carbs: items.reduce((acc, i) => acc + (i.nutrition?.carbs || 0), 0),
    fat: items.reduce((acc, i) => acc + (i.nutrition?.fat || 0), 0),
    fiber: items.reduce((acc, i) => acc + (i.nutrition?.fiber || 0), 0),
  };

  const currentItem = items[selectedItemIndex] || items[0];

  if (!items || items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.emptyBox}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>
            {strings.scanResultNotFound}
          </Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: c.card }]}
            onPress={() => router.dismissTo('/(tabs)')}
          >
            <Text style={{ color: c.primary, fontWeight: '700' }}>{strings.backToHome}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleWeightChange = (index: number, delta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    const currentWeight = items[index]?.weightGrams || 100;
    const newWeight = Math.max(25, currentWeight + delta);
    updateItemWeight(index, newWeight);
  };

  const handlePresetWeight = (index: number, grams: number) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    updateItemWeight(index, grams);
  };

  const handleRemoveItem = (index: number) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
    removeItem(index);
    showToast(strings.itemRemovedFromList, 'info');
  };

  const handleAddQuickDish = (item: (typeof QUICK_SIDE_DISHES)[0]) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    const per100gFactor = 100 / item.grams;
    addItem(
      {
        id: `quick-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: item.name,
        nameUz: item.nameUz,
        nameRu: item.nameRu,
        nameEn: item.nameEn,
        names: item.names,
        category: 'OTHER',
        nutrition: {
          calories: Math.round(item.calories * per100gFactor),
          protein: Math.round(item.protein * per100gFactor * 10) / 10,
          carbs: Math.round(item.carbs * per100gFactor * 10) / 10,
          fat: Math.round(item.fat * per100gFactor * 10) / 10,
        },
      } as any,
      item.grams,
    );

    setIsAddModalOpen(false);
    showToast(`${localizedName(item)} ✓`, 'success');
  };

  const handleAddCustomDish = () => {
    if (!customDishName.trim()) {
      showToast(strings.enterDishName, 'warning');
      return;
    }

    const grams = parseInt(customDishGrams, 10);
    const cal = parseInt(customDishCalories, 10);
    if (!(grams > 0 && grams <= 5000) || !(cal >= 0)) {
      showToast(strings.enterValidGramsKcal, 'warning');
      return;
    }
    const per100gFactor = 100 / grams;

    addItem(
      {
        id: `custom-${Date.now()}`,
        name: customDishName.trim(),
        nameUz: customDishName.trim(),
        nameRu: customDishName.trim(),
        nameEn: customDishName.trim(),
        category: 'OTHER',
        nutrition: {
          calories: Math.round(cal * per100gFactor),
          protein: 5,
          carbs: 15,
          fat: 4,
        },
      } as any,
      grams,
    );

    setCustomDishName('');
    setCustomDishCalories('');
    setCustomDishGrams('150');
    setIsAddModalOpen(false);
    showToast(`${customDishName.trim()} ✓`, 'success');
  };

  // The diary API only accepts foods that exist on the server, so locally added
  // dishes are matched to catalog foods before anything is written.
  const resolveServerItems = async () => {
    const resolved: typeof items = [];
    for (const item of items) {
      if (!isLocalFoodId(item.food?.id)) {
        resolved.push(item);
        continue;
      }
      const candidates = [item.food.nameUz, item.food.name, item.food.nameRu, item.food.nameEn]
        .map(normalizeName)
        .filter(Boolean);
      const matches = await ApiClient.searchFoods(item.food.nameUz || item.food.name);
      const match = matches.find((f) =>
        [f.nameUz, f.name, f.nameRu, f.nameEn].some((n) => candidates.includes(normalizeName(n))),
      );
      if (!match) return { resolved: null, missing: localizedName(item.food) };
      resolved.push({ ...item, food: match, foodId: match.id } as (typeof items)[number]);
    }
    return { resolved, missing: null };
  };

  const handleSaveToDiary = async () => {
    if (savingRef.current || isSaved) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}

      const { resolved, missing } = await resolveServerItems();
      if (!resolved) {
        showToast(`${missing}: ${strings.barcodeNotFound}`, 'warning');
        return;
      }

      await addScanToDiary(selectedMealType, resolved, scanResult?.id);
      setIsSaved(true);
      showToast(
        isMultiDish ? `${strings.addedSuccess} (${resolved.length})` : strings.addedSuccess,
        'success',
      );
      setTimeout(() => {
        router.dismissTo('/(tabs)/diary');
      }, 450);
    } catch (err: any) {
      showToast(err?.message || strings.saveFailed, 'error');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const openEdit = (index: number) => {
    setSelectedItemIndex(Math.min(Math.max(0, index), items.length - 1));
    router.push('/scan/edit');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.topHeader, { borderBottomColor: c.border }]}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft color={c.text} size={22} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.text }]}>
            {isMultiDish ? strings.tableMode : strings.scanResult}
          </Text>
          {isMultiDish && (
            <Text style={[styles.headerSub, { color: '#10B981' }]}>
              🍱 {items.length} {strings.detectedItemsCount}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => openEdit(selectedItemIndex)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <RotateCcw color={c.primary} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Table / Multi-Dish Summary Hero Card */}
        {isMultiDish && (
          <View
            style={[
              styles.tableSummaryCard,
              {
                backgroundColor: dark ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5',
                borderColor: '#10B981',
              },
            ]}
          >
            <View style={styles.tableSummaryTop}>
              <View style={styles.tableBadge}>
                <Sparkles size={14} color="#10B981" />
                <Text style={styles.tableBadgeText}>
                  {strings.totalTableCalories}
                </Text>
              </View>
              <View style={styles.dishesCountPill}>
                <Text style={styles.dishesCountText}>{strings.itemsCount.replace('{n}', String(items.length))}</Text>
              </View>
            </View>

            <View style={styles.tableCaloriesRow}>
              <View style={[styles.flameCircle, { backgroundColor: 'rgba(16, 185, 129, 0.16)' }]}>
                <Flame color="#10B981" size={26} />
              </View>
              <View>
                <Text style={[styles.tableTotalKcal, { color: c.text }]}>
                  ~{Math.round(totalNutrition.calories)}
                </Text>
                <Text style={[styles.tableKcalLabel, { color: c.textMuted }]}>
                  {strings.totalEnergyLabel}
                </Text>
              </View>
            </View>

            {/* Total Macros Bars */}
            <View style={styles.tableMacrosRow}>
              <View style={[styles.tableMacroItem, { backgroundColor: dark ? c.card : '#FFFFFF' }]}>
                <Text style={[styles.macroItemLabel, { color: c.textMuted }]}>{strings.protein}</Text>
                <Text style={[styles.macroItemVal, { color: c.protein }]}>
                  {Math.round(totalNutrition.protein)}g
                </Text>
              </View>

              <View style={[styles.tableMacroItem, { backgroundColor: dark ? c.card : '#FFFFFF' }]}>
                <Text style={[styles.macroItemLabel, { color: c.textMuted }]}>{strings.carbs}</Text>
                <Text style={[styles.macroItemVal, { color: c.carbs }]}>
                  {Math.round(totalNutrition.carbs)}g
                </Text>
              </View>

              <View style={[styles.tableMacroItem, { backgroundColor: dark ? c.card : '#FFFFFF' }]}>
                <Text style={[styles.macroItemLabel, { color: c.textMuted }]}>{strings.fat}</Text>
                <Text style={[styles.macroItemVal, { color: c.fat }]}>
                  {Math.round(totalNutrition.fat)}g
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Section Title */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            {isMultiDish ? strings.tableDishesList : strings.detectedDish}
          </Text>
          {isMultiDish && (
            <TouchableOpacity
              style={styles.addMoreBtnSmall}
              onPress={() => setIsAddModalOpen(true)}
              activeOpacity={0.7}
            >
              <Plus size={14} color={c.primary} />
              <Text style={[styles.addMoreBtnSmallText, { color: c.primary }]}>
                {strings.addMoreDish}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dishes List (Cards) */}
        {items.map((item, idx) => {
          const foodTitle = localizedName(item.food);
          const isSelected = selectedItemIndex === idx;

          return (
            <View
              key={`${item.food?.id ?? 'item'}-${idx}`}
              style={[
                styles.dishCard,
                {
                  backgroundColor: c.card,
                  borderColor: isSelected && !isMultiDish ? c.primary : c.border,
                },
              ]}
            >
              {/* Dish Header */}
              <View style={styles.dishCardHeader}>
                <View style={styles.dishTitleArea}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.confidenceBadge, { backgroundColor: c.primaryBg }]}>
                      <Sparkles color={c.primary} size={11} />
                      <Text style={[styles.confidenceText, { color: c.primary }]}>
                        {Math.round((item.confidence || 0.9) * 100)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.dishName, { color: c.text }]}>{foodTitle}</Text>
                </View>

                {/* Remove item button (if multi-dish) or change button */}
                {isMultiDish ? (
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: dark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2' }]}
                    onPress={() => handleRemoveItem(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.changeFoodBtn, { backgroundColor: c.cardHover, borderColor: c.border }]}
                    onPress={() => openEdit(idx)}
                  >
                    <Utensils color={c.primary} size={13} />
                    <Text style={[styles.changeFoodText, { color: c.primary }]}>{strings.changeFood}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Dish Calories & Weight Stepper */}
              <View style={[styles.dishMetricsRow, { backgroundColor: c.cardHover, borderColor: c.border }]}>
                <View>
                  <Text style={[styles.dishCalorieText, { color: c.text }]}>
                    ~{Math.round(item.nutrition.calories)} <Text style={styles.kcalSmall}>kcal</Text>
                  </Text>
                  <Text style={[styles.dishMacrosPreview, { color: c.textMuted }]}>
                    {strings.protein} {Math.round(item.nutrition.protein)}g · {strings.carbs}{' '}
                    {Math.round(item.nutrition.carbs)}g · {strings.fat} {Math.round(item.nutrition.fat)}g
                  </Text>
                </View>

                {/* Inline Weight Stepper */}
                <View style={[styles.weightStepper, { backgroundColor: c.card, borderColor: c.border }]}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleWeightChange(idx, -25)}
                    activeOpacity={0.7}
                  >
                    <Minus size={15} color={c.text} />
                  </TouchableOpacity>

                  <View style={styles.weightNumBox}>
                    <Text style={[styles.weightNumText, { color: c.text }]}>{item.weightGrams}</Text>
                    <Text style={[styles.weightUnitText, { color: c.textMuted }]}>g</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleWeightChange(idx, 25)}
                    activeOpacity={0.7}
                  >
                    <Plus size={15} color={c.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Weight Chips */}
              <View style={styles.quickChipsRow}>
                {[50, 100, 200, 350].map((grams) => (
                  <TouchableOpacity
                    key={grams}
                    style={[
                      styles.quickChip,
                      {
                        backgroundColor: item.weightGrams === grams ? c.primaryBg : c.cardHover,
                        borderColor: item.weightGrams === grams ? c.primary : c.border,
                      },
                    ]}
                    onPress={() => handlePresetWeight(idx, grams)}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        {
                          color: item.weightGrams === grams ? c.primary : c.textMuted,
                          fontWeight: item.weightGrams === grams ? '700' : '500',
                        },
                      ]}
                    >
                      {grams}g
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* Append more items button */}
        {isMultiDish && (
          <TouchableOpacity
            style={[styles.addDishLargeBtn, { borderColor: c.border, backgroundColor: c.card }]}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.8}
          >
            <PlusCircle size={20} color={c.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.addDishLargeBtnText, { color: c.primary }]}>
              {strings.addMoreDish}
            </Text>
          </TouchableOpacity>
        )}

        <HealthCheckCard
          items={items.map((i) => ({
            name: localizedName(i.food),
            weightGrams: i.weightGrams || 0,
            calories: i.nutrition?.calories || 0,
            protein: i.nutrition?.protein || 0,
            carbs: i.nutrition?.carbs || 0,
            fat: i.nutrition?.fat || 0,
            fiber: i.nutrition?.fiber || 0,
          }))}
        />

        {/* Meal Type Selection */}
        <View style={styles.mealTypeSection}>
          <Text style={[styles.mealTypeTitle, { color: c.text }]}>{strings.whichMeal}</Text>
          <View style={styles.mealButtonsRow}>
            {[
              { type: 'BREAKFAST', label: strings.breakfast },
              { type: 'LUNCH', label: strings.lunch },
              { type: 'DINNER', label: strings.dinner },
              { type: 'SNACK', label: strings.snack },
            ].map((meal) => (
              <TouchableOpacity
                key={meal.type}
                style={[
                  styles.mealSelectBtn,
                  { backgroundColor: c.card, borderColor: c.border },
                  selectedMealType === meal.type && {
                    backgroundColor: c.primaryBg,
                    borderColor: c.primary,
                  },
                ]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch (e) {}
                  setSelectedMealType(meal.type as any);
                }}
              >
                <Text
                  style={[
                    styles.mealSelectText,
                    { color: c.textSecondary },
                    selectedMealType === meal.type && {
                      color: c.primary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {meal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feast Balancer Prompt if high calories */}
        {totalNutrition.calories > 700 && (
          <TouchableOpacity
            style={[
              styles.feastPromptBtn,
              {
                backgroundColor: dark ? 'rgba(255,149,0,0.12)' : '#FFF8EE',
                borderColor: dark ? 'rgba(255,149,0,0.3)' : '#FFE3BD',
              },
            ]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
              openFeastModal(Math.max(500, Math.round(totalNutrition.calories * 0.7)));
            }}
            activeOpacity={0.8}
          >
            <PartyPopper size={18} color="#FF9500" style={{ marginRight: 8 }} />
            <Text style={[styles.feastPromptText, { color: dark ? '#FFB340' : '#D97706' }]}>
              {strings.feastScanPrompt}
            </Text>
          </TouchableOpacity>
        )}

        {/* Save to Diary Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: c.primary },
            isSaved && { backgroundColor: c.primaryDark },
            { ...softShadow('md') },
          ]}
          activeOpacity={0.88}
          onPress={handleSaveToDiary}
          disabled={isSaving || isSaved}
        >
          {isSaving ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.saveButtonText}>{strings.saving}</Text>
            </>
          ) : isSaved ? (
            <>
              <Check color="#FFFFFF" size={20} />
              <Text style={styles.saveButtonText}>{strings.addedSuccess}</Text>
            </>
          ) : (
            <>
              <Plus color="#FFFFFF" size={20} />
              <Text style={styles.saveButtonText}>
                {isMultiDish
                  ? `${strings.addAllToDiary} (${items.length})`
                  : strings.addToDiary}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Add Dish Modal */}
      <CustomModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={strings.addMoreDish}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
          <Text style={[styles.modalSub, { color: c.textMuted }]}>
            {strings.pickPopularDish}
          </Text>

          {/* Quick Side Dishes Grid */}
          <View style={styles.quickDishesGrid}>
            {QUICK_SIDE_DISHES.map((dish, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.quickDishCard, { backgroundColor: c.cardHover, borderColor: c.border }]}
                onPress={() => handleAddQuickDish(dish)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickDishEmoji}>{dish.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quickDishName, { color: c.text }]} numberOfLines={1}>
                    {localizedName(dish)}
                  </Text>
                  <Text style={[styles.quickDishMeta, { color: c.textMuted }]}>
                    {dish.grams}g · {dish.calories} kcal
                  </Text>
                </View>
                <Plus size={16} color={c.primary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Dish Inputs */}
          <Text style={[styles.customEntryTitle, { color: c.text }]}>{strings.orTypeYourOwn}</Text>
          <View style={styles.customInputRow}>
            <TextInput
              style={[styles.customInput, { backgroundColor: c.cardHover, borderColor: c.border, color: c.text, flex: 2 }]}
              placeholder={strings.dishNamePlaceholder}
              placeholderTextColor={c.textMuted}
              value={customDishName}
              onChangeText={setCustomDishName}
            />
            <TextInput
              style={[styles.customInput, { backgroundColor: c.cardHover, borderColor: c.border, color: c.text, flex: 1 }]}
              placeholder={strings.gramsPlaceholder}
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
              value={customDishGrams}
              onChangeText={setCustomDishGrams}
            />
          </View>
          <TextInput
            style={[styles.customInput, { backgroundColor: c.cardHover, borderColor: c.border, color: c.text, marginTop: 8 }]}
            placeholder={strings.approxCaloriesPlaceholder}
            placeholderTextColor={c.textMuted}
            keyboardType="numeric"
            value={customDishCalories}
            onChangeText={setCustomDishCalories}
          />

          <TouchableOpacity
            style={[styles.modalAddBtn, { backgroundColor: c.primary }]}
            onPress={handleAddCustomDish}
            activeOpacity={0.85}
          >
            <Text style={styles.modalAddBtnText}>{strings.add}</Text>
          </TouchableOpacity>
        </ScrollView>
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
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  backBtn: {
    padding: 10,
    borderRadius: Radius.md,
  },

  // Table Summary Card
  tableSummaryCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  tableSummaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dishesCountPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  dishesCountText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  tableCaloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  flameCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableTotalKcal: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tableKcalLabel: {
    fontSize: 11,
  },
  tableMacrosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tableMacroItem: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  macroItemLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  macroItemVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  addMoreBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addMoreBtnSmallText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Dish Card
  dishCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  dishCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dishTitleArea: {
    flex: 1,
    paddingRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dishName: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  dishCategory: {
    fontSize: 11,
    marginTop: 1,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  changeFoodText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Dish Metrics Row
  dishMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  dishCalorieText: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  kcalSmall: {
    fontSize: 11,
    fontWeight: '500',
  },
  dishMacrosPreview: {
    fontSize: 10,
    marginTop: 2,
  },
  weightStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: 2,
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightNumBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 8,
  },
  weightNumText: {
    fontSize: 13,
    fontWeight: '700',
  },
  weightUnitText: {
    fontSize: 10,
    marginLeft: 1,
  },

  // Quick Chips
  quickChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 10,
  },

  // Large Add Button
  addDishLargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: Spacing.md,
  },
  addDishLargeBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },

  // Meal Type Selection
  mealTypeSection: {
    marginBottom: 16,
  },
  mealTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  mealButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mealSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  mealSelectText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: Radius.xl,
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal Inside Styles
  modalSub: {
    fontSize: 12,
    marginBottom: 10,
  },
  quickDishesGrid: {
    gap: 8,
    marginBottom: 14,
  },
  quickDishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 10,
  },
  quickDishEmoji: {
    fontSize: 22,
  },
  quickDishName: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickDishMeta: {
    fontSize: 10,
    marginTop: 1,
  },
  customEntryTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  modalAddBtn: {
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  feastPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  feastPromptText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
