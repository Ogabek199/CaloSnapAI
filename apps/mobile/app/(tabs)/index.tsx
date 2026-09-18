import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronRight, User, Utensils } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { useDiaryStore, localDateKey } from '../../src/store/useDiaryStore';
import { useToastStore } from '../../src/store/useToastStore';
import { tabBarScrollPadding } from '../../src/shared/theme/layout';
import { FontSize, Radius, Spacing, softShadow } from '../../src/shared/theme/spacing';
import { CalorieRing } from '../../src/shared/ui/CalorieRing';
import { MacroBars } from '../../src/shared/ui/MacroBars';
import { AndroidRefreshBanner, IOSRefreshControl } from '../../src/shared/ui/IOSRefreshControl';
import { CustomModal } from '../../src/shared/ui/CustomModal';
import { DayDateStrip } from '../../src/shared/ui/DayDateStrip';
import { FadeIn, HomeSkeleton } from '../../src/shared/ui/Skeleton';
import { RemoteImage } from '../../src/shared/ui/RemoteImage';
import { MEAL_CONFIGS, type MealType } from '../../src/features/meals/meal-config';
import { ApiClient } from '../../src/shared/api/api-client';

type FoodRow = {
  id: string;
  name: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  imageUrl?: string;
  mealType: MealType;
  createdAt?: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, theme, themeMode, user, isOnboardingCompleted, language } = useAppStore();
  const {
    todaySummary,
    calorieGoal,
    refreshDiary,
    isLoading,
    hasLoaded,
    selectedDate,
    setSelectedDate,
    isSelectedToday,
  } = useDiaryStore();

  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<FoodRow | null>(null);
  const [week, setWeek] = useState<{
    streak: number;
    avgCalories: number;
    goalCalories: number;
    days: { date: string; calories: number; logged: boolean }[];
  } | null>(null);
  const [water, setWater] = useState({ totalMl: 0, goalMl: 2000 });
  const { showToast } = useToastStore();

  const c = theme();
  const strings = t();
  const isDark = themeMode === 'dark';
  const showSkeleton = isLoading && !hasLoaded;
  const refreshTint = isDark ? '#FFFFFF' : c.primary;
  const viewingToday = isSelectedToday();
  const locale = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ';

  const loadExtras = async () => {
    try {
      const to = localDateKey();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 6);
      const from = localDateKey(fromDate);
      const [summary, waterToday] = await Promise.all([
        ApiClient.getDiarySummary(from, to),
        ApiClient.waterToday().catch(() => ({ totalMl: 0, goalMl: 2000 })),
      ]);
      setWeek(summary);
      setWater({
        totalMl: Math.min(waterToday.totalMl, waterToday.goalMl || 2000),
        goalMl: waterToday.goalMl || 2000,
      });
    } catch (e) {
      console.log('Home extras:', e);
    }
  };

  useEffect(() => {
    if (!isOnboardingCompleted) return;
    refreshDiary();
    loadExtras();
  }, [isOnboardingCompleted]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refreshDiary();
      await loadExtras();
    } finally {
      setRefreshing(false);
    }
  };

  const addWater = async () => {
    const goalMl = water.goalMl || 2000;
    const waterRemaining = Math.max(0, goalMl - water.totalMl);
    if (waterRemaining <= 0) {
      showToast(strings.waterGoalReached.replace('{n}', String(goalMl)), 'info');
      return;
    }
    try {
      await ApiClient.addWater(Math.min(250, waterRemaining));
      const w = await ApiClient.waterToday();
      setWater({
        totalMl: Math.min(w.totalMl, w.goalMl || goalMl),
        goalMl: w.goalMl || goalMl,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e: any) {
      showToast(e?.message || 'Xatolik', 'error');
    }
  };

  const total = todaySummary?.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goal = todaySummary?.goalCalories || calorieGoal || 2150;
  const consumed = Math.round(total.calories || 0);
  const remaining = Math.max(0, Math.round(goal - consumed));
  const progress = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;

  const proteinTarget = Math.max(1, Math.round((goal * 0.25) / 4));
  const carbsTarget = Math.max(1, Math.round((goal * 0.5) / 4));
  const fatTarget = Math.max(1, Math.round((goal * 0.25) / 9));

  const firstName = user.name?.split(' ')[0] || 'Foydalanuvchi';
  const headerDate = viewingToday
    ? `${strings.today}, ${new Date().toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
      })}`
    : (() => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
      })();

  const balanceTitle = viewingToday ? strings.calorieBalance : strings.calorieBalanceDay;
  const mealsTitle = viewingToday ? strings.todaysMeals : strings.mealsForDay;

  const todayFoods = useMemo(() => {
    const rows: FoodRow[] = [];
    for (const meal of todaySummary?.meals || []) {
      for (const item of meal.items || []) {
        rows.push({
          id: item.id,
          name: item.food?.nameUz || item.food?.name || 'Taom',
          weightGrams: item.weightGrams || 0,
          calories: Math.round(item.nutrition?.calories || 0),
          protein: Math.round((item.nutrition?.protein || 0) * 10) / 10,
          carbs: Math.round((item.nutrition?.carbs || 0) * 10) / 10,
          fat: Math.round((item.nutrition?.fat || 0) * 10) / 10,
          fiber: Math.round((item.nutrition?.fiber || 0) * 10) / 10,
          imageUrl: (item as any).imageUrl || item.food?.imageUrl,
          mealType: meal.type,
          createdAt: item.createdAt,
        });
      }
    }
    // Newest first
    return rows.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [todaySummary]);

  const openDetail = (row: FoodRow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDetail(row);
  };

  const mealTitle = (type: MealType) => MEAL_CONFIGS[type]?.title || type;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarScrollPadding(insets.bottom) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <IOSRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={refreshTint}
            backgroundColor={c.card}
          />
        }
      >
        <AndroidRefreshBanner refreshing={refreshing} tintColor={refreshTint} />

        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.hello, { color: c.textMuted }]}>{strings.greeting}</Text>
            <Text style={[styles.name, { color: c.text }]}>{firstName}</Text>
            <Text style={[styles.date, { color: c.textSecondary }]}>{headerDate}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={({ pressed }) => [
              styles.avatarBtn,
              { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.85 : 1 },
              softShadow('sm'),
            ]}
          >
            {user.avatarUrl ? (
              <RemoteImage
                uri={user.avatarUrl}
                style={styles.avatarImg}
                indicatorColor={c.primary}
                placeholderColor={c.cardHover}
              />
            ) : (
              <User color={c.textMuted} size={22} />
            )}
          </Pressable>
        </View>

        {showSkeleton ? (
          <HomeSkeleton />
        ) : (
          <FadeIn style={{ gap: Spacing.lg }}>
            <View style={styles.stripWrap}>
              <DayDateStrip
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                locale={locale}
                primaryColor={c.primary}
                textColor={c.text}
                mutedColor={c.textMuted}
                cardColor={c.card}
                borderColor={c.border}
              />
            </View>

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, softShadow('sm')]}>
              <Text style={[styles.cardTitle, { color: c.textSecondary }]}>{balanceTitle}</Text>

              <View style={styles.ringRow}>
                <CalorieRing
                  progress={progress}
                  trackColor={isDark ? '#2A2F3A' : '#ECECE8'}
                  progressColor={c.primary}
                  centerLabel={strings.remaining}
                  centerValue={remaining}
                  centerSub="kcal"
                  valueColor={c.text}
                  labelColor={c.textMuted}
                />
                <View style={styles.sideStats}>
                  <View style={styles.statBlock}>
                    <Text style={[styles.statVal, { color: c.text }]}>{consumed}</Text>
                    <Text style={[styles.statLabel, { color: c.textMuted }]}>{strings.consumed}</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: c.border }]} />
                  <View style={styles.statBlock}>
                    <Text style={[styles.statVal, { color: c.secondary }]}>{goal}</Text>
                    <Text style={[styles.statLabel, { color: c.textMuted }]}>{strings.goalKcal}</Text>
                  </View>
                </View>
              </View>

              <MacroBars
                protein={total.protein || 0}
                carbs={total.carbs || 0}
                fat={total.fat || 0}
                proteinTarget={proteinTarget}
                carbsTarget={carbsTarget}
                fatTarget={fatTarget}
                proteinColor={c.protein}
                carbsColor={c.carbs}
                fatColor={c.fat}
                trackColor={isDark ? '#2A2F3A' : '#ECECE8'}
                textColor={c.text}
                mutedColor={c.textMuted}
                labels={{ protein: strings.protein, carbs: strings.carbs, fat: strings.fat }}
              />
            </View>

            {week ? (
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, softShadow('sm')]}>
                <View style={styles.weekHead}>
                  <Text style={[styles.cardTitle, { color: c.textSecondary, marginBottom: 0 }]}>
                    {strings.weekProgress}
                  </Text>
                  <Text style={{ color: c.primary, fontWeight: '700', fontSize: FontSize.sm }}>
                    {strings.streakLabel} {week.streak}🔥
                  </Text>
                </View>
                <Text style={{ color: c.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.md }}>
                  {strings.avgKcal}: {week.avgCalories} kcal
                </Text>
                <View style={styles.weekBars}>
                  {week.days.map((d) => {
                    const max = Math.max(week.goalCalories, ...week.days.map((x) => x.calories), 1);
                    const h = Math.max(4, Math.round((d.calories / max) * 64));
                    const label = d.date.slice(8);
                    return (
                      <View key={d.date} style={styles.weekCol}>
                        <View
                          style={[
                            styles.weekBar,
                            {
                              height: h,
                              backgroundColor: d.logged ? c.primary : isDark ? '#2A2F3A' : '#ECECE8',
                            },
                          ]}
                        />
                        <Text style={{ color: c.textMuted, fontSize: 10 }}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View
              style={[
                styles.card,
                styles.waterRow,
                { backgroundColor: c.card, borderColor: c.border },
                softShadow('sm'),
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: c.textSecondary, marginBottom: 4 }]}>
                  {strings.waterTitle}
                </Text>
                <Text style={{ color: c.text, fontWeight: '700', fontSize: FontSize.lg }}>
                  {Math.min(water.totalMl, water.goalMl)} / {water.goalMl} ml
                </Text>
              </View>
              <Pressable
                onPress={addWater}
                disabled={water.totalMl >= water.goalMl}
                style={({ pressed }) => [
                  styles.waterBtn,
                  {
                    backgroundColor: water.totalMl >= water.goalMl ? c.textMuted : c.primary,
                    opacity: pressed && water.totalMl < water.goalMl ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {water.totalMl >= water.goalMl ? strings.waterFull : strings.addWater}
                </Text>
              </Pressable>
            </View>

            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>{mealsTitle}</Text>
              <Pressable onPress={() => router.push('/(tabs)/diary')} hitSlop={8}>
                <Text style={[styles.seeAll, { color: c.primary }]}>{strings.seeAll}</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: c.card, borderColor: c.border, paddingVertical: 4 },
                softShadow('sm'),
              ]}
            >
              {todayFoods.length === 0 ? (
                <View style={styles.empty}>
                  <View style={[styles.emptyIcon, { backgroundColor: c.cardHover }]}>
                    <Utensils color={c.textMuted} size={22} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: c.text }]}>{strings.noFoodLogged}</Text>
                  <Text style={[styles.emptySub, { color: c.textMuted }]}>
                    Skaner orqali taom qo‘shing
                  </Text>
                </View>
              ) : (
                todayFoods.map((row, idx) => {
                  const meal = MEAL_CONFIGS[row.mealType];
                  return (
                    <Pressable
                      key={row.id}
                      onPress={() => openDetail(row)}
                      style={({ pressed }) => [
                        styles.foodRow,
                        idx < todayFoods.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: c.border,
                        },
                        { opacity: pressed ? 0.7 : 1 },
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
                        <View
                          style={[
                            styles.foodImgPlaceholder,
                            { backgroundColor: isDark ? meal?.badgeBgDark : meal?.badgeBgLight },
                          ]}
                        >
                          <Text style={{ fontSize: 20 }}>{meal?.emoji || '🍽'}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.foodName, { color: c.text }]} numberOfLines={1}>
                          {row.name}
                        </Text>
                        <Text style={[styles.foodMeta, { color: c.textMuted }]}>
                          {mealTitle(row.mealType)} · {row.weightGrams}g
                        </Text>
                        <Text style={[styles.foodMacros, { color: c.textSecondary }]}>
                          Oqsil {row.protein}g · Uglevod {row.carbs}g · Yog‘ {row.fat}g
                        </Text>
                      </View>
                      <ChevronRight color={c.textMuted} size={16} />
                    </Pressable>
                  );
                })
              )}
            </View>
          </FadeIn>
        )}
      </ScrollView>

      <CustomModal
        visible={detail != null}
        onClose={() => setDetail(null)}
        title="Taom ma’lumoti"
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
                <Text style={{ fontSize: 40 }}>{MEAL_CONFIGS[detail.mealType]?.emoji || '🍽'}</Text>
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
              <MacroChip label={strings.protein} value={`${detail.protein}g`} color={c.protein} bg={c.infoBg} />
              <MacroChip label={strings.carbs} value={`${detail.carbs}g`} color={c.carbs} bg={c.secondaryBg} />
              <MacroChip label={strings.fat} value={`${detail.fat}g`} color={c.fat} bg={c.dangerBg} />
            </View>

            <Pressable
              onPress={() => {
                setDetail(null);
                router.push('/(tabs)/diary');
              }}
              style={({ pressed }) => [
                styles.detailBtn,
                { backgroundColor: c.primary, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={styles.detailBtnText}>Kundalikda ochish</Text>
            </Pressable>
          </View>
        ) : null}
      </CustomModal>
    </SafeAreaView>
  );
}

function MacroChip({
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
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  hello: { fontSize: FontSize.sm, fontWeight: '500' },
  name: { fontSize: FontSize.xxl, fontWeight: '700', letterSpacing: -0.6, marginTop: 2 },
  date: { fontSize: FontSize.sm, marginTop: 2 },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 48, height: 48 },
  stripWrap: {
    marginHorizontal: -Spacing.xl,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xl,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    letterSpacing: 0.2,
  },
  weekHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  weekBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    gap: 4,
  },
  weekCol: { flex: 1, alignItems: 'center', gap: 4 },
  weekBar: { width: '70%', borderRadius: 6, minHeight: 4 },
  waterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  waterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sideStats: { flex: 1, gap: Spacing.md },
  statBlock: { gap: 2 },
  statVal: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: FontSize.xs, fontWeight: '500' },
  statDivider: { height: StyleSheet.hairlineWidth },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', letterSpacing: -0.3 },
  seeAll: { fontSize: FontSize.sm, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '600' },
  emptySub: { fontSize: FontSize.sm },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  foodImg: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  foodImgPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodName: { fontSize: FontSize.md, fontWeight: '700' },
  foodMeta: { fontSize: FontSize.xs, marginTop: 2 },
  foodMacros: { fontSize: 11, marginTop: 3 },
  foodRight: { alignItems: 'flex-end', minWidth: 48 },
  foodKcal: { fontSize: FontSize.lg, fontWeight: '800', letterSpacing: -0.4 },
  foodKcalUnit: { fontSize: 10, fontWeight: '500' },
  detail: { alignItems: 'center', gap: Spacing.md },
  detailImg: {
    width: '100%',
    height: 160,
    borderRadius: Radius.lg,
  },
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
  detailMacros: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  chip: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  chipVal: { fontSize: FontSize.md, fontWeight: '700' },
  chipLabel: { fontSize: 11, fontWeight: '500' },
  detailBtn: {
    width: '100%',
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  detailBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
