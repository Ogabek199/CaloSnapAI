import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Moon,
  Sun,
  Globe,
  Bell,
  LogOut,
  User,
  ChevronRight,
  Camera,
  ScanFace,
  Crown,
  Sparkles,
  PartyPopper,
  Flame,
  Scale,
  Dumbbell,
  Check,
  Target,
  FileText,
  ShieldCheck,
  Trash2,
  HeartPulse,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, usePalette, useStrings } from '../../src/store/useAppStore';
import { useDiaryStore } from '../../src/store/useDiaryStore';
import { useToastStore } from '../../src/store/useToastStore';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useFeastStore } from '../../src/store/useFeastStore';
import { PaywallModal } from '../../src/features/subscription/PaywallModal';
import { WheelSelectModal } from '../../src/shared/ui/WheelSelectModal';
import { RemoteImage } from '../../src/shared/ui/RemoteImage';
import { SkeletonBone } from '../../src/shared/ui/Skeleton';
import { IOSSwitch } from '../../src/shared/ui/IOSSwitch';
import { StatusBarScrim } from '../../src/shared/ui/StatusBarScrim';
import { CustomModal } from '../../src/shared/ui/CustomModal';
import { LANGUAGES } from '../../src/shared/i18n/languages';
import {
  authenticateWithBiometrics,
  getBiometricAvailability,
} from '../../src/shared/security/biometric';
import {
  ApiClient,
  ApiError,
  HEALTH_CONDITIONS,
  type HealthCondition,
  type LegalPage,
  legalUrl,
} from '../../src/shared/api/api-client';
import { TextField } from '../../src/shared/ui/TextField';
import { tabBarScrollPadding } from '../../src/shared/theme/layout';
import { FontSize, Radius, Spacing, softShadow, androidTextFix } from '../../src/shared/theme/spacing';

type Goal = 'LOSE_WEIGHT' | 'MAINTAIN' | 'BUILD_MUSCLE';
type Activity = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
type PickerKind = 'weight' | 'height' | 'age' | null;
type Palette = ReturnType<ReturnType<typeof useAppStore.getState>['theme']>;

const ACTIVITY_MULT: Record<Activity, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
};

const GLYCEMIC: HealthCondition[] = ['DIABETES_TYPE_1', 'DIABETES_TYPE_2', 'PREDIABETES'];

const ACTIVITY_ORDER: Activity[] = ['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'];

const LETTER = 'A-Za-z\\u00C0-\\u024F\\u0400-\\u04FF\\u1100-\\u11FF\\u3130-\\u318F\\uAC00-\\uD7AF0-9‘’\'';
const EMOJI_EDGES = new RegExp(`^[^${LETTER}]+|[^${LETTER}.)]+$`, 'g');
const stripEmoji = (s: string) => s.replace(EMOJI_EDGES, '').trim();

/** "Vazn (kg)" -> { label: "Vazn", unit: "kg" } so units follow the UI language. */
const splitUnit = (s: string, fallbackUnit = '') => {
  const m = s.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return m ? { label: m[1], unit: m[2] } : { label: s, unit: fallbackUnit };
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    isLoggedIn,
    language,
    themeMode,
    mealRemindersEnabled,
    biometricLockEnabled,
    setLanguage,
    setThemeMode,
    setMealRemindersEnabled,
    setBiometricLockEnabled,
    setAvatarUrl,
    updateUserStats,
    logout,
  } = useAppStore(
    useShallow((s) => ({
      user: s.user,
      isLoggedIn: s.isLoggedIn,
      language: s.language,
      themeMode: s.themeMode,
      mealRemindersEnabled: s.mealRemindersEnabled,
      biometricLockEnabled: s.biometricLockEnabled,
      setLanguage: s.setLanguage,
      setThemeMode: s.setThemeMode,
      setMealRemindersEnabled: s.setMealRemindersEnabled,
      setBiometricLockEnabled: s.setBiometricLockEnabled,
      setAvatarUrl: s.setAvatarUrl,
      updateUserStats: s.updateUserStats,
      logout: s.logout,
    })),
  );
  const setCalorieGoal = useDiaryStore((s) => s.setCalorieGoal);
  const showToast = useToastStore((s) => s.showToast);
  const openPaywall = useSubscriptionStore((s) => s.openPaywall);
  const feastPlan = useFeastStore((s) => s.activePlan);
  const openFeastModal = useFeastStore((s) => s.openModal);
  const getCurrentDayProgress = useFeastStore((s) => s.getCurrentDayProgress);
  const currentFeastProgress = getCurrentDayProgress();

  const c = usePalette();
  const strings = useStrings();
  const isDark = themeMode === 'dark';
  const isPremium = !!user.isPremium;

  const [weight, setWeight] = useState(user.weightKg?.toString() || '80');
  const [height, setHeight] = useState(user.heightCm?.toString() || '180');
  const [age, setAge] = useState(user.age?.toString() || '25');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(user.gender || 'MALE');
  const [goal, setGoal] = useState<Goal>(user.fitnessGoal || 'LOSE_WEIGHT');
  const [activity, setActivity] = useState<Activity>(
    (user.activityLevel as Activity) || 'MODERATE',
  );
  const [pickerType, setPickerType] = useState<PickerKind>(null);
  const [weightLogs, setWeightLogs] = useState<{ weightKg: number; loggedAt: string }[]>([]);
  const [weightLoading, setWeightLoading] = useState(isLoggedIn);
  const [saving, setSaving] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [savingConditions, setSavingConditions] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
  const savingRef = useRef(false);

  useEffect(() => {
    setWeight(user.weightKg?.toString() || '80');
    setHeight(user.heightCm?.toString() || '180');
    setAge(user.age?.toString() || '25');
    setGender(user.gender || 'MALE');
    setGoal(user.fitnessGoal || 'LOSE_WEIGHT');
    setActivity((user.activityLevel as Activity) || 'MODERATE');
  }, [user.weightKg, user.heightCm, user.age, user.gender, user.fitnessGoal, user.activityLevel]);

  useEffect(() => {
    if (!isLoggedIn) {
      setWeightLoading(false);
      return;
    }
    let active = true;
    ApiClient.listWeight(30)
      .then((logs) => {
        if (active) setWeightLogs(logs);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setWeightLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isLoggedIn, user.weightKg]);

  const calculateTdee = () => {
    const w = parseFloat(weight) || 80;
    const h = parseFloat(height) || 180;
    const a = parseInt(age, 10) || 25;
    let bmr = 10 * w + 6.25 * h - 5 * a + (gender === 'MALE' ? 5 : -161);
    let tdee = Math.round(bmr * (ACTIVITY_MULT[activity] || 1.55));
    if (goal === 'LOSE_WEIGHT') tdee -= 400;
    if (goal === 'BUILD_MUSCLE') tdee += 350;
    return Math.max(1200, Math.round(tdee));
  };

  const tdee = calculateTdee();

  const isDirty =
    parseFloat(weight) !== user.weightKg ||
    parseFloat(height) !== user.heightCm ||
    parseInt(age, 10) !== user.age ||
    gender !== user.gender ||
    goal !== user.fitnessGoal ||
    activity !== user.activityLevel;

  const pickAvatar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const previous = user.avatarUrl;
      let uri = asset.uri;
      try {
        const small = await manipulateAsync(asset.uri, [{ resize: { width: 512, height: 512 } }], {
          compress: 0.75,
          format: SaveFormat.JPEG,
          base64: true,
        });
        if (small.base64) uri = `data:image/jpeg;base64,${small.base64}`;
      } catch {}
      setAvatarUrl(uri);
      if (!isLoggedIn) {
        showToast(strings.saved, 'success');
        return;
      }
      try {
        const saved = await ApiClient.updateAvatar(uri);
        if (typeof saved?.avatarUrl === 'string' && saved.avatarUrl) {
          setAvatarUrl(saved.avatarUrl);
        }
        showToast(strings.saved, 'success');
      } catch (e: any) {
        setAvatarUrl(previous || '');
        showToast(e?.message || strings.avatarSaveFailed, 'error');
      }
    }
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const w = parseFloat(weight) || 80;
    const h = parseFloat(height) || 180;
    const a = parseInt(age, 10) || 25;
    const weightChanged = w !== user.weightKg;
    let calorieGoal = tdee;
    try {
      if (isLoggedIn) {
        const res: any = await ApiClient.saveGoals({
          age: a,
          gender,
          weightKg: w,
          heightCm: h,
          activityLevel: activity,
          goal,
        });
        calorieGoal = res?.calculatedGoals?.dailyCalories ?? res?.profile?.dailyCalorieGoal ?? tdee;
        if (weightChanged) {
          await ApiClient.addWeight(w).catch(() => {});
          ApiClient.listWeight(30)
            .then(setWeightLogs)
            .catch(() => {});
        }
      }
      setCalorieGoal(calorieGoal);
      updateUserStats({
        weightKg: w,
        heightCm: h,
        age: a,
        gender,
        fitnessGoal: goal,
        activityLevel: activity,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(strings.saved, 'success');
    } catch (e: any) {
      showToast(e?.message || strings.saveFailed, 'error');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const askLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setLogoutOpen(true);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLogoutOpen(false);
    logout();
    router.replace('/auth');
  };

  const openLegal = (page: LegalPage) => {
    Haptics.selectionAsync();
    const url = legalUrl(page, language);
    if (url) Linking.openURL(url).catch(() => {});
  };

  const askDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeletePassword('');
    setDeleteError('');
    setDeleteOpen(true);
  };

  const closeDeleteAccount = () => {
    if (deleting) return;
    setDeleteOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (deleting) return;
    if (!deletePassword) {
      setDeleteError(strings.deleteAccountWrongPassword);
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await ApiClient.deleteAccount(deletePassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeleteOpen(false);
      logout();
      showToast(strings.accountDeleted, 'success');
      router.replace('/auth');
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 403) {
        setDeleteError(strings.deleteAccountWrongPassword);
      } else {
        setDeleteError(e?.message || strings.errGeneric);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setDeleting(false);
    }
  };

  const toggleCondition = async (cond: HealthCondition) => {
    if (savingConditions) return;
    Haptics.selectionAsync();
    const current = user.healthConditions ?? [];
    // Diabetes types and prediabetes are mutually exclusive diagnoses.
    const next = current.includes(cond)
      ? current.filter((x) => x !== cond)
      : [...current.filter((x) => !(GLYCEMIC.includes(x) && GLYCEMIC.includes(cond))), cond];
    updateUserStats({ healthConditions: next });
    if (!isLoggedIn) return;
    setSavingConditions(true);
    try {
      const res = await ApiClient.updateHealthConditions(next);
      updateUserStats({ healthConditions: res.healthConditions });
    } catch (e: any) {
      updateUserStats({ healthConditions: current });
      showToast(e?.message || strings.saveFailed, 'error');
    } finally {
      setSavingConditions(false);
    }
  };

  // Scheduling/cancelling is driven by the root layout effect on this flag.
  const toggleReminders = (value: boolean) => {
    setMealRemindersEnabled(value);
  };

  const toggleBiometricLock = async (value: boolean) => {
    if (!value) {
      setBiometricLockEnabled(false);
      return;
    }
    const avail = await getBiometricAvailability();
    if (!avail.available) {
      showToast(strings.biometricUnavailable, 'warning');
      return;
    }
    const ok = await authenticateWithBiometrics(strings.biometricPrompt);
    if (!ok) {
      showToast(strings.biometricEnableFailed, 'error');
      return;
    }
    setBiometricLockEnabled(true);
    showToast(strings.saved, 'success');
  };

  const pickerValues =
    pickerType === 'weight'
      ? Array.from({ length: 141 }, (_, i) => i + 40)
      : pickerType === 'height'
        ? Array.from({ length: 101 }, (_, i) => i + 120)
        : pickerType === 'age'
          ? Array.from({ length: 67 }, (_, i) => i + 14)
          : [];

  const pickerValue =
    pickerType === 'weight'
      ? parseInt(weight, 10)
      : pickerType === 'height'
        ? parseInt(height, 10)
        : pickerType === 'age'
          ? parseInt(age, 10)
          : 0;

  const phone = (user.phone || '').replace(/[^\d+\s]/g, '').trim();

  const recentWeights = weightLogs.slice(-10);
  const weightMin = Math.min(...recentWeights.map((x) => x.weightKg)) - 1;
  const weightMax = Math.max(...recentWeights.map((x) => x.weightKg)) + 1;
  const latestWeight = recentWeights.length ? recentWeights[recentWeights.length - 1].weightKg : null;
  const weightDelta =
    recentWeights.length > 1 ? latestWeight! - recentWeights[0].weightKg : null;

  const weightMeta = splitUnit(strings.weightKg, 'kg');
  const heightMeta = splitUnit(strings.heightCm, 'cm');

  const activityLabels: Partial<Record<Activity, string>> = {
    SEDENTARY: strings.sedentaryTitle,
    LIGHT: strings.lightActiveTitle,
    MODERATE: strings.moderateTitle,
    VERY_ACTIVE: strings.highActiveTitle,
    EXTRA_ACTIVE: strings.veryActiveTitle,
  };

  const goals: { key: Goal; title: string; desc: string; icon: React.ReactNode; tint: string; bg: string }[] = [
    {
      key: 'LOSE_WEIGHT',
      title: stripEmoji(strings.loseWeight),
      desc: strings.loseWeightDesc,
      icon: <Flame size={18} color={c.secondary} />,
      tint: c.secondary,
      bg: c.secondaryBg,
    },
    {
      key: 'MAINTAIN',
      title: stripEmoji(strings.maintain),
      desc: strings.maintainDesc,
      icon: <Scale size={18} color={c.info} />,
      tint: c.info,
      bg: c.infoBg,
    },
    {
      key: 'BUILD_MUSCLE',
      title: stripEmoji(strings.buildMuscle),
      desc: strings.buildMuscleDesc,
      icon: <Dumbbell size={18} color={c.purple} />,
      tint: c.purple,
      bg: c.purpleBg,
    },
  ];

  const switchColors = {
    activeColor: c.primary,
    inactiveColor: isDark ? '#39393D' : '#E9E9EB',
  };

  const cardStyle = [styles.card, { backgroundColor: c.card, borderColor: c.border }, softShadow('sm')];

  return (
    <View style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.md, paddingBottom: tabBarScrollPadding(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >

        {/* Hero: identity + body stats + gender */}
        <LinearGradient
          colors={[c.primary, c.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, softShadow('md')]}
        >
          <View style={styles.heroGlow} pointerEvents="none" />
          <View style={styles.heroTop}>
            <Pressable
              onPress={pickAvatar}
              style={({ pressed }) => [styles.avatarWrap, { opacity: pressed ? 0.85 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={strings.changeAvatar}
            >
              <View style={styles.avatar}>
                {user.avatarUrl ? (
                  <RemoteImage
                    uri={user.avatarUrl}
                    style={styles.avatarImg}
                    indicatorColor="#FFFFFF"
                    placeholderColor="rgba(255,255,255,0.18)"
                  />
                ) : (
                  <User color="#FFFFFF" size={34} />
                )}
              </View>
              <View style={[styles.cameraBadge, { borderColor: c.primary }]}>
                <Camera size={12} color={c.primary} strokeWidth={2.4} />
              </View>
            </Pressable>

            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {user.name || strings.guest}
                </Text>
                {isPremium ? (
                  <View style={styles.proPill}>
                    <Crown size={11} color="#FBBF24" />
                    <Text style={styles.proPillText}>PRO</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.heroPhone} numberOfLines={1}>
                {phone || strings.changeAvatar}
              </Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <HeroStat
              value={weight}
              unit={weightMeta.unit}
              label={weightMeta.label}
              onPress={() => setPickerType('weight')}
            />
            <View style={styles.heroDivider} />
            <HeroStat
              value={height}
              unit={heightMeta.unit}
              label={heightMeta.label}
              onPress={() => setPickerType('height')}
            />
            <View style={styles.heroDivider} />
            <HeroStat value={age} label={strings.age} onPress={() => setPickerType('age')} />
          </View>

          <View style={styles.heroSeg}>
            {(['MALE', 'FEMALE'] as const).map((g) => {
              const active = gender === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setGender(g);
                  }}
                  style={[styles.heroSegBtn, active && styles.heroSegBtnActive]}
                >
                  <Text style={[styles.heroSegText, { color: active ? c.primaryDark : 'rgba(255,255,255,0.9)' }]}>
                    {stripEmoji(g === 'MALE' ? strings.male : strings.female)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>

        {/* Pro membership */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openPaywall();
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
        >
          <LinearGradient
            colors={isPremium ? ['#065F46', '#047857'] : ['#312E81', '#4338CA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.promoCard, softShadow('sm')]}
          >
            <View style={[styles.promoIcon, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              {isPremium ? <Sparkles size={20} color="#FBBF24" /> : <Crown size={20} color="#FBBF24" />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.promoTitleRow}>
                <Text style={styles.promoTitle}>{strings.proTitle}</Text>
                {isPremium ? (
                  <View style={[styles.tag, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.tagText}>{strings.active}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.promoSub} numberOfLines={2}>
                {isPremium ? strings.proActiveSub : strings.proSubtitle}
              </Text>
            </View>
            <ChevronRight color="rgba(255,255,255,0.8)" size={18} />
          </LinearGradient>
        </Pressable>

        {/* Feast mode */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openFeastModal();
          }}
          style={({ pressed }) => [
            styles.promoCard,
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(255, 149, 0, 0.10)' : '#FFF8EE',
              borderColor: isDark ? 'rgba(255, 149, 0, 0.30)' : '#FED7AA',
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <View style={[styles.promoIcon, { backgroundColor: '#FF9500' }]}>
            <PartyPopper size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.promoTitleRow}>
              <Text style={[styles.promoTitle, { color: isDark ? '#FFB340' : '#C2410C', flexShrink: 1 }]} numberOfLines={1}>
                {strings.feastModeTitle}
              </Text>
              {feastPlan && currentFeastProgress ? (
                <View style={[styles.tag, { backgroundColor: '#FF9500' }]}>
                  <Text style={styles.tagText}>
                    {currentFeastProgress.isFeastDay
                      ? strings.feastDayOf
                      : strings.feastDayProgress
                          .replace('{day}', String(currentFeastProgress.currentDay))
                          .replace('{total}', String(feastPlan.compensationDays))}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.promoSub, { color: isDark ? '#D1D5DB' : '#78716C' }]} numberOfLines={2}>
              {feastPlan && feastPlan.isActive
                ? strings.feastActiveSummary.replace('{n}', String(feastPlan.dailyDeficit))
                : strings.feastModeSubtitle}
            </Text>
          </View>
          <ChevronRight color={isDark ? '#FFB340' : '#C2410C'} size={18} />
        </Pressable>

        {/* Fitness goal */}
        <SectionLabel text={strings.fitnessGoal} color={c.textSecondary} />
        <View style={cardStyle}>
          {goals.map((g, i) => {
            const active = goal === g.key;
            return (
              <Pressable
                key={g.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGoal(g.key);
                }}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
                  active && { backgroundColor: c.primaryBg },
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <IconBox bg={g.bg}>{g.icon}</IconBox>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: c.text }]}>{g.title}</Text>
                  <Text style={[styles.rowSub, { color: c.textMuted }]} numberOfLines={2}>
                    {g.desc}
                  </Text>
                </View>
                <Radio active={active} colors={c} />
              </Pressable>
            );
          })}
        </View>

        {/* Activity level */}
        <SectionLabel text={strings.activityLevel} color={c.textSecondary} />
        <View style={cardStyle}>
          {ACTIVITY_ORDER.map((key, i) => {
            const active = activity === key;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActivity(key);
                }}
                style={({ pressed }) => [
                  styles.rowCompact,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={styles.activityBars}>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <View
                      key={n}
                      style={[
                        styles.activityBar,
                        { height: 6 + n * 3, backgroundColor: n <= i ? c.primary : c.cardHover },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.rowTitle, { flex: 1, color: c.text, fontWeight: active ? '700' : '500' }]}>
                  {activityLabels[key] || key.replace('_', ' ')}
                </Text>
                <Text style={[styles.multText, { color: c.textMuted }]}>×{ACTIVITY_MULT[key]}</Text>
                <Radio active={active} colors={c} />
              </Pressable>
            );
          })}
        </View>

        {/* Daily target + save */}
        <View style={[cardStyle, styles.targetCard]}>
          <View style={styles.targetTop}>
            <IconBox bg={c.primaryBg}>
              <Target size={18} color={c.primary} />
            </IconBox>
            <Text style={[styles.targetLabel, { color: c.textSecondary }]} numberOfLines={2}>
              {strings.calculatedTdee}
            </Text>
          </View>
          <View style={styles.targetValueRow}>
            <Text style={[styles.targetValue, { color: c.text }]}>{tdee}</Text>
            <Text style={[styles.targetUnit, { color: c.textMuted }]}>kcal</Text>
          </View>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: isDirty ? c.primary : c.primaryBg,
                opacity: saving ? 0.7 : pressed ? 0.9 : 1,
              },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={isDirty ? '#FFFFFF' : c.primary} />
            ) : (
              <Text style={[styles.saveText, { color: isDirty ? '#FFFFFF' : c.primary }]}>
                {strings.saveGoals}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Weight history */}
        {weightLoading && weightLogs.length === 0 ? (
          <>
            <SectionLabel text={strings.weightHistory} color={c.textSecondary} />
            <View style={[cardStyle, styles.chartCard]}>
              <View style={styles.weightBars}>
                {[28, 40, 34, 48, 38, 44, 30].map((h, i) => (
                  <View key={i} style={styles.barCol}>
                    <SkeletonBone width="55%" height={h} radius={6} />
                    <SkeletonBone width={16} height={8} radius={3} />
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : weightLogs.length > 0 ? (
          <>
            <SectionLabel text={strings.weightHistory} color={c.textSecondary} />
            <View style={[cardStyle, styles.chartCard]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartValue, { color: c.text }]}>
                  {latestWeight != null ? Math.round(latestWeight * 10) / 10 : '—'}
                  <Text style={[styles.chartUnit, { color: c.textMuted }]}> {weightMeta.unit}</Text>
                </Text>
                {weightDelta != null && Math.abs(weightDelta) >= 0.1 ? (
                  <View
                    style={[
                      styles.deltaPill,
                      { backgroundColor: weightDelta < 0 ? c.primaryBg : c.secondaryBg },
                    ]}
                  >
                    <Text style={[styles.deltaText, { color: weightDelta < 0 ? c.primary : c.secondary }]}>
                      {weightDelta > 0 ? '+' : '−'}
                      {Math.abs(Math.round(weightDelta * 10) / 10)} {weightMeta.unit}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.weightBars}>
                {recentWeights.map((log, i) => {
                  const h = Math.max(8, ((log.weightKg - weightMin) / (weightMax - weightMin || 1)) * 56);
                  const isLast = i === recentWeights.length - 1;
                  return (
                    <View key={`${log.loggedAt}-${i}`} style={styles.barCol}>
                      <View
                        style={[
                          styles.bar,
                          { height: h, backgroundColor: c.primary, opacity: isLast ? 1 : 0.35 },
                        ]}
                      />
                      <Text style={[styles.barLabel, { color: isLast ? c.text : c.textMuted }]}>
                        {Math.round(log.weightKg)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : null}

        {/* Appearance */}
        <SectionLabel text={strings.appearance} color={c.textSecondary} />
        <View style={cardStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${strings.theme}: ${isDark ? strings.dark : strings.light}`}
            onPress={() => {
              Haptics.selectionAsync();
              setThemeOpen(true);
            }}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}
          >
            <IconBox bg={isDark ? c.infoBg : c.secondaryBg}>
              {isDark ? <Moon size={18} color={c.info} /> : <Sun size={18} color={c.secondary} />}
            </IconBox>
            <Text style={[styles.rowTitle, { color: c.text, flex: 1 }]}>{strings.theme}</Text>
            <Text style={[styles.langValue, { color: c.textSecondary }]}>{isDark ? strings.dark : strings.light}</Text>
            <ChevronRight color={c.textMuted} size={18} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${strings.language}: ${currentLang.label}`}
            onPress={() => {
              Haptics.selectionAsync();
              setLangOpen(true);
            }}
            style={({ pressed }) => [
              styles.row,
              { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <IconBox bg={c.infoBg}>
              <Globe size={18} color={c.info} />
            </IconBox>
            <Text style={[styles.rowTitle, { color: c.text, flex: 1 }]}>{strings.language}</Text>
            <Text style={styles.langFlag}>{currentLang.flag}</Text>
            <Text style={[styles.langValue, { color: c.textSecondary }]}>{currentLang.label}</Text>
            <ChevronRight color={c.textMuted} size={18} />
          </Pressable>
        </View>

        <SectionLabel text={strings.healthSection} color={c.textSecondary} />
        <View style={cardStyle}>
          <View style={[styles.row, { paddingBottom: 6 }]}>
            <IconBox bg={c.dangerBg}>
              <HeartPulse size={18} color={c.danger} />
            </IconBox>
            <Text style={[styles.rowSub, { color: c.textMuted, flex: 1, marginTop: 0 }]}>{strings.healthSectionSub}</Text>
            {savingConditions ? <ActivityIndicator size="small" color={c.primary} /> : null}
          </View>
          {HEALTH_CONDITIONS.map((cond) => {
            const active = !!user.healthConditions?.includes(cond);
            return (
              <Pressable
                key={cond}
                onPress={() => toggleCondition(cond)}
                disabled={savingConditions}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active, disabled: savingConditions }}
                style={({ pressed }) => [
                  styles.rowCompact,
                  { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
                  active && { backgroundColor: c.primaryBg },
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={[styles.rowTitle, { color: c.text, flex: 1 }]}>{strings[`hc${cond}`]}</Text>
                <View
                  style={[
                    styles.checkbox,
                    active ? { backgroundColor: c.primary, borderColor: c.primary } : { borderColor: c.border },
                  ]}
                >
                  {active ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                </View>
              </Pressable>
            );
          })}
          <Text style={[styles.healthNote, { color: c.textMuted, borderTopColor: c.border }]}>
            {strings.healthPrivacyNote}
          </Text>
        </View>

        {/* Notifications + security */}
        <SectionLabel text={strings.notificationsSection} color={c.textSecondary} />
        <View style={cardStyle}>
          <View style={styles.row}>
            <IconBox bg={c.primaryBg}>
              <Bell size={18} color={c.primary} />
            </IconBox>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.rowTitle, { color: c.text }]}>{strings.mealRemindersTitle}</Text>
              <Text style={[styles.rowSub, { color: c.textMuted }]}>{strings.mealRemindersSub}</Text>
            </View>
            <IOSSwitch
              value={mealRemindersEnabled}
              onValueChange={toggleReminders}
              accessibilityLabel={strings.mealRemindersTitle}
              {...switchColors}
            />
          </View>
        </View>

        <SectionLabel text={strings.securitySection} color={c.textSecondary} />
        <View style={cardStyle}>
          <View style={styles.row}>
            <IconBox bg={c.purpleBg}>
              <ScanFace size={18} color={c.purple} />
            </IconBox>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.rowTitle, { color: c.text }]}>{strings.biometricLockTitle}</Text>
              <Text style={[styles.rowSub, { color: c.textMuted }]}>{strings.biometricLockSub}</Text>
            </View>
            <IOSSwitch
              value={biometricLockEnabled}
              onValueChange={toggleBiometricLock}
              accessibilityLabel={strings.biometricLockTitle}
              {...switchColors}
            />
          </View>
        </View>

        <SectionLabel text={strings.legalSection} color={c.textSecondary} />
        <View style={cardStyle}>
          {(
            [
              { page: 'privacy', title: strings.privacyPolicy, icon: <ShieldCheck size={18} color={c.primary} /> },
              { page: 'terms', title: strings.termsOfUse, icon: <FileText size={18} color={c.primary} /> },
            ] as const
          ).map((item, i) => (
            <Pressable
              key={item.page}
              onPress={() => openLegal(item.page)}
              accessibilityRole="link"
              style={({ pressed }) => [
                styles.rowCompact,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <IconBox bg={c.primaryBg}>{item.icon}</IconBox>
              <Text style={[styles.rowTitle, { color: c.text, flex: 1 }]}>{item.title}</Text>
              <ChevronRight color={c.textMuted} size={18} />
            </Pressable>
          ))}
          {isLoggedIn ? (
            <Pressable
              onPress={askDeleteAccount}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.rowCompact,
                { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <IconBox bg={c.dangerBg}>
                <Trash2 size={18} color={c.danger} />
              </IconBox>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: c.danger }]}>{strings.deleteAccount}</Text>
                <Text style={[styles.rowSub, { color: c.textMuted }]}>{strings.deleteAccountSub}</Text>
              </View>
              <ChevronRight color={c.textMuted} size={18} />
            </Pressable>
          ) : null}
        </View>

        {isLoggedIn ? (
          <Pressable
            onPress={askLogout}
            style={({ pressed }) => [
              styles.logoutBtn,
              { backgroundColor: c.dangerBg, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <LogOut color={c.danger} size={18} />
            <Text style={[styles.logoutText, { color: c.danger }]}>{strings.logout}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <StatusBarScrim color={c.background} />

      {pickerType != null ? (
        <WheelSelectModal
          visible
          title={
            pickerType === 'weight'
              ? strings.weightKg
              : pickerType === 'height'
                ? strings.heightCm
                : strings.age
          }
          options={pickerValues.map((v) => ({
            label: String(v),
            value: v,
          }))}
          selectedValue={pickerValue}
          isDark={isDark}
          unit={pickerType === 'weight' ? weightMeta.unit : pickerType === 'height' ? heightMeta.unit : ''}
          onClose={() => setPickerType(null)}
          onValueChange={(v) => {
            if (pickerType === 'weight') setWeight(String(v));
            if (pickerType === 'height') setHeight(String(v));
            if (pickerType === 'age') setAge(String(v));
          }}
          onConfirm={() => setPickerType(null)}
        />
      ) : null}

      <PaywallModal />

      <CustomModal visible={themeOpen} onClose={() => setThemeOpen(false)} title={strings.theme}>
        {([
          ['light', Sun, c.secondary, strings.light],
          ['dark', Moon, c.info, strings.dark],
        ] as const).map(([mode, Icon, tint, label]) => {
          const active = (mode === 'dark') === isDark;
          return (
            <Pressable
              key={mode}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => {
                Haptics.selectionAsync();
                setThemeMode(mode);
                setThemeOpen(false);
              }}
              style={({ pressed }) => [
                styles.langOption,
                active && { backgroundColor: c.primaryBg },
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Icon size={20} color={tint} />
              <Text style={[styles.rowTitle, { color: active ? c.primary : c.text, flex: 1 }]}>{label}</Text>
              {active ? <Check size={18} color={c.primary} strokeWidth={2.6} /> : null}
            </Pressable>
          );
        })}
      </CustomModal>

      <CustomModal visible={langOpen} onClose={() => setLangOpen(false)} title={strings.language}>
        <ScrollView style={styles.langList} bounces={false} showsVerticalScrollIndicator={false}>
          {LANGUAGES.map((l) => {
            const active = language === l.code;
            return (
              <Pressable
                key={l.code}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setLanguage(l.code);
                  setLangOpen(false);
                }}
                style={({ pressed }) => [
                  styles.langOption,
                  active && { backgroundColor: c.primaryBg },
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.langOptionFlag}>{l.flag}</Text>
                <Text style={[styles.rowTitle, { color: active ? c.primary : c.text, flex: 1 }]}>{l.label}</Text>
                {active ? <Check size={18} color={c.primary} strokeWidth={2.6} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </CustomModal>

      <CustomModal visible={logoutOpen} onClose={() => setLogoutOpen(false)} hideHeader>
        <View style={styles.confirmBody}>
          <View style={[styles.confirmIcon, { backgroundColor: c.dangerBg }]}>
            <LogOut color={c.danger} size={26} />
          </View>
          <Text style={[styles.confirmTitle, { color: c.text }]}>{strings.logoutConfirmTitle}</Text>
          <Text style={[styles.confirmMsg, { color: c.textSecondary }]}>{strings.logoutConfirmMsg}</Text>
          <View style={styles.confirmActions}>
            <Pressable
              onPress={() => setLogoutOpen(false)}
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: c.cardHover, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.confirmBtnText, { color: c.text }]}>{strings.cancelBtn}</Text>
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: c.danger, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.confirmBtnText, { color: '#FFFFFF' }]}>{strings.logout}</Text>
            </Pressable>
          </View>
        </View>
      </CustomModal>

      <CustomModal visible={deleteOpen} onClose={closeDeleteAccount} hideHeader>
        <View style={styles.confirmBody}>
          <View style={[styles.confirmIcon, { backgroundColor: c.dangerBg }]}>
            <Trash2 color={c.danger} size={26} />
          </View>
          <Text style={[styles.confirmTitle, { color: c.text }]}>{strings.deleteAccountTitle}</Text>
          <Text style={[styles.confirmMsg, { color: c.textSecondary }]}>{strings.deleteAccountMsg}</Text>
          <Text style={[styles.confirmMsg, { color: c.textMuted, fontSize: 12 }]}>
            {strings.deleteAccountSubscriptionNote}
          </Text>
          <View style={styles.deleteField}>
            <TextField
              label={strings.password}
              value={deletePassword}
              onChangeText={(v) => {
                setDeletePassword(v);
                if (deleteError) setDeleteError('');
              }}
              error={deleteError || undefined}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              autoComplete="password"
              editable={!deleting}
              onSubmitEditing={handleDeleteAccount}
              returnKeyType="done"
            />
          </View>
          <View style={[styles.confirmActions, { marginTop: Spacing.lg }]}>
            <Pressable
              onPress={closeDeleteAccount}
              disabled={deleting}
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: c.cardHover, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.confirmBtnText, { color: c.text }]}>{strings.cancelBtn}</Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteAccount}
              disabled={deleting}
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: c.danger, opacity: pressed || deleting ? 0.8 : 1 },
              ]}
            >
              {deleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.confirmBtnText, { color: '#FFFFFF' }]}>
                  {strings.deleteAccountConfirmBtn}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </CustomModal>
    </View>
  );
}

function HeroStat({
  value,
  unit,
  label,
  onPress,
}: {
  value: string;
  unit?: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.heroStat, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.heroStatValue}>
        {value}
        {unit ? <Text style={styles.heroStatUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.heroStatLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function SectionLabel({ text, color }: { text: string; color: string }) {
  return <Text style={[styles.sectionLabel, { color }]}>{text}</Text>;
}

function IconBox({ bg, children }: { bg: string; children: React.ReactNode }) {
  return <View style={[styles.iconBox, { backgroundColor: bg }]}>{children}</View>;
}

function Radio({ active, colors }: { active: boolean; colors: Palette }) {
  return active ? (
    <View style={[styles.radio, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
      <Check size={12} color="#FFFFFF" strokeWidth={3} />
    </View>
  ) : (
    <View style={[styles.radio, { borderColor: colors.border }]} />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },

  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.lg,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -70,
    top: -90,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarWrap: { width: 68, height: 68 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 68, height: 68 },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroName: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: FontSize.lg + 2,
    fontWeight: '800',
    letterSpacing: -0.3,
    ...androidTextFix,
  },
  heroPhone: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, marginTop: 3, ...androidTextFix },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  proPillText: { color: '#FBBF24', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatValue: { color: '#FFFFFF', fontSize: FontSize.xl, fontWeight: '800', letterSpacing: -0.4, ...androidTextFix },
  heroStatUnit: { fontSize: FontSize.sm, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  heroStatLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '500', ...androidTextFix },
  heroDivider: { width: StyleSheet.hairlineWidth * 2, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroSeg: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.14)',
    borderRadius: Radius.md,
    padding: 3,
  },
  heroSegBtn: { flex: 1, height: 36, borderRadius: Radius.sm + 1, alignItems: 'center', justifyContent: 'center' },
  heroSegBtnActive: { backgroundColor: '#FFFFFF' },
  heroSegText: { fontSize: FontSize.sm, fontWeight: '700', ...androidTextFix },

  card: {
    borderRadius: Radius.lg + 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg + 2,
  },
  promoIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  promoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promoTitle: { color: '#FFFFFF', fontSize: FontSize.md + 1, fontWeight: '800', ...androidTextFix },
  promoSub: { color: 'rgba(255,255,255,0.82)', fontSize: FontSize.xs, marginTop: 3, lineHeight: 16, ...androidTextFix },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  tagText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
    marginBottom: -4,
    marginLeft: 4,
    ...androidTextFix,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  rowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
  },
  rowTitle: { fontSize: FontSize.md, fontWeight: '600', ...androidTextFix },
  rowSub: { fontSize: 12, marginTop: 2, lineHeight: 16, ...androidTextFix },
  iconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthNote: {
    fontSize: 11,
    lineHeight: 15,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...androidTextFix,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, width: 36, height: 20, justifyContent: 'center' },
  activityBar: { width: 4, borderRadius: 2 },
  multText: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'], ...androidTextFix },

  targetCard: { padding: Spacing.lg, gap: Spacing.md, marginTop: Spacing.xs },
  targetTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  targetLabel: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', ...androidTextFix },
  targetValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  targetValue: { fontSize: 40, fontWeight: '800', letterSpacing: -1.2, lineHeight: 44, ...androidTextFix },
  targetUnit: { fontSize: FontSize.md, fontWeight: '600', marginBottom: 6, ...androidTextFix },
  saveBtn: { height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: FontSize.md, fontWeight: '700', ...androidTextFix },

  chartCard: { padding: Spacing.lg, gap: Spacing.md },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartValue: { fontSize: FontSize.xl, fontWeight: '800', letterSpacing: -0.4, ...androidTextFix },
  chartUnit: { fontSize: FontSize.sm, fontWeight: '600' },
  deltaPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  deltaText: { fontSize: 12, fontWeight: '700', ...androidTextFix },
  weightBars: { flexDirection: 'row', alignItems: 'flex-end', height: 76, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '55%', borderRadius: 6 },
  barLabel: { fontSize: 10, fontWeight: '600' },

  langFlag: { fontSize: 16 },
  langValue: { fontSize: 14, fontWeight: '500', ...androidTextFix },
  langList: { maxHeight: 440 },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  langOptionFlag: { fontSize: 20 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  logoutText: { fontSize: FontSize.md, fontWeight: '700', ...androidTextFix },

  confirmBody: { alignItems: 'center', paddingTop: Spacing.sm },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  confirmTitle: { fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center', ...androidTextFix },
  confirmMsg: {
    fontSize: FontSize.sm,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: Spacing.sm,
    ...androidTextFix,
  },
  deleteField: { alignSelf: 'stretch', marginTop: Spacing.lg },
  confirmActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl, alignSelf: 'stretch' },
  confirmBtn: { flex: 1, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: FontSize.md, fontWeight: '700', ...androidTextFix },
});
