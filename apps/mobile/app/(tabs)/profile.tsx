import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Moon,
  Sun,
  Globe,
  Bell,
  LogOut,
  User,
  ChevronRight,
  Scale,
  Ruler,
  Calendar,
  ScanFace,
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { useDiaryStore } from '../../src/store/useDiaryStore';
import { useToastStore } from '../../src/store/useToastStore';
import { WheelSelectModal } from '../../src/shared/ui/WheelSelectModal';
import { RemoteImage } from '../../src/shared/ui/RemoteImage';
import { Language } from '../../src/shared/i18n/translations';
import { NotificationService } from '../../src/shared/notifications/notification.service';
import {
  authenticateWithBiometrics,
  getBiometricAvailability,
} from '../../src/shared/security/biometric';
import { ApiClient } from '../../src/shared/api/api-client';
import { tabBarScrollPadding } from '../../src/shared/theme/layout';
import { FontSize, Radius, Spacing, softShadow } from '../../src/shared/theme/spacing';

type Goal = 'LOSE_WEIGHT' | 'MAINTAIN' | 'BUILD_MUSCLE';
type Activity = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
type PickerKind = 'weight' | 'height' | 'age' | null;

const ACTIVITY_MULT: Record<Activity, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
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
    t,
    theme,
  } = useAppStore();
  const { setCalorieGoal } = useDiaryStore();
  const { showToast } = useToastStore();

  const c = theme();
  const strings = t();
  const isDark = themeMode === 'dark';

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

  useEffect(() => {
    setWeight(user.weightKg?.toString() || '80');
    setHeight(user.heightCm?.toString() || '180');
    setAge(user.age?.toString() || '25');
    setGender(user.gender || 'MALE');
    setGoal(user.fitnessGoal || 'LOSE_WEIGHT');
    setActivity((user.activityLevel as Activity) || 'MODERATE');
  }, [user]);

  useEffect(() => {
    if (!isLoggedIn) return;
    ApiClient.listWeight(30)
      .then(setWeightLogs)
      .catch(() => {});
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

  const pickAvatar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Galereyaga ruxsat kerak', 'warning');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setAvatarUrl(uri);
      showToast(strings.changeAvatar, 'success');
      try {
        await ApiClient.updateAvatar(uri);
      } catch {}
    }
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const w = parseFloat(weight) || 80;
    const h = parseFloat(height) || 180;
    const a = parseInt(age, 10) || 25;
    setCalorieGoal(tdee);
    updateUserStats({
      weightKg: w,
      heightCm: h,
      age: a,
      gender,
      fitnessGoal: goal,
      activityLevel: activity,
    });
    if (isLoggedIn) {
      try {
        await ApiClient.saveGoals({
          age: a,
          gender,
          weightKg: w,
          heightCm: h,
          activityLevel: activity,
          goal,
        });
        await ApiClient.addWeight(w);
        const logs = await ApiClient.listWeight(30);
        setWeightLogs(logs);
      } catch (e: any) {
        showToast(e?.message || 'Saqlashda xatolik', 'error');
        return;
      }
    }
    showToast(strings.saved, 'success');
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
    router.replace('/auth');
  };

  const toggleReminders = async (value: boolean) => {
    setMealRemindersEnabled(value);
    try {
      if (value) await NotificationService.scheduleMealReminders(language);
      else await NotificationService.cancelMealReminders();
    } catch {}
  };

  const toggleBiometricLock = async (value: boolean) => {
    Haptics.selectionAsync();
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

  const goals: { key: Goal; title: string; desc: string }[] = [
    { key: 'LOSE_WEIGHT', title: strings.loseWeight, desc: strings.loseWeightDesc },
    { key: 'MAINTAIN', title: strings.maintain, desc: strings.maintainDesc },
    { key: 'BUILD_MUSCLE', title: strings.buildMuscle, desc: strings.buildMuscleDesc },
  ];

  const langs: { key: Language; label: string }[] = [
    { key: 'uz', label: 'O‘zbekcha' },
    { key: 'ru', label: 'Русский' },
    { key: 'en', label: 'English' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarScrollPadding(insets.bottom) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: c.text }]}>{strings.userProfile}</Text>

        {/* Identity */}
        <Pressable
          onPress={pickAvatar}
          style={({ pressed }) => [
            styles.identity,
            { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.92 : 1 },
            softShadow('sm'),
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: c.cardHover, borderColor: c.border }]}>
            {user.avatarUrl ? (
              <RemoteImage
                uri={user.avatarUrl}
                style={styles.avatarImg}
                indicatorColor={c.primary}
                placeholderColor={c.cardHover}
              />
            ) : (
              <User color={c.textMuted} size={32} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.displayName, { color: c.text }]}>{user.name || 'Foydalanuvchi'}</Text>
            {phone ? (
              <Text style={[styles.phone, { color: c.textMuted }]}>{phone}</Text>
            ) : (
              <Text style={[styles.phone, { color: c.primary }]}>{strings.changeAvatar}</Text>
            )}
          </View>
          <ChevronRight color={c.textMuted} size={18} />
        </Pressable>

        {/* Body stats */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>{strings.bodyStats}</Text>
        <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }, softShadow('sm')]}>
          <StatRow
            icon={<Scale size={18} color={c.primary} />}
            label={strings.weightKg}
            value={`${weight} kg`}
            onPress={() => setPickerType('weight')}
            colors={c}
          />
          <StatRow
            icon={<Ruler size={18} color={c.info} />}
            label={strings.heightCm}
            value={`${height} sm`}
            onPress={() => setPickerType('height')}
            colors={c}
            divider
          />
          <StatRow
            icon={<Calendar size={18} color={c.secondary} />}
            label={strings.age}
            value={`${age}`}
            onPress={() => setPickerType('age')}
            colors={c}
            divider
          />
        </View>

        {/* Gender */}
        <View style={styles.segRow}>
          {(['MALE', 'FEMALE'] as const).map((g) => {
            const active = gender === g;
            return (
              <Pressable
                key={g}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGender(g);
                }}
                style={[
                  styles.segBtn,
                  {
                    backgroundColor: active ? c.primary : c.card,
                    borderColor: active ? c.primary : c.border,
                  },
                ]}
              >
                <Text style={{ color: active ? c.onPrimary : c.text, fontWeight: '600', fontSize: FontSize.sm }}>
                  {g === 'MALE' ? strings.male : strings.female}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Activity */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>{strings.activityLevel}</Text>
        <View style={styles.activityWrap}>
          {(
            [
              ['SEDENTARY', '1.2'],
              ['LIGHT', '1.375'],
              ['MODERATE', '1.55'],
              ['VERY_ACTIVE', '1.725'],
              ['EXTRA_ACTIVE', '1.9'],
            ] as [Activity, string][]
          ).map(([key, mult]) => {
            const active = activity === key;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActivity(key);
                }}
                style={[
                  styles.activityChip,
                  {
                    backgroundColor: active ? c.primary : c.card,
                    borderColor: active ? c.primary : c.border,
                  },
                ]}
              >
                <Text style={{ color: active ? '#fff' : c.text, fontSize: 11, fontWeight: '600' }}>
                  {key.replace('_', ' ')} · {mult}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Weight history mini chart */}
        {weightLogs.length > 0 ? (
          <>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>{strings.weightHistory}</Text>
            <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border, padding: Spacing.lg }, softShadow('sm')]}>
              <View style={styles.weightBars}>
                {weightLogs.slice(-10).map((log, i, arr) => {
                  const vals = arr.map((x) => x.weightKg);
                  const min = Math.min(...vals) - 1;
                  const max = Math.max(...vals) + 1;
                  const h = Math.max(8, ((log.weightKg - min) / (max - min || 1)) * 48);
                  return (
                    <View key={`${log.loggedAt}-${i}`} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                      <View
                        style={{
                          height: h,
                          width: '60%',
                          borderRadius: 4,
                          backgroundColor: c.primary,
                        }}
                      />
                      <Text style={{ fontSize: 9, color: c.textMuted }}>{Math.round(log.weightKg)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : null}

        {/* Fitness goal */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>{strings.fitnessGoal}</Text>
        <View style={{ gap: Spacing.sm }}>
          {goals.map((g) => {
            const active = goal === g.key;
            return (
              <Pressable
                key={g.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGoal(g.key);
                }}
                style={[
                  styles.goalCard,
                  {
                    backgroundColor: c.card,
                    borderColor: active ? c.primary : c.border,
                    borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <Text style={[styles.goalTitle, { color: c.text }]}>{g.title}</Text>
                <Text style={[styles.goalDesc, { color: c.textMuted }]}>{g.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* TDEE + save */}
        <View style={[styles.tdeeCard, { backgroundColor: c.primaryBg }]}>
          <Text style={[styles.tdeeLabel, { color: c.primary }]}>{strings.calculatedTdee}</Text>
          <Text style={[styles.tdeeVal, { color: c.primary }]}>{tdee} kcal</Text>
        </View>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: c.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={styles.saveText}>{strings.saveGoals}</Text>
        </Pressable>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>{strings.appearance}</Text>
        <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }, softShadow('sm')]}>
          {/* Theme */}
          <View style={styles.settingsRow}>
            {isDark ? <Moon size={18} color={c.textSecondary} /> : <Sun size={18} color={c.secondary} />}
            <Text style={[styles.settingsLabel, { color: c.text }]}>{strings.theme}</Text>
            <View style={[styles.themeToggle, { backgroundColor: c.cardHover }]}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setThemeMode('light');
                }}
                style={[styles.themeBtn, !isDark && { backgroundColor: c.card }, !isDark && softShadow('sm')]}
              >
                <Sun size={14} color={!isDark ? c.secondary : c.textMuted} />
                <Text style={{ color: !isDark ? c.text : c.textMuted, fontSize: 12, fontWeight: '600' }}>
                  {strings.light}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setThemeMode('dark');
                }}
                style={[styles.themeBtn, isDark && { backgroundColor: c.card }, isDark && softShadow('sm')]}
              >
                <Moon size={14} color={isDark ? c.textSecondary : c.textMuted} />
                <Text style={{ color: isDark ? c.text : c.textMuted, fontSize: 12, fontWeight: '600' }}>
                  {strings.dark}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Language */}
          <View style={[styles.settingsBlock, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
            <View style={styles.settingsRowCompact}>
              <Globe size={18} color={c.info} />
              <Text style={[styles.settingsLabel, { color: c.text }]}>{strings.language}</Text>
            </View>
            <View style={styles.langRow}>
              {langs.map((l) => {
                const active = language === l.key;
                return (
                  <Pressable
                    key={l.key}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setLanguage(l.key);
                    }}
                    style={[
                      styles.langChip,
                      {
                        backgroundColor: active ? c.primary : c.cardHover,
                        borderColor: active ? c.primary : c.border,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? '#fff' : c.text, fontSize: 13, fontWeight: '600' }}>
                      {l.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
          {strings.notificationsSection}
        </Text>
        <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }, softShadow('sm')]}>
          <View style={styles.settingsRow}>
            <View style={[styles.bellBox, { backgroundColor: c.primaryBg }]}>
              <Bell size={18} color={c.primary} />
            </View>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.settingsLabelNoFlex, { color: c.text }]}>
                {strings.mealRemindersTitle}
              </Text>
              <Text style={[styles.settingsSub, { color: c.textMuted }]}>
                {strings.mealRemindersSub}
              </Text>
            </View>
            <Switch
              value={mealRemindersEnabled}
              onValueChange={toggleReminders}
              trackColor={{ false: isDark ? '#2A2F3A' : '#E6E6E2', true: c.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={isDark ? '#2A2F3A' : '#E6E6E2'}
            />
          </View>
        </View>

        {/* Security — Face ID */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
          {strings.securitySection}
        </Text>
        <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }, softShadow('sm')]}>
          <View style={styles.settingsRow}>
            <View style={[styles.bellBox, { backgroundColor: c.primaryBg }]}>
              <ScanFace size={18} color={c.primary} />
            </View>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.settingsLabelNoFlex, { color: c.text }]}>
                {strings.biometricLockTitle}
              </Text>
              <Text style={[styles.settingsSub, { color: c.textMuted }]}>
                {strings.biometricLockSub}
              </Text>
            </View>
            <Switch
              value={biometricLockEnabled}
              onValueChange={toggleBiometricLock}
              trackColor={{ false: isDark ? '#2A2F3A' : '#E6E6E2', true: c.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={isDark ? '#2A2F3A' : '#E6E6E2'}
            />
          </View>
        </View>

        {/* Logout */}
        {isLoggedIn ? (
          <Pressable
            onPress={handleLogout}
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
          unit={pickerType === 'weight' ? 'kg' : pickerType === 'height' ? 'cm' : ''}
          onClose={() => setPickerType(null)}
          onValueChange={(v) => {
            if (pickerType === 'weight') setWeight(String(v));
            if (pickerType === 'height') setHeight(String(v));
            if (pickerType === 'age') setAge(String(v));
          }}
          onConfirm={() => setPickerType(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function StatRow({
  icon,
  label,
  value,
  onPress,
  colors,
  divider,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
  colors: ReturnType<ReturnType<typeof useAppStore.getState>['theme']>;
  divider?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        divider ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border } : null,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      {icon}
      <Text style={[styles.settingsLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <ChevronRight color={colors.textMuted} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  pageTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: Spacing.xs,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 64, height: 64 },
  displayName: { fontSize: FontSize.lg, fontWeight: '700' },
  phone: { fontSize: FontSize.sm, marginTop: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  group: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  settingsLabel: { flex: 1, fontSize: FontSize.md, fontWeight: '500' },
  settingsLabelNoFlex: { fontSize: FontSize.md, fontWeight: '600' },
  settingsSub: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  settingsBlock: {
    paddingBottom: Spacing.md,
  },
  settingsRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  themeToggle: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 3,
    gap: 2,
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  bellBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: FontSize.md, fontWeight: '700' },
  segRow: { flexDirection: 'row', gap: Spacing.sm },
  activityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  activityChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  weightBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 64,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  goalTitle: { fontSize: FontSize.md, fontWeight: '700' },
  goalDesc: { fontSize: FontSize.sm, marginTop: 4 },
  tdeeCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  tdeeLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  tdeeVal: { fontSize: FontSize.xxl, fontWeight: '800', letterSpacing: -0.8, marginTop: 4 },
  saveBtn: {
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  logoutText: { fontSize: FontSize.md, fontWeight: '700' },
});
