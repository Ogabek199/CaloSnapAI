import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronRight, Pencil, Plus, Trash2, Utensils } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, usePalette, useStrings } from '../../src/store/useAppStore';
import { foodName, intlLocale } from '../../src/shared/i18n/languages';
import { useDiaryStore } from '../../src/store/useDiaryStore';
import { useFeastStore, applyFeastAdjustment } from '../../src/store/useFeastStore';
import { tabBarScrollPadding } from '../../src/shared/theme/layout';
import { FontSize, Radius, Spacing, softShadow, androidTextFix } from '../../src/shared/theme/spacing';
import { MEAL_CONFIG_LIST, MEAL_CONFIGS, type MealType } from '../../src/features/meals/meal-config';
import { useDiaryItemEditor } from '../../src/features/diary/useDiaryItemEditor';
import { DiaryItemEditorModals } from '../../src/features/diary/DiaryItemEditorModals';
import { CustomModal } from '../../src/shared/ui/CustomModal';
import { DayDateStrip } from '../../src/shared/ui/DayDateStrip';
import { DiarySkeleton } from '../../src/shared/ui/Skeleton';
import { RemoteImage } from '../../src/shared/ui/RemoteImage';
import { clearApiCache } from '../../src/shared/api/api-client';
const PAGE_SIZE = 6;

const dropLeadingEmoji = (s: string) => s.replace(/^[^A-Za-z\u00C0-\u024F\u0400-\u04FF\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF0-9]+/, '');

type FoodRow = {
  id: string;
  raw: any;
  name: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
  mealType: MealType;
  createdAt?: string;
};

export default function DiaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeMode = useAppStore((s) => s.themeMode);
  const language = useAppStore((s) => s.language);
  const {
    todaySummary,
    calorieGoal,
    refreshDiary,
    isLoading,
    hasLoaded,
    selectedDate,
    setSelectedDate,
    isSelectedToday,
  } = useDiaryStore(
    useShallow((s) => ({
      todaySummary: s.todaySummary,
      calorieGoal: s.calorieGoal,
      refreshDiary: s.refreshDiary,
      isLoading: s.isLoading,
      hasLoaded: s.hasLoaded,
      selectedDate: s.selectedDate,
      setSelectedDate: s.setSelectedDate,
      isSelectedToday: s.isSelectedToday,
    })),
  );
  const editor = useDiaryItemEditor();

  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<FoodRow | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const c = usePalette();
  const strings = useStrings();
  const isDark = themeMode === 'dark';
  const mealTitle = (type: MealType) =>
    dropLeadingEmoji(strings[type.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack']);
  const showSkeleton = isLoading && !hasLoaded;
  const refreshTint = isDark ? '#FFFFFF' : c.primary;
  const canEdit = isSelectedToday();
  const locale = intlLocale(language);

  useEffect(() => {
    refreshDiary();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      clearApiCache();
      await refreshDiary();
    } finally {
      setRefreshing(false);
    }
  };

  const total = todaySummary?.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const feastAdjustment = useFeastStore((s) => s.getActiveAdjustmentForDate(selectedDate));
  const goal = applyFeastAdjustment(
    todaySummary?.goalCalories || calorieGoal || 2150,
    feastAdjustment,
  );
  const consumed = Math.round(total.calories || 0);
  const remaining = Math.max(0, Math.round(goal - consumed));

  const openManualAdd = () => {
    if (!canEdit) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/diary/add');
  };

  const foodsByMeal = useMemo(() => {
    return MEAL_CONFIG_LIST.map((config) => {
      const meal = todaySummary?.meals?.find((m) => m.type === config.type);
      const items = (meal?.items || []).map(
        (item: any): FoodRow => ({
          id: item.id,
          raw: item,
          name: foodName(item.food, language),
          weightGrams: item.weightGrams || 0,
          calories: Math.round(item.nutrition?.calories || 0),
          protein: Math.round((item.nutrition?.protein || 0) * 10) / 10,
          carbs: Math.round((item.nutrition?.carbs || 0) * 10) / 10,
          fat: Math.round((item.nutrition?.fat || 0) * 10) / 10,
          imageUrl: item.imageUrl || item.food?.imageUrl,
          mealType: config.type,
          createdAt: item.createdAt,
        }),
      );
      return {
        config,
        items,
        mealKcal: Math.round(meal?.totalNutrition?.calories || 0),
      };
    });
  }, [todaySummary, language]);

  const totalItems = foodsByMeal.reduce((n, g) => n + g.items.length, 0);

  // Reset pagination when diary data changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [totalItems, todaySummary?.date]);

  const visibleMeals = useMemo(() => {
    let remaining = visibleCount;
    return foodsByMeal
      .map(({ config, items, mealKcal }) => {
        if (remaining <= 0 || items.length === 0) {
          return { config, items: [] as FoodRow[], mealKcal };
        }
        const shown = items.slice(0, remaining);
        remaining -= shown.length;
        return { config, items: shown, mealKcal };
      })
      .filter((g) => g.items.length > 0);
  }, [foodsByMeal, visibleCount]);

  const hasMore = totalItems > visibleCount;
  const remainingCount = Math.max(0, totalItems - visibleCount);

  const onLoadMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisibleCount((n) => n + PAGE_SIZE);
  };

  const openDetail = (row: FoodRow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDetail(row);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.stripWrap}>
        <DayDateStrip
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          locale={locale}
          primaryColor={c.primary}
          primaryBg={c.primaryBg}
          textColor={c.text}
          mutedColor={c.textMuted}
          cardColor={c.card}
          borderColor={c.border}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarScrollPadding(insets.bottom) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={refreshTint}
            colors={[c.primary]}
            progressBackgroundColor={c.card}
          />
        }
      >

        {showSkeleton ? (
          <DiarySkeleton />
        ) : (
          <View>
            <View style={[styles.summary, styles.section, softShadow('sm'), { backgroundColor: c.card, borderColor: c.border }]}>
              <SummaryCell value={consumed} label={strings.consumed} color={c.text} muted={c.textMuted} />
              <View style={[styles.vDivider, { backgroundColor: c.border }]} />
              <SummaryCell value={goal} label={strings.goalKcal} color={c.secondary} muted={c.textMuted} />
              <View style={[styles.vDivider, { backgroundColor: c.border }]} />
              <SummaryCell value={remaining} label={strings.remaining} color={c.primary} muted={c.textMuted} />
            </View>

            {totalItems === 0 ? (
              <View style={[styles.emptyCard, styles.section, softShadow('sm'), { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.emptyIcon, { backgroundColor: c.cardHover }]}>
                  <Utensils color={c.textMuted} size={24} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.text }]}>{strings.noFoodLogged}</Text>
                <Text style={[styles.emptySub, { color: c.textMuted }]}>
                  {canEdit ? strings.scanFoodDesc : strings.onlyTodayEdit}
                </Text>
                {canEdit ? (
                  <Pressable
                    onPress={openManualAdd}
                    style={({ pressed }) => [
                      styles.emptyCta,
                      { backgroundColor: c.primary, opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Plus color="#fff" size={18} />
                    <Text style={styles.emptyCtaText}>{strings.addFood}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <>
                {visibleMeals.map(({ config, items, mealKcal }) => {
                  const fullGroup = foodsByMeal.find((g) => g.config.type === config.type);
                  const fullCount = fullGroup?.items.length ?? items.length;
                  const accent = isDark ? config.accentDark : config.accentLight;
                  const badgeBg = isDark ? config.badgeBgDark : config.badgeBgLight;

                  return (
                    <View
                      key={config.type}
                      style={[styles.mealCard, styles.section, softShadow('sm'), { backgroundColor: c.card, borderColor: c.border }]}
                    >
                      <View style={styles.mealHead}>
                        <View style={[styles.emojiBox, { backgroundColor: badgeBg }]}>
                          <Text style={{ fontSize: 18 }}>{config.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.mealTitle, { color: c.text }]}>{mealTitle(config.type)}</Text>
                          <Text style={[styles.mealTime, { color: c.textMuted }]}>
                            {fullCount} · {config.type === 'SNACK' ? strings.snackTimeRange : config.timeRange}
                          </Text>
                        </View>
                        <Text style={[styles.mealKcal, { color: accent }]}>{mealKcal} kcal</Text>
                      </View>

                      {items.map((row, idx) => (
                        <Pressable
                          key={row.id}
                          onPress={() => openDetail(row)}
                          style={({ pressed }) => [
                            styles.foodRow,
                            idx < items.length - 1 && {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: c.border,
                            },
                            { opacity: pressed ? 0.75 : 1 },
                          ]}
                        >
                          {row.imageUrl ? (
                            <RemoteImage
                              uri={row.imageUrl}
                              style={styles.foodImg}
                              indicatorColor={c.primary}
                              placeholderColor={c.cardHover}
                            />
                          ) : (
                            <View style={[styles.foodImgPlaceholder, { backgroundColor: badgeBg }]}>
                              <Text style={{ fontSize: 20 }}>{config.emoji}</Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.foodName, { color: c.text }]} numberOfLines={1}>
                              {row.name}
                            </Text>
                            <Text style={[styles.foodMeta, { color: c.textMuted }]}>
                              {row.weightGrams}g
                            </Text>
                            <Text style={[styles.foodMacros, { color: c.textSecondary }]}>
                              {strings.protein} {row.protein}g · {strings.carbs} {row.carbs}g · {strings.fat} {row.fat}g
                            </Text>
                          </View>
                          <View style={styles.actions}>
                            <ChevronRight color={c.textMuted} size={16} />
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  );
                })}

                {hasMore ? (
                  <Pressable
                    onPress={onLoadMore}
                    style={({ pressed }) => [
                      styles.loadMoreBtn,
                      styles.section,
                      {
                        backgroundColor: c.card,
                        borderColor: c.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.loadMoreText, { color: c.primary }]}>
                      {strings.loadMore}
                    </Text>
                    <Text style={[styles.loadMoreMeta, { color: c.textMuted }]}>
                      +{Math.min(PAGE_SIZE, remainingCount)} · {strings.remaining}: {remainingCount}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        )}
      </ScrollView>

      <DiaryItemEditorModals editor={editor} />

      <CustomModal
        visible={detail != null}
        onClose={() => setDetail(null)}
        title={strings.foodInfoTitle}
      >
        {detail ? (
          <View style={styles.detail}>
            {detail.imageUrl ? (
              <RemoteImage
                uri={detail.imageUrl}
                style={styles.detailImg}
                indicatorColor={c.primary}
                indicatorSize="large"
                placeholderColor={c.cardHover}
              />
            ) : (
              <View style={[styles.detailImgPlaceholder, { backgroundColor: c.cardHover }]}>
                <Text style={{ fontSize: 40 }}>
                  {MEAL_CONFIGS[detail.mealType]?.emoji || '🍽'}
                </Text>
              </View>
            )}
            <Text style={[styles.detailName, { color: c.text }]}>{detail.name}</Text>
            <Text style={[styles.detailMeal, { color: c.textMuted }]}>
              {mealTitle(detail.mealType)} · {detail.weightGrams} g
            </Text>

            <View style={[styles.detailCalBox, { backgroundColor: c.primaryBg }]}>
              <Text style={[styles.detailCal, { color: c.primary }]}>{detail.calories}</Text>
              <Text style={[styles.detailCalUnit, { color: c.primary }]}>kcal</Text>
            </View>

            <View style={styles.detailMacros}>
              <Chip label={strings.protein} value={`${detail.protein}g`} color={c.protein} bg={c.infoBg} />
              <Chip label={strings.carbs} value={`${detail.carbs}g`} color={c.carbs} bg={c.secondaryBg} />
              <Chip label={strings.fat} value={`${detail.fat}g`} color={c.fat} bg={c.dangerBg} />
            </View>

            {canEdit ? (
              <View style={styles.detailActions}>
                <Pressable
                  onPress={() => {
                    const raw = detail.raw;
                    setDetail(null);
                    editor.promptEdit(raw);
                  }}
                  style={[styles.detailActionBtn, { backgroundColor: c.cardHover }]}
                >
                  <Pencil color={c.text} size={16} />
                  <Text style={[styles.detailActionText, { color: c.text }]}>{strings.changeFood}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const raw = detail.raw;
                    setDetail(null);
                    editor.promptDelete(raw);
                  }}
                  style={[styles.detailActionBtn, { backgroundColor: c.dangerBg }]}
                >
                  <Trash2 color={c.danger} size={16} />
                  <Text style={[styles.detailActionText, { color: c.danger }]}>{strings.removeItem}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </CustomModal>
    </SafeAreaView>
  );
}

function SummaryCell({
  value,
  label,
  color,
  muted,
}: {
  value: number;
  label: string;
  color: string;
  muted: string;
}) {
  return (
    <View style={styles.summaryCell}>
      <Text style={[styles.summaryVal, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: muted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Chip({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipVal, { color }]}>{value}</Text>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  stripWrap: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  summary: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.lg,
  },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.5, ...androidTextFix },
  summaryLabel: { fontSize: 11, fontWeight: '500', marginTop: 4, ...androidTextFix },
  vDivider: { width: StyleSheet.hairlineWidth },
  emptyCard: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '700' },
  emptySub: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  loadMoreBtn: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  loadMoreText: { fontSize: FontSize.md, fontWeight: '700' },
  loadMoreMeta: { fontSize: FontSize.xs, fontWeight: '500' },
  mealCard: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
  mealHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emojiBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTitle: { fontSize: FontSize.md, fontWeight: '700', ...androidTextFix },
  mealTime: { fontSize: FontSize.xs, marginTop: 2, ...androidTextFix },
  mealKcal: { fontSize: FontSize.sm, fontWeight: '700', ...androidTextFix },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  foodImg: { width: 56, height: 56, borderRadius: 14 },
  foodImgPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodName: { fontSize: FontSize.md, fontWeight: '700', ...androidTextFix },
  foodMeta: { fontSize: FontSize.xs, marginTop: 2, ...androidTextFix },
  foodMacros: { fontSize: 11, marginTop: 3, ...androidTextFix },
  actions: { alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: { alignItems: 'center', gap: Spacing.md },
  detailImg: { width: '100%', height: 160, borderRadius: Radius.lg },
  detailImgPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  detailMeal: { fontSize: FontSize.sm, marginTop: -4 },
  detailCalBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  detailCal: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  detailCalUnit: { fontSize: FontSize.md, fontWeight: '600' },
  detailMacros: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  chip: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  chipVal: { fontSize: FontSize.md, fontWeight: '700' },
  chipLabel: { fontSize: 11, fontWeight: '500' },
  detailActions: { flexDirection: 'row', gap: Spacing.sm, width: '100%', marginTop: 4 },
  detailActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailActionText: { fontSize: FontSize.sm, fontWeight: '700' },
});
