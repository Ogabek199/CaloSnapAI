import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Check,
  AlertTriangle,
  Store,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react-native';
import { CustomModal } from '../../shared/ui/CustomModal';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, usePalette, useStrings } from '../../store/useAppStore';
import {
  useSubscriptionStore,
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from '../../store/useSubscriptionStore';
import { useToastStore } from '../../store/useToastStore';
import { FontSize, Radius, Spacing, softShadow } from '../../shared/theme/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface TestStorePurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  planId?: SubscriptionPlan['id'];
  onPurchaseSuccess?: () => void;
}

export const TestStorePurchaseModal: React.FC<TestStorePurchaseModalProps> = ({
  visible,
  onClose,
  planId,
  onPurchaseSuccess,
}) => {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = usePalette();
  const localized = useStrings();
  const { selectedPlanId, subscribe, isSubscribing, closePaywall } = useSubscriptionStore(
    useShallow((s) => ({
      selectedPlanId: s.selectedPlanId,
      subscribe: s.subscribe,
      isSubscribing: s.isSubscribing,
      closePaywall: s.closePaywall,
    })),
  );
  const showToast = useToastStore((s) => s.showToast);

  const [isSimulatingError, setIsSimulatingError] = useState(false);

  const c = palette;
  const strings = localized;
  const dark = themeMode === 'dark';

  const targetPlanId = planId || selectedPlanId;
  const currentPlan =
    SUBSCRIPTION_PLANS.find((p) => p.id === targetPlanId) || SUBSCRIPTION_PLANS[0];

  const planTitle = strings[currentPlan.titleKey] || currentPlan.id;
  const planPrice = strings[currentPlan.priceKey] || `$${currentPlan.priceAmount}`;
  const planSub = currentPlan.subKey ? strings[currentPlan.subKey] : null;

  const handleConfirmPurchase = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    // Complete purchase in test store mode without opening RevenueCat's native sheet
    const result = await subscribe(currentPlan.id, { skipNativePrompt: true });
    if (result === 'success') {
      onClose();
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      } else {
        closePaywall();
      }
    } else {
      showToast(strings.purchaseFailed, 'error');
    }
  };

  const handleSimulateError = () => {
    setIsSimulatingError(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {}

    setTimeout(() => {
      setIsSimulatingError(false);
      showToast(strings.testPurchaseCancelled, 'error');
    }, 400);
  };

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      title="Test Store Purchase"
      cardStyle={[
        styles.modalCard,
        {
          backgroundColor: c.card,
          borderColor: c.border,
        },
      ]}
      headerRight={
        <View style={styles.sandboxBadge}>
          <Text style={styles.sandboxBadgeText}>🧪 Sandbox</Text>
        </View>
      }
    >
      <View style={styles.content}>
        {/* Selected Plan Details Card */}
        <View
          style={[
            styles.planBox,
            {
              backgroundColor: dark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
              borderColor: '#10B981',
            },
          ]}
        >
          <View style={styles.planHeader}>
            <View style={styles.planBadge}>
              <Sparkles size={14} color="#10B981" />
              <Text style={styles.planBadgeText}>{strings.selectedPlan}</Text>
            </View>
            <Text style={styles.planPrice}>{planPrice}</Text>
          </View>

          <Text style={[styles.planTitle, { color: c.text }]}>{planTitle}</Text>
          {planSub && <Text style={[styles.planSub, { color: c.textMuted }]}>{planSub}</Text>}
          {currentPlan.hasTrial && (
            <Text style={styles.trialNote}>{strings.trialIncludedNote}</Text>
          )}
        </View>

        {/* Test Store Environment Notice */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: dark ? 'rgba(255, 255, 255, 0.04)' : c.cardHover,
              borderColor: c.border,
            },
          ]}
        >
          <View style={styles.infoHeader}>
            <Store size={18} color={c.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoTitle, { color: c.text }]}>
              RevenueCat Test Store
            </Text>
          </View>

          <Text style={[styles.infoDesc, { color: c.textMuted }]}>
            {strings.testStoreDisclaimer}
          </Text>

          <View style={styles.infoMetaRow}>
            <View style={styles.metaItem}>
              <Zap size={13} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={[styles.metaText, { color: c.text }]}>Entitlement: calosnap_pro</Text>
            </View>
            <View style={styles.metaItem}>
              <ShieldCheck size={13} color="#3B82F6" style={{ marginRight: 4 }} />
              <Text style={[styles.metaText, { color: c.text }]}>{strings.secureTestLabel}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* Confirm Success Button */}
          <TouchableOpacity
            style={[styles.confirmBtn, { ...softShadow('md') }]}
            onPress={handleConfirmPurchase}
            disabled={isSubscribing || isSimulatingError}
            activeOpacity={0.85}
          >
            {isSubscribing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={18} color="#FFFFFF" strokeWidth={3} style={{ marginRight: 8 }} />
                <Text style={styles.confirmBtnText}>{strings.confirmTestPurchase}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Simulate Error / Cancel Button */}
          <TouchableOpacity
            style={[
              styles.errorBtn,
              {
                borderColor: dark ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5',
                backgroundColor: dark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
              },
            ]}
            onPress={handleSimulateError}
            disabled={isSubscribing || isSimulatingError}
            activeOpacity={0.7}
          >
            {isSimulatingError ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <AlertTriangle size={15} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorBtnText}>{strings.simulateErrorBtn}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Dismiss Button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={isSubscribing || isSimulatingError}
            activeOpacity={0.6}
          >
            <Text style={[styles.cancelBtnText, { color: c.textMuted }]}>
              {strings.cancelBtn}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  modalCard: {
    width: Math.min(SCREEN_WIDTH - 28, 420),
    borderRadius: 24,
    overflow: 'hidden',
  },
  sandboxBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  sandboxBadgeText: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    paddingTop: Spacing.xs,
  },

  // Plan Details Card
  planBox: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planPrice: {
    color: '#10B981',
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  planTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  planSub: {
    fontSize: FontSize.xs,
  },
  trialNote: {
    color: '#10B981',
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 4,
  },

  // Info Card
  infoCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  infoDesc: {
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginBottom: 10,
  },
  infoMetaRow: {
    flexDirection: 'column',
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Action Buttons
  actionContainer: {
    gap: 8,
  },
  confirmBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.lg,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  errorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  errorBtnText: {
    color: '#EF4444',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
