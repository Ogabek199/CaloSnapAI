import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Flame,
  Scale,
  Dumbbell,
  Check,
  Bell,
  LogOut,
} from 'lucide-react-native';
import { useAppStore, usePalette, useStrings } from '../src/store/useAppStore';
import { useDiaryStore } from '../src/store/useDiaryStore';
import { useToastStore } from '../src/store/useToastStore';
import { LANGUAGES } from '../src/shared/i18n/languages';
import { ApiClient } from '../src/shared/api/api-client';
import { Button } from '../src/shared/ui/Button';
import { WheelSelectModal } from '../src/shared/ui/WheelSelectModal';
import { Radius, Spacing, FontSize, softShadow } from '../src/shared/theme/spacing';
import { ActivityLevel } from '@eda/types';

type GoalType = 'LOSE_WEIGHT' | 'MAINTAIN' | 'BUILD_MUSCLE';
type GenderType = 'MALE' | 'FEMALE';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
};

/**
 * Onboarding collects nutrition-profile data (NOT account credentials):
 * 1. Language
 * 2. Fitness goal
 * 3. Gender + age
 * 4. Weight + height
 * 5. Activity level
 * 6. Plan summary + meal reminders
 */
const TOTAL_STEPS = 6;

const AGE_OPTIONS = Array.from({ length: 67 }, (_, i) => ({ label: `${i + 14}`, value: i + 14 }));
const WEIGHT_OPTIONS = Array.from({ length: 141 }, (_, i) => ({ label: `${i + 40}`, value: i + 40 }));
const HEIGHT_OPTIONS = Array.from({ length: 101 }, (_, i) => ({ label: `${i + 120}`, value: i + 120 }));

const dropLeadingEmoji = (s: string) => s.replace(/^[^A-Za-z\u00C0-\u024F\u0400-\u04FF\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF0-9]+/, '');

function OptionCard({
  selected,
  title,
  subtitle,
  icon,
  onPress,
  colors,
}: {
  selected: boolean;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  colors: ReturnType<ReturnType<typeof useAppStore.getState>['theme']>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionCard,
        {
          backgroundColor: selected ? colors.primaryBg : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
        softShadow('sm'),
      ]}
    >
      <View style={styles.optionLeft}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.optionSub, { color: colors.textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {selected ? (
        <View style={[styles.check, { backgroundColor: colors.primary }]}>
          <Check color="#FFF" size={14} strokeWidth={3} />
        </View>
      ) : (
        <View style={[styles.checkEmpty, { borderColor: colors.border }]} />
      )}
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const language = useAppStore((s) => s.language);
  const updateUserStats = useAppStore((s) => s.updateUserStats);
  const setOnboardingCompleted = useAppStore((s) => s.setOnboardingCompleted);
  const setMealRemindersEnabled = useAppStore((s) => s.setMealRemindersEnabled);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const logout = useAppStore((s) => s.logout);
  const setCalorieGoal = useDiaryStore((s) => s.setCalorieGoal);
  const refreshDiary = useDiaryStore((s) => s.refreshDiary);
  const showToast = useToastStore((s) => s.showToast);
  const insets = useSafeAreaInsets();

  const strings = useStrings();
  const colors = usePalette();
  const finishingRef = useRef(false);

  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<GoalType>(user.fitnessGoal || 'LOSE_WEIGHT');
  const [gender, setGender] = useState<GenderType>(user.gender || 'MALE');
  const [age, setAge] = useState(user.age || 25);
  const [weight, setWeight] = useState(user.weightKg || 70);
  const [height, setHeight] = useState(user.heightCm || 170);
  const [activity, setActivity] = useState<ActivityLevel>(user.activityLevel || 'MODERATE');
  const [enableReminders, setEnableReminders] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [wheel, setWheel] = useState<'age' | 'weight' | 'height' | null>(null);

  const plan = useMemo(() => {
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'MALE' ? 5 : -161;
    const multiplier = ACTIVITY_MULTIPLIERS[activity] || 1.55;
    const tdee = bmr * multiplier;
    let target = tdee;
    if (goal === 'LOSE_WEIGHT') target = tdee - 400;
    if (goal === 'BUILD_MUSCLE') target = tdee + 350;
    const calories = Math.max(1200, Math.round(target));
    // Mirrors GoalsService.calculateTDEE so the preview matches what the server stores.
    const protein = Math.round(weight * 2);
    const fat = Math.round((calories * 0.25) / 9);
    return {
      calories,
      protein,
      carbs: Math.max(0, Math.round((calories - (protein * 4 + fat * 9)) / 4)),
      fat,
    };
  }, [age, weight, height, gender, activity, goal]);

  const stepMeta: Record<number, { title: string; subtitle: string }> = {
    1: { title: strings.welcomeTitle, subtitle: strings.welcomeSubtitle },
    2: { title: strings.goalTitle, subtitle: strings.goalSubtitle },
    3: { title: strings.statsTitle, subtitle: strings.statsSubtitle },
    4: { title: strings.statsTitle, subtitle: strings.statsSubtitle },
    5: { title: strings.activityTitle, subtitle: strings.activitySubtitle },
    6: { title: strings.readyTitle, subtitle: strings.readySubtitle },
  };

  const handleNext = () => {
    if (finishingRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < TOTAL_STEPS) setStep(step + 1);
    else handleFinish();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) setStep(step - 1);
  };

  useEffect(() => {
    if (step <= 1) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!finishingRef.current) setStep((s) => Math.max(1, s - 1));
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const handleFinish = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    let serverCalories: number | undefined;
    try {
      const res = await ApiClient.saveGoals({
        age,
        gender,
        weightKg: weight,
        heightCm: height,
        activityLevel: activity,
        goal,
      });
      serverCalories =
        res?.calculatedGoals?.dailyCalories ?? res?.profile?.dailyCalorieGoal ?? undefined;
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(e?.message || strings.goalsSaveFailed, 'error');
      finishingRef.current = false;
      setFinishing(false);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCalorieGoal(serverCalories && serverCalories > 0 ? serverCalories : plan.calories);
    updateUserStats({
      fitnessGoal: goal,
      gender,
      age,
      weightKg: weight,
      heightCm: height,
      activityLevel: activity,
    });
    setMealRemindersEnabled(enableReminders);
    try {
      const { NotificationService } = await import(
        '../src/shared/notifications/notification.service'
      );
      if (enableReminders) await NotificationService.scheduleMealReminders(language);
      else await NotificationService.cancelMealReminders();
    } catch {}

    setOnboardingCompleted(true);
    void refreshDiary();
    showToast(strings.saved, 'success');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
            {step} / {TOTAL_STEPS}
          </Text>
          {step > 1 ? (
            <Pressable
              onPress={handleBack}
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ChevronLeft color={colors.text} size={22} />
            </Pressable>
          ) : (
            <Pressable
              onPress={logout}
              hitSlop={8}
              disabled={finishing}
              style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <LogOut color={colors.textMuted} size={16} />
              <Text style={[styles.logoutText, { color: colors.textMuted }]}>{strings.logout}</Text>
            </Pressable>
          )}
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.cardHover }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${(step / TOTAL_STEPS) * 100}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>{stepMeta[step].title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {stepMeta[step].subtitle}
        </Text>

        {step === 1 && (
          <View style={styles.stack}>
            {LANGUAGES.map((lang) => (
              <OptionCard
                key={lang.code}
                selected={language === lang.code}
                title={`${lang.flag}  ${lang.label}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setLanguage(lang.code);
                }}
                colors={colors}
              />
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stack}>
            <OptionCard
              selected={goal === 'LOSE_WEIGHT'}
              title={dropLeadingEmoji(strings.loseWeight)}
              subtitle={strings.loseWeightDesc}
              icon={
                <View style={[styles.iconBox, { backgroundColor: colors.secondaryBg }]}>
                  <Flame color={colors.secondary} size={20} />
                </View>
              }
              onPress={() => {
                Haptics.selectionAsync();
                setGoal('LOSE_WEIGHT');
              }}
              colors={colors}
            />
            <OptionCard
              selected={goal === 'MAINTAIN'}
              title={dropLeadingEmoji(strings.maintain)}
              subtitle={strings.maintainDesc}
              icon={
                <View style={[styles.iconBox, { backgroundColor: colors.primaryBg }]}>
                  <Scale color={colors.primary} size={20} />
                </View>
              }
              onPress={() => {
                Haptics.selectionAsync();
                setGoal('MAINTAIN');
              }}
              colors={colors}
            />
            <OptionCard
              selected={goal === 'BUILD_MUSCLE'}
              title={dropLeadingEmoji(strings.buildMuscle)}
              subtitle={strings.buildMuscleDesc}
              icon={
                <View style={[styles.iconBox, { backgroundColor: colors.infoBg }]}>
                  <Dumbbell color={colors.info} size={20} />
                </View>
              }
              onPress={() => {
                Haptics.selectionAsync();
                setGoal('BUILD_MUSCLE');
              }}
              colors={colors}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stack}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{strings.genderLabel}</Text>
            <View style={styles.row2}>
              {(['MALE', 'FEMALE'] as const).map((g) => {
                const selected = gender === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setGender(g);
                    }}
                    style={[
                      styles.halfBtn,
                      {
                        backgroundColor: selected ? colors.primaryBg : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.halfBtnText, { color: colors.text }]}>
                      {g === 'MALE' ? strings.male : strings.female}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
              {strings.ageLabel}
            </Text>
            <Pressable
              onPress={() => setWheel('age')}
              style={[styles.valueBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.valueNum, { color: colors.text }]}>{age}</Text>
              <Text style={[styles.valueUnit, { color: colors.textMuted }]}>{strings.yearsOld}</Text>
            </Pressable>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stack}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{strings.weightLabel}</Text>
            <Pressable
              onPress={() => setWheel('weight')}
              style={[styles.valueBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.valueNum, { color: colors.text }]}>{weight}</Text>
              <Text style={[styles.valueUnit, { color: colors.textMuted }]}>kg</Text>
            </Pressable>

            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
              {strings.heightLabel}
            </Text>
            <Pressable
              onPress={() => setWheel('height')}
              style={[styles.valueBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.valueNum, { color: colors.text }]}>{height}</Text>
              <Text style={[styles.valueUnit, { color: colors.textMuted }]}>cm</Text>
            </Pressable>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stack}>
            <OptionCard
              selected={activity === 'SEDENTARY'}
              title={strings.sedentaryTitle}
              subtitle={strings.sedentaryDesc}
              onPress={() => {
                Haptics.selectionAsync();
                setActivity('SEDENTARY');
              }}
              colors={colors}
            />
            <OptionCard
              selected={activity === 'LIGHT'}
              title={strings.lightActiveTitle}
              subtitle={strings.lightActiveDesc}
              onPress={() => {
                Haptics.selectionAsync();
                setActivity('LIGHT');
              }}
              colors={colors}
            />
            <OptionCard
              selected={activity === 'MODERATE'}
              title={strings.moderateTitle}
              subtitle={strings.moderateDesc}
              onPress={() => {
                Haptics.selectionAsync();
                setActivity('MODERATE');
              }}
              colors={colors}
            />
            <OptionCard
              selected={activity === 'VERY_ACTIVE'}
              title={strings.highActiveTitle}
              subtitle={strings.highActiveDesc}
              onPress={() => {
                Haptics.selectionAsync();
                setActivity('VERY_ACTIVE');
              }}
              colors={colors}
            />
            <OptionCard
              selected={activity === 'EXTRA_ACTIVE'}
              title={strings.veryActiveTitle}
              subtitle={strings.veryActiveDesc}
              onPress={() => {
                Haptics.selectionAsync();
                setActivity('EXTRA_ACTIVE');
              }}
              colors={colors}
            />
          </View>
        )}

        {step === 6 && (
          <View style={styles.stack}>
            <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }, softShadow('sm')]}>
              <Text style={[styles.planLabel, { color: colors.textMuted }]}>{strings.dailyNorm}</Text>
              <Text style={[styles.planCal, { color: colors.primary }]}>{plan.calories}</Text>
              <Text style={[styles.planUnit, { color: colors.textSecondary }]}>{strings.kcalDay}</Text>
              <View style={styles.macroRow}>
                <MacroChip label={strings.protein} value={`${plan.protein}g`} color={colors.protein} />
                <MacroChip label={strings.carbs} value={`${plan.carbs}g`} color={colors.carbs} />
                <MacroChip label={strings.fat} value={`${plan.fat}g`} color={colors.fat} />
              </View>
            </View>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setEnableReminders(!enableReminders);
              }}
              style={[
                styles.remindCard,
                {
                  backgroundColor: enableReminders ? colors.primaryBg : colors.card,
                  borderColor: enableReminders ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primaryBg }]}>
                <Bell color={colors.primary} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{strings.mealRemindersTitle}</Text>
                <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                  {strings.mealRemindersSub}
                </Text>
              </View>
              {enableReminders ? (
                <View style={[styles.check, { backgroundColor: colors.primary }]}>
                  <Check color="#FFF" size={14} strokeWidth={3} />
                </View>
              ) : (
                <View style={[styles.checkEmpty, { borderColor: colors.border }]} />
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: Spacing.xl + insets.bottom,
          },
        ]}
      >
        <Button
          title={step === TOTAL_STEPS ? strings.startAppBtn : strings.nextBtn}
          onPress={handleNext}
          loading={finishing}
        />
      </View>

      <WheelSelectModal
        visible={wheel != null}
        title={wheel === 'age' ? strings.ageLabel : wheel === 'weight' ? strings.weightLabel : strings.heightLabel}
        options={wheel === 'age' ? AGE_OPTIONS : wheel === 'weight' ? WEIGHT_OPTIONS : HEIGHT_OPTIONS}
        selectedValue={wheel === 'age' ? age : wheel === 'weight' ? weight : height}
        unit={wheel === 'age' ? '' : wheel === 'weight' ? 'kg' : 'cm'}
        onClose={() => setWheel(null)}
        onValueChange={(v) => {
          if (wheel === 'age') setAge(Number(v));
          if (wheel === 'weight') setWeight(Number(v));
          if (wheel === 'height') setHeight(Number(v));
        }}
        onConfirm={() => setWheel(null)}
      />
    </SafeAreaView>
  );
}

function MacroChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.chipVal, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  headerSpacer: { width: 40, height: 40 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40 },
  logoutText: { fontSize: FontSize.sm, fontWeight: '600' },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  stack: { gap: Spacing.md },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: Spacing.md,
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionTitle: { fontSize: FontSize.md, fontWeight: '700' },
  optionSub: { fontSize: FontSize.sm, marginTop: 2, lineHeight: 18 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  halfBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfBtnText: { fontSize: FontSize.md, fontWeight: '600' },
  valueBtn: {
    height: 72,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  valueNum: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    includeFontPadding: false,
  },
  valueUnit: {
    fontSize: FontSize.md,
    fontWeight: '500',
    includeFontPadding: false,
  },
  planCard: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  planLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  planCal: { fontSize: 48, fontWeight: '800', letterSpacing: -1.5, marginTop: 4 },
  planUnit: { fontSize: FontSize.sm, marginBottom: Spacing.lg },
  macroRow: { flexDirection: 'row', gap: Spacing.lg },
  chip: { alignItems: 'center', gap: 2 },
  chipVal: { fontSize: FontSize.md, fontWeight: '700' },
  chipLabel: { fontSize: 11, color: '#8B939E' },
  remindCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
