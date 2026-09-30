import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
  Utensils,
  ChefHat,
  MessageCircle,
  HeartPulse,
  PartyPopper,
  Crown,
} from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, usePalette, useStrings } from '../../store/useAppStore';
import {
  useSubscriptionStore,
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from '../../store/useSubscriptionStore';
import { useToastStore } from '../../store/useToastStore';
import { type PlanType, RevenueCatService } from '../../shared/services/revenuecat.service';
import { TestStorePurchaseModal } from './TestStorePurchaseModal';
import { currencyForPhone, formatApproxLocalPrice, getUsdRates } from './local-currency';
import { CustomModal } from '../../shared/ui/CustomModal';
import { type LegalPage, legalUrl } from '../../shared/api/api-client';
import { FontSize, Radius, Spacing, softShadow } from '../../shared/theme/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PERIOD_TO_PLAN_TYPE: Record<SubscriptionPlan['period'], PlanType> = {
  year: 'yearly',
  month: 'monthly',
  week: 'weekly',
};

type StorePrices = Awaited<ReturnType<typeof RevenueCatService.getPlanPrices>>;

interface PaywallModalProps {
  visible?: boolean;
  onClose?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const themeMode = useAppStore((s) => s.themeMode);
  const language = useAppStore((s) => s.language);
  const userPhone = useAppStore((s) => s.user.phone);
  const palette = usePalette();
  const localized = useStrings();
  const {
    isPaywallOpen,
    closePaywall,
    selectedPlanId,
    setSelectedPlanId,
    subscribe,
    restorePurchases,
    isSubscribing,
    isRestoring,
  } = useSubscriptionStore(
    useShallow((s) => ({
      isPaywallOpen: s.isPaywallOpen,
      closePaywall: s.closePaywall,
      selectedPlanId: s.selectedPlanId,
      setSelectedPlanId: s.setSelectedPlanId,
      subscribe: s.subscribe,
      restorePurchases: s.restorePurchases,
      isSubscribing: s.isSubscribing,
      isRestoring: s.isRestoring,
    })),
  );
  const showToast = useToastStore((s) => s.showToast);

  const isModalVisible = visible !== undefined ? visible : isPaywallOpen;
  const handleClose = onClose || closePaywall;

  const [isTestStoreOpen, setIsTestStoreOpen] = useState(false);
  const [storePrices, setStorePrices] = useState<StorePrices>({});
  const [usdRates, setUsdRates] = useState<Record<string, number> | null>(null);

  const c = palette;
  const strings = localized;
  const dark = themeMode === 'dark';
  const localCurrency = currencyForPhone(userPhone);

  useEffect(() => {
    if (!isModalVisible) return;
    let cancelled = false;
    RevenueCatService.getPlanPrices()
      .then((prices) => {
        if (!cancelled) setStorePrices(prices);
      })
      .catch(() => {});
    if (localCurrency) {
      getUsdRates().then((rates) => {
        if (!cancelled && rates) setUsdRates(rates);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [isModalVisible, localCurrency]);

  const storeInfo = (plan: SubscriptionPlan) => storePrices[PERIOD_TO_PLAN_TYPE[plan.period]];
  const approxLocalPrice = (plan: SubscriptionPlan) => {
    const store = storeInfo(plan);
    return store
      ? formatApproxLocalPrice(store.amount, store.currencyCode, localCurrency, usdRates, language)
      : formatApproxLocalPrice(plan.priceAmount, 'USD', localCurrency, usdRates, language);
  };
  const showsApproxPrice = SUBSCRIPTION_PLANS.some((plan) => approxLocalPrice(plan));
  const planHasTrial = (plan: SubscriptionPlan) => {
    const info = storeInfo(plan);
    return info ? info.hasFreeTrial : !!plan.hasTrial;
  };

  const selectedPlan =
    SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[0];

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setSelectedPlanId(plan.id);
  };

  const handleSubscribe = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    // Agar RevenueCat Test Store rejimida bo'lsa (yoki dev muhitda),
    // unstyled native modal o'rniga maxsus ishlab chiqilgan Custom Test Store Modal ochiladi!
    if (RevenueCatService.isTestStoreMode()) {
      setIsTestStoreOpen(true);
      return;
    }

    const result = await subscribe(selectedPlanId);
    if (result === 'success') {
      handleClose();
    } else if (result === 'unavailable') {
      showToast(strings.purchaseUnavailable, 'warning');
    } else if (result === 'failed') {
      showToast(strings.purchaseFailed, 'error');
    }
  };

  const handleRestore = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    const restored = await restorePurchases();
    if (restored) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      showToast(strings.restoreSuccess, 'success');
      handleClose();
    } else {
      showToast(strings.restoreNotFound, 'info');
    }
  };

  const openLegal = (page: LegalPage) => {
    const url = legalUrl(page, language);
    if (url) Linking.openURL(url).catch(() => {});
  };

  const features = [
    {
      icon: Zap,
      text: strings.proFeatureUnlimitedScan,
      color: '#10B981',
    },
    {
      icon: Utensils,
      text: strings.proFeatureMultiScan,
      color: '#3B82F6',
    },
    {
      icon: ChefHat,
      text: strings.proFeatureAiChef,
      color: '#F59E0B',
    },
    {
      icon: MessageCircle,
      text: strings.proFeatureAiChat,
      color: '#8B5CF6',
    },
    {
      icon: HeartPulse,
      text: strings.proFeatureHealthAlerts,
      color: '#EF4444',
    },
    {
      icon: PartyPopper,
      text: strings.proFeaturePartyMode,
      color: '#EC4899',
    },
  ];

  return (
    <>
      <CustomModal
        visible={isModalVisible}
      onClose={handleClose}
      title="CaloSnap Pro"
      cardStyle={[
        styles.customModalCard,
        {
          backgroundColor: c.card,
          borderColor: c.border,
        },
      ]}
      contentStyle={styles.customModalBody}
      headerRight={
        <TouchableOpacity
          style={styles.restoreHeaderBtn}
          onPress={handleRestore}
          disabled={isRestoring}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color={c.primary} />
          ) : (
            <Text style={[styles.restoreHeaderText, { color: c.primary }]}>
              {strings.restorePurchases}
            </Text>
          )}
        </TouchableOpacity>
      }
    >
      <View style={styles.contentWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Hero Crown Badge */}
          <View style={styles.heroSection}>
            <View
              style={[
                styles.crownGlow,
                {
                  backgroundColor: dark
                    ? 'rgba(251, 191, 36, 0.16)'
                    : 'rgba(245, 158, 11, 0.12)',
                },
              ]}
            >
              <View
                style={[
                  styles.crownBadge,
                  {
                    backgroundColor: dark
                      ? 'rgba(251, 191, 36, 0.28)'
                      : 'rgba(245, 158, 11, 0.22)',
                  },
                ]}
              >
                <Crown size={28} color="#F59E0B" />
              </View>
            </View>

            <Text style={[styles.heroTitle, { color: c.text }]}>
              {strings.proTitle}
            </Text>
            <Text style={[styles.heroSubtitle, { color: c.textMuted }]}>
              {strings.proSubtitle}
            </Text>
          </View>

          {/* Features List */}
          <View
            style={[
              styles.featuresCard,
              {
                backgroundColor: dark ? 'rgba(255, 255, 255, 0.04)' : c.cardHover,
                borderColor: c.border,
              },
            ]}
          >
            {features.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <View
                  key={idx}
                  style={[
                    styles.featureItem,
                    idx < features.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: c.border,
                      paddingBottom: 10,
                      marginBottom: 10,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.featureIconWrap,
                      { backgroundColor: `${item.color}1E` },
                    ]}
                  >
                    <IconComp size={16} color={item.color} />
                  </View>
                  <Text style={[styles.featureText, { color: c.text }]}>
                    {item.text}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Plans Section */}
          <View style={styles.plansSection}>
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const title = strings[plan.titleKey] || plan.id;
              const store = storeInfo(plan);
              const price = store?.price || strings[plan.priceKey] || `$${plan.priceAmount}`;
              // The fallback per-month copy is USD-only, so hide it once real store prices are known.
              const sub = plan.subKey && !store ? strings[plan.subKey] : null;
              const discount = plan.discountKey ? strings[plan.discountKey] : null;
              const localPrice = approxLocalPrice(plan);

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    {
                      borderColor: isSelected
                        ? '#10B981'
                        : dark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : c.border,
                      backgroundColor: isSelected
                        ? dark
                          ? 'rgba(16, 185, 129, 0.12)'
                          : '#ECFDF5'
                        : dark
                        ? 'rgba(255, 255, 255, 0.03)'
                        : c.card,
                    },
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                  activeOpacity={0.8}
                >
                  {/* Popular Discount Badge */}
                  {discount && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>{discount}</Text>
                    </View>
                  )}

                  <View style={styles.planCardLeft}>
                    <View
                      style={[
                        styles.checkCircle,
                        isSelected
                          ? styles.checkCircleActive
                          : [
                              styles.checkCircleInactive,
                              { borderColor: dark ? 'rgba(255, 255, 255, 0.25)' : '#CBD5E1' },
                            ],
                      ]}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.planTitle,
                          { color: c.text },
                          isSelected && styles.planTitleActive,
                        ]}
                      >
                        {title}
                      </Text>
                      {sub && (
                        <Text style={[styles.planSub, { color: c.textMuted }]}>
                          {sub}
                        </Text>
                      )}
                      {planHasTrial(plan) && (
                        <Text style={styles.planTrialNote}>{strings.trialNote}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.planCardRight}>
                    <Text
                      style={[
                        styles.planPrice,
                        { color: c.text },
                        isSelected && { color: '#10B981' },
                      ]}
                    >
                      {price}
                    </Text>
                    {localPrice ? (
                      <Text style={[styles.planLocalPrice, { color: c.textMuted }]}>
                        {localPrice}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Guarantee Note */}
          <View style={styles.guaranteeRow}>
            <ShieldCheck size={15} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={[styles.guaranteeText, { color: c.textMuted }]}>
              {RevenueCatService.isTestStoreMode()
                ? strings.testStoreSecureNote
                : strings.cancelAnytime}
            </Text>
          </View>
          {showsApproxPrice ? (
            <Text style={[styles.approxNote, { color: c.textMuted }]}>
              {strings.approxLocalPriceNote}
            </Text>
          ) : null}
          <Text style={[styles.approxNote, { color: c.textMuted }]}>
            {Platform.OS === 'ios' ? strings.autoRenewNoteIos : strings.autoRenewNoteAndroid}
          </Text>
        </ScrollView>

        {/* Action Button & Legal Links */}
        <View
          style={[
            styles.footerBar,
            {
              borderTopColor: c.border,
              backgroundColor: dark ? c.card : '#FFFFFF',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.mainCtaBtn}
            onPress={handleSubscribe}
            disabled={isSubscribing}
            activeOpacity={0.85}
          >
            {isSubscribing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Sparkles size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.mainCtaText}>
                  {planHasTrial(selectedPlan)
                    ? strings.startTrialBtn
                    : strings.subscribeBtn}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Legal Links */}
          <View style={styles.legalLinksRow}>
            <TouchableOpacity
              onPress={() => openLegal('terms')}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[styles.legalLinkText, { color: c.textMuted }]}>
                {strings.termsOfUse}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.legalDivider, { color: c.textMuted }]}>•</Text>
            <TouchableOpacity
              onPress={() => openLegal('privacy')}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[styles.legalLinkText, { color: c.textMuted }]}>
                {strings.privacyPolicy}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </CustomModal>

    <TestStorePurchaseModal
      visible={isTestStoreOpen}
      onClose={() => setIsTestStoreOpen(false)}
      planId={selectedPlanId}
      onPurchaseSuccess={() => {
        setIsTestStoreOpen(false);
        handleClose();
      }}
    />
  </>
  );
};

const styles = StyleSheet.create({
  customModalCard: {
    width: Math.min(SCREEN_WIDTH - 24, 460),
    maxHeight: Math.min(SCREEN_HEIGHT * 0.88, 720),
    borderRadius: 24,
    padding: 0,
    overflow: 'hidden',
  },
  customModalBody: {
    padding: 0,
    flexShrink: 1,
  },
  contentWrapper: {
    maxHeight: Math.min(SCREEN_HEIGHT * 0.88 - 60, 660),
    flexDirection: 'column',
  },
  restoreHeaderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  restoreHeaderText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  scrollContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  crownGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  crownBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FontSize.xs,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  // Features Card
  featuresCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  featureText: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Plans Section
  plansSection: {
    gap: 10,
    marginBottom: Spacing.sm,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 2,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  planCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkCircleActive: {
    backgroundColor: '#10B981',
  },
  checkCircleInactive: {
    borderWidth: 1.5,
  },
  planTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 1,
  },
  planTitleActive: {
    fontWeight: '800',
  },
  planSub: {
    fontSize: 11,
  },
  planTrialNote: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  planCardRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  planPrice: {
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  planLocalPrice: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  approxNote: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: 12,
  },

  // Guarantee Note
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  guaranteeText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Footer / CTA Bar
  footerBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  mainCtaBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    marginBottom: 8,
    ...softShadow('md'),
  },
  mainCtaText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  legalLinkText: {
    fontSize: 10,
    fontWeight: '500',
  },
  legalDivider: {
    fontSize: 10,
  },
});
