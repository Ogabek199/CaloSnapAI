import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  PartyPopper,
  Sparkles,
  Droplets,
  Footprints,
  Flame,
  ShieldCheck,
  Minus,
  Plus,
  Calendar,
  Apple,
  Info,
  X,
} from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, usePalette, useStrings } from '../../store/useAppStore';
import {
  useFeastStore,
  applyFeastAdjustment,
  calcFeastDailyDeficit,
  FEAST_DURATION_OPTIONS,
  FEAST_MAX_DAILY_DEFICIT,
  FEAST_RECOMMENDED_DAYS,
  type FeastReason,
} from '../../store/useFeastStore';
import { useDiaryStore } from '../../store/useDiaryStore';
import { useToastStore } from '../../store/useToastStore';
import { CustomModal } from '../../shared/ui/CustomModal';
import { FontSize, Radius, Spacing, softShadow } from '../../shared/theme/spacing';

const PRESET_SURPLUS = [500, 800, 1200];
const MIN_SURPLUS = 200;
const MAX_SURPLUS = 3000;
const REASONS: FeastReason[] = ['wedding', 'birthday', 'holiday', 'weekend'];

interface FeastBalancerModalProps {
  visible?: boolean;
  onClose?: () => void;
  suggestedSurplus?: number;
}

export const FeastBalancerModal: React.FC<FeastBalancerModalProps> = ({
  visible,
  onClose,
  suggestedSurplus,
}) => {
  const isDark = useAppStore((s) => s.themeMode === 'dark');
  const c = usePalette();
  const strings = useStrings();
  const {
    activePlan,
    isModalOpen,
    closeModal,
    startFeastPlan,
    cancelFeastPlan,
    initialSuggestedSurplus,
    getCurrentDayProgress,
  } = useFeastStore(
    useShallow((s) => ({
      activePlan: s.activePlan,
      isModalOpen: s.isModalOpen,
      closeModal: s.closeModal,
      startFeastPlan: s.startFeastPlan,
      cancelFeastPlan: s.cancelFeastPlan,
      initialSuggestedSurplus: s.initialSuggestedSurplus,
      getCurrentDayProgress: s.getCurrentDayProgress,
    })),
  );
  const calorieGoal = useDiaryStore((s) => s.calorieGoal);
  const todaySummary = useDiaryStore((s) => s.todaySummary);
  const showToast = useToastStore((s) => s.showToast);

  const isModalVisible = visible !== undefined ? visible : isModalOpen;
  const handleClose = onClose || closeModal;

  const [surplus, setSurplus] = useState<number>(800);
  const [days, setDays] = useState<number>(FEAST_RECOMMENDED_DAYS);
  const [reason, setReason] = useState<FeastReason>('wedding');
  const [surplusText, setSurplusText] = useState('800');

  useEffect(() => {
    setSurplusText(String(surplus));
  }, [surplus]);

  useEffect(() => {
    if (isModalVisible) {
      const initial = suggestedSurplus || initialSuggestedSurplus || 800;
      setSurplus(Math.max(MIN_SURPLUS, Math.min(initial, MAX_SURPLUS)));
      setDays(FEAST_RECOMMENDED_DAYS);
      setReason('wedding');
    }
  }, [isModalVisible, suggestedSurplus, initialSuggestedSurplus]);

  const reasonLabel = (r: FeastReason) =>
    ({
      wedding: strings.feastReasonWedding,
      birthday: strings.feastReasonBirthday,
      holiday: strings.feastReasonHoliday,
      weekend: strings.feastReasonWeekend,
    })[r];

  const baseGoal = todaySummary?.goalCalories || calorieGoal || 2150;
  const dailyDeficit = calcFeastDailyDeficit(surplus, days);
  const isCapped = Math.round(surplus / days) > FEAST_MAX_DAILY_DEFICIT;
  const adjustedTarget = applyFeastAdjustment(baseGoal, -dailyDeficit);
  const currentProgress = getCurrentDayProgress();

  const presetHint = (val: number) =>
    val <= 500
      ? strings.feastPresetSmall
      : val <= 800
      ? strings.feastPresetMedium
      : strings.feastPresetLarge;

  const clampSurplus = (v: number) => Math.max(MIN_SURPLUS, Math.min(v, MAX_SURPLUS));

  const handleAdjustSurplus = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSurplus((prev) => clampSurplus(prev + delta));
  };

  const commitSurplusText = () => {
    const parsed = parseInt(surplusText, 10);
    const next = Number.isFinite(parsed) ? clampSurplus(parsed) : surplus;
    setSurplus(next);
    setSurplusText(String(next));
  };

  const handleSelectDays = (d: number) => {
    Haptics.selectionAsync();
    setDays(d);
  };

  const handleActivate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const typed = parseInt(surplusText, 10);
    startFeastPlan({
      surplusCalories: Number.isFinite(typed) ? clampSurplus(typed) : surplus,
      compensationDays: days,
      reason,
      title: reasonLabel(reason),
    });
    showToast(strings.feastSuccessStarted, 'success');
    handleClose();
  };

  const handleCancelActivePlan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cancelFeastPlan();
    showToast(strings.feastCompletedToast, 'info');
    handleClose();
  };

  return (
    <CustomModal
      visible={isModalVisible}
      onClose={handleClose}
      hideHeader
      cardStyle={{
        maxHeight: '88%',
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      }}
      contentStyle={{ paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 }}
    >
      <TouchableOpacity
        style={[styles.closeBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
        onPress={handleClose}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={strings.close}
        activeOpacity={0.7}
      >
        <X size={18} color={c.textSecondary} />
      </TouchableOpacity>
        <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Badge */}
        <View style={styles.headerContainer}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 149, 0, 0.2)'
                  : 'rgba(255, 149, 0, 0.12)',
              },
            ]}
          >
            <PartyPopper size={32} color="#FF9500" />
          </View>
          <Text style={[styles.title, { color: c.text }]}>
            {strings.feastModeTitle}
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {strings.feastModeSubtitle}
          </Text>
        </View>

        {/* ACTIVE PLAN VIEW */}
        {activePlan && activePlan.isActive ? (
          <View style={styles.activeContainer}>
            <View
              style={[
                styles.activeCard,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#F9F9FB',
                  borderColor: isDark ? 'rgba(255,149,0,0.4)' : '#FFE6C7',
                },
              ]}
            >
              <View style={styles.activeCardHeader}>
                <View style={styles.statusPill}>
                  <Sparkles size={13} color="#FF9500" />
                  <Text style={styles.statusPillText}>
                    {strings.feastStatusActive}
                  </Text>
                </View>
                <Text style={[styles.activePlanSurplus, { color: '#FF9500' }]}>
                  +{activePlan.surplusCalories} kcal
                </Text>
              </View>

              <Text style={[styles.activeCardTitle, { color: c.text }]}>
                {activePlan.reason ? reasonLabel(activePlan.reason) : activePlan.title}
              </Text>

              {/* Progress Bar / Step Indicators */}
              <View style={styles.progressContainer}>
                <View style={styles.progressRow}>
                  <Text style={[styles.progressLabel, { color: c.textSecondary }]}>
                    {currentProgress?.isFeastDay
                      ? strings.feastDayOf
                      : strings.feastDayProgress
                          .replace('{day}', String(currentProgress?.currentDay || 1))
                          .replace('{total}', String(activePlan.compensationDays))}
                  </Text>
                  <Text style={[styles.progressDeficit, { color: '#34C759' }]}>
                    {strings.feastPerDay.replace('{n}', String(activePlan.dailyDeficit))}
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBarBg,
                    { backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA' },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${
                          currentProgress?.inRecovery
                            ? Math.min(
                                100,
                                ((currentProgress.currentDay - 0.5) / activePlan.compensationDays) * 100,
                              )
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Active Tips Box */}
              <View style={styles.miniTipsRow}>
                <View style={styles.miniTipItem}>
                  <Droplets size={16} color="#007AFF" />
                  <Text
                    style={[styles.miniTipText, { color: c.textSecondary }]}
                    numberOfLines={2}
                  >
                    {strings.feastMiniWater}
                  </Text>
                </View>
                <View style={styles.miniTipItem}>
                  <Footprints size={16} color="#34C759" />
                  <Text
                    style={[styles.miniTipText, { color: c.textSecondary }]}
                    numberOfLines={2}
                  >
                    {strings.feastMiniWalk}
                  </Text>
                </View>
                <View style={styles.miniTipItem}>
                  <ShieldCheck size={16} color="#FF9500" />
                  <Text
                    style={[styles.miniTipText, { color: c.textSecondary }]}
                    numberOfLines={2}
                  >
                    {strings.feastMiniStreak}
                  </Text>
                </View>
              </View>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                },
              ]}
              onPress={handleCancelActivePlan}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.cancelButtonText, { color: '#FF3B30' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {strings.feastCancelBtn}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* CREATE NEW PLAN VIEW */
          <View style={styles.formContainer}>
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Sparkles size={18} color="#FF9500" />
                <Text style={[styles.sectionTitle, { color: c.text }]}>
                  {strings.feastReasonTitle}
                </Text>
              </View>
              <View style={styles.reasonRow}>
                {REASONS.map((r) => {
                  const isSelected = reason === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.reasonChip,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(255,149,0,0.2)'
                              : '#FFF3E0'
                            : isDark
                            ? '#2C2C2E'
                            : '#F2F2F7',
                          borderColor: isSelected ? '#FF9500' : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setReason(r);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.reasonChipText,
                          {
                            color: isSelected ? '#FF9500' : c.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {reasonLabel(r)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 1: Surplus Stepper */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Flame size={18} color="#FF9500" />
                <Text style={[styles.sectionTitle, { color: c.text }]}>
                  {strings.feastSurplusPrompt}
                </Text>
              </View>

              {/* Stepper Display */}
              <View
                style={[
                  styles.stepperContainer,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.stepBtn,
                    { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' },
                  ]}
                  onPress={() => handleAdjustSurplus(-100)}
                  activeOpacity={0.7}
                >
                  <Minus size={20} color={c.text} />
                </TouchableOpacity>

                <View style={styles.surplusValueWrapper}>
                  <View style={styles.surplusInputRow}>
                    <Text style={[styles.surplusValue, { color: '#FF9500' }]}>+</Text>
                    <TextInput
                      value={surplusText}
                      onChangeText={(v) => setSurplusText(v.replace(/[^0-9]/g, '').slice(0, 4))}
                      onEndEditing={commitSurplusText}
                      onSubmitEditing={commitSurplusText}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      selectTextOnFocus
                      maxLength={4}
                      style={[styles.surplusValue, styles.surplusInput, { color: '#FF9500' }]}
                    />
                  </View>
                  <Text style={[styles.surplusUnit, { color: c.textSecondary }]}>
                    kcal
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.stepBtn,
                    { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' },
                  ]}
                  onPress={() => handleAdjustSurplus(100)}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color={c.text} />
                </TouchableOpacity>
              </View>

              {/* Quick Preset Pills */}
              <View style={styles.presetRow}>
                {PRESET_SURPLUS.map((val) => {
                  const isSelected = surplus === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.presetPill,
                        {
                          backgroundColor: isSelected
                            ? '#FF9500'
                            : isDark
                            ? '#2C2C2E'
                            : '#F2F2F7',
                          borderColor: isSelected
                            ? '#FF9500'
                            : isDark
                            ? '#3A3A3C'
                            : '#E5E5EA',
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSurplus(val);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        style={[
                          styles.presetPillText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : isDark
                              ? '#E5E5EA'
                              : '#3C3C43',
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        +{val} kcal
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.presetPillHint,
                          { color: isSelected ? 'rgba(255,255,255,0.85)' : c.textSecondary },
                        ]}
                      >
                        {presetHint(val)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 2: Duration Selector */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Calendar size={18} color="#007AFF" />
                <Text style={[styles.sectionTitle, { color: c.text }]}>
                  {strings.feastDaysSelector}
                </Text>
              </View>

              <View style={styles.durationRow}>
                {FEAST_DURATION_OPTIONS.map((d) => {
                  const isSelected = days === d;
                  const def = calcFeastDailyDeficit(surplus, d);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.durationCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(0, 122, 255, 0.15)'
                              : '#EBF4FF'
                            : isDark
                            ? '#2C2C2E'
                            : '#F9F9FB',
                          borderColor: isSelected
                            ? '#007AFF'
                            : isDark
                            ? '#3A3A3C'
                            : '#E5E5EA',
                        },
                      ]}
                      onPress={() => handleSelectDays(d)}
                      activeOpacity={0.8}
                    >
                      {d === FEAST_RECOMMENDED_DAYS && (
                        <View style={styles.recommendBadge}>
                          <Text style={styles.recommendBadgeText} numberOfLines={1}>
                            {strings.feastRecommended}
                          </Text>
                        </View>
                      )}
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        style={[
                          styles.durationDaysText,
                          {
                            color: isSelected ? '#007AFF' : c.text,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {strings.feastDaysLabel.replace('{n}', String(d))}
                      </Text>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                        style={[
                          styles.durationDeficitText,
                          {
                            color: isSelected ? '#007AFF' : c.textSecondary,
                          },
                        ]}
                      >
                        {strings.feastPerDay.replace('{n}', String(def))}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {isCapped && (
                <View style={styles.capNoteRow}>
                  <Info size={14} color={c.textSecondary} style={{ marginTop: 1 }} />
                  <Text style={[styles.capNoteText, { color: c.textSecondary }]}>
                    {strings.feastCapNote.replace('{max}', String(FEAST_MAX_DAILY_DEFICIT))}
                  </Text>
                </View>
              )}
            </View>

            {/* Step 3: Scientific Summary Card */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#F9F9FB',
                  borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
                },
              ]}
            >
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
                  {strings.feastDeficitDaily}
                </Text>
                <Text
                  style={[styles.summaryValue, { color: '#34C759' }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  -{dailyDeficit} kcal
                </Text>
              </View>
              <View
                style={[
                  styles.summaryDivider,
                  { backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA' },
                ]}
              />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
                  {strings.feastNewDailyGoal}
                </Text>
                <Text
                  style={[styles.summaryValue, { color: c.text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {adjustedTarget} kcal
                </Text>
              </View>
            </View>

            {/* Streak & Guilt-Free Shield */}
            <View
              style={[
                styles.shieldBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(52, 199, 89, 0.12)'
                    : '#E8F9EE',
                  borderColor: isDark ? 'rgba(52, 199, 89, 0.3)' : '#C3EED3',
                },
              ]}
            >
              <ShieldCheck size={20} color="#34C759" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.shieldTitle, { color: '#248A3D' }]}>
                  {strings.feastShieldTitle}
                </Text>
                <Text style={[styles.shieldDesc, { color: isDark ? '#A1D9B1' : '#3B7C4F' }]}>
                  {strings.feastShieldDesc}
                </Text>
              </View>
            </View>

            {/* Step 4: AI Recovery Tips */}
            <View style={styles.tipsContainer}>
              <View style={styles.tipRow}>
                <View
                  style={[
                    styles.tipIconBox,
                    { backgroundColor: 'rgba(0, 122, 255, 0.12)' },
                  ]}
                >
                  <Droplets size={16} color="#007AFF" />
                </View>
                <Text style={[styles.tipText, { color: c.text }]}>
                  {strings.feastTipWater}
                </Text>
              </View>

              <View style={styles.tipRow}>
                <View
                  style={[
                    styles.tipIconBox,
                    { backgroundColor: 'rgba(52, 199, 89, 0.12)' },
                  ]}
                >
                  <Footprints size={16} color="#34C759" />
                </View>
                <Text style={[styles.tipText, { color: c.text }]}>
                  {strings.feastTipWalk}
                </Text>
              </View>

              <View style={styles.tipRow}>
                <View
                  style={[
                    styles.tipIconBox,
                    { backgroundColor: 'rgba(255, 149, 0, 0.12)' },
                  ]}
                >
                  <Apple size={16} color="#FF9500" />
                </View>
                <Text style={[styles.tipText, { color: c.text }]}>
                  {strings.feastTipNoStarve}
                </Text>
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: '#FF9500' },
                softShadow(),
              ]}
              onPress={handleActivate}
              activeOpacity={0.85}
            >
              <PartyPopper size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text
                style={styles.primaryButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {strings.feastActivateBtn}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.xl,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  formContainer: {
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: Radius.lg,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow(),
  },
  surplusValueWrapper: {
    alignItems: 'center',
  },
  surplusValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  surplusUnit: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  presetPill: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  presetPillText: {
    fontSize: FontSize.xs,
  },
  presetPillHint: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  surplusInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  surplusInput: {
    minWidth: 60,
    padding: 0,
    textAlign: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
  },
  durationCard: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
  },
  recommendBadge: {
    position: 'absolute',
    top: -9,
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  reasonChipText: {
    fontSize: FontSize.xs,
  },
  capNoteRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  capNoteText: {
    flex: 1,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  durationDaysText: {
    fontSize: FontSize.md,
    marginBottom: 2,
  },
  durationDeficitText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  summaryDivider: {
    width: 1,
    height: 36,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  shieldBox: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  shieldTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  shieldDesc: {
    fontSize: FontSize.xs,
    lineHeight: 17,
  },
  tipsContainer: {
    gap: Spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    marginTop: Spacing.xs,
  },
  primaryButtonText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  activeContainer: {
    gap: Spacing.lg,
  },
  activeCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,149,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    color: '#FF9500',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  activePlanSurplus: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  activeCardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  progressContainer: {
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  progressDeficit: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 4,
  },
  miniTipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  miniTipItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  miniTipText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelButton: {
    height: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});

export default FeastBalancerModal;
