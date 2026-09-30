import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, Check } from 'lucide-react-native';
import { Radius, Spacing, FontSize } from '../theme/spacing';
import { useStrings } from '../../store/useAppStore';

const ITEM_HEIGHT = 44;
const WHEEL_HEIGHT = 180;
const WHEEL_PADDING = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

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
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const bg = isDark ? '#171A21' : '#FFFFFF';
  const text = isDark ? '#F4F5F7' : '#14171C';
  const muted = isDark ? '#6B7380' : '#8B939E';
  const primary = '#1A9B6C';
  const track = isDark ? '#0F1115' : '#F7F7F5';

  const isAndroid = Platform.OS === 'android';
  const flatListRef = useRef<FlatList<OptionItem<T>>>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === selectedValue),
  );

  useEffect(() => {
    if (!visible || !isAndroid || selectedIndex < 0) return;
    const id = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(id);
  }, [visible, isAndroid, selectedIndex]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.max(0, Math.min(options.length - 1, Math.round(y / ITEM_HEIGHT)));
    const opt = options[idx];
    if (opt && opt.value !== selectedValue) {
      Haptics.selectionAsync();
      onValueChange(opt.value);
    }
  };

  const handleItemPress = (item: OptionItem<T>, index: number) => {
    Haptics.selectionAsync();
    flatListRef.current?.scrollToOffset({
      offset: index * ITEM_HEIGHT,
      animated: true,
    });
    onValueChange(item.value);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: bg, paddingBottom: Spacing.xxxl + insets.bottom },
          ]}
        >
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

          <View
            style={[
              styles.pickerWrap,
              { backgroundColor: track, borderColor: isDark ? '#2A2F3A' : '#E6E6E2' },
            ]}
          >
            {isAndroid ? (
              <View style={styles.androidWheelContainer}>
                {/* Center selection highlight */}
                <View
                  style={[
                    styles.androidCenterHighlight,
                    {
                      backgroundColor: isDark
                        ? 'rgba(26,155,108,0.18)'
                        : 'rgba(26,155,108,0.12)',
                      borderColor: primary,
                    },
                  ]}
                  pointerEvents="none"
                />

                <FlatList
                  ref={flatListRef}
                  data={options}
                  keyExtractor={(item) => String(item.value)}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
                  getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                  })}
                  onMomentumScrollEnd={onMomentumScrollEnd}
                  onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                      flatListRef.current?.scrollToOffset({
                        offset: info.index * ITEM_HEIGHT,
                        animated: false,
                      });
                    }, 80);
                  }}
                  renderItem={({ item, index }) => {
                    const isSelected = item.value === selectedValue;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleItemPress(item, index)}
                        style={styles.androidItemRow}
                      >
                        <Text
                          style={[
                            styles.androidItemText,
                            isSelected
                              ? [styles.androidItemTextSelected, { color: primary }]
                              : [styles.androidItemTextMuted, { color: muted }],
                          ]}
                        >
                          {unit ? `${item.label} ${unit}` : item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />

                {/* Top and Bottom soft optical fades */}
                <LinearGradient
                  colors={[track, 'transparent']}
                  style={styles.gradientTop}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={['transparent', track]}
                  style={styles.gradientBottom}
                  pointerEvents="none"
                />
              </View>
            ) : (
              <Picker
                selectedValue={selectedValue}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  onValueChange(val as T);
                }}
                style={styles.picker}
                itemStyle={[styles.pickerItem, { color: primary }]}
                dropdownIconColor={primary}
              >
                {(options ?? []).map((opt) => (
                  <Picker.Item
                    key={String(opt.value)}
                    label={unit ? `${opt.label} ${unit}` : opt.label}
                    value={opt.value}
                    color={primary}
                  />
                ))}
              </Picker>
            )}
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
            <Text style={styles.confirmText}>{strings.selectBtn}</Text>
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    height: WHEEL_HEIGHT,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: WHEEL_HEIGHT,
  },
  pickerItem: {
    fontSize: 20,
    fontWeight: '600',
    height: WHEEL_HEIGHT,
  },
  androidWheelContainer: {
    width: '100%',
    height: WHEEL_HEIGHT,
    position: 'relative',
  },
  androidCenterHighlight: {
    position: 'absolute',
    top: WHEEL_PADDING,
    left: 14,
    right: 14,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 1,
  },
  androidItemRow: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  androidItemText: {
    includeFontPadding: false,
    textAlign: 'center',
  },
  androidItemTextSelected: {
    fontSize: 20,
    fontWeight: '700',
  },
  androidItemTextMuted: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.55,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: WHEEL_PADDING,
    zIndex: 3,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: WHEEL_PADDING,
    zIndex: 3,
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
