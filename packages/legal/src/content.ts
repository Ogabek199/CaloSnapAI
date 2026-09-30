import { de } from './i18n/de';
import { es } from './i18n/es';
import { fr } from './i18n/fr';
import { kk } from './i18n/kk';
import { ko } from './i18n/ko';
import { tr } from './i18n/tr';
import { type Doc, type LegalDocSet, type LegalLang, type LegalPage, tgLink } from './shared';

export const LEGAL_UPDATED_AT = '2026-09-29';

type BaseLang = 'uz' | 'ru' | 'en';

const BASE_DOCS: Record<LegalPage, Record<BaseLang, Doc>> = {
  privacy: {
    uz: {
      title: 'Maxfiylik siyosati',
      intro:
        'CaloSnap ("ilova") ovqatlanishni kuzatish uchun mo‘ljallangan. Ushbu siyosat qaysi ma’lumotlarni yig‘ishimiz, ulardan qanday foydalanishimiz va ularni qanday o‘chirishingiz mumkinligini tushuntiradi.',
      sections: [
        {
          h: 'Qanday ma’lumotlarni yig‘amiz',
          p: [
            'Akkaunt: ism, telefon raqami va parol (parol faqat shifrlangan xesh ko‘rinishida saqlanadi).',
            'Profil: yosh, jins, bo‘y, vazn, faollik darajasi, maqsad va kunlik kaloriya me’yori.',
            'Kundalik: siz qo‘shgan taomlar, porsiyalar, suv va vazn yozuvlari.',
            'Rasmlar: tahlil uchun yuborgan taom va qadoq yorlig‘i rasmlari hamda ixtiyoriy profil rasmi.',
            'Sog‘liq holati (ixtiyoriy): profilda o‘zingiz belgilagan holatlar (masalan, diabet, gipertoniya). Ular faqat ovqat bo‘yicha ogohlantirish va tavsiyalarni moslashtirish uchun ishlatiladi.',
            'AI Dietolog va AI Oshpaz: yuborgan xabarlaringiz, masalliqlar ro‘yxati yoki muzlatkich rasmi javob tayyorlash uchun serverga yuboriladi va u yerda saqlanmaydi. Chat tarixi faqat qurilmangizda saqlanadi va chiqishda o‘chiriladi.',
            'Obuna holati: xarid do‘kon (App Store / Google Play) tomonidan amalga oshiriladi; biz karta ma’lumotlarini ko‘rmaymiz va saqlamaymiz.',
          ],
        },
        {
          h: 'Ma’lumotlardan qanday foydalanamiz',
          p: [
            'Kaloriya va makronutrientlarni hisoblash, kundalikni yuritish va shaxsiy maqsadlarni belgilash uchun.',
            'Rasmlar sun’iy intellekt yordamida taomni aniqlash uchun Google Gemini xizmatiga yuboriladi.',
            'AI Dietolog, AI Oshpaz va sog‘liq ogohlantirishlari uchun xabarlar, masalliqlar, taom tarkibi hamda javobni moslashtirish uchun zarur profil ma’lumotlari (maqsad, kunlik me’yor, sog‘liq holati) Google Gemini xizmatiga yuboriladi. Ism va telefon raqami yuborilmaydi.',
            'Biz reklama ko‘rsatmaymiz, ma’lumotlaringizni sotmaymiz va sizni boshqa ilovalar bo‘ylab kuzatmaymiz.',
          ],
        },
        {
          h: 'Uchinchi tomon xizmatlari',
          p: [
            'Google Gemini — rasm tahlili va AI yordamchilar. Cloudinary — rasmlarni saqlash. RevenueCat — obuna holatini tekshirish. Railway — server va ma’lumotlar bazasi. Open Food Facts — shtrix-kod bo‘yicha mahsulot qidirish (faqat shtrix-kod yuboriladi).',
            'Siz bazaga qo‘shgan qadoqlangan mahsulot (nomi va ozuqaviy qiymati) boshqa foydalanuvchilarga ham ko‘rinadi; unda shaxsiy ma’lumot saqlanmaydi.',
          ],
        },
        {
          h: 'Saqlash muddati va o‘chirish',
          p: [
            'Ma’lumotlar akkauntingiz faol bo‘lguncha saqlanadi.',
            'Profil → "Akkauntni o‘chirish" orqali akkaunt va unga tegishli barcha ma’lumotlar (profil, kundalik, yozuvlar, rasmlar) darhol va butunlay o‘chiriladi.',
          ],
        },
        {
          h: 'Bolalar',
          p: ['Ilova 13 yoshgacha bo‘lgan bolalar uchun mo‘ljallanmagan.'],
        },
        {
          h: 'Bog‘lanish',
          p: [`Savollar bo‘yicha ${tgLink('Telegram orqali yozing')}.`],
        },
      ],
    },
    ru: {
      title: 'Политика конфиденциальности',
      intro:
        'CaloSnap («приложение») предназначено для учёта питания. Эта политика объясняет, какие данные мы собираем, как их используем и как вы можете их удалить.',
      sections: [
        {
          h: 'Какие данные мы собираем',
          p: [
            'Аккаунт: имя, номер телефона и пароль (хранится только в виде хеша).',
            'Профиль: возраст, пол, рост, вес, уровень активности, цель и дневная норма калорий.',
            'Дневник: добавленные блюда, порции, записи воды и веса.',
            'Фотографии: снимки блюд и этикеток, отправленные на анализ, и необязательное фото профиля.',
            'Состояние здоровья (по желанию): отмеченные вами в профиле состояния (например, диабет, гипертония). Используются только для предупреждений и рекомендаций по питанию.',
            'AI Диетолог и AI Шеф: ваши сообщения, список продуктов или фото холодильника отправляются на сервер для ответа и там не сохраняются. История чата хранится только на устройстве и удаляется при выходе.',
            'Статус подписки: покупку проводит магазин (App Store / Google Play); мы не видим и не храним данные карты.',
          ],
        },
        {
          h: 'Как мы используем данные',
          p: [
            'Для расчёта калорий и БЖУ, ведения дневника и персональных целей.',
            'Фотографии отправляются в Google Gemini для распознавания блюд.',
            'Для AI Диетолога, AI Шефа и предупреждений о здоровье в Google Gemini передаются сообщения, продукты, состав блюд и необходимые данные профиля (цель, дневная норма, состояние здоровья). Имя и телефон не передаются.',
            'Мы не показываем рекламу, не продаём данные и не отслеживаем вас в других приложениях.',
          ],
        },
        {
          h: 'Сторонние сервисы',
          p: [
            'Google Gemini — анализ фото и AI-помощники. Cloudinary — хранение фото. RevenueCat — проверка подписки. Railway — сервер и база данных. Open Food Facts — поиск по штрих-коду (передаётся только штрих-код).',
            'Добавленный вами упакованный продукт (название и пищевая ценность) виден другим пользователям; личных данных в нём нет.',
          ],
        },
        {
          h: 'Хранение и удаление',
          p: [
            'Данные хранятся, пока аккаунт активен.',
            'Профиль → «Удалить аккаунт» сразу и безвозвратно удаляет аккаунт и все связанные данные (профиль, дневник, записи, фото).',
          ],
        },
        { h: 'Дети', p: ['Приложение не предназначено для детей младше 13 лет.'] },
        { h: 'Контакты', p: [`${tgLink('Написать в Telegram')}.`] },
      ],
    },
    en: {
      title: 'Privacy Policy',
      intro:
        'CaloSnap (“the app”) helps you track what you eat. This policy explains what data we collect, how we use it and how you can delete it.',
      sections: [
        {
          h: 'Data we collect',
          p: [
            'Account: name, phone number and password (stored only as a salted hash).',
            'Profile: age, sex, height, weight, activity level, goal and daily calorie target.',
            'Diary: foods and portions you log, water and weight entries.',
            'Photos: meal and nutrition-label photos you submit for analysis, and an optional profile picture.',
            'Health conditions (optional): conditions you select in your profile (e.g. diabetes, hypertension). They are used only to tailor food alerts and suggestions.',
            'AI Nutritionist and AI Chef: your messages, ingredient lists or fridge photos are sent to our server to generate a reply and are not stored there. Chat history is kept only on your device and is cleared when you log out.',
            'Subscription status: purchases are processed by the App Store / Google Play; we never see or store card details.',
          ],
        },
        {
          h: 'How we use data',
          p: [
            'To calculate calories and macros, keep your diary and set personal goals.',
            'Photos are sent to Google Gemini to recognise foods.',
            'For the AI Nutritionist, AI Chef and health alerts, your messages, ingredients, meal contents and the profile data needed to personalise the reply (goal, daily target, health conditions) are sent to Google Gemini. Your name and phone number are not sent.',
            'We show no ads, never sell your data and do not track you across other apps.',
          ],
        },
        {
          h: 'Third-party services',
          p: [
            'Google Gemini (photo analysis and AI assistants), Cloudinary (image storage), RevenueCat (subscription status), Railway (server and database), Open Food Facts (barcode lookup; only the barcode is sent).',
            'Packaged products you add (name and nutrition facts) become visible to other users; they contain no personal data.',
          ],
        },
        {
          h: 'Retention and deletion',
          p: [
            'Data is kept while your account is active.',
            'Profile → “Delete account” immediately and permanently deletes your account and all related data (profile, diary, logs, photos).',
          ],
        },
        { h: 'Children', p: ['The app is not directed at children under 13.'] },
        { h: 'Contact', p: [`${tgLink('Message us on Telegram')}.`] },
      ],
    },
  },
  terms: {
    uz: {
      title: 'Foydalanish shartlari',
      intro: 'CaloSnap’dan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz.',
      sections: [
        {
          h: 'Tibbiy maslahat emas',
          p: [
            'Ilova ma’lumot berish uchun mo‘ljallangan va shifokor yoki dietolog maslahati o‘rnini bosmaydi.',
            'Sun’iy intellekt baholagan kaloriya va ozuqaviy qiymatlar taxminiy bo‘lib, xato bo‘lishi mumkin. Sog‘lig‘ingiz bo‘yicha qarorlarni mutaxassis bilan maslahatlashib qabul qiling.',
            'AI Dietolog, AI Oshpaz va sog‘liq ogohlantirishlari umumiy tavsiya beradi: tashxis qo‘ymaydi, dori yoki insulin dozasini belgilamaydi. Diabet va boshqa kasalliklarda shifokoringiz ko‘rsatmalariga amal qiling.',
          ],
        },
        {
          h: 'CaloSnap Pro obunasi',
          p: [
            'Obuna haftalik, oylik yoki yillik bo‘lishi mumkin; narx xariddan oldin ko‘rsatiladi va to‘lov App Store yoki Google Play akkauntingizdan yechiladi.',
            'Obuna joriy davr tugashidan kamida 24 soat oldin bekor qilinmasa, avtomatik yangilanadi.',
            'Obunani qurilmangizdagi App Store yoki Google Play akkaunt sozlamalarida boshqarish va bekor qilish mumkin. Akkauntni o‘chirish obunani bekor qilmaydi.',
            'Bepul sinov muddati bo‘lsa, uning ishlatilmagan qismi obuna sotib olinganda bekor bo‘ladi.',
          ],
        },
        {
          h: 'Foydalanuvchi kontenti',
          p: [
            'Siz qo‘shgan mahsulot ma’lumotlari to‘g‘ri bo‘lishi kerak. Noto‘g‘ri yoki suiiste’mol qiluvchi ma’lumotlarni o‘chirish huquqini saqlab qolamiz.',
          ],
        },
        {
          h: 'Javobgarlik',
          p: [
            'Ilova "boricha" taqdim etiladi. Qonun ruxsat bergan darajada, ilovadan foydalanish natijasidagi bilvosita zararlar uchun javobgar emasmiz.',
          ],
        },
        { h: 'Bog‘lanish', p: [`${tgLink('Telegram orqali yozing')}.`] },
      ],
    },
    ru: {
      title: 'Условия использования',
      intro: 'Используя CaloSnap, вы соглашаетесь с этими условиями.',
      sections: [
        {
          h: 'Не медицинская консультация',
          p: [
            'Приложение носит информационный характер и не заменяет консультацию врача или диетолога.',
            'Оценки калорий и пищевой ценности, сделанные ИИ, приблизительны и могут быть неточными.',
            'AI Диетолог, AI Шеф и предупреждения о здоровье дают общие рекомендации: не ставят диагноз и не назначают лекарства или дозы инсулина. При диабете и других заболеваниях следуйте указаниям врача.',
          ],
        },
        {
          h: 'Подписка CaloSnap Pro',
          p: [
            'Подписка бывает недельной, месячной или годовой; цена показывается до покупки, оплата списывается с аккаунта App Store или Google Play.',
            'Подписка продлевается автоматически, если её не отменить минимум за 24 часа до конца текущего периода.',
            'Управлять подпиской и отменить её можно в настройках аккаунта App Store или Google Play. Удаление аккаунта не отменяет подписку.',
            'Неиспользованная часть бесплатного пробного периода сгорает при покупке подписки.',
          ],
        },
        {
          h: 'Пользовательский контент',
          p: ['Добавляемые данные о продуктах должны быть достоверными. Мы можем удалять неверные или злонамеренные данные.'],
        },
        {
          h: 'Ответственность',
          p: ['Приложение предоставляется «как есть». В пределах, допустимых законом, мы не отвечаем за косвенные убытки.'],
        },
        { h: 'Контакты', p: [`${tgLink('Написать в Telegram')}.`] },
      ],
    },
    en: {
      title: 'Terms of Use',
      intro: 'By using CaloSnap you agree to these terms.',
      sections: [
        {
          h: 'Not medical advice',
          p: [
            'The app is for information only and does not replace advice from a doctor or dietitian.',
            'AI-estimated calories and nutrition values are approximate and may be wrong.',
            'The AI Nutritionist, AI Chef and health alerts give general guidance only: they do not diagnose or prescribe medication or insulin doses. If you have diabetes or another condition, follow your doctor’s instructions.',
          ],
        },
        {
          h: 'CaloSnap Pro subscription',
          p: [
            'Subscriptions are weekly, monthly or yearly; the price is shown before purchase and charged to your App Store or Google Play account.',
            'A subscription renews automatically unless cancelled at least 24 hours before the end of the current period.',
            'Manage or cancel it in your App Store or Google Play account settings. Deleting your CaloSnap account does not cancel the subscription.',
            'Any unused part of a free trial is forfeited when you purchase a subscription.',
          ],
        },
        {
          h: 'User content',
          p: ['Product data you add must be accurate. We may remove incorrect or abusive entries.'],
        },
        {
          h: 'Liability',
          p: ['The app is provided “as is”. To the extent permitted by law we are not liable for indirect damages.'],
        },
        { h: 'Contact', p: [`${tgLink('Message us on Telegram')}.`] },
      ],
    },
  },
  'delete-account': {
    uz: {
      title: 'Akkauntni o‘chirish',
      intro: 'CaloSnap akkauntingizni va unga tegishli barcha ma’lumotlarni istalgan vaqtda o‘chirishingiz mumkin.',
      sections: [
        {
          h: 'Ilova orqali (tavsiya etiladi)',
          p: ['CaloSnap’ni oching → Profil → "Akkauntni o‘chirish" → parolingizni kiriting va tasdiqlang. O‘chirish darhol amalga oshadi.'],
        },
        {
          h: 'Ilovaga kira olmasangiz',
          p: [`${tgLink('Telegram orqali bizga')} ro‘yxatdan o‘tgan telefon raqamingizni yozing. So‘rov 7 kun ichida bajariladi.`],
        },
        {
          h: 'Nimalar o‘chiriladi',
          p: [
            'Akkaunt, profil, kundalik yozuvlari, suv va vazn tarixi, skanerlangan rasmlar va profil rasmi butunlay o‘chiriladi.',
            'Siz bazaga qo‘shgan qadoqlangan mahsulotlar (shaxsiy ma’lumotsiz) umumiy katalogda qoladi.',
            'Obuna App Store / Google Play orqali alohida bekor qilinishi kerak.',
          ],
        },
      ],
    },
    ru: {
      title: 'Удаление аккаунта',
      intro: 'Вы можете в любой момент удалить аккаунт CaloSnap и все связанные данные.',
      sections: [
        {
          h: 'В приложении (рекомендуется)',
          p: ['Откройте CaloSnap → Профиль → «Удалить аккаунт» → введите пароль и подтвердите. Удаление происходит сразу.'],
        },
        {
          h: 'Если нет доступа к приложению',
          p: [`${tgLink('Напишите нам в Telegram')} номер телефона, с которым вы регистрировались. Запрос выполняется в течение 7 дней.`],
        },
        {
          h: 'Что удаляется',
          p: [
            'Аккаунт, профиль, дневник, история воды и веса, отсканированные фото и фото профиля удаляются безвозвратно.',
            'Добавленные вами упакованные продукты (без личных данных) остаются в общем каталоге.',
            'Подписку нужно отменить отдельно в App Store / Google Play.',
          ],
        },
      ],
    },
    en: {
      title: 'Delete your account',
      intro: 'You can delete your CaloSnap account and all related data at any time.',
      sections: [
        {
          h: 'In the app (recommended)',
          p: ['Open CaloSnap → Profile → “Delete account” → enter your password and confirm. Deletion is immediate.'],
        },
        {
          h: 'If you can’t access the app',
          p: [`${tgLink('Message us on Telegram')} with the phone number you registered with. Requests are completed within 7 days.`],
        },
        {
          h: 'What is deleted',
          p: [
            'Your account, profile, diary, water and weight history, scanned photos and profile picture are permanently deleted.',
            'Packaged products you added (no personal data) stay in the shared catalogue.',
            'Subscriptions must be cancelled separately in the App Store / Google Play.',
          ],
        },
      ],
    },
  },
};

const EXTRA_DOCS: Record<Exclude<LegalLang, BaseLang>, LegalDocSet> = { tr, kk, ko, es, de, fr };

export const LEGAL_PAGES = Object.keys(BASE_DOCS) as LegalPage[];

export function getLegalDoc(page: LegalPage, lang: LegalLang): Doc {
  return lang === 'uz' || lang === 'ru' || lang === 'en' ? BASE_DOCS[page][lang] : EXTRA_DOCS[lang][page];
}

export const LEGAL_UPDATED_LABEL: Record<LegalLang, string> = {
  uz: 'Oxirgi yangilanish',
  ru: 'Последнее обновление',
  en: 'Last updated',
  tr: 'Son güncelleme',
  kk: 'Соңғы жаңарту',
  ko: '최종 업데이트',
  es: 'Última actualización',
  de: 'Zuletzt aktualisiert',
  fr: 'Dernière mise à jour',
};

export const LEGAL_LANG_LABELS: Record<LegalLang, string> = {
  uz: 'O‘zbekcha',
  ru: 'Русский',
  en: 'English',
  tr: 'Türkçe',
  kk: 'Қазақша',
  ko: '한국어',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
};
