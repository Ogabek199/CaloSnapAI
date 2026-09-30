import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../shared/storage/safe-storage';
import {
  PlanType,
  PurchaseUnavailableError,
  RevenueCatService,
} from '../shared/services/revenuecat.service';

export interface SubscriptionPlan {
  id: 'taom_pro_yearly' | 'taom_pro_monthly' | 'taom_pro_weekly';
  titleKey: 'planYearlyTitle' | 'planMonthlyTitle' | 'planWeeklyTitle';
  priceKey: 'planYearlyPrice' | 'planMonthlyPrice' | 'planWeeklyPrice';
  subKey?: 'planYearlySub';
  discountKey?: 'planYearlyDiscount';
  priceAmount: number;
  period: 'year' | 'month' | 'week';
  monthlyEquivalent?: string;
  hasTrial?: boolean;
  isPopular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'taom_pro_yearly',
    titleKey: 'planYearlyTitle',
    priceKey: 'planYearlyPrice',
    subKey: 'planYearlySub',
    discountKey: 'planYearlyDiscount',
    priceAmount: 39.99,
    period: 'year',
    monthlyEquivalent: '$3.33',
    isPopular: true,
  },
  {
    id: 'taom_pro_monthly',
    titleKey: 'planMonthlyTitle',
    priceKey: 'planMonthlyPrice',
    priceAmount: 9.99,
    period: 'month',
    monthlyEquivalent: '$9.99',
  },
  {
    id: 'taom_pro_weekly',
    titleKey: 'planWeeklyTitle',
    priceKey: 'planWeeklyPrice',
    priceAmount: 3.49,
    period: 'week',
    hasTrial: true,
  },
];

export type PurchaseResult = 'success' | 'cancelled' | 'unavailable' | 'failed';

type PlanId = SubscriptionPlan['id'];

interface SubscriptionState {
  selectedPlanId: PlanId;
  isPaywallOpen: boolean;
  isSubscribing: boolean;
  isRestoring: boolean;
  /** Set after a successful purchase; drives the full-screen celebration. */
  celebratePlanId: PlanId | null;

  dismissCelebration: () => void;
  setSelectedPlanId: (id: PlanId) => void;
  openPaywall: () => void;
  closePaywall: () => void;
  subscribe: (planId?: PlanId, options?: { skipNativePrompt?: boolean }) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<boolean>;
}

const PLAN_TYPE: Record<PlanId, PlanType> = {
  taom_pro_yearly: 'yearly',
  taom_pro_monthly: 'monthly',
  taom_pro_weekly: 'weekly',
};

/** Lets the backend pick up the new entitlement immediately instead of waiting for the webhook. */
async function syncPremiumWithBackend() {
  try {
    const { ApiClient } = require('../shared/api/api-client');
    const { useAppStore } = require('./useAppStore');
    const res = await ApiClient.syncSubscription();
    useAppStore.getState().setIsPremium(!!res?.isPremium, 'server');
  } catch (e: any) {
    if (__DEV__) console.warn('[useSubscriptionStore] backend sync failed:', e?.message);
  }
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      selectedPlanId: 'taom_pro_yearly',
      isPaywallOpen: false,
      isSubscribing: false,
      isRestoring: false,
      celebratePlanId: null,

      dismissCelebration: () => set({ celebratePlanId: null }),
      setSelectedPlanId: (id) => set({ selectedPlanId: id }),
      openPaywall: () => set({ isPaywallOpen: true }),
      closePaywall: () => set({ isPaywallOpen: false }),

      subscribe: async (planId, options) => {
        const targetId = planId || get().selectedPlanId;
        set({ isSubscribing: true });
        try {
          const active = await RevenueCatService.purchasePlan(
            PLAN_TYPE[targetId],
            options?.skipNativePrompt,
          );
          if (!active) return 'cancelled';
          set({ isPaywallOpen: false, celebratePlanId: targetId });
          void syncPremiumWithBackend();
          return 'success';
        } catch (e: any) {
          if (__DEV__) console.warn('[useSubscriptionStore] subscribe error:', e?.message);
          return e instanceof PurchaseUnavailableError ? 'unavailable' : 'failed';
        } finally {
          set({ isSubscribing: false });
        }
      },

      restorePurchases: async () => {
        set({ isRestoring: true });
        try {
          const active = await RevenueCatService.restorePurchases();
          if (active) void syncPremiumWithBackend();
          return active;
        } catch {
          return false;
        } finally {
          set({ isRestoring: false });
        }
      },
    }),
    {
      name: 'taom-subscription-storage',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        selectedPlanId: state.selectedPlanId,
      }),
    },
  ),
);
