import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Language } from '../i18n/translations';

// Set notification handler so notifications display as foreground banners + sound
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface MealReminderConfig {
  id: string;
  hour: number;
  minute: number;
  type: 'breakfast' | 'lunch' | 'dinner';
  title: Record<Language, string>;
  body: Record<Language, string>;
}

export const MEAL_REMINDERS: MealReminderConfig[] = [
  {
    id: 'taom-ai-breakfast-reminder',
    hour: 8,
    minute: 30,
    type: 'breakfast',
    title: {
      uz: '🍳 Nonushta vaqti bo‘ldi!',
      ru: '🍳 Время завтрака!',
      en: '🍳 Time for Breakfast!',
    },
    body: {
      uz: 'Kuningizni to‘g‘ri kaloriya bilan boshlang. Yegan nonushtangizni skanerlashni unutmang!',
      ru: 'Начните день с правильных калорий. Не забудьте отсканировать ваш завтрак!',
      en: "Start your day with the right fuel. Don't forget to scan your breakfast!",
    },
  },
  {
    id: 'taom-ai-lunch-reminder',
    hour: 13,
    minute: 0,
    type: 'lunch',
    title: {
      uz: '🍲 Mazali tushlik vaqti!',
      ru: '🍲 Время вкусного обеда!',
      en: '🍲 Delicious Lunch Time!',
    },
    body: {
      uz: 'Bugungi kaloriya me‘yoringiz qanday ketmoqda? Tushlikni Taom AI orqali skaner qiling.',
      ru: 'Как ваш баланс калорий на сегодня? Отсканируйте обед через Taom AI.',
      en: 'How is your calorie target going today? Scan your lunch with Taom AI.',
    },
  },
  {
    id: 'taom-ai-dinner-reminder',
    hour: 19,
    minute: 30,
    type: 'dinner',
    title: {
      uz: '🥗 Kechki ovqatni yedingizmi?',
      ru: '🥗 Поужинали?',
      en: '🥗 Had your Dinner?',
    },
    body: {
      uz: 'Kunlik balansingizni to‘ldirish uchun kechki ovqatni skanerlab, kundalikka qo‘shing.',
      ru: 'Чтобы завершить дневной баланс, отсканируйте ужин и добавьте в дневник.',
      en: 'Complete your daily nutrition balance by scanning and logging your dinner.',
    },
  },
];

export const NotificationService = {
  /**
   * Request notification permissions & set Android Channel with MAX importance
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // 1. Create Android Notification Channel first (essential for Android 8+)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('taom-meal-reminders', {
          name: 'Taom AI Ovqatlanish Eslatmalari',
          description: 'Nonushta, tushlik va kechki ovqat uchun kunlik eslatmalar',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
        });
      }

      // 2. Check and request permissions
      const settings = await Notifications.getPermissionsAsync();
      let granted = (settings as any).granted || (settings as any).status === 'granted';

      if (!granted) {
        const req = await Notifications.requestPermissionsAsync({
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

  /**
   * Schedule all 3 daily offline meal reminders at exact local hours (08:30, 13:00, 19:30)
   */
  async scheduleMealReminders(lang: Language = 'uz'): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      // Cancel old scheduled notifications first
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});

      for (const meal of MEAL_REMINDERS) {
        await Notifications.scheduleNotificationAsync({
          identifier: meal.id,
          content: {
            title: meal.title[lang] || meal.title.uz,
            body: meal.body[lang] || meal.body.uz,
            data: { mealType: meal.type },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: meal.hour,
            minute: meal.minute,
            channelId: 'taom-meal-reminders',
          } as any,
        });
      }

      console.log('[NotificationService] Successfully scheduled 3 daily meal reminders in language:', lang);
      return true;
    } catch (error) {
      console.warn('[NotificationService] Scheduling warning:', error);
      return false;
    }
  },

  /**
   * Cancel all meal reminders
   */
  async cancelMealReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      console.log('[NotificationService] All meal reminders cancelled');
    } catch (error) {
      console.warn('[NotificationService] Cancel warning:', error);
    }
  },

  /**
   * Test immediate notification (triggers in 1 second with banner and sound)
   */
  async triggerInstantTestNotification(lang: Language = 'uz'): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const titles: Record<Language, string> = {
        uz: 'Taom AI Eslatmasi faol! 🔔',
        ru: 'Напоминания Taom AI активны! 🔔',
        en: 'Taom AI Reminders Active! 🔔',
      };
      const bodies: Record<Language, string> = {
        uz: 'Har kuni 08:30 (Nonushta), 13:00 (Tushlik) va 19:30 (Kechki ovqat)da eslatmalar boradi.',
        ru: 'Ежедневно в 08:30 (Завтрак), 13:00 (Обед) и 19:30 (Ужин) будут приходить напоминания.',
        en: 'You will receive reminders daily at 08:30 (Breakfast), 13:00 (Lunch), and 19:30 (Dinner).',
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: titles[lang] || titles.uz,
          body: bodies[lang] || bodies.uz,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          seconds: 1,
          channelId: 'taom-meal-reminders',
        } as any,
      });

      console.log('[NotificationService] Test notification scheduled successfully');
      return true;
    } catch (error) {
      console.warn('[NotificationService] Test notification error:', error);
      return false;
    }
  },
};
