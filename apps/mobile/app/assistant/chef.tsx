import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChefHat,
  Camera,
  Image as ImageIcon,
  X,
  Plus,
  Clock,
  Users,
  Flame,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
} from 'lucide-react-native';
import { useAppStore, usePalette, useStrings } from '../../src/store/useAppStore';
import { useToastStore } from '../../src/store/useToastStore';
import { ApiClient, type ChefRecipe, type ChefResult } from '../../src/shared/api/api-client';
import { getTodayContext } from '../../src/features/assistant/day-context';
import { isPremiumRequiredError } from '../../src/features/assistant/pro-gate';
import { FontSize, Radius, Spacing, softShadow, androidTextFix } from '../../src/shared/theme/spacing';

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const MAX_INGREDIENTS = 30;
const CHEF_ORANGE = '#F59E0B';

const stripEmoji = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, '').trim();

export default function AssistantChefScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = usePalette();
  const strings = useStrings();
  const language = useAppStore((s) => s.language);
  const isPremium = useAppStore((s) => !!s.user.isPremium);
  const showToast = useToastStore((s) => s.showToast);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChefResult | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showToast(strings.cameraPermissionNeeded, 'warning');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
      const picked =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (!picked.canceled && picked.assets?.[0]?.uri) setPhotoUri(picked.assets[0].uri);
    } catch {
      showToast(strings.errGeneric, 'error');
    }
  };

  const addIngredients = () => {
    const parts = draft
      .split(/[,،;\n]/)
      .map((p) => p.trim().slice(0, 60))
      .filter(Boolean);
    if (!parts.length) return;
    Haptics.selectionAsync();
    setIngredients((prev) => {
      const seen = new Set(prev.map((p) => p.toLowerCase()));
      const next = [...prev];
      for (const p of parts) {
        if (!seen.has(p.toLowerCase())) {
          seen.add(p.toLowerCase());
          next.push(p);
        }
      }
      return next.slice(0, MAX_INGREDIENTS);
    });
    setDraft('');
  };

  const removeIngredient = (name: string) => {
    Haptics.selectionAsync();
    setIngredients((prev) => prev.filter((p) => p !== name));
  };

  const generate = async () => {
    if (loadingRef.current) return;
    // Text still in the box counts, so users don't have to tap "Add" first.
    const pending = draft
      .split(/[,،;\n]/)
      .map((p) => p.trim().slice(0, 60))
      .filter(Boolean);
    const allIngredients = [...new Set([...ingredients, ...pending])].slice(0, MAX_INGREDIENTS);
    if (!photoUri && allIngredients.length === 0) {
      showToast(strings.chefNeedInput, 'warning');
      return;
    }
    if (!isPremium) {
      router.push('/paywall');
      return;
    }
    if (pending.length) {
      setIngredients(allIngredients);
      setDraft('');
    }
    loadingRef.current = true;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await ApiClient.assistantChef({
        imageUri: photoUri ?? undefined,
        ingredients: allIngredients,
        mealType: mealType ?? undefined,
        language,
        context: getTodayContext(),
      });
      if (!mountedRef.current) return;
      setResult(res);
      setExpanded(0);
      Haptics.notificationAsync(
        res.isFood ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      );
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
    } catch (e: any) {
      if (isPremiumRequiredError(e)) {
        router.push('/paywall');
      } else if (mountedRef.current) {
        showToast(e?.message || strings.errGeneric, 'error');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  };

  const startOver = () => {
    Haptics.selectionAsync();
    setResult(null);
    setPhotoUri(null);
    setIngredients([]);
    setDraft('');
    setExpanded(0);
  };

  const mealLabel = (m: MealType) => stripEmoji(strings[m.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack']);
  const difficultyLabel = (d: ChefRecipe['difficulty']) =>
    d === 'hard' ? strings.chefDifficultyHard : d === 'medium' ? strings.chefDifficultyMedium : strings.chefDifficultyEasy;

  const renderRecipe = (recipe: ChefRecipe, index: number) => {
    const open = expanded === index;
    return (
      <View
        key={`${recipe.name}-${index}`}
        style={[styles.recipeCard, softShadow('sm'), { backgroundColor: c.card, borderColor: c.border }]}
      >
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setExpanded(open ? null : index);
          }}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
        >
          <View style={styles.recipeHead}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recipeName, { color: c.text }]}>{recipe.name}</Text>
              {recipe.description ? (
                <Text style={[styles.recipeDesc, { color: c.textSecondary }]}>{recipe.description}</Text>
              ) : null}
            </View>
            {open ? <ChevronUp size={20} color={c.textMuted} /> : <ChevronDown size={20} color={c.textMuted} />}
          </View>

          <View style={styles.metaRow}>
            {recipe.timeMinutes ? (
              <View style={[styles.metaPill, { backgroundColor: c.cardHover }]}>
                <Clock size={12} color={c.textSecondary} />
                <Text style={[styles.metaText, { color: c.textSecondary }]}>
                  {strings.chefMinutes.replace('{n}', String(Math.round(recipe.timeMinutes)))}
                </Text>
              </View>
            ) : null}
            <View style={[styles.metaPill, { backgroundColor: c.cardHover }]}>
              <Users size={12} color={c.textSecondary} />
              <Text style={[styles.metaText, { color: c.textSecondary }]}>
                {strings.chefServings.replace('{n}', String(recipe.servings))}
              </Text>
            </View>
            <View style={[styles.metaPill, { backgroundColor: c.cardHover }]}>
              <Text style={[styles.metaText, { color: c.textSecondary }]}>{difficultyLabel(recipe.difficulty)}</Text>
            </View>
          </View>

          <View style={[styles.macroRow, { backgroundColor: c.primaryBg }]}>
            <View style={styles.macroCell}>
              <View style={styles.kcalRow}>
                <Flame size={13} color={c.primary} />
                <Text style={[styles.macroVal, { color: c.primary }]}>{recipe.caloriesPerServing}</Text>
              </View>
              <Text style={[styles.macroLabel, { color: c.textMuted }]}>kcal</Text>
            </View>
            <View style={styles.macroCell}>
              <Text style={[styles.macroVal, { color: c.protein }]}>{recipe.proteinPerServing}g</Text>
              <Text style={[styles.macroLabel, { color: c.textMuted }]}>{strings.protein}</Text>
            </View>
            <View style={styles.macroCell}>
              <Text style={[styles.macroVal, { color: c.carbs }]}>{recipe.carbsPerServing}g</Text>
              <Text style={[styles.macroLabel, { color: c.textMuted }]}>{strings.carbs}</Text>
            </View>
            <View style={styles.macroCell}>
              <Text style={[styles.macroVal, { color: c.fat }]}>{recipe.fatPerServing}g</Text>
              <Text style={[styles.macroLabel, { color: c.textMuted }]}>{strings.fat}</Text>
            </View>
          </View>
          <Text style={[styles.perServing, { color: c.textMuted }]}>{strings.chefPerServing}</Text>
        </Pressable>

        {recipe.healthNote ? (
          <View style={[styles.healthNote, { backgroundColor: c.dangerBg }]}>
            <HeartPulse size={14} color={c.danger} />
            <Text style={[styles.healthNoteText, { color: c.text }]}>{recipe.healthNote}</Text>
          </View>
        ) : null}

        {open ? (
          <View style={styles.recipeBody}>
            {recipe.ingredients.length ? (
              <>
                <Text style={[styles.bodyTitle, { color: c.text }]}>{strings.chefIngredientsTitle}</Text>
                {recipe.ingredients.map((ing, i) => (
                  <View key={`${ing.name}-${i}`} style={[styles.ingRow, { borderBottomColor: c.border }]}>
                    <Text style={[styles.ingName, { color: c.text }]}>{ing.name}</Text>
                    {ing.amount ? <Text style={[styles.ingAmount, { color: c.textSecondary }]}>{ing.amount}</Text> : null}
                  </View>
                ))}
              </>
            ) : null}
            <Text style={[styles.bodyTitle, { color: c.text, marginTop: Spacing.md }]}>{strings.chefStepsTitle}</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: CHEF_ORANGE }]}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: c.text }]}>{step}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={[styles.iconBtn, { backgroundColor: c.card, borderColor: c.border }]}
          accessibilityRole="button"
        >
          <ChevronLeft color={c.text} size={20} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
          {strings.aiChefTitle}
        </Text>
        {result ? (
          <Pressable
            onPress={startOver}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: c.card, borderColor: c.border }]}
            accessibilityRole="button"
            accessibilityLabel={strings.chefStartOver}
          >
            <RefreshCw color={c.textSecondary} size={17} />
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {result ? (
            result.isFood ? (
              <>
                {result.ingredients.length ? (
                  <>
                    <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>{strings.chefDetected}</Text>
                    <View style={styles.chips}>
                      {result.ingredients.map((ing) => (
                        <View key={ing} style={[styles.chip, { backgroundColor: c.card, borderColor: c.border }]}>
                          <Text style={[styles.chipText, { color: c.text }]}>{ing}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}
                <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>{strings.chefRecipes}</Text>
                {result.recipes.map(renderRecipe)}
                <Text style={[styles.disclaimer, { color: c.textMuted }]}>{strings.healthDisclaimer}</Text>
              </>
            ) : (
              <View style={[styles.rejectCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.heroIcon, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                  <ChefHat size={28} color={CHEF_ORANGE} />
                </View>
                <Text style={[styles.rejectText, { color: c.text }]}>{result.rejectionReason || strings.errGeneric}</Text>
              </View>
            )
          ) : (
            <>
              <View style={[styles.hero, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.heroIcon, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                  <ChefHat size={28} color={CHEF_ORANGE} />
                </View>
                <Text style={[styles.heroTitle, { color: c.text }]}>{strings.chefHeroTitle}</Text>
                <Text style={[styles.heroText, { color: c.textSecondary }]}>{strings.chefHeroText}</Text>

                {photoUri ? (
                  <View style={styles.photoWrap}>
                    <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
                    <Pressable
                      onPress={() => setPhotoUri(null)}
                      disabled={loading}
                      hitSlop={8}
                      style={styles.photoRemove}
                      accessibilityRole="button"
                    >
                      <X size={16} color="#FFFFFF" />
                    </Pressable>
                    <View style={styles.photoBadge}>
                      <Text style={styles.photoBadgeText}>{strings.chefPhotoAttached}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoBtns}>
                    <Pressable
                      onPress={() => pickPhoto('camera')}
                      disabled={loading}
                      style={({ pressed }) => [styles.photoBtn, { backgroundColor: CHEF_ORANGE, opacity: pressed ? 0.85 : 1 }]}
                    >
                      <Camera size={18} color="#FFFFFF" />
                      <Text style={[styles.photoBtnText, { color: '#FFFFFF' }]}>{strings.chefTakePhoto}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => pickPhoto('gallery')}
                      disabled={loading}
                      style={({ pressed }) => [
                        styles.photoBtn,
                        { backgroundColor: c.cardHover, opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <ImageIcon size={18} color={c.text} />
                      <Text style={[styles.photoBtnText, { color: c.text }]}>{strings.chefPickPhoto}</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>{strings.chefOrType}</Text>
              <View style={styles.addRow}>
                <View style={[styles.inputWrap, { backgroundColor: c.card, borderColor: c.border }]}>
                  <TextInput
                    style={[styles.input, { color: c.text }]}
                    value={draft}
                    onChangeText={setDraft}
                    placeholder={strings.chefIngredientPlaceholder}
                    placeholderTextColor={c.textMuted}
                    onSubmitEditing={addIngredients}
                    returnKeyType="done"
                    blurOnSubmit={false}
                    editable={!loading}
                    maxLength={200}
                  />
                </View>
                <Pressable
                  onPress={addIngredients}
                  disabled={!draft.trim() || loading}
                  style={[styles.addBtn, { backgroundColor: draft.trim() ? c.primary : c.cardHover }]}
                  accessibilityRole="button"
                  accessibilityLabel={strings.chefAdd}
                >
                  <Plus size={20} color={draft.trim() ? c.onPrimary : c.textMuted} />
                </Pressable>
              </View>
              {ingredients.length ? (
                <View style={styles.chips}>
                  {ingredients.map((ing) => (
                    <Pressable
                      key={ing}
                      onPress={() => removeIngredient(ing)}
                      disabled={loading}
                      style={[styles.chip, styles.chipRemovable, { backgroundColor: c.primaryBg, borderColor: c.primaryBg }]}
                    >
                      <Text style={[styles.chipText, { color: c.primary }]}>{ing}</Text>
                      <X size={13} color={c.primary} />
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>{strings.chefMealType}</Text>
              <View style={styles.chips}>
                {[null, ...MEAL_TYPES].map((m) => {
                  const active = mealType === m;
                  return (
                    <Pressable
                      key={m ?? 'any'}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setMealType(m);
                      }}
                      disabled={loading}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? c.primary : c.card,
                          borderColor: active ? c.primary : c.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? c.onPrimary : c.text }]}>
                        {m ? mealLabel(m) : strings.chefMealAny}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={generate}
                disabled={loading}
                style={({ pressed }) => [
                  styles.generateBtn,
                  { backgroundColor: CHEF_ORANGE, opacity: pressed || loading ? 0.85 : 1 },
                ]}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.generateText}>{strings.chefLoading}</Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} color="#FFFFFF" />
                    <Text style={styles.generateText}>{strings.chefGenerate}</Text>
                  </>
                )}
              </Pressable>
            </>
          )}

          {result ? (
            <Pressable
              onPress={startOver}
              style={({ pressed }) => [
                styles.generateBtn,
                { backgroundColor: c.cardHover, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <RefreshCw size={17} color={c.text} />
              <Text style={[styles.generateText, { color: c.text }]}>{strings.chefStartOver}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerTitle: { flex: 1, fontSize: FontSize.xl, fontWeight: '800', ...androidTextFix },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md },

  hero: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center', ...androidTextFix },
  heroText: { fontSize: FontSize.sm, lineHeight: 19, textAlign: 'center', ...androidTextFix },
  photoBtns: { flexDirection: 'row', gap: Spacing.sm, alignSelf: 'stretch', marginTop: Spacing.sm },
  photoBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoBtnText: { fontSize: FontSize.sm, fontWeight: '700', ...androidTextFix },
  photoWrap: { alignSelf: 'stretch', height: 180, borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  photo: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  photoBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', ...androidTextFix },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
    marginBottom: -4,
    marginLeft: 4,
    ...androidTextFix,
  },
  addRow: { flexDirection: 'row', gap: Spacing.sm },
  inputWrap: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: { fontSize: FontSize.md, padding: 0, ...androidTextFix },
  addBtn: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipRemovable: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontSize: 13, fontWeight: '600', ...androidTextFix },

  generateBtn: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm,
  },
  generateText: { color: '#FFFFFF', fontSize: FontSize.md, fontWeight: '700', ...androidTextFix },

  recipeCard: { borderRadius: Radius.lg + 2, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg, gap: Spacing.sm },
  recipeHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  recipeName: { fontSize: FontSize.md + 2, fontWeight: '800', ...androidTextFix },
  recipeDesc: { fontSize: FontSize.sm, lineHeight: 19, marginTop: 3, ...androidTextFix },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  metaText: { fontSize: 12, fontWeight: '600', ...androidTextFix },
  macroRow: { flexDirection: 'row', borderRadius: Radius.md, paddingVertical: 10, marginTop: Spacing.sm },
  macroCell: { flex: 1, alignItems: 'center', gap: 2 },
  kcalRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  macroVal: { fontSize: FontSize.md, fontWeight: '800', ...androidTextFix },
  macroLabel: { fontSize: 11, ...androidTextFix },
  perServing: { fontSize: 11, textAlign: 'center', marginTop: 4, ...androidTextFix },
  healthNote: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: Radius.md, alignItems: 'flex-start' },
  healthNoteText: { flex: 1, fontSize: 13, lineHeight: 18, ...androidTextFix },
  recipeBody: { marginTop: Spacing.xs },
  bodyTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: 6, ...androidTextFix },
  ingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ingName: { flex: 1, fontSize: FontSize.sm, ...androidTextFix },
  ingAmount: { fontSize: FontSize.sm, fontWeight: '600', ...androidTextFix },
  stepRow: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'flex-start' },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  stepText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20, ...androidTextFix },

  rejectCard: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  rejectText: { fontSize: FontSize.md, lineHeight: 22, textAlign: 'center', ...androidTextFix },
  disclaimer: { fontSize: 11, textAlign: 'center', ...androidTextFix },
});
