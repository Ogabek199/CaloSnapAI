import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { X, Check } from 'lucide-react-native';
import { Radius, Spacing, FontSize } from '../theme/spacing';

interface OptionItem<T = number | string> {
  label: string;
  value: T;
}

interface WheelSelectModalProps<T = number | string> {
  visible: boolean;
  title: string;
  selectedValue: T;
  options: OptionItem<T>[];
  onValueChange: (value: T) => void;
  onClose: () => void;
  onConfirm?: () => void;
  unit?: string;
  isDark?: boolean;
}

export function WheelSelectModal<T extends number | string>({
  visible,
  title,
  selectedValue,
  options,
  onValueChange,
  onClose,
  onConfirm,
  unit,
  isDark = false,
}: WheelSelectModalProps<T>) {
  const bg = isDark ? '#171A21' : '#FFFFFF';
  const text = isDark ? '#F4F5F7' : '#14171C';
  const muted = isDark ? '#6B7380' : '#8B939E';
  const primary = '#1A9B6C';
  const track = isDark ? '#0F1115' : '#F7F7F5';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: bg }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: text }]}>{title}</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              hitSlop={10}
            >
              <X color={muted} size={20} />
            </TouchableOpacity>
          </View>

          <View style={[styles.pickerWrap, { backgroundColor: track, borderColor: isDark ? '#2A2F3A' : '#E6E6E2' }]}>
            <Picker
              selectedValue={selectedValue}
              onValueChange={(val) => {
                Haptics.selectionAsync();
                onValueChange(val as T);
              }}
              style={styles.picker}
              itemStyle={[styles.pickerItem, { color: primary }]}
            >
              {(options ?? []).map((opt) => (
                <Picker.Item
                  key={String(opt.value)}
                  label={unit ? `${opt.label} ${unit}` : opt.label}
                  value={opt.value}
                  color={Platform.OS === 'android' ? text : primary}
                />
              ))}
            </Picker>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.confirm, { backgroundColor: primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onConfirm?.();
              onClose();
            }}
          >
            <Check color="#FFFFFF" size={18} strokeWidth={2.5} />
            <Text style={styles.confirmText}>Tanlash</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C5C5C5',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  pickerWrap: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 180 : 56,
  },
  pickerItem: {
    fontSize: 20,
    fontWeight: '600',
    height: 180,
  },
  confirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    height: 52,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
