import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  ScrollView,
  TextInput,
  Linking,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  Search,
  X,
  Sun,
  Moon,
} from "lucide-react-native";
import { useAppStore, usePalette, useStrings } from "../src/store/useAppStore";
import { useDiaryStore } from "../src/store/useDiaryStore";
import { useToastStore } from "../src/store/useToastStore";
import { LANGUAGES } from "../src/shared/i18n/languages";
import { ApiClient, ApiError } from "../src/shared/api/api-client";
import { Screen } from "../src/shared/ui/Screen";
import { Button } from "../src/shared/ui/Button";
import { TextField } from "../src/shared/ui/TextField";
import {
  Radius,
  Spacing,
  FontSize,
  softShadow,
} from "../src/shared/theme/spacing";
import {
  COUNTRIES,
  CountryItem,
  formatPhoneDisplay,
  toE164,
} from "../src/features/auth/countries";
import { countryName } from "../src/features/auth/country-names";

/** Telegram support username for password reset (no OTP). */
const SUPPORT_TELEGRAM = "otaxonov_o17";

/**
 * Auth collects ONLY account credentials:
 * - Sign in:  phone + password
 * - Sign up:  name + phone + password (+ confirm)
 *
 * Body stats / goals live in onboarding after register.
 */
export default function AuthScreen() {
  const themeMode = useAppStore((s) => s.themeMode);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const login = useAppStore((s) => s.login);
  const setOnboardingCompleted = useAppStore((s) => s.setOnboardingCompleted);
  const setCalorieGoal = useDiaryStore((s) => s.setCalorieGoal);
  const refreshDiary = useDiaryStore((s) => s.refreshDiary);
  const showToast = useToastStore((s) => s.showToast);
  const t = usePalette();
  const strings = useStrings();
  const isDark = themeMode === "dark";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(
    COUNTRIES[0],
  );
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const submittingRef = useRef(false);
  const logoIn = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoIn, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [logoIn, logoScale]);

  const currentLang =
    LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const isRegister = mode === "register";

  const openSupportReset = async () => {
    const digits = phone.replace(/\D/g, "");
    const fullPhone =
      digits.length >= 7 ? toE164(selectedCountry.code, digits) : "";
    const message = fullPhone
      ? strings.supportResetMessagePhone.replace("{phone}", fullPhone)
      : strings.supportResetMessage;
    const url = `https://t.me/${SUPPORT_TELEGRAM}?text=${encodeURIComponent(message)}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        showToast(strings.supportOpenFailed, "warning");
        return;
      }
      await Linking.openURL(url);
      setResetOpen(false);
    } catch {
      showToast(strings.supportOpenFailed, "error");
    }
  };

  const switchMode = (next: "login" | "register") => {
    Haptics.selectionAsync();
    setMode(next);
    setName("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const validate = (): string | null => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < selectedCountry.maxDigits) {
      return strings.phoneIncomplete.replace("{n}", String(selectedCountry.maxDigits));
    }
    if (password.length < 6) {
      return strings.minChars6;
    }
    if (isRegister) {
      if (!name.trim() || name.trim().length < 2) {
        return strings.nameTooShort;
      }
      if (password !== confirmPassword) {
        return strings.passwordsMismatch;
      }
    }
    return null;
  };

  const applyProfile = (profile: any) => {
    if (!profile) return;
    if (profile.dailyCalorieGoal) setCalorieGoal(profile.dailyCalorieGoal);
  };

  /** New accounts always go through onboarding for body stats / goals. */
  const handleSubmit = async () => {
    if (submittingRef.current) return;
    const error = validate();
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast(error, "warning");
      return;
    }

    const digits = phone.replace(/\D/g, "");
    const fullPhone = toE164(selectedCountry.code, digits);
    const displayName = name.trim();

    submittingRef.current = true;
    setLoading(true);
    try {
      const res = isRegister
        ? await ApiClient.register(fullPhone, displayName, password)
        : await ApiClient.login(fullPhone, password);

      if (!res?.accessToken) {
        throw new Error(strings.invalidResponse);
      }

      // Register seeds placeholder stats, so only the server's explicit flag means onboarding is done.
      const profile = res.user?.profile;
      const hasCompletedProfile = profile?.onboardingCompleted === true;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Set before login() so the root auth gate never sees a logged-in user with a stale onboarding flag.
      setOnboardingCompleted(hasCompletedProfile);
      login(
        res.user?.email || fullPhone,
        res.user?.name || displayName || strings.defaultUserName,
        res.accessToken,
        res.user?.phone || fullPhone,
        { ...(profile || {}), isPremium: !!res.user?.isPremium },
        res.user?.avatarUrl,
      );
      if (hasCompletedProfile) applyProfile(profile);

      // The root AuthRedirect navigates to onboarding or tabs as soon as the session is stored.
      if (hasCompletedProfile) void refreshDiary();
      showToast(isRegister ? strings.accountCreated : strings.welcomeBack, "success");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const code = err instanceof ApiError ? (err.data as any)?.code : undefined;
      if (code === "USER_NOT_FOUND") {
        showToast(strings.userNotFound, "warning");
      } else if (code === "INVALID_PASSWORD") {
        showToast(strings.wrongPassword, "error");
      } else {
        showToast(err?.message || strings.authError, "error");
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const countryQuery = countrySearch.trim().toLowerCase();
  const filteredCountries = COUNTRIES.filter(
    (c) =>
      countryName(c, language).toLowerCase().includes(countryQuery) ||
      c.name.toLowerCase().includes(countryQuery) ||
      c.code.includes(countryQuery),
  );

  return (
    <Screen scroll edges={["top", "left", "right", "bottom"]}>
      <View key={`${language}-${themeMode}`} style={{ flexGrow: 1 }}>
      <View style={styles.prefsBar}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setLangOpen(true);
          }}
          style={[
            styles.langSelect,
            { backgroundColor: t.card, borderColor: t.border },
            softShadow("sm"),
          ]}
          accessibilityRole="button"
          accessibilityLabel={strings.language}
        >
          <Text style={styles.langFlag}>{currentLang.flag}</Text>
          <Text style={[styles.langSelectLabel, { color: t.text }]} numberOfLines={1}>
            {currentLang.label}
          </Text>
          <ChevronDown color={t.textMuted} size={16} />
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setThemeMode(isDark ? "light" : "dark");
          }}
          style={[
            styles.themeFab,
            { backgroundColor: t.card, borderColor: t.border },
            softShadow("sm"),
          ]}
          accessibilityRole="button"
          accessibilityLabel={isDark ? strings.light : strings.dark}
        >
          {isDark ? (
            <Sun size={18} color={t.secondary} strokeWidth={2.2} />
          ) : (
            <Moon size={18} color={t.textSecondary} strokeWidth={2.2} />
          )}
        </Pressable>
      </View>

      <View style={styles.brand}>
        <Animated.Image
          source={require("../assets/icon.png")}
          style={[styles.logo, { opacity: logoIn, transform: [{ scale: logoScale }] }]}
          accessibilityIgnoresInvertColors
        />
        <Text style={[styles.title, { color: t.text }]}>CaloSnap</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          {isRegister ? strings.authRegisterSubtitle : strings.authLoginSubtitle}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: t.card, borderColor: t.border },
          softShadow("sm"),
        ]}
      >
        <View style={[styles.segment, { backgroundColor: t.cardHover }]}>
          {(["login", "register"] as const).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => switchMode(m)}
                style={[
                  styles.segmentBtn,
                  active && { backgroundColor: t.card, ...softShadow("sm") },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: active ? t.text : t.textMuted,
                      fontWeight: active ? "600" : "500",
                    },
                  ]}
                >
                  {m === "login" ? strings.authTabLogin : strings.authTabRegister}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isRegister ? (
          <TextField
            label={strings.name}
            placeholder={strings.namePlaceholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            leftIcon={<User color={t.textMuted} size={18} />}
          />
        ) : null}

        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>
          {strings.phoneNumber}
        </Text>
        <View style={styles.phoneRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCountryModalVisible(true);
            }}
            style={[
              styles.countryBtn,
              { backgroundColor: t.cardHover, borderColor: t.border },
            ]}
          >
            <Text style={styles.flag}>{selectedCountry.flag}</Text>
            <Text style={[styles.countryCode, { color: t.text }]}>
              {selectedCountry.code}
            </Text>
            <ChevronDown color={t.textMuted} size={16} />
          </Pressable>
          <View
            style={[
              styles.phoneInput,
              { backgroundColor: t.cardHover, borderColor: t.border },
            ]}
          >
            <TextInput
              style={[styles.phoneText, { color: t.text }]}
              placeholder={
                selectedCountry.code === "+998" ? "90 123 45 67" : "123456789"
              }
              placeholderTextColor={t.textMuted}
              keyboardType="phone-pad"
              autoComplete="off"
              importantForAutofill="no"
              value={phone}
              onChangeText={(val) =>
                setPhone(formatPhoneDisplay(val, selectedCountry))
              }
            />
          </View>
        </View>

        <TextField
          label={strings.password}
          placeholder={strings.passwordPlaceholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          leftIcon={<Lock color={t.textMuted} size={18} />}
          rightIcon={
            showPassword ? (
              <EyeOff color={t.textMuted} size={18} />
            ) : (
              <Eye color={t.textMuted} size={18} />
            )
          }
          onRightPress={() => setShowPassword(!showPassword)}
        />

        {!isRegister ? (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setResetOpen(true);
            }}
            style={{ alignSelf: "flex-end", marginTop: -4, marginBottom: 4 }}
          >
            <Text
              style={{
                color: t.primary,
                fontSize: FontSize.sm,
                fontWeight: "600",
              }}
            >
              {strings.forgotPassword}
            </Text>
          </Pressable>
        ) : null}
        {isRegister ? (
          <TextField
            label={strings.confirmPassword}
            placeholder={strings.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            leftIcon={<Lock color={t.textMuted} size={18} />}
          />
        ) : null}

        <Button
          title={isRegister ? strings.register : strings.login}
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: Spacing.sm }}
        />
      </View>

      <Pressable
        onPress={() => switchMode(isRegister ? "login" : "register")}
        style={styles.switchRow}
      >
        <Text style={[styles.switchText, { color: t.textSecondary }]}>
          {isRegister ? `${strings.haveAccount} ` : `${strings.noAccount} `}
          <Text style={{ color: t.primary, fontWeight: "600" }}>
            {isRegister ? strings.login : strings.register}
          </Text>
        </Text>
      </Pressable>

      <Modal
        visible={resetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setResetOpen(false)}
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: t.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: Spacing.xl,
              gap: Spacing.md,
            }}
          >
            <Text
              style={{
                color: t.text,
                fontSize: FontSize.lg,
                fontWeight: "700",
              }}
            >
              {strings.resetPassword}
            </Text>
            <Text
              style={{
                color: t.textMuted,
                fontSize: FontSize.sm,
                lineHeight: 20,
              }}
            >
              {strings.supportResetHint}
            </Text>
            <Button title={strings.contactSupport} onPress={openSupportReset} />
            <Button
              title={strings.close}
              variant="ghost"
              onPress={() => setResetOpen(false)}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={langOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLangOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setLangOpen(false)}
          />
          <View style={[styles.sheet, { backgroundColor: t.card, maxHeight: "75%" }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: t.text }]}>
                {strings.language}
              </Text>
              <Pressable onPress={() => setLangOpen(false)} hitSlop={10}>
                <X color={t.textMuted} size={22} />
              </Pressable>
            </View>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((l) => {
              const selected = language === l.code;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setLanguage(l.code);
                    setLangOpen(false);
                  }}
                  style={[
                    styles.countryRow,
                    selected && { backgroundColor: t.primaryBg },
                  ]}
                >
                  <Text style={styles.flag}>{l.flag}</Text>
                  <Text style={[styles.countryName, { color: t.text }]}>
                    {l.label}
                  </Text>
                  {selected ? (
                    <Text style={{ color: t.primary, fontWeight: "700", fontSize: FontSize.sm }}>
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={countryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: t.card }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: t.text }]}>
                {strings.chooseCountry}
              </Text>
              <Pressable
                onPress={() => setCountryModalVisible(false)}
                hitSlop={10}
              >
                <X color={t.textMuted} size={22} />
              </Pressable>
            </View>
            <View
              style={[
                styles.search,
                { backgroundColor: t.cardHover, borderColor: t.border },
              ]}
            >
              <Search color={t.textMuted} size={18} />
              <TextInput
                style={[styles.searchInput, { color: t.text }]}
                placeholder={strings.searchCountry}
                placeholderTextColor={t.textMuted}
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code + item.name}
              renderItem={({ item }) => {
                const selected = selectedCountry.name === item.name;
                return (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCountry(item);
                      setCountryModalVisible(false);
                      setPhone("");
                    }}
                    style={[
                      styles.countryRow,
                      selected && { backgroundColor: t.primaryBg },
                    ]}
                  >
                    <Text style={styles.flag}>{item.flag}</Text>
                    <Text style={[styles.countryName, { color: t.text }]}>
                      {countryName(item, language)}
                    </Text>
                    <Text style={{ color: t.textMuted, fontWeight: "600" }}>
                      {item.code}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  prefsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  langSelect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 180,
  },
  langFlag: { fontSize: 16 },
  langSelectLabel: { fontSize: FontSize.sm, fontWeight: "600", flexShrink: 1 },
  themeFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    alignItems: "center",
    paddingTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 18,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: FontSize.sm,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
  segment: {
    flexDirection: "row",
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  segmentText: { fontSize: FontSize.sm },
  hint: {
    fontSize: FontSize.xs,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  phoneRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  countryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  flag: { fontSize: 18 },
  countryCode: { fontSize: FontSize.sm, fontWeight: "700" },
  phoneInput: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
  },
  phoneText: {
    fontSize: FontSize.md,
    fontWeight: "500",
    paddingVertical: 0,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  switchRow: {
    alignItems: "center",
    marginTop: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  switchText: { fontSize: FontSize.sm },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    maxHeight: "75%",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C5C5C5",
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: "700" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, padding: 0 },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    gap: Spacing.sm,
  },
  countryName: { flex: 1, fontSize: FontSize.md, fontWeight: "500" },
});
