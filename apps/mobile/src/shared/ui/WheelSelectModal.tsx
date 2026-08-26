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
  isDark = true,
}: WheelSelectModalProps<T>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: isDark ? '#121A2B' : '#FFFFFF' },
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.titleText,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              {title}
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
            >
              <X color={isDark ? '#94A3B8' : '#64748B'} size={20} />
            </TouchableOpacity>
          </View>

          {/* Picker Wheel Area */}
          <View
            style={[
              styles.pickerWrapper,
              { backgroundColor: isDark ? '#0A0E1A' : '#F8FAFC' },
            ]}
          >
            <Picker
              selectedValue={selectedValue}
              onValueChange={(val) => {
                Haptics.selectionAsync();
                onValueChange(val as T);
              }}
              style={styles.picker}
              itemStyle={[
                styles.pickerItem,
                { color: isDark ? '#00E599' : '#059669' },
              ]}
              dropdownIconColor={isDark ? '#00E599' : '#059669'}
            >
              {options.map((opt) => (
                <Picker.Item
                  key={String(opt.value)}
                  label={unit ? `${opt.label} ${unit}` : opt.label}
                  value={opt.value}
                  color={
                    Platform.OS === 'android'
                      ? isDark
                        ? '#F8FAFC'
                        : '#0F172A'
                      : isDark
                      ? '#00E599'
                      : '#059669'
                  }
                />
              ))}
            </Picker>
          </View>

          {/* Confirm Done Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.confirmBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (onConfirm) onConfirm();
              onClose();
            }}
          >
            <Check color="#0A0E1A" size={18} strokeWidth={3} />
            <Text style={styles.confirmBtnText}>Tanlash</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handleBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748B',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerWrapper: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 153, 0.25)',
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : 60,
  },
  pickerItem: {
    fontSize: 22,
    fontWeight: '800',
    height: 200,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00E599',
    borderRadius: 14,
    paddingVertical: 14,
  },
  confirmBtnText: {
    color: '#0A0E1A',
    fontSize: 16,
    fontWeight: '800',
  },
});
