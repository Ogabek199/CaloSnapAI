import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams, useIsFocused } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Zap,
  ZapOff,
  Barcode as BarcodeIcon,
  Check,
  RotateCcw,
  Plus,
  Minus,
  AlertCircle,
  Utensils,
  X,
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, usePalette, useStrings } from '../../src/store/useAppStore';
import { foodName } from '../../src/shared/i18n/languages';
import { useDiaryStore, localDateKey } from '../../src/store/useDiaryStore';
import { useToastStore } from '../../src/store/useToastStore';
import { ApiClient } from '../../src/shared/api/api-client';
import { Food } from '@eda/types';
import { MEAL_CONFIG_LIST, type MealType } from '../../src/features/meals/meal-config';
import { FontSize, Radius, Spacing, softShadow } from '../../src/shared/theme/spacing';
import { RemoteImage } from '../../src/shared/ui/RemoteImage';
import { BarcodeFoodForm } from '../../src/features/barcode/BarcodeFoodForm';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_BOX_SIZE = Math.min(SCREEN_WIDTH * 0.78, 280);

export default function BarcodeScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: string }>();
  const insets = useSafeAreaInsets();
  const language = useAppStore((s) => s.language);
  const showToast = useToastStore((s) => s.showToast);
  const c = usePalette();
  const strings = useStrings();
  const isFocused = useIsFocused();

  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  // Scanned Food result state
  const [foundFood, setFoundFood] = useState<Food | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [addingProduct, setAddingProduct] = useState<boolean>(false);
  const [mealType, setMealType] = useState<MealType>(() =>
    MEAL_CONFIG_LIST.some((m) => m.type === params.mealType) ? (params.mealType as MealType) : 'LUNCH',
  );
  const [weightGrams, setWeightGrams] = useState<number>(100);
  const [weightInput, setWeightInput] = useState<string>('100');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const lastScannedAt = useRef<number>(0);
  const savingRef = useRef(false);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      const now = Date.now();
      // Debounce: prevent multi-triggering within 1.5 seconds or while already processing
      if (now - lastScannedAt.current < 1500 || !isScanning || isSearching) {
        return;
      }
      lastScannedAt.current = now;

      const code = (data || '').trim();
      if (!code) return;

      setIsScanning(false);
      setIsSearching(true);
      setScannedCode(code);

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      try {
        const res = await ApiClient.findFoodByBarcode(code);
        setIsSearching(false);

        if (res.found && res.food) {
          const food = res.food;
          setFoundFood(food);
          const initialWeight = Math.round(food.defaultServingGrams || 100);
          setWeightGrams(initialWeight);
          setWeightInput(String(initialWeight));
          setNotFound(false);
        } else {
          setFoundFood(null);
          setNotFound(true);
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch (e) {}
        }
      } catch (err: any) {
        setIsSearching(false);
        setFoundFood(null);
        setNotFound(false);
        setScannedCode(null);
        setIsScanning(true);
        lastScannedAt.current = Date.now();
        showToast(err?.message || strings.barcodeNotFound, 'error');
      }
    },
    [isScanning, isSearching, showToast, strings.barcodeNotFound],
  );

  const resetScanner = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setFoundFood(null);
    setNotFound(false);
    setAddingProduct(false);
    setScannedCode(null);
    setIsSearching(false);
    setIsScanning(true);
    lastScannedAt.current = Date.now();
  };

  const handleProductSaved = (food: Food, servingGrams: number | null) => {
    const initialWeight = Math.round(servingGrams || food.defaultServingGrams || 100);
    setWeightGrams(initialWeight);
    setWeightInput(String(initialWeight));
    setAddingProduct(false);
    setNotFound(false);
    setFoundFood(food);
  };

  const handleWeightChange = (delta: number) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    const next = Math.max(10, Math.min(2500, weightGrams + delta));
    setWeightGrams(next);
    setWeightInput(String(next));
  };

  const handleWeightTextInput = (val: string) => {
    setWeightInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 3000) {
      setWeightGrams(parsed);
    }
  };

  const handleWeightBlur = () => {
    setWeightInput(String(weightGrams));
  };

  const handleAddToDiary = async () => {
    if (!foundFood || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      await ApiClient.addMealItem(mealType, foundFood.id, weightGrams);
      void useDiaryStore.getState().setSelectedDate(localDateKey());

      showToast(strings.barcodeAddedToDiary, 'success');
      router.dismissTo('/(tabs)/diary');
    } catch (err: any) {
      showToast(err?.message || strings.diarySaveFailed, 'error');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // Food nutrition calculations for current weight
  const ratio = weightGrams / 100;
  const currentNutrition = foundFood?.nutrition
    ? {
        calories: Math.round(foundFood.nutrition.calories * ratio),
        protein: Math.round(foundFood.nutrition.protein * ratio * 10) / 10,
        carbs: Math.round(foundFood.nutrition.carbs * ratio * 10) / 10,
        fat: Math.round(foundFood.nutrition.fat * ratio * 10) / 10,
      }
    : null;

  // Permission views
  if (!permission) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.centeredContainer, { backgroundColor: c.background }]}>
        <View style={styles.permissionCard}>
          <BarcodeIcon size={56} color={c.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.permissionTitle, { color: c.text }]}>
            {strings.barcodeScannerTitle}
          </Text>
          <Text style={[styles.permissionDesc, { color: c.textSecondary }]}>
            {strings.permissionDesc}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: c.primary }]}
            onPress={() => {
              if (permission.canAskAgain) requestPermission();
              else Linking.openSettings().catch(() => {});
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{strings.grantPermission}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.textButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[styles.textButtonText, { color: c.textSecondary }]}>
              {strings.backBtn}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      {/* Live Camera View */}
      {isFocused ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: [
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code128',
              'code39',
              'qr',
            ],
          }}
          onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
        />
      ) : null}

      {/* Darkened Reticle Mask */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Top Dark Bar */}
        <View style={[styles.maskTop, { height: (SCREEN_HEIGHT - SCAN_BOX_SIZE) / 2.6 }]} />

        {/* Center Row */}
        <View style={[styles.maskMiddleRow, { height: SCAN_BOX_SIZE }]}>
          <View style={styles.maskSide} />
          {/* Target Scan Box */}
          <View style={[styles.scanBox, { width: SCAN_BOX_SIZE, height: SCAN_BOX_SIZE }]}>
            {/* 4 Corner Markers (Apple HIG Reticle) */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Searching indicator inside reticle */}
            {isSearching && (
              <View style={styles.searchingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.searchingText}>
                  {strings.scanningBarcode}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.maskSide} />
        </View>

        {/* Bottom Dark Mask */}
        <View style={styles.maskBottom} />
      </View>

      {/* Header Bar */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea} pointerEvents="box-none">
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.iconCircleButton}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
              router.back();
            }}
            activeOpacity={0.8}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>
              {strings.barcodeScannerTitle}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.iconCircleButton, torch && styles.iconCircleActive]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
              setTorch((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            {torch ? <Zap size={22} color="#FFD700" /> : <ZapOff size={22} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>

        {/* Subtle Guidance Pill */}
        {isScanning && !isSearching && (
          <View style={styles.hintBadge}>
            <BarcodeIcon size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.hintBadgeText}>
              {strings.barcodeScannerHint}
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* Scanned Food Bottom Card (Found) */}
      {foundFood && (
        <View style={[styles.sheetContainer, { backgroundColor: c.card, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.sheetHandle} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Title & Brand */}
            <View style={styles.productHeader}>
              {foundFood.imageUrl ? (
                <RemoteImage
                  uri={foundFood.imageUrl}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.productImagePlaceholder, { backgroundColor: c.background }]}>
                  <Utensils size={24} color={c.primary} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={[styles.productTitle, { color: c.text }]} numberOfLines={2}>
                  {foodName(foundFood, language)}
                </Text>
                {scannedCode && (
                  <Text style={[styles.productBarcode, { color: c.textSecondary }]}>
                    #{scannedCode}
                  </Text>
                )}
                {foundFood.source === 'USER_SUBMITTED' && (
                  <Text style={[styles.productSourceBadge, { color: c.textMuted }]}>
                    {strings.userSubmittedBadge}
                  </Text>
                )}
              </View>
            </View>

            {/* Nutrition Badges */}
            {currentNutrition && (
              <View style={[styles.nutritionRow, { backgroundColor: c.background }]}>
                <View style={styles.nutriCol}>
                  <Text style={[styles.nutriVal, { color: c.primary }]}>
                    {currentNutrition.calories}
                  </Text>
                  <Text style={[styles.nutriLabel, { color: c.textSecondary }]}>kcal</Text>
                </View>
                <View style={[styles.nutriDivider, { backgroundColor: c.border }]} />
                <View style={styles.nutriCol}>
                  <Text style={[styles.nutriVal, { color: c.text }]}>
                    {currentNutrition.protein}g
                  </Text>
                  <Text style={[styles.nutriLabel, { color: c.textSecondary }]}>
                    {strings.protein}
                  </Text>
                </View>
                <View style={[styles.nutriDivider, { backgroundColor: c.border }]} />
                <View style={styles.nutriCol}>
                  <Text style={[styles.nutriVal, { color: c.text }]}>
                    {currentNutrition.carbs}g
                  </Text>
                  <Text style={[styles.nutriLabel, { color: c.textSecondary }]}>
                    {strings.carbs}
                  </Text>
                </View>
                <View style={[styles.nutriDivider, { backgroundColor: c.border }]} />
                <View style={styles.nutriCol}>
                  <Text style={[styles.nutriVal, { color: c.text }]}>
                    {currentNutrition.fat}g
                  </Text>
                  <Text style={[styles.nutriLabel, { color: c.textSecondary }]}>
                    {strings.fat}
                  </Text>
                </View>
              </View>
            )}

            {/* Meal Type Selector */}
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
              {strings.whichMeal}
            </Text>
            <View style={styles.mealPillsRow}>
              {MEAL_CONFIG_LIST.map((m) => {
                const isSelected = mealType === m.type;
                const mealKey = m.type.toLowerCase() as keyof typeof strings;
                const label = strings[mealKey] || m.title;
                return (
                  <TouchableOpacity
                    key={m.type}
                    style={[
                      styles.mealPill,
                      {
                        backgroundColor: isSelected ? c.primary : c.background,
                        borderColor: isSelected ? c.primary : c.border,
                      },
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) {}
                      setMealType(m.type);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.mealPillText,
                        { color: isSelected ? '#FFFFFF' : c.text },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Weight Counter */}
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
              {strings.servingGrams}
            </Text>
            <View style={[styles.weightControlRow, { backgroundColor: c.background }]}>
              <TouchableOpacity
                style={[styles.weightStepBtn, { backgroundColor: c.card }]}
                onPress={() => handleWeightChange(-25)}
                activeOpacity={0.7}
              >
                <Minus size={20} color={c.text} />
              </TouchableOpacity>

              <View style={styles.weightInputWrap}>
                <TextInput
                  style={[styles.weightInput, { color: c.text }]}
                  value={weightInput}
                  onChangeText={handleWeightTextInput}
                  onBlur={handleWeightBlur}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <Text style={[styles.weightUnit, { color: c.textSecondary }]}>g</Text>
              </View>

              <TouchableOpacity
                style={[styles.weightStepBtn, { backgroundColor: c.card }]}
                onPress={() => handleWeightChange(25)}
                activeOpacity={0.7}
              >
                <Plus size={20} color={c.text} />
              </TouchableOpacity>
            </View>

            {/* Quick Weight Chips */}
            <View style={styles.quickChipsRow}>
              {[50, 100, 150, 200, 300].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: weightGrams === g ? c.primary : c.background,
                      borderColor: weightGrams === g ? c.primary : c.border,
                    },
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setWeightGrams(g);
                    setWeightInput(String(g));
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      { color: weightGrams === g ? '#FFFFFF' : c.textSecondary },
                    ]}
                  >
                    {g}g
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.bottomActionsRow}>
              <TouchableOpacity
                style={[styles.secondaryActionBtn, { borderColor: c.border }]}
                onPress={resetScanner}
                activeOpacity={0.7}
              >
                <RotateCcw size={18} color={c.text} style={{ marginRight: 6 }} />
                <Text style={[styles.secondaryActionText, { color: c.text }]}>
                  {strings.scanAgain}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: c.primary }]}
                onPress={handleAddToDiary}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryActionText}>
                      {strings.addToDiary}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Scanned Food Card (Not Found State) */}
      {notFound && (
        <View style={[styles.sheetContainer, { backgroundColor: c.card, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.sheetHandle} />
          <TouchableOpacity
            style={[styles.sheetCloseBtn, { backgroundColor: c.cardHover }]}
            onPress={resetScanner}
            hitSlop={10}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={strings.close}
          >
            <X size={18} color={c.textMuted} />
          </TouchableOpacity>

          {addingProduct && scannedCode ? (
            <BarcodeFoodForm
              barcode={scannedCode}
              onBack={() => setAddingProduct(false)}
              onSaved={handleProductSaved}
            />
          ) : (
          <View style={styles.notFoundWrap}>
            <View style={[styles.notFoundIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <AlertCircle size={36} color="#EF4444" />
            </View>

            <Text style={[styles.notFoundTitle, { color: c.text }]}>
              {strings.barcodeNotFound}
            </Text>

            {scannedCode && (
              <Text style={[styles.notFoundBarcode, { color: c.textSecondary }]}>
                {strings.barcode}: {scannedCode}
              </Text>
            )}

            <Text style={[styles.notFoundDesc, { color: c.textSecondary }]}>
              {strings.barcodeNotFoundDesc}
            </Text>

            <View style={styles.notFoundButtons}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: c.primary, width: '100%', marginBottom: 12 }]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
                  setAddingProduct(true);
                }}
                disabled={!scannedCode || !/^\d{8,14}$/.test(scannedCode)}
                activeOpacity={0.85}
              >
                <Plus size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryActionText}>
                  {strings.addProductBtn}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryActionBtn, { borderColor: c.border, width: '100%' }]}
                onPress={resetScanner}
                activeOpacity={0.7}
              >
                <RotateCcw size={18} color={c.text} style={{ marginRight: 8 }} />
                <Text style={[styles.secondaryActionText, { color: c.text }]}>
                  {strings.scanAgain}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permissionCard: {
    alignItems: 'center',
    maxWidth: 320,
  },
  permissionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: Radius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  textButton: {
    paddingVertical: 10,
  },
  textButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // Reticle Mask
  maskTop: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  maskMiddleRow: {
    width: '100%',
    flexDirection: 'row',
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  maskBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  scanBox: {
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 10,
  },
  searchingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  searchingText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },

  // Header
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  iconCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  hintBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  hintBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '500',
  },

  // Bottom Sheet (Found Product)
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    maxHeight: SCREEN_HEIGHT * 0.75,
    ...softShadow('md'),
  },
  sheetCloseBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  productSourceBadge: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    marginRight: Spacing.md,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  productBarcode: {
    fontSize: FontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Nutrition Row
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  nutriCol: {
    alignItems: 'center',
    flex: 1,
  },
  nutriVal: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  nutriLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  nutriDivider: {
    width: 1,
    height: 24,
  },

  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Meal Pills
  mealPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  mealPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  mealPillText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // Weight Control
  weightControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  weightStepBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...softShadow('sm'),
  },
  weightInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightInput: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 70,
    padding: 0,
  },
  weightUnit: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Quick Chips
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  // Bottom Actions
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.xs,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: Radius.lg,
    ...softShadow('sm'),
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },

  // Not Found State
  notFoundWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  notFoundIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  notFoundTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: 6,
  },
  notFoundBarcode: {
    fontSize: FontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
  },
  notFoundDesc: {
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: 8,
  },
  notFoundButtons: {
    width: '100%',
  },
});
