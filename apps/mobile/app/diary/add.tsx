import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, X, Check, Utensils, Barcode } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppStore, usePalette, useStrings } from '../../src/store/useAppStore';
import { foodName as pickFoodName } from '../../src/shared/i18n/languages';
import { useDiaryStore, localDateKey } from '../../src/store/useDiaryStore';
import { useToastStore } from '../../src/store/useToastStore';
import { ApiClient } from '../../src/shared/api/api-client';
import { Food } from '@eda/types';
import { MEAL_CONFIG_LIST, type MealType } from '../../src/features/meals/meal-config';
import { FadeIn, FoodListSkeleton } from '../../src/shared/ui/Skeleton';
import { FontSize, Radius, Spacing, softShadow } from '../../src/shared/theme/spacing';

type Step = 'search' | 'details';

export default function AddFoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const language = useAppStore((s) => s.language);
  const showToast = useToastStore((s) => s.showToast);
  const c = usePalette();
  const strings = useStrings();

  const params = useLocalSearchParams<{ barcode?: string; mealType?: string }>();
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState(params.barcode || '');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Food | null>(null);
  const [mealType, setMealType] = useState<MealType>(() =>
    MEAL_CONFIG_LIST.some((m) => m.type === params.mealType) ? (params.mealType as MealType) : 'LUNCH',
  );
  const [grams, setGrams] = useState('300');
  const [saving, setSaving] = useState(false);
  const searchSeq = useRef(0);
  const savingRef = useRef(false);

  useEffect(() => {
    if (params.barcode) {
      setQuery(params.barcode);
      setStep('search');
    }
  }, [params.barcode]);

  useEffect(() => {
    if (step !== 'details') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep('search');
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const loadFoods = async (searchQuery: string) => {
    const seq = ++searchSeq.current;
    setLoading(true);
    try {
      const q = searchQuery.trim();
      let next: Food[] = [];
      if (/^\d{8,14}$/.test(q)) {
        const res = await ApiClient.findFoodByBarcode(q);
        next = res.found && res.food ? [res.food] : [];
      } else {
        next = await ApiClient.searchFoods(q);
      }
      if (seq !== searchSeq.current) return;
      setFoods(next);
    } catch (e: any) {
      if (seq !== searchSeq.current) return;
      showToast(e?.message || strings.noResults, 'error');
    } finally {
      if (seq === searchSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadFoods(query), query ? 280 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  const foodName = (food: Food) => pickFoodName(food, language, food.name);

  const parsedGrams = parseFloat(grams.replace(',', '.'));
  const gramsValid = Number.isFinite(parsedGrams) && parsedGrams >= 1 && parsedGrams <= 5000;

  const preview = useMemo(() => {
    if (!selected?.nutrition || !gramsValid) return null;
    const f = parsedGrams / 100;
    return {
      calories: Math.round((selected.nutrition.calories || 0) * f),
      protein: Math.round((selected.nutrition.protein || 0) * f * 10) / 10,
      carbs: Math.round((selected.nutrition.carbs || 0) * f * 10) / 10,
      fat: Math.round((selected.nutrition.fat || 0) * f * 10) / 10,
    };
  }, [selected, parsedGrams, gramsValid]);

  const pickFood = (food: Food) => {
    Haptics.selectionAsync();
    setSelected(food);
    setGrams(String(Math.round(food.defaultServingGrams || 300)));
    setStep('details');
  };

  const save = async () => {
    if (!selected || !gramsValid || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await ApiClient.addMealItem(mealType, selected.id, Math.round(parsedGrams));
      void useDiaryStore.getState().setSelectedDate(localDateKey());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(strings.addedSuccess, 'success');
      router.back();
    } catch (e: any) {
      showToast(e?.message || strings.errGeneric, 'error');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>
          {step === 'search' || !selected ? strings.addFood : foodName(selected)}
        </Text>
        <Pressable
          onPress={() => (step === 'details' ? setStep('search') : router.back())}
          style={[styles.closeBtn, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <X color={c.text} size={18} />
        </Pressable>
      </View>

      {step === 'search' ? (
        <>
          <View style={styles.searchRow}>
            <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.border }]}>
              <Search color={c.textMuted} size={18} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                placeholder={strings.searchFoodPlaceholder}
                placeholderTextColor={c.textMuted}
                value={query}
                onChangeText={setQuery}
                autoFocus={!params.barcode}
              />
              {query ? (
                <Pressable
                  onPress={() => {
                    setQuery('');
                  }}
                >
                  <X color={c.textMuted} size={16} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/scan/barcode',
                  params: { mealType },
                });
              }}
              style={[styles.barcodeScanBtn, { backgroundColor: c.card, borderColor: c.border }]}
              accessibilityLabel={strings.barcodeScannerTitle}
            >
              <Barcode color={c.primary} size={22} />
            </Pressable>
          </View>

          {loading && foods.length === 0 ? (
            <FoodListSkeleton rows={8} />
          ) : (
            <FadeIn style={{ flex: 1 }}>
              <FlatList
                data={foods}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: Spacing.xl, paddingBottom: insets.bottom + 40, gap: 10 }}
                ListEmptyComponent={
                  !loading ? (
                    <Text style={{ color: c.textMuted, textAlign: 'center', marginTop: 24 }}>
                      {strings.noResults}
                    </Text>
                  ) : null
                }
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => pickFood(item)}
                    style={({ pressed }) => [
                      styles.foodRow,
                      {
                        backgroundColor: c.card,
                        borderColor: c.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                      softShadow('sm'),
                    ]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: c.primaryBg }]}>
                      <Utensils color={c.primary} size={18} />
                    </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.foodName, { color: c.text }]} numberOfLines={1}>
              {foodName(item)}
            </Text>
            <Text style={[styles.foodMeta, { color: c.textMuted }]}>
              {Math.round(item.nutrition?.calories || 0)} kcal / 100g
              {(item as any).barcode ? ` · ${(item as any).barcode}` : ''}
            </Text>
          </View>
                  </Pressable>
                )}
              />
            </FadeIn>
          )}
        </>
      ) : (
        <ScrollDetails
          c={c}
          strings={strings}
          mealType={mealType}
          setMealType={setMealType}
          grams={grams}
          setGrams={setGrams}
          preview={preview}
          saving={saving}
          canSave={gramsValid}
          onSave={save}
          insetsBottom={insets.bottom}
        />
      )}
    </SafeAreaView>
  );
}

function ScrollDetails({
  c,
  strings,
  mealType,
  setMealType,
  grams,
  setGrams,
  preview,
  saving,
  canSave,
  onSave,
  insetsBottom,
}: any) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.lg, paddingBottom: insetsBottom + 24 }}
    >
      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
        {strings.whichMeal}
      </Text>
      <View style={styles.mealRow}>
        {MEAL_CONFIG_LIST.map((m) => {
          const on = mealType === m.type;
          const label: string = strings[m.type.toLowerCase()] || m.title;
          return (
            <Pressable
              key={m.type}
              onPress={() => setMealType(m.type)}
              style={[
                styles.mealChip,
                {
                  backgroundColor: on ? c.primary : c.card,
                  borderColor: on ? c.primary : c.border,
                },
              ]}
            >
              <Text style={{ color: on ? '#fff' : c.text, fontSize: 12, fontWeight: '600' }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
        {strings.portionAmount}
      </Text>
      <View style={[styles.gramsBox, { backgroundColor: c.card, borderColor: c.border }]}>
        <TextInput
          style={[styles.gramsInput, { color: c.text }]}
          keyboardType="numeric"
          value={grams}
          onChangeText={setGrams}
        />
        <Text style={{ color: c.textMuted, fontWeight: '600' }}>{strings.grams}</Text>
      </View>

      {preview ? (
        <View style={[styles.preview, { backgroundColor: c.primaryBg }]}>
          <Text style={[styles.previewCal, { color: c.primary }]}>{preview.calories} kcal</Text>
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>
            {strings.protein} {preview.protein}g · {strings.carbs} {preview.carbs}g · {strings.fat}{' '}
            {preview.fat}g
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={onSave}
        disabled={saving || !canSave}
        style={({ pressed }) => [
          styles.saveBtn,
          { backgroundColor: c.primary, opacity: !canSave ? 0.5 : pressed || saving ? 0.85 : 1 },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Check color="#fff" size={18} />
            <Text style={styles.saveText}>{strings.addToDiary}</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  title: { flex: 1, fontSize: FontSize.xl, fontWeight: '700' },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    height: 48,
  },
  barcodeScanBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodName: { fontSize: FontSize.md, fontWeight: '700' },
  foodMeta: { fontSize: FontSize.xs, marginTop: 2 },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  gramsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    height: 52,
  },
  gramsInput: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: '700',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  preview: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  previewCal: { fontSize: 28, fontWeight: '800' },
  saveBtn: {
    marginTop: 'auto',
    height: 52,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
