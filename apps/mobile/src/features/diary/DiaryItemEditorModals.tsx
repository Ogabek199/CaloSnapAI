import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { AlertTriangle, Minus, Plus, Check } from 'lucide-react-native';
import { CustomModal } from '../../shared/ui/CustomModal';
import { usePalette, useStrings } from '../../store/useAppStore';
import { FontSize, Radius, Spacing } from '../../shared/theme/spacing';
import type { useDiaryItemEditor } from './useDiaryItemEditor';

type Editor = ReturnType<typeof useDiaryItemEditor>;

export function DiaryItemEditorModals({ editor }: { editor: Editor }) {
  const c = usePalette();
  const strings = useStrings();

  return (
    <>
      <CustomModal
        visible={editor.deleteVisible}
        onClose={() => editor.setDeleteVisible(false)}
        title={strings.deleteConfirmTitle}
      >
        <View style={styles.center}>
          <View style={[styles.warnIcon, { backgroundColor: c.dangerBg }]}>
            <AlertTriangle color={c.danger} size={28} />
          </View>
          <Text style={[styles.msg, { color: c.text }]}>
            {strings.deleteConfirmMsg
              .replace('{name}', editor.itemToDelete?.name ?? '')
              .replace('{g}', String(editor.itemToDelete?.weight ?? ''))}
          </Text>
          <View style={styles.row}>
            <Pressable
              onPress={() => editor.setDeleteVisible(false)}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: c.cardHover, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.btnText, { color: c.text }]}>{strings.cancelBtn}</Text>
            </Pressable>
            <Pressable
              onPress={editor.confirmDelete}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: c.danger, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.btnText, { color: '#fff' }]}>{strings.removeItem}</Text>
            </Pressable>
          </View>
        </View>
      </CustomModal>

      <CustomModal
        visible={editor.editVisible}
        onClose={() => editor.setEditVisible(false)}
        title={strings.editPortionTitle}
      >
        <Text style={[styles.editName, { color: c.text }]}>{editor.itemToEdit?.name}</Text>

        <View style={styles.weightRow}>
          <Pressable
            onPress={() => editor.adjustWeight(-10)}
            style={[styles.stepBtn, { backgroundColor: c.cardHover }]}
          >
            <Minus color={c.text} size={18} />
          </Pressable>
          <View style={styles.weightBox}>
            <TextInput
              value={editor.editWeight}
              onChangeText={editor.setEditWeight}
              keyboardType="number-pad"
              style={[styles.weightInput, { color: c.text }]}
            />
            <Text style={[styles.unit, { color: c.textMuted }]}>g</Text>
          </View>
          <Pressable
            onPress={() => editor.adjustWeight(10)}
            style={[styles.stepBtn, { backgroundColor: c.cardHover }]}
          >
            <Plus color={c.text} size={18} />
          </Pressable>
        </View>

        {editor.preview ? (
          <View style={[styles.preview, { backgroundColor: c.cardHover }]}>
            <Text style={[styles.previewMain, { color: c.text }]}>{editor.preview.cal} kcal</Text>
            <Text style={[styles.previewSub, { color: c.textMuted }]}>
              {strings.macroLine
                .replace('{p}', String(editor.preview.protein))
                .replace('{c}', String(editor.preview.carbs))
                .replace('{f}', String(editor.preview.fat))}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={editor.confirmEdit}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: c.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Check color="#fff" size={18} />
          <Text style={styles.saveText}>{strings.saveBtn}</Text>
        </Pressable>
      </CustomModal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: Spacing.lg },
  warnIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msg: {
    fontSize: FontSize.md,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  row: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: FontSize.md, fontWeight: '600' },
  editName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  weightInput: {
    fontSize: 36,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'center',
    letterSpacing: -1,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  unit: { fontSize: FontSize.md, fontWeight: '600', includeFontPadding: false },
  preview: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  previewMain: { fontSize: FontSize.xl, fontWeight: '700' },
  previewSub: { fontSize: FontSize.sm, marginTop: 4 },
  saveBtn: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  saveText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
});
