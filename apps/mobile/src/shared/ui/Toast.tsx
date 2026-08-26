import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { useToastStore } from '../../store/useToastStore';
import { useAppStore } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

export function GlobalToast() {
  const insets = useSafeAreaInsets();
  const { visible, message, type, hideToast } = useToastStore();
  const { theme } = useAppStore();
  const currentTheme = theme();

  if (!visible || !message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 color={currentTheme.primary} size={20} />;
      case 'error':
      case 'warning':
        return <AlertCircle color={currentTheme.secondary} size={20} />;
      default:
        return <Info color={currentTheme.info} size={20} />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return currentTheme.primary;
      case 'error':
      case 'warning':
        return currentTheme.secondary;
      default:
        return currentTheme.info;
    }
  };

  return (
    <View style={[styles.wrapper, { top: insets.top + 10 }]} pointerEvents="box-none">
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: currentTheme.card,
            borderColor: getBorderColor(),
            shadowColor: '#000000',
          },
        ]}
        activeOpacity={0.9}
        onPress={hideToast}
      >
        <View style={styles.iconBox}>{getIcon()}</View>
        <Text style={[styles.messageText, { color: currentTheme.text }]} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity style={styles.closeBtn} onPress={hideToast}>
          <X color={currentTheme.textMuted} size={16} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
    paddingHorizontal: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    maxWidth: Math.min(width - 32, 380),
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 12,
    gap: 10,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
});
