import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Flame,
  Check,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Utensils,
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { useScanStore } from '../../src/store/useScanStore';
import { useDiaryStore } from '../../src/store/useDiaryStore';
import { useToastStore } from '../../src/store/useToastStore';

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, theme } = useAppStore();
  const { scanResult, updateItemWeight, selectedItemIndex, setSelectedItemIndex } = useScanStore();
  const { addScanToDiary } = useDiaryStore();
  const { showToast } = useToastStore();

  const currentTheme = theme();
  const strings = t();

  const [selectedMealType, setSelectedMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>('LUNCH');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const items = scanResult?.items || [];
  const currentItem = items[selectedItemIndex] || items[0];

  if (!currentItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background, paddingTop: insets.top }]}>
        <View style={styles.emptyBox}>
          <Text style={{ color: currentTheme.text, fontSize: 16 }}>Skanerlash natijasi topilmadi.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={{ color: currentTheme.primary, fontWeight: '700' }}>Asosiy sahifaga qaytish</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleWeightChange = (delta: number) => {
    const newWeight = Math.max(50, currentItem.weightGrams + delta);
    updateItemWeight(selectedItemIndex, newWeight);
  };

  const handlePresetWeight = (grams: number) => {
    updateItemWeight(selectedItemIndex, grams);
  };

  const handleSaveToDiary = async () => {
    if (isSaving || isSaved) return;
    setIsSaving(true);
    try {
      await addScanToDiary(selectedMealType, items, scanResult?.id);
      setIsSaved(true);
      showToast(strings.addedSuccess, 'success');
      setTimeout(() => {
        router.replace('/(tabs)/diary');
      }, 400);
    } catch {
      showToast('Saqlashda xatolik', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}
          onPress={() => router.back()}
        >
          <ChevronLeft color={currentTheme.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{strings.scanResult}</Text>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}
          onPress={() => router.push('/scan/edit')}
        >
          <RotateCcw color={currentTheme.primary} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* If Multiple items detected, show tab selector */}
        {items.length > 1 && (
          <View style={styles.multiItemSelector}>
            {items.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.itemTab,
                  { backgroundColor: currentTheme.card, borderColor: currentTheme.border },
                  selectedItemIndex === idx && { backgroundColor: currentTheme.primaryBg, borderColor: currentTheme.primary },
                ]}
                onPress={() => setSelectedItemIndex(idx)}
              >
                <Text
                  style={[
                    styles.itemTabText,
                    { color: currentTheme.textSecondary },
                    selectedItemIndex === idx && { color: currentTheme.primary, fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {item.food.nameUz || item.food.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Main Food Card */}
        <View style={[styles.mainCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
          <View style={styles.foodTitleRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={[styles.confidenceBadge, { backgroundColor: currentTheme.primaryBg }]}>
                <Sparkles color={currentTheme.primary} size={11} />
                <Text style={[styles.confidenceText, { color: currentTheme.primary }]}>
                  {strings.confidence}: {Math.round((currentItem.confidence || 0.9) * 100)}%
                </Text>
              </View>
              <Text style={[styles.foodName, { color: currentTheme.text }]}>{currentItem.food.nameUz || currentItem.food.name}</Text>
              <Text style={[styles.foodCategory, { color: currentTheme.textSecondary }]}>{currentItem.food.nameRu || 'Milliy taom'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.changeFoodBtn, { backgroundColor: currentTheme.cardHover, borderColor: currentTheme.border }]}
              onPress={() => router.push('/scan/edit')}
            >
              <Utensils color={currentTheme.primary} size={13} />
              <Text style={[styles.changeFoodText, { color: currentTheme.primary }]}>{strings.changeFood}</Text>
            </TouchableOpacity>
          </View>

          {/* Calorie Display */}
          <View style={[styles.calorieBox, { backgroundColor: currentTheme.cardHover, borderColor: currentTheme.border }]}>
            <View style={[styles.flameIcon, { backgroundColor: currentTheme.secondaryBg }]}>
              <Flame color={currentTheme.secondary} size={24} />
            </View>
            <View>
              <Text style={[styles.calorieNumber, { color: currentTheme.text }]}>
                ~{Math.round(currentItem.nutrition.calories)}
              </Text>
              <Text style={[styles.calorieKcal, { color: currentTheme.textMuted }]}>
                kcal ({currentItem.weightGrams}g uchun)
              </Text>
            </View>
          </View>

          {/* Portion Adjuster */}
          <View style={styles.portionAdjuster}>
            <Text style={[styles.portionLabel, { color: currentTheme.textSecondary }]}>{strings.portionAmount}</Text>
            <View style={[styles.portionControls, { backgroundColor: currentTheme.cardHover }]}>
              <TouchableOpacity
                style={[styles.portionBtn, { backgroundColor: currentTheme.card }]}
                onPress={() => handleWeightChange(-50)}
              >
                <Minus color={currentTheme.text} size={18} />
              </TouchableOpacity>

              <View style={styles.weightDisplay}>
                <Text style={[styles.weightText, { color: currentTheme.text }]}>{currentItem.weightGrams}</Text>
                <Text style={[styles.gramsLabel, { color: currentTheme.textMuted }]}>{strings.grams}</Text>
              </View>

              <TouchableOpacity
                style={[styles.portionBtn, { backgroundColor: currentTheme.card }]}
                onPress={() => handleWeightChange(50)}
              >
                <Plus color={currentTheme.text} size={18} />
              </TouchableOpacity>
            </View>

            {/* Quick Weight Chips */}
            <View style={styles.weightChipsRow}>
              {[200, 300, 350, 450, 500].map((grams) => (
                <TouchableOpacity
                  key={grams}
                  style={[
                    styles.chip,
                    { backgroundColor: currentTheme.cardHover, borderColor: currentTheme.border },
                    currentItem.weightGrams === grams && { borderColor: currentTheme.primary, backgroundColor: currentTheme.primaryBg },
                  ]}
                  onPress={() => handlePresetWeight(grams)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: currentTheme.textMuted },
                      currentItem.weightGrams === grams && { color: currentTheme.primary, fontWeight: '700' },
                    ]}
                  >
                    {grams}g
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Macro Breakdown */}
          <View style={styles.macroGrid}>
            <View style={[styles.macroCard, { backgroundColor: currentTheme.cardHover, borderColor: currentTheme.border }]}>
              <Text style={[styles.macroSub, { color: currentTheme.textMuted }]}>{strings.protein}</Text>
              <Text style={[styles.macroVal, { color: currentTheme.protein }]}>
                {currentItem.nutrition.protein}g
              </Text>
            </View>

            <View style={[styles.macroCard, { backgroundColor: currentTheme.cardHover, borderColor: currentTheme.border }]}>
              <Text style={[styles.macroSub, { color: currentTheme.textMuted }]}>{strings.carbs}</Text>
              <Text style={[styles.macroVal, { color: currentTheme.carbs }]}>
                {currentItem.nutrition.carbs}g
              </Text>
            </View>

            <View style={[styles.macroCard, { backgroundColor: currentTheme.cardHover, borderColor: currentTheme.border }]}>
              <Text style={[styles.macroSub, { color: currentTheme.textMuted }]}>{strings.fat}</Text>
              <Text style={[styles.macroVal, { color: currentTheme.fat }]}>
                {currentItem.nutrition.fat}g
              </Text>
            </View>
          </View>
        </View>

        {/* Meal Type Selection */}
        <View style={styles.mealTypeSection}>
          <Text style={[styles.mealTypeTitle, { color: currentTheme.text }]}>{strings.whichMeal}</Text>
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
                  { backgroundColor: currentTheme.card, borderColor: currentTheme.border },
                  selectedMealType === meal.type && { backgroundColor: currentTheme.primaryBg, borderColor: currentTheme.primary },
                ]}
                onPress={() => setSelectedMealType(meal.type as any)}
              >
                <Text
                  style={[
                    styles.mealSelectText,
                    { color: currentTheme.textSecondary },
                    selectedMealType === meal.type && { color: currentTheme.primary, fontWeight: '700' },
                  ]}
                >
                  {meal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add to Diary Action Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: currentTheme.primary }, isSaved && { backgroundColor: currentTheme.primaryDark }]}
          activeOpacity={0.88}
          onPress={handleSaveToDiary}
          disabled={isSaving || isSaved}
        >
          {isSaving ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.saveButtonText}>Saqlanmoqda...</Text>
            </>
          ) : isSaved ? (
            <>
              <Check color="#FFFFFF" size={20} />
              <Text style={styles.saveButtonText}>{strings.addedSuccess}</Text>
            </>
          ) : (
            <>
              <Plus color="#FFFFFF" size={20} />
              <Text style={styles.saveButtonText}>{strings.addToDiary}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
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
    paddingTop: 8,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  backBtn: {
    padding: 10,
  },
  multiItemSelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  itemTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  itemTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  foodTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  foodName: {
    fontSize: 20,
    fontWeight: '800',
  },
  foodCategory: {
    fontSize: 12,
    marginTop: 2,
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
  calorieBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  flameIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieNumber: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  calorieKcal: {
    fontSize: 12,
  },
  portionAdjuster: {
    marginBottom: 16,
  },
  portionLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  portionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 6,
    marginBottom: 10,
  },
  portionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightDisplay: {
    alignItems: 'center',
  },
  weightText: {
    fontSize: 22,
    fontWeight: '800',
  },
  gramsLabel: {
    fontSize: 10,
  },
  weightChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  chip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  macroCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroSub: {
    fontSize: 9,
    fontWeight: '500',
  },
  macroVal: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  mealTypeSection: {
    marginBottom: 20,
  },
  mealTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  mealButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
