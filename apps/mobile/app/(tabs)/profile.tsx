import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Modal,
  FlatList,
  Switch,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Crown,
  Moon,
  Sun,
  Globe,
  Flame,
  Scale,
  Dumbbell,
  Target,
  Check,
  Plus,
  Minus,
  X,
  Sparkles,
  Bell,
  LogIn,
  LogOut,
  UserCheck,
  ShieldCheck,
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../src/store/useAppStore';
import { useDiaryStore } from '../../src/store/useDiaryStore';
import { useToastStore } from '../../src/store/useToastStore';
import { CustomModal } from '../../src/shared/ui/CustomModal';
import { WheelSelectModal } from '../../src/shared/ui/WheelSelectModal';
import { Language } from '../../src/shared/i18n/translations';
import { NotificationService } from '../../src/shared/notifications/notification.service';
import { ApiClient } from '../../src/shared/api/api-client';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    isLoggedIn,
    language,
    themeMode,
    mealRemindersEnabled,
    setLanguage,
    setThemeMode,
    setMealRemindersEnabled,
    setAvatarUrl,
    updateUserStats,
    login,
    logout,
    t,
    theme,
  } = useAppStore();
  const { calorieGoal, setCalorieGoal, refreshDiary } = useDiaryStore();
  const { showToast } = useToastStore();
  const currentTheme = theme();
  const isDark = themeMode === 'dark';
  const strings = t();

  const [refreshing, setRefreshing] = useState(false);

  // Physical Stats Local State
  const [weight, setWeight] = useState(user.weightKg?.toString() || '80');
  const [height, setHeight] = useState(user.heightCm?.toString() || '180');
  const [age, setAge] = useState(user.age?.toString() || '25');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(user.gender || 'MALE');
  const [goal, setGoal] = useState<'LOSE_WEIGHT' | 'MAINTAIN' | 'BUILD_MUSCLE'>(
    user.fitnessGoal || 'LOSE_WEIGHT',
  );

  // Stat adjustment picker modal
  const [pickerType, setPickerType] = useState<'weight' | 'height' | 'age' | null>(null);

  // Auth modal
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    setWeight(user.weightKg?.toString() || '80');
    setHeight(user.heightCm?.toString() || '180');
    setAge(user.age?.toString() || '25');
    setGender(user.gender || 'MALE');
    setGoal(user.fitnessGoal || 'LOSE_WEIGHT');
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refreshDiary();
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  };

  const pickAvatar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast('Rasmni yuklash uchun galereyaga ruxsat bering.', 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUrl(result.assets[0].uri);
      showToast('Profil rasmi yangilandi!', 'success');
    }
  };

  // Calculate Real TDEE dynamically
  const calculateCurrentTdee = () => {
    const w = parseFloat(weight) || 80;
    const h = parseFloat(height) || 180;
    const a = parseInt(age, 10) || 25;

    let bmr = 10 * w + 6.25 * h - 5 * a;
    bmr += gender === 'MALE' ? 5 : -161;

    let tdee = Math.round(bmr * 1.55);
    if (goal === 'LOSE_WEIGHT') tdee -= 400;
    if (goal === 'BUILD_MUSCLE') tdee += 350;

    return Math.max(1200, Math.round(tdee));
  };

  const calculatedTdee = calculateCurrentTdee();

  const handleSaveStats = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const w = parseFloat(weight) || 80;
    const h = parseFloat(height) || 180;
    const a = parseInt(age, 10) || 25;

    const newGoal = calculatedTdee;
    setCalorieGoal(newGoal);
    updateUserStats({
      weightKg: w,
      heightCm: h,
      age: a,
      gender,
      fitnessGoal: goal,
    });

    if (isLoggedIn) {
      try {
        await ApiClient.saveGoals({
          age: a,
          gender,
          weightKg: w,
          heightCm: h,
          activityLevel: user.activityLevel || 'MODERATE',
          goal,
        });
      } catch (err) {
        console.log('Sync goals notice:', err);
      }
    }

    showToast(strings.saved, 'success');
  };

  const handleAuthSubmit = async () => {
    const rawDigits = phoneNumber.replace(/\D/g, '');
    if (rawDigits.length < 9) {
      showToast('Iltimos, to‘liq telefon raqam kiriting', 'warning');
      return;
    }

    if (authPassword.length < 6) {
      showToast('Parol kamida 6 ta belgidan iborat bo‘lishi kerak', 'warning');
      return;
    }

    const fullPhone = `+998${rawDigits.slice(-9)}`;
    const displayName = isRegisterMode ? (authName.trim() || 'Foydalanuvchi') : '';

    setAuthLoading(true);
    try {
      let res;
      if (isRegisterMode) {
        res = await ApiClient.register(fullPhone, displayName || 'Foydalanuvchi', authPassword);
      } else {
        res = await ApiClient.login(fullPhone, authPassword);
      }

      if (res && res.accessToken) {
        login(
          res.user?.email || fullPhone,
          res.user?.name || displayName || 'Foydalanuvchi',
          res.accessToken,
          res.user?.phone || fullPhone,
          res.user?.profile,
        );

        if (res.user?.profile) {
          const p = res.user.profile;
          if (p.dailyCalorieGoal) setCalorieGoal(p.dailyCalorieGoal);
          if (p.weightKg) setWeight(p.weightKg.toString());
          if (p.heightCm) setHeight(p.heightCm.toString());
          if (p.age) setAge(p.age.toString());
          if (p.gender) setGender(p.gender);
          if (p.goal) setGoal(p.goal);
        }

        // Fetch fresh diary for this specific user
        await refreshDiary();

        setAuthModalVisible(false);
        setPhoneNumber('');
        setAuthPassword('');
        setAuthName('');
        showToast(strings.authSuccess || 'Muvaffaqiyatli kirdingiz!', 'success');
      }
    } catch (err: any) {
      console.log('Auth error:', err);
      showToast(err?.message || 'Kirishda xatolik yuz berdi', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Clean phone string without duplicated flag emoji
  const cleanPhone = (user.phone || '+998 90 150 26 57').replace(/[^\d+\s]/g, '').trim();

  // Generator for picker ranges
  const getPickerList = () => {
    if (pickerType === 'weight') {
      const list = [];
      for (let i = 40; i <= 180; i++) list.push(i);
      return list;
    }
    if (pickerType === 'height') {
      const list = [];
      for (let i = 120; i <= 220; i++) list.push(i);
      return list;
    }
    if (pickerType === 'age') {
      const list = [];
      for (let i = 14; i <= 80; i++) list.push(i);
      return list;
    }
    return [];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B0F19' : currentTheme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentTheme.primary}
            colors={[currentTheme.primary]}
          />
        }
      >
        {/* 1. Header Profile Card */}
        <View
          style={[
            styles.userHeaderCard,
            {
              backgroundColor: isDark ? '#131B2A' : currentTheme.card,
              borderColor: isDark ? '#1E293B' : currentTheme.border,
            },
          ]}
        >
          <View style={styles.userHeaderLeft}>
            <TouchableOpacity activeOpacity={0.85} onPress={pickAvatar} style={styles.avatarContainer}>
              <View style={styles.avatarBorderRing}>
                <Image
                  source={{
                    uri:
                      user.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
                  }}
                  style={styles.avatarImg}
                />
              </View>
              <View style={styles.onlineBadge} />
            </TouchableOpacity>
            <View style={styles.userHeaderInfo}>
              <Text style={[styles.userDisplayName, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                {user.name || 'Foydalanuvchi'}
              </Text>
              <View style={styles.phoneRow}>
                <Text style={styles.flagEmoji}>🇺🇿</Text>
                <Text style={[styles.userPhoneNumber, { color: isDark ? '#94A3B8' : currentTheme.textMuted }]}>
                  {cleanPhone}
                </Text>
              </View>
            </View>
          </View>

          {/* Premium Badge */}
          <View style={styles.premiumBadge}>
            <Crown color="#F59E0B" size={13} fill="#F59E0B" />
            <Text style={styles.premiumBadgeText}>Premium obuna</Text>
          </View>
        </View>

        {/* 2. Section: ILOVA KO'RINISHI */}
        <Text style={[styles.sectionTitleHeader, { color: isDark ? '#64748B' : currentTheme.textSecondary }]}>
          ILOVA KO'RINISHI
        </Text>
        <View
          style={[
            styles.groupedCard,
            {
              backgroundColor: isDark ? '#131B2A' : currentTheme.card,
              borderColor: isDark ? '#1E293B' : currentTheme.border,
            },
          ]}
        >
          {/* Theme Row */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <View style={[styles.iconCircleBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Moon color="#10B981" size={16} />
              </View>
              <Text style={[styles.settingLabelText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                {strings.theme}
              </Text>
            </View>

            <View style={[styles.segmentedPillTrack, { backgroundColor: isDark ? '#0F1626' : '#F1F5F9' }]}>
              <TouchableOpacity
                style={[
                  styles.segmentedPillBtn,
                  isDark && styles.segmentedPillBtnActiveDark,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setThemeMode('dark');
                }}
              >
                <Text
                  style={[
                    styles.segmentedPillBtnText,
                    { color: isDark ? '#10B981' : '#64748B', fontWeight: isDark ? '700' : '500' },
                  ]}
                >
                  Qorong'i (Dark)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentedPillBtn,
                  !isDark && styles.segmentedPillBtnActiveLight,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setThemeMode('light');
                }}
              >
                <Text
                  style={[
                    styles.segmentedPillBtnText,
                    { color: !isDark ? '#10B981' : '#64748B', fontWeight: !isDark ? '700' : '500' },
                  ]}
                >
                  Yorug' (Light)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />

          {/* Language Row */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <View style={[styles.iconCircleBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Globe color="#3B82F6" size={16} />
              </View>
              <Text style={[styles.settingLabelText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                {strings.language}
              </Text>
            </View>

            <View style={[styles.segmentedPillTrack, { backgroundColor: isDark ? '#0F1626' : '#F1F5F9' }]}>
              {(['uz', 'ru', 'en'] as Language[]).map((lang) => {
                const isActive = language === lang;
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.langPillBtn,
                      isActive && (isDark ? styles.segmentedPillBtnActiveDark : styles.segmentedPillBtnActiveLight),
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setLanguage(lang);
                    }}
                  >
                    <Text
                      style={[
                        styles.segmentedPillBtnText,
                        { color: isActive ? '#10B981' : '#64748B', fontWeight: isActive ? '700' : '500' },
                      ]}
                    >
                      {lang.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />

          {/* 3. Meal Reminders Row */}
          <View style={[styles.settingRow, { alignItems: 'center' }]}>
            <View style={[styles.settingLabelRow, { flex: 1, paddingRight: 8 }]}>
              <View style={[styles.iconCircleBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Bell color="#F59E0B" size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabelText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                  {strings.mealRemindersTitle}
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : currentTheme.textSecondary, marginTop: 2 }}>
                  {strings.mealRemindersSub}
                </Text>
              </View>
            </View>

            <Switch
              value={mealRemindersEnabled}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMealRemindersEnabled(val);
                showToast(
                  val
                    ? 'Eslatmalar yoqildi (08:30, 13:00, 19:30)'
                    : 'Eslatmalar o‘chirildi',
                  'success'
                );
              }}
              trackColor={{ false: isDark ? '#1E293B' : '#CBD5E1', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

        </View>

        {/* 3. Section: JISMONIY KO'RSATKICHLAR */}
        <Text style={[styles.sectionTitleHeader, { color: isDark ? '#64748B' : currentTheme.textSecondary }]}>
          JISMONIY KO'RSATKICHLAR
        </Text>
        <View
          style={[
            styles.groupedCard,
            {
              backgroundColor: isDark ? '#131B2A' : currentTheme.card,
              borderColor: isDark ? '#1E293B' : currentTheme.border,
            },
          ]}
        >
          {/* Row 1: Vazn + Gender */}
          <View style={styles.statRowFlex}>
            <View style={styles.statRowLeftTouchable}>
              <Text style={[styles.statLabelText, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
                Vazn (kg)
              </Text>
              <View style={[styles.statValueBox, { backgroundColor: isDark ? '#0F1626' : '#F1F5F9', borderColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                <TextInput
                  style={[styles.statValueTextInput, { color: isDark ? '#F8FAFC' : currentTheme.text }]}
                  keyboardType="numeric"
                  maxLength={3}
                  value={weight}
                  onChangeText={(val) => setWeight(val.replace(/\D/g, ''))}
                />
              </View>
            </View>

            {/* Gender Toggle */}
            <View style={[styles.genderSegmentTrack, { backgroundColor: isDark ? '#0F1626' : '#F1F5F9' }]}>
              <TouchableOpacity
                style={[
                  styles.genderSegmentBtn,
                  gender === 'MALE' && styles.genderSegmentBtnActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGender('MALE');
                }}
              >
                <Text style={styles.genderIconEmoji}>👦</Text>
                <Text
                  style={[
                    styles.genderBtnText,
                    { color: gender === 'MALE' ? '#10B981' : '#64748B', fontWeight: gender === 'MALE' ? '700' : '500' },
                  ]}
                >
                  Erkak
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderSegmentBtn,
                  gender === 'FEMALE' && styles.genderSegmentBtnActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGender('FEMALE');
                }}
              >
                <Text style={styles.genderIconEmoji}>👩</Text>
                <Text
                  style={[
                    styles.genderBtnText,
                    { color: gender === 'FEMALE' ? '#10B981' : '#64748B', fontWeight: gender === 'FEMALE' ? '700' : '500' },
                  ]}
                >
                  Ayol
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />

          {/* Row 2: Bo'y (sm) */}
          <View style={styles.statRowSimple}>
            <Text style={[styles.statLabelText, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
              Bo'y (sm)
            </Text>
            <View style={[styles.statValueBox, { backgroundColor: isDark ? '#0F1626' : '#F1F5F9', borderColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
              <TextInput
                style={[styles.statValueTextInput, { color: isDark ? '#F8FAFC' : currentTheme.text }]}
                keyboardType="numeric"
                maxLength={3}
                value={height}
                onChangeText={(val) => setHeight(val.replace(/\D/g, ''))}
              />
            </View>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />

          {/* Row 3: Yosh */}
          <View style={styles.statRowSimple}>
            <Text style={[styles.statLabelText, { color: isDark ? '#94A3B8' : currentTheme.textSecondary }]}>
              Yosh
            </Text>
            <View style={[styles.statValueBox, { backgroundColor: isDark ? '#0F1626' : '#F1F5F9', borderColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
              <TextInput
                style={[styles.statValueTextInput, { color: isDark ? '#F8FAFC' : currentTheme.text }]}
                keyboardType="numeric"
                maxLength={3}
                value={age}
                onChangeText={(val) => setAge(val.replace(/\D/g, ''))}
              />
            </View>
          </View>
        </View>

        {/* 4. Section: MAQSAD */}
        <Text style={[styles.sectionTitleHeader, { color: isDark ? '#64748B' : currentTheme.textSecondary }]}>
          MAQSAD
        </Text>
        <View style={styles.goalCardsStack}>
          {/* Goal 1: Vazn tashlash */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              Haptics.selectionAsync();
              setGoal('LOSE_WEIGHT');
            }}
            style={[
              styles.goalCard,
              {
                backgroundColor: isDark ? '#131B2A' : currentTheme.card,
                borderColor: goal === 'LOSE_WEIGHT' ? '#10B981' : isDark ? '#1E293B' : currentTheme.border,
              },
              goal === 'LOSE_WEIGHT' && styles.goalCardActiveGlow,
            ]}
          >
            <View style={styles.goalRadioOuter}>
              {goal === 'LOSE_WEIGHT' ? (
                <View style={styles.goalRadioInnerActive} />
              ) : (
                <View style={styles.goalRadioInnerInactive} />
              )}
            </View>

            <View style={[styles.goalIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Flame color="#F59E0B" size={20} fill="#F59E0B" />
            </View>

            <View style={styles.goalTextContent}>
              <Text style={[styles.goalTitleText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                Vazn tashlash
              </Text>
              <Text style={[styles.goalDescText, { color: isDark ? '#64748B' : currentTheme.textMuted }]}>
                400 kcal defitsit
              </Text>
            </View>

            {goal === 'LOSE_WEIGHT' && (
              <Check color="#10B981" size={20} strokeWidth={2.5} />
            )}
          </TouchableOpacity>

          {/* Goal 2: Vazni saqlash */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              Haptics.selectionAsync();
              setGoal('MAINTAIN');
            }}
            style={[
              styles.goalCard,
              {
                backgroundColor: isDark ? '#131B2A' : currentTheme.card,
                borderColor: goal === 'MAINTAIN' ? '#10B981' : isDark ? '#1E293B' : currentTheme.border,
              },
              goal === 'MAINTAIN' && styles.goalCardActiveGlow,
            ]}
          >
            <View style={styles.goalRadioOuter}>
              {goal === 'MAINTAIN' ? (
                <View style={styles.goalRadioInnerActive} />
              ) : (
                <View style={styles.goalRadioInnerInactive} />
              )}
            </View>

            <View style={[styles.goalIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Scale color="#3B82F6" size={20} />
            </View>

            <View style={styles.goalTextContent}>
              <Text style={[styles.goalTitleText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                Vazni saqlash
              </Text>
              <Text style={[styles.goalDescText, { color: isDark ? '#64748B' : currentTheme.textMuted }]}>
                Balanslangan rejim
              </Text>
            </View>

            {goal === 'MAINTAIN' && (
              <Check color="#10B981" size={20} strokeWidth={2.5} />
            )}
          </TouchableOpacity>

          {/* Goal 3: Mushak massasi */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              Haptics.selectionAsync();
              setGoal('BUILD_MUSCLE');
            }}
            style={[
              styles.goalCard,
              {
                backgroundColor: isDark ? '#131B2A' : currentTheme.card,
                borderColor: goal === 'BUILD_MUSCLE' ? '#10B981' : isDark ? '#1E293B' : currentTheme.border,
              },
              goal === 'BUILD_MUSCLE' && styles.goalCardActiveGlow,
            ]}
          >
            <View style={styles.goalRadioOuter}>
              {goal === 'BUILD_MUSCLE' ? (
                <View style={styles.goalRadioInnerActive} />
              ) : (
                <View style={styles.goalRadioInnerInactive} />
              )}
            </View>

            <View style={[styles.goalIconBox, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
              <Dumbbell color="#EAB308" size={20} />
            </View>

            <View style={styles.goalTextContent}>
              <Text style={[styles.goalTitleText, { color: isDark ? '#F8FAFC' : currentTheme.text }]}>
                Mushak massasi
              </Text>
              <Text style={[styles.goalDescText, { color: isDark ? '#64748B' : currentTheme.textMuted }]}>
                350 kcal profitsit
              </Text>
            </View>

            {goal === 'BUILD_MUSCLE' && (
              <Check color="#10B981" size={20} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>

        {/* 5. Section: RESULTS */}
        <Text style={[styles.sectionTitleHeader, { color: isDark ? '#64748B' : currentTheme.textSecondary }]}>
          RESULTS
        </Text>
        <View
          style={[
            styles.resultsCard,
            {
              backgroundColor: isDark ? '#131B2A' : currentTheme.card,
              borderColor: isDark ? '#1E293B' : currentTheme.border,
            },
          ]}
        >
          <View style={[styles.resultsTargetCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Target color="#F59E0B" size={24} />
          </View>
          <View style={styles.resultsContent}>
            <Text style={[styles.resultsLabelText, { color: isDark ? '#94A3B8' : currentTheme.textMuted }]}>
              Hisoblangan kunlik me'yor (TDEE)
            </Text>
            <Text style={styles.resultsKcalValue}>
              {calculatedTdee} kcal
            </Text>
          </View>
        </View>

        {/* 6. Save Goals Button */}
        <TouchableOpacity
          style={styles.saveGoalsBtn}
          activeOpacity={0.88}
          onPress={handleSaveStats}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGoalsBtnGradient}
          >
            <Text style={styles.saveGoalsBtnText}>{strings.saveGoals}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 7. Re-calculate via Onboarding Flow */}
        <TouchableOpacity
          style={[
            styles.onboardingLinkBtn,
            { backgroundColor: isDark ? '#131B2A' : '#F1F5F9', borderColor: isDark ? '#1E293B' : '#E2E8F0' },
          ]}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/onboarding');
          }}
        >
          <Sparkles color="#00E599" size={16} />
          <Text style={[styles.onboardingLinkText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
            Shaxsiy rejani qayta hisoblash (Onboarding)
          </Text>
        </TouchableOpacity>

        {/* 8. Account & Security Section */}
        <Text style={[styles.sectionTitleHeader, { color: isDark ? '#64748B' : currentTheme.textSecondary, marginTop: 24 }]}>
          HISOB VA XAVFSIZLIK
        </Text>
        <View
          style={[
            styles.groupedCard,
            {
              backgroundColor: isDark ? '#131B2A' : currentTheme.card,
              borderColor: isDark ? '#1E293B' : currentTheme.border,
            },
          ]}
        >
          {isLoggedIn ? (
            <View style={{ padding: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.iconCircleBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <ShieldCheck color="#10B981" size={18} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#F8FAFC' : currentTheme.text }}>
                      Hisob faol
                    </Text>
                    <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : currentTheme.textMuted }}>
                      {cleanPhone || user.email}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700' }}>Ulangan</Text>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                  borderWidth: 1,
                  borderRadius: 14,
                  paddingVertical: 12,
                  marginTop: 6,
                }}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  logout();
                  showToast('Hisobdan chiqildi', 'info');
                }}
              >
                <LogOut color="#EF4444" size={16} />
                <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>
                  Hisobdan chiqish (Logout)
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ padding: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={[styles.iconCircleBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <LogIn color="#3B82F6" size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#F8FAFC' : currentTheme.text }}>
                    Mehmon rejimi
                  </Text>
                  <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : currentTheme.textMuted }}>
                    Ma’lumotlaringiz xavfsiz saqlanishi uchun hisobingizga kiring
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: currentTheme.primary,
                    borderRadius: 14,
                    paddingVertical: 12,
                  }}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsRegisterMode(false);
                    setAuthModalVisible(true);
                  }}
                >
                  <LogIn color="#FFFFFF" size={15} />
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Kirish</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                    borderRadius: 14,
                    paddingVertical: 12,
                  }}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsRegisterMode(true);
                    setAuthModalVisible(true);
                  }}
                >
                  <UserCheck color={isDark ? '#F8FAFC' : '#0F172A'} size={15} />
                  <Text style={{ color: isDark ? '#F8FAFC' : '#0F172A', fontSize: 13, fontWeight: '700' }}>
                    Ro‘yxatdan o‘tish
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Wheel Select Modals using @react-native-picker/picker */}
      <WheelSelectModal<string>
        visible={pickerType === 'weight'}
        title="Vaznni tanlang (kg)"
        selectedValue={weight}
        options={Array.from({ length: 141 }, (_, i) => i + 40).map((w) => ({
          label: String(w),
          value: String(w),
        }))}
        unit="kg"
        isDark={isDark}
        onValueChange={(val) => setWeight(val)}
        onClose={() => setPickerType(null)}
      />

      <WheelSelectModal<string>
        visible={pickerType === 'height'}
        title="Bo‘yni tanlang (sm)"
        selectedValue={height}
        options={Array.from({ length: 101 }, (_, i) => i + 120).map((h) => ({
          label: String(h),
          value: String(h),
        }))}
        unit="sm"
        isDark={isDark}
        onValueChange={(val) => setHeight(val)}
        onClose={() => setPickerType(null)}
      />

      <WheelSelectModal<string>
        visible={pickerType === 'age'}
        title="Yoshni tanlang"
        selectedValue={age}
        options={Array.from({ length: 72 }, (_, i) => i + 14).map((a) => ({
          label: String(a),
          value: String(a),
        }))}
        unit="yosh"
        isDark={isDark}
        onValueChange={(val) => setAge(val)}
        onClose={() => setPickerType(null)}
      />

      {/* Auth Modal */}
      <CustomModal
        visible={authModalVisible}
        onClose={() => {
          if (!authLoading) setAuthModalVisible(false);
        }}
        title={isRegisterMode ? 'Ro‘yxatdan o‘tish' : 'Tizimga kirish'}
      >
        <View style={styles.modalContentWrapper}>
          {/* Mode Switcher Tabs */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: isDark ? '#0F1626' : '#F1F5F9',
              borderRadius: 12,
              padding: 4,
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: !isRegisterMode ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
              }}
              onPress={() => setIsRegisterMode(false)}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: !isRegisterMode ? '700' : '500',
                  color: !isRegisterMode ? '#10B981' : isDark ? '#94A3B8' : '#64748B',
                }}
              >
                Kirish
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: isRegisterMode ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
              }}
              onPress={() => setIsRegisterMode(true)}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isRegisterMode ? '700' : '500',
                  color: isRegisterMode ? '#10B981' : isDark ? '#94A3B8' : '#64748B',
                }}
              >
                Ro‘yxatdan o‘tish
              </Text>
            </TouchableOpacity>
          </View>

          {isRegisterMode && (
            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalInputLabel, { color: currentTheme.textMuted }]}>Ismingiz</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: currentTheme.cardHover, color: currentTheme.text, borderColor: currentTheme.border }]}
                placeholder="Ismingizni kiriting"
                placeholderTextColor={currentTheme.textMuted}
                value={authName}
                onChangeText={setAuthName}
              />
            </View>
          )}

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalInputLabel, { color: currentTheme.textMuted }]}>Telefon raqam</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: currentTheme.cardHover, color: currentTheme.text, borderColor: currentTheme.border }]}
              placeholder="+998 90 123 45 67"
              placeholderTextColor={currentTheme.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalInputLabel, { color: currentTheme.textMuted }]}>Parol (kamida 6 ta belgi)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: currentTheme.cardHover, color: currentTheme.text, borderColor: currentTheme.border }]}
              placeholder="Parolingizni kiriting"
              placeholderTextColor={currentTheme.textMuted}
              secureTextEntry
              value={authPassword}
              onChangeText={setAuthPassword}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.modalSubmitBtn,
              { backgroundColor: currentTheme.primary, opacity: authLoading ? 0.7 : 1 },
            ]}
            disabled={authLoading}
            onPress={handleAuthSubmit}
          >
            {authLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.modalSubmitBtnText}>{isRegisterMode ? 'Ro‘yxatdan o‘tish' : 'Kirish'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </CustomModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  userHeaderCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  userHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorderRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#10B981',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#131B2A',
  },
  userHeaderInfo: {
    justifyContent: 'center',
  },
  userDisplayName: {
    fontSize: 16,
    fontWeight: '800',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  flagEmoji: {
    fontSize: 13,
  },
  userPhoneNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  sectionTitleHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  groupedCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentedPillTrack: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segmentedPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  segmentedPillBtnActiveDark: {
    backgroundColor: '#162235',
  },
  segmentedPillBtnActiveLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentedPillBtnText: {
    fontSize: 11,
  },
  dividerLine: {
    height: 1,
    width: '100%',
  },
  statRowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  statRowLeftTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statRowSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  statLabelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statValueBox: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 58,
    alignItems: 'center',
  },
  statValueText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statValueTextInput: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
    minWidth: 38,
  },
  genderSegmentTrack: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  genderSegmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  genderSegmentBtnActive: {
    backgroundColor: '#162235',
  },
  genderIconEmoji: {
    fontSize: 12,
  },
  genderBtnText: {
    fontSize: 12,
  },
  goalCardsStack: {
    gap: 10,
    marginBottom: 18,
  },
  goalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalCardActiveGlow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  goalRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalRadioInnerActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  goalRadioInnerInactive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  goalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTextContent: {
    flex: 1,
  },
  goalTitleText: {
    fontSize: 15,
    fontWeight: '800',
  },
  goalDescText: {
    fontSize: 11,
    marginTop: 2,
  },
  resultsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  resultsTargetCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsContent: {
    flex: 1,
  },
  resultsLabelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultsKcalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F59E0B',
    marginTop: 2,
  },
  saveGoalsBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  saveGoalsBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveGoalsBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  pickerBottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748B',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  interactiveRulerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  stepperAdjustBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulerCenterValueBox: {
    alignItems: 'center',
  },
  rulerBigNumber: {
    fontSize: 42,
    fontWeight: '900',
  },
  rulerUnitText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: -2,
  },
  selectListHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 8,
  },
  pickerScrollTrack: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  pickerItemChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemChipText: {
    fontSize: 16,
  },
  sheetDoneBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },
  sheetDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalContentWrapper: {
    gap: 12,
    paddingVertical: 6,
  },
  modalInputGroup: {
    gap: 4,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalSubmitBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  onboardingLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    marginTop: 12,
  },
  onboardingLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
  },
  optionItemText: {
    fontSize: 15,
  },
});
