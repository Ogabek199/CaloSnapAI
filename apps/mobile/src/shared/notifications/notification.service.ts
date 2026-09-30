import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { type Language, type StringKey, translations } from '../i18n/translations';

/**
 * Android Expo Go (SDK 53+) throws when expo-notifications is loaded.
 * Never require() the package there — it can break route modules mid-eval.
 */
function isAndroidExpoGo(): boolean {
  if (Platform.OS !== 'android') return false;
  // Standalone / dev-client builds report appOwnership === null, so null must NOT be treated as Expo Go.
  const env = (Constants as { executionEnvironment?: string }).executionEnvironment;
  return env === 'storeClient' || Constants.appOwnership === 'expo';
}

type NotificationsModule = {
  setNotificationHandler: (handler: unknown) => void;
  setNotificationChannelAsync: (id: string, opts: unknown) => Promise<unknown>;
  getPermissionsAsync: () => Promise<unknown>;
  requestPermissionsAsync: (opts?: unknown) => Promise<unknown>;
  cancelAllScheduledNotificationsAsync: () => Promise<unknown>;
  scheduleNotificationAsync: (opts: unknown) => Promise<unknown>;
  AndroidImportance: { MAX: unknown };
  AndroidNotificationVisibility: { PUBLIC: unknown };
  AndroidNotificationPriority: { MAX: unknown };
  SchedulableTriggerInputTypes: { DAILY: unknown; TIME_INTERVAL: unknown };
};

let notifications: NotificationsModule | null | undefined;
let handlerReady = false;

// Schedule/cancel both start with cancelAll, so overlapping calls must run in order.
let opChain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = opChain.then(fn, fn);
  opChain = run.catch(() => {});
  return run;
}

function getNotifications(): NotificationsModule | null {
  if (isAndroidExpoGo()) return null;
  if (notifications !== undefined) return notifications;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notifications = require('expo-notifications') as NotificationsModule;
    return notifications;
  } catch (e) {
    console.warn('[NotificationService] expo-notifications unavailable:', e);
    notifications = null;
    return null;
  }
}

function ensureHandler() {
  if (handlerReady || isAndroidExpoGo()) return;
  const N = getNotifications();
  if (!N) return;
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerReady = true;
  } catch (e) {
    console.warn('[NotificationService] setNotificationHandler skipped:', e);
  }
}

export interface MealReminderConfig {
  id: string;
  hour: number;
  minute: number;
  type: 'breakfast' | 'lunch' | 'dinner';
  titleKey: StringKey;
  bodyKey: StringKey;
}

export const MEAL_REMINDERS: MealReminderConfig[] = [
  {
    id: 'taom-ai-breakfast-reminder',
    hour: 8,
    minute: 30,
    type: 'breakfast',
    titleKey: 'notifBreakfastTitle',
    bodyKey: 'notifBreakfastBody',
  },
  {
    id: 'taom-ai-lunch-reminder',
    hour: 13,
    minute: 0,
    type: 'lunch',
    titleKey: 'notifLunchTitle',
    bodyKey: 'notifLunchBody',
  },
  {
    id: 'taom-ai-dinner-reminder',
    hour: 19,
    minute: 30,
    type: 'dinner',
    titleKey: 'notifDinnerTitle',
    bodyKey: 'notifDinnerBody',
  },
];

const stringsFor = (lang: Language) => translations[lang] ?? translations.en;

export const NotificationService = {
  isSupported(): boolean {
    return !isAndroidExpoGo() && getNotifications() != null;
  },

  async requestPermissions(lang: Language = 'en'): Promise<boolean> {
    if (isAndroidExpoGo()) return false;
    ensureHandler();
    const N = getNotifications();
    if (!N) {
      console.warn('[NotificationService] Skipped — notifications unavailable in this build.');
      return false;
    }

    try {
      if (Platform.OS === 'android') {
        await N.setNotificationChannelAsync('taom-meal-reminders', {
          name: stringsFor(lang).notifChannelName,
          description: stringsFor(lang).notifChannelDesc,
          importance: N.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
        });
      }

      const settings = await N.getPermissionsAsync();
      let granted = (settings as any).granted || (settings as any).status === 'granted';

      if (!granted) {
        const req = await N.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        granted = (req as any).granted || (req as any).status === 'granted';
      }

      if (!granted) {
        console.warn('[NotificationService] Notification permission was not granted by user');
        return false;
      }

      return true;
    } catch (error) {
      console.warn('[NotificationService] Permission request warning:', error);
      return false;
    }
  },

  async scheduleMealReminders(lang: Language = 'en'): Promise<boolean> {
    if (isAndroidExpoGo()) return false;
    ensureHandler();
    const N = getNotifications();
    if (!N) return false;

    return serialize(async () => {
      try {
        const hasPermission = await this.requestPermissions(lang);
        if (!hasPermission) return false;

        const t = stringsFor(lang);
        await N.cancelAllScheduledNotificationsAsync().catch(() => {});

        for (const meal of MEAL_REMINDERS) {
          await N.scheduleNotificationAsync({
            identifier: meal.id,
            content: {
              title: t[meal.titleKey],
              body: t[meal.bodyKey],
              data: { mealType: meal.type },
              sound: 'default',
              priority: N.AndroidNotificationPriority.MAX,
            },
            trigger: {
              type: N.SchedulableTriggerInputTypes.DAILY,
              hour: meal.hour,
              minute: meal.minute,
              channelId: 'taom-meal-reminders',
            } as any,
          });
        }

        if (__DEV__) console.log('[NotificationService] Scheduled daily meal reminders:', lang);
        return true;
      } catch (error) {
        console.warn('[NotificationService] Scheduling warning:', error);
        return false;
      }
    });
  },

  async cancelMealReminders(): Promise<void> {
    if (isAndroidExpoGo()) return;
    const N = getNotifications();
    if (!N) return;

    return serialize(async () => {
      try {
        await N.cancelAllScheduledNotificationsAsync().catch(() => {});
        if (__DEV__) console.log('[NotificationService] All meal reminders cancelled');
      } catch (error) {
        console.warn('[NotificationService] Cancel warning:', error);
      }
    });
  },

  async triggerInstantTestNotification(lang: Language = 'en'): Promise<boolean> {
    if (isAndroidExpoGo()) return false;
    ensureHandler();
    const N = getNotifications();
    if (!N) return false;

    try {
      const hasPermission = await this.requestPermissions(lang);
      if (!hasPermission) return false;

      const t = stringsFor(lang);
      await N.scheduleNotificationAsync({
        content: {
          title: t.notifTestTitle,
          body: t.notifTestBody,
          sound: 'default',
          priority: N.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          channelId: 'taom-meal-reminders',
        } as any,
      });

      if (__DEV__) console.log('[NotificationService] Test notification scheduled');
      return true;
    } catch (error) {
      console.warn('[NotificationService] Test notification error:', error);
      return false;
    }
  },
};
