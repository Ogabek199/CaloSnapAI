import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Camera, Image as ImageIcon, ArrowLeft, Check } from 'lucide-react-native';
import type { Food } from '@eda/types';
import { useAppStore, usePalette, useStrings } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';
import { ApiClient } from '../../shared/api/api-client';
import { TextField } from '../../shared/ui/TextField';
import { FontSize, Radius, Spacing, softShadow, androidTextFix } from '../../shared/theme/spacing';

type MacroKey = 'caloriesPer100g' | 'proteinPer100g' | 'carbsPer100g' | 'fatPer100g';
const MACRO_KEYS: MacroKey[] = ['caloriesPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g'];

type Props = {
  barcode: string;
  onBack: () => void;
  onSaved: (food: Food, servingGrams: number | null) => void;
};

const parseNumber = (value: string): number | null => {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const formatNumber = (n?: number) => (typeof n === 'number' ? String(Math.round(n * 10) / 10) : '');

/** Adds an unknown package: read the nutrition label with AI, let the user fix values, save under the barcode. */
export function BarcodeFoodForm({ barcode, onBack, onSaved }: Props) {
  const c = usePalette();
  const strings = useStrings();
  const language = useAppStore((s) => s.language);
  const showToast = useToastStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [values, setValues] = useState<Record<MacroKey, string>>({
    caloriesPer100g: '',
    proteinPer100g: '',
    carbsPer100g: '',
    fatPer100g: '',
  });
  const [packageSize, setPackageSize] = useState('');
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const macroLabels: Record<MacroKey, string> = {
    caloriesPer100g: strings.kcalShort,
    proteinPer100g: strings.protein,
    carbsPer100g: strings.carbs,
    fatPer100g: strings.fat,
  };

  const readLabel = async (source: 'camera' | 'gallery') => {
    if (reading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showToast(strings.cameraPermissionNeeded, 'warning');
        return;
      }
    }

    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9 };
    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled || !picked.assets?.[0]?.uri) return;

    setReading(true);
    try {
      const label = await ApiClient.readNutritionLabel(picked.assets[0].uri);
      if (!label.isLabel) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showToast(
          language === 'uz' && label.rejectionReason ? label.rejectionReason : strings.labelNotRecognized,
          'warning',
        );
        return;
      }
      setValues((prev) => {
        const next = { ...prev };
        for (const key of MACRO_KEYS) {
          if (typeof label[key] === 'number') next[key] = formatNumber(label[key]);
        }
        return next;
      });
      if (label.productName && !name.trim()) setName(label.productName);
      const complete = MACRO_KEYS.every((key) => typeof label[key] === 'number');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(complete ? strings.labelReadDone : strings.labelPartiallyRead, complete ? 'success' : 'info');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(e?.message || strings.errGeneric, 'error');
    } finally {
      setReading(false);
    }
  };

  const save = async () => {
    if (savingRef.current) return;
    const parsed = Object.fromEntries(MACRO_KEYS.map((k) => [k, parseNumber(values[k])])) as Record<
      MacroKey,
      number | null
    >;
    if (name.trim().length < 2 || MACRO_KEYS.some((k) => parsed[k] === null)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast(strings.fillProductFields, 'warning');
      return;
    }
    const serving = parseNumber(packageSize);

    savingRef.current = true;
    setSaving(true);
    try {
      const food = await ApiClient.createBarcodeFood({
        barcode,
        name: name.trim(),
        caloriesPer100g: parsed.caloriesPer100g!,
        proteinPer100g: parsed.proteinPer100g!,
        carbsPer100g: parsed.carbsPer100g!,
        fatPer100g: parsed.fatPer100g!,
        ...(serving && serving > 0 ? { servingGrams: Math.round(serving) } : {}),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(strings.productSaved, 'success');
      onSaved(food, serving && serving > 0 ? Math.round(serving) : null);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(e?.message || strings.errGeneric, 'error');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} hitSlop={10} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color={c.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.text }, androidTextFix]}>{strings.addProductTitle}</Text>
            <Text style={[styles.barcode, { color: c.textSecondary }]}>
              {strings.barcode}: {barcode}
            </Text>
          </View>
        </View>

        <Text style={[styles.hint, { color: c.textSecondary }]}>{strings.addProductHint}</Text>

        <View style={styles.labelButtons}>
          <TouchableOpacity
            style={[styles.labelBtn, styles.labelBtnPrimary, { backgroundColor: c.primary }]}
            onPress={() => readLabel('camera')}
            disabled={reading}
            activeOpacity={0.85}
          >
            {reading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.labelBtnPrimaryText}>{strings.readingLabel}</Text>
              </>
            ) : (
              <>
                <Camera size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.labelBtnPrimaryText}>{strings.scanLabelBtn}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.labelBtn, { borderColor: c.border, borderWidth: 1 }]}
            onPress={() => readLabel('gallery')}
            disabled={reading}
            activeOpacity={0.7}
            accessibilityLabel={strings.pickLabelFromGallery}
          >
            <ImageIcon size={18} color={c.text} />
          </TouchableOpacity>
        </View>

        <TextField
          label={strings.productNameLabel}
          placeholder={strings.productNamePlaceholder}
          value={name}
          onChangeText={setName}
          maxLength={80}
          returnKeyType="next"
        />

        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>{strings.per100gTitle}</Text>
        <View style={styles.macroGrid}>
          {MACRO_KEYS.map((key) => (
            <View
              key={key}
              style={[styles.macroCell, { backgroundColor: c.cardHover, borderColor: c.border }]}
            >
              <Text style={[styles.macroLabel, { color: c.textSecondary }]} numberOfLines={1}>
                {macroLabels[key]}
              </Text>
              <TextInput
                value={values[key]}
                onChangeText={(v) => setValues((prev) => ({ ...prev, [key]: v.replace(/[^0-9.,]/g, '') }))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={c.textMuted}
                maxLength={6}
                style={[styles.macroInput, { color: c.text }, androidTextFix]}
              />
              <Text style={[styles.macroUnit, { color: c.textMuted }]}>
                {key === 'caloriesPer100g' ? '' : 'g'}
              </Text>
            </View>
          ))}
        </View>

        <TextField
          label={strings.packageSizeLabel}
          placeholder="500"
          value={packageSize}
          onChangeText={(v) => setPackageSize(v.replace(/[^0-9.,]/g, ''))}
          keyboardType="decimal-pad"
          maxLength={5}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: c.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={save}
          disabled={saving || reading}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>{strings.saveProductBtn}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    paddingRight: 40,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  barcode: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  hint: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  labelButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  labelBtn: {
    height: 50,
    minWidth: 50,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  labelBtnPrimary: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    ...softShadow('sm'),
  },
  labelBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  macroCell: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  macroInput: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 48,
    paddingVertical: 4,
  },
  macroUnit: {
    fontSize: 10,
    fontWeight: '600',
    minHeight: 12,
  },
  saveBtn: {
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    ...softShadow('sm'),
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
