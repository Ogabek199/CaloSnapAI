import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { usePalette, useStrings } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

export interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  hideHeader?: boolean;
  cardStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  dismissible?: boolean;
}

export function CustomModal({
  visible,
  onClose,
  title,
  children,
  headerRight,
  hideHeader = false,
  cardStyle,
  contentStyle,
  dismissible = true,
}: CustomModalProps) {
  const currentTheme = usePalette();
  const strings = useStrings();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissible ? onClose : undefined}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop is a sibling (not a wrapper) so it never steals scroll gestures from the card. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissible ? onClose : undefined}
          accessible={false}
        />
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: currentTheme.card,
              borderColor: currentTheme.border,
            },
            cardStyle,
          ]}
        >
          {!hideHeader && (
            <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
              <Text style={[styles.title, { color: currentTheme.text }]} numberOfLines={1}>
                {title || ''}
              </Text>
              <View style={styles.headerRightArea}>
                {headerRight}
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: currentTheme.cardHover }]}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={strings.close}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <X color={currentTheme.textMuted} size={18} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.body, contentStyle]}>{children}</View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: Math.min(width - 32, 400),
    maxHeight: '90%',
    flexShrink: 1,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  headerRightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
    flexShrink: 1,
  },
});
