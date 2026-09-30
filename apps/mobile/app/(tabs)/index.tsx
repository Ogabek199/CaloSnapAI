import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronRight, Utensils, PartyPopper, ChefHat, MessageCircle, HeartPulse } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, usePalette, useStrings } from '../../src/store/useAppStore';
import { foodName, intlLocale } from '../../src/shared/i18n/languages';
import { useDiaryStore, localDateKey } from '../../src/store/useDiaryStore';
import { useFeastStore, applyFeastAdjustment } from '../../src/store/useFeastStore';
import { useToastStore } from '../../src/store/useToastStore';
import { tabBarScrollPadding } from '../../src/shared/theme/layout';
import { FontSize, Radius, Spacing, softShadow, androidTextFix } from '../../src/shared/theme/spacing';
import { CalorieRing } from '../../src/shared/ui/CalorieRing';
import { MacroBars } from '../../src/shared/ui/MacroBars';
import { CustomModal } from '../../src/shared/ui/CustomModal';
import { DayDateStrip } from '../../src/shared/ui/DayDateStrip';
import { HomeSkeleton, SkeletonBone } from '../../src/shared/ui/Skeleton';
import { RemoteImage } from '../../src/shared/ui/RemoteImage';
import { StatusBarScrim } from '../../src/shared/ui/StatusBarScrim';
import { MEAL_CONFIGS, type MealType } from '../../src/features/meals/meal-config';
import { ApiClient, clearApiCache } from '../../src/shared/api/api-client';
import { dailyHealthAlerts } from '../../src/features/assistant/health-rules';

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
  const isIOS = Platform.OS === 'ios';
  const themeMode = useAppStore((s) => s.themeMode);
  const isOnboardingCompleted = useAppStore((s) => s.isOnboardingCompleted);
  const language = useAppStore((s) => s.language);
  const userWeightKg = useAppStore((s) => s.user.weightKg);
  const isPremium = useAppStore((s) => !!s.user.isPremium);
  const healthConditions = useAppStore((s) => s.user.healthConditions);
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

  const {
    activePlan: feastPlan,
    openModal: openFeastModal,
    getActiveAdjustmentForDate,
    getCurrentDayProgress,
    isFeastDay,
    expireIfFinished,
  } = useFeastStore(
    useShallow((s) => ({
      activePlan: s.activePlan,
      openModal: s.openModal,
      getActiveAdjustmentForDate: s.getActiveAdjustmentForDate,
      getCurrentDayProgress: s.getCurrentDayProgress,
      isFeastDay: s.isFeastDay,
      expireIfFinished: s.expireIfFinished,
    })),
  );

  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<FoodRow | null>(null);
  const [week, setWeek] = useState<{
    streak: number;
    avgCalories: number;
    goalCalories: number;
    days: { date: string; calories: number; logged: boolean }[];
  } | null>(null);
  const [water, setWater] = useState({ totalMl: 0, goalMl: 2000 });
  const [extrasLoaded, setExtrasLoaded] = useState(false);
  const [addingWater, setAddingWater] = useState(false);
  const addingWaterRef = useRef(false);
  const showToast = useToastStore((s) => s.showToast);

  const c = usePalette();
  const strings = useStrings();
  const isDark = themeMode === 'dark';
  const showSkeleton = isLoading && !hasLoaded;
  const refreshTint = isDark ? '#FFFFFF' : c.primary;
  const viewingToday = isSelectedToday();
  const locale = intlLocale(language);

  const loadExtras = async () => {
    if (expireIfFinished()) {
      showToast(strings.feastCompletedToast, 'success');
    }
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
      if (__DEV__) console.log('Home extras:', e);
    } finally {
      setExtrasLoaded(true);
    }
  };

  useEffect(() => {
    if (!isOnboardingCompleted) return;
    refreshDiary();
  }, [isOnboardingCompleted]);

  useFocusEffect(
    useCallback(() => {
      if (!isOnboardingCompleted) return;
      loadExtras();
    }, [isOnboardingCompleted]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      clearApiCache();
      await Promise.all([refreshDiary(), loadExtras()]);
    } finally {
      setRefreshing(false);
    }
  };

  const addWater = async () => {
    if (addingWaterRef.current) return;
    const goalMl = water.goalMl || 2000;
    const waterRemaining = Math.max(0, goalMl - water.totalMl);
    if (waterRemaining <= 0) {
      showToast(strings.waterGoalReached.replace('{n}', String(goalMl)), 'info');
      return;
    }
    addingWaterRef.current = true;
    setAddingWater(true);
    try {
      await ApiClient.addWater(Math.min(250, waterRemaining));
      const w = await ApiClient.waterToday();
      setWater({
        totalMl: Math.min(w.totalMl, w.goalMl || goalMl),
        goalMl: w.goalMl || goalMl,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e: any) {
      showToast(e?.message || strings.errGeneric, 'error');
    } finally {
      addingWaterRef.current = false;
      setAddingWater(false);
    }
  };

  const total = todaySummary?.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const feastAdjustment = getActiveAdjustmentForDate(selectedDate);
  const baseGoal = todaySummary?.goalCalories || calorieGoal || 2150;
  const goal = applyFeastAdjustment(baseGoal, feastAdjustment);
  const consumed = Math.round(total.calories || 0);
  const remaining = Math.max(0, Math.round(goal - consumed));
  const progress = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;
  const isFeast = isFeastDay(selectedDate);
  const currentFeastProgress = getCurrentDayProgress(selectedDate);

  // Same split as GoalsService.calculateTDEE: protein 2 g/kg, fat 25% kcal, carbs remainder.
  const proteinTarget = Math.max(1, Math.round((userWeightKg || 70) * 2));
  const fatTarget = Math.max(1, Math.round((goal * 0.25) / 9));
  const carbsTarget = Math.max(1, Math.round((goal - (proteinTarget * 4 + fatTarget * 9)) / 4));

  const dailyAlerts =
    isPremium && viewingToday
      ? dailyHealthAlerts(healthConditions, { carbs: total.carbs || 0, fat: total.fat || 0 }, goal, strings)
      : [];

  const balanceTitle = viewingToday ? strings.calorieBalance : strings.calorieBalanceDay;
  const mealsTitle = viewingToday ? strings.todaysMeals : strings.mealsForDay;

  const todayFoods = useMemo(() => {
    const rows: FoodRow[] = [];
    for (const meal of todaySummary?.meals || []) {
      for (const item of meal.items || []) {
        rows.push({
          id: item.id,
          name: foodName(item.food, language),
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
  }, [todaySummary, language]);

  const openDetail = (row: FoodRow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDetail(row);
  };

  const mealTitle = (type: MealType) =>
    strings[type.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack'] ||
    MEAL_CONFIGS[type]?.title ||
    type;

  const weekMax = week
    ? Math.max(week.goalCalories, ...week.days.map((x) => x.calories), 1)
    : 1;
  const waterFull = water.totalMl >= water.goalMl;

  return (
    <View style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: (isIOS ? 0 : insets.top) + Spacing.sm,
            paddingBottom: tabBarScrollPadding(insets.bottom),
          },
        ]}
        // iOS: an inset (not padding) keeps the pull-to-refresh spinner below the notch.
        contentInset={isIOS ? { top: insets.top } : undefined}
        contentOffset={isIOS ? { x: 0, y: -insets.top } : undefined}
        scrollIndicatorInsets={isIOS ? { top: insets.top } : undefined}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={refreshTint}
            colors={[c.primary]}
            progressBackgroundColor={c.card}
            progressViewOffset={insets.top}
          />
        }
      >

        {showSkeleton ? (
          <HomeSkeleton />
        ) : (
          <View>
            <View style={[styles.stripWrap, styles.section]}>
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

            {/* Feast Active Recovery Banner */}
            {feastPlan && currentFeastProgress && (
              <Pressable
                style={[
                  styles.card,
                  styles.section,
                  softShadow('sm'),
                  {
                    backgroundColor: isDark ? 'rgba(255, 149, 0, 0.12)' : '#FFF8EE',
                    borderColor: isDark ? 'rgba(255, 149, 0, 0.35)' : '#FFE3BD',
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openFeastModal();
                }}
              >
                <View style={styles.feastBannerRow}>
                  <View
                    style={[
                      styles.feastBannerIcon,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 149, 0, 0.25)'
                          : 'rgba(255, 149, 0, 0.15)',
                      },
                    ]}
                  >
                    <PartyPopper size={20} color="#FF9500" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.feastBannerTitle,
                        { color: isDark ? '#FFB340' : '#D97706' },
                      ]}
                    >
                      {currentFeastProgress.isFeastDay
                        ? `🎉 ${strings.feastDayOf} (+${feastPlan.surplusCalories} kcal)`
                        : strings.feastActiveBanner
                            .replace(
                              '{day}',
                              String(currentFeastProgress.currentDay),
                            )
                            .replace(
                              '{total}',
                              String(feastPlan.compensationDays),
                            )
                            .replace(
                              '{deficit}',
                              String(feastPlan.dailyDeficit),
                            )}
                    </Text>
                    <Text
                      style={[
                        styles.feastBannerSubtitle,
                        { color: isDark ? '#D1D5DB' : '#6B7280' },
                      ]}
                    >
                      {currentFeastProgress.isFeastDay
                        ? strings.feastWarmMessage
                        : strings.feastModeSubtitle}
                    </Text>
                    <View style={styles.feastBannerFooter}>
                      {currentFeastProgress.inRecovery ? (
                        <View style={[styles.feastBadge, { backgroundColor: 'rgba(52,199,89,0.15)' }]}>
                          <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: '#34C759' }}>
                            {strings.feastPerDay.replace('{n}', String(feastPlan.dailyDeficit))}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.feastBadge, { backgroundColor: 'rgba(255,149,0,0.15)' }]}>
                          <PartyPopper size={12} color="#FF9500" />
                          <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: '#FF9500' }}>
                            {strings.feastDayOf}
                          </Text>
                        </View>
                      )}
                      <View style={styles.feastDetailsBtn}>
                        <Text style={[styles.feastDetailsText, { color: isDark ? '#FFB340' : '#D97706' }]}>
                          {strings.feastDetails}
                        </Text>
                        <ChevronRight size={14} color={isDark ? '#FFB340' : '#D97706'} />
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            )}

            {/* Over-Budget Feast Suggestion */}
            {!feastPlan && viewingToday && consumed > baseGoal + 150 && (
              <Pressable
                style={[
                  styles.card,
                  styles.section,
                  softShadow('sm'),
                  {
                    backgroundColor: isDark ? 'rgba(255, 149, 0, 0.1)' : '#FFFBF4',
                    borderColor: isDark ? 'rgba(255, 149, 0, 0.3)' : '#FED7AA',
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openFeastModal(consumed - baseGoal);
                }}
              >
                <View style={styles.feastBannerRow}>
                  <View
                    style={[
                      styles.feastBannerIcon,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 149, 0, 0.25)'
                          : 'rgba(255, 149, 0, 0.15)',
                      },
                    ]}
                  >
                    <PartyPopper size={22} color="#FF9500" />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={[
                        styles.feastBannerTitle,
                        { color: isDark ? '#FFB340' : '#D97706' },
                      ]}
                    >
                      {strings.feastOverBudgetTitle}
                    </Text>
                    <Text
                      style={[
                        styles.feastBannerSubtitle,
                        { color: isDark ? '#D1D5DB' : '#6B7280' },
                      ]}
                    >
                      {strings.feastOverBudgetDesc}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.feastBalanceBtn,
                      { backgroundColor: '#FF9500' },
                    ]}
                  >
                    <Text style={styles.feastBalanceBtnText}>
                      {strings.feastBalanceNow}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}

            <View style={[styles.card, styles.section, softShadow('sm'), { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.balanceHeadRow}>
                <Text style={[styles.cardTitle, { color: c.textSecondary, marginBottom: 0 }, androidTextFix]}>{balanceTitle}</Text>
                {isFeast ? (
                  <View style={[styles.feastBadge, { backgroundColor: 'rgba(255,149,0,0.15)' }]}>
                    <PartyPopper size={12} color="#FF9500" />
                    <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: '#FF9500' }}>{strings.feastDayOf}</Text>
                  </View>
                ) : currentFeastProgress?.inRecovery ? (
                  <View style={[styles.feastBadge, { backgroundColor: 'rgba(52,199,89,0.15)' }]}>
                    <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: '#34C759' }}>-{feastPlan?.dailyDeficit} kcal</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.ringRow}>
                <CalorieRing
                  progress={progress}
                  trackColor={isDark ? '#2A2F3A' : '#ECECE8'}
                  progressColor={isFeast ? '#FF9500' : c.primary}
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

            {dailyAlerts.length > 0 && (
              <View
                style={[
                  styles.card,
                  styles.section,
                  softShadow('sm'),
                  { backgroundColor: c.card, borderColor: c.border, padding: Spacing.lg },
                ]}
              >
                <View style={styles.aiHead}>
                  <HeartPulse size={18} color={c.danger} />
                  <Text style={[styles.cardTitle, { color: c.text, marginBottom: 0 }, androidTextFix]}>
                    {strings.healthDailyTitle}
                  </Text>
                </View>
                {dailyAlerts.map((a, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dailyAlert,
                      { backgroundColor: a.level === 'warning' ? c.dangerBg : 'rgba(245,158,11,0.12)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dailyAlertText,
                        { color: a.level === 'warning' ? c.danger : isDark ? '#FBBF24' : '#B45309' },
                        androidTextFix,
                      ]}
                    >
                      {a.text}
                    </Text>
                  </View>
                ))}
                <Text style={[styles.dailyDisclaimer, { color: c.textMuted }, androidTextFix]}>
                  {strings.healthDisclaimer}
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.cardTitle, { color: c.textSecondary }, androidTextFix]}>{strings.aiToolsTitle}</Text>
              <View style={styles.aiRow}>
                {[
                  {
                    key: 'chef',
                    title: strings.aiChefTitle,
                    sub: strings.aiChefSubtitle,
                    Icon: ChefHat,
                    tint: '#F59E0B',
                    route: '/assistant/chef' as const,
                  },
                  {
                    key: 'chat',
                    title: strings.aiChatTitle,
                    sub: strings.aiChatSubtitle,
                    Icon: MessageCircle,
                    tint: c.primary,
                    route: '/assistant/chat' as const,
                  },
                ].map(({ key, title, sub, Icon, tint, route }) => (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={title}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(isPremium ? route : '/paywall');
                    }}
                    style={({ pressed }) => [
                      styles.card,
                      styles.aiCard,
                      softShadow('sm'),
                      { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={styles.aiCardTop}>
                      <View style={[styles.aiIcon, { backgroundColor: `${tint}22` }]}>
                        <Icon size={20} color={tint} />
                      </View>
                      {!isPremium && (
                        <View style={styles.proBadge}>
                          <Text style={styles.proBadgeText}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.aiTitle, { color: c.text }, androidTextFix]} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={[styles.aiSub, { color: c.textMuted }, androidTextFix]} numberOfLines={2}>
                      {sub}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {week ? (
              <View style={[styles.card, styles.section, softShadow('sm'), { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.weekHead}>
                  <Text style={[styles.cardTitle, { color: c.textSecondary, marginBottom: 0 }, androidTextFix]}>
                    {strings.weekProgress}
                  </Text>
                  <Text style={[{ color: c.primary, fontWeight: '700', fontSize: FontSize.sm }, androidTextFix]}>
                    {strings.streakLabel} {week.streak}🔥
                  </Text>
                </View>
                <Text style={[{ color: c.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.md }, androidTextFix]}>
                  {strings.avgKcal}: {week.avgCalories} kcal
                </Text>
                <View style={styles.weekBars}>
                  {week.days.map((d) => {
                    const isDayFeast = isFeastDay(d.date);
                    const h = Math.max(4, Math.round((d.calories / weekMax) * 64));
                    const label = d.date.slice(8);
                    return (
                      <View key={d.date} style={styles.weekCol}>
                        <View
                          style={[
                            styles.weekBar,
                            {
                              height: h,
                              backgroundColor: isDayFeast
                                ? '#FF9500'
                                : d.logged
                                ? c.primary
                                : isDark
                                ? '#2A2F3A'
                                : '#ECECE8',
                            },
                          ]}
                        />
                        <Text
                          style={{
                            color: isDayFeast ? '#FF9500' : c.textMuted,
                            fontSize: 10,
                            fontWeight: isDayFeast ? '700' : '400',
                          }}
                        >
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : !extrasLoaded ? (
              <View style={[styles.card, styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.weekHead}>
                  <SkeletonBone width={120} height={14} />
                  <SkeletonBone width={64} height={14} />
                </View>
                <SkeletonBone width={110} height={10} style={{ marginBottom: Spacing.md }} />
                <View style={styles.weekBars}>
                  {[36, 52, 28, 60, 44, 20, 48].map((h, i) => (
                    <View key={i} style={styles.weekCol}>
                      <SkeletonBone width={14} height={h} radius={4} />
                      <SkeletonBone width={12} height={8} radius={3} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View
              style={[
                styles.card,
                styles.section,
                styles.waterRow,
                softShadow('sm'),
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: c.textSecondary, marginBottom: 4 }, androidTextFix]}>
                  {strings.waterTitle}
                </Text>
                {extrasLoaded ? (
                  <Text style={[{ color: c.text, fontWeight: '700', fontSize: FontSize.lg }, androidTextFix]}>
                    {Math.min(water.totalMl, water.goalMl)} / {water.goalMl} ml
                  </Text>
                ) : (
                  <SkeletonBone width={110} height={20} style={{ marginTop: 2 }} />
                )}
              </View>
              <Pressable
                onPress={addWater}
                disabled={waterFull || addingWater}
                style={({ pressed }) => [
                  styles.waterBtn,
                  {
                    backgroundColor: waterFull ? c.textMuted : c.primary,
                    opacity: addingWater ? 0.6 : pressed && !waterFull ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {waterFull ? strings.waterFull : strings.addWater}
                </Text>
              </Pressable>
            </View>

            <View style={[styles.sectionHead, styles.section]}>
              <Text style={[styles.sectionTitle, { color: c.text }, androidTextFix]}>{mealsTitle}</Text>
              <Pressable onPress={() => router.push('/(tabs)/diary')} hitSlop={8}>
                <Text style={[styles.seeAll, { color: c.primary }, androidTextFix]}>{strings.seeAll}</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.card,
                styles.section,
                softShadow('sm'),
                { backgroundColor: c.card, borderColor: c.border, paddingVertical: 4 },
              ]}
            >
              {todayFoods.length === 0 ? (
                <View style={styles.empty}>
                  <View style={[styles.emptyIcon, { backgroundColor: c.cardHover }]}>
                    <Utensils color={c.textMuted} size={22} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: c.text }]}>{strings.noFoodLogged}</Text>
                  <Text style={[styles.emptySub, { color: c.textMuted }]}>
                    {strings.scanFoodDesc}
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
                          {strings.protein} {row.protein}g · {strings.carbs} {row.carbs}g · {strings.fat} {row.fat}g
                        </Text>
                      </View>
                      <ChevronRight color={c.textMuted} size={16} />
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>

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
              <Text style={styles.detailBtnText}>{strings.openInDiary}</Text>
            </Pressable>
          </View>
        ) : null}
      </CustomModal>

      <StatusBarScrim color={c.background} />
    </View>
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
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
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
  aiHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dailyAlert: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.sm,
  },
  dailyAlertText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    lineHeight: 19,
  },
  dailyDisclaimer: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  aiRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  aiCard: {
    flex: 1,
    padding: Spacing.lg,
  },
  aiCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  aiSub: {
    fontSize: FontSize.xs,
    lineHeight: 16,
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
  },
  weekCol: { flex: 1, alignItems: 'center' },
  weekBar: { width: '70%', borderRadius: 6, minHeight: 4, marginBottom: 4 },
  waterRow: { flexDirection: 'row', alignItems: 'center' },
  waterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.full,
    marginLeft: Spacing.md,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  sideStats: { flex: 1, marginLeft: Spacing.xl },
  statBlock: { marginVertical: 6 },
  statVal: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    letterSpacing: -0.5,
    ...androidTextFix,
  },
  statLabel: { fontSize: FontSize.xs, fontWeight: '500', marginTop: 2, ...androidTextFix },
  statDivider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAll: { fontSize: FontSize.sm, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '600', marginBottom: 4 },
  emptySub: { fontSize: FontSize.sm },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  foodImg: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: Spacing.md,
  },
  foodImgPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  foodName: { fontSize: FontSize.md, fontWeight: '700', ...androidTextFix },
  foodMeta: { fontSize: FontSize.xs, marginTop: 2, ...androidTextFix },
  foodMacros: { fontSize: 11, marginTop: 3, ...androidTextFix },
  foodRight: { alignItems: 'flex-end', minWidth: 48 },
  foodKcal: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.4,
    ...androidTextFix,
  },
  foodKcalUnit: { fontSize: 10, fontWeight: '500', ...androidTextFix },
  detail: { alignItems: 'center' },
  detailImg: {
    width: '100%',
    height: 160,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  detailImgPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  detailName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    ...androidTextFix,
  },
  detailMeal: { fontSize: FontSize.sm, marginTop: 4, marginBottom: Spacing.md, ...androidTextFix },
  detailCalBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  detailCal: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    ...androidTextFix,
  },
  detailCalUnit: { fontSize: FontSize.md, fontWeight: '600', marginLeft: 6, ...androidTextFix },
  detailMacros: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: Spacing.md,
  },
  chip: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  chipVal: { fontSize: FontSize.md, fontWeight: '700', ...androidTextFix },
  chipLabel: { fontSize: 11, fontWeight: '500', marginTop: 2, ...androidTextFix },
  detailBtn: {
    width: '100%',
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  detailBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700', ...androidTextFix },
  feastBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feastBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feastBannerTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    ...androidTextFix,
  },
  feastBannerSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
    ...androidTextFix,
  },
  feastBalanceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  feastBalanceBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: '700',
    ...androidTextFix,
  },
  balanceHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  feastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  feastBannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  feastDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  feastDetailsText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    ...androidTextFix,
  },
});
