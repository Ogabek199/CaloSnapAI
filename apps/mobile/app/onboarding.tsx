import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Flame,
  Scale,
  Dumbbell,
  Check,
  Bell,
} from 'lucide-react-native';
import { useAppStore } from '../src/store/useAppStore';
import { useDiaryStore } from '../src/store/useDiaryStore';
import { useToastStore } from '../src/store/useToastStore';
import { Language } from '../src/shared/i18n/translations';
import { NotificationService } from '../src/shared/notifications/notification.service';
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

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

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
  const {
    user,
    updateUserStats,
    setOnboardingCompleted,
    setMealRemindersEnabled,
    language,
    setLanguage,
    theme,
    t,
  } = useAppStore();
  const { setCalorieGoal, refreshDiary } = useDiaryStore();
  const { showToast } = useToastStore();

  const strings = t();
  const colors = theme();

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
    return {
      calories,
      protein: Math.round((calories * 0.25) / 4),
      carbs: Math.round((calories * 0.5) / 4),
      fat: Math.round((calories * 0.25) / 9),
    };
  }, [age, weight, height, gender, activity, goal]);

  const stepMeta: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: 'Tilni tanlang',
      subtitle: 'Ilova qaysi tilda ishlasini tanlang',
    },
    2: {
      title: 'Maqsadingiz nima?',
      subtitle: 'Kaloriya me’yorini shunga qarab hisoblaymiz',
    },
    3: {
      title: 'Jins va yosh',
      subtitle: 'BMR hisobi uchun kerak (faqat sizga ko‘rinadi)',
    },
    4: {
      title: 'Vazn va bo‘y',
      subtitle: 'Kunlik kaloriya me’yorini aniq hisoblash uchun',
    },
    5: {
      title: 'Faollik darajasi',
      subtitle: 'Kunlik harakatingiz TDEE ga ta’sir qiladi',
    },
    6: {
      title: 'Rejangiz tayyor',
      subtitle: 'Shaxsiy kunlik norma hisoblandi',
    },
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < TOTAL_STEPS) setStep(step + 1);
    else handleFinish();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await ApiClient.saveGoals({
        age,
        gender,
        weightKg: weight,
        heightCm: height,
        activityLevel: activity,
        goal,
      });
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(e?.message || 'Maqsadlarni saqlashda xatolik. Qayta urinib ko‘ring.', 'error');
      setFinishing(false);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCalorieGoal(plan.calories);
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
      if (enableReminders) await NotificationService.scheduleMealReminders(language);
      else await NotificationService.cancelMealReminders();
    } catch {}

    setOnboardingCompleted(true);
    await refreshDiary();
    showToast('Shaxsiy rejangiz saqlandi!', 'success');
    setFinishing(false);
    router.replace('/(tabs)');
  };

  const ageOptions = Array.from({ length: 67 }, (_, i) => ({ label: `${i + 14}`, value: i + 14 }));
  const weightOptions = Array.from({ length: 141 }, (_, i) => ({ label: `${i + 40}`, value: i + 40 }));
  const heightOptions = Array.from({ length: 101 }, (_, i) => ({ label: `${i + 120}`, value: i + 120 }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {step > 1 ? (
            <Pressable
              onPress={handleBack}
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ChevronLeft color={colors.text} size={22} />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
            {step} / {TOTAL_STEPS}
          </Text>
          <View style={{ width: 40 }} />
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
              title="Vazn tashlash"
              subtitle="Kuniga ~400 kcal defitsit"
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
              title="Vaznni saqlash"
              subtitle="Balanslangan kaloriya"
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
              title="Mushak massasi"
              subtitle="Kuniga ~350 kcal profitsit"
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
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Jins</Text>
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
                      {g === 'MALE' ? 'Erkak' : 'Ayol'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
              Yosh
            </Text>
            <Pressable
              onPress={() => setWheel('age')}
              style={[styles.valueBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.valueNum, { color: colors.text }]}>{age}</Text>
              <Text style={[styles.valueUnit, { color: colors.textMuted }]}>yosh</Text>
            </Pressable>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stack}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Vazn</Text>
            <Pressable
              onPress={() => setWheel('weight')}
              style={[styles.valueBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.valueNum, { color: colors.text }]}>{weight}</Text>
              <Text style={[styles.valueUnit, { color: colors.textMuted }]}>kg</Text>
            </Pressable>

            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
              Bo‘y
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
              title="Kam harakatli"
              subtitle="Asosan o‘tirib ishlash"
              onPress={() => {
                Haptics.selectionAsync();
                setActivity('SEDENTARY');
              }}
              colors={colors}
            />
            <OptionCard
              selected={activity === 'LIGHT'}
              title="Yengil faol"
              subtitle="Haftada 1–3 marta yengil mashq"
              onPress={() => {
                Haptics.selectionAsync();
                setActivity('LIGHT');
              }}
              colors={colors}
            />
            <OptionCard
              selected={activity === 'MODERATE'}
              title="O‘rtacha faol"
              subtitle="Haftada 3–5 marta mashq / ko‘p yurish"
              onPress={() => {
                Haptics.selectionAsync();
                setActivity('MODERATE');
              }}
              colors={colors}
            />
            <OptionCard
              selected={activity === 'VERY_ACTIVE'}
              title="Yuqori faollik"
              subtitle="Har kuni intensiv mashg‘ulot"
              onPress={() => {
                Haptics.selectionAsync();
                setActivity('VERY_ACTIVE');
              }}
              colors={colors}
            />
            <OptionCard
              selected={activity === 'EXTRA_ACTIVE'}
              title="Juda faol"
              subtitle="Jismoniy ish + kunlik mashq"
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
              <Text style={[styles.planLabel, { color: colors.textMuted }]}>Kunlik kaloriya me’yori</Text>
              <Text style={[styles.planCal, { color: colors.primary }]}>{plan.calories}</Text>
              <Text style={[styles.planUnit, { color: colors.textSecondary }]}>kcal / kun</Text>
              <View style={styles.macroRow}>
                <MacroChip label="Oqsil" value={`${plan.protein}g`} color={colors.protein} />
                <MacroChip label="Uglevod" value={`${plan.carbs}g`} color={colors.carbs} />
                <MacroChip label="Yog‘" value={`${plan.fat}g`} color={colors.fat} />
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
                <Text style={[styles.optionTitle, { color: colors.text }]}>Ovqatlanish eslatmalari</Text>
                <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                  08:30 · 13:00 · 19:30 — ixtiyoriy
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

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Button
          title={step === TOTAL_STEPS ? 'Boshlash' : 'Davom etish'}
          onPress={handleNext}
          loading={finishing}
        />
      </View>

      <WheelSelectModal
        visible={wheel != null}
        title={wheel === 'age' ? 'Yosh' : wheel === 'weight' ? 'Vazn (kg)' : 'Bo‘y (cm)'}
        options={wheel === 'age' ? ageOptions : wheel === 'weight' ? weightOptions : heightOptions}
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
  stepLabel: { fontSize: FontSize.sm, fontWeight: '600' },
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
    lineHeight: 40,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  valueUnit: {
    fontSize: FontSize.md,
    fontWeight: '500',
    lineHeight: 40,
    includeFontPadding: false,
    textAlignVertical: 'center',
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
