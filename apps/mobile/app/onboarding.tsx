import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import {
  Flame,
  Scale,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  ChevronDown,
  X,
  User,
  Search,
  Sun,
  Moon,
  Globe,
  Bell,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import { useAppStore } from '../src/store/useAppStore';
import { useDiaryStore } from '../src/store/useDiaryStore';
import { useToastStore } from '../src/store/useToastStore';
import { Language } from '../src/shared/i18n/translations';
import { CustomModal } from '../src/shared/ui/CustomModal';
import { NotificationService } from '../src/shared/notifications/notification.service';

type GoalType = 'LOSE_WEIGHT' | 'MAINTAIN' | 'BUILD_MUSCLE';
type GenderType = 'MALE' | 'FEMALE';
type ActivityType = 'SEDENTARY' | 'MODERATE' | 'VERY_ACTIVE';

interface CountryItem {
  code: string;
  flag: string;
  name: string;
  maxDigits: number;
}

const COUNTRIES: CountryItem[] = [
  { code: '+998', flag: '🇺🇿', name: "O'zbekiston", maxDigits: 9 },
  { code: '+7', flag: '🇷🇺', name: 'Rossiya', maxDigits: 10 },
  { code: '+7', flag: '🇰🇿', name: "Qozog'iston", maxDigits: 10 },
  { code: '+996', flag: '🇰🇬', name: "Qirg'iziston", maxDigits: 9 },
  { code: '+992', flag: '🇹🇯', name: 'Tojikiston', maxDigits: 9 },
  { code: '+993', flag: '🇹🇲', name: 'Turkmaniston', maxDigits: 8 },
  { code: '+90', flag: '🇹🇷', name: 'Turkiya', maxDigits: 10 },
  { code: '+971', flag: '🇦🇪', name: 'BAA (Dubai)', maxDigits: 9 },
  { code: '+1', flag: '🇺🇸', name: 'AQSH / Kanada', maxDigits: 10 },
  { code: '+82', flag: '🇰🇷', name: 'Janubiy Koreya', maxDigits: 10 },
  { code: '+49', flag: '🇩🇪', name: 'Germaniya', maxDigits: 10 },
  { code: '+44', flag: '🇬🇧', name: 'Buyuk Britaniya', maxDigits: 10 },
];

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    user,
    login,
    updateUserStats,
    setOnboardingCompleted,
    setMealRemindersEnabled,
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    t,
  } = useAppStore();
  const { setCalorieGoal } = useDiaryStore();
  const { showToast } = useToastStore();

  const strings = t();
  const isDark = themeMode === 'dark';

  const [step, setStep] = useState<number>(1);
  const TOTAL_STEPS = 7;

  // Language Modal State
  const [langModalVisible, setLangModalVisible] = useState<boolean>(false);
  // Reminder Custom Modal State
  const [reminderModalVisible, setReminderModalVisible] = useState<boolean>(false);
  const [reminderLoading, setReminderLoading] = useState<boolean>(false);

  // Form State - name and phone
  const [name, setName] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(COUNTRIES[0]);
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [countryModalVisible, setCountryModalVisible] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');

  const [goal, setGoal] = useState<GoalType>(user.fitnessGoal || 'LOSE_WEIGHT');
  const [gender, setGender] = useState<GenderType>(user.gender || 'MALE');
  const [age, setAge] = useState<number>(user.age || 25);
  const [weight, setWeight] = useState<number>(user.weightKg || 80);
  const [height, setHeight] = useState<number>(user.heightCm || 180);
  const [activity, setActivity] = useState<ActivityType>(user.activityLevel || 'MODERATE');

  // Smart phone auto-formatter strictly bounded by maxDigits
  const formatPhoneNumber = (digits: string, country: CountryItem) => {
    const clean = digits.replace(/\D/g, '').slice(0, country.maxDigits);

    if (country.code === '+998') {
      if (clean.length <= 2) return clean;
      if (clean.length <= 5) return `${clean.slice(0, 2)} ${clean.slice(2)}`;
      if (clean.length <= 7) return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5)}`;
      return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)}`;
    }

    if (country.code === '+7') {
      if (clean.length <= 3) return clean;
      if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      if (clean.length <= 8) return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
      return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`;
    }

    if (country.code === '+993') {
      if (clean.length <= 2) return clean;
      if (clean.length <= 5) return `${clean.slice(0, 2)} ${clean.slice(2)}`;
      return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 8)}`;
    }

    if (country.code === '+996' || country.code === '+992') {
      if (clean.length <= 3) return clean;
      if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
    }

    if (country.code === '+971') {
      if (clean.length <= 2) return clean;
      if (clean.length <= 5) return `${clean.slice(0, 2)} ${clean.slice(2)}`;
      return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 9)}`;
    }

    if (country.code === '+1') {
      if (clean.length <= 3) return clean;
      if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 10)}`;
    }

    if (country.code === '+90') {
      if (clean.length <= 3) return clean;
      if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      if (clean.length <= 8) return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
      return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`;
    }

    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, country.maxDigits)}`;
  };

  const getPhonePlaceholder = (country: CountryItem) => {
    if (country.code === '+998') return '90 123 45 67';
    if (country.code === '+7') return '900 123 45 67';
    if (country.code === '+1') return '202 555 0123';
    if (country.code === '+90') return '500 123 45 67';
    if (country.code === '+993') return '65 123 456';
    if (country.code === '+996') return '700 123 456';
    if (country.code === '+971') return '50 123 4567';
    return '90 123 45 67';
  };

  // Real TDEE & Macro Calculations
  const calculatePlan = () => {
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'MALE' ? 5 : -161;

    let multiplier = 1.55;
    if (activity === 'SEDENTARY') multiplier = 1.2;
    if (activity === 'MODERATE') multiplier = 1.55;
    if (activity === 'VERY_ACTIVE') multiplier = 1.725;

    let tdee = bmr * multiplier;
    let target = tdee;

    if (goal === 'LOSE_WEIGHT') target = tdee - 400;
    if (goal === 'BUILD_MUSCLE') target = tdee + 350;

    const finalCalories = Math.max(1200, Math.round(target));

    const proteinGrams = Math.round((finalCalories * 0.25) / 4);
    const carbsGrams = Math.round((finalCalories * 0.50) / 4);
    const fatGrams = Math.round((finalCalories * 0.25) / 9);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calories: finalCalories,
      protein: proteinGrams,
      carbs: carbsGrams,
      fat: fatGrams,
    };
  };

  const plan = calculatePlan();

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validate Step 1 (Phone & Name)
    if (step === 1) {
      const rawDigits = phone.replace(/\D/g, '');
      if (rawDigits.length < selectedCountry.maxDigits) {
        showToast(
          strings.phoneError || `Iltimos, to‘liq ${selectedCountry.maxDigits} xonali telefon raqam kiriting`,
          'warning'
        );
        return;
      }
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleFinish(true);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async (enableNotifications: boolean = true) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const rawDigits = phone.replace(/\D/g, '').slice(0, selectedCountry.maxDigits);
    const fullPhone = `${selectedCountry.code} ${rawDigits}`;
    const displayName = name.trim() || strings.namePlaceholder?.split(':')[1]?.trim() || 'Foydalanuvchi';

    login(fullPhone, displayName, 'active-session-token', fullPhone);
    setCalorieGoal(plan.calories);
    updateUserStats({
      name: displayName,
      phone: fullPhone,
      fitnessGoal: goal,
      gender,
      age,
      weightKg: weight,
      heightCm: height,
      activityLevel: activity,
    });

    setMealRemindersEnabled(enableNotifications);
    if (enableNotifications) {
      try {
        await NotificationService.scheduleMealReminders(language);
      } catch (e) {}
    } else {
      try {
        await NotificationService.cancelMealReminders();
      } catch (e) {}
    }

    setOnboardingCompleted(true);
    router.replace('/(tabs)');
  };

  const toggleTheme = () => {
    Haptics.selectionAsync();
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const progressPercent = (step / TOTAL_STEPS) * 100;

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch)
  );

  const maxFormattedLength = formatPhoneNumber(
    '9'.repeat(selectedCountry.maxDigits),
    selectedCountry
  ).length;

  // Dynamic Theme Colors
  const themeBg = isDark ? '#0A0E1A' : '#F8FAFC';
  const themeCardBg = isDark ? '#121A2B' : '#FFFFFF';
  const themeInputBg = isDark ? '#0A0E1A' : '#F1F5F9';
  const themeTextColor = isDark ? '#F8FAFC' : '#0F172A';
  const themeSubTextColor = isDark ? '#94A3B8' : '#64748B';
  const themeBorderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const themeCardBorder = isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeBg }]}>
      {/* Top Header & Controls Row */}
      <View style={styles.topHeader}>
        <View style={styles.topNavRow}>
          {/* Back Button or placeholder */}
          {step > 1 ? (
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: themeCardBg, borderColor: themeBorderColor },
              ]}
              onPress={handleBack}
            >
              <ChevronLeft color={themeTextColor} size={22} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          {/* Step Badge */}
          <View
            style={[
              styles.stepBadge,
              { backgroundColor: themeCardBg, borderColor: themeBorderColor },
            ]}
          >
            <Text style={styles.stepBadgeText}>
              {strings.onboardingStep || 'Qadam'} {step} / {TOTAL_STEPS}
            </Text>
          </View>

          {/* Controls: Language & Theme Mode */}
          <View style={styles.headerControlsRow}>
            {/* Language Selector Button */}
            <TouchableOpacity
              style={[
                styles.controlPillBtn,
                { backgroundColor: themeCardBg, borderColor: themeBorderColor },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                setLangModalVisible(true);
              }}
            >
              <Text style={styles.controlPillEmoji}>{currentLangObj.flag}</Text>
              <Text style={[styles.controlPillText, { color: themeTextColor }]}>
                {language.toUpperCase()}
              </Text>
            </TouchableOpacity>

            {/* Theme Toggle Button */}
            <TouchableOpacity
              style={[
                styles.themeToggleBtn,
                { backgroundColor: themeCardBg, borderColor: themeBorderColor },
              ]}
              activeOpacity={0.8}
              onPress={toggleTheme}
            >
              {isDark ? (
                <Sun color="#F59E0B" size={18} />
              ) : (
                <Moon color="#10B981" size={18} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar Line */}
        <View
          style={[
            styles.progressBarTrack,
            { backgroundColor: isDark ? '#121A2B' : '#E2E8F0' },
          ]}
        >
          <LinearGradient
            colors={['#00E599', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* =================================================== */}
        {/* STEP 1: PHONE NUMBER & NAME */}
        {/* =================================================== */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: themeTextColor }]}>
              {strings.welcomeTitle || 'Xush kelibsiz! 👋'}
            </Text>
            <Text style={[styles.stepSubtitle, { color: themeSubTextColor }]}>
              {strings.welcomeSubtitle || "Shaxsiy profilingizni shakllantirish uchun ma'lumotlarni kiriting"}
            </Text>

            <View
              style={[
                styles.inputCard,
                { backgroundColor: themeCardBg, borderColor: themeCardBorder },
              ]}
            >
              <Text style={[styles.inputLabel, { color: themeSubTextColor }]}>
                {strings.yourName || 'Ismingiz'}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: themeInputBg, borderColor: themeBorderColor },
                ]}
              >
                <User color={themeSubTextColor} size={18} />
                <TextInput
                  style={[styles.textInput, { color: themeTextColor }]}
                  placeholder={strings.namePlaceholder || 'Masalan: Azizbek'}
                  placeholderTextColor={themeSubTextColor}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View
              style={[
                styles.inputCard,
                { marginTop: 14, backgroundColor: themeCardBg, borderColor: themeCardBorder },
              ]}
            >
              <Text style={[styles.inputLabel, { color: themeSubTextColor }]}>
                {strings.phoneLabel || 'Telefon raqamingiz *'}
              </Text>
              <View style={styles.phoneInputRow}>
                {/* Country Code Trigger Box */}
                <TouchableOpacity
                  style={[
                    styles.countryPickerTrigger,
                    { backgroundColor: themeInputBg, borderColor: themeBorderColor },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCountryModalVisible(true);
                  }}
                >
                  <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                  <Text style={[styles.countryCodeText, { color: themeTextColor }]}>
                    {selectedCountry.code}
                  </Text>
                  <ChevronDown color={themeSubTextColor} size={16} />
                </TouchableOpacity>

                {/* Phone Digits Input */}
                <View
                  style={[
                    styles.phoneDigitsWrapper,
                    { backgroundColor: themeInputBg, borderColor: themeBorderColor },
                  ]}
                >
                  <TextInput
                    style={[styles.textInput, { color: themeTextColor }]}
                    placeholder={getPhonePlaceholder(selectedCountry)}
                    placeholderTextColor={themeSubTextColor}
                    keyboardType="phone-pad"
                    maxLength={maxFormattedLength}
                    value={phone}
                    onChangeText={(val) => {
                      const raw = val
                        .replace(/\D/g, '')
                        .slice(0, selectedCountry.maxDigits);
                      setPhone(formatPhoneNumber(raw, selectedCountry));
                    }}
                  />
                </View>
              </View>
              <Text style={[styles.inputHint, { color: themeSubTextColor }]}>
                {selectedCountry.name}: {selectedCountry.maxDigits} {strings.phoneHint || 'ta raqam kiritiladi'}.
              </Text>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* STEP 2: GOAL SELECTION */}
        {/* =================================================== */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: themeTextColor }]}>
              {strings.goalTitle || 'Asosiy maqsadingiz nima?'}
            </Text>
            <Text style={[styles.stepSubtitle, { color: themeSubTextColor }]}>
              {strings.goalSubtitle || 'Sizga mos kaloriya va taom rejasini tuzib beramiz'}
            </Text>

            <View style={styles.cardsStack}>
              {/* Option 1: Vazn tashlash */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.goalCard,
                  { backgroundColor: themeCardBg, borderColor: themeCardBorder },
                  goal === 'LOSE_WEIGHT' && styles.cardActiveGlow,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGoal('LOSE_WEIGHT');
                }}
              >
                <View style={styles.goalCardHeader}>
                  <View
                    style={[
                      styles.cardIconBox,
                      { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                    ]}
                  >
                    <Flame color="#F59E0B" size={24} fill="#F59E0B" />
                  </View>
                  <View style={styles.badgeOrange}>
                    <Text style={styles.badgeOrangeText}>-400 kcal defitsit</Text>
                  </View>
                </View>
                <Text style={[styles.goalCardTitle, { color: themeTextColor }]}>
                  {strings.loseWeightCardTitle || '🔥 Vazn tashlash'}
                </Text>
                <Text style={[styles.goalCardDesc, { color: themeSubTextColor }]}>
                  {strings.loseWeightCardDesc || 'Ortiqcha yog‘lardan xalos bo‘lish, yengillik his qilish va sog‘lom ozish.'}
                </Text>
                <View style={styles.cardFooterRow}>
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' },
                    ]}
                  >
                    {goal === 'LOSE_WEIGHT' && <View style={styles.radioDot} />}
                  </View>
                  {goal === 'LOSE_WEIGHT' && (
                    <View style={styles.selectedCheckRow}>
                      <Check color="#00E599" size={16} strokeWidth={3} />
                      <Text style={styles.selectedCheckText}>
                        {strings.selectedBadge || 'Tanlandi'}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Option 2: Vaznni saqlash */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.goalCard,
                  { backgroundColor: themeCardBg, borderColor: themeCardBorder },
                  goal === 'MAINTAIN' && styles.cardActiveGlow,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGoal('MAINTAIN');
                }}
              >
                <View style={styles.goalCardHeader}>
                  <View
                    style={[
                      styles.cardIconBox,
                      { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
                    ]}
                  >
                    <Scale color="#3B82F6" size={24} />
                  </View>
                  <View style={styles.badgeBlue}>
                    <Text style={styles.badgeBlueText}>Balanslangan</Text>
                  </View>
                </View>
                <Text style={[styles.goalCardTitle, { color: themeTextColor }]}>
                  {strings.maintainCardTitle || '⚖️ Vaznni saqlash'}
                </Text>
                <Text style={[styles.goalCardDesc, { color: themeSubTextColor }]}>
                  {strings.maintainCardDesc || 'Hozirgi optimal vaznni saqlash, immunitetni mustahkamlash va tonusda bo‘lish.'}
                </Text>
                <View style={styles.cardFooterRow}>
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' },
                    ]}
                  >
                    {goal === 'MAINTAIN' && <View style={styles.radioDot} />}
                  </View>
                  {goal === 'MAINTAIN' && (
                    <View style={styles.selectedCheckRow}>
                      <Check color="#00E599" size={16} strokeWidth={3} />
                      <Text style={styles.selectedCheckText}>
                        {strings.selectedBadge || 'Tanlandi'}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Option 3: Mushak massasi */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.goalCard,
                  { backgroundColor: themeCardBg, borderColor: themeCardBorder },
                  goal === 'BUILD_MUSCLE' && styles.cardActiveGlow,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGoal('BUILD_MUSCLE');
                }}
              >
                <View style={styles.goalCardHeader}>
                  <View
                    style={[
                      styles.cardIconBox,
                      { backgroundColor: 'rgba(234, 179, 8, 0.15)' },
                    ]}
                  >
                    <Dumbbell color="#EAB308" size={24} />
                  </View>
                  <View style={styles.badgeYellow}>
                    <Text style={styles.badgeYellowText}>+350 kcal profitsit</Text>
                  </View>
                </View>
                <Text style={[styles.goalCardTitle, { color: themeTextColor }]}>
                  {strings.buildMuscleCardTitle || '💪 Mushak massasi'}
                </Text>
                <Text style={[styles.goalCardDesc, { color: themeSubTextColor }]}>
                  {strings.buildMuscleCardDesc || 'Mushak hajmini oshirish, kuch va chidamlilikni rivojlantirish.'}
                </Text>
                <View style={styles.cardFooterRow}>
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' },
                    ]}
                  >
                    {goal === 'BUILD_MUSCLE' && <View style={styles.radioDot} />}
                  </View>
                  {goal === 'BUILD_MUSCLE' && (
                    <View style={styles.selectedCheckRow}>
                      <Check color="#00E599" size={16} strokeWidth={3} />
                      <Text style={styles.selectedCheckText}>
                        {strings.selectedBadge || 'Tanlandi'}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* STEP 3: GENDER & AGE */}
        {/* =================================================== */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: themeTextColor }]}>
              {strings.statsTitle || 'Jismoniy ko‘rsatkichlaringiz'}
            </Text>
            <Text style={[styles.stepSubtitle, { color: themeSubTextColor }]}>
              {strings.statsSubtitle || 'To‘g‘ri hisob-kitoblar uchun jinsingiz, yoshingiz va vazningizni belgilang'}
            </Text>

            {/* Gender Cards */}
            <Text style={[styles.subHeaderLabel, { color: themeSubTextColor }]}>
              {strings.genderLabel || 'Jinsingiz'}
            </Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.genderCard,
                  { backgroundColor: themeCardBg, borderColor: themeCardBorder },
                  gender === 'MALE' && styles.cardActiveGlow,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGender('MALE');
                }}
              >
                <Text style={styles.genderEmoji}>👨</Text>
                <Text style={[styles.genderTitle, { color: themeTextColor }]}>
                  {strings.male || 'Erkak'}
                </Text>
                {gender === 'MALE' && (
                  <View style={styles.activeCheckPill}>
                    <Check color="#00E599" size={14} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.genderCard,
                  { backgroundColor: themeCardBg, borderColor: themeCardBorder },
                  gender === 'FEMALE' && styles.cardActiveGlow,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGender('FEMALE');
                }}
              >
                <Text style={styles.genderEmoji}>👩</Text>
                <Text style={[styles.genderTitle, { color: themeTextColor }]}>
                  {strings.female || 'Ayol'}
                </Text>
                {gender === 'FEMALE' && (
                  <View style={styles.activeCheckPill}>
                    <Check color="#00E599" size={14} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Age Direct Input */}
            <Text style={[styles.subHeaderLabel, { marginTop: 24, color: themeSubTextColor }]}>
              {strings.ageLabel || 'Yoshingiz'}
            </Text>
            <View
              style={[
                styles.directInputCard,
                { backgroundColor: themeCardBg, borderColor: themeCardBorder },
              ]}
            >
              <TextInput
                style={[styles.directInputBigText, { color: themeTextColor }]}
                placeholder="25"
                placeholderTextColor={themeSubTextColor}
                keyboardType="numeric"
                maxLength={3}
                value={age ? String(age) : ''}
                onChangeText={(val) => {
                  const num = parseInt(val.replace(/\D/g, ''), 10);
                  setAge(isNaN(num) ? 0 : Math.min(120, num));
                }}
              />
              <Text style={[styles.directInputUnitText, { color: themeSubTextColor }]}>
                {strings.yearsOld || 'yosh'}
              </Text>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* STEP 4: HEIGHT & WEIGHT */}
        {/* =================================================== */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: themeTextColor }]}>
              {strings.statsTitle || 'Bo‘y va vazningiz'}
            </Text>
            <Text style={[styles.stepSubtitle, { color: themeSubTextColor }]}>
              {strings.statsSubtitle || 'Tana massasi indeksi va BMR ko‘rsatkichlarini aniqlaymiz'}
            </Text>

            {/* Weight Input */}
            <Text style={[styles.subHeaderLabel, { color: themeSubTextColor }]}>
              {strings.weightLabel || 'Hozirgi vazningiz'}
            </Text>
            <View
              style={[
                styles.directInputCard,
                { backgroundColor: themeCardBg, borderColor: themeCardBorder },
              ]}
            >
              <TextInput
                style={[styles.directInputBigText, { color: themeTextColor }]}
                placeholder="80"
                placeholderTextColor={themeSubTextColor}
                keyboardType="numeric"
                maxLength={3}
                value={weight ? String(weight) : ''}
                onChangeText={(val) => {
                  const num = parseInt(val.replace(/\D/g, ''), 10);
                  setWeight(isNaN(num) ? 0 : Math.min(300, num));
                }}
              />
              <Text style={[styles.directInputUnitText, { color: themeSubTextColor }]}>kg</Text>
            </View>

            {/* Height Input */}
            <Text style={[styles.subHeaderLabel, { marginTop: 20, color: themeSubTextColor }]}>
              {strings.heightLabel || 'Bo‘yingiz'}
            </Text>
            <View
              style={[
                styles.directInputCard,
                { backgroundColor: themeCardBg, borderColor: themeCardBorder },
              ]}
            >
              <TextInput
                style={[styles.directInputBigText, { color: themeTextColor }]}
                placeholder="180"
                placeholderTextColor={themeSubTextColor}
                keyboardType="numeric"
                maxLength={3}
                value={height ? String(height) : ''}
                onChangeText={(val) => {
                  const num = parseInt(val.replace(/\D/g, ''), 10);
                  setHeight(isNaN(num) ? 0 : Math.min(260, num));
                }}
              />
              <Text style={[styles.directInputUnitText, { color: themeSubTextColor }]}>sm</Text>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* STEP 5: ACTIVITY LEVEL */}
        {/* =================================================== */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: themeTextColor }]}>
              {strings.activityTitle || 'Kunlik faollik darajangiz'}
            </Text>
            <Text style={[styles.stepSubtitle, { color: themeSubTextColor }]}>
              {strings.activitySubtitle || 'Kun davomida qanchalik jismoniy harakatdasiz?'}
            </Text>

            <View style={styles.cardsStack}>
              {/* Sedentary */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.activityCard,
                  { backgroundColor: themeCardBg, borderColor: themeCardBorder },
                  activity === 'SEDENTARY' && styles.cardActiveGlow,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActivity('SEDENTARY');
                }}
              >
                <Text style={styles.activityEmoji}>🛋️</Text>
                <View style={styles.activityTextContent}>
                  <Text style={[styles.activityTitle, { color: themeTextColor }]}>
                    {strings.sedentaryTitle || 'Kam harakat'}
                  </Text>
                  <Text style={[styles.activityDesc, { color: themeSubTextColor }]}>
                    {strings.sedentaryDesc || 'Kun davomida asosan o‘tirib ishlash, kam mashg‘ulot yoki passiv rejim.'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' },
                  ]}
                >
                  {activity === 'SEDENTARY' && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>

              {/* Moderate */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.activityCard,
                  { backgroundColor: themeCardBg, borderColor: themeCardBorder },
                  activity === 'MODERATE' && styles.cardActiveGlow,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActivity('MODERATE');
                }}
              >
                <Text style={styles.activityEmoji}>🚶</Text>
                <View style={styles.activityTextContent}>
                  <Text style={[styles.activityTitle, { color: themeTextColor }]}>
                    {strings.moderateTitle || 'O‘rtacha faol'}
                  </Text>
                  <Text style={[styles.activityDesc, { color: themeSubTextColor }]}>
                    {strings.moderateDesc || 'Kuniga 6,000 - 10,000 qadam yoki haftasiga 2-3 marta mashg‘ulot.'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' },
                  ]}
                >
                  {activity === 'MODERATE' && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>

              {/* Very Active */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.activityCard,
                  { backgroundColor: themeCardBg, borderColor: themeCardBorder },
                  activity === 'VERY_ACTIVE' && styles.cardActiveGlow,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActivity('VERY_ACTIVE');
                }}
              >
                <Text style={styles.activityEmoji}>🏃</Text>
                <View style={styles.activityTextContent}>
                  <Text style={[styles.activityTitle, { color: themeTextColor }]}>
                    {strings.veryActiveTitle || 'Juda faol'}
                  </Text>
                  <Text style={[styles.activityDesc, { color: themeSubTextColor }]}>
                    {strings.veryActiveDesc || 'Og‘ir jismoniy mehnat yoki haftasiga 5-6 marta intensiv sport.'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' },
                  ]}
                >
                  {activity === 'VERY_ACTIVE' && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* STEP 6: CALCULATION COMPLETE & RESULTS */}
        {/* =================================================== */}
        {step === 6 && (
          <View style={styles.stepContainer}>
            {/* Celebration Header */}
            <View style={styles.celebrationHeader}>
              <View style={styles.celebrateIconCircle}>
                <Sparkles color="#00E599" size={28} />
              </View>
              <Text style={[styles.celebrateTitle, { color: themeTextColor }]}>
                {strings.readyTitle || 'Sizning shaxsiy rejangiz tayyor! 🎉'}
              </Text>
              <Text style={[styles.celebrateSubtitle, { color: themeSubTextColor }]}>
                {strings.readySubtitle || 'AI algoritmlari siz uchun optimal kunlik me’yorni hisoblab chiqdi'}
              </Text>
            </View>

            {/* Neon Green Circular Gauge */}
            <View style={styles.resultsRingWrapper}>
              <Svg width={180} height={180}>
                <Defs>
                  <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#00E599" />
                    <Stop offset="100%" stopColor="#059669" />
                  </SvgGradient>
                </Defs>
                <Circle
                  cx={90}
                  cy={90}
                  r={76}
                  stroke={isDark ? '#1E293B' : '#E2E8F0'}
                  strokeWidth={12}
                  fill="none"
                />
                <Circle
                  cx={90}
                  cy={90}
                  r={76}
                  stroke="url(#ringGrad)"
                  strokeWidth={12}
                  strokeDasharray={`${2 * Math.PI * 76} ${2 * Math.PI * 76}`}
                  strokeDashoffset={2 * Math.PI * 76 * 0.15}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 90 90)"
                />
              </Svg>

              <View style={styles.resultsRingInner}>
                <Text style={[styles.resultsKcalBig, { color: themeTextColor }]}>
                  {plan.calories.toLocaleString()}
                </Text>
                <Text style={[styles.resultsKcalUnit, { color: themeSubTextColor }]}>
                  {strings.kcalDay || 'kcal / kun'}
                </Text>
              </View>
            </View>

            {/* 3 Macro Cards */}
            <View style={styles.macroCardsGrid}>
              {/* Protein */}
              <View
                style={[
                  styles.macroCard,
                  {
                    borderColor: '#3B82F6',
                    backgroundColor: isDark ? '#121A2B' : '#FFFFFF',
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.18)', 'rgba(59, 130, 246, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[styles.macroCardLabel, { color: '#60A5FA' }]}>
                  {strings.protein || 'Oqsil'}
                </Text>
                <Text style={[styles.macroCardValue, { color: themeTextColor }]}>
                  {plan.protein}g
                </Text>
                <Text style={styles.macroCardSub}>25% me'yor</Text>
              </View>

              {/* Carbs */}
              <View
                style={[
                  styles.macroCard,
                  {
                    borderColor: '#F59E0B',
                    backgroundColor: isDark ? '#121A2B' : '#FFFFFF',
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.18)', 'rgba(245, 158, 11, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[styles.macroCardLabel, { color: '#FBBF24' }]}>
                  {strings.carbs || 'Uglevod'}
                </Text>
                <Text style={[styles.macroCardValue, { color: themeTextColor }]}>
                  {plan.carbs}g
                </Text>
                <Text style={styles.macroCardSub}>50% me'yor</Text>
              </View>

              {/* Fat */}
              <View
                style={[
                  styles.macroCard,
                  {
                    borderColor: '#EF4444',
                    backgroundColor: isDark ? '#121A2B' : '#FFFFFF',
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.18)', 'rgba(239, 68, 68, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[styles.macroCardLabel, { color: '#F87171' }]}>
                  {strings.fat || 'Yog‘'}
                </Text>
                <Text style={[styles.macroCardValue, { color: themeTextColor }]}>
                  {plan.fat}g
                </Text>
                <Text style={styles.macroCardSub}>25% me'yor</Text>
              </View>
            </View>

            {/* Summary Details Box */}
            <View
              style={[
                styles.summaryDetailsCard,
                { backgroundColor: themeCardBg, borderColor: themeCardBorder },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: themeSubTextColor }]}>
                  Metabolizm bazasi (BMR):
                </Text>
                <Text style={[styles.summaryValue, { color: themeTextColor }]}>
                  {plan.bmr} kcal
                </Text>
              </View>
              <View
                style={[
                  styles.summaryDivider,
                  { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
                ]}
              />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: themeSubTextColor }]}>
                  Faollik bilan sarf (TDEE):
                </Text>
                <Text style={[styles.summaryValue, { color: themeTextColor }]}>
                  {plan.tdee} kcal
                </Text>
              </View>
              <View
                style={[
                  styles.summaryDivider,
                  { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
                ]}
              />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: themeSubTextColor }]}>
                  Maqsadli tuzatish:
                </Text>
                <Text style={[styles.summaryValue, { color: '#00E599' }]}>
                  {goal === 'LOSE_WEIGHT'
                    ? '-400 kcal (Defitsit)'
                    : goal === 'BUILD_MUSCLE'
                    ? '+350 kcal (Profitsit)'
                    : 'Balans'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* STEP 7: NOTIFICATION & MEAL REMINDERS PERMISSION */}
        {/* =================================================== */}
        {step === 7 && (
          <View style={styles.stepContainer}>
            {/* Big Bell Icon Badge */}
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <View
                style={[
                  styles.notificationHeroBadge,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.10)',
                    borderColor: '#10B981',
                  },
                ]}
              >
                <Bell color="#10B981" size={44} />
              </View>
            </View>

            <Text style={[styles.stepTitle, { color: themeTextColor, textAlign: 'center' }]}>
              {strings.notificationStepTitle || 'Eslatmalarni yoqish'}
            </Text>
            <Text style={[styles.stepSubtitle, { color: themeSubTextColor, textAlign: 'center', marginBottom: 20 }]}>
              {strings.notificationStepSub || 'Taomlanish vaqtini o‘tkazib yubormaslik uchun eslatmalar'}
            </Text>

            {/* Daily Schedule Card */}
            <View
              style={[
                styles.reminderScheduleCard,
                { backgroundColor: themeCardBg, borderColor: themeCardBorder },
              ]}
            >
              <View style={styles.scheduleRowItem}>
                <View style={[styles.scheduleIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={{ fontSize: 18 }}>🍳</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scheduleItemTitle, { color: themeTextColor }]}>
                    {strings.breakfastTime || 'Nonushta'}
                  </Text>
                  <Text style={[styles.scheduleItemSub, { color: themeSubTextColor }]}>
                    Kuningizni to‘g‘ri kaloriya bilan boshlash uchun
                  </Text>
                </View>
              </View>

              <View style={[styles.scheduleDivider, { backgroundColor: themeBorderColor }]} />

              <View style={styles.scheduleRowItem}>
                <View style={[styles.scheduleIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Text style={{ fontSize: 18 }}>🍲</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scheduleItemTitle, { color: themeTextColor }]}>
                    {strings.lunchTime || 'Tushlik'}
                  </Text>
                  <Text style={[styles.scheduleItemSub, { color: themeSubTextColor }]}>
                    Tushlik kaloriyasini skanerlash eslatmasi
                  </Text>
                </View>
              </View>

              <View style={[styles.scheduleDivider, { backgroundColor: themeBorderColor }]} />

              <View style={styles.scheduleRowItem}>
                <View style={[styles.scheduleIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={{ fontSize: 18 }}>🥗</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scheduleItemTitle, { color: themeTextColor }]}>
                    {strings.dinnerTime || 'Kechki ovqat'}
                  </Text>
                  <Text style={[styles.scheduleItemSub, { color: themeSubTextColor }]}>
                    Kunlik me'yorni to'ldirish va yakunlash
                  </Text>
                </View>
              </View>
            </View>

            {/* Custom Modal trigger link */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.scheduleModalLinkBtn,
                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)', borderColor: 'rgba(59, 130, 246, 0.25)' },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setReminderModalVisible(true);
              }}
            >
              <Clock color="#3B82F6" size={16} />
              <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '700' }}>
                {strings.viewScheduleBtn || 'Jadvalni ko‘rish'}
              </Text>
            </TouchableOpacity>

            {/* Info Note about optional access */}
            <View style={styles.optionalNoteBox}>
              <ShieldCheck color={themeSubTextColor} size={15} />
              <Text style={[styles.optionalNoteText, { color: themeSubTextColor }]}>
                {strings.notificationOptionalNote || 'Bu sozlamani keyin ham o‘zgartirishingiz mumkin.'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Button */}
      <View
        style={[
          styles.bottomBarContainer,
          {
            backgroundColor: isDark ? 'rgba(10, 14, 26, 0.95)' : 'rgba(248, 250, 252, 0.95)',
            borderTopColor: themeBorderColor,
          },
        ]}
      >
        {step === 7 ? (
          <View style={{ gap: 10, width: '100%' }}>
            {/* Primary: Enable notifications and finish */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.primaryActionButton}
              disabled={reminderLoading}
              onPress={async () => {
                setReminderLoading(true);
                await handleFinish(true);
                setReminderLoading(false);
              }}
            >
              <LinearGradient
                colors={['#00E599', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryActionGradient}
              >
                {reminderLoading ? (
                  <ActivityIndicator color="#0A0E1A" size="small" />
                ) : (
                  <>
                    <Bell color="#0A0E1A" size={18} />
                    <Text style={styles.primaryActionText}>
                      {strings.enableRemindersBtn || 'Eslatmalarni yoqish'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary: Skip */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.skipActionButton,
                { backgroundColor: themeCardBg, borderColor: themeBorderColor },
              ]}
              onPress={() => handleFinish(false)}
            >
              <Text style={[styles.skipActionText, { color: themeSubTextColor }]}>
                {strings.skipRemindersBtn || 'O‘tkazib yuborish'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.primaryActionButton}
            onPress={handleNext}
          >
            <LinearGradient
              colors={['#00E599', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryActionGradient}
            >
              <Text style={styles.primaryActionText}>
                {strings.nextBtn || 'Davom etish'}
              </Text>
              <ChevronRight color="#0A0E1A" size={20} strokeWidth={2.8} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Language Picker Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setLangModalVisible(false)}
          />
          <View
            style={[
              styles.langModalBox,
              { backgroundColor: themeCardBg, borderColor: themeCardBorder },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Globe color="#10B981" size={20} />
                <Text style={[styles.sheetTitle, { color: themeTextColor }]}>
                  {strings.language || 'Til (Language)'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <X color={themeSubTextColor} size={20} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12, gap: 8 }}>
              {LANGUAGES.map((item) => {
                const isSelected = language === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    activeOpacity={0.8}
                    style={[
                      styles.langOptionCard,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(0, 229, 153, 0.12)'
                          : isDark
                          ? '#0A0E1A'
                          : '#F1F5F9',
                        borderColor: isSelected ? '#00E599' : themeBorderColor,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setLanguage(item.code);
                      setLangModalVisible(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ fontSize: 24 }}>{item.flag}</Text>
                      <Text
                        style={[
                          styles.langOptionLabel,
                          {
                            color: isSelected ? '#00E599' : themeTextColor,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {isSelected && <Check color="#00E599" size={20} strokeWidth={2.6} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Country Code Picker Modal */}
      <Modal
        visible={countryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setCountryModalVisible(false)}
          />
          <View
            style={[
              styles.countryModalSheet,
              { backgroundColor: themeCardBg, borderColor: themeCardBorder },
            ]}
          >
            <View
              style={[
                styles.sheetHandleBar,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' },
              ]}
            />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: themeTextColor }]}>
                {strings.chooseCountry || 'Davlatni tanlang'}
              </Text>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <X color={themeSubTextColor} size={20} />
              </TouchableOpacity>
            </View>

            {/* Country Search Bar */}
            <View
              style={[
                styles.countrySearchBar,
                { backgroundColor: themeInputBg, borderColor: themeBorderColor },
              ]}
            >
              <Search color={themeSubTextColor} size={18} />
              <TextInput
                style={[styles.countrySearchInput, { color: themeTextColor }]}
                placeholder={strings.searchCountry || 'Davlat nomi yoki kodi...'}
                placeholderTextColor={themeSubTextColor}
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
            </View>

            {/* Country List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ paddingVertical: 6 }}
            >
              {filteredCountries.map((c) => {
                const isSelected =
                  selectedCountry.code === c.code && selectedCountry.name === c.name;
                return (
                  <TouchableOpacity
                    key={`${c.code}-${c.name}`}
                    style={[
                      styles.countryItemRow,
                      { borderColor: themeBorderColor },
                      isSelected && {
                        backgroundColor: 'rgba(0, 229, 153, 0.12)',
                        borderColor: '#00E599',
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCountry(c);
                      setCountryModalVisible(false);
                      setCountrySearch('');
                      const raw = phone.replace(/\D/g, '').slice(0, c.maxDigits);
                      setPhone(formatPhoneNumber(raw, c));
                    }}
                  >
                    <View style={styles.countryItemLeft}>
                      <Text style={styles.countryFlagText}>{c.flag}</Text>
                      <Text style={[styles.countryNameText, { color: themeTextColor }]}>
                        {c.name}
                      </Text>
                    </View>
                    <View style={styles.countryItemRight}>
                      <Text style={styles.countryCodeBadgeText}>{c.code}</Text>
                      {isSelected && (
                        <Check color="#00E599" size={18} strokeWidth={2.5} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeftLogo: {
    paddingHorizontal: 4,
  },
  brandTitleText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00E599',
  },
  headerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  controlPillEmoji: {
    fontSize: 15,
  },
  controlPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 110,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    gap: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 52,
    gap: 6,
  },
  phoneDigitsWrapper: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: 'center',
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  inputHint: {
    fontSize: 11,
    marginTop: 8,
    lineHeight: 15,
  },
  cardsStack: {
    gap: 14,
  },
  goalCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
  },
  cardActiveGlow: {
    borderColor: '#00E599',
    shadowColor: '#00E599',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOrange: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeOrangeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  badgeBlueText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeYellow: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  badgeYellowText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  goalCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  goalCardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00E599',
  },
  selectedCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedCheckText: {
    color: '#00E599',
    fontSize: 12,
    fontWeight: '700',
  },
  subHeaderLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 20,
    alignItems: 'center',
    position: 'relative',
  },
  genderEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  genderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  activeCheckPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directInputCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  directInputBigText: {
    fontSize: 28,
    fontWeight: '900',
    flex: 1,
  },
  directInputUnitText: {
    fontSize: 16,
    fontWeight: '700',
  },
  activityCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  activityEmoji: {
    fontSize: 30,
  },
  activityTextContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  activityDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  celebrateIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  celebrateTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 6,
  },
  celebrateSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  resultsRingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  resultsRingInner: {
    position: 'absolute',
    alignItems: 'center',
  },
  resultsKcalBig: {
    fontSize: 32,
    fontWeight: '900',
  },
  resultsKcalUnit: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  macroCardsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  macroCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    overflow: 'hidden',
  },
  macroCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  macroCardValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  macroCardSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  summaryDetailsCard: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 10,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  primaryActionButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#00E599',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryActionText: {
    color: '#0A0E1A',
    fontSize: 16,
    fontWeight: '900',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  langModalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 20,
  },
  langOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  langOptionLabel: {
    fontSize: 15,
  },
  countryModalSheet: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    maxHeight: '80%',
    alignSelf: 'flex-end',
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  countrySearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 10,
  },
  countrySearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  countryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  countryItemRowSelected: {
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
    borderColor: '#00E599',
  },
  countryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  countryFlagText: {
    fontSize: 20,
  },
  countryNameText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countryItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00E599',
  },
  backButtonPlaceholder: {
    width: 38,
    height: 38,
  },
  notificationHeroBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  reminderScheduleCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  scheduleRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  scheduleIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  scheduleItemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  scheduleDivider: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  scheduleModalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  optionalNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  optionalNoteText: {
    fontSize: 12,
    textAlign: 'center',
  },
  skipActionButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
