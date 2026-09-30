import type { Language } from './translations';

export type LanguageOption = { code: Language; label: string; flag: string; locale: string };

/** Labels are native names, so every user can find their language regardless of the current UI language. */
export const LANGUAGES: LanguageOption[] = [
  { code: 'uz', label: 'O‘zbekcha', flag: '🇺🇿', locale: 'uz-UZ' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', locale: 'ru-RU' },
  { code: 'en', label: 'English', flag: '🇬🇧', locale: 'en-US' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', locale: 'tr-TR' },
  { code: 'kk', label: 'Қазақша', flag: '🇰🇿', locale: 'kk-KZ' },
  { code: 'ko', label: '한국어', flag: '🇰🇷', locale: 'ko-KR' },
  { code: 'es', label: 'Español', flag: '🇪🇸', locale: 'es-ES' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', locale: 'de-DE' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', locale: 'fr-FR' },
];

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

export const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && BY_CODE.has(value as Language);

export const intlLocale = (lang: Language): string => BY_CODE.get(lang)?.locale ?? 'en-US';

/** First-launch default: the phone's language when supported, otherwise English. */
export function deviceLanguage(): Language {
  try {
    const code = Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2).toLowerCase();
    return isLanguage(code) ? code : 'en';
  } catch {
    return 'uz';
  }
}

type FoodNames = {
  name?: string | null;
  nameUz?: string | null;
  nameRu?: string | null;
  nameEn?: string | null;
  names?: Partial<Record<Language, string>>;
};

/**
 * Foods only carry uz/ru/en names. Kazakh falls back to Russian (widely read in Kazakhstan),
 * every other language to English.
 */
export function foodName(food: FoodNames | null | undefined, lang: Language, fallback = '—'): string {
  if (!food) return fallback;
  const explicit = food.names?.[lang];
  if (explicit) return explicit;
  const order =
    lang === 'uz'
      ? [food.nameUz, food.name, food.nameEn, food.nameRu]
      : lang === 'ru' || lang === 'kk'
        ? [food.nameRu, food.nameEn, food.name, food.nameUz]
        : [food.nameEn, food.name, food.nameUz, food.nameRu];
  return order.find((n) => typeof n === 'string' && n.trim())?.trim() || fallback;
}
