import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Purchases, {
  LOG_LEVEL,
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';
import { useAppStore } from '../../store/useAppStore';

// Keys come from EAS env / secrets (RevenueCat Dashboard > Project Settings > API Keys):
// - Apple App Store key begins with 'appl_'
// - Google Play Store key begins with 'goog_'
// - Test Store key begins with 'test_' (Expo Go / development only)
const REVENUECAT_APPLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || '';
const REVENUECAT_GOOGLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || '';
const REVENUECAT_TEST_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY || '';

// Expo Go has no native store, so only the Test Store key is accepted there.
export const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const REVENUECAT_API_KEY = IS_EXPO_GO
  ? REVENUECAT_TEST_KEY
  : Platform.OS === 'android'
  ? REVENUECAT_GOOGLE_KEY
  : REVENUECAT_APPLE_KEY;

export const ENTITLEMENT_IDS = (process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_IDS || 'calosnap_pro')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export type PlanType = 'yearly' | 'monthly' | 'weekly';

export type StorePlanPrice = {
  price: string;
  amount: number;
  currencyCode: string;
  hasFreeTrial: boolean;
};

export class PurchaseUnavailableError extends Error {}

class RevenueCatServiceClass {
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private currentAppUserId: string | null = null;

  init(appUserId?: string): Promise<void> {
    if (this.initialized) return Promise.resolve();
    if (!this.initPromise) {
      this.initPromise = this.doInit(appUserId);
    }
    return this.initPromise;
  }

  private async doInit(appUserId?: string) {
    if (!REVENUECAT_API_KEY) {
      console.warn('[RevenueCatService] API key missing for this platform; purchases disabled.');
      return;
    }
    if (!__DEV__ && REVENUECAT_API_KEY.startsWith('test_')) {
      console.error('[RevenueCatService] Test Store key in a release build; purchases disabled.');
      return;
    }

    try {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.WARN);
      }

      Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: appUserId || undefined,
      });
      this.initialized = true;
      this.currentAppUserId = appUserId || null;

      Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
        this.syncEntitlement(info);
      });

      await this.checkSubscription();
    } catch (err: any) {
      console.warn('[RevenueCatService] init error:', err?.message);
    }
  }

  /** Ties purchases to our backend user id so subscriptions follow the account across devices. */
  async logIn(appUserId: string) {
    await this.init(appUserId);
    if (!this.initialized || this.currentAppUserId === appUserId) return;
    try {
      const { customerInfo } = await Purchases.logIn(appUserId);
      this.currentAppUserId = appUserId;
      this.syncEntitlement(customerInfo);
    } catch (e: any) {
      console.warn('[RevenueCatService] logIn error:', e?.message);
    }
  }

  async logOut() {
    if (!this.initialized || !this.currentAppUserId) return;
    try {
      await Purchases.logOut();
    } catch (e: any) {
      console.warn('[RevenueCatService] logOut error:', e?.message);
    }
    this.currentAppUserId = null;
  }

  private hasEntitlement(info: CustomerInfo): boolean {
    return ENTITLEMENT_IDS.some((id) => info.entitlements.active[id] !== undefined);
  }

  syncEntitlement(info: CustomerInfo): boolean {
    const isPro = this.hasEntitlement(info);
    useAppStore.getState().setIsPremium(isPro, 'store');
    return isPro;
  }

  async checkSubscription(): Promise<boolean> {
    if (!this.initialized) return useAppStore.getState().user.isPremium || false;
    try {
      const info = await Purchases.getCustomerInfo();
      return this.syncEntitlement(info);
    } catch {
      return useAppStore.getState().user.isPremium || false;
    }
  }

  async getOfferings() {
    if (!this.initialized) await this.init();
    if (!this.initialized) return null;
    try {
      return await Purchases.getOfferings();
    } catch (e: any) {
      console.warn('[RevenueCatService] getOfferings error:', e?.message);
      return null;
    }
  }

  /** Localized store prices per plan; empty when the store is unavailable. */
  async getPlanPrices(): Promise<Partial<Record<PlanType, StorePlanPrice>>> {
    const offerings = await this.getOfferings();
    const pkgs = offerings?.current?.availablePackages || [];
    const result: Partial<Record<PlanType, StorePlanPrice>> = {};
    (['yearly', 'monthly', 'weekly'] as PlanType[]).forEach((type) => {
      const pkg = this.findPackage(pkgs, type);
      if (pkg) {
        result[type] = {
          price: pkg.product.priceString,
          amount: pkg.product.price,
          currencyCode: pkg.product.currencyCode,
          hasFreeTrial: pkg.product.introPrice?.price === 0,
        };
      }
    });
    return result;
  }

  /** In-app mock checkout (no store sheet). Only inside Expo Go in development; dev builds use the real sandbox. */
  isTestStoreMode(): boolean {
    return __DEV__ && IS_EXPO_GO;
  }

  async completeTestPurchase(): Promise<boolean> {
    if (!this.isTestStoreMode()) {
      throw new PurchaseUnavailableError('Test purchases are disabled in release builds');
    }
    useAppStore.getState().setIsPremium(true, 'store');
    return true;
  }

  private findPackage(pkgs: PurchasesPackage[], planType: PlanType): PurchasesPackage | undefined {
    const byType = { yearly: 'ANNUAL', monthly: 'MONTHLY', weekly: 'WEEKLY' }[planType];
    const keywords = { yearly: ['year', 'annual'], monthly: ['month'], weekly: ['week'] }[planType];
    return (
      pkgs.find((p) => p.packageType === byType) ||
      pkgs.find((p) => keywords.some((k) => p.identifier.toLowerCase().includes(k)))
    );
  }

  /**
   * Returns true only when the store purchase succeeded AND the entitlement is active.
   * Throws PurchaseUnavailableError when products can't be loaded — never grants premium without a purchase.
   */
  async purchasePlan(planType: PlanType, skipNativePrompt = false): Promise<boolean> {
    if (skipNativePrompt) {
      return this.completeTestPurchase();
    }

    const offerings = await this.getOfferings();
    const pkgs = offerings?.current?.availablePackages || [];
    const pkg = this.findPackage(pkgs, planType);
    if (!pkg) {
      throw new PurchaseUnavailableError(`No store package for plan "${planType}"`);
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return this.syncEntitlement(customerInfo);
    } catch (e: any) {
      if (e?.userCancelled) return false;
      throw e;
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (!this.initialized) await this.init();
    if (!this.initialized) throw new PurchaseUnavailableError('Purchases are not configured');
    const info = await Purchases.restorePurchases();
    return this.syncEntitlement(info);
  }
}

export const RevenueCatService = new RevenueCatServiceClass();
